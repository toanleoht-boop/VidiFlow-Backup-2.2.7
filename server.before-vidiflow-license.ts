import express from "express";
import path from "path";
import os from "os";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import { spawn, exec } from "child_process";
import ffmpegStatic from "ffmpeg-static";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import pipelineController from "./src/server/controllers/pipelineController.js";
import { getPlaywrightPage, initPlaywright } from "./src/server/services/audioService.js";

dotenv.config();

const app = express();
// Cho phép chạy song song với các công cụ cục bộ khác.
const PORT = Number(process.env.PORT) || 3100;
// Always prefer the FFmpeg binary bundled with the app.  Requiring a separate
// system installation made the timeline step fail silently on new machines.
const FFMPEG_PATH = typeof ffmpegStatic === "string" && ffmpegStatic
  ? ffmpegStatic
  : "ffmpeg";

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

type LicensePlan = "none" | "trial" | "monthly" | "lifetime";
type LocalLicense = {
  key?: string;
  plan: LicensePlan;
  deviceId: string;
  activatedAt?: string;
  expiresAt?: string | null;
  quotas: { voice: number; image: number; gemini: number };
};

const licenseDataDir = process.env.VIDIFLOW_DATA_DIR || path.join(os.homedir(), ".vidiflow-oneclick");
const licenseFile = path.join(licenseDataDir, "license.json");
const deviceId = crypto.createHash("sha256").update([os.hostname(), os.platform(), os.arch(), os.cpus()[0]?.model || "cpu", Math.round(os.totalmem() / 1073741824)].join("|")).digest("hex").slice(0, 20).toUpperCase();
const emptyLicense = (): LocalLicense => ({ plan: "none", deviceId, quotas: { voice: 0, image: 0, gemini: 0 } });
const readLicense = (): LocalLicense => {
  try {
    const saved = JSON.parse(fs.readFileSync(licenseFile, "utf8"));
    return saved?.deviceId === deviceId ? { ...emptyLicense(), ...saved } : emptyLicense();
  } catch { return emptyLicense(); }
};
const writeLicense = (license: LocalLicense) => {
  fs.mkdirSync(licenseDataDir, { recursive: true });
  const temp = `${licenseFile}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(license, null, 2), "utf8");
  fs.renameSync(temp, licenseFile);
};
const publicLicense = (license: LocalLicense) => {
  const expiry = license.expiresAt ? new Date(license.expiresAt).getTime() : null;
  const active = license.plan === "lifetime" || (!!expiry && expiry > Date.now());
  const daysRemaining = license.plan === "lifetime" ? null : expiry ? Math.max(0, Math.ceil((expiry - Date.now()) / 86400000)) : 0;
  return { active, plan: active ? license.plan : "none", deviceId, expiresAt: license.expiresAt || null, daysRemaining, quotas: license.quotas };
};

app.get("/api/license/status", (_req, res) => res.json(publicLicense(readLicense())));

app.post("/api/license/trial", (_req, res) => {
  const current = readLicense();
  if (current.activatedAt) return res.status(409).json({ ...publicLicense(current), error: "Thiết bị này đã sử dụng gói dùng thử." });
  const now = new Date();
  const trial: LocalLicense = { plan: "trial", deviceId, activatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 86400000).toISOString(), quotas: { voice: 2000, image: 100, gemini: 2000 } };
  writeLicense(trial);
  res.json(publicLicense(trial));
});

app.post("/api/license/activate", async (req, res) => {
  const key = String(req.body?.key || "").trim().toUpperCase();
  if (!key) return res.status(400).json({ active: false, deviceId, error: "Vui lòng nhập key kích hoạt." });
  const testKey = String(process.env.VIDIFLOW_TEST_LICENSE_KEY || "").trim().toUpperCase();
  if (testKey && crypto.timingSafeEqual(Buffer.from(key.padEnd(Math.max(key.length, testKey.length))), Buffer.from(testKey.padEnd(Math.max(key.length, testKey.length))))) {
    const local: LocalLicense = { key, plan: "lifetime", deviceId, activatedAt: new Date().toISOString(), expiresAt: null, quotas: { voice: 0, image: 0, gemini: 0 } };
    writeLicense(local); return res.json(publicLicense(local));
  }
  const licenseServer = String(process.env.LICENSE_SERVER_URL || "").replace(/\/$/, "");
  if (!licenseServer) return res.status(503).json({ active: false, deviceId, error: "Dashboard kích hoạt chưa được cấu hình. Hãy liên hệ Admin." });
  try {
    const response = await fetch(`${licenseServer}/v1/licenses/activate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, deviceId, product: "vidiflow-oneclick", version: "1.0.0" }) });
    const data: any = await response.json();
    if (!response.ok || !data?.active) return res.status(response.status || 400).json({ active: false, deviceId, error: data?.error || "Key không hợp lệ hoặc đã được dùng trên máy khác." });
    const license: LocalLicense = { key, plan: data.plan, deviceId, activatedAt: data.activatedAt || new Date().toISOString(), expiresAt: data.expiresAt ?? null, quotas: data.quotas || { voice: 0, image: 0, gemini: 0 } };
    writeLicense(license); res.json(publicLicense(license));
  } catch (error: any) { res.status(502).json({ active: false, deviceId, error: `Không thể kết nối dashboard kích hoạt: ${error.message}` }); }
});

const geminiQuotaPaths = new Set([
  "/api/write-script-from-idea", "/api/process-script", "/api/generate-hook", "/api/adjust-script-length",
  "/api/generate-storyboard", "/api/generate-storyboard-fallback", "/api/generate-seo-seeding",
  "/api/brainstorm-niche", "/api/analyze-style", "/api/analyze-character", "/api/rewrite-specific-prompts",
  "/api/analyze-style-details", "/api/generate-character-profile", "/api/ai-split-voice"
]);

app.use("/api", (req, res, next) => {
  const license = readLicense();
  const visible = publicLicense(license);
  if (!visible.active) return res.status(403).json({ success: false, code: "LICENSE_REQUIRED", error: "Vui lòng kích hoạt VidiFlow để sử dụng chức năng này." });
  if (license.plan !== "trial" || req.method !== "POST") return next();

  let quota: keyof LocalLicense["quotas"] | null = null;
  let cost = 0;
  if (req.path === "/ai33/tts") { quota = "voice"; cost = Math.max(1, String(req.body?.text || "").trim().length); }
  // The full automatic workflow creates media through the pipeline endpoint,
  // while the legacy studio uses api-media/generate. Both are one generated
  // image/video per request and must use the same trial image quota.
  else if (req.path === "/api-media/generate" || req.path === "/pipeline/generate-image") {
    quota = "image";
    cost = Math.max(1, Number(req.body?.count) || 1);
  }
  else if (geminiQuotaPaths.has(`/api${req.path}`)) { quota = "gemini"; cost = 1; }
  if (!quota || cost <= 0) return next();
  if ((license.quotas[quota] || 0) < cost) return res.status(402).json({ success: false, code: "TRIAL_QUOTA_EXHAUSTED", quota, remaining: license.quotas[quota] || 0, error: `Gói dùng thử đã hết điểm ${quota}. Vui lòng nâng cấp để tiếp tục.` });
  license.quotas[quota] -= cost;
  writeLicense(license);
  next();
});

app.use("/api/pipeline", pipelineController);

// Helper to check and retrieve Gemini client lazily
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_GEMINI_API_KEY");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

interface StyleRequirements {
  isNonRealistic: boolean;
  styleGuideText: string;
  realisticDetailLabel: string;
  cameraLensLabel: string;
  lightingLabel: string;
}

function getStyleRequirements(style: string = ""): StyleRequirements {
  const s = style || "cinematic dark storytelling, hyper-detailed, 8k";
  const lower = s.toLowerCase();
  const isNonRealistic = lower.includes("anime") || 
                         lower.includes("ghibli") || 
                         lower.includes("watercolor") || 
                         lower.includes("cartoon") || 
                         lower.includes("illustration") || 
                         lower.includes("painting") || 
                         lower.includes("sketch") || 
                         lower.includes("comic") || 
                         lower.includes("vector") || 
                         lower.includes("2d") ||
                         lower.includes("drawing") ||
                         lower.includes("draw") ||
                         lower.includes("chibi") ||
                         lower.includes("caricature") ||
                         lower.includes("disney") ||
                         lower.includes("pixar") ||
                         lower.includes("concept art") ||
                         lower.includes("digital art") ||
                         lower.includes("clip art") ||
                         lower.includes("hand-drawn") ||
                         lower.includes("flat color");

  if (isNonRealistic) {
    const styleGuideText = 
      `- PHONG CÁCH PHẢI ĐỒNG NHẤT TUYỆT ĐỐI (STRICT ARTISTIC STYLE ENFORCEMENT): Bạn đã chọn phong cách vẽ tranh/hoạt hình/nghệ thuật phi hiện thực ("${s}").\n` +
      `  + CẤM KÈM CÁC TỪ KHÓA LIÊN QUAN ĐẾN NHIẾP ẢNH / ẢNH THẬT / ĐỒ HOẠ 3D (STRICT NO PHOTOGRAPHY & NO 3D KEYWORDS): Tuyệt đối KHÔNG được sử dụng bất kỳ từ khóa nào mang tính chất ảnh chụp thực tế hoặc 3D render như "photorealistic", "photography", "hyper-realistic", "real-life", "skin texture", "pores", "camera lens", "85mm", "35mm", "photo", "shot on camera", "film grain", "analog photo", "Unreal Engine", "3D render", "CGI", "realistic 3D", "octane render". Việc dùng các từ này sẽ làm hỏng phong cách vẽ tranh/hoạt hình và biến nó thành ảnh người thật rập khuôn.\n` +
      `  + TĂNG CƯỜNG TỪ KHÓA NGHỆ THUẬT / VẼ TRANH / HOẠT HÌNH: Hãy bắt đầu mỗi englishPrompt bằng các cụm từ khẳng định mạnh mẽ phong cách thích hợp như: "A beautiful 2D anime style digital illustration of...", "A gorgeous studio ghibli style hand-drawn scene showing...", "A dreamy magical watercolor painting of...", "An exquisite hand-drawn illustration depicting..." tùy theo phong cách cốt lõi.\n` +
      `  + Thay thế mô tả bề mặt "pores" thành các từ nghệ thuật như "artistic brushstrokes", "clean ink lines", "vibrant color washes", "soft cel shading", "textured drawing canvas", "magical background glow" để tranh vẽ đạt được độ đồng nhất hoàn hảo.`;

    return {
      isNonRealistic,
      styleGuideText,
      realisticDetailLabel: "artistic brushstrokes, clean ink lines, textured canvas, soft cel shading, detailed clothing folds, 2D vector style",
      cameraLensLabel: "artistic compositions, wide landscape canvas, stylized character portrait, dynamic framing",
      lightingLabel: "vibrant anime lighting, soft watercolor glows, magical ambient highlights, stylized hand-drawn shadows"
    };
  } else {
    const styleGuideText = 
      `- PHONG CÁCH PHẢI ĐỒNG NHẤT TUYỆT ĐỐI (STRICT CINEMATIC STYLE ENFORCEMENT): Bạn đã chọn phong cách ảnh chụp/cinema ("${s}").\n` +
      `  + CẤM DÙNG CÁC TỪ KHÓA HOẠT HÌNH / TRANH VẼ (STRICT NO CARTOON/ILLUSTRATION KEYWORDS): Tuyệt đối KHÔNG được sử dụng các từ khóa như "anime", "cartoon", "illustration", "watercolor", "drawing", "vector", "sketch", "comic" trừ khi có yêu cầu đặc biệt. Điều này đảm bảo tính điện ảnh chân thực của hình ảnh.\n` +
      `  + Tận dụng tối đa các kỹ thuật điện ảnh chuyên nghiệp (chiaroscuro kịch tính, tia sáng volumetric rọi qua khói bụi, warm/cold color grading sâu lắng, depth of field mượt mà với bokeh, ống kính 35mm hoặc 85mm portrait, bụi mịn lơ lửng trong không trung, kết cấu thực tế như pores, fabrics, cinematic skin detail) vào từng prompt để tạo ảnh siêu chất lượng.`;

    return {
      isNonRealistic,
      styleGuideText,
      realisticDetailLabel: "highly detailed skin pores, intricate facial features, real hair strands, fabric weave textures",
      cameraLensLabel: "anamorphic lens, 85mm portrait, 35mm wide angle cinema lens, pro camera settings, shallow depth of field",
      lightingLabel: "moody cinematic volumetric light rays, dramatic chiaroscuro lighting, subtle particles in rays, neon rim highlights"
    };
  }
}

// Hàm lọc và đồng bộ hóa prompt/negative prompt nâng cao tránh pha trộn thực tế & hoạt hình
function sanitizePromptAndNegative(prompt: string, style: string = "", baseNegative: string = "") {
  const s = style || "";
  const sLower = s.toLowerCase();
  const pLower = prompt.toLowerCase();
  
  // Kiểm tra phong cách hiện tại có thuộc nhóm hoạt hình/tranh vẽ phi hiện thực hay không
  const isNonRealistic = sLower.includes("anime") || 
                         sLower.includes("ghibli") || 
                         sLower.includes("watercolor") || 
                         sLower.includes("cartoon") || 
                         sLower.includes("illustration") || 
                         sLower.includes("painting") || 
                         sLower.includes("sketch") || 
                         sLower.includes("comic") || 
                         sLower.includes("vector") || 
                         sLower.includes("2d") ||
                         sLower.includes("drawing") ||
                         sLower.includes("draw") ||
                         sLower.includes("chibi") ||
                         sLower.includes("caricature") ||
                         sLower.includes("disney") ||
                         sLower.includes("pixar") ||
                         sLower.includes("concept art") ||
                         sLower.includes("digital art") ||
                         sLower.includes("clip art") ||
                         sLower.includes("hand-drawn") ||
                         sLower.includes("flat color") ||
                         pLower.includes("anime style") ||
                         pLower.includes("cartoon style") ||
                         pLower.includes("ghibli vibes") ||
                         pLower.includes("watercolor style") ||
                         pLower.includes("illustration style") ||
                         pLower.includes("2d digital illustration") ||
                         pLower.includes("hand-drawn style");

  let cleanPrompt = prompt;
  let cleanNegative = baseNegative || "";

  if (isNonRealistic) {
    // PHONG CÁCH NGHỆ THUẬT / HOẠT HÌNH: Loại bỏ triệt để từ khóa ảnh thật và 3D thô cứng
    const realisticKeywords = [
      /photorealistic/gi, /photography/gi, /hyper-realistic/gi, /hyperrealistic/gi, /real-life/gi,
      /realistic skin/gi, /skin pores/gi, /pores on skin/gi, /pores/gi, /shot on camera/gi,
      /camera lens/gi, /analog photo/gi, /film grain/gi, /skin texture/gi, /highly detailed skin/gi,
      /unreal engine/gi, /3d render/gi, /3d style/gi, /cgi/gi, /realistic 3d/gi, /octane render/gi,
      /dramatic realism/gi, /3d animation/gi, /rendered in blender/gi, /blender render/gi,
      /ray tracing/gi, /raytracing/gi, /rtx/gi, /realistic human/gi, /real life/gi, /photo/gi,
      /camera shot/gi, /cinematic shot/gi, /cinematic realism/gi, /dslr/gi, /megapixel/gi,
      /8k resolution/gi, /studio photography/gi, /magazine photography/gi, /portrait photography/gi,
      /photographed/gi
    ];

    for (const regex of realisticKeywords) {
      cleanPrompt = cleanPrompt.replace(regex, "");
    }

    // Dọn dẹp dấu câu thừa thãi
    cleanPrompt = cleanPrompt.replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim();
    if (cleanPrompt.startsWith(",")) cleanPrompt = cleanPrompt.slice(1).trim();
    if (cleanPrompt.endsWith(",")) cleanPrompt = cleanPrompt.slice(0, -1).trim();

    // Xác định tiền tố phong cách 2D nghệ thuật chuẩn mực nhất
    let prefix = "";
    if (sLower.includes("anime") || sLower.includes("ghibli")) {
      prefix = "A beautiful 2D hand-drawn anime digital illustration of ";
    } else if (sLower.includes("watercolor")) {
      prefix = "A dreamy whimsical magical watercolor painting of ";
    } else if (sLower.includes("painting") || sLower.includes("oil")) {
      prefix = "A beautiful hand-painted textured oil painting of ";
    } else if (sLower.includes("cartoon")) {
      prefix = "A high-quality 2D cartoon vector illustration of ";
    } else {
      prefix = "A beautiful 2D artistic hand-drawn illustration of ";
    }

    // Ghép tiền tố nếu prompt chưa có tiền tố nghệ thuật
    const cleanPromptLower = cleanPrompt.toLowerCase();
    if (!cleanPromptLower.startsWith("a beautiful 2d") && 
        !cleanPromptLower.startsWith("a gorgeous") && 
        !cleanPromptLower.startsWith("a dreamy") && 
        !cleanPromptLower.startsWith("an exquisite") && 
        !cleanPromptLower.startsWith("retro anime") && 
        !cleanPromptLower.startsWith("in the style of") &&
        !cleanPromptLower.startsWith("studio ghibli")) {
      cleanPrompt = prefix + cleanPrompt;
    }

    // Ép buộc kết thúc bằng các định từ dẹt phẳng 2D, cel shading nghệ thuật
    if (!cleanPromptLower.includes("flat 2d") && !cleanPromptLower.includes("cel shaded")) {
      cleanPrompt = `${cleanPrompt}, flat 2D style, cel shaded, clean ink outlines, solid colors, hand-drawn vector art`;
    }

    // Thiết lập danh sách từ khóa loại trừ cực kỳ khắt khe để triệt tiêu mọi bóng dáng 3D / Realistic
    const nonRealisticNegatives = "photorealistic, photography, real human, photograph, real-life, 3D render, CGI, 3D model, 3D character, depth of field, blurred background, realistic skin texture, realistic human faces, detailed skin pores, octane render, blender, raytracing, realistic 3D, digital painting texture look alike photo, photographic, dslr photo, high-fidelity real skin, raw photo, realistic light reflections, realistic skin shaders";
    if (cleanNegative) {
      cleanNegative = `${cleanNegative}, ${nonRealisticNegatives}`;
    } else {
      cleanNegative = nonRealisticNegatives;
    }

  } else {
    // PHONG CÁCH ẢNH CHỤP / ĐIỆN ẢNH THỰC TẾ: Loại bỏ triệt để từ khóa hoạt hình và dẹt phẳng 2D
    const nonRealisticKeywords = [
      /anime/gi, /cartoon/gi, /drawing/gi, /illustration/gi, /vector/gi, /sketch/gi, /comic/gi,
      /watercolor/gi, /2d flat/gi, /hand-drawn/gi, /ghibli/gi, /cel shading/gi, /painting/gi,
      /acrylic/gi, /flat 2d/gi, /solid colors/gi, /clean ink outlines/gi, /vector art/gi, /ink lines/gi
    ];

    for (const regex of nonRealisticKeywords) {
      cleanPrompt = cleanPrompt.replace(regex, "");
    }

    // Dọn dẹp dấu câu thừa thãi
    cleanPrompt = cleanPrompt.replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim();
    if (cleanPrompt.startsWith(",")) cleanPrompt = cleanPrompt.slice(1).trim();
    if (cleanPrompt.endsWith(",")) cleanPrompt = cleanPrompt.slice(0, -1).trim();

    // Tiền tố điện ảnh siêu thực thực tế
    const cleanPromptLower = cleanPrompt.toLowerCase();
    if (!cleanPromptLower.startsWith("a realistic photo") && 
        !cleanPromptLower.startsWith("a cinematic") && 
        !cleanPromptLower.startsWith("a stunning photo") && 
        !cleanPromptLower.startsWith("a dramatic photo")) {
      cleanPrompt = "A realistic cinematic dramatic photo of " + cleanPrompt;
    }

    // Ép buộc kết hợp hậu tố kỹ thuật nhiếp ảnh gia cao cấp
    if (!cleanPromptLower.includes("photorealistic") && !cleanPromptLower.includes("photography")) {
      cleanPrompt = `${cleanPrompt}, highly detailed realism, dramatic cinematic lighting, shot on 35mm lens, depth of field, lifelike skin textures`;
    }

    // Loại trừ mọi từ khóa phong cách hoạt họa hay tranh vẽ nghệ thuật phẳng dẹt
    const realisticNegatives = "anime, cartoon, drawing, illustration, sketch, painting, watercolor, vector, flat color, 2D art, graphic design, outline, pencil sketch, digital drawing, CGI art style, drawing canvas texture, abstract painting, low resolution sketch, 2D character, manga style, cartoon filter";
    if (cleanNegative) {
      cleanNegative = `${cleanNegative}, ${realisticNegatives}`;
    } else {
      cleanNegative = realisticNegatives;
    }
  }

  // Loại bỏ các từ khóa trùng lặp trong Negative Prompt để tối ưu bộ nhớ
  const negativeArray = cleanNegative.split(",").map(item => item.trim()).filter(Boolean);
  const uniqueNegatives = Array.from(new Set(negativeArray));
  cleanNegative = uniqueNegatives.join(", ");

  return { cleanPrompt, cleanNegative };
}

// Helper to format raw Gemini API errors into friendly, actionable Vietnamese instructions
function formatAiError(error: any): string {
  const msg = error?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "";
  
  if (
    msg.includes("429") || 
    msg.toLowerCase().includes("quota") || 
    msg.toLowerCase().includes("exhausted") || 
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("limit exceeded")
  ) {
    return "⚠️ Quota API của bạn đã bị vượt quá giới hạn (Lỗi 429 - RESOURCE_EXHAUSTED). Hiện tại máy chủ đang quá tải hoặc khóa API của bạn hết số dư/giới hạn ngày. Vui lòng thử lại sau ít phút hoặc kiểm tra và thay thế GEMINI_API_KEY trong mục Settings > Secrets ở góc ứng dụng.";
  }
  
  if (
    msg.includes("API key not valid") || 
    msg.toLowerCase().includes("key not valid") || 
    msg.toLowerCase().includes("invalid api key") ||
    msg.toLowerCase().includes("api key is invalid")
  ) {
    return "⚠️ Khoá GEMINI_API_KEY hiện tại không hợp lệ hoặc chưa được kích hoạt. Vui lòng kiểm tra và cập nhật lại khoá API chính xác trong mục Settings > Secrets.";
  }
  if (
    msg.includes("503") || 
    msg.toLowerCase().includes("unavailable") || 
    msg.toLowerCase().includes("high demand")
  ) {
    return "⏳ Máy chủ AI (Gemini) hiện đang quá tải do nhu cầu sử dụng cao (Lỗi 503). Đây là tình trạng tạm thời từ phía Google, vui lòng chờ khoảng 1-2 phút rồi bấm thực hiện lại nhé!";
  }
  
  return msg;
}

// Helper to generate content with retry and fallback under high demand
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Concurrency limiter to run async tasks in limited batches
async function limitConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      if (index >= items.length) break;
      const item = items[index];
      try {
        results[index] = await fn(item, index);
      } catch (err) {
        console.error(`[Concurrency Error] Task at index ${index} failed:`, err);
        throw err;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function generateContentWithFallback(ai: GoogleGenAI, params: any) {
  const originalModel = params.model || "gemini-3.5-flash";
  // Gemini 1.5 and 2.5 model IDs are retired for new API users. Prefer the
  // current GA Flash models even when older endpoints pass a legacy model ID.
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    ...(originalModel.startsWith("gemini-1.") || originalModel.startsWith("gemini-2.") ? [] : [originalModel]),
  ];
  
  // Remove duplicates
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;
  for (const model of uniqueModels) {
    // Try up to 3 times per model to handle transient errors such as 503 or 429
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[AI-API] Attempting model: ${model} (attempt ${attempt}/3)`);
        const currentParams = {
          ...params,
          model: model
        };
        return await ai.models.generateContent(currentParams);
      } catch (error: any) {
        lastError = error;
        const errorStr = error.message || JSON.stringify(error) || "Lỗi không xác định";
        console.warn(`[WARN] Model ${model} failed on attempt ${attempt}/3. Error: ${errorStr.slice(0, 300)}`);
        if (errorStr.includes("404") || errorStr.toLowerCase().includes("not found")) break;
        
        // If it was a 503 or rate-limiting or connection error, sleeping before retrying can help resolve it
        if (attempt < 3) {
          const delayMs = attempt * 1200; // 1.2s, 2.4s
          console.log(`[AI-API] Sleeping ${delayMs}ms before retrying ${model}...`);
          await sleep(delayMs);
        }
      }
    }
    console.warn(`[WARN] Model ${model} failed all ${3} attempts. Trying next fallback model if available...`);
  }

  throw new Error(formatAiError(lastError));
}

async function generateFallbackEnglishPrompt(text: string, style: string = "", characterDescription: string = ""): Promise<string> {
  try {
    const ai = getGeminiClient();
    const cleanText = text.trim();
    if (!cleanText) return "";

    const shotTypes = [
      "wide-angle scenic master shot showing the vast setting",
      "extreme close-up macro portrait focusing deeply on the facial expression",
      "cinematic medium shot with dynamic hand gestures and posture",
      "dramatic low-angle shot emphasizing scale and grandeur",
      "over-the-shoulder perspective looking toward the unfolding scene",
      "side-profile action shot capturing motion and suspense"
    ];
    // Pick a shot type based on the text length or hash to make it stable but varied
    const hash = cleanText.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const recommendedShot = shotTypes[hash % shotTypes.length];

    const styleReqs = getStyleRequirements(style);

    const userPrompt = `You are a precise visual storyteller. Translate and visually describe this scene/dialogue into an English image prompt (70-110 words) suitable for Midjourney/Imagen.
Scene dialogue: "${cleanText}"
Artistic style: "${style || "cinematic dark storytelling, hyper-detailed"}"
Character description (if any): "${characterDescription || "none"}"

Requirements:
- SPOKEN LINE IS THE SOURCE OF TRUTH: First translate every concrete subject, action, object, place and stated emotion in the dialogue. Depict those exact facts visibly. Never replace them with a generic cinematic scene.
- Do not add a new character, object, action, place, conflict, weather, historical era, emotion or metaphor unless it is explicitly present in the dialogue or character description. If the dialogue is abstract, use one simple visual symbol that directly explains its meaning, never an unrelated dramatic scene.
- The style changes only the visual treatment (medium, palette, line work, texture and lighting); it must never change the story facts. Begin the prompt with the exact artistic style above.
- Use the camera angle "${recommendedShot}" only when it still shows the required subject and action clearly. Do not let camera language, lens language or effects take priority over the dialogue.
${styleReqs.styleGuideText}
- Write ONLY the English prompt. Do not output introduction, conversational words, or quotes. Output the prompt directly.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-1.5-flash",
      contents: userPrompt,
      config: {
        temperature: 0.35,
      }
    });

    if (response && response.text) {
      return response.text.trim();
    }
  } catch (err) {
    console.warn("[WARN] generateFallbackEnglishPrompt failed:", err);
  }
  return "";
}

// Check api key availability endpoint
app.get("/api/health-check", (req, res) => {
  const apiKeyExists = !!process.env.GEMINI_API_KEY;
  res.json({ 
    status: "ok", 
    apiKeyConfigured: apiKeyExists 
  });
});

// Helper function to clean transcript programmatically using fast regex
function cleanTranscriptProgrammatically(rawText: string): string {
  if (!rawText) return "";
  
  // Cut off everything before "Transcript:" or "Kịch bản:" if present
  const markerRegex = /(?:^|\r?\n|\s)(?:transcript|kịch\s*bản)\s*:?\s*(\r?\n)?/i;
  const match = rawText.match(markerRegex);
  if (match && match.index !== undefined) {
    const startIndex = match.index + match[0].length;
    rawText = rawText.slice(startIndex);
  }
  
  // 1. Split text into lines
  const lines = rawText.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (let line of lines) {
    let cleaned = line.trim();
    if (!cleaned) continue;

    // Pattern for timestamps formatted like (00:01), [12:34], etc.
    cleaned = cleaned.replace(/[\[(]\s*\d{1,2}:\d{2}(:\d{2})?\s*[\])]/g, "");
    cleaned = cleaned.replace(/[\[(]\s*\d+:\d+\s*[\])]/g, "");

    // Pattern for flat timestamps e.g. 00:01, 1:23, 0:05, 12:34:56
    cleaned = cleaned.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, "");
    cleaned = cleaned.replace(/\b\d+:\d+\b/g, "");
    
    // Pattern for range timestamps e.g. 00:01 - 03:00 or similar
    cleaned = cleaned.replace(/\b\d+:\d+\s*-\s*\d+:\d+\b/g, "");

    // Clean duplicate dashes to spaces
    cleaned = cleaned.replace(/-{2,}/g, " ");

    // Remove bullets
    cleaned = cleaned.replace(/^\s*[-•]\s*/, "");

    cleaned = cleaned.trim();
    if (cleaned) {
      cleanedLines.push(cleaned);
    }
  }

  // 2. Regroup short transcription snips into paragraphs
  const paragraphs: string[] = [];
  let currentGroup: string[] = [];

  for (const line of cleanedLines) {
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    currentGroup.push(...words);

    const endsWithPunctuation = /[.!?]$/.test(line);
    // If paragraph reaches ~100 words, or ends with sentence punctuation, flush it
    if (endsWithPunctuation || currentGroup.length >= 100) {
      let segment = currentGroup.join(" ");
      if (segment.length > 0) {
        // Capitalize first character
        segment = segment.charAt(0).toUpperCase() + segment.slice(1);
        if (!/[.!?]$/.test(segment)) {
          segment += ".";
        }
        paragraphs.push(segment);
      }
      currentGroup = [];
    }
  }

  if (currentGroup.length > 0) {
    let segment = currentGroup.join(" ");
    if (segment.length > 0) {
      segment = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (!/[.!?]$/.test(segment)) {
        segment += ".";
      }
      paragraphs.push(segment);
    }
  }

  return paragraphs.join("\n\n");
}

function cleanAiResponseBoilerplate(text: string): string {
  if (!text) return "";
  
  // Remove markdown blocks wrap if any
  let cleaned = text.trim();
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.substring(11).trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3).trim();
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }

  // Split into lines
  let lines = cleaned.split(/\r?\n/);

  // Filter out standalone separator lines like "***", "---" or "===" or empty rows at the beginning/end
  lines = lines.filter(line => {
    const trimmed = line.trim();
    if (/^[\*\-\_`=\s]{3,}$/.test(trimmed)) {
      return false;
    }
    return true;
  });

  // Remove leading/introductory paragraph if it looks like AI chatter/boilerplate
  let changed = true;
  while (changed && lines.length > 0) {
    changed = false;
    const firstLine = lines[0].trim();
    if (!firstLine) {
      lines.shift();
      changed = true;
      continue;
    }

    const lowerLine = firstLine.toLowerCase();
    const isBoilerplate = 
      lowerLine.includes("dưới đây") ||
      lowerLine.includes("đây là bản dịch") ||
      lowerLine.includes("đây là kịch bản") ||
      lowerLine.includes("kịch bản sau khi") ||
      lowerLine.includes("bản dịch kịch bản") ||
      lowerLine.includes("sau đây là") ||
      lowerLine.includes("tôi đã") ||
      lowerLine.includes("bản dịch của bạn") ||
      lowerLine.includes("kịch bản chỉnh sửa") ||
      lowerLine.includes("văn bản đã được") ||
      lowerLine.includes("phong cách kể chuyện") ||
      lowerLine.includes("mạch lạc") ||
      lowerLine.includes("đúng ngữ pháp") ||
      lowerLine.includes("phân đoạn rõ ràng") ||
      lowerLine.startsWith("kịch bản:") ||
      lowerLine.startsWith("viết lại:") ||
      lowerLine.startsWith("kết quả:");

    // If it's a short/medium intro line or ends with a colon, it's boilerplate
    if (isBoilerplate && (firstLine.length < 200 || firstLine.endsWith(":"))) {
      lines.shift();
      changed = true;
    }
  }

  // Remove trailing boilerplate paragraphs
  let changedEnd = true;
  while (changedEnd && lines.length > 0) {
    changedEnd = false;
    const lastLine = lines[lines.length - 1].trim();
    if (!lastLine) {
      lines.pop();
      changedEnd = true;
      continue;
    }

    const lowerLine = lastLine.toLowerCase();
    const isEndingBoilerplate =
      lowerLine.includes("hy vọng kịch bản") ||
      lowerLine.includes("hy vọng bản dịch") ||
      lowerLine.includes("chúc bạn thành công") ||
      lowerLine.includes("chúc bạn tạo video") ||
      lowerLine.includes("chúc bạn làm video") ||
      lowerLine.includes("chúc bạn có những video") ||
      lowerLine.includes("hope this helps") ||
      lowerLine.includes("let me know if") ||
      lowerLine.includes("chúc bạn ngày mới tốt lành") ||
      lowerLine.includes("đã chuẩn hóa thành công");

    if (isEndingBoilerplate && lastLine.length < 200) {
      lines.pop();
      changedEnd = true;
    }
  }

  return lines.join("\n").trim();
}

function generateHookProgrammatically(oldHook: string, context?: string, language: string = "original"): Array<{ style: string; hookText: string; explanation: string }> {
  const cleanOld = oldHook.trim();
  const title = cleanOld.slice(0, 50) + "...";
  
  if (language === "en") {
    return [
      {
        style: "Mystery & Curiosity",
        hookText: `What chilling secret lies behind this story? There are hidden truths about "${title}" that you would never dare to believe!`,
        explanation: "Targets the primitive sense of curiosity, opening an incredibly captivating and doubtful world."
      },
      {
        style: "Dramatic & Shocking",
        hookText: `Stop! Don't scroll past if you don't know this shocking detail. The disturbing truth of "${title}" is about to be exposed right now!`,
        explanation: "Uses sensational and urgent vocabulary to maximize viewer retention."
      },
      {
        style: "Deep Emotional Connection",
        hookText: `The story of "${title}" holds priceless life lessons that will leave you completely speechless. This is the turning point that changes everything...`,
        explanation: "Connects with raw, genuine emotions to touch the hearts of millions of viewers."
      }
    ];
  } else if (language === "zh") {
    return [
      {
        style: "悬疑与好奇",
        hookText: `这个故事背后隐藏着什么令人胆战心惊的秘密？关于“${title}”那些被掩埋的真相，你绝对不敢置信！`,
        explanation: "直击人类最原始的好奇心，开启一个充满悬疑与极度吸引力的世界。"
      },
      {
        style: "戏剧化与震撼",
        hookText: `停下！如果你还不知道这个震撼的消息，千万别划走。关于“${title}”的惊人真相现在就要揭晓！`,
        explanation: "使用紧张、紧迫的词汇，最大化提升观众的留存率。"
      },
      {
        style: "深层情感共鸣",
        hookText: `关于“${title}”的故事蕴含着宝贵的人生启示，让人陷入沉思。正是这个转折，彻底改变了一切……`,
        explanation: "用真挚的情感建立链接，打动千万观众的心灵。"
      }
    ];
  } else if (language === "ja") {
    return [
      {
        style: "ミステリー＆好奇心",
        hookText: `この物語の裏に暗い秘密が隠されています。 「${title}」にまつわる信じられない真実が暴かれます！`,
        explanation: "原始的な好奇心を刺激し、謎に満ちた魅力的な世界へと引き込みます。"
      },
      {
        style: "ドラマチック＆衝撃",
        hookText: `ストップ！この衝撃的な事実を知るまでスクロールしないで。 「${title}」の驚愕の真実が今、明かされます！`,
        explanation: "緊迫感のある言葉で、視聴者の維持率（Retention）を最大化します。"
      },
      {
        style: "深い感情の共鳴",
        hookText: `「${title}」の物語には、言葉を失うほど貴重な人生の教訓が込められています。これがすべてを変える分岐点となるのです...`,
        explanation: "真摯な感情で視聴者とつながり、何百万人もの心を揺さぶります。"
      }
    ];
  } else if (language === "ko") {
    return [
      {
        style: "미스터리 & 호기심",
        hookText: `이 이야기 뒤에 숨겨진 소름 끼치는 비밀은 무엇일까요? "${title}"에 대해 묻혀있던 진실을 마주하면 절대 믿지 못할 겁니다!`,
        explanation: "인간 본연의 호기심을 자극하여 팽팽한 긴장감과 극도의 몰입감을 선사합니다."
      },
      {
        style: "드라마틱 & 충격",
        hookText: `잠깐만요! 이 충격적인 사실을 모른 채 그냥 지나치지 마세요. "${title}"의 놀라운 진실이 지금 바로 밝혀집니다!`,
        explanation: "자극적이고 긴박한 언어를 사용하여 시청자 유지율을 극대화합니다."
      },
      {
        style: "깊은 감정적 공명",
        hookText: `"${title}"에 관한 이야기는 깊은 생각을 하게 만드는 값진 인생의 교훈을 담고 있습니다. 이것이 정녕 모든 것을 바꾸는 계기가 될 것입니다...`,
        explanation: "진정성 있는 감정으로 수만 명의 시청자 마음을 두드립니다."
      }
    ];
  }

  return [
    {
      style: "Bí ẩn & Tò mò",
      hookText: `Bí mật kinh hoàng nào đang ẩn giấu phía sau câu chuyện này? Có những sự thật về "${cleanOld.slice(0, 70)}..." bị chôn vùi mà bạn sẽ không bao giờ dám tin là thật!`,
      explanation: "Đánh thẳng vào tâm lý tò mò nguyên bản của con người, mở ra một thế giới đầy hoài nghi và lôi cuốn cực độ."
    },
    {
      style: "Kịch tính & Gây sốc",
      hookText: `Dừng lại! Đừng lướt qua nếu bạn chưa biết điều chấn động này. Sự thật về "${cleanOld.slice(0, 70)}..." sắp sửa được vạch trần ngay bây giờ!`,
      explanation: "Sử dụng ngôn từ kịch tính, khẩn cấp đẩy tỷ lệ giữ chân người xem (Retention) tối đa."
    },
    {
      style: "Đánh vào cảm xúc sâu sắc",
      hookText: `Câu chuyện về "${cleanOld.slice(0, 70)}..." chứa đựng những bài học cuộc đời đắt giá khiến chúng ta phải lặng người suy ngẫm. Đây chính là bước ngoặt thay đổi tất cả...`,
      explanation: "Kết nối bằng cảm xúc chân thành, gieo suy ngẫm sâu sắc và chạm tới hàng triệu trái tim."
    }
  ];
}

function generateStoryboardProgrammatically(
  scriptText: string, 
  style: string = "cinematic dark storytelling, hyper-detailed",
  scenesCount: number = 4,
  promptsPerScene: number = 3
): any {
  const paragraphs = scriptText.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const scenes: any[] = [];
  
  const maxScenes = scenesCount;
  let groupedParagraphs: string[] = [];
  
  if (paragraphs.length <= maxScenes) {
    groupedParagraphs = paragraphs;
  } else {
    // Group into maxScenes chunks
    const chunkSize = Math.ceil(paragraphs.length / maxScenes);
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      groupedParagraphs.push(paragraphs.slice(i, i + chunkSize).join(" "));
    }
  }

  // Ensure indeed we don't have more than maxScenes
  if (groupedParagraphs.length > maxScenes) {
    groupedParagraphs = groupedParagraphs.slice(0, maxScenes);
  }

  for (let i = 0; i < groupedParagraphs.length; i++) {
    const text = groupedParagraphs[i];
    const sceneNumber = (i + 1).toString();
    
    // Estimate a time segment
    const durationPerScene = Math.max(10, Math.min(25, Math.round(text.split(/\s+/).length * 0.4)));
    const startSec = i * 15;
    const endSec = startSec + durationPerScene;
    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60).toString().padStart(2, "0");
      const s = (secs % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    };
    const timeSegment = `${formatTime(startSec)} - ${formatTime(endSec)}`;
    
    // Create a visual description based on paragraph content
    let shortLabel = text.slice(0, 100) + (text.length > 100 ? "..." : "");
    let visualDescription = `Phân cảnh thể hiện sinh động bối cảnh, chiều sâu nội dung kịch tính: "${shortLabel}". Được dàn dựng bài bản với góc máy điện ảnh phong phú, bối cảnh ngập tràn không khí kịch chuyển tiếp liên hoàn, biểu tả trọn vẹn từng thớ cơ biểu cảm và chiều sâu tâm lý nhân vật.`;
    
    // Create specified number of beautiful image prompts dynamically
    const imagePrompts: any[] = [];
    const customStyle = style || "cinematic dark storytelling, hyper-detailed";
    
    const promptTemplates = [
      {
        label: "Toàn cảnh bối cảnh chính",
        template: (label: string) => `A breathtaking widescreen cinematic masterwork portraying: ${label}. Epic scale atmosphere, stunning environmental design, dramatic volumetric light rays cutting through dense mist, high fidelity, 8k resolution, professionally color graded with deep shadow contrast, Unreal Engine 5 aesthetic, photorealistic texture --ar 16:9 --v 6.0`
      },
      {
        label: "Cận cảnh biểu cảm & Hành động đỉnh điểm",
        template: (label: string) => `An intense, emotional close-up shot of the central characters/elements involved in: ${label}. Intricate facial expressions, realistic skin pores, eyes catching glint of warm rim lighting, rich back-lighting, deep dark cinematic shadows, award-winning cinematography, shot on 85mm anamorphic F1.2 lens, photorealistic details --ar 16:9 --v 6.0`
      },
      {
        label: "Góc máy sáng tạo & Đổ bóng kịch tính",
        template: (label: string) => `A highly stylistic creative low-angle composition of: ${label}. Deep rich teal and amber tones, dramatic long shadows stretching across the ground, moody film grain overlay, soft cinematic haze, intricate focus details, hyper-realistic, volumetric smoke, majestic cinematic storytelling --ar 16:9 --v 6.0`
      },
      {
        label: "Chi tiết nghệ thuật & Biểu tượng ẩn dụ",
        template: (label: string) => `A stunning cinematic detail shot focusing on macro elements and key narrative symbols representing: ${label}, style of ${customStyle}. Soft bokeh background, atmospheric dust particles illuminated in sharp rays of golden light, shallow depth of field, 100mm macro lens focus, highly polished, surreal moody ambient --ar 16:9 --v 6.0`
      },
      {
        label: "Góc máy flycam từ trên cao xuống",
        template: (label: string) => `Epic aerial drone photography capturing: ${label}. Immersive birds-eye cinematic perspective, beautiful landscape layout, sweeping light and shadow casting deep on the terrain, rich textures, hyper-detailed, award-winning cinematography --ar 16:9 --v 6.0`
      },
      {
        label: "Ánh sáng tương phản cực mạnh Chiaroscuro",
        template: (label: string) => `A striking chiaroscuro composition portraying: ${label}. Severe light and shade contrast, warm amber glow hitting mysterious subjects, mysterious smoke, intense artistic chiaroscuro painting atmosphere, dramatic cinematic storytelling --ar 16:9 --v 6.0`
      },
      {
        label: "Phác họa ý tưởng trừu tượng bí ẩn",
        template: (label: string) => `A surreal high-concept artistic vision of: ${label}, style of master illustrative digital painting, dark moody atmosphere, highly stylized concept art, deep psychological layers, epic scale --ar 16:9 --v 6.0`
      },
      {
        label: "Cuộc đối thoại hoặc xung đột kịch tính",
        template: (label: string) => `A medium over-the-shoulder shot capturing: ${label}. Dramatic interaction, profound eye contact, deep environmental storytelling, mist, moody professional cinematic grading, rich cinematic lens flare --ar 16:9 --v 6.0`
      },
      {
        label: "Góc nhìn thứ nhất (POV View)",
        template: (label: string) => `First-person POV wide-angle immersive view of: ${label}. Highly realistic hand or physical element foreground, intense surrounding details, dramatic light, feeling of instant danger or discovery, volumetric realism --ar 16:9 --v 6.0`
      },
      {
        label: "Bão táp thiên nhiên hoành tráng",
        template: (label: string) => `A grand atmospheric weather shot capturing: ${label}. Torrential rain or thunderous skies, swirling dark clouds and dramatic lightning, environmental chaos, hyper-detailed epic cinematic realism --ar 16:9 --v 6.0`
      }
    ];

    for (let pIndex = 0; pIndex < promptsPerScene; pIndex++) {
      const templateItem = promptTemplates[pIndex % promptTemplates.length];
      const code = `P${sceneNumber}.${pIndex + 1}`;
      const englishPrompt = templateItem.template(shortLabel.replace(/["']/g, ""));
      const words = text.split(/\s+/).filter(Boolean);
      const segmentWordCount = Math.ceil(words.length / promptsPerScene);
      const subTextWords = words.slice(pIndex * segmentWordCount, (pIndex + 1) * segmentWordCount);
      const subText = subTextWords.join(" ") || text;

      imagePrompts.push({
        code,
        vietnameseLabel: `Phân cảnh ${sceneNumber} - ${templateItem.label}`,
        englishPrompt,
        subText
      });
    }
    
    scenes.push({
      sceneNumber,
      timeSegment,
      text,
      visualDescription,
      imagePrompts
    });
  }
  
  return { scenes };
}

function detectLanguageIsEnglish(text: string): boolean {
  if (!text) return false;
  const englishWords = ["the", "and", "of", "to", "is", "you", "that", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "at", "be", "this", "from", "i", "have", "or", "by"];
  let englishWordCount = 0;
  const words = text.toLowerCase().split(/\s+/);
  words.forEach(w => {
    if (englishWords.includes(w)) {
      englishWordCount++;
    }
  });
  return englishWordCount > (words.length * 0.05);
}

function splitVietnameseTextIntoParts(text: string, partsCount: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= partsCount) {
    return Array.from({ length: partsCount }, (_, i) => words[i] || "");
  }
  const chunks: string[] = [];
  const wordsPerPart = Math.ceil(words.length / partsCount);
  for (let i = 0; i < partsCount; i++) {
    const start = i * wordsPerPart;
    const end = Math.min(words.length, (i + 1) * wordsPerPart);
    const chunkText = words.slice(start, end).join(" ");
    chunks.push(chunkText || "...");
  }
  return chunks;
}

function smartSplitTextIntoTwo(text: string, isVietnamese: boolean): { part1: string, part2: string } | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 10) return null; // Quá ngắn thì không bóc tách

  const centerPos = text.length / 2;
  const breakChars = ["—", ";", ","];
  if (!isVietnamese) {
    breakChars.push("-");
  }
  
  let bestCharIdx = -1;
  let minDistanceToCenter = Infinity;

  for (const char of breakChars) {
    let idx = text.indexOf(char);
    while (idx !== -1) {
      const ratio = idx / text.length;
      if (ratio >= 0.22 && ratio <= 0.78) {
        const distance = Math.abs(idx - centerPos);
        if (distance < minDistanceToCenter) {
          minDistanceToCenter = distance;
          bestCharIdx = idx;
        }
      }
      idx = text.indexOf(char, idx + 1);
    }
  }

  if (bestCharIdx !== -1) {
    let part1 = text.slice(0, bestCharIdx).trim();
    let part2 = text.slice(bestCharIdx).trim();
    if (part2.startsWith(",") || part2.startsWith(";")) {
      part2 = part2.slice(1).trim();
    } else if (part2.startsWith("—")) {
      part2 = part2.slice(1).trim();
    }
    
    if (part1.split(/\s+/).length >= 3 && part2.split(/\s+/).length >= 3) {
      return { part1, part2 };
    }
  }

  const conjunctions = isVietnamese 
    ? [" thì ", " nhưng ", " mà ", " và ", " tuy nhiên "] 
    : [" but ", " while ", " and ", " then ", " though "];

  let bestWordIdx = -1;
  minDistanceToCenter = Infinity;

  for (const conj of conjunctions) {
    let idx = text.toLowerCase().indexOf(conj);
    while (idx !== -1) {
      const ratio = idx / text.length;
      if (ratio >= 0.22 && ratio <= 0.78) {
        const distance = Math.abs(idx - centerPos);
        if (distance < minDistanceToCenter) {
          minDistanceToCenter = distance;
          bestWordIdx = idx;
        }
      }
      idx = text.toLowerCase().indexOf(conj, idx + 1);
    }
  }

  if (bestWordIdx !== -1) {
    const part1 = text.slice(0, bestWordIdx).trim();
    const part2 = text.slice(bestWordIdx).trim();
    if (part1.split(/\s+/).length >= 3 && part2.split(/\s+/).length >= 3) {
      return { part1, part2 };
    }
  }

  const midPoint = Math.floor(words.length / 2);
  const part1 = words.slice(0, midPoint).join(" ");
  const part2 = words.slice(midPoint).join(" ");
  return { part1, part2 };
}

function enhanceStoryboardDensity(scenes: any[], style: string = "", preserveDialogueBoundaries: boolean = false): any[] {
  if (!scenes || !Array.isArray(scenes)) return scenes;
  return scenes.map((scene: any) => {
    if (!scene || !scene.text) return scene;
    const text = scene.text.trim();
    const isEn = detectLanguageIsEnglish(text);
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    
    const isVietnamese = !isEn;
    // Ngưỡng cứng để ép số lượng prompt phù hợp tối giản bám sát phản hồi người dùng
    // Tiếng Anh: ngắn/vừa <= 20 từ (1 prompt), trung bình 21-28 từ (1-2 prompts), cực dài > 28 từ (cho phép 2-3 prompts)
    // Tiếng Việt: ngắn/vừa <= 24 từ (1 prompt), trung bình 25-32 từ (1-2 prompts), cực dài > 32 từ (cho phép 2-3 prompts)
    const maxShortWords = isVietnamese ? 24 : 20;
    const minLongWords = isVietnamese ? 25 : 21;
    const maxMediumWords = isVietnamese ? 32 : 28;

    // 1. Đảm bảo có ít nhất 1 prompt
    if (!scene.imagePrompts || !Array.isArray(scene.imagePrompts) || scene.imagePrompts.length === 0) {
      scene.imagePrompts = [{
        code: `P${scene.sceneNumber}.1`,
        vietnameseLabel: "Cảnh minh họa chi tiết",
        englishPrompt: `High fidelity dramatic cinematic scene of: "${text.slice(0, 80)}". Style: ${style || "cinematic dark storytelling, hyper-detailed, 8k"}`,
        subText: text
      }];
    }

    // 2. Ép cứng câu ngắn/vừa chỉ được phép có đúng 1 prompt duy nhất (Tránh chia 2-3 prompts không cần thiết)
    if (preserveDialogueBoundaries && scene.imagePrompts.length > 1) {
      scene.imagePrompts = scene.imagePrompts.slice(0, 1);
    }

    if (wordCount <= maxShortWords && scene.imagePrompts.length > 1) {
      scene.imagePrompts = scene.imagePrompts.slice(0, 1);
    }

    // 3. Giới hạn câu trung bình có tối đa 2 prompts (Tránh bị bẻ sang 3 prompts dư thừa)
    if (wordCount > maxShortWords && wordCount <= maxMediumWords && scene.imagePrompts.length > 2) {
      scene.imagePrompts = scene.imagePrompts.slice(0, 2);
    }

    // 4. Ép cứng câu rất dài kịch tính phải có ít nhất 2 prompt
    if (!preserveDialogueBoundaries && wordCount >= minLongWords && scene.imagePrompts.length === 1) {
      const splitResult = smartSplitTextIntoTwo(text, isVietnamese);
      if (splitResult) {
        const basePrompt = scene.imagePrompts[0];
        const part1 = splitResult.part1;
        const part2 = splitResult.part2;

        const cleanBasePrompt = basePrompt.englishPrompt.replace(/--ar\s+\d+:\d+/g, "").trim();
        const englishPrompt1 = `${cleanBasePrompt} --ar 16:9`;
        
        // Pick an elegant, totally different camera shot/angle variation to avoid repeating the main scene
        const shotVariations = [
          "Extreme close-up macro portrait focusing intensely on the facial expressions and emotional distress, shallow depth of field, stunning lighting",
          "Dramatic high-angle crane overview shot, looking down at the character, dynamic long shadows, atmospheric foggy background",
          "Over-the-shoulder medium scenic shot from behind, looking out at the epic environment, volumetric dust particles, cinematic depth",
          "Macro close-up shot focusing on hands or a nearby key item/environment detail, volumetric rays cutting through haze",
          "Low-angle action shot looking up at the character, powerful posture, spectacular contrast, chiaroscuro lighting, volumetric atmosphere"
        ];
        
        const shotType = shotVariations[Number(scene.sceneNumber) % shotVariations.length];
        const englishPrompt2 = `${shotType}. Transitioning and continuing the scene content of: ${cleanBasePrompt.slice(0, 180)}... --ar 16:9`;

        scene.imagePrompts = [
          {
            code: `P${scene.sceneNumber}.1`,
            vietnameseLabel: `${basePrompt.vietnameseLabel || "Nhịp 1"} (Phần 1)`,
            englishPrompt: englishPrompt1,
            subText: part1,
            subText_vi: isVietnamese ? part1 : undefined,
            subText_en: isEn ? part1 : undefined
          },
          {
            code: `P${scene.sceneNumber}.2`,
            vietnameseLabel: `Nối tiếp kịch tính (Phần 2)`,
            englishPrompt: englishPrompt2,
            subText: part2,
            subText_vi: isVietnamese ? part2 : undefined,
            subText_en: isEn ? part2 : undefined
          }
        ];
      }
    }

    // 4. Đồng bộ hóa mã code và subText
    if (scene.imagePrompts.length === 1) {
      scene.imagePrompts[0].code = `P${scene.sceneNumber}.1`;
      scene.imagePrompts[0].subText = text;
      if (isEn) {
        scene.imagePrompts[0].subText_en = text;
      } else {
        scene.imagePrompts[0].subText_vi = text;
      }
    } else {
      // Trường hợp có từ 2 prompt trở lên, chia đều câu thoại gốc thành các phần tương ứng
      const textParts = splitVietnameseTextIntoParts(text, scene.imagePrompts.length);
      scene.imagePrompts.forEach((p: any, pIdx: number) => {
        p.code = `P${scene.sceneNumber}.${pIdx + 1}`;
        if (!p.subText || p.subText.trim() === "" || p.subText === text) {
          p.subText = textParts[pIdx] || text;
        }
        if (isEn) {
          p.subText_en = p.subText;
        } else {
          p.subText_vi = p.subText;
        }
      });
    }

    // Gán dữ liệu song ngữ ban đầu
    if (isEn) {
      if (!scene.text_en) scene.text_en = text;
      scene.imagePrompts.forEach((p: any) => {
        if (!p.subText_en) p.subText_en = p.subText;
      });
    } else {
      if (!scene.text_vi) scene.text_vi = text;
      scene.imagePrompts.forEach((p: any) => {
        if (!p.subText_vi) p.subText_vi = p.subText;
      });
    }

    return scene;
  });
}

function generateSeoSeedingProgrammatically(script: string, channelName: string = "Channel VIP", targetKeywords: string = "", includeChapters: boolean = false, includeTracklist: boolean = false): any {
  const topic = script.replace(/\s+/g, " ").slice(0, 56).trim();
  const fallbackTitleOptions = [
    `Khám phá ${topic}: Điều gì thực sự xảy ra?`,
    `Sự thật phía sau ${topic}`,
    `${topic} | Góc nhìn đáng suy ngẫm`,
    `Chi tiết ít người biết về ${topic}`
  ].map((value) => value.slice(0, 68));
  const kw = targetKeywords.trim() || "kịch tính";
  const title = `BÍ ẨN KINH HOÀNG: Sự Thật Về ${script.slice(0, 30).trim()}... (Cực Kỳ Cuốn Hút)`;
  
  const seoDescription = `Khám phá câu chuyện kịch tính và đầy bí ẩn: ${script.slice(0, 150).trim()}... \nHãy cùng kênh ${channelName} đi sâu vào phân tích những chi tiết ít ai biết về chủ đề ${kw} đầy lôi cuốn này. \n\n🔔 Đăng ký kênh ${channelName} ngay để không bỏ lỡ những video tiếp theo về ${kw}!\n#${kw.replace(/\s+/g, '')} #bi_an #kịch_tính #storytelling`;

  const tags = {
    primaryKeyword: kw,
    secondaryKeyword: `bí ẩn ${kw}`,
    channelTag: channelName,
    competitorTags: [`khám phá ${kw}`, "truyện kỳ bí", "kể chuyện 2026", "bí ẩn lịch sử"]
  };

  const thumbnailConcept = {
    visualIdea: `Hình ảnh một góc tối huyền bí đầy sương mù, ở giữa nổi bật một vật thể kỳ bí phát ra ánh sáng đỏ lập lòe thu hút ánh nhìn tò mò.`,
    thumbnailText: `SỰ THẬT KINH HOÀNG VỀ ${kw.toUpperCase()}!`,
    imagePrompt: `A cinematic mystery concept, dark atmospheric mist, a mysterious glowing red artifact in the center of an ancient deep forest, dramatic lighting, high contrast, 8k --ar 16:9`
  };

  const seedingComments = [
    {
      accountType: "Khán giả tò mò tranh luận",
      commentText: `Xem đến phút 02:15 mà rợn cả tóc gáy! Có ai nghĩ giống mình là người đàn ông kia cố ý làm vậy không? Video quá xuất sắc ad ơi, hóng phần tiếp theo!`
    },
    {
      accountType: "Khán giả bổ sung kiến thức",
      commentText: `Mình đã từng đọc về câu chuyện này trong một tài liệu cổ. Chi tiết về ${kw} thực chất còn đáng sợ hơn thế này nhiều. Kênh làm nội dung rất có tâm và đầu tư!`
    },
    {
      accountType: "Khán giả hoài nghi kích thích tương tác",
      commentText: `Mọi người tin câu chuyện này là thật sao? Bản thân mình thấy có vài điểm vô lý, nhưng phải công nhận là ad kể chuyện quá cuốn, không thể rời mắt được một giây nào!`
    },
    {
      accountType: "Fan trung thành ủng hộ kênh",
      commentText: `Đã theo dõi kênh ${channelName} từ những ngày đầu và chưa bao giờ thất vọng. Đề tài ${kw} này quá đỉnh luôn. Chúc kênh sớm đạt triệu sub nhé!`
    }
  ];

  return {
    seoTitle: fallbackTitleOptions[0] || title,
    titleOptions: [...fallbackTitleOptions, title].filter((value, index, all) => value && all.indexOf(value) === index),
    seoDescription,
    tags,
    thumbnailConcept,
    seedingComments
  };
}

// BONUS: Bóc tách kịch bản từ Video hoặc Audio (Video/Audio to Transcript using Gemini 3.5 Flash)
app.post("/api/transcribe-video", async (req, res) => {
  try {
    const { base64Data, mimeType, fileName } = req.body;
    console.log(`[POST /api/transcribe-video] Received file: ${fileName || "unknown"}, mime: ${mimeType}, base64 length: ${base64Data?.length || 0}`);
    
    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: "Dữ liệu tập tin hoặc định dạng không hợp lệ." });
    }

    const ai = getGeminiClient();
    
    const prompt = 
      "Hãy xem kĩ video này hoặc nghe kĩ âm thanh này, sau đó trích xuất toàn bộ kịch bản lời thoại (transcript) bằng Tiếng Việt đầy đủ và chính xác nhất.\n\n" +
      "YÊU CẦU QUAN TRỌNG:\n" +
      "1. Chỉ ghi lại những lời thoại thực tế được nói trong video/âm thanh. Tuyệt đối KHÔNG tự sáng tạo thêm lời thoại mới ngoài video/âm thanh, KHÔNG tóm tắt hay cắt bớt cốt truyện.\n" +
      "2. Phân tách kịch bản thành các đoạn văn mạch lạc, tự nhiên. Tránh thêm các mốc thời gian thừa thãi, mốc giây (ví dụ: 00:01), hay tên người nói (ví dụ: Nhân vật A:, Loa:) để có được một kịch bản đọc trơn tru nhất.\n" +
      "3. Trả về kết quả trực tiếp dưới dạng văn bản kịch bản thô. Tuyệt đối không thêm lời chào, lời mở đầu hay kết thúc của AI (ví dụ: 'Dưới đây là kịch bản...').";

    const response = await generateContentWithFallback(ai, {
      model: "gemini-1.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        temperature: 0.4
      }
    });

    if (response && response.text) {
      const transcript = cleanAiResponseBoilerplate(response.text.trim());
      console.log(`[POST /api/transcribe-video] Succeeded. Extracted transcript length: ${transcript.length}`);
      res.json({ transcript });
    } else {
      res.status(500).json({ error: "Không thể nhận diện kịch bản từ tập tin video/audio này. Hãy chắc chắn tập tin có tiếng nói to rõ." });
    }
  } catch (error: any) {
    console.error("Lỗi trong /api/transcribe-video:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi xử lý bóc tách kịch bản từ video." });
    }
  }
});

function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] || null;
    if (parsed.hostname.endsWith("youtube.com")) {
      return parsed.searchParams.get("v") || parsed.pathname.match(/\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1] || null;
    }
  } catch {
    return null;
  }
  return null;
}

function extractJsonArray(html: string, marker: string): unknown[] | null {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = html.indexOf("[", markerIndex + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let quote = false;
  let escaping = false;
  for (let index = start; index < html.length; index++) {
    const character = html[index];
    if (quote) {
      if (escaping) escaping = false;
      else if (character === "\\") escaping = true;
      else if (character === '"') quote = false;
      continue;
    }
    if (character === '"') quote = true;
    else if (character === "[") depth++;
    else if (character === "]" && --depth === 0) {
      try { return JSON.parse(html.slice(start, index + 1)); } catch { return null; }
    }
  }
  return null;
}

function decodeTranscriptText(text: string) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ").trim();
}

async function getYouTubeCaptions(url: string): Promise<string | null> {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36", "Accept-Language": "vi,en;q=0.9" };
  const page = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=vi`, { headers });
  if (!page.ok) return null;
  const tracks = extractJsonArray(await page.text(), '"captionTracks":') as Array<{ baseUrl?: string; languageCode?: string }> | null;
  const track = tracks?.find((item) => item.languageCode === "vi") || tracks?.find((item) => item.languageCode === "en") || tracks?.[0];
  if (!track?.baseUrl) return null;
  const captionUrl = new URL(track.baseUrl);
  captionUrl.searchParams.set("fmt", "json3");
  const captions = await fetch(captionUrl, { headers });
  if (!captions.ok) return null;
  const payload = await captions.json() as { events?: Array<{ segs?: Array<{ utf8?: string }> }> };
  const transcript = (payload.events || []).map((event) => (event.segs || []).map((segment) => segment.utf8 || "").join("")).join(" ");
  return decodeTranscriptText(transcript) || null;
}

async function resolveInstagramMediaFromChrome(url: string): Promise<{ base64Data?: string; mimeType: string; mediaUrl?: string } | null> {
  // This opens a short-lived tab in the user's already-connected Chrome profile.
  // We only read the media URL rendered for the Reel; cookies are never read,
  // copied, returned, or stored by this application.
  await initPlaywright(false, "preserve", 9222);
  const connectedPage = getPlaywrightPage();
  if (!connectedPage) return null;
  const page = await connectedPage.context().newPage();
  try {
    const mediaResponse = page.waitForResponse((response) => {
      const contentType = response.headers()["content-type"] || "";
      const requestType = response.request().resourceType();
      return requestType === "media" || /^(video|audio)\//i.test(contentType) || /\.(?:mp4|m4a)(?:\?|$)/i.test(response.url());
    }, { timeout: 45000 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    const video = page.locator("video").first();
    await video.waitFor({ state: "attached", timeout: 30000 });
    await video.evaluate((element: HTMLVideoElement) => {
      element.muted = true;
      void element.play().catch(() => {});
    });
    const response = await mediaResponse;
    const bytes = await response.body();
    if (!bytes.length || bytes.length > 35 * 1024 * 1024) return null;
    const detectedMimeType = response.headers()["content-type"]?.split(";")[0] || "";
    const mimeType = /^(video|audio)\//i.test(detectedMimeType) ? detectedMimeType : "video/mp4";
    console.log(`[Instagram Chrome] Captured ${bytes.length} bytes, content type: ${detectedMimeType || "unknown"}, using: ${mimeType}`);
    // Small responses are only MP4 initialization/range chunks. The signed CDN
    // URL itself can be downloaded by the server as a complete media file.
    if (bytes.length < 64 * 1024) {
      const fullMediaUrl = new URL(response.url());
      // Instagram's player requests an MP4 byte range first. Remove that
      // range so the server downloads the complete, signed CDN asset.
      fullMediaUrl.searchParams.delete("bytestart");
      fullMediaUrl.searchParams.delete("byteend");
      return { mediaUrl: fullMediaUrl.toString(), mimeType };
    }
    return { base64Data: bytes.toString("base64"), mimeType };
  } catch (error) {
    console.warn("[Instagram Chrome] Could not resolve Reel media:", error);
    return null;
  } finally {
    await page.close().catch(() => {});
  }
}

// BONUS: Tải và bóc tách kịch bản trực tiếp từ liên kết TikTok, Facebook, Instagram, YouTube
app.post("/api/transcribe-social-link", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Vui lòng nhập đường dẫn liên kết mạng xã hội hợp lệ." });
    }

    console.log(`[POST /api/transcribe-social-link] Received URL: ${url}`);
    let mediaUrl = "";
    let mimeType = "video/mp4";
    let preloadedBase64 = "";

    // 1. YouTube: ưu tiên phụ đề có sẵn. Cách này nhanh hơn, không phụ thuộc dịch vụ tải video
    // và không gửi cả video qua API khi clip đã có caption công khai.
    if (getYouTubeVideoId(url)) {
      try {
        const transcript = await getYouTubeCaptions(url);
        if (transcript) {
          console.log(`[YouTube captions] Extracted transcript length: ${transcript.length}`);
          return res.json({ transcript, source: "youtube-captions" });
        }
        console.log("[YouTube captions] No public captions found; falling back to audio extraction.");
      } catch (err) {
        console.warn("[YouTube captions] Failed; falling back to audio extraction:", err);
      }
    }

    // 2. Instagram often blocks anonymous downloaders. Reuse the already
    // logged-in Chrome profile in a temporary tab instead of exporting cookies.
    if (/instagram\.com/i.test(url)) {
      try {
        const instagramMedia = await resolveInstagramMediaFromChrome(url);
        if (instagramMedia) {
          preloadedBase64 = instagramMedia.base64Data || "";
          mediaUrl = instagramMedia.mediaUrl || "";
          mimeType = instagramMedia.mimeType;
          console.log(`[Instagram Chrome] Resolved Reel media from authenticated browser tab (${preloadedBase64 ? "captured data" : "CDN URL"}).`);
        }
      } catch (error) {
        console.warn("[Instagram Chrome] Browser fallback failed:", error);
      }
    }

    // 3. Nếu là link TikTok, ưu tiên dùng API TikWM (Rất mượt và chống chặn cực mạnh)
    const isTikTok = url.includes("tiktok.com");
    if (isTikTok) {
      try {
        console.log("[Social Downloader] Attempting TikWM for TikTok...");
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const result = await response.json();
        if (result && result.code === 0 && result.data) {
          // data.music là file âm thanh (nhẹ hơn, tải nhanh hơn), data.play là video
          mediaUrl = result.data.music || result.data.play;
          mimeType = result.data.music ? "audio/mpeg" : "video/mp4";
          console.log(`[Social Downloader] TikWM resolved success: ${mediaUrl}`);
        }
      } catch (err) {
        console.warn("[Social Downloader] TikWM error, falling back to Cobalt:", err);
      }
    }

    // 4. Sử dụng dịch vụ Cobalt API (Hỗ trợ TikTok, FB, IG, YouTube, v.v. hoàn toàn miễn phí và không cần key)
    if (!mediaUrl && !preloadedBase64) {
      const cobaltInstances = [
        "https://api.cobalt.tools/api/json",
        "https://co.wuk.sh/api/json"
      ];

      for (const instance of cobaltInstances) {
        try {
          console.log(`[Social Downloader] Trying Cobalt instance: ${instance}`);
          const response = await fetch(instance, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              url: url,
              downloadMode: "audio" // Ưu tiên chỉ lấy Audio để dung lượng siêu nhẹ, tiết kiệm tài nguyên & bóc tách cực nhanh
            })
          });

          if (response.ok) {
            const result = (await response.json()) as any;
            if (result && result.url) {
              mediaUrl = result.url;
              mimeType = "audio/mpeg";
              console.log(`[Social Downloader] Cobalt resolved successfully: ${mediaUrl}`);
              break;
            } else if (result && result.picker && result.picker.length > 0) {
              mediaUrl = result.picker[0].url;
              mimeType = "video/mp4";
              console.log(`[Social Downloader] Cobalt resolved picker success: ${mediaUrl}`);
              break;
            }
          }
        } catch (err) {
          console.warn(`[Social Downloader] Cobalt instance ${instance} failed:`, err);
        }
      }
    }

    // 5. yt-dlp fallback if mediaUrl is empty
    if (!mediaUrl && !preloadedBase64) {
      console.log(`[Social Downloader] Cobalt failed. Falling back to yt-dlp...`);
      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, `social_audio_${Date.now()}.m4a`);
      
      try {
        await new Promise<void>((resolve, reject) => {
          exec(`yt-dlp -f "bestaudio" -x --audio-format m4a -o "${tempFile}" "${url}"`, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });

        if (fs.existsSync(tempFile)) {
          const buffer = fs.readFileSync(tempFile);
          fs.unlinkSync(tempFile);
          if (buffer.length > 35 * 1024 * 1024) {
             return res.status(400).json({ error: "Tập tin âm thanh từ yt-dlp vượt quá giới hạn 35MB." });
          }
          preloadedBase64 = buffer.toString("base64");
          mimeType = "audio/mp4";
          console.log(`[Social Downloader] yt-dlp success. Size: ${buffer.length} bytes.`);
        }
      } catch (err) {
        console.warn(`[Social Downloader] yt-dlp fallback failed:`, err);
      }
    }

    if (!mediaUrl && !preloadedBase64) {
      return res.status(400).json({
        error: "Không thể lấy nội dung từ link video này. Nền tảng có thể đang chặn hoặc liên kết riêng tư. Hãy tải tệp về máy và dùng chức năng 'Tải tệp tin lên'."
      });
    }

    let base64Data = preloadedBase64;

    // 6. Tải file từ mediaUrl về nếu yt-dlp không chạy
    if (!preloadedBase64 && mediaUrl) {
      console.log(`[Social Downloader] Downloading media from resolved URL: ${mediaUrl}`);
      const mediaResponse = await fetch(mediaUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (!mediaResponse.ok) {
        throw new Error(`Không thể tải tập tin từ liên kết nguồn (Status: ${mediaResponse.status}).`);
      }

      const arrayBuffer = await mediaResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Kiểm tra giới hạn 35MB
      if (buffer.length > 35 * 1024 * 1024) {
        return res.status(400).json({ error: "Tập tin video/audio vượt quá giới hạn 35MB. Vui lòng sử dụng video ngắn hơn." });
      }

      base64Data = buffer.toString("base64");
      console.log(`[Social Downloader] Base64 conversion success. Size: ${buffer.length} bytes.`);
    }

    console.log(`[Social Downloader] Feeding to Gemini 3.5 Flash...`);

    const ai = getGeminiClient();
    const prompt = 
      "Hãy xem kĩ video này hoặc nghe kĩ âm thanh này, sau đó trích xuất toàn bộ kịch bản lời thoại (transcript) bằng Tiếng Việt đầy đủ và chính xác nhất.\n\n" +
      "YÊU CẦU QUAN TRỌNG:\n" +
      "1. Chỉ ghi lại những lời thoại thực tế được nói trong video/âm thanh. Tuyệt đối KHÔNG tự sáng tạo thêm lời thoại mới ngoài video/âm thanh, KHÔNG tóm tắt hay cắt bớt cốt truyện.\n" +
      "2. Phân tách kịch bản thành các đoạn văn mạch lạc, tự nhiên. Tránh thêm các mốc thời gian thừa thãi, mốc giây (ví dụ: 00:01), hay tên người nói (ví dụ: Nhân vật A:, Loa:) để có được một kịch bản đọc trơn tru nhất.\n" +
      "3. Trả về kết quả trực tiếp dưới dạng văn bản kịch bản thô. Tuyệt đối không thêm lời chào, lời mở đầu hay kết thúc của AI (ví dụ: 'Dưới đây là kịch bản...').";

    const response = await generateContentWithFallback(ai, {
      model: "gemini-1.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        temperature: 0.4
      }
    });

    if (response && response.text) {
      const transcript = cleanAiResponseBoilerplate(response.text.trim());
      console.log(`[Social Downloader] Succeeded transcribing. Extracted transcript length: ${transcript.length}`);
      res.json({ transcript });
    } else {
      res.status(500).json({ error: "Không thể nhận diện kịch bản từ tập tin video/audio này. Hãy chắc chắn tập tin có tiếng nói to rõ." });
    }

  } catch (error: any) {
    console.error("Lỗi trong /api/transcribe-social-link:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi xử lý tải và bóc tách kịch bản từ mạng xã hội." });
    }
  }
});

// BƯỚC 1: Chuẩn hóa kịch bản (Transcript Standardizer)
app.post("/api/write-script-from-idea", async (req, res) => {
  try {
    const { idea, language = "vi", lengthMode = "duration", targetCharacters = 5000, targetSeconds = 300 } = req.body;
    if (!idea || typeof idea !== "string" || !idea.trim()) return res.status(400).json({ error: "Hãy nhập mô tả nội dung video hoặc ý tưởng kịch bản." });
    const requestedSeconds = Math.max(15, Math.min(4 * 60 * 60, Number(targetSeconds) || 300));
    // Character count is a poor proxy for spoken Vietnamese duration. Generate
    // against spoken words, then validate the result after generation.
    const targetWords = lengthMode === "characters"
      ? 0
      : Math.max(15, Math.round(requestedSeconds / 60 * narrationWordsPerMinute(language)));
    const chars = Math.max(300, Math.min(30000, Number(lengthMode === "characters" ? targetCharacters : Math.round(targetWords * 6.6)) || 5000));
    const languageName = language === "en" ? "English" : language === "zh" ? "Chinese" : language === "ja" ? "Japanese" : language === "ko" ? "Korean" : "Vietnamese";
    const durationRequirement = targetWords
      ? `Target voice duration: ${Math.round(requestedSeconds)} seconds. Write ${targetWords} spoken words, with an allowed range of ${Math.floor(targetWords * 0.97)}-${Math.ceil(targetWords * 1.03)} words. Count spoken tokens separated by spaces before responding.`
      : `Target length: about ${chars} characters.`;
    const prompt = `Write a complete, engaging YouTube narration script in ${languageName} from this brief:\n${idea.trim()}\n\n${durationRequirement} Use a strong hook in the first 2-3 sentences, a clear story arc, natural spoken language, and an emotionally satisfying ending. Return only the finished narration script, without title, notes, timestamps, headings, word count, or AI commentary.`;
    const ai = getGeminiClient();
    const response = await generateContentWithFallback(ai, { model: "gemini-1.5-flash", contents: prompt, config: { temperature: 0.8 } });
    let script = cleanAiResponseBoilerplate(String(response?.text || ""));
    if (!script) throw new Error("AI không trả về nội dung kịch bản.");
    if (targetWords) {
      const currentWords = countNarrationWords(script);
      const allowedDelta = Math.max(4, Math.round(targetWords * 0.03));
      if (Math.abs(currentWords - targetWords) > allowedDelta) {
        try {
          const correction = await generateContentWithFallback(ai, {
            model: "gemini-1.5-flash",
            contents: `Rewrite this narration to ${targetWords} spoken words (allowed range ${targetWords - allowedDelta} to ${targetWords + allowedDelta}). Preserve the language, facts, characters, story arc, hook, and ending. Return only the narration; no title, notes, or word count.\n\n${script}`,
            config: { temperature: 0.15 },
          });
          const candidate = cleanAiResponseBoilerplate(String(correction?.text || ""));
          if (candidate && Math.abs(countNarrationWords(candidate) - targetWords) < Math.abs(currentWords - targetWords)) script = candidate;
        } catch (correctionError: any) {
          console.warn("[/api/write-script-from-idea] Duration correction skipped:", correctionError?.message || correctionError);
        }
      }
    }
    const wordCount = countNarrationWords(script);
    res.json({ script, targetCharacters: chars, targetWords: targetWords || undefined, wordCount, estimatedDurationSeconds: Math.round(wordCount / narrationWordsPerMinute(language) * 60) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Không thể viết kịch bản từ mô tả." });
  }
});

function isAffiliateSalesScript(value: string) {
  const text = String(value || "").toLowerCase();
  const salesSignals = [
    "giỏ hàng", "link bio", "link ở bio", "freeship", "miễn phí vận chuyển",
    "mã giảm", "ưu đãi", "đặt mua", "săn ngay", "mua ngay", "tiktok shop",
    "call to action", "cta", "tên sản phẩm", "tên cuốn sách", "link ở tiểu sử"
  ];
  const hasSalesSignal = salesSignals.some(signal => text.includes(signal));
  const hasDialogueStructure = /\[(?:chữ trên màn hình|giọng voiceover|voiceover|hook|cta)/i.test(value) || /(?:mẹ|bé|nhân vật|host)\s*\(/i.test(value);
  return hasSalesSignal && hasDialogueStructure;
}

function countNarrationWords(value: string) {
  // Count spoken tokens consistently for Vietnamese and whitespace-delimited
  // languages. Labels/timestamps are not part of voice duration.
  return String(value || "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d{1,2}:\d{2}/g, " ")
    .trim().split(/\s+/).filter(Boolean).length;
}

function narrationWordsPerMinute(language: string) {
  const normalized = String(language || "").toLowerCase();
  if (normalized.startsWith("en")) return 145;
  if (normalized.startsWith("zh") || normalized.startsWith("ja") || normalized.startsWith("ko")) return 170;
  return 150;
}

function targetWordsForMinutes(minutes: unknown, language: string) {
  const safeMinutes = Math.max(0.1, Number(String(minutes ?? "").replace(",", ".")) || 0.1);
  // Vietnamese narration commonly lands around 150 spoken syllables/min at
  // natural TTS speed; English is typically a little slower in word count.
  const wordsPerMinute = narrationWordsPerMinute(language);
  return Math.max(15, Math.round(safeMinutes * wordsPerMinute));
}

app.post("/api/process-script", async (req, res) => {
  try {
    const { transcript, language = "original", editRequest, rewriteScript = false, newScriptLength = "equal", rewriteLengthMode = "source", targetWords, targetDurationMinutes, contentGenre = "", additionalInstructions = "", modifyIntroOnly = false } = req.body;
    console.log(`[POST /api/process-script] Request keys: transcriptLength=${transcript?.length || 0}, language=${language}, editRequest=${editRequest || "none"}, rewriteScript=${rewriteScript}, newScriptLength=${newScriptLength}, modifyIntroOnly=${modifyIntroOnly}`);
    
    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Nội dung transcript không hợp lệ" });
    }

    // 1. Tự động dọn dẹp sơ bộ trước bằng code (Cực kỳ chính xác và nhanh)
    const programmaticallyCleaned = cleanTranscriptProgrammatically(transcript);

    // Nếu văn bản cực kỳ ngắn hoặc rỗng sau khi dọn dẹp (và không có yêu cầu sửa kịch bản sẵn)
    if (!programmaticallyCleaned.trim() && !editRequest) {
      console.log(`[POST /api/process-script] Falling back programmatically because cleaned transcript is empty and there is no editRequest.`);
      return res.json({ 
        processedScript: transcript,
        isProgrammaticFallback: true 
      });
    }

    // Nếu người dùng không chọn viết lại và giữ nguyên ngôn ngữ, Bước 1 chỉ
    // dọn định dạng: bỏ timestamp, ghép dòng, viết hoa đầu câu và thêm dấu câu.
    // Không gửi sang AI để tránh AI tự đổi cách diễn đạt hoặc thêm bớt nội dung.
    if (!editRequest && !rewriteScript) {
      console.log("[POST /api/process-script] Preserving original script exactly because rewrite is disabled.");
      return res.json({
        processedScript: transcript,
        isProgrammaticFallback: true,
      });
    }

    // 2. Gọi AI để trau chuốt câu từ & ngữ pháp với cơ chế timeout 10 giây
    let aiPassed = false;
    let finalScript = "";
    let lastError: any = null;
    let exactTargetWords = 0;
    let exactTargetTolerance = 0.05;

    try {
      const ai = getGeminiClient();
      
      let langInstruction = "";
      if (language === "original" || !language) {
        langInstruction = "Hãy sửa bài viết/kịch bản dưới đây bằng CHÍNH ngôn ngữ gốc của nó để từ ngữ tự nhiên, mạch lạc, sửa lỗi chính tả/ngắt câu đầy đủ và đúng quy chuẩn phát âm nói.";
      } else if (language === "vi") {
        langInstruction = "Hãy dịch và viết lại kịch bản dưới đây sang Tiếng Việt chuẩn chỉnh, hành văn cuốn hút tự nhiên bám sát gốc, sửa lỗi chính tả và ngắt câu đầy đủ.";
      } else if (language === "en") {
        langInstruction = "Please translate and rewrite the script below into fluent, high-retention English, keeping the storyline and correcting grammar/punctuation.";
      } else if (language === "zh") {
        langInstruction = "请将以下脚本翻译并改写为流畅自然的中文（Tiếng Trung），修正错别字并进行合理的断句，保持原故事背景。";
      } else if (language === "ja") {
        langInstruction = "以下のスクリプトを自然で流暢な日本語（Tiếng Nhật）に翻訳・推敲し、誤字脱字を修正して適切に改行し、元のストーリーを反映してください。";
      } else if (language === "ko") {
        langInstruction = "다음 스크립트를 자연스럽고 매끄러운 한국어（Tiếng Hàn）로 번역 및 교정하여 맞춤법을 시정하고 문장을 보기 좋게 단락으로 나누어 주십시오.";
      }

      let prompt = "";
      const strictRules = "\nKHÔNG ĐƯỢC thêm bất kỳ lời bình luận, câu chào hỏi, lời hứa hẹn quảng cáo hay câu giới thiệu giải thích nào ở đầu hoặc cuối kết quả (Tuyệt đối KHÔNG viết: 'Dưới đây là...', 'Đây là bản dịch...', '***', '---', v.v.). CHỈ xuất ra duy nhất văn bản kịch bản hoàn chỉnh, sạch sẽ.";

      if (editRequest && editRequest.trim()) {
        prompt = langInstruction + strictRules + "\n" +
          "Bạn nhận được một yêu cầu chỉnh sửa kịch bản đặc biệt từ phía người dùng: \"" + editRequest + "\".\n" +
          "Hãy đọc kịch bản hiện tại bên dưới và thực hiện chỉnh sửa nó theo chính xác yêu cầu của người dùng (ví dụ: thay đổi tên nước, đổi nhân vật, điều chỉnh một số chi tiết cốt truyện, chỉnh phong cách...).\n" +
          "Lưu ý:\n" +
          "- Giữ vững mạch lạc câu chuyện và nhịp điệu cuốn hút nguyên bản.\n" +
          "- Sửa lại cấu trúc viết hoa chữ cái đầu câu, sửa lỗi chính tả, ngắt câu rõ ràng bằng dòng trống (xuống dòng kép).\n" +
          "- Cho ra kết quả là toàn bộ kịch bản hoàn chỉnh sau khi đã chỉnh sửa tích hợp yêu cầu, không giải thích gì thêm ngoài kịch bản mới này.\n\n" +
          "Kịch bản cần chỉnh sửa:\n" +
          "\"\"\"\n" +
          transcript + "\n" +
          "\"\"\"";
      } else {
        const origWordCount = programmaticallyCleaned.trim().split(/\s+/).filter(Boolean).length;
        const origSentenceCount = programmaticallyCleaned.split(/[.!?]+(?:\s+|$)/).filter(p => p.trim().length > 0).length;

        let rewriteInstruction = "";
        if (rewriteScript) {
          rewriteInstruction = "\n⚠️ YÊU CẦU ĐẶC BIỆT: Hãy viết lại phần kịch bản để khác đi (thay đổi cách diễn giải, câu chữ sinh động hơn, dùng lối kể cuốn hút, kịch tính mới) nhưng vẫn hay, hấp dẫn và giữ nguyên cốt truyện/bối cảnh chính như bản gốc.\n";
          
          const requestedWords = rewriteLengthMode === "words"
            ? Math.max(50, Number(targetWords) || 0)
            : rewriteLengthMode === "minutes"
              ? targetWordsForMinutes(targetDurationMinutes, language)
              : rewriteLengthMode === "source" && newScriptLength === "equal"
                ? origWordCount
                : 0;
          if (requestedWords) {
            const tolerance = rewriteLengthMode === "source" ? 0.03 : 0.05;
            exactTargetWords = Math.round(requestedWords);
            exactTargetTolerance = tolerance;
            const minWords = Math.floor(requestedWords * (1 - tolerance));
            const maxWords = Math.ceil(requestedWords * (1 + tolerance));
            rewriteInstruction += `- Về độ dài: Viết lại với độ dài MỤC TIÊU khoảng ${requestedWords} từ. Trước khi trả kết quả, hãy tự đếm từ và chỉ xuất bản thảo trong khoảng ${minWords}–${maxWords} từ. Không rút gọn thành tóm tắt và không được trả thêm bất kỳ ghi chú đếm từ nào.\n`;
          } else if (newScriptLength === "shorter") {
            const minWords = Math.floor(origWordCount * 0.7);
            const maxWords = Math.ceil(origWordCount * 0.85);
            const targetSentences = Math.max(1, Math.round(origSentenceCount * 0.75));
            rewriteInstruction += `- Về độ dài: Hãy viết kịch bản CÔ ĐỌNG, NGẮN HƠN bản gốc khoảng 25-30% để mạch câu chuyện nhanh hơn. Kịch bản gốc có khoảng ${origWordCount} từ và ${origSentenceCount} câu. Bản kịch bản viết lại của bạn phải khống chế trong khoảng từ ${minWords} đến ${maxWords} từ và có khoảng từ ${Math.max(1, targetSentences - 1)} đến ${targetSentences + 1} câu.\n`;
          } else if (newScriptLength === "longer") {
            const minWords = Math.floor(origWordCount * 1.2);
            const maxWords = Math.ceil(origWordCount * 1.35);
            const targetSentences = Math.round(origSentenceCount * 1.3);
            rewriteInstruction += `- Về độ dài: Hãy viết kịch bản CHI TIẾT, DÀI HƠN bản gốc khoảng 25-30% bằng cách bổ sung thêm mô tả bối cảnh, diễn biến kịch tính hoặc lời thoại hấp dẫn. Kịch bản gốc có khoảng ${origWordCount} từ và ${origSentenceCount} câu. Bản kịch bản viết lại của bạn phải khống chế trong khoảng từ ${minWords} đến ${maxWords} từ và có khoảng từ ${targetSentences - 1} đến ${targetSentences + 2} câu.\n`;
          } else {
            // "equal"
            const minWords = Math.floor(origWordCount * 0.9);
            const maxWords = Math.ceil(origWordCount * 1.1);
            rewriteInstruction += `- Về độ dài: Hãy viết kịch bản có ĐỘ DÀI TƯƠNG ĐƯƠNG, GẦN NHƯ BẰNG Y HỆT kịch bản gốc ban đầu. Kịch bản gốc có chính xác ${origWordCount} từ và ${origSentenceCount} câu. Bản kịch bản viết lại của bạn BẮT BUỘC phải khống chế chặt chẽ trong khoảng từ ${minWords} đến ${maxWords} từ, và giữ đúng cấu trúc với chính xác ${origSentenceCount} câu thoại (sai số tối đa cho phép là ±1 câu). Không tự tiện rút ngắn hay kéo dài bừa bãi.\n`;
          }

          if (modifyIntroOnly) {
            rewriteInstruction += "- Phạm vi thay đổi: Chỉ viết lại mỗi phần đoạn mở đầu (khoảng 1 - 2 phân đoạn đầu tiên hoặc phần giới thiệu của kịch bản) để khác đi và lôi cuốn hơn, còn toàn bộ phần thân bài và kết bài sau đó phải được GIỮ NGUYÊN VẸN CHÍNH XÁC từng từ như kịch bản gốc ban đầu.\n";
          }
        } else {
          // Standard standardizing/cleaning/translation - also instruct to keep original length/sentence count
          rewriteInstruction = `\n⚠️ YÊU CẦU ĐỘ DÀI: Giữ nguyên vẹn toàn bộ bối cảnh cốt truyện, nội dung, số lượng từ và số lượng câu của bản gốc (bản gốc có chính xác ${origWordCount} từ và ${origSentenceCount} câu). Bản kết quả của bạn phải có đúng khoảng ${origWordCount} từ (cho phép sai số ±10%) và chính xác ${origSentenceCount} câu thoại.\n`;
        }

        const affiliateInstruction = (String(contentGenre).toLowerCase() === "affiliate" || isAffiliateSalesScript(transcript))
          ? `\n🔒 CHẾ ĐỘ KỊCH BẢN AFFILIATE / BÁN HÀNG: Đây là kịch bản quảng bá sản phẩm, không phải kịch bản kể chuyện thông thường. BẮT BUỘC tuân thủ:
- Giữ nguyên tuyệt đối cấu trúc các khối: [Chữ trên màn hình - Hook], từng lượt hội thoại nhân vật, và [Giọng Voiceover / CTA] cuối video.
- Giữ nguyên người nói, thứ tự lượt thoại, số lượt thoại, ngôn ngữ gốc của từng câu. Nếu một câu là tiếng Anh kèm nghĩa tiếng Việt trong ngoặc, PHẢI giữ dạng song ngữ đó; tuyệt đối không Việt hóa toàn bộ lời thoại tiếng Anh.
- Giữ nguyên tên sản phẩm, placeholder trong ngoặc vuông, ưu đãi, CTA, hướng dẫn giỏ hàng/link Bio và mọi thông tin có thể kiểm chứng. Không bịa thêm tính năng, số liệu, khuyến mãi hoặc cam kết sản phẩm.
- Khi được yêu cầu viết lại, chỉ làm mới câu chữ của Hook và CTA, hoặc làm câu hội thoại tự nhiên hơn trong CÙNG mục đích bán hàng. Không biến kịch bản thành văn kể chuyện chung chung, không thay đổi thông điệp demo sản phẩm.
- Giữ lời thoại ngắn, nói được tự nhiên; Hook rõ lợi ích cụ thể, CTA rõ hành động mua/tìm sản phẩm.\n`
          : "";

        const extraInstruction = String(additionalInstructions || "").trim()
          ? `\nYÊU CẦU BỔ SUNG TỪ NGƯỜI DÙNG: ${String(additionalInstructions).trim()}\nHãy tuân thủ yêu cầu này khi viết, miễn không mâu thuẫn với nội dung gốc.\n`
          : "";
        prompt = langInstruction + strictRules + affiliateInstruction + rewriteInstruction + extraInstruction + "\n" +
          "Sửa lại cấu trúc Viết hoa chữ cái đầu câu, ngắt dấu chấm phẩy rõ ràng, không bỏ bớt hoặc thêm thắt bối cảnh cốt truyện chính ngoài các yêu cầu viết lại đặc biệt ở trên.\n" +
          "Giữ nguyên bối cảnh và các sự kiện trong câu chuyện. Thêm các phân đoạn rõ ràng bằng dòng trống (xuống dòng kép).\n\n" +
          "Văn bản gốc cần trau chuốt/biên dịch:\n" +
          "\"\"\"\n" +
          programmaticallyCleaned + "\n" +
          "\"\"\"";
      }

      console.log(`[POST /api/process-script] Constructed AI prompt. Length: ${prompt.length}`);

      // Tạo một Promise timeout 120 giây
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI_TIMEOUT")), 120000);
      });

      // Đua giữa gọi AI và Timeout
      const response = await Promise.race([
        generateContentWithFallback(ai, {
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            temperature: rewriteScript ? 0.6 : 0.1,
          },
        }),
        timeoutPromise
      ]);

      if (response && response.text) {
        finalScript = cleanAiResponseBoilerplate(response.text);
        aiPassed = true;
        console.log(`[POST /api/process-script] AI succeeded! Output text length: ${response.text.length}, Cleaned script length: ${finalScript.length}`);
      }
    } catch (aiError: any) {
      lastError = aiError;
      console.warn("[WARN] Lỗi hoặc quá hạn khi dùng AI chuẩn hóa kịch bản. Error:", aiError.message || aiError);
    }

    // Nếu AI thành công thì dùng kết quả AI, nếu thất bại/quá hạn thì xử lý theo tùy chọn ngôn ngữ/editRequest
    if (aiPassed && finalScript.trim()) {
      // Models often obey a target only approximately. A brief second pass is
      // used only when it is outside tolerance, so the number shown in the UI
      // maps much more closely to the actual voice duration.
      if (rewriteScript && exactTargetWords > 0) {
        const currentWords = countNarrationWords(finalScript);
        const maxDelta = Math.max(3, Math.round(exactTargetWords * exactTargetTolerance));
        if (Math.abs(currentWords - exactTargetWords) > maxDelta) {
          try {
            const correctionPrompt = `Rewrite the following narration to EXACTLY about ${exactTargetWords} spoken words (allowed range ${exactTargetWords - maxDelta} to ${exactTargetWords + maxDelta}). Preserve its language, facts, characters, structure and all essential calls to action. Do not add any notes, title, word count or explanation. Return only the finished narration.\n\nNARRATION:\n${finalScript}`;
            const corrected = await generateContentWithFallback(getGeminiClient(), {
              model: "gemini-1.5-flash",
              contents: correctionPrompt,
              config: { temperature: 0.15 },
            });
            const candidate = cleanAiResponseBoilerplate(String(corrected?.text || ""));
            const candidateWords = countNarrationWords(candidate);
            if (candidate && Math.abs(candidateWords - exactTargetWords) < Math.abs(currentWords - exactTargetWords)) {
              finalScript = candidate;
            }
          } catch (correctionError: any) {
            console.warn("[POST /api/process-script] Length correction skipped:", correctionError?.message || correctionError);
          }
        }
      }
      res.json({ 
        processedScript: finalScript, 
        isProgrammaticFallback: false,
        wordCount: countNarrationWords(finalScript),
        estimatedDurationSeconds: Math.round(countNarrationWords(finalScript) / (String(language).toLowerCase().startsWith("en") ? 145 : 150) * 60)
      });
    } else {
      const errorDetail = lastError?.message || lastError || "Không có phản hồi từ AI.";
      
      if (editRequest && editRequest.trim()) {
        console.error(`[POST /api/process-script] Edit request failed because AI did not respond or failed. Error detail: ${errorDetail}`);
        return res.status(500).json({ 
          error: "Không thể chỉnh sửa kịch bản bằng AI: " + errorDetail + "\nVui lòng kiểm tra lại kết nối mạng hoặc cấu hình API Key trong mục Settings và thử lại."
        });
      }

      if (language && language !== "original") {
        console.error(`[POST /api/process-script] Translation failed. Error detail: ${errorDetail}`);
        return res.status(500).json({ 
          error: "Biên dịch kịch bản sang ngôn ngữ '" + language + "' thất bại do AI gặp sự cố. Chi tiết: " + errorDetail + "\nVui lòng thử lại hoặc tự dán kịch bản đã biên dịch sẵn vào ô văn bản."
        });
      }

      console.warn(`[POST /api/process-script] Falling back to programmatic cleaning due to AI failure.`);
      res.json({ 
        processedScript: programmaticallyCleaned, 
        isProgrammaticFallback: true 
      });
    }

  } catch (error: any) {
    console.error("Lỗi trong /api/process-script:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi xử lý chuẩn hóa kịch bản." });
    }
  }
});

// BƯỚC 2: Viết lại Hook thu hút (Hook Rewriter)
app.post("/api/generate-hook", async (req, res) => {
  try {
    const { oldHook, context, language = "original", rewriteStyle = "different" } = req.body;
    if (!oldHook || typeof oldHook !== "string") {
      return res.status(400).json({ error: "Đoạn hook cũ không hợp lệ" });
    }

    let parsedHookOptions: any[] = [];
    let aiPassed = false;

    try {
      const ai = getGeminiClient();
      
      let langInstruction = "";
      if (language === "original" || !language) {
        langInstruction = "Hãy viết bằng chính ngôn ngữ gốc của đoạn hook này.";
      } else if (language === "vi") {
        langInstruction = "Nội dung Hook và lời giải thích PHẢI viết bằng Tiếng Việt chuẩn, cuốn hút và đánh gục người nghe.";
      } else if (language === "en") {
        langInstruction = "The generated Hooks and their explanations MUST be written in English (United States) to maximize retention for global viewers.";
      } else if (language === "zh") {
        langInstruction = "Hook 文案及原理解析必须 sử dụng tiếng Trung trôi chảy tự nhiên.";
      } else if (language === "ja") {
        langInstruction = "生成するフック（Hook）と解説文は、すべて自然な日本語（Tiếng Nhật）で記述してください。";
      } else if (language === "ko") {
        langInstruction = "제안하는 훅(Hook) 문구와 설명은 모두 자연스러운 한국어（Tiếng Hàn）로 작성해야 합니다.";
      }

      let styleInstruction = "";
      if (rewriteStyle === "close") {
        styleInstruction = "- PHONG CÁCH: Hãy bám sát chặt chẽ theo cốt truyện, câu từ và nội dung bản gốc, chỉ mài giũa lại cho mượt mà, bóng bẩy và cuốn hút hơn.\n";
      } else {
        styleInstruction = "- PHONG CÁCH: Hãy viết khác đi hoàn toàn, biến đổi cấu trúc câu, dùng lối dẫn dắt mới mẻ, từ vựng kịch tính, giật gân, độc lạ hơn hẳn so với bản gốc.\n";
      }

      const prompt = "Bạn là một chuyên gia sáng tạo nội dung YouTube với hàng triệu view. Nhiệm vụ của bạn là viết lại đoạn mở đầu (Hook) dưới đây để trở nên hấp dẫn, cuốn hút và giật gân hơn ngay từ 3 giây đầu tiên giúp giữ chân người xem tối đa.\n" +
        "Hãy tạo ra đúng 3 lựa chọn Hook khác nhau hoàn chỉnh theo các phong cách sau:\n" +
        "1. \"Bí ẩn & Tò mò\"\n" +
        "2. \"Kịch tính & Gây sốc\"\n" +
        "3. \"Đánh vào cảm xúc sâu sắc\"\n\n" +
        "Yêu cầu về ĐỘ DÀI: Đảm bảo viết các đoạn hook mới có ĐỘ DÀI TƯƠNG ĐƯƠNG (bằng) so với đoạn hook cũ ban đầu để không làm lệch timeline.\n" +
        styleInstruction + "\n" +
        "Hãy giữ nguyên ý nghĩa cốt lõi và các nhân vật/bối cảnh chính của câu chuyện gốc phía dưới (nếu có).\n" +
        "Yêu cầu ngôn ngữ: " + langInstruction + "\n\n" +
        "Đoạn hook mở đầu cần cải thiện:\n" +
        "\"\"\"\n" +
        oldHook + "\n" +
        "\"\"\"\n\n" +
        "Bối cảnh kịch bản đầy đủ (nếu có):\n" +
        "\"\"\"\n" +
        (context || "") + "\n" +
        "\"\"\"";

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI_TIMEOUT")), 45000);
      });

      const response = await Promise.race([
        generateContentWithFallback(ai, {
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            temperature: 0.8,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["hookOptions"],
              properties: {
                hookOptions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["style", "hookText", "explanation"],
                    properties: {
                      style: { type: Type.STRING },
                      hookText: { type: Type.STRING },
                      explanation: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
        }),
        timeoutPromise
      ]);

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed && Array.isArray(parsed.hookOptions)) {
          parsedHookOptions = parsed.hookOptions;
          aiPassed = true;
        }
      }
    } catch (aiError: any) {
      console.warn("[WARN] Lỗi khi tạo Hook bằng AI hoặc quá hạn, chuyển sang thuật toán siêu tốc:", aiError.message || aiError);
    }

    if (aiPassed && parsedHookOptions.length > 0) {
      res.json({ hookOptions: parsedHookOptions, isProgrammaticFallback: false });
    } else {
      res.json({ hookOptions: generateHookProgrammatically(oldHook, context, language), isProgrammaticFallback: true });
    }

  } catch (error: any) {
    console.error("Lỗi trong /api/generate-hook:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi xử lý tạo Hook." });
    }
  }
});

// BƯỚC 2 PHỤ: Viết lại độ dài kịch bản (Viết dài thêm / Viết ngắn đi)
app.post("/api/adjust-script-length", async (req, res) => {
  try {
    const { script, action, targetWords, targetDuration } = req.body;
    if (!script || typeof script !== "string") {
      return res.status(400).json({ error: "Kịch bản gốc không hợp lệ" });
    }

    const ai = getGeminiClient();
    const isLengthen = action === "longer";

    const lengthInstruction = isLengthen
      ? "Hãy viết kịch bản DÀI THÊM ra bằng cách bổ sung thêm bối cảnh phong phú, mô tả chi tiết, phân tích thâm thúy hoặc các diễn biến phụ kịch tính để câu chuyện cuốn hút hơn mà vẫn giữ nguyên cốt lõi."
      : "Hãy viết kịch bản CÔ ĐỌNG, NGẮN ĐI bằng cách cắt bớt các từ ngữ lặp, câu dài lê thê, cô đọng nội dung súc tích nhất có thể nhưng vẫn giữ được trọn vẹn điểm cốt lõi và kịch tính nhất.";

    const targetDetails: string[] = [];
    if (targetWords) targetDetails.push(`Số từ mục tiêu: Khoảng ${targetWords} từ.`);
    if (targetDuration) targetDetails.push(`Thời lượng video mục tiêu: Khoảng ${targetDuration} giây (mỗi giây nói khoảng 2.2 - 2.5 từ).`);

    const prompt = `Bạn là một nhà biên kịch tài ba chuyển biên và tối ưu hóa kịch bản làm video YouTube Shorts / Reels / TikTok triệu view.
Nhiệm vụ của bạn là viết lại kịch bản dưới đây để ${isLengthen ? "mở rộng dài thêm" : "cô đọng ngắn bớt"} đáp ứng thị hiếu người xem.

Yêu cầu chi tiết:
1. ${lengthInstruction}
2. ${targetDetails.length > 0 ? "Bám sát các mục tiêu sau nếu có thể:\n" + targetDetails.join("\n") : ""}
3. Sửa lại kết cấu câu từ để phát âm nói (giọng đọc voiceover) được mượt mà, tự nhiên và nhịp điệu kích thích tò mò cao.
4. Sắp xếp phân bố các dòng bằng khoảng cách dòng trống (xuống dòng kép - double newline).
5. TUYỆT ĐỐI KHÔNG ĐƯỢC thêm bất kỳ lời bình luận, câu chào hỏi, lời giới thiệu hay quảng cáo nào ở đầu hoặc cuối kết quả (Ví dụ hoàn toàn cấm viết: 'Dưới đây là kịch bản...', 'Bản chỉnh sửa...', '---', '***', v.v.). CHỈ ĐƯỢC xuất duy nhất kịch bản sạch sẽ sau khi được viết lại.

Kịch bản hiện tại cần sửa đổi:
"""
${script}
"""`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    if (response && response.text) {
      const adjustedScript = cleanAiResponseBoilerplate(response.text);
      res.json({ adjustedScript });
    } else {
      throw new Error("Không có phản hồi hợp lệ từ mô hình AI");
    }

  } catch (error: any) {
    console.error("Lỗi khi thay đổi độ dài kịch bản:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi khi biến đổi độ dài kịch bản bằng AI." });
    }
  }
});

// BƯỚC 3: Chia phân cảnh & tạo Prompt ảnh (Storyboard & Image Prompts Generator)
app.post("/api/generate-storyboard", async (req, res) => {
  try {
    const { script, style, scenesCount, promptsPerScene, useDialogueSplit, dialogueGroupSize, editRequest, isHighDensity, targetPromptsCount, characterDescription, regeneratePromptsOnly, currentScenes } = req.body;
    if (!script || typeof script !== "string") {
      return res.status(400).json({ error: "Kịch bản không hợp lệ" });
    }

    const styleReqs = getStyleRequirements(style);

    const sCount = Number(scenesCount) || 4;
    const pCount = Number(promptsPerScene) || 3;

    const charInstructions = characterDescription && characterDescription.trim()
      ? `- ĐỒNG BỘ DIỆN MẠO NHÂN VẬT CHÍNH (STRICT CHARACTER VISUAL CONSISTENCY): Kịch bản này có nhân vật chính được mô tả ngoại hình cụ thể như sau: "${characterDescription.trim()}". BẮT BUỘC phải đưa bộ mô tả này vào mỗi prompt có nhân vật xuất hiện.\n`
      : "";

    const editInstruction = editRequest && editRequest.trim()
      ? `- YÊU CẦU ĐẶC BIỆT CỦA NGƯỜI DÙNG: "${editRequest.trim()}"\n`
      : "";

    let parsedData: any = null;
    let aiPassed = false;

    const ai = getGeminiClient();

    // CHỈ TÁI TẠO PROMPT - GIỮ NGUYÊN PHÂN CHIA CẢNH VÀ THOẠI
    if (regeneratePromptsOnly && currentScenes && Array.isArray(currentScenes) && currentScenes.length > 0) {
      console.log(`[AI-API] Chế độ regeneratePromptsOnly=true. Đang tái tạo prompt cho ${currentScenes.length} cảnh...`);
      
      const localTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI_TIMEOUT")), 120000);
      });

      const promptText = `Bạn là một chuyên gia thiết kế phân cảnh điện ảnh và kỹ sư prompt hình ảnh cao cấp (như Midjourney, Imagen, Leonardo).\n` +
        `Nhiệm vụ của bạn: GIỮ NGUYÊN HOÀN TOÀN cấu trúc phân cảnh (mã số cảnh, mốc thời gian, lời thoại gốc 'text', mô tả phân cảnh 'visualDescription', mã 'code' của từng prompt, và lời thoại 'subText' con) hiện tại. BẮT BUỘC chỉ được viết lại / tối ưu hóa / tái tạo nội dung "englishPrompt" và "vietnameseLabel" cho tất cả các prompt hình ảnh trong kịch bản để đạt chất lượng nghệ thuật cao nhất.\n\n` +
        `Yêu cầu thiết kế prompt ảnh mới:\n` +
        `- Phong cách nghệ thuật chủ đạo: "${style || "cinematic dark storytelling, hyper-detailed, 8k"}"\n` +
        `- Nhất quán ngoại hình nhân vật chính (nếu có): "${characterDescription || "none"}"\n` +
        `- BÁM SÁT TUYỆT ĐỐI CÂU THOẠI / LỜI ĐỌC (STRICT DIALOGUE & SPOKEN TEXT ALIGNMENT): Nội dung được mô tả trong 'englishPrompt' phải bám sát chặt chẽ, khớp 100% với ý nghĩa, hành động, chủ thể và cảm xúc xuất hiện trong câu thoại gốc ('subText' tương ứng). Hình ảnh vẽ ra phải giải thích hoặc thể hiện trực tiếp câu thoại đó một cách trực quan, sinh động nhất. Tuyệt đối không vẽ những cảnh vật mơ hồ hay bối cảnh tưởng tượng xa rời không liên quan đến lời thoại đang phát ra.\n` +
        (editRequest ? `- Yêu cầu chỉnh sửa đặc biệt của người dùng (Hãy lồng ghép tinh tế và đồng bộ nhất quán vào các prompt): "${editRequest.trim()}"\n` : "") +
        `- Mỗi englishPrompt dài 70-110 từ. Bắt đầu bằng chính xác phong cách nghệ thuật đã chọn, sau đó mô tả trực tiếp những chủ thể, hành động, đồ vật, địa điểm và cảm xúc có trong subText. Phong cách chỉ quyết định cách vẽ, tuyệt đối không được làm đổi sự kiện/kịch bản. Không tự bịa thêm nhân vật, hành động, bối cảnh, thời đại, thời tiết hay ẩn dụ không được nêu trong subText.\n\n` +
        `Dưới đây là kịch bản phân cảnh hiện tại của người dùng ở định dạng JSON:\n` +
        `"""\n` +
        JSON.stringify(currentScenes) + `\n` +
        `"""\n\n` +
        `YÊU CẦU kết quả xuất ra định dạng JSON khớp chính xác 100% cấu trúc gốc đầu vào (bao gồm số lượng scenes, các trường sceneNumber, timeSegment, text, visualDescription, và danh sách imagePrompts có mã code, subText không đổi), chỉ thay đổi duy nhất nội dung của 'englishPrompt' và 'vietnameseLabel' ở mỗi imagePrompt dựa trên phong cách, nhân vật và yêu cầu chỉnh sửa ở trên.\n` +
        `Không kèm bất kỳ ghi chú hay văn bản giải thích nào ngoài mã JSON hợp lệ.`;

      try {
        const response = await Promise.race([
          generateContentWithFallback(ai, {
            model: "gemini-1.5-flash",
            contents: promptText,
            config: {
              temperature: 0.5,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                required: ["scenes"],
                properties: {
                  scenes: {
                    type: Type.ARRAY,
                    description: "Danh sách các phân cảnh đã được cập nhật prompt hình ảnh",
                    items: {
                      type: Type.OBJECT,
                      required: ["sceneNumber", "timeSegment", "text", "visualDescription", "imagePrompts"],
                      properties: {
                        sceneNumber: { type: Type.STRING },
                        timeSegment: { type: Type.STRING },
                        text: { type: Type.STRING },
                        visualDescription: { type: Type.STRING },
                        imagePrompts: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            required: ["code", "vietnameseLabel", "englishPrompt", "subText"],
                            properties: {
                              code: { type: Type.STRING },
                              vietnameseLabel: { type: Type.STRING },
                              englishPrompt: { type: Type.STRING },
                              subText: { type: Type.STRING }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }),
          localTimeout
        ]);

        if (response && response.text) {
          const parsedData = JSON.parse(response.text.trim());
          if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
            console.log(`[AI-API] Tái tạo prompt hoàn thành thành công cho ${parsedData.scenes.length} cảnh.`);
            return res.json({
              scenes: parsedData.scenes,
              isProgrammaticFallback: false
            });
          }
        }
        throw new Error("Không thể phân tích kết quả JSON trả về từ AI.");
      } catch (err: any) {
        console.error("Lỗi khi tái tạo prompts bằng AI:", err);
        return res.status(500).json({ error: "Lỗi máy chủ khi tái tạo prompts bằng AI: " + err.message });
      }
    }

    const styleSyncInstructions = 
      `🔑 QUY TẮC BẮT BUỘC ĐỂ ĐẢM BẢO LIÊN KẾT & ĐỒNG BỘ TUYỆT ĐỐI VỀ NHÂN VẬT, PHONG CÁCH VÀ BỐI CẢNH (CHARACTER CONSISTENCY, STYLE, AND CONTEXT SETTING - CHI TIẾT TỪ ĐẦU ĐẾN CUỐI):\n` +
      `- BÁM SÁT TUYỆT ĐỐI CÂU THOẠI / LỜI ĐỌC (STRICT DIALOGUE & SPOKEN TEXT ALIGNMENT): Đây là quy tắc cực kỳ quan trọng. Nội dung mô tả của 'englishPrompt' trong từng imagePrompt phải bám sát tuyệt đối, khớp 100% với ý nghĩa, bối cảnh, các danh từ, động từ, chủ thể và hành động được phát âm ra trong câu thoại con tương ứng ('subText' hoặc 'text'). Hình ảnh vẽ ra phải minh họa trực quan trực tiếp cho câu thoại đó một cách chân thực và rõ nét nhất. Không bao giờ vẽ những chi tiết lạc đề, tưởng tượng ngẫu hứng mà không bổ trợ trực tiếp cho câu thoại đang phát ra.\n` +
      `- ĐỒNG BỘ NHÂN VẬT (CHARACTER CONSISTENCY): Trước khi tạo prompt, hãy phân tích kỹ kịch bản để nhận diện các nhân vật chính. Định nghĩa cho từng nhân vật một bộ mô tả diện mạo cụ thể, độc bản và bất biến (ví dụ: tuổi, giới tính, gương mặt, trang phục) để đưa nhất quán vào từng prompt có họ xuất hiện.\n` +
      styleReqs.styleGuideText + "\n";

    const dynamicDialogueMode = !!useDialogueSplit;
    if (isHighDensity || dynamicDialogueMode) {
      console.log(`[AI-API] Kích hoạt Chế độ Đồng Bộ Phụ Đề Cao Mật Độ: isHighDensity=${isHighDensity}, dynamicDialogueMode=${dynamicDialogueMode}, dialogueGroupSize=${dialogueGroupSize}`);
      
      // Helper split sentences thông minh nâng cao
      const splitIntoSentences = (text: string): string[] => {
        const rawParts = text.split(/\r?\n/);
        const sentences: string[] = [];
        for (const part of rawParts) {
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;
          
          // Thay thế tạm thời dấu chấm trong số (e.g. 40.000 hoặc 3.14) bằng placeholder __NUM_DOT__
          let masked = trimmedPart.replace(/(\d)\.(\d)/g, "$1__NUM_DOT__$2");
          
          // Thay thế một số từ viết tắt thông dụng có chứa dấu chấm để tránh bị chia nhầm câu
          masked = masked.replace(/\b(T[Pp])\.(HCM|HN)\b/gi, "$1__DOT__$2");
          masked = masked.replace(/\b(S\.)(O\.)(S)\b/gi, "$1__DOT__$2__DOT__$3");
          masked = masked.replace(/\b(U\.)(S\.)(A)\b/gi, "$1__DOT__$2__DOT__$3");
          masked = masked.replace(/\b(V\.)(I\.)(P)\b/gi, "$1__DOT__$2__DOT__$3");
          masked = masked.replace(/\b(Mr|Mrs|Dr|Ms|Vs|Est|Approx)\./gi, "$1__DOT__");
          
          const matches = masked.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
          if (matches) {
            for (const m of matches) {
              let item = m.trim();
              if (item) {
                // Khôi phục lại các dấu chấm đã bị che
                item = item.replace(/__NUM_DOT__/g, ".").replace(/__DOT__/g, ".");
                sentences.push(item);
              }
            }
          } else {
            sentences.push(trimmedPart);
          }
        }

        // Với các câu thoại dài, ta tự động chia nhỏ mượt mà thành 2-3 câu thoại hợp lý
        const finalSentences: string[] = [];
        for (const s of sentences) {
          const words = s.split(/\s+/).filter(Boolean);
          const wordCount = words.length;
          
          if (wordCount > 15 && !dynamicDialogueMode) {
            // Tách dựa trên ranh giới mềm như dấu phẩy đi với liên từ, dấu chấm phẩy, dấu hai chấm
            const parts = s.split(/(?:,\s+and\s+|,\s+but\s+|;\s+|:\s+|,\s+which\s+|,\s+while\s+)/gi);
            if (parts.length > 1) {
              for (let i = 0; i < parts.length; i++) {
                let chunk = parts[i].trim();
                if (chunk) {
                  if (i === 0) {
                    chunk = chunk.charAt(0).toUpperCase() + chunk.slice(1);
                  }
                  if (i < parts.length - 1) {
                    chunk = chunk + "...";
                  }
                  finalSentences.push(chunk);
                }
              }
            } else {
              // Thử split theo dấu phẩy thông thường
              const subparts = s.split(/,\s+/);
              if (subparts.length > 1) {
                let currentChunk = "";
                for (let i = 0; i < subparts.length; i++) {
                  const subVal = subparts[i].trim();
                  if (!subVal) continue;
                  if (!currentChunk) {
                    currentChunk = subVal;
                  } else {
                    const temp = currentChunk + ", " + subVal;
                    if (temp.split(/\s+/).filter(Boolean).length > 12) {
                      finalSentences.push(currentChunk + "...");
                      currentChunk = subVal.charAt(0).toUpperCase() + subVal.slice(1);
                    } else {
                      currentChunk = temp;
                    }
                  }
                }
                if (currentChunk) {
                  finalSentences.push(currentChunk);
                }
              } else {
                // Tự chia đôi nếu quá dài mà không tìm thấy dấu câu ranh giới
                if (wordCount > 18) {
                  const mid = Math.floor(wordCount / 2);
                  const firstHalf = words.slice(0, mid).join(" ") + "...";
                  let secondHalf = words.slice(mid).join(" ");
                  secondHalf = secondHalf.charAt(0).toUpperCase() + secondHalf.slice(1);
                  finalSentences.push(firstHalf);
                  finalSentences.push(secondHalf);
                } else {
                  finalSentences.push(s);
                }
              }
            }
          } else {
            finalSentences.push(s);
          }
        }

        // Với chế độ "1 câu thoại" phải giữ nguyên từng ranh giới đã đếm ở giao diện.
        // Trước đây các câu rất ngắn (ví dụ: "Vâng.", "Đi thôi!") bị gộp âm thầm vào
        // câu kế bên ở bước dưới đây. Điều đó khiến giao diện báo 10 câu nhưng API chỉ
        // nhận 6 cụm để tạo prompt. Chỉ áp dụng gộp mảnh câu ở chế độ chia thường.
        if (dynamicDialogueMode && Number(dialogueGroupSize) <= 1) {
          return finalSentences.filter(Boolean);
        }

        // Bước gộp thông minh các cụm từ chuyển tiếp hoặc mảnh câu cực ngắn vào câu bên cạnh
        const mergedSentences: string[] = [];
        const transitionPrefixes = [
          "bởi vì", "trong phần lớn lịch sử", "ngày nay", "tuy nhiên", "nhưng", "vì thế", "ví dụ", "hơn nữa", "do đó", "bên cạnh đó", "nói cách khác", "thật vậy", "tóm lại", "bỗng nhiên", "chính vì vậy", "trước hết", "sau đó", "cuối cùng",
          "because", "but", "however", "today", "for most of history", "therefore", "thus", "in addition", "furthermore", "in other words", "indeed", "suddenly", "first of all", "then", "finally"
        ];

        for (let i = 0; i < finalSentences.length; i++) {
          const current = finalSentences[i].trim();
          if (!current) continue;

          const words = current.split(/\s+/).filter(Boolean);
          const wordCount = words.length;
          const lowerCurrent = current.toLowerCase();

          const isTransition = transitionPrefixes.some(pref => {
            const cleanPref = pref.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
            const cleanCurrent = lowerCurrent.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
            return cleanCurrent.startsWith(cleanPref);
          });

          // Một phân đoạn cần gộp nếu: cực ngắn (<= 4 từ) hoặc là cụm từ chuyển tiếp có độ dài vừa phải (<= 7 từ)
          const shouldMerge = wordCount <= 4 || (isTransition && wordCount <= 7);

          if (shouldMerge && i < finalSentences.length - 1) {
            // Gộp vào câu sau
            let next = finalSentences[i + 1].trim();
            let separator = " ";
            if (!current.endsWith(",") && !current.endsWith("...") && !current.endsWith("-") && !current.endsWith("—")) {
              separator = ", ";
            }
            if (next) {
              const firstChar = next.charAt(0);
              if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
                next = firstChar.toLowerCase() + next.slice(1);
              }
            }
            finalSentences[i + 1] = current + separator + next;
          } else if (shouldMerge && mergedSentences.length > 0) {
            // Nếu là câu cuối, gộp vào câu trước
            const prevIdx = mergedSentences.length - 1;
            let prev = mergedSentences[prevIdx];
            let separator = " ";
            if (!prev.endsWith(",") && !prev.endsWith("...") && !prev.endsWith(".") && !prev.endsWith("!") && !prev.endsWith("?")) {
              separator = ", ";
            }
            mergedSentences[prevIdx] = prev + separator + current;
          } else {
            mergedSentences.push(current);
          }
        }

        return mergedSentences;
      };

      const sentences = splitIntoSentences(script);
      const buckets: string[] = [];

      if (dynamicDialogueMode) {
        const groupSize = Number(dialogueGroupSize) || 1;
        for (let i = 0; i < sentences.length; i += groupSize) {
          const chunkOfSentences = sentences.slice(i, i + groupSize).join(" ");
          buckets.push(chunkOfSentences || "...");
        }
      } else {
        const targetCount = Math.min(200, Math.max(2, Number(targetPromptsCount) || 30));
        const size = sentences.length;
        for (let i = 0; i < targetCount; i++) {
          const start = Math.floor((i * size) / targetCount);
          const end = Math.floor(((i + 1) * size) / targetCount);
          const chunkOfSentences = sentences.slice(start, end).join(" ");
          buckets.push(chunkOfSentences || "...");
        }
      }

      const chunkSize = 10; // Process 10 scenes/prompts in each chunk call to keep output fast, safe and correct!
      const totalBuckets = buckets.length;
      const totalChunks = Math.ceil(totalBuckets / chunkSize);
      const finalScenes: any[] = [];

      // Define chunk tasks as thunks to run with concurrency control, preventing API rate limiting / 429
      const chunkThunks = Array.from({ length: totalChunks }, (_, chunkIdx) => {
        return async () => {
          const startIdx = chunkIdx * chunkSize;
          const endIdx = Math.min(totalBuckets, (chunkIdx + 1) * chunkSize);
          const chunkBuckets = buckets.slice(startIdx, endIdx);

          const chunkPrompts = chunkBuckets.map((bText, index) => {
            const currentSceneNumber = startIdx + index + 1;
            return {
              sceneNumber: currentSceneNumber.toString(),
              text: bText
            };
          });

          console.log(`[AI-API] [Sequential/Batch] Đang xử lý phân cảnh cao mật độ, phần ${chunkIdx + 1}/${totalChunks} (Cảnh ${startIdx + 1} - ${endIdx})...`);

          const chunkInstruction = 
            `Bạn là một AI chuyên nghiệp về biên tập câu chuyện & tạo prompt vẽ ảnh nghệ thuật chất lượng cao (Midjourney/Imagen).\n` +
            `Nhiệm vụ của bạn là tạo các 'imagePrompts' có hình ảnh và kịch bản chạy song hành khăng khít từng mili-giây khớp với câu thoại/phụ đề.\n\n` +
            `Dưới đây là danh sách phân cảnh cần bạn tạo prompt vẽ tranh trong đợt này (Phần ${chunkIdx + 1}/${totalChunks}):\n` +
            JSON.stringify(chunkPrompts, null, 2) + "\n\n" +
            `🔑 QUY TẮC BẮT BUỘC ĐỂ ĐẢM BẢO ĐỒNG BỘ NHÂN VẬT, BÁM SÁT STYLE & CHI TIẾT PROMPT (Dùng cho toàn bộ câu chuyện):\n` +
            `- CÂU THOẠI LÀ NGUỒN SỰ THẬT DUY NHẤT (SPOKEN LINE IS THE SOURCE OF TRUTH): Với từng subText, trước hết hãy dịch đúng các chủ thể, danh từ, động từ, hành động, đồ vật, địa điểm và cảm xúc được nói đến; englishPrompt phải cho thấy trực tiếp chính các yếu tố đó. Không được thay bằng cảnh điện ảnh chung chung. Không tự thêm nhân vật, hành động, địa điểm, thời đại, thời tiết, xung đột hay biểu tượng không có trong subText/hồ sơ nhân vật. Nếu câu thoại trừu tượng, chỉ dùng một hình tượng đơn giản giải thích trực tiếp ý nghĩa câu.\n` +
            `- Phong cách cốt lõi (phải đứng đầu mỗi englishPrompt và chỉ quyết định cách thể hiện, KHÔNG làm thay đổi sự kiện): ${style || "cinematic dark storytelling, hyper-detailed, 8k"}\n` +
            `- ĐỒNG BỘ NHÂN VẬT (CHARACTER CONSISTENCY): Phải giữ nguyên bộ mô tả diện mạo nhân vật (tuổi, giới tính, gương mặt, tóc, quần áo, trang sức, màu sắc) xuyên suốt các cảnh. Không được để nhân vật đổi ngoại hình đột ngột.\n` +
            `- NGHIÊM CẤM TRÙNG CẢNH VÀ LẶP LẠI BỐI CẢNH (STRICT NO-DUPLICATE SCENE & PROMPT VARIETY - CHỐNG TRÙNG CẢNH 100%): Các hình ảnh (imagePrompts) kế tiếp nhau (cả trong cùng 1 phân cảnh và giữa các phân cảnh khác nhau) TUYỆT ĐỐI KHÔNG ĐƯỢC lặp lại bối cảnh, góc máy hay hành động một cách rập khuôn giống hệt nhau (như hình người đứng mãi trước một cái cây lớn). Bạn phải chủ động thay đổi liên tục các yếu tố:\n` +
            `  + XOAY TUA GÓC MÁY (CAMERA SHOT VARIETY): Hãy áp dụng đa dạng góc máy điện ảnh giữa các ảnh kế tiếp (ví dụ: ảnh 1 dùng 'wide-angle scenic master shot' lấy toàn cảnh không gian, ảnh 2 dùng 'extreme close-up' đặc tả biểu cảm rơm rớm nước mắt hoặc nụ cười gượng của nhân vật, ảnh 3 dùng 'medium shot' quay từ hông trở lên, ảnh 4 dùng 'dramatic low-angle shot' nhìn từ dưới lên tăng tính hùng vĩ, ảnh 5 dùng 'over-the-shoulder shot' nhìn qua vai nhân vật, v.v.).\n` +
            `  + ĐA DẠNG HÀNH ĐỘNG & BIẾN ĐỔI BỐI CẢNH (ACTION & SCENERY VARIETY): Nhân vật phải di chuyển hoặc tương tác với môi trường theo từng dòng kịch bản (ví dụ: từ đứng nhìn -> chạy vấp ngã -> quỳ xuống khóc bên khe suối -> ngước mắt lên nhìn tia nắng chiếu qua kẽ lá). Cảnh nền cũng phải thay đổi góc nhìn, không giữ mãi một góc chụp một cái cây hay một bức tường.\n` +
            `  + ĐẶC TẢ CHI TIẾT / ĐỒ VẬT BIỂU TRƯNG (MACRO & DETAIL FOCUS): Hãy đan xen những phân cảnh không có mặt nhân vật mà tập trung vào đặc tả đồ vật kịch tính (ví dụ: cận cảnh một ngọn nến đang tan chảy rớt từng giọt sáp, bàn tay run rẩy viết những dòng chữ nguệch ngoạc trên giấy da cổ, một bông hoa rụng cánh dưới đất bùn) để tạo nhịp điệu sinh động và tránh cảm giác lặp hình.\n` +
            `  + TUYỆT ĐỐI KHÔNG copy-paste phần mô tả background hay tư thế nhân vật giống nhau ở các prompt liên tục. Mỗi ảnh phải là một tác phẩm nhiếp ảnh độc lập khác biệt.\n` +
            `- BÁM SÁT MỐC THỜI GIAN VÀ THỜI ĐẠI LỊCH SỬ (HISTORICAL TIMELINE & ERA): Nhận biết rõ ràng thế kỷ, triều đại hoặc thời kỳ lịch sử của câu chuyện từ kịch bản (Thế kỷ 19, Trung Cổ, thời chiến, v.v.). Thêm các mô tả chính xác về phục trang đặc trưng thời đại (nhung, lụa, áo choàng dạ, giáp sắt cổ), kiến trúc (cột đá Gothic, mái ngói cổ phong rêu phong) và nguồn sáng tự nhiên của kỷ nguyên đó (ngọn đèn dầu lập lọe, đuốc lửa bập bùng, ánh trăng vỡ vụn qua kẽ lá).\n` +
            `- ĐÚNG BỐI CẢNH & KHÔNG GIAN (ACCURATE CONTEXT): Xác định rõ ràng địa điểm cụ thể (căn hầm tối tăm ẩm ướt, bìa rừng hoang lạnh bao phủ bởi sương khói dày đặc), ánh sáng và thời tiết cho từng prompt. Đảm bảo bối cảnh lặp lại có sự đồng bộ nhất quán tuyệt đối.\n` +
            `- BÁM SÁT PHONG CÁCH & ÁNH SÁNG (STYLE & LIGHTING): Dùng ${styleReqs.lightingLabel} và góc máy khi chúng giúp nhìn rõ hành động được nói. Không để ống kính, ánh sáng hay hiệu ứng làm lấn át nội dung câu thoại.\n` +
            `- CHI TIẾT PROMPT TIẾNG ANH (70-110 từ): Viết rõ chủ thể + hành động + đồ vật/bối cảnh liên quan trực tiếp + cảm xúc được nêu, rồi mới tới ánh sáng và bố cục. Tránh các cụm sáo rỗng như "epic cinematic scene" nếu câu thoại không nói về điều đó.\n` +
            (characterDescription ? `- ĐỒNG BỘ DIỆN MẠO NHÂN VẬT CHÍNH (STRICT CHARACTER VISUAL CONSISTENCY): Kịch bản này có nhân vật chính được mô tả ngoại hình cụ thể như sau: "${characterDescription.trim()}". BẮT BUỘC phải đưa bộ mô tả này vào mỗi prompt có nhân vật xuất hiện.\n` : "") +
            (editRequest ? `- YÊU CẦU ĐẶC BIỆT CỦA NGƯỜI DÙNG: "${editRequest.trim()}"\n` : "") +
            `- ĐỊNH VỊ SỐ LƯỢNG HÌNH ẢNH TỐI GIẢN (DEFAULT TO EXACTLY 1 IMAGE PROMPT PER SCENE):\n` +
            `  + BẮT BUỘC chỉ tạo đúng 1 imagePrompt duy nhất cho mọi phân cảnh thông thường, ngắn hoặc vừa để đảm bảo tính tối giản, gọn gàng (mã code tương ứng là P[sceneNumber].1, và subText bằng đúng text của câu thoại).\n` +
            `  + Với các câu thoại ngắn hoặc trung bình (dưới 25 từ tiếng Việt, dưới 20 từ tiếng Anh) hoặc chỉ có 1 ý nghĩa duy nhất, tuyệt đối KHÔNG ĐƯỢC chia nhỏ hay tạo nhiều hơn 1 prompt.\n` +
            `  + Chỉ trong trường hợp câu thoại cực kỳ dài, phức tạp, chứa nhiều mệnh đề độc lập với các hành động khác biệt rõ rệt (trên 25 từ tiếng Việt, trên 20 từ tiếng Anh) thì bạn mới được phép chia nhỏ câu thoại và tạo từ 2 đến tối đa 3 imagePrompts tương ứng (mã code tương ứng là P[sceneNumber].1, P[sceneNumber].2, v.v.).\n\n` +
            `YÊU CẦU kết quả xuất ra định dạng JSON đúng cấu trúc sau:\n` +
            `{\n` +
            `  "scenes": [\n` +
            `    {\n` +
            `      "sceneNumber": "Số thứ tự phân cảnh (ví dụ: '1')",\n` +
            `      "timeSegment": "Mốc thời gian ước tính (ví dụ: '00:02 - 00:05')",\n` +
            `      "text": "Lời đọc gốc của phân cảnh này được giữ nguyên hoàn toàn bám sát kịch bản",\n` +
            `      "visualDescription": "Mô tả bằng tiếng Việt cực kỳ chi tiết chuyển nét diễn và bối cảnh",\n` +
            `      "imagePrompts": [\n` +
            `        {\n` +
            `          "code": "P[sceneNumber].1",\n` +
            `          "vietnameseLabel": "Mô tả ngắn gọn cảnh vẽ bằng tiếng Việt",\n` +
            `          "englishPrompt": "Chi tiết prompt tiếng Anh mô tả bối cảnh và nhân vật cực kỳ tỉ mỉ, bám sát dòng lịch sử, thời đại, biểu cảm kịch tính, góc quay (" + styleReqs.cameraLensLabel + "), ánh sáng (" + styleReqs.lightingLabel + "), chi tiết (" + styleReqs.realisticDetailLabel + ") (khoảng 150-220 từ) kết hợp với phong cách đặc trưng: " + (style || "cinematic") + ". " + (styleReqs.isNonRealistic ? "TUYỆT ĐỐI KHÔNG dùng từ khóa photography/realism nào." : ""),\n` +
            `          "subText": "Câu thoại hoặc phần câu thoại tiếng Việt cụ thể tương ứng đang phát âm trong hình ảnh này để băm voice khớp 1-1 (Nếu phân cảnh chỉ có 1 prompt: subText trùng with text câu thoại đó. Nếu phân cảnh được chia làm 2 hay 3 prompts: Hãy chia nhỏ câu thoại text của cảnh thành các phần tương đương ghép lại đủ để băm voice)." \n` +
            `        }\n` +
            `      ]\n` +
            `    }\n` +
            `  ]\n` +
            `}`;

          let chunkResponseText = "";
          let success = false;
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const response = await generateContentWithFallback(ai, {
                model: "gemini-1.5-flash",
                contents: chunkInstruction,
                config: {
                  temperature: 0.5,
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.OBJECT,
                    required: ["scenes"],
                    properties: {
                      scenes: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          required: ["sceneNumber", "timeSegment", "text", "visualDescription", "imagePrompts"],
                          properties: {
                            sceneNumber: { type: Type.STRING },
                            timeSegment: { type: Type.STRING },
                            text: { type: Type.STRING },
                            visualDescription: { type: Type.STRING },
                            imagePrompts: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                required: ["code", "vietnameseLabel", "englishPrompt", "subText"],
                                properties: {
                                  code: { type: Type.STRING },
                                  vietnameseLabel: { type: Type.STRING },
                                  englishPrompt: { type: Type.STRING },
                                  subText: { type: Type.STRING }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              });
              if (response && response.text) {
                chunkResponseText = response.text.trim();
                success = true;
                break;
              }
            } catch (err: any) {
              console.warn(`[WARN] Chunk ${chunkIdx + 1} attempt ${attempt} failed:`, err.message || err);
              if (attempt < 2) await sleep(1000);
            }
          }

          let chunkData: any = null;
          if (success && chunkResponseText) {
            try {
              chunkData = JSON.parse(chunkResponseText);
            } catch (pErr) {
              console.error("Lỗi parse JSON chunk:", pErr);
            }
          }

          if (!chunkData || !chunkData.scenes || chunkData.scenes.length === 0) {
            console.warn(`[WARN] Chunk ${chunkIdx + 1} failed completely. Activating concurrency-controlled fallback for prompts...`);
            const chunkScenesFallback: any[] = [];
            
            // Generate fallback scene prompts sequentially/controlled (concurrency of 2) to completely avoid rate limits
            const fallbackScenePromises = await limitConcurrency(chunkPrompts, 2, async (promptItem) => {
              const sNum = promptItem.sceneNumber;
              const sText = promptItem.text;
              const duration = 4;
              const startSec = (Number(sNum) - 1) * duration;
              const endSec = startSec + duration;
              const formatTime = (secs: number) => {
                const m = Math.floor(secs / 60).toString().padStart(2, "0");
                const s = (secs % 60).toString().padStart(2, "0");
                return `${m}:${s}`;
              };
              const tSegment = `${formatTime(startSec)} - ${formatTime(endSec)}`;

              const wordsCount = sText.split(/\s+/).filter(Boolean).length;
              const promptCount = dynamicDialogueMode ? 1 : (wordsCount > 15 ? (wordsCount > 25 ? 3 : 2) : 1);
              
              const pPromises = Array.from({ length: promptCount }, async (_, pIdx) => {
                const words = sText.split(/\s+/).filter(Boolean);
                const segmentWordCount = Math.ceil(words.length / promptCount);
                const subTextWords = words.slice(pIdx * segmentWordCount, (pIdx + 1) * segmentWordCount);
                const subText = subTextWords.join(" ") || sText;

                let englishPrompt = "";
                try {
                  englishPrompt = await generateFallbackEnglishPrompt(subText, style, characterDescription);
                } catch (err) {
                  console.warn("[WARN] Dynamic fallback generation failed:", err);
                }

                if (!englishPrompt || englishPrompt.length < 20) {
                  // Advanced programmatic fallback with rotating camera angles, lightings, and lens sizes
                  // to prevent identical compositions and repetitive visual output.
                  const cameraShots = [
                    "wide-angle scenic master landscape shot showing the vast setting, grand composition",
                    "extreme close-up macro dramatic portrait, intense facial features and emotional reaction",
                    "cinematic medium shot, dynamic posture and subtle hand gestures, looking to the side",
                    "dramatic low-angle shot, looking up to emphasize grandeur, scale and mysterious atmosphere",
                    "over-the-shoulder perspective, looking over character's shoulder towards the unfolding scene",
                    "high-angle crane shot, looking down at the character, creating dramatic shadows and depth"
                  ];
                  
                  const lightings = [
                    "moody chiaroscuro lighting with dramatic high contrast and deep shadows, volumetric dust",
                    "cinematic atmospheric lighting with soft glowing sun rays filtering through the air",
                    "intense rim lighting, mysterious silhouettes, cinematic haze and subtle film grain",
                    "ambient warm golden hour lighting, cinematic lens flare, high dynamic range",
                    "cool moody blue-hour ambient light, dramatic key and fill lighting, rich color grading"
                  ];

                  const lenses = [
                    "shot on anamorphic lens, 35mm cinematic film look, subtle film grain",
                    "shot on 85mm F1.4 professional portrait lens, spectacular soft bokeh background",
                    "shot on premium 50mm lens, exceptional sharpness, high fidelity realistic textures",
                    "shot on Hasselblad medium format, ultra-detailed textures, masterpiece quality"
                  ];

                  const shotIdx = (Number(sNum) + pIdx) % cameraShots.length;
                  const lightIdx = (Number(sNum) + pIdx) * 2 % lightings.length;
                  const lensIdx = (Number(sNum) + pIdx) * 3 % lenses.length;

                  const shot = cameraShots[shotIdx];
                  const lighting = lightings[lightIdx];
                  const lens = lenses[lensIdx];

                  englishPrompt = `High fidelity dramatic cinematic scene, ${shot}. Depicting: "${subText}". ${lighting}, ${lens}, widescreen cinematic 16:9, matching style: ${style || "cinematic dark storytelling, hyper-detailed, 8k"}`;
                }

                return {
                  code: `P${sNum}.${pIdx + 1}`,
                  vietnameseLabel: `Minh họa cảnh ${sNum} (phần ${pIdx + 1}): "${sText.slice(0, 30)}..."`,
                  englishPrompt,
                  subText
                };
              });

              const resolvedImagePrompts = await Promise.all(pPromises);

              return {
                sceneNumber: sNum,
                timeSegment: tSegment,
                text: sText,
                visualDescription: `Mô tả phân cảnh thoại khớp câu chữ: "${sText}". Được thiết kế bám sát phong cách đặc tả cao cấp.`,
                imagePrompts: resolvedImagePrompts
              };
            });

            chunkScenesFallback.push(...(await Promise.all(fallbackScenePromises)));
            chunkData = { scenes: chunkScenesFallback };
          }

          // AI đôi khi trả về ít cảnh hơn danh sách đầu vào dù đã nhận lệnh rõ ràng.
          // Ở chế độ 1 câu thoại, mỗi bucket là một đơn vị bắt buộc: luôn bù cảnh bị thiếu
          // để số prompt không thể thấp hơn số câu thoại mà người dùng đã chọn.
          if (dynamicDialogueMode && Number(dialogueGroupSize) <= 1) {
            const returnedByNumber = new Map(
              (chunkData.scenes || []).map((scene: any) => [String(scene?.sceneNumber || ""), scene])
            );

            const repairedScenes = await Promise.all(chunkPrompts.map(async (promptItem, promptIndex) => {
              const source = returnedByNumber.get(String(promptItem.sceneNumber)) || (chunkData.scenes || [])[promptIndex];
              const spokenText = String(promptItem.text || "...").trim() || "...";
              const firstPrompt = source?.imagePrompts?.[0];
              let englishPrompt = String(firstPrompt?.englishPrompt || "").trim();

              if (!englishPrompt) {
                try {
                  englishPrompt = await generateFallbackEnglishPrompt(spokenText, style, characterDescription);
                } catch (err) {
                  console.warn("[WARN] Unable to create a repaired dialogue prompt:", err);
                }
              }
              if (!englishPrompt) {
                englishPrompt = `Direct visual depiction of this exact Vietnamese spoken line: "${spokenText}". ${style || "cinematic storytelling"}`;
              }

              return {
                ...(source || {}),
                sceneNumber: String(promptItem.sceneNumber),
                text: spokenText,
                visualDescription: String(source?.visualDescription || `Minh họa trực tiếp câu thoại: "${spokenText}".`),
                imagePrompts: [{
                  ...(firstPrompt || {}),
                  code: `P${promptItem.sceneNumber}.1`,
                  vietnameseLabel: String(firstPrompt?.vietnameseLabel || `Minh họa câu thoại ${promptItem.sceneNumber}`),
                  englishPrompt,
                  subText: spokenText
                }]
              };
            }));
            chunkData = { scenes: repairedScenes };
          }

          return chunkData.scenes;
        };
      });

      // Execute all chunk tasks with a maximum concurrency limit of 3
      const chunkResults = await limitConcurrency(chunkThunks, 3, async (task) => {
        return await task();
      });

      for (const scenes of chunkResults) {
        finalScenes.push(...scenes);
      }

      const enhancedScenes = enhanceStoryboardDensity(finalScenes, style, dynamicDialogueMode).map((scene: any) => {
        const dialogue = String(scene.text || "").trim();
        scene.imagePrompts = (scene.imagePrompts || []).map((item: any) => {
          const subText = String(item.subText || dialogue).trim() || dialogue;
          // The exact narration remains available as metadata for voice and
          // timeline alignment, but must not be embedded in an image prompt.
          let existing = String(item.englishPrompt || "")
            .replace(/Narrative beat to depict exactly\s*\([^)]*voice-over[^)]*\)\s*:\s*/gi, "")
            .replace(/Narrative beat to depict exactly\s*:\s*/gi, "");
          if (subText) existing = existing.split(subText).join(" ");
          existing = existing.replace(/\s+/g, " ").replace(/^\s*[.:;,-]+\s*/, "").trim();
          return {
            ...item,
            subText,
            subText_vi: subText,
            englishPrompt: existing
          };
        });
        return scene;
      });
      return res.json({
        scenes: enhancedScenes,
        isProgrammaticFallback: false
      });
    }

    let prompt = "";
    if (useDialogueSplit) {
      prompt = "Dựa vào kịch bản câu chuyện dưới đây, hãy thực hiện tính năng NÂNG CAO: CHIA PROMPT THEO TỪNG CÂU THOẠI / SUBTITLES.\n" +
        "Hãy phân tích và chia nhỏ kịch bản này bám sát theo các đoạn thoại độc lập hoặc nhóm 2-3 câu thoại có nghĩa khăng khít, gần gũi và bổ trợ mượt mà cho nhau.\n" +
        "Quy tắc chia cảnh và prompt:\n" +
        "- Tách theo các đoạn thoại độc lập bám khăng khít.\n" +
        "- Số lượng prompt vẽ tranh cho mỗi phân cảnh/câu thoại phải cực kỳ tối giản (Mặc định 1 prompt cho mỗi cảnh):\n" +
        "  + Với mỗi câu thoại bình thường, ngắn hoặc trung bình (dưới 25 từ tiếng Việt, dưới 20 từ tiếng Anh) hoặc chỉ mang một ý nghĩa duy nhất: Bạn BẮT BUỘC chỉ được tạo đúng CHÍNH XÁC 1 imagePrompt duy nhất (code tương ứng là P[sceneNumber].1, và subText bằng đúng text của câu thoại đó). Tuyệt đối KHÔNG ĐƯỢC chia nhỏ hay tạo nhiều hơn 1 prompt.\n" +
        "  + Chỉ trong trường hợp câu thoại cực kỳ dài, phức tạp, chứa nhiều mệnh đề độc lập với các hành động khác biệt rõ rệt (trên 25 từ tiếng Việt, trên 20 từ tiếng Anh): Bạn mới được phép chia câu thoại đó và tạo đúng từ 2 đến tối đa 3 imagePrompts tương ứng (mã code tương ứng là P[sceneNumber].1, P[sceneNumber].2, v.v.).\n\n" +
        styleSyncInstructions +
        charInstructions +
        editInstruction +
        "YÊU CẦU định dạng kết quả dưới dạng JSON có cấu trúc sau:\n" +
        "{\n" +
        "  \"scenes\": [\n" +
        "    {\n" +
        "      \"sceneNumber\": \"1\",\n" +
        "      \"timeSegment\": \"00:00 - 00:05\",\n" +
        "      \"text\": \"Lời đọc gốc của câu thoại / nhóm câu thoại tương ứng trong phân cảnh này (bám sát 100% kịch bản gốc).\",\n" +
        "      \"visualDescription\": \"Mô tả sinh động bằng Tiếng Việt về hình ảnh phân cảnh này (chất liệu, bối cảnh, hành động nhân vật biểu thị thoại).\",\n" +
        "      \"imagePrompts\": [\n" +
        "        {\n" +
        "          \"code\": \"P1.1\",\n" +
        "          \"vietnameseLabel\": \"Mô tả ảnh tiếng Việt bám sát nội dung thoại\",\n" +
        "          \"englishPrompt\": \"Chi tiết prompt tiếng Anh mô tả bối cảnh cực chuẩn để dựng ảnh bằng Imagen/Midjourney. Hãy viết mô tả bối cảnh chi tiết và cực kỳ chất lượng kết hợp với phong cách đặc trưng: " + (style || "cinematic") + ". Sử dụng góc quay (" + styleReqs.cameraLensLabel + "), ánh sáng (" + styleReqs.lightingLabel + "), và mô tả chi tiết (" + styleReqs.realisticDetailLabel + "). " + (styleReqs.isNonRealistic ? "TUYỆT ĐỐI KHÔNG dùng từ khóa photography/realism nào." : "") + "\",\n" +
        "          \"subText\": \"Câu thoại hoặc phần câu thoại tiếng Việt cụ thể tương ứng với hình ảnh/prompt này để đồng bộ băm voice. Nếu cảnh chỉ có 1 prompt: subText bằng text. Nếu có 2-3 prompts: Hãy bóc tách 'text' của cảnh thành các mảng câu thoại ngắn để khớp 1-1 với từng prompt vẽ!\"\n" +
        "        }\n" +
        "      ]\n" +
        "    }\n" +
        "  ]\n" +
        "}\n\n" +
        "Hãy chia tổng kịch bản thành số phân cảnh tự nhiên nhất dựa trên các chuyển biến của câu thoại (thường từ 4 - 15 phân cảnh tùy kịch bản dài ngắn, không bị gò bó bởi sCount hay pCount). Phải cực kỳ lưu ý chia nhỏ kịch bản text vào các subText tương xứng của từng prompt ảnh để băm phát âm khớp mượt mà.\n\n" +
        "Kịch bản câu chuyện:\n" +
        "\"\"\"\n" +
        script + "\n" +
        "\"\"\"";
    } else {
      prompt = "Dựa vào kịch bản câu chuyện dưới đây, hãy chia toàn bộ câu chuyện thành đúng CHÍNH XÁC " + sCount + " phân cảnh khác nhau một cách hợp lý và mạch lạc.\n" +
        "Các phân cảnh phải liên kết, nối liền nhau mạch lạc từ đầu đến cuối để dựng thành một video hoàn chỉnh.\n\n" +
        styleSyncInstructions +
        charInstructions +
        editInstruction +
        "YÊU CẦU định dạng kết quả dưới dạng JSON có cấu trúc chính xác sau:\n" +
        "{\n" +
        "  \"scenes\": [\n" +
        "    {\n" +
        "      \"sceneNumber\": \"1\",\n" +
        "      \"timeSegment\": \"00:00 - 00:30\",\n" +
        "      \"text\": \"Đoạn văn kịch bản tiếng Việt tương ứng cho phân cảnh này (bám sát 100% kịch bản gốc).\",\n" +
        "      \"visualDescription\": \"Mô tả cực kỳ sống động và giàu tính thẩm mỹ bằng Tiếng Việt về phân cảnh này (bao gồm chuyển động camera, bố cục, biểu đạt của nhân vật và bối cảnh phụ) để người dựng video thấu hiểu rõ nhất.\",\n" +
        "      \"imagePrompts\": [\n" +
        "        {\n" +
        "          \"code\": \"P1.1\",\n" +
        "          \"vietnameseLabel\": \"Tên hình ảnh/mô tả ngắn phân cảnh bằng tiếng Việt\",\n" +
        "          \"englishPrompt\": \"Chi tiết prompt tiếng Anh cực kỳ thích hợp để dán trực tiếp vào Midjourney/Dreamina/Leonardo. Hãy mô tả chi tiết: chủ thể chính (ngoại hình, biểu cảm thăng hoa), bối cảnh chính xác tỉ mỉ, loại ống kính (\" + styleReqs.cameraLensLabel + \"), kỹ thuật chiếu sáng (\" + styleReqs.lightingLabel + \"), chi tiết (\" + styleReqs.realisticDetailLabel + \"), độ phân giải cao và kết hợp hoàn mỹ với phong cách style: \" + (style || \"cinematic\") + \". \" + (styleReqs.isNonRealistic ? \"TUYỆT ĐỐI KHÔNG dùng từ khóa photography/realism nào.\" : \"\") + \"\",\n" +
        "          \"subText\": \"Câu thoại hoặc phần câu thoại tiếng Việt tương ứng với hình ảnh/prompt này để đồng bộ băm voice. Nếu chỉ có 1 prompt: subText bằng text. Nếu có nhiều prompts: Hãy chia nhỏ 'text' của cảnh thành các phần tương đương vừa đủ phát âm trong cảnh đó.\"\n" +
        "        }\n" +
        "      ]\n" +
        "    }\n" +
        "  ]\n" +
        "}\n\n" +
        "Hãy đảm bảo danh sách 'scenes' chứa đúng CHÍNH XÁC " + sCount + " phần tử phần cảnh.\n" +
        "Hãy đảm bảo mỗi phân cảnh chứa CHÍNH XÁC ĐÚNG " + pCount + " hình ảnh kịch tính khác nhau (mỗi prompt tập trung vào một góc máy đặc tả, chuyển động biểu cảm mới hoặc chi tiết biểu trưng phụ trong bối cảnh đó), giúp bộ dữ liệu ảnh phong phú tối đa để dựng video mượt màng và đẹp nhất. Các prompt tiếng Anh phải viết siêu dài, cực kỳ sâu sắc, giàu chất lượng nghệ thuật, chi tiết bối cảnh và kết cấu (" + styleReqs.realisticDetailLabel + ") sống động nhất có thể. Đồng thời chia đều/chia nhỏ trường đoạn 'text' của phân cảnh này vào trường 'subText' của từng prompt để đồng bộ hóa băm âm thanh 1-1 cực mượt.\n\n" +
        "Kịch bản câu chuyện:\n" +
        "\"\"\"\n" +
        script + "\n" +
        "\"\"\"";
    }

    // 120 seconds timeout for storyboarding response
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("AI_TIMEOUT")), 120000);
    });

    let response;
    try {
      response = await Promise.race([
        generateContentWithFallback(ai, {
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["scenes"],
            properties: {
              scenes: {
                type: Type.ARRAY,
                description: "Danh sách các phân cảnh câu chuyện",
                items: {
                  type: Type.OBJECT,
                  required: ["sceneNumber", "timeSegment", "text", "visualDescription", "imagePrompts"],
                  properties: {
                    sceneNumber: { type: Type.STRING },
                    timeSegment: { type: Type.STRING },
                    text: { type: Type.STRING },
                    visualDescription: { type: Type.STRING },
                    imagePrompts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        required: ["code", "vietnameseLabel", "englishPrompt", "subText"],
                        properties: {
                          code: { type: Type.STRING },
                          vietnameseLabel: { type: Type.STRING },
                          englishPrompt: { type: Type.STRING },
                          subText: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
      }),
      timeoutPromise
    ]);

    if (response && response.text) {
      parsedData = JSON.parse(response.text.trim());
      aiPassed = true;
    }
  } catch (aiError: any) {
    console.warn("[WARN] Lỗi hoặc hết hạn 120 giây khi dùng AI chia phân cảnh. Chuyển sang dọn dẹp bằng code siêu tốc:", aiError.message || aiError);
  }

  if (aiPassed && parsedData && parsedData.scenes && parsedData.scenes.length > 0) {
    // Ensure we clean/align limits if the model occasionally returns a slightly different amount of prompts/scenes
    const enhancedScenes = enhanceStoryboardDensity(parsedData.scenes, style);
    res.json({
      scenes: enhancedScenes,
      isProgrammaticFallback: false
    });
  } else {
    const programmaticData = generateStoryboardProgrammatically(script, style, sCount, pCount);
    const enhancedScenes = enhanceStoryboardDensity(programmaticData.scenes, style);
    res.json({
      scenes: enhancedScenes,
      isProgrammaticFallback: true
    });
  }
  } catch (error: any) {
    console.error("Lỗi trong /api/generate-storyboard:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi xử lý tạo phân cảnh kịch bản." });
    }
  }
});

// API dịch thuật nhanh kịch bản & phân cảnh đồng bộ, bảo toàn 100% prompt vẽ tranh và cấu trúc
app.post("/api/translate-storyboard", async (req, res) => {
  try {
    const { script, storyboardData, targetLang } = req.body;
    if (!script || typeof script !== "string") {
      return res.status(400).json({ error: "Kịch bản không hợp lệ." });
    }
    if (!storyboardData || !storyboardData.scenes || !Array.isArray(storyboardData.scenes)) {
      return res.status(400).json({ error: "Dữ liệu storyboard không hợp lệ." });
    }
    const targetLanguage = targetLang === "vi" ? "vi" : "en";
    const ai = getGeminiClient();

    // Gom chỉ gồm kịch bản gốc và danh sách câu thoại (scene.text) của các phân cảnh để dịch siêu tốc
    const textsToTranslate: string[] = [];
    textsToTranslate.push(script);

    storyboardData.scenes.forEach((scene: any) => {
      textsToTranslate.push(scene.text || "");
    });

    const targetLangName = targetLanguage === "vi" ? "Tiếng Việt (Vietnamese)" : "Tiếng Anh (English)";
    const translationPrompt = 
      `Bạn là một chuyên gia dịch thuật phim ảnh và kể chuyện lịch sử xuất sắc.\n` +
      `Hãy dịch toàn bộ các chuỗi văn bản trong mảng JSON dưới đây sang ${targetLangName}.\n\n` +
      `YÊU CẦU BẮT BUỘC:\n` +
      `- Dịch tự nhiên, kịch tính, cuốn hút như văn phong kể chuyện của phim tài liệu.\n` +
      `- Giữ nguyên 100% các con số, tên riêng, thuật ngữ hoặc mốc thời gian đặc biệt.\n` +
      `- Tuyệt đối KHÔNG ĐƯỢC tóm tắt hay lược bỏ bất kỳ từ nào, giữ độ dài tương đương.\n` +
      `- Kết quả trả về BẮT BUỘC phải là một mảng JSON có đúng cấu trúc: { "translatedTexts": ["Dòng 1 đã dịch", "Dòng 2 đã dịch", ...] }.\n` +
      `- Đảm bảo số lượng phần tử trong mảng kết quả "translatedTexts" phải khớp ĐÚNG CHÍNH XÁC 100% với số lượng phần tử của mảng đầu vào (đầu vào có bao nhiêu phần tử thì đầu ra phải có bấy nhiêu phần tử).\n\n` +
      `Mảng văn bản cần dịch:\n` +
      JSON.stringify(textsToTranslate, null, 2);

    let responseText = "";
    let success = false;
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await generateContentWithFallback(ai, {
          model: "gemini-1.5-flash",
          contents: translationPrompt,
          config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["translatedTexts"],
              properties: {
                translatedTexts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            }
          }
        });
        if (response && response.text) {
          responseText = response.text.trim();
          success = true;
          break;
        }
      } catch (err: any) {
        console.warn(`[WARN] Dịch thuật attempt ${attempt} thất bại:`, err.message || err);
        if (attempt < 2) await sleep(1000);
      }
    }

    let translatedData: any = null;
    if (success && responseText) {
      try {
        translatedData = JSON.parse(responseText);
      } catch (pErr) {
        console.error("Lỗi parse JSON kết quả dịch:", pErr);
      }
    }

    if (!translatedData || !translatedData.translatedTexts || translatedData.translatedTexts.length === 0) {
      return res.status(500).json({ error: "Không thể nhận được kết quả dịch từ AI." });
    }

    const tTexts = translatedData.translatedTexts;
    let idx = 0;
    
    const getSafeText = () => {
      if (idx < tTexts.length) {
        return tTexts[idx++];
      }
      return "";
    };

    const translatedScript = getSafeText() || script;

    // Phân loại ngôn ngữ gốc của kịch bản đầu vào
    const sourceIsEnglish = detectLanguageIsEnglish(script);
    const script_vi = targetLanguage === "vi" ? translatedScript : (storyboardData.script_vi || (sourceIsEnglish ? "" : script));
    const script_en = targetLanguage === "en" ? translatedScript : (storyboardData.script_en || (sourceIsEnglish ? script : ""));

    const newScenes = storyboardData.scenes.map((scene: any) => {
      const translatedText = getSafeText() || scene.text;
      const text_vi = targetLanguage === "vi" ? translatedText : (scene.text_vi || (sourceIsEnglish ? "" : scene.text));
      const text_en = targetLanguage === "en" ? translatedText : (scene.text_en || (sourceIsEnglish ? scene.text : ""));
      
      // Tự động phân chia subText từ câu thoại đã dịch sang các prompt con cho đồng bộ tuyệt đối
      const partsCount = (scene.imagePrompts && scene.imagePrompts.length) || 1;
      const textPartsVi = splitVietnameseTextIntoParts(text_vi, partsCount);
      const textPartsEn = splitVietnameseTextIntoParts(text_en, partsCount);

      const imagePrompts = (scene.imagePrompts || []).map((p: any, pIdx: number) => {
        const subText_vi = textPartsVi[pIdx] || text_vi;
        const subText_en = textPartsEn[pIdx] || text_en;
        return {
          ...p,
          subText: targetLanguage === "vi" ? subText_vi : subText_en,
          subText_vi,
          subText_en
        };
      });

      return {
        ...scene,
        text: targetLanguage === "vi" ? text_vi : text_en,
        text_vi,
        text_en,
        imagePrompts
      };
    });

    return res.json({
      translatedScript,
      script_vi,
      script_en,
      storyboardData: {
        ...storyboardData,
        script_vi,
        script_en,
        scenes: newScenes
      }
    });

  } catch (error: any) {
    console.error("Lỗi trong /api/translate-storyboard:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý dịch thuật kịch bản." });
  }
});

// BƯỚC 7 & 8: Tối ưu SEO và Seeding (SEO & Seeding Comments Generator)
// Guaranteed local fallback for the one-click pipeline. It deliberately does
// not call an external model, so an AI timeout cannot strand the run at the
// storyboard stage.
app.post("/api/generate-storyboard-fallback", (req, res) => {
  try {
    const script = typeof req.body?.script === "string" ? req.body.script : "";
    if (!script.trim()) return res.status(400).json({ error: "Missing script" });
    const style = String(req.body?.style || "");
    const scenesCount = Math.max(1, Number(req.body?.scenesCount) || 4);
    const promptsPerScene = Math.max(1, Number(req.body?.promptsPerScene) || 1);
    const scenes = enhanceStoryboardDensity(generateStoryboardProgrammatically(script, style, scenesCount, promptsPerScene).scenes, style);
    res.json({ scenes, isProgrammaticFallback: true, warning: "AI tạo phân cảnh đang quá tải. Tool đã dùng chia cảnh dự phòng và tiếp tục chạy." });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Could not create fallback storyboard" });
  }
});

// Image models are unreliable at rendering exact typography.  Apply the
// selected thumbnail title locally after image generation so the exported
// thumbnail always contains the text the user approved.
app.post("/api/add-thumbnail-text", async (req, res) => {
  const { inputPath, outputPath, text } = req.body || {};
  if (!inputPath || !outputPath || !String(text || "").trim()) {
    return res.status(400).json({ error: "Thiếu ảnh hoặc nội dung chữ thumbnail." });
  }
  if (!fs.existsSync(inputPath)) return res.status(404).json({ error: "Không tìm thấy ảnh thumbnail gốc." });
  const safeText = String(text).replace(/[\r\n]+/g, " ").trim().slice(0, 110);
  // Escape values for the drawtext filter (this is passed directly to ffmpeg,
  // not through a shell).
  const drawText = safeText.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
  const tempPath = outputPath + ".text-overlay.tmp.jpg";
  const fontFile = "C\\\\:/Windows/Fonts/arialbd.ttf";
  const filter = "drawbox=x=0:y=h*0.68:w=w:h=h*0.32:color=black@0.46:t=fill," +
    "drawtext=fontfile='" + fontFile + "':text='" + drawText + "':fontcolor=white:fontsize=h/10:borderw=5:bordercolor=black@0.9:x=(w-text_w)/2:y=h*0.78";
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(FFMPEG_PATH, ["-i", inputPath, "-vf", filter, "-frames:v", "1", "-q:v", "2", "-y", tempPath], { windowsHide: true });
      let stderr = "";
      child.stderr.on("data", chunk => { stderr += String(chunk); });
      child.on("error", reject);
      child.on("close", code => code === 0 && fs.existsSync(tempPath) ? resolve() : reject(new Error(stderr.split(/\r?\n/).slice(-5).join("\n") || "FFmpeg không thể chèn chữ.")));
    });
    fs.renameSync(tempPath, outputPath);
    res.json({ success: true, path: outputPath });
  } catch (error: any) {
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
    res.status(500).json({ error: error?.message || "Không thể chèn chữ vào thumbnail." });
  }
});

app.post("/api/generate-seo-seeding", async (req, res) => {
  try {
    const { script, channelName, targetKeywords, thumbnailStyle, thumbnailHasText, thumbnailCustomText, includeChapters = false, includeTracklist = false } = req.body;
    if (!script || typeof script !== "string") {
      return res.status(400).json({ error: "Kịch bản/Chủ đề không hợp lệ" });
    }

    let parsedData: any = null;
    let aiPassed = false;

    let styleInstruction = "";
    if (thumbnailStyle && thumbnailStyle.trim()) {
      styleInstruction = `\n[Cực Kỳ Quan Trọng] PHONG CÁCH MỸ THUẬT CHO THUMBNAIL (STYLE REQUIREMENT): Hãy sử dụng và chuyển dịch phong cách mỹ thuật sau vào thuộc tính "imagePrompt": "${thumbnailStyle.trim()}". Bắt buộc phong cách của prompt vẽ hình ảnh thumbnail phải bám sát miêu tả phong cách này.`;
    }

    const seoOutputRules = [
      "SEO OUTPUT RULES:",
      "- Return 4 distinct titleOptions plus seoTitle as the best option. Titles must be accurate, curiosity-driven, natural Vietnamese, contain the main keyword once, and stay under 65 characters. Never use fake claims, all caps, or empty clickbait.",
      "- seoDescription must be ready to paste into YouTube. Use real line breaks: two short hook lines, a concise value summary, an optional structured section, a clear subscribe CTA, then 3-5 relevant hashtags. Do not stuff keywords; use the primary keyword naturally at most twice.",
      includeChapters ? "- Include a 'MOC THOI GIAN' section with plausible 00:00 chapter markers based on the script." : "- Do not include timestamps, chapters, or a 'MOC THOI GIAN' section.",
      includeTracklist ? "- Include a separate 'TRACKLIST' section only for the major story/music segments." : "- Do not include a tracklist.",
      "- Preserve line breaks inside the JSON string using \\n."
    ].join("\\n") + "\\n\\n";

    let textInstruction = "";
    if (thumbnailHasText === false) {
      textInstruction = `\n[Cực Kỳ Quan Trọng] YÊU CẦU VỀ TEXT/CHỮ TRÊN THUMBNAIL: KHÔNG ĐƯỢC PHÉP hiển thị bất kỳ ký tự, văn bản, hoặc chữ viết nào trên thumbnail. Thuộc tính "thumbnailText" hãy để trống hoặc là chuỗi rỗng "". Trong "imagePrompt" hãy bổ sung rõ cụm từ tiếng Anh nhấn mạnh: "text-free, clean image, no text, no words, no letters".`;
    } else {
      if (thumbnailCustomText && thumbnailCustomText.trim()) {
        textInstruction = `\n[Cực Kỳ Quan Trọng] YÊU CẦU VỀ TEXT/CHỮ TRÊN THUMBNAIL: Hãy sử dụng CHÍNH XÁC câu chữ này để đặt lên ảnh thumbnail, ghi vào thuộc tính "thumbnailText": "${thumbnailCustomText.trim()}". Trong "imagePrompt" hãy miêu tả vị trí/style chữ to rõ, bắt mắt hiển thị chữ này.`;
      } else {
        textInstruction = `\n[Cực Kỳ Quan Trọng] YÊU CẦU VỀ TEXT/CHỮ TRÊN THUMBNAIL: Hãy tạo 1 câu chữ ngắn (tối đa 3-5 từ) cực kỳ kịch tính, tò mò để đặt lên ảnh thumbnail, ghi vào thuộc tính "thumbnailText". Trong "imagePrompt" hãy miêu tả vị trí/style chữ to rõ, bắt mắt.`;
      }
    }

    try {
      const ai = getGeminiClient();
      const prompt = "Từ kịch bản và từ khóa đề xuất dưới đây, hãy tạo bộ tài liệu tối ưu hóa YouTube (SEO) và các bình luận seeding thu hút tương tác.\n\n" +
        "YÊU CẦU ĐẶC BIỆT CHO THUMBNAIL (imagePrompt):\n" +
        "- Phải bám sát hoàn hảo kịch bản: Hãy phân tích kỹ kịch bản để lấy ra nhân vật chính, nét mặt biểu cảm cao độ (sợ hãi, sững sờ, khóc lóc, cười nham hiểm, tức giận), trang phục, và bối cảnh cụ thể.\n" +
        "- Bám sát mốc thời gian và thời đại lịch sử: Nếu kịch bản nói về thế kỷ 19, Trung Cổ, thời chiến, cổ tích, hay viễn tưởng, prompt phải tả rõ trang phục, kiến trúc, vũ khí, chất liệu đặc trưng của thời đại đó.\n" +
        "- Chi tiết bối cảnh & Ánh sáng: Mô tả rõ không gian (rừng sương mù, cung điện hoang tàn, căn phòng tối tăm), góc máy điện ảnh (cinematic low-angle, extreme close-up, dramatic side view), ánh sáng đầy kịch tính (volumetric lighting, chiaroscuro, mysterious glowing source, rim light).\n" +
        "- Tính đồng nhất phong cách: Tích hợp hài hòa miêu tả nghệ thuật hoặc chất liệu từ PHONG CÁCH MỸ THUẬT được cung cấp ở dưới.\n" +
        "- Prompt tiếng Anh chuyên sâu: Viết thành một prompt hoàn chỉnh, siêu chi tiết từ 100-150 từ bằng tiếng Anh để các bộ vẽ ảnh (Midjourney, Dreamina, Imagen 4) đạt chất lượng cao nhất.\n\n" +
        "YÊU CẦU thông tin đầu ra thuộc JSON có cấu trúc chính xác sau:\n" +
        "{\n" +
        "  \"seoTitle\": \"Tiêu đề video cực kỳ cuốn hút, giật gân, chứa từ khóa chính, độ dài dưới 70 ký tự.\",\n" +
        "  \"seoDescription\": \"Mô tả YouTube tự nhiên, có xuống dòng rõ ràng, tóm tắt đúng nội dung kịch bản, nêu giá trị xem video, CTA ngắn và hashtag liên quan. Không nhồi từ khóa, không lặp cụm từ chung chung.\",\n" +
        "  \"tags\": {\n" +
        "    \"primaryKeyword\": \"Một từ khóa chính duy nhất rõ ràng\",\n" +
        "    \"secondaryKeyword\": \"Một từ khóa phụ chi tiết\",\n" +
        "    \"channelTag\": \"Thẻ chứa tên kênh: " + (channelName || "VideoNiche") + "\",\n" +
        "    \"competitorTags\": [\"Mảng 4-6 tag phụ đối thủ sao chép từ top video cùng ngành, hữu ích nhất\"]\n" +
        "  },\n" +
        "  \"thumbnailConcept\": {\n" +
        "    \"visualIdea\": \"Mô tả ý tưởng hình ảnh Thumbnail cuốn hút (Cách sắp xếp nhân vật, tiêu điểm, màu sắc tương phản thu hút click).\",\n" +
        "    \"thumbnailText\": \"Câu chữ ngắn hoặc cụm Từ khóa cực shock đặt trên ảnh thumbnail (tối đa 3-5 từ, font to rõ). Hoặc chuỗi rỗng nếu yêu cầu không chữ.\",\n" +
        "    \"imagePrompt\": \"Bản prompt vẽ tiếng Anh siêu chi tiết (100-150 từ), bao gồm miêu tả nhân vật, trang phục thời kỳ lịch sử, biểu cảm sững sờ/kịch tính, bối cảnh kịch bản, thời đại, góc máy, ánh sáng điện ảnh, bám sát phong cách yêu cầu.\"\n" +
        "  },\n" +
        "  \"seedingComments\": [\n" +
        "    {\n" +
        "      \"accountType\": \"Tài khoản tranh luận/Trái chiều\",\n" +
        "      \"commentText\": \"Bình luận khơi mào tranh cãi lành mạnh về tình tiết cứu cánh, triết lý trong câu chuyện để người xem khác vô đối đáp.\"\n" +
        "    },\n" +
        "    {\n" +
        "      \"accountType\": \"Tài khoản đồng tình/Chia sẻ cảm xúc sâu sắc\",\n" +
        "      \"commentText\": \"Bình luận đồng cảm sâu sắc, khen ngợi chi tiết hay nhất trong video và gợi mở câu trả lời.\"\n" +
        "    },\n" +
        "    {\n" +
        "      \"accountType\": \"Tài khoản đặt câu hỏi tò mò\",\n" +
        "      \"commentText\": \"Câu hỏi lửng khơi gợi bí ẩn, thắc mắc về một chi tiết trong kịch bản để níu giữ phần bình luận rôm rả.\"\n" +
        "    },\n" +
        "    {\n" +
        "      \"accountType\": \"Tài khoản tóm tắt khoảnh khắc đắt giá (Timestamp)\",\n" +
        "      \"commentText\": \"Đặt dấu thời gian chỉ ra đoạn đỉnh điểm (ví dụ: Chết lặng ở phân cảnh phút 02:45...) tạo điểm nhấn.\"\n" +
        "    }\n" +
        "  ]\n" +
        "}\n\n" +
        "Kịch bản đầy đủ:\n" +
        "\"\"\"\n" +
        script + "\n" +
        "\"\"\"\n\n" +
        "Tên kênh: " + (channelName || "Chưa xác định") + "\n" +
        "Từ khóa đích mong muốn: " + (targetKeywords || "Chưa có") + "\n" +
        styleInstruction + "\n" +
        textInstruction + "\n\n" + seoOutputRules +
        "Đảm bảo văn phong tiếng Việt tự nhiên, phù hợp với hành vi người xem YouTube Việt Nam và quốc tế.";

      // 45 seconds timeout for SEO & Comments
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI_TIMEOUT")), 45000);
      });

      const response = await Promise.race([
        generateContentWithFallback(ai, {
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["seoTitle", "titleOptions", "seoDescription", "tags", "thumbnailConcept", "seedingComments"],
              properties: {
                seoTitle: { type: Type.STRING },
                titleOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                seoDescription: { type: Type.STRING },
                tags: {
                  type: Type.OBJECT,
                  required: ["primaryKeyword", "secondaryKeyword", "channelTag", "competitorTags"],
                  properties: {
                    primaryKeyword: { type: Type.STRING },
                    secondaryKeyword: { type: Type.STRING },
                    channelTag: { type: Type.STRING },
                    competitorTags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  }
                },
                thumbnailConcept: {
                  type: Type.OBJECT,
                  required: ["visualIdea", "thumbnailText", "imagePrompt"],
                  properties: {
                    visualIdea: { type: Type.STRING },
                    thumbnailText: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING }
                  }
                },
                seedingComments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["accountType", "commentText"],
                    properties: {
                      accountType: { type: Type.STRING },
                      commentText: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
        }),
        timeoutPromise
      ]);

      if (response && response.text) {
        parsedData = JSON.parse(response.text.trim());
        aiPassed = true;
      }
    } catch (aiError: any) {
      console.warn("[WARN] Lỗi hoặc quá hạn 8s khi tạo SEO bằng AI. Sử dụng thuật toán dọn dẹp và mô phỏng siêu tốc:", aiError.message || aiError);
    }

    if (aiPassed && parsedData) {
      res.json({
        ...parsedData,
        isProgrammaticFallback: false
      });
    } else {
      const programmaticData = generateSeoSeedingProgrammatically(script, channelName, targetKeywords, includeChapters, includeTracklist);
      if (includeChapters) {
        programmaticData.seoDescription += "\n\nMỐC THỜI GIAN\n00:00 Mở đầu\n01:00 Nội dung chính\n03:00 Điểm đáng chú ý\n05:00 Kết luận";
      }
      if (includeTracklist) {
        programmaticData.seoDescription += "\n\nTRACKLIST\n01. Mở đầu\n02. Nội dung chính\n03. Kết luận";
      }
      res.json({
        ...programmaticData,
        isProgrammaticFallback: true
      });
    }

  } catch (error: any) {
    console.error("Lỗi trong /api/generate-seo-seeding:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi xử lý tạo SEO & Seeding." });
    }
  }
});

// BONUS: Brainstorm Niche (CHỌN KEY CHO KÊNH Helper)
app.post("/api/brainstorm-niche", async (req, res) => {
  try {
    const { keyword, category } = req.body;

    const ai = getGeminiClient();
    const prompt = "Bạn là cố vấn chiến lược YouTube tài ba. Hãy gợi ý xu hướng (niche), tên kênh phù hợp, mô tả mẫu của kênh và các kênh đối thủ/hình mẫu tham khảo cho chủ đề tiềm năng thu hút người xem cao.\n\n" +
      "Chủ đề lựa chọn: " + (category || "Chung chung") + "\n" +
      "Từ khóa bổ sung: " + (keyword || "Chưa có") + "\n\n" +
      "JSON cấu trúc phản hồi chi tiết:\n" +
      "{\n" +
      "  \"marketInsight\": \"Phân tích vì sao nhóm chủ đề này dễ nổ view, lưu ý tối quan trọng khi làm chủ đề này năm 2025.\",\n" +
      "  \"channelNameOptions\": [\n" +
      "    { \"name\": \"Tên kênh 1\", \"concept\": \"Ý tưởng nội dung của tên này\" },\n" +
      "    { \"name\": \"Tên kênh 2\", \"concept\": \"Ý tưởng nội dung của tên này\" },\n" +
      "    { \"name\": \"Tên kênh 3\", \"concept\": \"Ý tưởng nội dung của tên này\" }\n" +
      "  ],\n" +
      "  \"channelProfile\": {\n" +
      "    \"description\": \"Viết sẵn mô tả kênh chuyên nghiệp, cuốn hút.\",\n" +
      "    \"avatarPrompt\": \"Prompt tiếng Anh tạo ảnh Avatar phù hợp nhất cho kênh.\",\n" +
      "    \"bannerPrompt\": \"Prompt tiếng Anh tạo ảnh Banner phù hợp nhất cho kênh.\"\n" +
      "  },\n" +
      "  \"contentDirectives\": [\n" +
      "    \"Định hướng nội dung 1 (ví dụ: làm chuyện thần thoại Hy Lạp tập trung vào ác thần)\",\n" +
      "    \"Định hướng nội dung 2\",\n" +
      "    \"Định hướng nội dung 3\"\n" +
      "  ]\n" +
      "}";

    const response = await generateContentWithFallback(ai, {
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["marketInsight", "channelNameOptions", "channelProfile", "contentDirectives"],
          properties: {
            marketInsight: { type: Type.STRING },
            channelNameOptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "concept"],
                properties: {
                  name: { type: Type.STRING },
                  concept: { type: Type.STRING }
                }
              }
            },
            channelProfile: {
              type: Type.OBJECT,
              required: ["description", "avatarPrompt", "bannerPrompt"],
              properties: {
                description: { type: Type.STRING },
                avatarPrompt: { type: Type.STRING },
                bannerPrompt: { type: Type.STRING }
              }
            },
            contentDirectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Lỗi trong /api/brainstorm-niche:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi xử lý tư vấn chủ đề." });
    }
  }
});

// Helper to convert raw 24kHz little-endian 16-bit PCM buffer to a playable WAV buffer
function addWavHeader(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcmBuffer.length;
  const fileLength = dataLength + 36;

  // RIFF descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(fileLength, 4);
  header.write("WAVE", 8);

  // FMT sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size = 16 for PCM
  header.writeUInt16LE(1, 20);  // AudioFormat = 1 for linear PCM
  header.writeUInt16LE(1, 22);  // NumChannels = 1 (Mono)
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(sampleRate * 2, 28); // ByteRate = sampleRate * blockAlign (sampleRate * 1 channel * 16 bits / 8)
  header.writeUInt16LE(2, 32);  // BlockAlign = numChannels * bitsPerSample / 8
  header.writeUInt16LE(16, 34); // BitsPerSample = 16-bit

  // DATA sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}
const getVietTheoApiKey = () => {
  const key = process.env.VIETTHEO_API_KEY;
  if (!key) throw new Error("Chưa cấu hình VIETTHEO_API_KEY. Vui lòng vào Cài Đặt để thêm key.");
  return key;
};

app.post("/api/api-media/generate", async (req, res) => {
  try {
    const { prompt, model, aspectRatio } = req.body;
    const response = await fetch("https://viettheo.site/api/api-media?type=IMAGE_GENERATION", {
      method: "POST",
      headers: {
        "x-api-key": getVietTheoApiKey(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        config: { aspectRatio, imageModel: model || "NANO_BANANA_PRO" }
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/api-media/job/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`https://viettheo.site/api/api-media/job/${id}`, {
      headers: { "x-api-key": getVietTheoApiKey() }
    });
    const data = await response.json();
    
    if (data.data?.status === "SUCCEEDED") {
      const resultData = data.data.resultData;
      const images = data.data.images || resultData?.images;
      const flowId = resultData?.flow2RequestId || images?.[0]?.flow2RequestId;
      
      let finalUrl = resultData?.url || images?.[0]?.url || resultData?.image_url;
      if (!finalUrl && resultData) {
          const rawStr = JSON.stringify(resultData);
          const match = rawStr.match(/https?:\/\/[^"\s]+/);
          if (match) finalUrl = match[0];
      }

      res.json({
        success: true,
        status: "SUCCEEDED",
        progress: 100,
        flow2RequestId: flowId,
        url: finalUrl
      });
    } else {
      res.json({
        success: true,
        status: data.data?.status || "QUEUED",
        progress: data.data?.progress || 0
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/api-media/upscale", async (req, res) => {
  try {
    const { resolution, flow2RequestId } = req.body;
    const response = await fetch("https://viettheo.site/api/api-media/upsample-image", {
      method: "POST",
      headers: {
        "x-api-key": getVietTheoApiKey(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ resolution, flow2RequestId })
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// BƯỚC 6: Tạo Video bằng VietTheo API
app.post("/api/api-media/generate-video", async (req, res) => {
  try {
    const { prompt, startImage, aspectRatio = "16:9" } = req.body;
    let finalStartImage = startImage;

    // Chuyển đổi ảnh nội bộ sang base64 để gửi cho Viettheo API
    if (finalStartImage && finalStartImage.includes("/api/serve-local-file?path=")) {
      try {
        const urlStr = finalStartImage.startsWith("http") ? finalStartImage : `http://localhost${finalStartImage}`;
        const parsedUrl = new URL(urlStr);
        const localPath = parsedUrl.searchParams.get("path");
        if (localPath && fs.existsSync(localPath)) {
          const buffer = fs.readFileSync(localPath);
          const ext = path.extname(localPath).replace(".", "") || "jpeg";
          finalStartImage = `data:image/${ext};base64,${buffer.toString("base64")}`;
        }
      } catch (e) {
        console.error("Lỗi khi đọc file ảnh nội bộ sang base64:", e);
      }
    }

    const response = await fetch("https://viettheo.site/api/api-media?type=VIDEO_GENERATION", {
      method: "POST",
      headers: {
        "x-api-key": getVietTheoApiKey(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        config: { aspectRatio, videoQuality: "HIGH", video_mode: "frame" },
        startImage: finalStartImage
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/api-media/upsample-video", async (req, res) => {
  try {
    const { requestId } = req.body;
    const response = await fetch("https://viettheo.site/api/api-media/upsample-video", {
      method: "POST",
      headers: {
        "x-api-key": getVietTheoApiKey(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ requestId })
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// BƯỚC 5: Tạo giọng đọc bằng Google AI TTS (gemini-3.1-flash-tts-preview)
app.post("/api/generate-tts", async (req, res) => {
  try {
    const { text, voiceName = "Zephyr" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Nội dung văn bản để đọc không được trống" });
    }

    const ai = getGeminiClient();
    let base64Audio = "";
    let lastError: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[AI-API] Requesting Google TTS using gemini-3.1-flash-tts-preview (attempt ${attempt}/3)`);
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [{ parts: [{ text: text }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName },
              },
            },
          },
        });

        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
        if (base64Audio) {
          break;
        } else {
          throw new Error("Không nhận được dữ liệu âm thanh inlineData từ Google AI TTS.");
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`[WARN] TTS generation attempt ${attempt}/3 failed. Error: ${error.message || JSON.stringify(error)}`);
        
        if (attempt < 3) {
          const delayMs = attempt * 1200;
          console.log(`[AI-API] Sleeping ${delayMs}ms before retrying TTS...`);
          await sleep(delayMs);
        }
      }
    }

    if (!base64Audio) {
      throw lastError || new Error("Không nhận được dữ liệu âm thanh từ Google AI TTS.");
    }

    // Convert raw PCM to WAV
    const pcmBuffer = Buffer.from(base64Audio, "base64");
    const wavBuffer = addWavHeader(pcmBuffer, 24000);
    const base64Wav = wavBuffer.toString("base64");

    res.json({
      audioUrl: "data:audio/wav;base64," + base64Wav,
      voiceName: voiceName
    });
  } catch (error: any) {
    console.error("Lỗi trong /api/generate-tts:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi tạo giọng nói bằng Google AI." });
    }
  }
});

// BƯỚC THÊM MỚI: AI Alignment băm voice thuyết minh bằng cách nghe âm thanh
// Local Windows voice: completely offline, no API key and suitable for the
// free voice option in the automatic pipeline.
app.post("/api/generate-free-tts", async (req, res) => {
  const tempId = `local_tts_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const inputPath = path.join(os.tmpdir(), `${tempId}.txt`);
  const outputPath = path.join(os.tmpdir(), `${tempId}.wav`);
  const scriptPath = path.join(os.tmpdir(), `${tempId}.ps1`);
  try {
    const { text, voiceName = "Microsoft Việt Nam", rate = 0 } = req.body;
    if (!text || typeof text !== "string") return res.status(400).json({ error: "Nội dung văn bản để đọc không được trống." });
    if (process.platform !== "win32") return res.status(501).json({ error: "Giọng miễn phí cục bộ hiện hỗ trợ Windows." });
    fs.writeFileSync(inputPath, text, "utf8");
    fs.writeFileSync(scriptPath, `$ErrorActionPreference = 'Stop'\nAdd-Type -AssemblyName System.Speech\n$inputPath = $args[0]\n$outputPath = $args[1]\n$requestedVoice = $args[2]\n$rate = [int]$args[3]\n$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer\n$voice = $synth.GetInstalledVoices() | Where-Object { $_.Enabled -and ($_.VoiceInfo.Name -eq $requestedVoice -or $_.VoiceInfo.Culture.Name -like 'vi*') } | Select-Object -First 1\nif ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }\n$synth.Rate = [Math]::Max(-10, [Math]::Min(10, $rate))\n$synth.SetOutputToWaveFile($outputPath)\n$synth.Speak([System.IO.File]::ReadAllText($inputPath, [System.Text.Encoding]::UTF8))\n$synth.Dispose()\n`, "utf8");
    await new Promise<void>((resolve, reject) => {
      const process = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath, inputPath, outputPath, voiceName, String(rate)], { windowsHide: true });
      let stderr = "";
      process.stderr.on("data", data => { stderr += data.toString(); });
      process.on("error", reject);
      process.on("close", code => code === 0 ? resolve() : reject(new Error(stderr.trim() || `Windows TTS thất bại (code ${code}).`)));
    });
    if (!fs.existsSync(outputPath)) throw new Error("Windows không trả về file âm thanh.");
    res.json({ audioUrl: `data:audio/wav;base64,${fs.readFileSync(outputPath).toString("base64")}`, voiceName, provider: "windows-local" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Không thể tạo giọng miễn phí cục bộ." });
  } finally {
    [inputPath, outputPath, scriptPath].forEach(file => { try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch {} });
  }
});

app.post("/api/ai-split-voice", async (req, res) => {
  try {
    const { audioData, mimeType = "audio/wav", textParts, totalDuration } = req.body;
    if (!audioData || typeof audioData !== "string") {
      return res.status(400).json({ error: "Dữ liệu âm thanh không hợp lệ hoặc bị trống." });
    }
    if (!textParts || !Array.isArray(textParts) || textParts.length === 0) {
      return res.status(400).json({ error: "Không tìm thấy dữ liệu kịch bản để khớp." });
    }

    const expectedCount = textParts.length;
    // Fallback duration calculation if totalDuration is not supplied
    const fallbackTotalDuration = totalDuration ? parseFloat(totalDuration) : (expectedCount * 3.5);

    const ai = getGeminiClient();

    let base64Data = audioData;
    let cleanedMimeType = mimeType;
    if (audioData.startsWith("data:")) {
      const matches = audioData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        cleanedMimeType = matches[1];
        base64Data = matches[2];
      }
    }

    // Prepare audio part for Gemini
    const audioPart = {
      inlineData: {
        mimeType: cleanedMimeType,
        data: base64Data
      }
    };

    // Prepare prompt instruction
    const promptText = `Bạn là một chuyên gia AI phân tích âm thanh và giọng nói tiếng Việt cực kỳ chuẩn xác.
Chúng tôi có một tệp âm thanh thuyết minh liên tục chứa một chuỗi các câu thoại tiếng Việt liên tiếp nhau.
Dưới đây là danh sách kịch bản văn bản của các câu thoại đó theo đúng thứ tự xuất hiện từ đầu đến cuối:
${JSON.stringify(textParts, null, 2)}

Tổng thời lượng tệp âm thanh thực tế là khoảng ${fallbackTotalDuration} giây.

Nhiệm vụ của bạn là:
1. LẮNG NGHE tệp âm thanh thật kỹ để nhận diện giọng nói tương ứng với từng câu thoại tiếng Việt trên.
2. Xác định mốc thời điểm bắt đầu nói (start) và mốc thời điểm kết thúc nói (end) cho từng câu (tính bằng giây, dạng số thực ví dụ: 3.45).
3. Đảm bảo mốc thời gian tăng dần và không được chồng chéo phi lý giữa các câu liên tiếp.

Ràng buộc vô cùng quan trọng:
- Bạn BẮT BUỘC phải trả về một mảng JSON có ĐÚNG ${expectedCount} phần tử ứng với ${expectedCount} câu thoại đầu vào. Không gộp câu, không bỏ sót câu nào!
- Cấu trúc từng phần tử:
  {
    "index": <Số thứ tự câu từ 1 đến ${expectedCount}>,
    "text": "<Nội dung câu kịch bản gốc>",
    "start": <Thời điểm bắt đầu nói câu đó bằng giây>,
    "end": <Thời điểm kết thúc nói câu đó bằng giây>
  }
Vui lòng trả về kết quả mảng JSON chuẩn xác theo cấu trúc trên và không kèm bất kỳ giải thích nào bên ngoài. Hãy tính toán thật chính xác và cẩn thận!`;

    console.log(`[AI-SPLIT] Calling gemini-3.5-flash with audio size ${base64Data.length} chars, text parts count ${expectedCount}, totalDuration ${fallbackTotalDuration}s`);

    let parsedSegments: any[] = [];
    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-1.5-flash",
        contents: {
          parts: [
            audioPart,
            { text: promptText }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.INTEGER },
                text: { type: Type.STRING },
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER }
              },
              required: ["index", "text", "start", "end"]
            }
          }
        }
      });

      const resultText = response.text;
      if (resultText) {
        parsedSegments = JSON.parse(resultText.trim());
      }
    } catch (apiErr) {
      console.warn("[AI-SPLIT] Failed calling Gemini API, falling back to proportional sync engine. Error:", apiErr);
      // We will allow parsedSegments to remain empty and be healed gracefully!
    }

    // --- HEALING & CORRECTING LAYER (SỬA LỖI & PHÂN BỔ ĐỀU NẾU SAI SỐ LƯỢNG) ---
    console.log(`[AI-SPLIT] Gemini returned ${parsedSegments.length} segments. Expected ${expectedCount}. Processing heal...`);

    const finalSegments = new Array(expectedCount);
    for (let i = 0; i < expectedCount; i++) {
      finalSegments[i] = {
        index: i + 1,
        text: textParts[i],
        start: -1,
        end: -1
      };
    }

    // Đổ các mốc thời gian hợp lệ từ AI vào mảng kết quả chính thức
    if (Array.isArray(parsedSegments)) {
      for (const seg of parsedSegments) {
        if (seg && typeof seg === "object") {
          const idx = parseInt(seg.index, 10);
          if (!isNaN(idx) && idx >= 1 && idx <= expectedCount) {
            const start = parseFloat(seg.start);
            const end = parseFloat(seg.end);
            if (!isNaN(start) && !isNaN(end) && start >= 0 && end > start) {
              finalSegments[idx - 1].start = start;
              finalSegments[idx - 1].end = end;
            }
          }
        }
      }
    }

    // Tiến hành băm lấp các đoạn trống chưa được phân tích mốc thời gian (-1)
    let i = 0;
    while (i < expectedCount) {
      if (finalSegments[i].start === -1) {
        // Tìm chuỗi các đoạn thiếu mốc liên tiếp từ i đến j
        let j = i;
        while (j < expectedCount && finalSegments[j].start === -1) {
          j++;
        }
        const firstMissing = i;
        const lastMissing = j - 1;

        // Xác định biên giới hạn thời gian trái và phải
        const leftBound = firstMissing > 0 ? finalSegments[firstMissing - 1].end : 0;
        const rightBound = (lastMissing < expectedCount - 1 && finalSegments[lastMissing + 1].start !== -1)
          ? finalSegments[lastMissing + 1].start
          : fallbackTotalDuration;

        const availableDuration = rightBound - leftBound;

        if (availableDuration <= 0.05) {
          // Nếu không còn thời gian trống, gán tạm mỗi cảnh 1.0 giây tăng dần
          let currentStart = leftBound;
          for (let idx = firstMissing; idx <= lastMissing; idx++) {
            finalSegments[idx].start = Number(currentStart.toFixed(2));
            finalSegments[idx].end = Number((currentStart + 1.0).toFixed(2));
            currentStart += 1.0;
          }
        } else {
          // Phân chia thời gian trống khả dụng theo tỷ lệ số chữ (character length) của kịch bản
          let totalChars = 0;
          for (let idx = firstMissing; idx <= lastMissing; idx++) {
            totalChars += (textParts[idx] || "").length;
          }
          if (totalChars === 0) totalChars = 1;

          let currentStart = leftBound;
          for (let idx = firstMissing; idx <= lastMissing; idx++) {
            const textLen = (textParts[idx] || "").length;
            const portion = textLen / totalChars;
            const duration = portion * availableDuration;
            finalSegments[idx].start = Number(currentStart.toFixed(2));
            finalSegments[idx].end = Number((currentStart + duration).toFixed(2));
            currentStart += duration;
          }
        }
        i = j; // Nhảy cóc đến đoạn tiếp theo
      } else {
        i++;
      }
    }

    // Đảm bảo trật tự các mốc tăng dần nghiêm ngặt, không bị chồng đè
    for (let k = 1; k < expectedCount; k++) {
      if (finalSegments[k].start < finalSegments[k - 1].end) {
        // Nếu câu sau bị đè vào câu trước, đẩy start của câu sau lên bằng end của câu trước
        if (finalSegments[k - 1].end < finalSegments[k].end) {
          finalSegments[k].start = finalSegments[k - 1].end;
        } else {
          // Nếu câu sau bị bao trọn hoàn toàn, chia đôi khoảng thời gian
          const mid = (finalSegments[k - 1].start + finalSegments[k].end) / 2;
          finalSegments[k - 1].end = Number(mid.toFixed(2));
          finalSegments[k].start = Number(mid.toFixed(2));
        }
      }
    }

    // Khóa đuôi của câu cuối cùng không vượt quá tổng thời lượng thực tế
    if (finalSegments[expectedCount - 1].end > fallbackTotalDuration) {
      finalSegments[expectedCount - 1].end = Number(fallbackTotalDuration.toFixed(2));
      if (finalSegments[expectedCount - 1].start >= finalSegments[expectedCount - 1].end) {
        finalSegments[expectedCount - 1].start = Number((fallbackTotalDuration - 1.0).toFixed(2));
      }
    }

    console.log(`[AI-SPLIT] Completed heal workflow. Final output segment count: ${finalSegments.length}`);
    res.json({ segments: finalSegments });

  } catch (error: any) {
    console.error("Lỗi trong /api/ai-split-voice:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi xử lý căn chỉnh âm thanh bằng AI." });
    }
  }
});

// BƯỚC THÊM MỚI: Phân tích phong cách từ ảnh mẫu (Extract Image Style)
app.post("/api/analyze-style", async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Vui lòng cung cấp ít nhất một hình ảnh mẫu." });
    }

    const ai = getGeminiClient();

    // Prepare content parts for Gemini
    const parts: any[] = [];

    for (const img of images) {
      if (typeof img !== "string" || !img.includes("base64,")) {
        continue;
      }
      const matches = img.match(/^data:(image\/[a-zA-Z1-9\-\.\+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const data = matches[2];
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: data
          }
        });
      }
    }

    if (parts.length === 0) {
      return res.status(400).json({ error: "Định dạng hình ảnh mẫu không hợp lệ." });
    }

    // Add prompt instructions
    parts.push(
      "You are a master of visual art, a professional cinematographer, and an expert generator of image creation prompts for modern generative tools (like Imagen, Midjourney, and Stable Diffusion).\n\n" +
      "Analyze the cohesive visual style and theme across ALL supplied sample images. Then, write a very compact, premium English description of this exact combined style (around 15 to 35 words).\n\n" +
      "Requirements:\n" +
      "1. Focus heavily on: the medium/genre (e.g., hyper-detailed cinematic realistic photo, dark epic fantasy painting, vintage anime cel, moody watercolor illustration), main color palette, precise lighting (e.g., volumetric lighting, rim light, golden hour, harsh shadows), camera details or rendering look (e.g., anamorphic lens, bokeh, rich texture), and overall atmosphere/vibe (e.g., eerie, commercial, serene, cyberpunk).\n" +
      "2. This text is meant to be appended as a style modifier for other scenes, so keep it active, coherent, and highly structured as comma-separated styling keywords.\n" +
      "3. DO NOT include any preamble, introduction, markdown blocks (such as ``` or ```text), numbers, bold labels, or Vietnamese explanation. Output ONLY the raw English styling string."
    );

    // Call generateContent with fallback (gemini-2.5-flash handles images perfectly)
    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: parts
    });

    let styleResult = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          styleResult += part.text;
        }
      }
    }

    styleResult = styleResult.trim();
    // Strip markdown formatting if any was generated despite instructions
    styleResult = styleResult.replace(/^[#\s\-\*]+/g, "");
    if (styleResult.startsWith("```")) {
      styleResult = styleResult.replace(/^```[a-zA-Z]*\r?\n?/g, "").replace(/\r?\n?```$/g, "").trim();
    }

    console.log("[AI-API] Extracted style prompt:", styleResult);
    res.json({ style: styleResult });

  } catch (error: any) {
    console.error("Lỗi trong /api/analyze-style:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi phân tích phong cách hình ảnh bằng Google AI." });
    }
  }
});

// BƯỚC THÊM MỚI: Phân tích mô tả nhân vật từ ảnh (Extract Character Description)
app.post("/api/analyze-character", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== "string" || !image.includes("base64,")) {
      return res.status(400).json({ error: "Vui lòng cung cấp hình ảnh nhân vật mẫu hợp lệ." });
    }

    const ai = getGeminiClient();

    const matches = image.match(/^data:(image\/[a-zA-Z1-9\-\.\+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Định dạng hình ảnh nhân vật không đúng." });
    }

    const mimeType = matches[1];
    const data = matches[2];

    const parts: any[] = [
      {
        inlineData: {
          mimeType,
          data
        }
      },
      "You are an expert character designer and digital portrait artist.\n\n" +
      "Analyze the character depicted in this image and generate a highly detailed, concise visual description in English to be used for consistent text-to-image prompting (like Midjourney, Imagen 4.0, or Dreamina).\n\n" +
      "Requirements:\n" +
      "1. Focus ONLY on the character. Describe their estimated age, gender, facial structure (e.g. sharp jawline, high cheekbones), hair style and color (e.g. short messy dark hair), eye color/expression, clothing details with color (e.g. wearing a worn green wool coat), and any defining marks or key accessories (e.g. thin-rimmed glasses, a small silver necklace).\n" +
      "2. Write in a continuous, comma-separated descriptive phrase (around 30 to 60 words). Keep it highly structured and objective.\n" +
      "3. Cấm viết bất kỳ lời mở đầu, giải thích hay khối code markdown nào. Output ONLY the raw English descriptive string starting directly with the character details (e.g., 'A 30-year-old mysterious man with sharp facial features...')."
    ];

    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: parts
    });

    let characterResult = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          characterResult += part.text;
        }
      }
    }

    characterResult = characterResult.trim();
    // Strip markdown formatting if any was generated despite instructions
    characterResult = characterResult.replace(/^[#\s\-\*]+/g, "");
    if (characterResult.startsWith("```")) {
      characterResult = characterResult.replace(/^```[a-zA-Z]*\r?\n?/g, "").replace(/\r?\n?```$/g, "").trim();
    }

    console.log("[AI-API] Extracted character description:", characterResult);
    res.json({ characterDescription: characterResult });

  } catch (error: any) {
    console.error("Lỗi trong /api/analyze-character:", error);
    if (error.message === "MISSING_GEMINI_API_KEY") {
      res.status(500).json({
        code: "MISSING_KEY",
        error: "Bạn chưa cấu hình GEMINI_API_KEY. Vui lòng thêm key trong mục Settings > Secrets ở góc ứng dụng."
      });
    } else {
      res.status(500).json({ error: error.message || "Lỗi phân tích hình ảnh nhân vật." });
    }
  }
});

// Sửa prompt theo số prompt cụ thể bằng AI
app.post("/api/rewrite-specific-prompts", async (req, res) => {
  try {
    const { scenes, promptCodes, editInstructions, style, characterDescription } = req.body;
    if (!scenes || !Array.isArray(scenes)) {
      return res.status(400).json({ error: "Kịch bản phân cảnh không hợp lệ." });
    }
    if (!promptCodes || !Array.isArray(promptCodes) || promptCodes.length === 0) {
      return res.status(400).json({ error: "Danh sách mã prompt cần sửa trống hoặc không hợp lệ." });
    }
    if (!editInstructions || typeof editInstructions !== "string" || !editInstructions.trim()) {
      return res.status(400).json({ error: "Yêu cầu chỉnh sửa cụ thể không được trống." });
    }

    const ai = getGeminiClient();
    const updatedScenes = JSON.parse(JSON.stringify(scenes)); // Deep copy

    const promises: Promise<any>[] = [];

    for (let sIdx = 0; sIdx < updatedScenes.length; sIdx++) {
      const scene = updatedScenes[sIdx];
      if (!scene.imagePrompts || !Array.isArray(scene.imagePrompts)) continue;

      for (let pIdx = 0; pIdx < scene.imagePrompts.length; pIdx++) {
        const promptItem = scene.imagePrompts[pIdx];
        
        // Match either "P12.1" exactly or "P12.1 " or case insensitive or just check trimmed uppercase
        const cleanItemCode = promptItem.code.trim().toUpperCase();
        const matchesRequest = promptCodes.some((code: string) => code.trim().toUpperCase() === cleanItemCode);

        if (matchesRequest) {
          promises.push((async () => {
            const sceneText = scene.text_vi || scene.text || "";
            const existingEnglish = promptItem.englishPrompt || "";
            const existingVietnamese = promptItem.vietnameseLabel || "";

            const systemPrompt = 
              `You are a cinematic storyboard expert and professional text-to-image prompt engineer (like Midjourney, Imagen, Dreamina).\n` +
              `Your task is to rewrite a specific image prompt (with code: ${promptItem.code}) based on the user's specific edit request.\n\n` +
              `Artistic Style of the video: "${style || 'cinematic dark storytelling, hyper-detailed, 8k'}"\n` +
              `Character Visual Consistency (Must integrate if person appears): "${characterDescription || 'none'}"\n` +
              `Scene Context / Dialogue: "${sceneText}"\n` +
              `Existing English Prompt: "${existingEnglish}"\n` +
              `Existing Vietnamese Description: "${existingVietnamese}"\n\n` +
              `USER'S SPECIFIC EDIT REQUEST FOR THIS PROMPT:\n` +
              `"${editInstructions.trim()}"\n\n` +
              `Requirements:\n` +
              `- Re-generate a highly detailed English image prompt (120-180 words) that implements the user's edit request perfectly.\n` +
              `- Ensure the prompt continues to match the general artistic style of the video and integrates the character description for consistency.\n` +
              `- Write a corresponding brief, descriptive Vietnamese label (vietnameseLabel) reflecting the changes.\n` +
              `- Return ONLY a valid JSON object matching this structure: {"englishPrompt": "...", "vietnameseLabel": "..."}\n` +
              `- Do not include markdown wraps or block codes like \`\`\`json. Output raw JSON only.`;

            try {
              const response = await generateContentWithFallback(ai, {
                model: "gemini-1.5-flash",
                contents: systemPrompt,
                config: {
                  temperature: 0.7,
                  responseMimeType: "application/json"
                }
              });

              if (response && response.text) {
                let cleanText = response.text.trim();
                if (cleanText.startsWith("```")) {
                  cleanText = cleanText.replace(/^```[a-zA-Z]*\r?\n?/g, "").replace(/\r?\n?```$/g, "").trim();
                }
                const parsed = JSON.parse(cleanText);
                if (parsed.englishPrompt) {
                  promptItem.englishPrompt = parsed.englishPrompt;
                }
                if (parsed.vietnameseLabel) {
                  promptItem.vietnameseLabel = parsed.vietnameseLabel;
                }
              }
            } catch (err) {
              console.error(`[WARN] Failed to rewrite prompt ${promptItem.code}:`, err);
            }
          })());
        }
      }
    }

    await Promise.all(promises);

    res.json({ scenes: updatedScenes });
  } catch (error: any) {
    console.error("Lỗi trong /api/rewrite-specific-prompts:", error);
    res.status(500).json({ error: error.message || "Lỗi khi sửa các prompt chỉ định bằng AI." });
  }
});

// ==========================================
// CONFIG API ENDPOINTS (.env Management)
// ==========================================

type GeminiBackupKey = { id: string; label: string; key: string };

const GEMINI_BACKUP_KEYS_ENV = "GEMINI_API_BACKUP_KEYS";
const GEMINI_ACTIVE_KEY_LABEL_ENV = "GEMINI_API_KEY_LABEL";

function maskApiKey(key: string) {
  return key ? key.slice(0, 4) + "*".repeat(Math.max(0, key.length - 8)) + key.slice(-4) : "";
}

function readGeminiBackupKeys(): GeminiBackupKey[] {
  try {
    const saved = JSON.parse(process.env[GEMINI_BACKUP_KEYS_ENV] || "[]");
    return Array.isArray(saved)
      ? saved.filter((item) => item && typeof item.id === "string" && typeof item.label === "string" && typeof item.key === "string")
      : [];
  } catch {
    return [];
  }
}

function updateEnvValue(key: string, value: string) {
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
  const lines = envContent.split(/\r?\n/).filter((line) => line.trim() !== "");
  const nextLine = `${key}=${value}`;
  const index = lines.findIndex((line) => line.startsWith(`${key}=`));
  if (index >= 0) lines[index] = nextLine;
  else lines.push(nextLine);
  fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf-8");
  process.env[key] = value;
}

function saveGeminiBackupKeys(keys: GeminiBackupKey[]) {
  updateEnvValue(GEMINI_BACKUP_KEYS_ENV, JSON.stringify(keys));
}

app.get("/api/config/gemini-keys", (_req, res) => {
  const activeKey = process.env.GEMINI_API_KEY || "";
  const activeLabel = process.env[GEMINI_ACTIVE_KEY_LABEL_ENV] || "Khóa đang dùng";
  res.json({
    success: true,
    keys: [
      ...(activeKey ? [{ id: "active", label: activeLabel, key: maskApiKey(activeKey), isActive: true }] : []),
      ...readGeminiBackupKeys().map((item) => ({ id: item.id, label: item.label, key: maskApiKey(item.key), isActive: false })),
    ],
  });
});

// Phân tích một ảnh demo khi người dùng tạo phong cách riêng. Khác với
// /api/analyze-style (chỉ trả về câu prompt), endpoint này trả về đủ metadata
// để thẻ phong cách có thể được lưu và dùng ngay.
app.post("/api/analyze-style-details", async (req, res) => {
  try {
    const { image } = req.body || {};
    if (typeof image !== "string" || !image.includes("base64,")) {
      return res.status(400).json({ error: "Cần tải lên một ảnh phong cách hợp lệ." });
    }
    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
    if (!match) return res.status(400).json({ error: "Định dạng ảnh phong cách không hợp lệ." });

    const ai = getGeminiClient();
    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType: match[1], data: match[2] } },
        `Analyze this image ONLY as a reusable visual style reference for image/video generation.
Return valid JSON only with this exact shape:
{"name":"Vietnamese style name, 2-5 words","description":"Vietnamese description, maximum 22 words","prompt":"English style prompt, 45-90 words"}

Rules for prompt: describe medium, art direction, palette, lighting, texture, camera/composition and mood. Do not describe the exact subject, character, readable text, logo, brand, or a single scene from the sample. The prompt must be reusable for any story while keeping this same visual identity.`
      ],
      config: { temperature: 0.2, responseMimeType: "application/json" },
    });
    const raw = String(response?.text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(raw);
    const name = String(parsed?.name || "Phong cách riêng").trim().slice(0, 80);
    const description = String(parsed?.description || "Phong cách được AI phân tích từ ảnh mẫu.").trim().slice(0, 220);
    const prompt = String(parsed?.prompt || "").trim().slice(0, 1400);
    if (!prompt) throw new Error("AI chưa trả về prompt phong cách.");
    return res.json({ success: true, name, description, prompt });
  } catch (error: any) {
    console.error("Lỗi /api/analyze-style-details:", error);
    return res.status(500).json({ error: error?.message || "Không thể phân tích phong cách từ ảnh." });
  }
});

// Build a reusable channel character bible directly from the current script.
app.post("/api/generate-character-profile", async (req, res) => {
  try {
    const { script } = req.body || {};
    if (!script || typeof script !== "string" || !script.trim()) {
      return res.status(400).json({ error: "Cần có kịch bản để AI tạo hồ sơ nhân vật." });
    }
    const ai = getGeminiClient();
    const prompt = `Analyze this video script and create a strict reusable CHARACTER BIBLE for consistent AI image/video generation. Identify every recurring or speaking character. Infer only what the script supports; when visual detail is missing, make tasteful production-ready choices and keep them stable. Include for each character: role/name, approximate age, gender presentation only if supported, face and hair, body/build, clothing palette, signature accessory, personality/expression, and their relationship to other characters. Also include a short global visual continuity rule. Write in English, concise but detailed, plain text with one character per paragraph. Do not add markdown, commentary, or scene instructions.\n\nSCRIPT:\n${script.slice(0, 18000)}`;
    const response = await generateContentWithFallback(ai, { model: "gemini-2.5-flash", contents: prompt });
    const description = (response?.candidates?.[0]?.content?.parts || []).map((part: any) => part.text || "").join("").trim().replace(/^```[a-z]*\s*/i, "").replace(/```$/i, "").trim();
    if (!description) return res.status(502).json({ error: "AI chưa tạo được hồ sơ nhân vật. Vui lòng thử lại." });
    res.json({ success: true, description });
  } catch (error: any) {
    console.error("Character profile generation failed:", error);
    res.status(500).json({ error: error?.message || "Không thể tạo hồ sơ nhân vật." });
  }
});

app.post("/api/config/gemini-keys", (req, res) => {
  try {
    const { action, id, label, key } = req.body || {};
    const backups = readGeminiBackupKeys();

    if (action === "add") {
      const cleanKey = String(key || "").trim();
      const cleanLabel = String(label || "").trim() || `Khóa dự phòng ${backups.length + 1}`;
      if (!cleanKey) return res.status(400).json({ success: false, error: "Bạn chưa nhập API key dự phòng." });
      if (cleanKey === process.env.GEMINI_API_KEY || backups.some((item) => item.key === cleanKey)) {
        return res.status(400).json({ success: false, error: "Key này đã có trong danh sách." });
      }
      backups.push({ id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: cleanLabel, key: cleanKey });
      saveGeminiBackupKeys(backups);
    } else if (action === "activate") {
      const selected = backups.find((item) => item.id === id);
      if (!selected) return res.status(404).json({ success: false, error: "Không tìm thấy key dự phòng." });
      const currentKey = process.env.GEMINI_API_KEY || "";
      const currentLabel = process.env[GEMINI_ACTIVE_KEY_LABEL_ENV] || "Khóa đang dùng";
      const remaining = backups.filter((item) => item.id !== id);
      if (currentKey) remaining.push({ id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: currentLabel, key: currentKey });
      updateEnvValue("GEMINI_API_KEY", selected.key);
      updateEnvValue(GEMINI_ACTIVE_KEY_LABEL_ENV, selected.label);
      saveGeminiBackupKeys(remaining);
      aiInstance = null;
    } else if (action === "remove") {
      const remaining = backups.filter((item) => item.id !== id);
      if (remaining.length === backups.length) return res.status(404).json({ success: false, error: "Không tìm thấy key dự phòng." });
      saveGeminiBackupKeys(remaining);
    } else {
      return res.status(400).json({ success: false, error: "Thao tác không hợp lệ." });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/config/keys", (req, res) => {
  try {
    const envPath = path.join(process.cwd(), ".env");
    let geminiKey = "";
    let ai33Key = "";
    let viettheoKey = "";
    
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith("GEMINI_API_KEY=")) {
          geminiKey = line.split("=")[1].trim();
        } else if (line.startsWith("AI_33_API_KEY=")) {
          ai33Key = line.split("=")[1].trim();
        } else if (line.startsWith("VIETTHEO_API_KEY=")) {
          viettheoKey = line.split("=")[1].trim();
        }
      }
    }
    
    // Mask the keys before sending to frontend
    res.json({
      success: true,
      GEMINI_API_KEY: maskApiKey(geminiKey),
      AI_33_API_KEY: maskApiKey(ai33Key),
      VIETTHEO_API_KEY: maskApiKey(viettheoKey),
      hasGemini: !!geminiKey,
      hasAi33: !!ai33Key,
      hasVietTheo: !!viettheoKey
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/config/keys", (req, res) => {
  try {
    const { GEMINI_API_KEY, AI_33_API_KEY, VIETTHEO_API_KEY } = req.body;
    const envPath = path.join(process.cwd(), ".env");
    
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }
    
    const lines = envContent.split(/\r?\n/).filter(line => line.trim() !== "");
    let newLines = [...lines];
    
    const updateOrAdd = (key: string, value: string) => {
      if (!value || value.includes("***")) return; // Don't save masked or empty keys
      const index = newLines.findIndex(line => line.startsWith(`${key}=`));
      if (index >= 0) {
        newLines[index] = `${key}=${value}`;
      } else {
        newLines.push(`${key}=${value}`);
      }
    };
    
    if (GEMINI_API_KEY) updateOrAdd("GEMINI_API_KEY", GEMINI_API_KEY);
    if (AI_33_API_KEY) updateOrAdd("AI_33_API_KEY", AI_33_API_KEY);
    if (VIETTHEO_API_KEY) updateOrAdd("VIETTHEO_API_KEY", VIETTHEO_API_KEY);
    
    fs.writeFileSync(envPath, newLines.join("\n") + "\n", "utf-8");
    
    if (GEMINI_API_KEY && !GEMINI_API_KEY.includes("***")) {
      process.env.GEMINI_API_KEY = GEMINI_API_KEY;
      aiInstance = null; // Bắt buộc xoá instance cũ để nạp lại khoá mới ngay lập tức
    }
    if (AI_33_API_KEY && !AI_33_API_KEY.includes("***")) process.env.AI_33_API_KEY = AI_33_API_KEY;
    if (VIETTHEO_API_KEY && !VIETTHEO_API_KEY.includes("***")) process.env.VIETTHEO_API_KEY = VIETTHEO_API_KEY;
    
    res.json({ success: true, message: "Keys saved successfully!" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// AI33 Proxy Endpoints
// ==========================================

app.get("/api/ai33/voices", async (req, res) => {
  try {
    const { provider, language, gender, search, page, limit } = req.query;
    const apiKey = process.env.AI_33_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ success: false, error: "Missing AI_33_API_KEY in .env" });
    }

    const url = new URL("https://api.ai33.pro/v3/voices");
    
    // Auto-forward all valid query params from Frontend to AI33 API
    for (const [key, value] of Object.entries(req.query)) {
      if (value && value !== 'all') {
        url.searchParams.append(key, value as string);
      }
    }

    const response = await fetch(url.toString(), {
      headers: { "xi-api-key": apiKey }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/ai33/tts", async (req, res) => {
  try {
    const { text, voice_id, speed, with_transcript, receive_url } = req.body;
    const apiKey = process.env.AI_33_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ success: false, error: "Missing AI_33_API_KEY in .env" });
    }

    const formData = new FormData();
    formData.append("text", text);
    formData.append("voice_id", voice_id);
    if (speed) formData.append("speed", speed.toString());
    if (with_transcript !== undefined) formData.append("with_transcript", with_transcript.toString());
    if (receive_url) formData.append("receive_url", receive_url);

    const response = await fetch("https://api.ai33.pro/v3/text-to-speech", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: formData as any,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/ai33/task/:id", async (req, res) => {
  try {
    const apiKey = process.env.AI_33_API_KEY;
    const taskId = req.params.id;
    if (!apiKey) {
      return res.status(401).json({ success: false, error: "Missing AI_33_API_KEY in .env" });
    }

    const response = await fetch(`https://api.ai33.pro/v1/task/${taskId}`, {
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// AUDIO & TIMELINE PRO ENDPOINTS (Gọi Python)
// ==========================================
type TimelineScene = { id: number; text: string };

function cleanTimelineText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function readTimelineScenes(scriptPath: string): TimelineScene[] {
  const rawScript = fs.readFileSync(scriptPath, "utf8").replace(/^\uFEFF/, "");
  // `script.txt` is the complete workflow backup. The per-prompt voice line
  // is the authoritative source for Step 6 and maps 1:1 to generated media.
  const promptDialogues = Array.from(rawScript.matchAll(/\[\s*(?:câu\s*thoại\s*băm\s*voice|voice\s*dialogue)\s*\]\s*:\s*(.+)/gi))
    .map(match => cleanTimelineText(match[1]))
    .filter(Boolean);
  if (promptDialogues.length) {
    return promptDialogues.map((text, index) => ({ id: index + 1, text }));
  }
  // Backup files contain project metadata before the actual narration. Do not
  // send those headings to Whisper because they were never spoken in the voice.
  const narrationMarker = rawScript.match(/kịch\s*bản\s*đã\s*chuẩn\s*hóa\s*làm\s*giọng\s*đọc\s*:\s*={0,}\s*([\s\S]*)$/i);
  const narrationScript = narrationMarker?.[1]?.trim() || rawScript;
  const lines = narrationScript.split(/\r?\n/);
  const groups: string[][] = [];
  let current: string[] | null = null;
  let awaitingDialogue = false;
  const finish = () => {
    if (current && cleanTimelineText(current.join(" "))) groups.push(current);
    current = null;
    awaitingDialogue = false;
  };

  for (const sourceLine of lines) {
    const line = sourceLine.trim();
    if (/^---\s*(phân\s*cảnh|scene)\b/i.test(line)) {
      finish();
      current = [];
      continue;
    }
    if (!current || !line) continue;
    const dialogue = line.match(/^\[(?:đoạn\s*thoại|dialogue)\]\s*:?\s*(.*)$/i);
    if (dialogue) {
      if (dialogue[1]) current.push(dialogue[1]);
      else awaitingDialogue = true;
      continue;
    }
    if (/^\$\$\s*(?:đoạn\s*thoại|dialogue)\s*\$\$/i.test(line)) {
      awaitingDialogue = true;
      continue;
    }
    if (awaitingDialogue) {
      if (!/^\$\$|^\[/.test(line)) current.push(line.replace(/^:\s*/, ""));
      awaitingDialogue = false;
    }
  }
  finish();

  if (!groups.length || groups.every(group => !cleanTimelineText(group.join(" ")))) {
    const chunks = narrationScript
      .split(/(?:^|\n)\s*---\s*(?:phân\s*cảnh|scene)\b[^\n]*\n?/gim)
      .map(chunk => chunk.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !/^\+?\s*\[?P\d+(?:\.\d+)?\]?/i.test(line) && !/^\$\$P\d+(?:\.\d+)?\$\$/i.test(line))
        .join(" "))
      .map(cleanTimelineText)
      .filter(Boolean);
    if (chunks.length) return chunks.map((text, index) => ({ id: index + 1, text }));
  }

  if (!groups.length) {
    return narrationScript.split(/\r?\n\s*\r?\n/).map(cleanTimelineText).filter(Boolean)
      .map((text, index) => ({ id: index + 1, text }));
  }
  return groups.map(group => cleanTimelineText(group.join(" "))).filter(Boolean)
    .map((text, index) => ({ id: index + 1, text }));
}

function getTimelineMediaFiles(directory: string) {
  if (!directory || !fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter(file => /\.(?:jpe?g|png|mp4)$/i.test(file));
}

function resolveTimelineMediaDir(directory: string) {
  if (getTimelineMediaFiles(directory).length) return directory;
  const videoDirectory = path.join(path.dirname(directory), "vid");
  return getTimelineMediaFiles(videoDirectory).length ? videoDirectory : directory;
}

function splitSceneTextForMedia(scenes: TimelineScene[], targetCount: number) {
  if (targetCount <= 1 || scenes.length === targetCount) return scenes;
  if (scenes.length !== 1) return scenes;
  const text = scenes[0].text;
  const sentences = text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)?.map(cleanTimelineText).filter(Boolean) || [text];
  const words = sentences.join(" ").split(/\s+/).filter(Boolean);
  const sourceParts = sentences.length >= targetCount ? sentences : Array.from({ length: targetCount }, (_, index) => {
    const start = Math.floor((words.length * index) / targetCount);
    const end = Math.floor((words.length * (index + 1)) / targetCount);
    return words.slice(start, end).join(" ");
  });
  const parts: string[] = [];
  let cursor = 0;
  for (let index = 0; index < targetCount; index++) {
    const remainingSlots = targetCount - index;
    const remainingItems = sourceParts.length - cursor;
    const take = Math.max(1, Math.ceil(remainingItems / remainingSlots));
    parts.push(cleanTimelineText(sourceParts.slice(cursor, cursor + take).join(" ")) || `Cảnh ${index + 1}`);
    cursor += take;
  }
  return parts.map((text, index) => ({ id: index + 1, text }));
}

function runFfmpeg(args: string[]) {
  return new Promise<{ code: number | null; stderr: string }>((resolve, reject) => {
    const child = spawn(FFMPEG_PATH, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", data => { stderr += data.toString(); });
    child.on("error", reject);
    child.on("close", code => resolve({ code, stderr }));
  });
}

async function getAudioDurationMs(audioPath: string) {
  const result = await runFfmpeg(["-hide_banner", "-i", audioPath]);
  const match = result.stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
  if (!match) throw new Error("Không thể đọc thời lượng file voice gốc.");
  const duration = (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000;
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Thời lượng voice gốc không hợp lệ.");
  return Math.round(duration);
}

function allocateTimelineDurations(totalMs: number, scenes: TimelineScene[]) {
  const weights = scenes.map(scene => Math.max(scene.text.length, 1));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  let assigned = 0;
  return weights.map((weight, index) => {
    const duration = index === weights.length - 1 ? totalMs - assigned : Math.max(100, Math.round((totalMs * weight) / weightSum));
    assigned += duration;
    return duration;
  });
}

function getWhisperPythonExecutable() {
  const candidates = [
    process.env.WHISPER_PYTHON_PATH,
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python312", "python.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python311", "python.exe"),
  ].filter((candidate): candidate is string => Boolean(candidate));
  const executable = candidates.find(candidate => fs.existsSync(candidate));
  if (!executable) throw new Error("Không tìm thấy Python có Whisper. Hãy đặt WHISPER_PYTHON_PATH trong cài đặt hệ thống.");
  return executable;
}

async function alignVoiceWithWhisper(audioPath: string, scenes: TimelineScene[], totalDurationMs: number, onStatus: (message: string) => void) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "voice-whisper-"));
  const inputPath = path.join(tempDir, "scenes.json");
  const outputPath = path.join(tempDir, "alignment.json");
  const scriptPath = path.join(process.cwd(), "python_scripts", "whisper_voice_alignment.py");
  fs.writeFileSync(inputPath, JSON.stringify(scenes), "utf8");

  try {
    await new Promise<void>((resolve, reject) => {
      const python = getWhisperPythonExecutable();
      const child = spawn(python, [scriptPath, "--audio", audioPath, "--scenes", inputPath, "--output", outputPath, "--model", "base", "--duration-ms", String(totalDurationMs)], {
        windowsHide: true,
        env: { ...process.env, PATH: `${path.dirname(FFMPEG_PATH)}${path.delimiter}${process.env.PATH || ""}` },
      });
      let stderr = "";
      child.stdout.on("data", data => {
        const output = data.toString();
        if (output.includes("WHISPER_STATUS:loading")) onStatus("Whisper AI đang nạp mô hình nhận diện giọng nói...");
        if (output.includes("WHISPER_STATUS:transcribing")) onStatus("Whisper AI đang nghe và lấy mốc từng từ...");
        if (output.includes("WHISPER_STATUS:complete")) onStatus("Whisper AI đã tìm được mốc voice cho từng cảnh.");
      });
      child.stderr.on("data", data => { stderr += data.toString(); });
      child.on("error", reject);
      child.on("close", code => {
        if (code === 0) resolve();
        else reject(new Error(stderr.trim() || "Whisper AI không thể xử lý file voice."));
      });
    });
    if (!fs.existsSync(outputPath)) throw new Error("Whisper AI không trả về dữ liệu mốc thời gian.");
    const payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    if (!payload.success || !Array.isArray(payload.cuts)) throw new Error(payload.error || "Whisper AI không thể khớp kịch bản.");
    return payload.cuts as Array<{ index: number; start: number; end: number }>;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function analyzeDialogueVideosWithWhisper(videoPaths: string[], onStatus: (message: string) => void) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dialogue-video-whisper-"));
  const inputPath = path.join(tempDir, "videos.json");
  const outputPath = path.join(tempDir, "edit-plan.json");
  const scriptPath = path.join(process.cwd(), "python_scripts", "whisper_video_edit_plan.py");
  fs.writeFileSync(inputPath, JSON.stringify(videoPaths), "utf8");

  try {
    await new Promise<void>((resolve, reject) => {
      const python = getWhisperPythonExecutable();
      const child = spawn(python, [scriptPath, "--videos", inputPath, "--output", outputPath, "--model", "base"], {
        windowsHide: true,
        env: { ...process.env, PATH: `${path.dirname(FFMPEG_PATH)}${path.delimiter}${process.env.PATH || ""}` },
      });
      let stderr = "";
      child.stdout.on("data", data => {
        const output = data.toString();
        if (output.includes("WHISPER_STATUS:loading")) onStatus("Whisper AI đang nạp mô hình để phân tích nhịp hội thoại...");
        const progress = output.match(/WHISPER_STATUS:transcribing:(\d+)\/(\d+)/);
        if (progress) onStatus(`Whisper AI đang quét tiếng hội thoại: clip ${progress[1]}/${progress[2]}...`);
        if (output.includes("WHISPER_STATUS:complete")) onStatus("Whisper AI đã hoàn tất phân tích khoảng thoại và khoảng nghỉ.");
      });
      child.stderr.on("data", data => { stderr += data.toString(); });
      child.on("error", reject);
      child.on("close", code => code === 0 ? resolve() : reject(new Error(stderr.trim() || "Whisper AI không thể phân tích tiếng trong video.")));
    });
    if (!fs.existsSync(outputPath)) throw new Error("Whisper AI không trả về kế hoạch cắt video.");
    const payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    if (!payload.success || !Array.isArray(payload.videos)) throw new Error(payload.error || "Whisper AI không thể phân tích tiếng video.");
    return payload.videos as Array<{ index: number; speechStart: number | null; speechEnd: number | null; words: number }>;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

app.post("/api/timeline/project-files", (req, res) => {
  try {
    const projectDir = String(req.body?.projectDir || "").trim();
    if (!projectDir) return res.status(400).json({ success: false, error: "Chưa chọn thư mục dự án." });
    const root = path.resolve(projectDir);
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
      return res.status(400).json({ success: false, error: "Thư mục dự án không tồn tại." });
    }

    const scriptCandidates = ["step3_dialogues.txt", "script.txt", "raw_script.txt"];
    const script = scriptCandidates.map(file => path.join(root, file)).find(file => fs.existsSync(file)) || path.join(root, "script.txt");
    const imageDir = path.join(root, "img");
    const videoDir = path.join(root, "vid");
    const imageCount = fs.existsSync(imageDir) ? fs.readdirSync(imageDir).filter(file => /\.(?:jpe?g|png)$/i.test(file)).length : 0;
    const videoCount = fs.existsSync(videoDir) ? fs.readdirSync(videoDir).filter(file => /\.mp4$/i.test(file)).length : 0;
    const mediaDir = imageCount ? imageDir : (videoCount ? videoDir : imageDir);
    // The user requested this exact folder name. It is created before any
    // slicing so the first test can be run without a manual folder picker.
    const voiceDir = path.join(root, "vocie");
    fs.mkdirSync(voiceDir, { recursive: true });

    res.json({
      success: true,
      script,
      audio: path.join(root, "voice_original.mp3"),
      mediaDir,
      imageDir,
      videoDir,
      imageCount,
      videoCount,
      voiceDir,
      hasScript: fs.existsSync(script),
      hasAudio: fs.existsSync(path.join(root, "voice_original.mp3")),
      mediaCount: getTimelineMediaFiles(mediaDir).length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/timeline/run-command", (req, res) => {
  try {
    const { action, params } = req.body;
    if (!['slice', 'sync', 'automix'].includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    // The original implementation launched a desktop Python program that
    // depends on Python, Whisper, Tkinter and a separately installed FFmpeg.
    // Use the packaged FFmpeg route for slicing so Step 6 works in this app.
    if (action === "slice") {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const send = (type: string, payload: Record<string, unknown>) => {
        res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
      };

      void (async () => {
        try {
          const scriptFile = String(params?.script || "").trim();
          const audioFile = String(params?.audio || "").trim();
          const outputDir = String(params?.outdir || "").trim();
          if (!scriptFile || !audioFile || !outputDir) {
            throw new Error("Hãy chọn đủ kịch bản, voice gốc và thư mục xuất voice.");
          }
          if (!fs.existsSync(scriptFile)) throw new Error(`Không tìm thấy file kịch bản: ${scriptFile}`);
          if (!fs.existsSync(audioFile)) throw new Error(`Không tìm thấy file voice gốc: ${audioFile}`);

          let scenes = readTimelineScenes(scriptFile);
          if (!scenes.length) throw new Error("Kịch bản chưa có nội dung thoại để cắt voice.");
          const requestedMediaDir = String(params?.imgdir || "").trim();
          const mediaDir = resolveTimelineMediaDir(requestedMediaDir);
          const mediaCount = getTimelineMediaFiles(mediaDir).length;
          if (mediaCount && scenes.length === 1 && mediaCount > 1) {
            scenes = splitSceneTextForMedia(scenes, mediaCount);
            send("log", { message: `Kịch bản chưa chia cảnh; đã chia theo ${mediaCount} ảnh/video hiện có để khớp timeline.` });
          }
          if (mediaCount && scenes.length !== mediaCount) {
            throw new Error(`Kịch bản có ${scenes.length} cảnh nhưng thư mục media có ${mediaCount} file. Hãy tạo đủ cảnh tương ứng trước khi cắt voice.`);
          }
          fs.mkdirSync(outputDir, { recursive: true });
          for (const file of fs.readdirSync(outputDir)) {
            if (/^\d{3}_scene_\d+\.wav$/i.test(file)) fs.unlinkSync(path.join(outputDir, file));
          }

          send("log", { message: `Đang đọc ${scenes.length} phân cảnh và thời lượng voice...` });
          const totalMs = await getAudioDurationMs(audioFile);
          const whisperCuts = await alignVoiceWithWhisper(audioFile, scenes, totalMs, message => send("log", { message }));
          if (whisperCuts.length !== scenes.length) throw new Error("Whisper AI trả về thiếu mốc cho một số cảnh.");
          const manifest: Array<{ index: number; text: string; startMs: number; durationMs: number; file: string }> = [];

          for (let index = 0; index < scenes.length; index++) {
            // Keep a continuous timeline from 0 until the end of the original
            // recording.  Whisper marks the spoken words, but the silence before
            // and between lines must remain in the matching visual segment too.
            const startMs = index === 0 ? 0 : Math.max(0, Math.round(whisperCuts[index].start * 1000));
            const nextStartMs = index < scenes.length - 1
              ? Math.max(startMs + 100, Math.round(whisperCuts[index + 1].start * 1000))
              : totalMs;
            const durationMs = Math.max(100, nextStartMs - startMs);
            const file = `${String(index + 1).padStart(3, "0")}_scene_${String(scenes[index].id).padStart(3, "0")}.wav`;
            const target = path.join(outputDir, file);
            send("log", { message: `Đang cắt voice cảnh ${index + 1}/${scenes.length}...` });
            const result = await runFfmpeg([
              "-hide_banner", "-loglevel", "error", "-y",
              "-ss", (startMs / 1000).toFixed(3), "-t", (durationMs / 1000).toFixed(3),
              "-i", audioFile, "-vn", "-acodec", "pcm_s16le", target,
            ]);
            if (result.code !== 0 || !fs.existsSync(target)) {
              throw new Error(`Không thể cắt voice cảnh ${index + 1}: ${result.stderr.trim() || "FFmpeg lỗi"}`);
            }
            manifest.push({
              index: index + 1,
              text: scenes[index].text,
              startMs,
              durationMs,
              file,
              speechStartMs: Math.max(0, Math.round(whisperCuts[index].start * 1000)),
              speechEndMs: Math.min(totalMs, Math.round(whisperCuts[index].end * 1000)),
            } as any);
          }

          fs.writeFileSync(path.join(outputDir, "voice_manifest.json"), JSON.stringify({
            timelineVersion: 2,
            preservesOriginalSilence: true,
            sourceAudio: audioFile,
            totalDurationMs: totalMs,
            scenes: manifest,
          }, null, 2), "utf8");
          send("log", { message: `Hoàn tất: đã cắt ${scenes.length} voice theo thứ tự cảnh.` });
          send("result", { data: { success: true, count: scenes.length, outputDir } });
        } catch (error: any) {
          send("result", { data: { success: false, error: error?.message || "Không thể cắt voice." } });
        } finally {
          res.write(`data: ${JSON.stringify({ type: "close", code: 0 })}\n\n`);
          res.end();
        }
      })();
      return;
    }

    const scriptPath = path.join(process.cwd(), "python_scripts", "audio_timeline_cli.py");
    const args = [scriptPath, "--action", action];

    if (params) {
      if (params.script) args.push("--script", params.script);
      if (params.audio) args.push("--audio", params.audio);
      if (params.outdir) args.push("--outdir", params.outdir);
      if (params.json) args.push("--json", params.json);
      if (params.imgdir) args.push("--imgdir", params.imgdir);
      if (params.template) args.push("--template", params.template);
      if (params.name) args.push("--name", params.name);
      if (params.skip_slice !== undefined) args.push("--skip_slice", params.skip_slice ? "true" : "false");
      if (params.mix_voices) args.push("--mix_voices", params.mix_voices);
    }

    console.log(`[Python] Running: python ${args.join(" ")}`);

    // Gửi phản hồi theo dạng Server-Sent Events (SSE) để truyền log trực tiếp
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const generatedDraftPaths: string[] = [];
    const templateProjPath = params?.template || "";
    let templateParentDir = "";
    if (templateProjPath) {
       templateParentDir = path.dirname(path.dirname(templateProjPath));
    }

    const pythonProcess = spawn("python", args, { shell: true });

    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString();
      const lines = output.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.includes('[[LOG]]:')) {
          const logMsg = line.split('[[LOG]]:')[1].trim();
          res.write(`data: ${JSON.stringify({ type: 'log', message: logMsg })}\n\n`);
          
          if (logMsg.includes('-> Đã clone thành công sang:') && templateParentDir) {
             const folderName = logMsg.split('sang:')[1].trim();
             const newDraftPath = path.join(templateParentDir, folderName, "draft_content.json");
             generatedDraftPaths.push(newDraftPath);
          }
        } else if (line.includes('{"success":')) {
           res.write(`data: ${JSON.stringify({ type: 'result', data: JSON.parse(line.trim()) })}\n\n`);
        } else {
           console.log(`[Python Output] ${line}`);
        }
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[Python Error] ${data.toString()}`);
      res.write(`data: ${JSON.stringify({ type: 'error', message: data.toString() })}\n\n`);
    });

    pythonProcess.on("close", async (code) => {
      // If Ultra options are provided and projects were generated, run ultra process on each
      if (code === 0 && params?.ultra_options && generatedDraftPaths.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'log', message: '⚡ ĐANG ÁP DỤNG CAPCUT ULTRA CHO CÁC DỰ ÁN...' })}\n\n`);
        
        for (const draftPath of generatedDraftPaths) {
           res.write(`data: ${JSON.stringify({ type: 'log', message: `-> Đang xử lý Ultra cho: ${path.basename(path.dirname(draftPath))}` })}\n\n`);
           try {
             const ultraResponse = await fetch("http://localhost:3000/api/timeline/ultra-process-by-path", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ draftPath, options: params.ultra_options })
             });
             const ultraData = await ultraResponse.json();
             if (ultraData.success) {
               res.write(`data: ${JSON.stringify({ type: 'log', message: `✅ Áp dụng Ultra thành công.` })}\n\n`);
             } else {
               res.write(`data: ${JSON.stringify({ type: 'log', message: `❌ Lỗi Ultra: ${ultraData.error}` })}\n\n`);
             }
           } catch (err: any) {
             res.write(`data: ${JSON.stringify({ type: 'log', message: `❌ Lỗi gọi Ultra API: ${err.message}` })}\n\n`);
           }
        }
        res.write(`data: ${JSON.stringify({ type: 'log', message: '🎉 HOÀN TẤT TOÀN BỘ QUÁ TRÌNH (BAO GỒM ULTRA)!' })}\n\n`);
      }
      
      res.write(`data: ${JSON.stringify({ type: 'close', code })}\n\n`);
      res.end();
    });

    req.on('close', () => {
      pythonProcess.kill();
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/render-ffmpeg", async (req, res) => {
  try {
    const { imgDir, voiceDir, outputDir, newProjName, resolution, aspectRatio, originalAudio, mediaType, useMediaAudio = false, smartDialogueCut = false, motionTemplate = "auto", motionIntensity = "gentle", subtitleEnabled = false, subtitleScriptPath = "", subtitleStyle = "modern", subtitlePosition = "bottom", watermarkType = "image", watermarkPath = "", watermarkText = "", watermarkPosition = "bottom-right" } = req.body;
    if (!imgDir || !outputDir || !newProjName) {
      return res.status(400).json({ success: false, error: "Missing required directories or project name" });
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Natural sorting function for files
    const naturalSort = (a: string, b: string) => {
      const ax = [], bx = [];
      a.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) as any; return "" });
      b.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) as any; return "" });
      while (ax.length && bx.length) {
        const an = ax.shift() as any;
        const bn = bx.shift() as any;
        const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if (nn) return nn;
      }
      return ax.length - bx.length;
    };

    const validMediaExts = mediaType === "video" ? ['.mp4'] : ['.jpg', '.jpeg', '.png'];
    const resolvedImgDir = path.resolve(imgDir);
    const images = fs.existsSync(resolvedImgDir)
      ? fs.readdirSync(resolvedImgDir).filter(f => validMediaExts.some(ext => f.toLowerCase().endsWith(ext))).sort(naturalSort)
      : [];
    
    const validVoiceExts = ['.mp3', '.wav'];
    const allVoices = voiceDir && fs.existsSync(voiceDir)
      ? fs.readdirSync(voiceDir).filter(f => validVoiceExts.some(ext => f.toLowerCase().endsWith(ext))).sort(naturalSort)
      : [];
    // Prefer the files generated by the Step 6 slicer.  This prevents an old
    // voice file left in the project folder from being paired with a new scene.
    const generatedVoices = allVoices.filter(file => /^\d{3}_scene_\d+\.wav$/i.test(file));
    const voices = generatedVoices.length ? generatedVoices : allVoices;
    // Cut WAVs are intermediate timing files. The final mux uses originalAudio,
    // so remove only these generated cuts after a successful final render.
    const removeCutVoiceFiles = () => {
      if (!voiceDir || !fs.existsSync(voiceDir)) return 0;
      let removed = 0;
      for (const file of generatedVoices) {
        const fullPath = path.join(voiceDir, file);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            removed += 1;
          }
        } catch (cleanupError: any) {
          console.warn("[render-ffmpeg] Could not remove cut voice:", fullPath, cleanupError?.message || cleanupError);
        }
      }
      return removed;
    };

    if (images.length === 0) {
      return res.status(400).json({ success: false, error: "Thư mục ảnh hoặc voice trống!" });
    }

    // Gửi SSE log
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendLog = (msg: string) => res.write(`data: ${JSON.stringify({ type: 'log', message: msg })}\n\n`);

    res.flushHeaders?.();
    const temporaryManifestPath = path.join(os.tmpdir(), `vidiflow_voice_manifest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`);
    let manifestPath = path.join(voiceDir || outputDir, "voice_manifest.json");
    try {
      if (fs.existsSync(manifestPath) && fs.statSync(manifestPath).isDirectory()) {
        manifestPath = temporaryManifestPath;
      } else if (fs.existsSync(manifestPath)) {
        fs.readFileSync(manifestPath, "utf8");
      }
    } catch {
      manifestPath = temporaryManifestPath;
    }
    const retainVideoAudio = useMediaAudio === true && mediaType === "video";
    // Rendering images should not depend on a previous Whisper-cut operation.
    // Build a temporary, evenly distributed timeline from the original voice.
    if (!retainVideoAudio && !fs.existsSync(manifestPath) && originalAudio && fs.existsSync(originalAudio)) {
      const totalDurationMs = await getAudioDurationMs(originalAudio);
      const durationMs = Math.max(100, Math.round(totalDurationMs / images.length));
      const manifestContent = JSON.stringify({
        sourceAudio: originalAudio,
        totalDurationMs,
        scenes: images.map((_: string, index: number) => ({ index: index + 1, durationMs }))
      }, null, 2);
      try {
        fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
        fs.writeFileSync(manifestPath, manifestContent, "utf8");
      } catch {
        manifestPath = temporaryManifestPath;
        fs.writeFileSync(manifestPath, manifestContent, "utf8");
      }
      sendLog("Chưa có voice đã cắt: đang ghép ảnh tuần tự theo toàn bộ voice gốc.");
    }
    if (!retainVideoAudio && !fs.existsSync(manifestPath)) throw new Error("Chưa có voice_manifest.json. Hãy chạy Cắt voice trước để giữ đúng timeline voice gốc.");
    const manifest = retainVideoAudio ? { scenes: [] } : JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    let timeline = Array.isArray(manifest.scenes) ? manifest.scenes : [];
    const sourceAudio = retainVideoAudio ? "" : String(originalAudio || manifest.sourceAudio || "").trim();
    const sourceDurationMs = sourceAudio && fs.existsSync(sourceAudio) ? await getAudioDurationMs(sourceAudio) : 0;
    if (retainVideoAudio) {
      timeline = await Promise.all(images.map(async (file: string, index: number) => ({ index: index + 1, durationMs: Math.max(500, await getAudioDurationMs(path.join(resolvedImgDir, file)).catch(() => 5000)) })));
      sendLog("Đang giữ và ghép liên tục tiếng hội thoại gốc của từng video AI.");
    }
    if (retainVideoAudio && smartDialogueCut) {
      sendLog("Đang dùng Whisper AI phân tích từng video hội thoại để cắt nhịp tự nhiên...");
      const videoPaths = images.map(file => path.join(resolvedImgDir, file));
      const speechPlans = await analyzeDialogueVideosWithWhisper(videoPaths, sendLog);
      timeline = timeline.map((entry: any, index: number) => {
        const plan = speechPlans.find(item => item.index === index);
        const fullDurationMs = Math.max(500, Number(entry.durationMs || 5000));
        // Keep a little lead-in and tail after the spoken words. Internal
        // pauses are deliberately untouched; they carry reactions and timing.
        if (!plan || !Number.isFinite(Number(plan.speechStart)) || !Number.isFinite(Number(plan.speechEnd))) {
          sendLog(`Clip ${index + 1}: không có lời thoại rõ ràng, giữ nguyên toàn bộ để không mất nhịp hình.`);
          return { ...entry, startMs: 0, durationMs: fullDurationMs, smartCut: false };
        }
        const speechStartMs = Math.max(0, Number(plan.speechStart) * 1000);
        const speechEndMs = Math.min(fullDurationMs, Number(plan.speechEnd) * 1000);
        const startMs = speechStartMs > 900 ? Math.max(0, Math.round(speechStartMs - 450)) : 0;
        const endMs = speechEndMs < fullDurationMs - 1300 ? Math.min(fullDurationMs, Math.round(speechEndMs + 700)) : fullDurationMs;
        const durationMs = Math.max(700, endMs - startMs);
        sendLog(`Clip ${index + 1}: giữ ${Math.round(durationMs / 10) / 100}s (bao gồm khoảng nghỉ tự nhiên).`);
        return { ...entry, startMs, durationMs, smartCut: true };
      });
    }

    const timelineHasSpeechStarts = timeline.length > 0 && timeline.every((entry: any) => Number.isFinite(Number(entry.startMs)));
    if (timelineHasSpeechStarts && sourceDurationMs > 0) {
      timeline = timeline.map((entry: any, index: number) => {
        const startMs = index === 0 ? 0 : Math.max(0, Number(entry.startMs));
        const nextStartMs = index < timeline.length - 1
          ? Math.max(startMs + 100, Number(timeline[index + 1].startMs))
          : sourceDurationMs;
        return { ...entry, startMs, durationMs: Math.max(100, Math.round(nextStartMs - startMs)) };
      });
      sendLog("Timeline voice da duoc dong bo lien tuc, giu nguyen khoang lang.");
    }
    if (!timelineHasSpeechStarts && sourceDurationMs > 0) {
      const legacyDurationMs = timeline.reduce((sum: number, entry: any) => sum + Math.max(0, Number(entry.durationMs || 0)), 0);
      if (Math.abs(legacyDurationMs - sourceDurationMs) > 250) {
        throw new Error("Timeline voice cu chi chua phan co loi va da bo mat khoang lang. Hay Chay cat voice lai bang Whisper roi render.");
      }
    }
    if (!retainVideoAudio && (!sourceAudio || !fs.existsSync(sourceAudio))) throw new Error("Không tìm thấy voice gốc. Chọn lại file voice_original trước khi render.");
    if (timeline.length !== images.length) {
      const durationMs = Math.max(100, Math.round((await getAudioDurationMs(sourceAudio)) / images.length));
      timeline = images.map((_: string, index: number) => ({ index: index + 1, durationMs }));
      sendLog("Timeline cũ không khớp số media: đang chia đều thời lượng theo voice gốc để render.");
    }
    if (!retainVideoAudio && voices.length > 0 && voices.length < timeline.length) {
      throw new Error(`Số media (${images.length}) chưa khớp voice timeline (${timeline.length}). Hãy tạo đủ cảnh và cắt voice lại.`);
    }

    const tempDir = path.join(outputDir, `temp_ffmpeg_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    sendLog("🚀 BẮT ĐẦU RENDER BẰNG FFMPEG...");
    
    if (!retainVideoAudio && voices.length > 0 && images.length !== voices.length) {
      throw new Error(`Số ảnh/video (${images.length}) chưa khớp số voice (${voices.length}). Hãy cắt lại voice hoặc hoàn thiện đủ phân cảnh trước khi render.`);
    }

    const segmentFiles: string[] = [];
    const pairCount = images.length;

    for (let i = 0; i < pairCount; i++) {
      const imgPath = path.join(resolvedImgDir, images[i]);
      // The final mux always uses the uninterrupted original voice.  A
      // per-scene voice file is optional and is only used to validate a
      // Whisper timeline, so do not construct a path when no cuts exist.
      const voicePath = voices[i] ? path.join(voiceDir || outputDir, voices[i]) : "";
      const outSeg = path.join(tempDir, `seg_${i.toString().padStart(3, '0')}.mp4`);
      const durationSec = Math.max(0.04, Number(timeline[i].durationMs || 0) / 1000).toFixed(3);
      const videoStartSec = Math.max(0, Number(timeline[i].startMs || 0) / 1000).toFixed(3);
      
      sendLog(`-> Đang render cảnh ${i + 1}/${pairCount}...`);
      
      // Chạy ffmpeg cho từng cặp
      const isVideo = mediaType === "video";
      
      const resMap: any = {
        "1080p": { "16:9": "1920:1080", "9:16": "1080:1920", "1:1": "1080:1080" },
        "720p": { "16:9": "1280:720", "9:16": "720:1280", "1:1": "720:720" },
        "4k": { "16:9": "3840:2160", "9:16": "2160:3840", "1:1": "2160:2160" }
      };
      const rawAspectRatio = String(aspectRatio || "16:9");
      const targetRatio = rawAspectRatio.includes("9:16") ? "9:16" : rawAspectRatio.includes("1:1") ? "1:1" : "16:9";
      const targetResType = resolution || "1080p";
      const resStr = resMap[targetResType]?.[targetRatio] || "1920:1080";
      const zoompanSize = resStr.replace(":", "x");
      const [outputWidth, outputHeight] = resStr.split(":").map(Number);
      // zoompan quantizes x/y to source pixels. A 4x working canvas makes each
      // source-pixel step only one quarter of an output pixel, removing the
      // repeated-frame/one-pixel-jump pattern visible on slow pans.
      const motionSourceRes = `${outputWidth * 4}:${outputHeight * 4}`;

      // 30 fps gives every frame enough positional travel. At 60 fps a gentle
      // pan can remain on the same integer source coordinate for several
      // frames and then jump, which looks less smooth despite the higher FPS.
      const motionFps = 30;
      const frameCount = Math.max(2, Math.round(Number(durationSec) * motionFps));
      const motionTemplates = motionIntensity === "gentle" ? [
        "zoom_in_center", "zoom_out_center", "pan_l_to_r", "pan_r_to_l"
      ] : [
        "zoom_in_center", "zoom_out_center", "zoom_in_corner", "zoom_out_corner",
        "pan_l_to_r", "pan_r_to_l", "pan_t_to_b", "pan_b_to_t",
        "diagonal_tl_to_br", "diagonal_bl_to_tr"
      ];
      const selectedMotion = motionTemplate === "none" ? "none" : motionTemplate === "auto"
        ? motionTemplates[i % motionTemplates.length]
        : motionTemplates.includes(motionTemplate) ? motionTemplate : "zoom_in_center";
      // FFmpeg exposes the total clip frame count as `duration` inside
      // zoompan expressions (the shorthand `d` is not available here).
      const progress = "on/(duration-1)";
      // Constant velocity is the most stable option for FFmpeg zoompan. Easing
      // continually changes a sub-pixel delta and exposes coordinate rounding
      // as micro-stutter, especially in vertical output.
      const easedProgress = progress;
      // Movement must remain visible even on short scenes. The old 2.5% zoom
      // looked almost static and amplified integer-coordinate stepping.
      const motionAmount = motionIntensity === "dynamic" ? 0.12 : motionIntensity === "natural" ? 0.085 : 0.055;
      const panZoom = (1 + motionAmount).toFixed(3);
      const motionExpressions: Record<string, { z: string; x: string; y: string }> = {
        zoom_in_center: { z: `min(1+${motionAmount}*(${easedProgress}),${panZoom})`, x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
        zoom_out_center: { z: `if(eq(on,0),${panZoom},max(${panZoom}-${motionAmount}*(${easedProgress}),1))`, x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
        zoom_in_corner: { z: `min(1+${motionAmount}*(${easedProgress}),${panZoom})`, x: "0", y: "0" },
        zoom_out_corner: { z: `if(eq(on,0),${panZoom},max(${panZoom}-${motionAmount}*(${easedProgress}),1))`, x: "iw-iw/zoom", y: "ih-ih/zoom" },
        pan_l_to_r: { z: panZoom, x: `(iw-iw/zoom)*(${easedProgress})`, y: "ih/2-(ih/zoom/2)" },
        pan_r_to_l: { z: panZoom, x: `(iw-iw/zoom)*(1-(${easedProgress}))`, y: "ih/2-(ih/zoom/2)" },
        pan_t_to_b: { z: panZoom, x: "iw/2-(iw/zoom/2)", y: `(ih-ih/zoom)*(${easedProgress})` },
        pan_b_to_t: { z: panZoom, x: "iw/2-(iw/zoom/2)", y: `(ih-ih/zoom)*(1-(${easedProgress}))` },
        diagonal_tl_to_br: { z: panZoom, x: `(iw-iw/zoom)*(${easedProgress})`, y: `(ih-ih/zoom)*(${easedProgress})` },
        diagonal_bl_to_tr: { z: panZoom, x: `(iw-iw/zoom)*(${easedProgress})`, y: `(ih-ih/zoom)*(1-(${easedProgress}))` },
      };
      const motion = motionExpressions[selectedMotion];
      const stillImageFilter = `[0:v]scale=${resStr}:force_original_aspect_ratio=decrease,pad=${resStr}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${motionFps},format=yuv420p[v]`;
      const imageFilter = selectedMotion === "none"
        ? stillImageFilter
        : `[0:v]scale=${motionSourceRes}:force_original_aspect_ratio=increase,crop=${motionSourceRes},setsar=1,zoompan=z='${motion.z}':d=${frameCount}:x='${motion.x}':y='${motion.y}':s=${zoompanSize}:fps=${motionFps},format=yuv420p[v]`;
      const videoFilter = `[0:v]scale=${resStr}:force_original_aspect_ratio=increase,crop=${resStr},setsar=1,fps=${motionFps},format=yuv420p[v]`;
      const filterComplex = isVideo ? videoFilter : imageFilter;
      if (!isVideo) sendLog(`-> Motion: ${selectedMotion}`);

      const ffmpegArgs = isVideo
        ? ["-nostdin", ...(retainVideoAudio && smartDialogueCut ? ["-ss", videoStartSec] : []), "-i", imgPath, "-filter_complex", filterComplex, "-map", "[v]", ...(retainVideoAudio ? ["-map", "0:a?"] : ["-an"]), "-t", durationSec, "-c:v", "libx264", ...(retainVideoAudio ? ["-c:a", "aac", "-b:a", "192k", "-shortest"] : []), "-pix_fmt", "yuv420p", "-y", outSeg]
        : ["-nostdin", "-loop", "1", "-framerate", "30", "-i", imgPath, "-filter_complex", filterComplex, "-map", "[v]", "-t", durationSec, "-an", "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p", "-y", outSeg];
        
      await new Promise((resolve, reject) => {
        const proc = spawn(FFMPEG_PATH, ffmpegArgs, { windowsHide: true });
        let ffmpegStderr = "";
        proc.stderr.on("data", (data) => {
          ffmpegStderr += data.toString();
        });
        proc.on("error", reject);
        proc.on("close", (code) => {
          if (code === 0) resolve(true);
          else {
            const detail = ffmpegStderr.trim().split(/\r?\n/).slice(-12).join("\n");
            fs.writeFileSync(path.join(tempDir, "render_error.log"), detail || `FFmpeg code ${code}`, "utf8");
            reject(new Error(`Cảnh ${i + 1} lỗi FFmpeg code ${code}: ${detail}`));
          }
        });
      });
      
      segmentFiles.push(outSeg);
    }

    // Nối file
    sendLog("-> Đang ghép (concat) các phân cảnh...");
    const concatListPath = path.join(tempDir, "concat_list.txt");
    const concatContent = segmentFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    const visualPath = path.join(tempDir, "visual_timeline.mp4");
    const safeName = String(newProjName).replace(/[\\/:*?"<>|]/g, " ").trim() || "FINAL_VIDEO";
    const createdAt = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
    const mediaSuffix = mediaType === "image" ? "img" : "vid";
    const finalOutPath = path.join(outputDir, `${safeName}_${mediaSuffix}_${createdAt}.mp4`);
    
    await new Promise((resolve, reject) => {
      const proc = spawn(FFMPEG_PATH, ["-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", "-y", visualPath], { windowsHide: true });
      proc.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new Error(`Ghép file lỗi FFmpeg code ${code}`));
      });
    });

    sendLog("-> Đã ghép hình/video theo timeline, chuẩn bị thay voice gốc liên tục...");

    let decoratedVisualPath = visualPath;
    const filterParts: string[] = [];
    let currentVideoLabel = "0:v";
    let inputCount = 1;
    if (subtitleEnabled) {
      const dialoguePath = String(subtitleScriptPath || "").trim();
      if (!dialoguePath || !fs.existsSync(dialoguePath)) throw new Error("Không tìm thấy file lời thoại để tạo phụ đề. Hãy chọn step3_dialogues.txt.");
      const rawDialogue = fs.readFileSync(dialoguePath, "utf8");
      const dialogues = Array.from(rawDialogue.matchAll(/^\[Dialogue\]:\s*(.+)$/gim)).map(match => match[1].trim()).filter(Boolean);
      if (!dialogues.length) throw new Error("File lời thoại chưa có các dòng [Dialogue] để tạo phụ đề.");
      const srtTime = (ms: number) => {
        const total = Math.max(0, Math.round(ms));
        const hours = Math.floor(total / 3600000);
        const minutes = Math.floor((total % 3600000) / 60000);
        const seconds = Math.floor((total % 60000) / 1000);
        const millis = total % 1000;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
      };
      const lineLimit = aspectRatio === "9:16" ? 24 : aspectRatio === "1:1" ? 32 : 44;
      const maxChunkLength = lineLimit * 2;
      const splitIntoChunks = (text: string) => {
        const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
        const chunks: string[] = [];
        let current = "";
        for (const word of words) {
          const candidate = current ? `${current} ${word}` : word;
          if (candidate.length > maxChunkLength && current) {
            chunks.push(current);
            current = word;
          } else current = candidate;
        }
        if (current) chunks.push(current);
        return chunks.length ? chunks : [""];
      };
      const wrapTwoLines = (text: string) => {
        const words = text.split(" ");
        const lines: string[] = [];
        let line = "";
        for (const word of words) {
          const candidate = line ? `${line} ${word}` : word;
          if (candidate.length > lineLimit && line && lines.length === 0) {
            lines.push(line);
            line = word;
          } else line = candidate;
        }
        if (line) lines.push(line);
        return lines.slice(0, 2).join("\n");
      };
      let cursorMs = 0;
      let subtitleIndex = 0;
      const subtitleEntries: string[] = [];
      const assEntries: string[] = [];
      const assTime = (ms: number) => {
        const totalCentiseconds = Math.max(0, Math.round(ms / 10));
        const hours = Math.floor(totalCentiseconds / 360000);
        const minutes = Math.floor((totalCentiseconds % 360000) / 6000);
        const seconds = Math.floor((totalCentiseconds % 6000) / 100);
        const centiseconds = totalCentiseconds % 100;
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
      };
      const escapeAssText = (text: string) => String(text || "")
        .replace(/\\/g, "\\\\")
        .replace(/[{}]/g, "")
        .replace(/\n/g, "\\N");
      timeline.forEach((entry: any, index: number) => {
        const durationMs = Math.max(100, Number(entry.durationMs || 0));
        const chunks = splitIntoChunks(dialogues[index] || dialogues[dialogues.length - 1]);
        const weights = chunks.map(chunk => Math.max(1, chunk.split(/\s+/).length));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let sceneCursor = cursorMs;
        chunks.forEach((chunk, chunkIndex) => {
          const isLast = chunkIndex === chunks.length - 1;
          const chunkDuration = isLast ? cursorMs + durationMs - sceneCursor : Math.round(durationMs * weights[chunkIndex] / totalWeight);
          subtitleIndex += 1;
          const renderedText = wrapTwoLines(chunk);
          subtitleEntries.push(`${subtitleIndex}\n${srtTime(sceneCursor)} --> ${srtTime(sceneCursor + chunkDuration)}\n${renderedText}\n`);
          assEntries.push(`Dialogue: 0,${assTime(sceneCursor)},${assTime(sceneCursor + chunkDuration)},VideoSubtitle,,0,0,0,,${escapeAssText(renderedText)}`);
          sceneCursor += chunkDuration;
        });
        cursorMs += durationMs;
      });
      const srtPath = path.join(outputDir, "subtitles_auto.srt");
      fs.writeFileSync(srtPath, subtitleEntries.join("\n"), "utf8");
      const normalizedSubtitleRatio = String(aspectRatio || "16:9").includes("9:16") ? "9:16" : String(aspectRatio || "16:9").includes("1:1") ? "1:1" : "16:9";
      const subtitleCanvas = normalizedSubtitleRatio === "9:16" ? { width: 1080, height: 1920 } : normalizedSubtitleRatio === "1:1" ? { width: 1080, height: 1080 } : { width: 1920, height: 1080 };
      const subtitleStyles: Record<string, { font: string; fontSize: number; primary: string; outlineColour: string; back: string; bold: number; borderStyle: number; outline: number; shadow: number }> = {
        modern: { font: "Arial", fontSize: normalizedSubtitleRatio === "9:16" ? 52 : 42, primary: "&H00FFFFFF", outlineColour: "&HDD000000", back: "&H00000000", bold: 1, borderStyle: 1, outline: 3, shadow: 2 },
        boxed: { font: "Arial", fontSize: normalizedSubtitleRatio === "9:16" ? 46 : 38, primary: "&H00FFFFFF", outlineColour: "&H00000000", back: "&H90000000", bold: 1, borderStyle: 3, outline: 10, shadow: 0 },
        minimal: { font: "Arial", fontSize: normalizedSubtitleRatio === "9:16" ? 38 : 31, primary: "&H0000E6FF", outlineColour: "&H99000000", back: "&H00000000", bold: 0, borderStyle: 1, outline: 1, shadow: 0 },
        shorts: { font: "Arial", fontSize: normalizedSubtitleRatio === "9:16" ? 66 : 54, primary: "&H0000FFFF", outlineColour: "&HFF000000", back: "&H00000000", bold: 1, borderStyle: 1, outline: 5, shadow: 2 },
        yellow_pop: { font: "Arial", fontSize: normalizedSubtitleRatio === "9:16" ? 72 : 58, primary: "&H0000D7FF", outlineColour: "&HFF000000", back: "&H00000000", bold: 1, borderStyle: 1, outline: 6, shadow: 3 },
        karaoke: { font: "Arial", fontSize: normalizedSubtitleRatio === "9:16" ? 60 : 48, primary: "&H00D7FF00", outlineColour: "&HFF3A1B00", back: "&H00000000", bold: 1, borderStyle: 1, outline: 4, shadow: 2 },
        news: { font: "Arial", fontSize: normalizedSubtitleRatio === "9:16" ? 48 : 40, primary: "&H00FFFFFF", outlineColour: "&H00B06000", back: "&HC0004000", bold: 1, borderStyle: 3, outline: 9, shadow: 0 },
        neon: { font: "Arial", fontSize: normalizedSubtitleRatio === "9:16" ? 62 : 50, primary: "&H00FF79FF", outlineColour: "&H00A00050", back: "&H50000000", bold: 1, borderStyle: 1, outline: 5, shadow: 3 },
      };
      const chosenSubtitleStyle = subtitleStyles[subtitleStyle] || subtitleStyles.modern;
      const alignmentByPosition: Record<string, number> = { bottom: 2, middle: 5, top: 8 };
      const marginV = subtitlePosition === "middle" ? 0 : normalizedSubtitleRatio === "9:16" ? (subtitlePosition === "top" ? 150 : 260) : (subtitlePosition === "top" ? 60 : 86);
      const assPath = path.join(tempDir, "subtitles_styled.ass");
      const assHeader = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${subtitleCanvas.width}\nPlayResY: ${subtitleCanvas.height}\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: VideoSubtitle,${chosenSubtitleStyle.font},${chosenSubtitleStyle.fontSize},${chosenSubtitleStyle.primary},&H000000FF,${chosenSubtitleStyle.outlineColour},${chosenSubtitleStyle.back},${chosenSubtitleStyle.bold},0,0,0,100,100,0,0,${chosenSubtitleStyle.borderStyle},${chosenSubtitleStyle.outline},${chosenSubtitleStyle.shadow},${alignmentByPosition[subtitlePosition] || 2},70,70,${marginV},1\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n`;
      fs.writeFileSync(assPath, assHeader + assEntries.join("\n") + "\n", "utf8");
      const escapedAssPath = assPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
      filterParts.push(`[${currentVideoLabel}]ass=filename='${escapedAssPath}'[subt]`);
      currentVideoLabel = "subt";
      sendLog(`-> Đã tạo phụ đề: ${srtPath}`);
    }
    if (watermarkType === "image" && watermarkPath && fs.existsSync(watermarkPath)) {
      const overlayByPosition: Record<string, string> = {
        "top-left": "24:24", "top-right": "W-w-24:24", "bottom-left": "24:H-h-24", "bottom-right": "W-w-24:H-h-24"
      };
      filterParts.push(`[1:v]scale=160:-1[wm];[${currentVideoLabel}][wm]overlay=${overlayByPosition[watermarkPosition] || overlayByPosition["bottom-right"]}:format=auto[marked]`);
      currentVideoLabel = "marked";
      inputCount = 2;
      sendLog("-> Đã thêm logo/watermark vào video.");
    } else if (watermarkType === "text" && String(watermarkText || "").trim()) {
      const watermarkTextPath = path.join(tempDir, "watermark_text.txt");
      fs.writeFileSync(watermarkTextPath, String(watermarkText).trim(), "utf8");
      const escapedTextPath = watermarkTextPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
      const fontPath = "C\\:/Windows/Fonts/arial.ttf";
      const textPosition: Record<string, { x: string; y: string }> = {
        "top-left": { x: "32", y: "32" },
        "top-right": { x: "w-tw-32", y: "32" },
        "bottom-left": { x: "32", y: "h-th-32" },
        "bottom-right": { x: "w-tw-32", y: "h-th-32" },
      };
      const position = textPosition[watermarkPosition] || textPosition["bottom-right"];
      const fontSize = aspectRatio === "9:16" ? 32 : 28;
      filterParts.push(`[${currentVideoLabel}]drawtext=fontfile='${fontPath}':textfile='${escapedTextPath}':fontcolor=white@0.82:fontsize=${fontSize}:borderw=2:bordercolor=black@0.55:x='${position.x}':y='${position.y}'[marked]`);
      currentVideoLabel = "marked";
      sendLog("-> Đã thêm watermark dạng chữ vào video.");
    }
    if (filterParts.length) {
      decoratedVisualPath = path.join(tempDir, "visual_decorated.mp4");
      const decorateArgs = ["-i", visualPath];
      if (inputCount === 2) decorateArgs.push("-i", watermarkPath);
      decorateArgs.push("-filter_complex", filterParts.join(";"), "-map", `[${currentVideoLabel}]`, ...(retainVideoAudio ? ["-map", "0:a?"] : ["-an"]), "-c:v", "libx264", ...(retainVideoAudio ? ["-c:a", "aac", "-b:a", "192k"] : []), "-pix_fmt", "yuv420p", "-y", decoratedVisualPath);
      const decorationResult = await runFfmpeg(decorateArgs);
      if (decorationResult.code !== 0) throw new Error(`Không thể chèn phụ đề/logo: ${decorationResult.stderr.trim()}`);
    }

    // Dọn dẹp
    sendLog("-> Đang thay voice gốc liên tục vào video cuối để không bị giật giữa các đoạn...");
    if (retainVideoAudio) {
      sendLog("-> Giữ nguyên tiếng gốc của các đoạn video AI.");
      const copyResult = await runFfmpeg(["-i", decoratedVisualPath, "-map", "0:v:0", "-map", "0:a?", "-c", "copy", "-y", finalOutPath]);
      if (copyResult.code !== 0) throw new Error(`Không thể ghép audio gốc của video: ${copyResult.stderr.trim()}`);
      sendLog(`🎉 RENDER THÀNH CÔNG: ${finalOutPath}`);
      const removedCuts = removeCutVoiceFiles();
      if (removedCuts) sendLog(`-> Đã dọn ${removedCuts} file voice cắt trung gian; giữ lại voice gốc.`);
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
      res.write(`data: ${JSON.stringify({ type: 'done', outputPath: finalOutPath })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'close', code: 0 })}\n\n`);
      return res.end();
    }
    const visualDurationMs = await getAudioDurationMs(decoratedVisualPath);
    const targetDurationSec = (sourceDurationMs / 1000).toFixed(3);
    const videoDurationGapSec = Math.max(0, (sourceDurationMs - visualDurationMs) / 1000).toFixed(3);
    const finalVideoFilter = visualDurationMs < sourceDurationMs
      ? `[0:v]tpad=stop_mode=clone:stop_duration=${videoDurationGapSec},trim=duration=${targetDurationSec},setpts=PTS-STARTPTS[vfinal]`
      : `[0:v]trim=duration=${targetDurationSec},setpts=PTS-STARTPTS[vfinal]`;
    const muxResult = await runFfmpeg(["-i", decoratedVisualPath, "-i", sourceAudio, "-filter_complex", finalVideoFilter, "-map", "[vfinal]", "-map", "1:a:0", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-t", targetDurationSec, "-y", finalOutPath]);
    if (muxResult.code !== 0) throw new Error(`Không thể ghép voice gốc: ${muxResult.stderr.trim()}`);
    sendLog(`🎉 RENDER THÀNH CÔNG: ${finalOutPath}`);
    const removedCuts = removeCutVoiceFiles();
    if (removedCuts) sendLog(`-> Đã dọn ${removedCuts} file voice cắt trung gian; giữ lại voice gốc.`);

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch(e) {}

    res.write(`data: ${JSON.stringify({ type: 'done', outputPath: finalOutPath })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'close', code: 0 })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'close', code: 1 })}\n\n`);
    res.end();
  }
});

// ==========================================
// SAVE FILE API
// ==========================================
app.post("/api/save-file", (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ success: false, error: "Missing path or content" });
    }
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, "utf-8");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// DOWNLOAD AUDIO API
// ==========================================
app.post("/api/download-audio", async (req, res) => {
  try {
    const { url, audioData, path: rawPath } = req.body;
    if (!rawPath || (!url && !audioData)) {
      return res.status(400).json({ success: false, error: "Missing url/audioData or path" });
    }
    const filePath = path.resolve(rawPath);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let finalUrl = url;
    let finalAudioData = audioData;

    if (finalAudioData && finalAudioData.startsWith("http")) {
      finalUrl = finalAudioData;
      finalAudioData = undefined;
    }

    if (finalAudioData) {
      let pureBase64 = finalAudioData;
      if (pureBase64.includes("base64,")) {
        pureBase64 = pureBase64.split("base64,")[1];
      }
      fs.writeFileSync(filePath, Buffer.from(pureBase64, "base64"));
    } else {
      const fetchRes = await fetch(finalUrl);
      if (!fetchRes.ok) throw new Error(`Failed to fetch audio: ${fetchRes.statusText}`);
      const buffer = await fetchRes.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Check file exists
app.post("/api/project-output-summary", (req, res) => {
  try {
    const projectDir = String(req.body?.projectDir || "").trim();
    if (!projectDir) return res.status(400).json({ success: false, error: "Chưa chọn thư mục dự án." });
    const root = path.resolve(projectDir);
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
      return res.status(400).json({ success: false, error: "Thư mục dự án không tồn tại." });
    }
    const filesIn = (dir: string, pattern: RegExp) => fs.existsSync(dir)
      ? fs.readdirSync(dir).filter(file => pattern.test(file))
      : [];
    const imageDir = path.join(root, "img");
    const videoDir = path.join(root, "vid");
    const voiceDir = path.join(root, "vocie");
    const images = filesIn(imageDir, /\.(?:png|jpe?g|webp)$/i);
    const videos = filesIn(videoDir, /\.mp4$/i);
    const cutVoices = filesIn(voiceDir, /\.(?:wav|mp3)$/i);
    const finalVideos = filesIn(root, /\.mp4$/i)
      .map(file => ({ file, fullPath: path.join(root, file), stat: fs.statSync(path.join(root, file)) }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    const scriptCandidates = ["step3_dialogues.txt", "script.txt", "raw_script.txt"].map(file => path.join(root, file));
    const scriptPath = scriptCandidates.find(file => fs.existsSync(file)) || "";
    const originalVoice = ["voice_original.mp3", "voice_original.wav"].map(file => path.join(root, file)).find(file => fs.existsSync(file)) || "";
    const thumbnailCandidates = filesIn(root, /^thumbnail_.*\.(?:png|jpe?g|webp)$/i)
      .map(file => ({ file, fullPath: path.join(root, file), stat: fs.statSync(path.join(root, file)) }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    const seoPath = path.join(root, "seo.txt");
    const seoTitle = fs.existsSync(seoPath)
      ? String(fs.readFileSync(seoPath, "utf8").match(/TIÊU ĐỀ\s*\r?\n([^\r\n]+)/i)?.[1] || "").trim()
      : "";
    const previewImage = images.length ? path.join(imageDir, images[0]) : "";
    const previewVideo = videos.length ? path.join(videoDir, videos[0]) : "";
    let latestError = "";
    const tempFolders = fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory() && entry.name.startsWith("temp_ffmpeg_"));
    for (const folder of tempFolders) {
      const errorPath = path.join(root, folder.name, "render_error.log");
      if (fs.existsSync(errorPath)) latestError = fs.readFileSync(errorPath, "utf8").trim();
    }
    // Voice cuts are optional: rendering uses the continuous original voice
    // to avoid audible gaps.  Output progress therefore tracks deliverables,
    // not the optional Whisper alignment cache.
    const completedChecks = [!!scriptPath, images.length > 0 || videos.length > 0, !!originalVoice, fs.existsSync(seoPath), thumbnailCandidates.length > 0, finalVideos.length > 0];
    res.json({
      success: true,
      progress: Math.round(completedChecks.filter(Boolean).length / completedChecks.length * 100),
      script: { ready: !!scriptPath, path: scriptPath, size: scriptPath ? fs.statSync(scriptPath).size : 0 },
      media: { ready: images.length > 0 || videos.length > 0, imageCount: images.length, videoCount: videos.length, previewImage, previewVideo },
      voice: { ready: !!originalVoice, originalPath: originalVoice, cutCount: cutVoices.length },
      seo: { ready: fs.existsSync(seoPath), path: seoPath, title: seoTitle },
      thumbnail: thumbnailCandidates.length ? { ready: true, path: thumbnailCandidates[0].fullPath, name: thumbnailCandidates[0].file } : { ready: false },
      finalVideo: finalVideos.length ? { ready: true, path: finalVideos[0].fullPath, name: finalVideos[0].file, size: finalVideos[0].stat.size, updatedAt: finalVideos[0].stat.mtime.toISOString() } : { ready: false },
      latestError,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Keep projects created with the historical "FB AFFILILATE" folder usable
// when a newer UI path uses the corrected spelling "FB AFFILIATE".
function resolveCompatibleProjectPath(rawPath: string) {
  const resolved = path.resolve(rawPath);
  if (fs.existsSync(resolved)) return resolved;
  const aliases = [
    resolved.replace(/FB AFFILIATE/gi, "FB AFFILILATE"),
    resolved.replace(/FB AFFILILATE/gi, "FB AFFILIATE"),
  ];
  return aliases.find((candidate) => fs.existsSync(candidate)) || resolved;
}

app.post("/api/check-file", (req, res) => {
  try {
    const { path: rawPath } = req.body;
    if (!rawPath) return res.status(400).json({ exists: false });
    const filePath = resolveCompatibleProjectPath(rawPath);
    res.json({ exists: fs.existsSync(filePath) });
  } catch (err) {
    res.json({ exists: false });
  }
});

// Return only media filenames from a project subfolder. The UI uses this to
// recover previews after a refresh or after a streamed batch reconnects.
app.post("/api/list-project-media", (req, res) => {
  try {
    const { directory } = req.body || {};
    if (!directory) return res.status(400).json({ success: false, files: [] });
    const resolvedDirectory = resolveCompatibleProjectPath(String(directory));
    if (!fs.existsSync(resolvedDirectory) || !fs.statSync(resolvedDirectory).isDirectory()) {
      return res.json({ success: true, files: [] });
    }
    const files = fs.readdirSync(resolvedDirectory)
      .filter((file) => /\.(?:jpe?g|png|webp|mp4)$/i.test(file));
    return res.json({ success: true, files });
  } catch (error: any) {
    return res.json({ success: false, files: [], error: error?.message || "Could not list media" });
  }
});

// ==========================================
// NATIVE DIALOG PICKER & SERVE LOCAL FILES
// ==========================================
app.post("/api/upload-reference-image", (req, res) => {
  try {
    const { imageData, fileName = "reference.png", projectDir = "" } = req.body || {};
    if (!imageData || typeof imageData !== "string") return res.status(400).json({ success: false, error: "Thiếu dữ liệu ảnh tham chiếu." });
    const match = imageData.match(/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i);
    if (!match) return res.status(400).json({ success: false, error: "Định dạng ảnh tham chiếu không hợp lệ." });
    const mime = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], "base64");
    if (!buffer.length || buffer.length > 4 * 1024 * 1024) return res.status(400).json({ success: false, error: "Ảnh tham chiếu phải nhỏ hơn 4 MB." });
    const root = projectDir && typeof projectDir === "string"
      ? resolveCompatibleProjectPath(projectDir)
      : path.join(process.cwd(), "data", "reference-images");
    const targetDir = path.join(root, "references");
    fs.mkdirSync(targetDir, { recursive: true });
    const ext = mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : ".jpg";
    const safeBaseName = path.basename(String(fileName)).replace(/[^a-z0-9_-]/gi, "_").slice(0, 60) || "reference";
    const savedPath = path.join(targetDir, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeBaseName.replace(/\.[^.]+$/, "")}${ext}`);
    fs.writeFileSync(savedPath, buffer);
    res.json({ success: true, path: savedPath, url: `/api/serve-local-file?path=${encodeURIComponent(savedPath)}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Không thể lưu ảnh tham chiếu." });
  }
});

// Lưu voice do khách tự tạo bên ngoài. Luôn quy đổi về voice_original.mp3 để
// Whisper, cắt voice và render sau đó cùng dùng đúng một nguồn âm thanh.
app.post("/api/upload-external-voice", async (req, res) => {
  let temporaryPath = "";
  try {
    const { audioData, fileName = "voice.mp3", projectDir = "" } = req.body || {};
    if (!audioData || typeof audioData !== "string") return res.status(400).json({ success: false, error: "Thiếu file voice." });
    const match = audioData.match(/^data:audio\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=\r\n]+)$/);
    if (!match) return res.status(400).json({ success: false, error: "File voice phải là MP3, WAV, M4A hoặc định dạng audio hợp lệ." });
    const buffer = Buffer.from(match[1], "base64");
    if (!buffer.length || buffer.length > 150 * 1024 * 1024) return res.status(400).json({ success: false, error: "File voice phải nhỏ hơn 150 MB." });
    const root = projectDir && typeof projectDir === "string" ? resolveCompatibleProjectPath(projectDir) : "";
    if (!root) return res.status(400).json({ success: false, error: "Hãy chọn thư mục dự án trước khi tải voice." });
    fs.mkdirSync(root, { recursive: true });
    const extension = path.extname(path.basename(String(fileName))).replace(/[^.a-z0-9]/gi, "").toLowerCase() || ".audio";
    temporaryPath = path.join(root, `.__external_voice_${Date.now()}${extension}`);
    const outputPath = path.join(root, "voice_original.mp3");
    fs.writeFileSync(temporaryPath, buffer);
    const converted = await runFfmpeg(["-hide_banner", "-loglevel", "error", "-y", "-i", temporaryPath, "-vn", "-c:a", "libmp3lame", "-b:a", "192k", outputPath]);
    if (converted.code !== 0 || !fs.existsSync(outputPath)) throw new Error(converted.stderr || "FFmpeg không thể đọc file voice này.");
    if (temporaryPath && fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    return res.json({ success: true, path: outputPath, url: `/api/serve-local-file?path=${encodeURIComponent(outputPath)}&t=${Date.now()}` });
  } catch (error: any) {
    if (temporaryPath && fs.existsSync(temporaryPath)) {
      try { fs.unlinkSync(temporaryPath); } catch { /* ignore cleanup failure */ }
    }
    return res.status(500).json({ success: false, error: error?.message || "Không thể lưu voice bên ngoài." });
  }
});

app.get("/api/serve-local-file", (req, res) => {
  try {
    const { path: rawPath } = req.query;
    if (!rawPath || typeof rawPath !== 'string') {
      return res.status(400).send("Missing path");
    }
    const filePath = resolveCompatibleProjectPath(rawPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});
app.get("/api/dialog/pick", (req, res) => {
  const mode = req.query.mode === "file" ? "file" : "dir";
  const title = typeof req.query.title === "string" ? req.query.title : "Select folder";

  if (process.platform !== "win32") {
    return res.status(501).json({ success: false, error: "Native folder selection is only available on Windows." });
  }

  // This dialog is more reliable than Tkinter when the server runs from Codex.
  // Pass the title directly into the script. Arguments placed after
  // `-Command` are unreliable with PowerShell's STA GUI host and previously
  // caused the picker to silently fail on some Windows installations.
  const safeTitle = title.replace(/'/g, "''");
  const script = mode === "file"
    ? `Add-Type -AssemblyName System.Windows.Forms; $d=New-Object System.Windows.Forms.OpenFileDialog; $d.Title='${safeTitle}'; if($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK){[Console]::Out.Write($d.FileName)}`
    : `Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[Flags] public enum FolderDialogOptions : uint { PickFolders=0x20, ForceFileSystem=0x40, PathMustExist=0x800 }
public enum ShellDisplayName : uint { FileSystemPath=0x80058000 }
[ComImport, Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IShellItem { void BindToHandler(IntPtr pbc, ref Guid bhid, ref Guid riid, out IntPtr ppv); void GetParent(out IShellItem ppsi); void GetDisplayName(ShellDisplayName sigdnName, out IntPtr ppszName); void GetAttributes(uint sfgaoMask, out uint psfgaoAttribs); void Compare(IShellItem psi, uint hint, out int piOrder); }
[ComImport, Guid("42F85136-DB7E-439C-85F1-E4075D135FC8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IFileDialog { [PreserveSig] int Show(IntPtr parent); void SetFileTypes(uint cFileTypes, IntPtr rgFilterSpec); void SetFileTypeIndex(uint iFileType); void GetFileTypeIndex(out uint piFileType); void Advise(IntPtr pfde, out uint pdwCookie); void Unadvise(uint dwCookie); void SetOptions(FolderDialogOptions fos); void GetOptions(out FolderDialogOptions pfos); void SetDefaultFolder(IShellItem psi); void SetFolder(IShellItem psi); void GetFolder(out IShellItem ppsi); void GetCurrentSelection(out IShellItem ppsi); void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName); void GetFileName(out IntPtr pszName); void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle); void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText); void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel); void GetResult(out IShellItem ppsi); void AddPlace(IShellItem psi, int fdap); void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string pszDefaultExtension); void Close(int hr); void SetClientGuid(ref Guid guid); void ClearClientData(); void SetFilter(IntPtr pFilter); }
[ComImport, Guid("D57C7288-D4AD-4768-BE02-9D969532D960"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IFileOpenDialog : IFileDialog { void GetResults(out IntPtr ppenum); void GetSelectedItems(out IntPtr ppsai); }
[ComImport, Guid("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")]
public class FileOpenDialog { }
public static class ModernFolderPicker { public static string Pick(string title) { var dialog=(IFileOpenDialog)new FileOpenDialog(); FolderDialogOptions options; dialog.GetOptions(out options); dialog.SetOptions(options | FolderDialogOptions.PickFolders | FolderDialogOptions.ForceFileSystem | FolderDialogOptions.PathMustExist); dialog.SetTitle(title); if(dialog.Show(IntPtr.Zero) != 0) return ""; IShellItem item; dialog.GetResult(out item); IntPtr raw; item.GetDisplayName(ShellDisplayName.FileSystemPath, out raw); try { return Marshal.PtrToStringUni(raw) ?? ""; } finally { if(raw != IntPtr.Zero) Marshal.FreeCoTaskMem(raw); } } }
'@; [Console]::Out.Write([ModernFolderPicker]::Pick('${safeTitle}'))`;
  const picker = spawn("powershell.exe", ["-NoLogo", "-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-Command", script], { windowsHide: false });
  let output = "";
  let errorOutput = "";
  picker.stdout.on("data", (chunk) => { output += chunk.toString(); });
  picker.stderr.on("data", (chunk) => { errorOutput += chunk.toString(); });
  picker.on("error", (error) => res.status(500).json({ success: false, error: `Không thể mở hộp chọn Windows: ${error.message}` }));
  picker.on("close", (code) => {
    if (code !== 0) return res.status(500).json({ success: false, error: errorOutput || "Could not open the folder picker." });
    res.json({ success: Boolean(output.trim()), path: output.trim() });
  });
});

// Read only the small project files that the UI can restore when the user
// switches project folders. Media files are served separately by their URL.
app.post("/api/project-state", (req, res) => {
  try {
    const { path: rawPath } = req.body;
    if (!rawPath || typeof rawPath !== "string") return res.status(400).json({ success: false, error: "Thiếu đường dẫn thư mục dự án." });
    const projectPath = path.resolve(rawPath);
    const readText = (fileName: string) => {
      const filePath = path.join(projectPath, fileName);
      if (!fs.existsSync(filePath)) return "";
      const stats = fs.statSync(filePath);
      if (stats.size > 5 * 1024 * 1024) return "";
      return fs.readFileSync(filePath, "utf-8");
    };
    const voicePath = path.join(projectPath, "voice_original.mp3");
    res.json({
      success: true,
      rawScript: readText("raw_script.txt"),
      backupScript: readText("script.txt"),
      hasVoice: fs.existsSync(voicePath),
      voicePath: fs.existsSync(voicePath) ? voicePath : "",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/copy-project-files", (req, res) => {
  try {
    const { sourcePath, targetPath } = req.body;
    if (!sourcePath || !targetPath) return res.status(400).json({ success: false, error: "Thiếu thư mục nguồn hoặc thư mục đích." });
    const source = path.resolve(sourcePath);
    const target = path.resolve(targetPath);
    if (source === target) return res.json({ success: true, copied: [] });
    if (!fs.existsSync(source)) return res.json({ success: true, copied: [] });
    fs.mkdirSync(target, { recursive: true });
    const copied: string[] = [];
    for (const name of ["script.txt", "raw_script.txt", "step3_dialogues.txt", "voice_original.mp3", "img", "vid", "voice", "vocie"]) {
      const from = path.join(source, name);
      const to = path.join(target, name);
      if (!fs.existsSync(from)) continue;
      fs.cpSync(from, to, { recursive: true, force: true });
      copied.push(name);
    }
    res.json({ success: true, copied });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/dialog/pick-legacy", (req, res) => {
  const mode = req.query.mode || 'file';
  const title = req.query.title || 'Chọn';
  const scriptPath = path.join(process.cwd(), "python_scripts", "dialog_picker.py");
  
  exec(`python "${scriptPath}" "${mode}" "${title}"`, (error, stdout, stderr) => {
    if (error) {
       return res.status(500).json({ success: false, error: error.message });
    }
    try {
       const result = JSON.parse(stdout.trim());
       res.json({ success: true, path: result.path });
    } catch(e) {
       res.status(500).json({ success: false, error: stdout });
    }
  });
});

app.post("/api/timeline/ultra-process", (req, res) => {
  try {
    const { draftContent, options } = req.body;
    if (!draftContent) {
      return res.status(400).json({ success: false, error: "Missing draftContent" });
    }

    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempInput = path.join(tempDir, `draft_in_${Date.now()}.json`);
    const tempOutput = path.join(tempDir, `draft_out_${Date.now()}.json`);

    fs.writeFileSync(tempInput, JSON.stringify(draftContent, null, 2), "utf-8");

    const scriptPath = path.join(process.cwd(), "capcut_ultra_tool.py");
    const args = [
      scriptPath,
      "--input", tempInput,
      "--output", tempOutput
    ];

    if (options.sync_image_to_audio) args.push("--sync_image_to_audio");
    if (options.ultra_music_mix) args.push("--ultra_music_mix");
    if (options.custom_audio_order) {
      args.push("--custom_audio_order");
      if (options.audio_order_list) {
        args.push("--audio_order_list", options.audio_order_list);
      }
    }
    if (options.randomize_video) args.push("--randomize_video");
    if (options.dynamic_motion) args.push("--dynamic_motion");
    if (options.auto_transition) args.push("--auto_transition");
    if (options.clear_transitions) args.push("--clear_transitions");
    if (options.auto_fill_canvas) args.push("--auto_fill_canvas");
    if (options.normalize_volume) args.push("--normalize_volume");
    if (options.reverse_timeline) args.push("--reverse_timeline");
    if (options.auto_subtitles) args.push("--auto_subtitles");

    console.log(`[Python Ultra] Running: python ${args.join(" ")}`);

    const pythonProcess = spawn("python", args, { shell: true });

    let stderr = "";
    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      try {
        if (code !== 0) {
          console.error(`Python ultra script failed with code ${code}. Stderr: ${stderr}`);
          return res.status(500).json({ success: false, error: `Python execution failed: ${stderr}` });
        }

        if (!fs.existsSync(tempOutput)) {
          return res.status(500).json({ success: false, error: "Output file was not generated" });
        }

        const outputData = fs.readFileSync(tempOutput, "utf-8");
        const parsedOutput = JSON.parse(outputData);

        // Clean up temp files
        try {
          fs.unlinkSync(tempInput);
          fs.unlinkSync(tempOutput);
        } catch (e) {
          console.warn("Failed to clean up temp files", e);
        }

        res.json({ success: true, processedContent: parsedOutput });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Vite Dev Server / Static files middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("[OK] Server running on http://localhost:" + PORT);
  });
}

startServer().catch((err) => {
  console.error("Critical server error during boot:", err);
});
