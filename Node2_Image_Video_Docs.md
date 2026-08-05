# Tài liệu Tổng Hợp: Code Toàn Tập Chức Năng Sinh Ảnh và Video (Node 2)

Vì lập trình viên tiếp nhận tài liệu này có thể không truy cập trực tiếp vào mã nguồn dự án, dưới đây là **toàn bộ logic code thực tế** cấu thành nên chức năng tạo Ảnh và Video tại Node 2. Các hằng số (constants) và URL nội bộ đều đã được bóc tách rõ ràng giá trị thật để bạn dễ dàng tích hợp.

---

## 1. Giao diện UI: Hiển thị Thumbnail / Video (`PipelineStep2.tsx`)

Mục đích: Render hiển thị media. Chúng ta dựa vào `visualConfig.generateType` để biết URL trả về là của video hay ảnh tĩnh.

```tsx
import React from "react";
// Giả định enum định nghĩa các kiểu tạo
enum GenerateType {
  Image = "Image",
  Video = "Video"
}

// ... trong component render danh sách thumbnails ...
{project.thumbnails.map((thumb) => (
  <div key={thumb.id} className="relative aspect-video rounded-md overflow-hidden bg-slate-900 group">
    {thumb.imageUrl ? (
      <>
        {project.visualConfig.generateType === GenerateType.Video ? (
          <video 
            src={thumb.imageUrl} 
            controls={false}
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
          />
        ) : (
          <img 
            src={thumb.imageUrl} 
            alt="Rendered thumbnail" 
            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
          />
        )}
      </>
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
        <span>No Media</span>
      </div>
    )}
  </div>
))}
```

---

## 2. Trình quản lý State & API Call (`usePipelineWizard.ts`)

Hàm này lấy các thông số cài đặt (trong đó có `generateType`) đóng gói thành Payload và gọi xuống API Backend.

```typescript
const handleRenderThumbnailImage = async (thumbId: string, promptText: string, styleText: string, force = false) => {
  const isForce = force === true;
  setLoading(true);
  
  try {
    let cleanPromptText = promptText || "";
    // Lấy tỷ lệ khung hình (ví dụ: "16:9")
    const currentAspectRatio = project.visualConfig.aspectRatio || "16:9";

    // 1. Gửi request xuống Backend API 
    // Ghi chú: API_ROUTES.PIPELINE_GENERATE_IMAGE = "/api/pipeline/generate-image"
    const data = await fetch("/api/pipeline/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `${cleanPromptText}. Designed in rich high-CTR ${styleText} layout. --ar ${currentAspectRatio}`,
        style: styleText,
        resolution: "Standard",
        bypassCache: isForce,
        engine: project.visualConfig.imageGeneratorEngine || "Veo3",
        visualConfig: project.visualConfig, // TRUYỀN TOÀN BỘ CẤU HÌNH XUỐNG BACKEND
      })
    }).then(res => res.json());

    let imgUrl = "";
    
    // 2. Xử lý Base64 trả về
    if (data.success && data.base64) {
      // ĐỌC CẤU HÌNH ĐỂ BIẾT BACKEND TRẢ VỀ MP4 HAY JPEG
      const isVideo = project.visualConfig.generateType === "Video";
      const mimePrefix = isVideo ? "data:video/mp4;base64," : "data:image/jpeg;base64,";
      
      imgUrl = `${mimePrefix}${data.base64}`;
    } else if (data.fallbackUrl) {
      imgUrl = data.fallbackUrl;
    } else {
      // Ghi chú: EXTERNAL_URLS.PLACEHOLD_CO = "https://placehold.co"
      imgUrl = `https://placehold.co/600x338/0369a1/ffffff?text=${encodeURIComponent(styleText)}&bg=gradient`;
    }

    // 3. Cập nhật URL vào State của Project
    setProject((prev) => {
      const updated = (prev.thumbnails || []).map((th) => {
        if (th.id === thumbId) return { ...th, imageUrl: imgUrl };
        return th;
      });
      return { ...prev, thumbnails: updated };
    });

  } catch (e: any) {
    console.error(e.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 3. Core Backend Tự Động Hoá (Playwright Service)

Hàm dưới đây nhận thông tin từ API Frontend, dùng `Playwright` điều khiển tab ẩn, chuyển chế độ tạo Video hay Image, nhập Prompt và lấy Base64. Toàn bộ Regex và Link Regex hệ thống đang dùng đã được khai báo trực tiếp ở đầu hàm.

```typescript
import { Page, Locator } from "playwright";

// Các Hằng số (Constants) hệ thống đang sử dụng:
const GOOGLE_LABS_FLOW_URL = "https://labs.google/fx/vi/tools/flow/project";
const PLAYWRIGHT_SUBMIT_TEXT_REGEX = /(Tạo|Create|Generate)/i;
const IMAGE_GEN_VIDEO_SECTION_REGEX = /(tạo video|video generation|video)/i;
const IMAGE_GEN_IMAGE_SECTION_REGEX = /(tạo hình ảnh|image generation|image)/i;
const IMAGE_GEN_SAVE_BTN_REGEX = /^(Lưu|Save)$/i;
const IMAGE_GEN_IMAGEN_EXACT_REGEX = /(imagen|banana pro)/i;
const IMAGE_GEN_VEO_EXACT_REGEX = /(veo|omni flash|banana 2\b(?!.*lite))/i;

export async function generateImageWithPlaywright(options: any): Promise<any> {
  const { prompt, visualConfig, sandboxConfig = {} } = options;
  
  const projectId = sandboxConfig.projectId || "default-project-id";
  let cleanProjectId = projectId.startsWith("projects/") ? projectId.replace("projects/", "") : projectId;

  let responseText = "";
  let success = false;
  let attempts = 0;
  const maxAttempts = 2;

  try {
    const targetUrl = `${GOOGLE_LABS_FLOW_URL}/${cleanProjectId}`;

    while (attempts < maxAttempts && !success) {
      attempts++;
      try {
        // Đảm bảo Playwright Page đang mở
        if (!globalPlaywrightPage || globalPlaywrightPage.isClosed()) {
          await initPlaywright();
        }

        const SELECTOR_INPUT = '[contenteditable="true"]';
        const submitBtnLocator = globalPlaywrightPage.locator("button").filter({ hasText: PLAYWRIGHT_SUBMIT_TEXT_REGEX }).last();

        // 1. Đi tới trang Google Labs Sandbox
        await globalPlaywrightPage.goto(targetUrl, { waitUntil: "commit", timeout: 60000 });
        await globalPlaywrightPage.waitForSelector(SELECTOR_INPUT, { timeout: 30000 });

        // =========================================================================
        // 2. CẤU HÌNH TAB: VIDEO HAY IMAGE
        // =========================================================================
        const configBtnLoc = globalPlaywrightPage.locator("button").filter({ has: globalPlaywrightPage.locator("i").filter({ hasText: "tune" }) }).first();

        if (await configBtnLoc.isVisible()) {
          await configBtnLoc.click();
          await globalPlaywrightPage.waitForTimeout(1000);

          // Kiểm tra logic Image hay Video
          const isVideo = visualConfig?.generateType === "Video";
          const sectionKeyword = isVideo ? IMAGE_GEN_VIDEO_SECTION_REGEX : IMAGE_GEN_IMAGE_SECTION_REGEX;
          const sectionSpan = globalPlaywrightPage.locator("span").filter({ hasText: sectionKeyword }).last();

          if (await sectionSpan.isVisible()) {
            const sectionDiv = sectionSpan.locator("xpath=..");
            
            // Set Aspect Ratio (16:9, 9:16, 1:1, v.v...)
            const targetRatio = visualConfig?.aspectRatio || "16:9";
            const ratioBtn = sectionDiv.locator('[role="tab"]').filter({ hasText: new RegExp(`^${targetRatio}$`, "i") }).first();
            if (await ratioBtn.isVisible()) await ratioBtn.click();

            // Chọn Engine (Veo3, Imagen...)
            const targetEngineKey = (visualConfig?.imageGeneratorEngine || "Veo3").toLowerCase();
            const exactEngineRegex = targetEngineKey === "imagen" ? IMAGE_GEN_IMAGEN_EXACT_REGEX : IMAGE_GEN_VEO_EXACT_REGEX;
            const engineDropdownBtn = sectionDiv.locator('button[aria-haspopup="menu"]').first();
            
            if (await engineDropdownBtn.isVisible()) {
              await engineDropdownBtn.click({ force: true });
              await globalPlaywrightPage.waitForTimeout(500);
              const optionBtn = globalPlaywrightPage.locator('[role="menuitem"]:visible').filter({ hasText: exactEngineRegex }).first();
              if (await optionBtn.isVisible()) await optionBtn.click({ force: true });
            }
          }
          
          const saveBtn = globalPlaywrightPage.locator("button:visible").filter({ hasText: IMAGE_GEN_SAVE_BTN_REGEX }).first();
          if (await saveBtn.isVisible()) await saveBtn.click();
          await globalPlaywrightPage.waitForTimeout(500);
        }

        // 3. Điền Prompt
        const inputLoc = globalPlaywrightPage.locator(SELECTOR_INPUT);
        await inputLoc.click();
        await globalPlaywrightPage.keyboard.press("Control+A");
        await globalPlaywrightPage.keyboard.press("Backspace");
        await globalPlaywrightPage.keyboard.insertText(prompt);
        await globalPlaywrightPage.waitForTimeout(1500);

        // Lấy danh sách ID cũ để so sánh
        const oldIds = await globalPlaywrightPage.evaluate(() => {
           return Array.from(document.querySelectorAll("img")).map(i => i.src);
        });

        // 4. Submit
        await submitBtnLocator.click();

        // 5. Chờ kết quả tạo xong (Trích xuất DOM)
        const base64Data = await globalPlaywrightPage.waitForFunction(
          ([oldIdsList]) => {
            const imgs = Array.from(document.querySelectorAll("img"));
            const newImg = imgs.reverse().find(img => img.src && !oldIdsList.includes(img.src));
            
            if (newImg && newImg.complete && newImg.naturalWidth > 0) {
              const canvas = document.createElement("canvas");
              canvas.width = newImg.naturalWidth;
              canvas.height = newImg.naturalHeight;
              canvas.getContext("2d")?.drawImage(newImg, 0, 0);
              // Lưu ý: Đối với cả video, Google Labs thường vẫn render qua một thẻ img trước hoặc intercept blob/base64
              return canvas.toDataURL("image/jpeg", 0.9); 
            }
            return null;
          },
          [oldIds] as const,
          { timeout: 150000 }
        );

        const finalBase64 = await base64Data.jsonValue();
        responseText = JSON.stringify({ directBase64: finalBase64 });
        success = true;
      } catch (err: any) {
        if (attempts >= maxAttempts) throw err;
      }
    }
  } finally {
    // Release mutex hoặc cleanup nếu cần
  }

  // 6. Trả kết quả về Frontend
  const parsed = JSON.parse(responseText);
  let cleanBase64 = parsed.directBase64;
  if (cleanBase64 && cleanBase64.includes(",")) {
    cleanBase64 = cleanBase64.split(",")[1];
  }

  return {
    success: true,
    base64: cleanBase64,
    fallbackUrl: parsed.directBase64,
  };
}
```
