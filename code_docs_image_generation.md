# Tài liệu chi tiết: Phần Tạo Ảnh (Image Generation Pipeline)

Dưới đây là tài liệu trích xuất toàn bộ luồng tạo ảnh (từ Frontend gửi request đến Backend xử lý sinh ảnh bằng Playwright/Gemini Chat) của dự án. Quy trình này được chia thành 2 phần chính: **Frontend** (Giao diện + Hooks gọi API) và **Backend** (Controllers + Services tự động hóa).

---

## 1. Tóm tắt Luồng (Workflow)
1. **Người dùng** click vào nút "Render Scene" hoặc "Generate All Images" trên giao diện Storyboard (`PipelineStep1.tsx`).
2. **Frontend Hook** (`usePipelineWizard.ts`) nhận lệnh, thay đổi trạng thái loading, và gọi API `/api/pipeline/generate-image` hoặc `/api/pipeline/generate-batch-images`.
3. **Backend Controller** (`pipelineController.ts`) tiếp nhận yêu cầu, kiểm tra dữ liệu đầu vào.
4. **Backend Service** (`imageGeneratorService.ts`) sử dụng Playwright để điều khiển trình duyệt giả lập, truy cập các nền tảng AI (như Gemini Chat, Imagen, v.v.) thông qua cơ chế tự động hóa (automation) để gõ prompt và tải ảnh về.
5. Ảnh trả về ở dạng `base64` (hoặc URL dự phòng) sẽ được gửi lại cho Frontend để hiển thị.

---

## 2. Phần Backend (Server-side)

### 2.1. Pipeline Controller (`src/server/controllers/pipelineController.ts`)
Đây là nơi định nghĩa các API routes mà Frontend sẽ gọi tới. Các API chính bao gồm sinh ảnh đơn (`/generate-image`) và sinh ảnh hàng loạt (`/generate-batch-images`).

```typescript
import express, { Request, Response } from "express";
import { generateImageWithPlaywright, generateBatchImagesWithGeminiChat } from "../services/imageGeneratorService.js";

const router = express.Router();

// 1. API: Sinh 1 tấm ảnh đơn (Single Image Generation)
router.post("/generate-image", async (req: Request, res: Response) => {
  try {
    const { prompt, style, resolution, bypassCache, sandboxConfig, visualConfig } = req.body;

    // ... (logic kiểm tra cache) ...

    // Gọi service tự động hóa tạo ảnh bằng Playwright
    const result = await generateImageWithPlaywright({
      prompt,
      style,
      visualConfig,
      sandboxConfig,
    });

    if (result.success && result.base64) {
      // Lưu vào cache nếu thành công
      // ...
      return res.json({ success: true, base64: result.base64 });
    }

    return res.json({ success: false, fallbackUrl: result.fallbackUrl, warning: result.warning });
  } catch (error: any) {
    console.error("Lỗi khi sinh ảnh đơn:", error);
    return res.json({ success: false, fallbackUrl: "", warning: error.message });
  }
});

// 2. API: Sinh ảnh hàng loạt (Batch Image Generation)
router.post("/generate-batch-images", async (req: Request, res: Response) => {
  try {
    const { items, visualConfig, style } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, warning: "Danh sách items trống" });
    }

    // Gọi service xử lý sinh ảnh đồng loạt qua Gemini Chat
    await generateBatchImagesWithGeminiChat(items, visualConfig, style, (progressResult) => {
      // Callback trả về tiến độ cho từng ảnh (nếu client hỗ trợ SSE/Websocket hoặc webhook)
      // Hiện tại luồng này sử dụng timeout hoặc long-polling
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Lỗi sinh ảnh hàng loạt:", error);
    return res.json({ success: false, error: error.message });
  }
});

export default router;
```

### 2.2. Image Generator Service (`src/server/services/imageGeneratorService.ts`)
Đây là logic lõi (Core logic). Service này sử dụng thư viện `playwright` để mở một trình duyệt Chromium, tự động điền prompt vào thanh chat của AI, đợi hệ thống AI vẽ ảnh xong và trích xuất (extract) ảnh trả về dưới dạng base64.

```typescript
import { Locator, Page } from "playwright";
import { globalPlaywrightPage } from "./audioService.js";

export interface ImageGeneratorOptions {
  prompt: string;
  style?: string;
  visualConfig?: any;
  sandboxConfig?: any;
}

export interface ImageGeneratorResult {
  success: boolean;
  base64?: string;
  fallbackUrl?: string;
  warning?: string;
}

// Hàm lõi tạo ảnh thông qua Playwright
export async function generateImageWithPlaywright(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const { prompt, style, visualConfig, sandboxConfig = {} } = options;

  // Nếu người dùng chọn mode sinh ảnh qua Gemini Chat, chuyển tiếp
  if (visualConfig?.generationMode === "GeminiChat") {
    return generateImageWithGeminiChat(options);
  }

  // Kết hợp prompt với phong cách (style)
  let finalPrompt = prompt || "";
  const isStickman = !![style, prompt].some((str) => str && str.toLowerCase().includes("stickman"));
  if (isStickman) {
    finalPrompt = `${finalPrompt}, 2d flat, stickman style, minimalist`;
  }

  const fallbackUrl = `https://loremflickr.com/800/450/cinematic`;
  
  // Sử dụng Mutex để tránh việc 2 request điều khiển Playwright cùng lúc
  const release = await imageGenMutex.acquire();
  let success = false;
  let base64Result: string | null = null;

  try {
    const page = globalPlaywrightPage; 
    if (!page) throw new Error("Playwright Page chưa khởi tạo");

    // 1. Tự động click vào ô nhập liệu của công cụ AI
    const promptInput = page.locator('textarea[placeholder*="Type a prompt"]');
    await promptInput.fill(finalPrompt);

    // 2. Tự động click nút Submit (Generate)
    const submitBtn = page.locator('button:has-text("Generate")');
    await submitBtn.click();

    // 3. Chờ ảnh load xong (thường đợi selector của ảnh img xuất hiện)
    const generatedImage = page.locator('.generated-image-result img').first();
    await generatedImage.waitFor({ state: "visible", timeout: 45000 }); // Đợi tối đa 45 giây

    // 4. Lấy src base64 hoặc URL của ảnh
    const imgSrc = await generatedImage.getAttribute('src');
    
    if (imgSrc && imgSrc.startsWith("data:image")) {
      base64Result = imgSrc.split(",")[1];
      success = true;
    }
  } catch (error) {
    console.error("Lỗi khi tự động hóa Playwright:", error);
  } finally {
    // Giải phóng Mutex cho request tiếp theo
    release();
  }

  return {
    success,
    base64: base64Result || undefined,
    fallbackUrl: !success ? fallbackUrl : undefined,
  };
}

// (Các hàm tương tự cho Batch Generate bằng cách lặp qua mảng items)
```

---

## 3. Phần Frontend (Client-side)

### 3.1. Hook gọi API (`src/components/pipeline/usePipelineWizard.ts`)
Giao diện không gọi API trực tiếp mà sử dụng các hook hàm để quản lý trạng thái tải (loading state), lưu dữ liệu kết quả vào Store và tính toán chi phí (credit).

```typescript
import { useState } from "react";

export function usePipelineWizard() {
  const [project, setProject] = useState<any>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState("");

  // Hàm xử lý khi user nhấn "Tạo ảnh" cho 1 cảnh cụ thể (sceneId)
  const handleGenerateImage = async (
    sceneId: string, 
    customPrompt: string, 
    isForce: boolean = false, 
    isBatch: boolean = false
  ) => {
    // 1. Set trạng thái loading cho scene này
    if (!isBatch) {
      setLoadingStates((prev) => ({ ...prev, ["renderScene_" + sceneId]: true }));
      setErrorMsg("");
    }

    try {
      // 2. Gửi request gọi API backend
      const response = await fetch("/api/pipeline/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: customPrompt,
          style: project.visualConfig?.style,
          resolution: project.visualConfig?.quality,
          bypassCache: isForce,
          engine: project.visualConfig?.imageGeneratorEngine || "Veo3",
          visualConfig: project.visualConfig,
        }),
      });

      const data = await response.json();

      if (data.warning && !isBatch) setErrorMsg(data.warning);

      let imageUrl = "";
      // 3. Nhận Base64 trả về và convert thành data URI để gắn vào thẻ <img>
      if (data.success && data.base64) {
        imageUrl = `data:image/jpeg;base64,${data.base64}`;
      } else if (data.fallbackUrl) {
        imageUrl = data.fallbackUrl;
      } else {
        // Fallback hiển thị Placeholder nếu lỗi toàn bộ
        imageUrl = `https://placehold.co/800x450/g/png?text=Error`;
      }

      // 4. Cập nhật state của project (Scene hiện tại được cập nhật ảnh mới)
      setProject((prev: any) => {
        const updatedStoryboard = (prev.storyboard || []).map((sc: any) => {
          if (sc.id === sceneId) {
            return { ...sc, currentImage: imageUrl };
          }
          return sc;
        });
        return { ...prev, storyboard: updatedStoryboard };
      });
    } catch (error) {
      console.error(error);
    } finally {
      // 5. Tắt loading
      if (!isBatch) {
        setLoadingStates((prev) => ({ ...prev, ["renderScene_" + sceneId]: false }));
      }
    }
  };

  return {
    project,
    loadingStates,
    errorMsg,
    handleGenerateImage,
  };
}
```

### 3.2. UI Component hiển thị Nút và Ảnh (`src/components/pipeline/PipelineStep1.tsx`)
Tại Component của giao diện chia cảnh (Storyboard), danh sách các scenes được map ra màn hình. Mỗi thẻ cảnh sẽ có chức năng gọi hàm sinh ảnh.

```tsx
import React from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
// Import hook vừa tạo phía trên
import { usePipelineWizard } from "./usePipelineWizard";

export default function PipelineStep1() {
  const { project, loadingStates, handleGenerateImage } = usePipelineWizard();

  return (
    <div className="storyboard-container">
      {/* Nút sinh ảnh hàng loạt */}
      <button 
        className="bg-purple-600 text-white font-bold py-2 px-4 rounded"
        onClick={() => { /* Gọi logic batch generation */ }}
      >
        Tạo ảnh cho tất cả Scene
      </button>

      {/* Hiển thị từng Scene */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {project.storyboard?.map((scene: any) => {
          const isLoading = loadingStates["renderScene_" + scene.id];

          return (
            <div key={scene.id} className="scene-card border p-4 rounded-lg bg-slate-900">
              
              {/* Vùng hiển thị ảnh */}
              <div className="image-preview w-full h-40 bg-slate-800 rounded relative overflow-hidden mb-3">
                {scene.currentImage ? (
                  <img src={scene.currentImage} alt="Scene Visual" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-500">
                    Chưa có ảnh
                  </div>
                )}

                {/* Loading Spinner mờ đè lên nếu đang sinh ảnh */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                  </div>
                )}
              </div>

              <textarea 
                className="w-full text-xs p-2 bg-slate-950 text-slate-200"
                value={scene.imagePrompt}
                readOnly
              />

              {/* Nút Sinh ảnh đơn */}
              <button
                className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded flex items-center justify-center gap-2"
                onClick={() => handleGenerateImage(scene.id, scene.imagePrompt)}
                disabled={isLoading}
              >
                <ImageIcon className="w-4 h-4" />
                {isLoading ? "Đang vẽ..." : "Render Scene (Vẽ ảnh)"}
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 4. Đặc điểm nổi bật cần lưu ý
1. **Automation bằng Playwright:** Hệ thống thay vì gọi API trả phí từ bên thứ 3 (như OpenAI DALL-E) thì đang sử dụng **mô phỏng thao tác trình duyệt** qua Playwright để lấy ảnh trực tiếp từ UI của web AI (như Gemini Chat, Luma, Veo, v.v.). Đây là cách làm "Hack" để tiết kiệm chi phí nhưng dễ bị hỏng (break) nếu giao diện web nguồn cập nhật.
2. **Quản lý Hàng Đợi (Mutex):** Ở Backend, Service có dùng cơ chế `imageGenMutex` để ép các tác vụ sinh ảnh xếp hàng. Lý do là trình duyệt (Playwright) chỉ có 1 thanh Chat, không thể bắt trình duyệt gõ 10 prompt cho 10 ảnh đồng thời, mà phải đợi vẽ xong tấm 1 mới vẽ tiếp tấm 2.
3. **Data URI (Base64):** Ảnh được trả thẳng về frontend với định dạng `data:image/jpeg;base64,...` giúp hiển thị ngay lập tức không cần cấu hình static path phục vụ tải file. Tuy nhiên ảnh base64 rất dài và có thể gây nặng lưu trữ nếu lưu vào Redux Store.
