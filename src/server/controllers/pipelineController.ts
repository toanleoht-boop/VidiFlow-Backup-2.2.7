import express, { Request, Response } from "express";
import { exec, spawn } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";
import { closeAllBatchPages, generateImageWithPlaywright, generateBatchImagesWithGeminiChat, generateParallelBatchImagesWithGoogleLabs, setBatchCancelled, generateBatchImagesWithViettheoAPI, generateImageWithViettheoAPI } from "../services/imageGeneratorService.js";
import { uploadToCatbox } from "../services/catboxUploader.js";
import { closeAllAutoLaunchedPlaywrightBrowsers, closeAutoLaunchedPlaywrightBrowser, portContext, registerToolLaunchedChrome } from "../services/audioService.js";

const router = express.Router();

// Cache object for simple cache logic
const imageCache: Record<string, string> = {};
let isBatchRequestActive = false;

async function waitForChromeDebugPort(port: number, timeoutMs = 8000): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return true;
    } catch {
      // Chrome has not finished binding its DevTools port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

async function readChromeDebugBrowser(port: number): Promise<string> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`);
    if (!response.ok) return "";
    const payload = await response.json() as { Browser?: string };
    return String(payload?.Browser || "");
  } catch {
    return "";
  }
}

async function openChromeDebugTab(port: number, url: string): Promise<void> {
  try {
    await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  } catch {
    // The visible Chrome launch itself remains the fallback when CDP tab
    // creation is unavailable on a particular Chrome version.
  }
}

async function getListeningPid(port: number): Promise<number | null> {
  if (process.platform !== "win32") return null;
  return await new Promise((resolve) => {
    exec("netstat -ano -p tcp", { windowsHide: true }, (_error, stdout) => {
      const pattern = new RegExp(`(?:127\\.0\\.0\\.1|0\\.0\\.0\\.0|\\[::\\]):${port}\\s+\\S+\\s+(\\d+)`, "i");
      const match = String(stdout || "").match(pattern);
      resolve(match ? Number(match[1]) : null);
    });
  });
}

async function terminateChromeProcess(pid: number | null): Promise<void> {
  if (!pid || pid <= 0 || process.platform !== "win32") return;
  await new Promise<void>((resolve) => {
    exec(`taskkill /PID ${Math.round(pid)} /T /F`, { windowsHide: true }, () => resolve());
  });
}

type BatchProfile = { port: number; concurrency?: number; active?: boolean; name?: string };

type ChromeFallbackNotice = {
  fromPort: number;
  toPort: number;
  sceneIds: string[];
  reason: string;
};

function getActiveChromeProfiles(visualConfig: any): BatchProfile[] {
  const selected: BatchProfile[] = Array.isArray(visualConfig?.chromeProfiles)
    ? visualConfig.chromeProfiles.filter((profile: BatchProfile) => profile.active !== false && Number(profile.port) > 0)
    : [];
  return selected.length ? selected : [{ port: 9222, concurrency: 1, active: true, name: "Chrome mặc định" }];
}

function shouldRetryOnAnotherChrome(result: any): boolean {
  if (result?.success) return false;
  const message = String(result?.warning || result?.error || result?.message || "").toLowerCase();
  // Bad prompts should be fixed by the user, but provider/browser/session/credit
  // failures can usually be recovered by a second signed-in Chrome profile.
  return !/(thiếu prompt|missing prompt|invalid prompt|prompt không hợp lệ)/i.test(message);
}

async function generateBatchOnChrome(profile: BatchProfile, profileItems: any[], visualConfig: any, style: string | undefined, onProgress?: (result: any) => void) {
  // Respect the exact tab count configured for this Chrome profile. The media
  // service gives each tab its own Playwright page, so tabs no longer share or
  // reset the same Flow page while generating in parallel.
  const tabCount = Math.min(
    profileItems.length,
    Math.max(1, Number(visualConfig?.tabsPerChrome) || Number(profile.concurrency) || 1),
  );
  console.log(`[Batch scheduler] Chrome ${profile.port}, ${tabCount} tab(s): ${profileItems.map(item => item.sceneId).join(", ")}`);
  const scopedConfig = { ...visualConfig, threadCount: tabCount, chromeProfiles: [{ ...profile, concurrency: tabCount }] };
  return portContext.run(profile.port, async () => {
    if (scopedConfig?.generationMode === "viettheo-api") {
      return generateBatchImagesWithViettheoAPI(profileItems, scopedConfig, style, onProgress);
    }
    if (scopedConfig?.generationMode === "labs-flow" || scopedConfig?.generationMode === "google_labs") {
      return generateParallelBatchImagesWithGoogleLabs(profileItems, scopedConfig, style, onProgress);
    }
    return generateBatchImagesWithGeminiChat(profileItems, scopedConfig, style, onProgress);
  });
}

/** Evenly assigns each prompt to exactly one selected Chrome profile. */
async function runBatchAcrossChromeProfiles(items: any[], visualConfig: any, style: string | undefined, onProgress?: (result: any) => void, onFallback?: (notice: ChromeFallbackNotice) => void) {
  const sceneIds = new Set<string>();
  for (const item of items) {
    if (!item?.sceneId || sceneIds.has(item.sceneId)) {
      throw new Error(`Danh sách batch có cảnh trùng: ${item?.sceneId || "không xác định"}. Batch đã bị chặn để không tạo trùng.`);
    }
    sceneIds.add(item.sceneId);
  }

  // VietTheo is an HTTP API and does not use Chrome profiles. Treat the
  // user's thread selector as API concurrency directly, capped at the
  // provider's documented maximum of seven concurrent jobs.
  if (visualConfig?.generationMode === "viettheo-api") {
    const requested = Math.floor(Number(visualConfig?.threadCount) || 7);
    const apiConcurrency = Math.min(7, items.length, Math.max(1, requested));
    console.log(`[Batch scheduler] VietTheo API, ${apiConcurrency} concurrent job(s): ${items.map(item => item.sceneId).join(", ")}`);
    return generateBatchImagesWithViettheoAPI(
      items,
      { ...visualConfig, threadCount: apiConcurrency },
      style,
      onProgress,
    );
  }

  const selected: BatchProfile[] = Array.isArray(visualConfig?.chromeProfiles) && visualConfig.chromeProfiles.length
    ? visualConfig.chromeProfiles.filter((profile: BatchProfile) => profile.active !== false && Number(profile.port) > 0)
    : [];
  if (visualConfig?.chromeProfilesEnabled && selected.length === 0) {
    throw new Error("Chế độ nhiều Chrome đang bật nhưng chưa chọn profile Chrome nào trong Cài đặt.");
  }
  // One "luồng" is one Chrome profile. The configured tab count is applied
  // inside that Chrome, so 3 luồng reliably means 3 different Chrome ports.
  const requestedChromeCount = Math.max(1, Number(visualConfig?.threadCount) || 1);
  if (visualConfig?.chromeProfilesEnabled && selected.length < requestedChromeCount) {
    // Never abandon an entire batch because the profile list was changed
    // after the thread slider. Use every available profile and keep running.
    console.warn(`[Batch scheduler] Requested ${requestedChromeCount} Chrome profiles, but only ${selected.length} selected. Continuing with available profiles.`);
  }
  // Respect the configured Chrome count for every browser provider, including
  // Flow. Each selected profile owns its pages and account session.
  const primaryProfileCount = requestedChromeCount;
  const profiles = selected.length
    ? selected.slice(0, Math.min(primaryProfileCount, selected.length))
    : [{ port: 9222, concurrency: 1, active: true }];
  const buckets = new Map<number, { profile: BatchProfile; items: any[] }>();
  items.forEach((item, index) => {
    const profile = profiles[index % profiles.length];
    const bucket = buckets.get(profile.port) || { profile, items: [] };
    bucket.items.push(item);
    buckets.set(profile.port, bucket);
  });

  const resultBySceneId = new Map<string, any>();
  const primaryGroups = await Promise.all([...buckets.values()].map(async ({ profile, items: profileItems }) => {
    try {
      const results = await generateBatchOnChrome(profile, profileItems, visualConfig, style, onProgress);
      return { profile, items: profileItems, results: Array.isArray(results) ? results : [] };
    } catch (error: any) {
      const warning = error?.message || "Chrome không thể hoàn tất lượt tạo này.";
      return { profile, items: profileItems, results: profileItems.map(item => ({ sceneId: item.sceneId, success: false, warning })) };
    }
  }));

  for (const group of primaryGroups) {
    group.results.forEach(result => resultBySceneId.set(result.sceneId, result));
    let pending = group.items.filter(item => shouldRetryOnAnotherChrome(resultBySceneId.get(item.sceneId)));
    const alternatives = selected.filter(profile => profile.port !== group.profile.port);

    for (const fallbackProfile of alternatives) {
      if (!pending.length) break;
      const reason = String(resultBySceneId.get(pending[0].sceneId)?.warning || "Lỗi tạo hoặc không còn credit trên Chrome ban đầu.");
      onFallback?.({ fromPort: group.profile.port, toPort: fallbackProfile.port, sceneIds: pending.map(item => item.sceneId), reason });
      console.warn(`[Batch scheduler] Fallback ${group.profile.port} -> ${fallbackProfile.port}: ${pending.map(item => item.sceneId).join(", ")}`);
      let retried: any[] = [];
      try {
        retried = await generateBatchOnChrome(fallbackProfile, pending, visualConfig, style, onProgress);
      } catch (error: any) {
        retried = pending.map(item => ({ sceneId: item.sceneId, success: false, warning: error?.message || "Chrome dự phòng không thể tạo." }));
      }
      retried.forEach(result => resultBySceneId.set(result.sceneId, result));
      pending = pending.filter(item => shouldRetryOnAnotherChrome(resultBySceneId.get(item.sceneId)));
    }
  }
  return items.map(item => resultBySceneId.get(item.sceneId) || { sceneId: item.sceneId, success: false, warning: "Không nhận được kết quả tạo media." });
}

// Helper to generate key from params
const getCacheKey = (prompt: string, style: string) => {
  return `${prompt}_${style}`;
};

// 1. API: Sinh 1 tấm ảnh đơn (Single Image Generation)
router.post("/generate-image", async (req: Request, res: Response) => {
  let targetPort = 9222;
  try {
    // A new explicit single-media request starts a fresh operation. Without
    // resetting this flag, pressing Stop once caused every later Regenerate
    // request to be cancelled during its first provider-status poll.
    setBatchCancelled(false);
    let { prompt, style, resolution, bypassCache, sandboxConfig, visualConfig, referenceImage } = req.body;

    const cacheKey = getCacheKey(prompt, style || "");
    if (!bypassCache && !referenceImage && imageCache[cacheKey]) {
      console.log(`[Cache Hit] Trả về ảnh từ bộ nhớ đệm cho prompt: ${prompt.substring(0, 30)}...`);
      return res.json({ success: true, base64: imageCache[cacheKey] });
    }

    // Reference Image will be processed natively by Playwright in imageGeneratorService
    // Catbox logic removed

    let result: any;
    if (visualConfig?.chromeProfiles && visualConfig.chromeProfiles.length > 0) {
      targetPort = visualConfig.chromeProfiles[0].port;
    }

    await portContext.run(targetPort, async () => {
      const mode = visualConfig?.generationMode || "gemini-chat";
      if (mode === "viettheo-api") {
        result = await generateImageWithViettheoAPI({ prompt, visualConfig, style, referenceImage });
      } else {
        result = await generateImageWithPlaywright({ prompt, style, resolution, sandboxConfig, visualConfig, referenceImage });
      }
    });

    if (result.success) {
      if (result.base64) {
        imageCache[cacheKey] = result.base64;
      }
      return res.json({ success: true, base64: result.base64, fallbackUrl: result.fallbackUrl });
    }

    return res.json({ success: false, fallbackUrl: result.fallbackUrl, warning: result.warning });
  } catch (error: any) {
    console.error("Lỗi khi sinh ảnh đơn:", error);
    return res.json({ success: false, fallbackUrl: "", warning: error.message });
  } finally {
    // Only closes the fallback browser this tool started. A signed-in Chrome
    // that the user already had on this port remains untouched.
    await closeAutoLaunchedPlaywrightBrowser(targetPort).catch(() => {});
  }
});

router.post("/generate-single-image", async (req: Request, res: Response) => {
  let targetPort = 9222;
  try {
    setBatchCancelled(false);
    const { prompt, style, visualConfig, sandboxConfig, referenceImage } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, warning: "Thiếu prompt" });
    }

    let result: any;
    const mode = visualConfig?.generationMode || "gemini-chat";
    targetPort = visualConfig?.chromeProfiles?.[0]?.port || 9222;
    // A single scene must use the selected profile too. Otherwise it falls
    // back to an unrelated 9222 browser and ignores the visible/hidden choice.
    await portContext.run(targetPort, async () => {
      if (mode === "viettheo-api") {
        result = await generateImageWithViettheoAPI({ prompt, visualConfig, style, referenceImage });
      } else {
        result = await generateImageWithPlaywright({ prompt, style, visualConfig, sandboxConfig, referenceImage });
      }
    });
    return res.json({ success: !!result?.success, result, warning: result?.warning || "" });
  } catch (error: any) {
    console.error("Lỗi sinh ảnh 1 hình:", error);
    return res.json({ success: false, error: error.message });
  } finally {
    await closeAutoLaunchedPlaywrightBrowser(targetPort).catch(() => {});
  }
});

router.post("/stop-batch", async (req: Request, res: Response) => {
  setBatchCancelled(true);
  isBatchRequestActive = false;
  await closeAllBatchPages();
  await closeAllAutoLaunchedPlaywrightBrowsers();
  return res.json({ success: true });
});

router.post("/close-tool-chrome", async (_req: Request, res: Response) => {
  await closeAllBatchPages();
  await closeAllAutoLaunchedPlaywrightBrowsers();
  return res.json({ success: true });
});


router.post("/generate-batch-images-stream", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { items, visualConfig, style } = req.body;
  if (isBatchRequestActive) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Một batch đang chạy. Hãy dừng hoặc chờ batch hiện tại hoàn tất." })}\n\n`);
    return res.end();
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Danh sách items trống" })}\n\n`);
    return res.end();
  }

  isBatchRequestActive = true;
  setBatchCancelled(false);

  const onProgress = (result: any) => {
    res.write(`data: ${JSON.stringify({ type: "progress", result })}\n\n`);
  };
  const onFallback = (notice: ChromeFallbackNotice) => {
    res.write(`data: ${JSON.stringify({ type: "fallback", ...notice })}\n\n`);
  };

  try {
    // Reference Image will be processed natively by Playwright in imageGeneratorService
    // Catbox logic for batch removed

    const results = await runBatchAcrossChromeProfiles(items, visualConfig, style, onProgress, onFallback);
    res.write(`data: ${JSON.stringify({ type: "complete", results })}\n\n`);
  } catch (error: any) {
    console.error("Lỗi sinh ảnh hàng loạt stream:", error);
    res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
  } finally {
    isBatchRequestActive = false;
    await closeAllAutoLaunchedPlaywrightBrowsers().catch(() => {});
    res.end();
  }
});

router.post("/generate-batch-images", async (req: Request, res: Response) => {
  try {
    if (isBatchRequestActive) {
      return res.status(409).json({ success: false, error: "Một batch đang chạy. Hãy dừng hoặc chờ batch hiện tại hoàn tất." });
    }
    const { items: requestItems, style, visualConfig } = req.body;
    let items = requestItems;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, warning: "Danh sách items trống" });
    }

    isBatchRequestActive = true;
    // Reset cancel flag
    setBatchCancelled(false);

    // Reference Image will be processed natively by Playwright in imageGeneratorService
    // Catbox logic for batch removed

    const results = await runBatchAcrossChromeProfiles(items, visualConfig, style);

    return res.json({ success: true, results });
  } catch (error: any) {
    console.error("Lỗi sinh ảnh hàng loạt:", error);
    return res.json({ success: false, error: error.message });
  } finally {
    isBatchRequestActive = false;
    await closeAllAutoLaunchedPlaywrightBrowsers().catch(() => {});
  }
});

// 3. API: Mở Chrome độc lập với cổng được chỉ định (mặc định 9222)
router.post("/open-chrome", async (req: Request, res: Response) => {
  const port = Number.parseInt(req.body.port, 10) || 9222;
  // The Settings button must open a visible window for profile sign-in.
  // Hidden Chrome is used only by the automated-generation path.
  const headless = req.body?.headless === true;
  if (port < 1024 || port > 65535) {
    return res.status(400).json({ success: false, error: "Invalid Chrome port." });
  }

  const chromeCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
  ];
  const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  if (!chromePath) {
    return res.status(404).json({ success: false, error: "Google Chrome was not found on this computer." });
  }

  const isPublisher = req.body?.purpose === "publisher";
  const requestedPageUrl = String(req.body?.facebookPageUrl || "").trim();
  const publisherUrl = /^https:\/\/(www\.)?facebook\.com\//i.test(requestedPageUrl)
    ? requestedPageUrl
    : "https://www.facebook.com/";
  const publishingPlatforms = Array.isArray(req.body?.publishingPlatforms)
    ? req.body.publishingPlatforms.map((item: unknown) => String(item))
    : [];
  const requestedYoutubeStudioUrl = String(req.body?.youtubeStudioUrl || "").trim();
  const youtubeStudioUrl = /^https:\/\/studio\.youtube\.com\/channel\/[A-Za-z0-9_-]+\/?$/i.test(requestedYoutubeStudioUrl)
    ? requestedYoutubeStudioUrl
    : "https://studio.youtube.com/";
  const publisherUrls = [
    ...(publishingPlatforms.includes("youtube") ? [youtubeStudioUrl] : []),
    ...(publishingPlatforms.includes("facebook") ? [publisherUrl] : []),
    ...(publishingPlatforms.includes("tiktok") ? ["https://www.tiktok.com/tiktokstudio/upload"] : []),
  ];
  // The Scheduler must reuse exactly the same persistent profile used later to publish.
  const profilePath = isPublisher
    ? path.join(process.env.LOCALAPPDATA || os.homedir(), "VidiFlow OneClick", `Chrome Publisher ${port}`)
    : path.join(os.homedir(), `chrome-dev-profile-${port}`);
  fs.mkdirSync(profilePath, { recursive: true });
  const existingBrowser = await readChromeDebugBrowser(port);
  if (isPublisher && isBatchRequestActive) {
    return res.status(409).json({ success: false, error: "Chrome này đang được dùng cho một tác vụ tạo media. Hãy chờ task hoàn tất rồi mở để kiểm tra." });
  }
  // Media generation may leave a headless Chrome Publisher on the same port.
  // A second launch with the same user-data-dir is ignored by Chrome, which
  // made the customer's signed-in window appear not to open. Close only that
  // headless process, then relaunch the same persistent profile visibly.
  if (isPublisher && /HeadlessChrome/i.test(existingBrowser)) {
    await terminateChromeProcess(await getListeningPid(port));
    for (let attempt = 0; attempt < 15 && await readChromeDebugBrowser(port); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    ...(headless ? ["--headless=new", "--disable-gpu"] : ["--new-window", "--start-maximized", ...(isPublisher ? (publisherUrls.length ? publisherUrls : [publisherUrl]) : [])]),
  ];
  // If a visible publisher is already running, send a normal Chrome launch
  // request to that profile to create/focus a new visible window and tabs.
  if (isPublisher && existingBrowser && !/HeadlessChrome/i.test(existingBrowser)) {
    chromeArgs.splice(0, 1);
  }
  const chrome = spawn(chromePath, chromeArgs, { detached: true, stdio: "ignore", windowsHide: false });
  chrome.unref();
  let spawnError: Error | null = null;
  chrome.once("error", (error) => {
    spawnError = error;
    console.error("Could not open Chrome:", error);
  });

  let isReady = await waitForChromeDebugPort(port, isPublisher ? 2500 : 8000);
  if (!isReady && isPublisher && process.platform === "win32") {
    // Some packaged/sandboxed Windows launches do not allow Node's detached
    // child to attach a visible desktop. Start-Process is a reliable fallback,
    // and the embedded quotes keep user-data-dir intact when it has spaces.
    const psQuote = (value: string) => `'${value.replace(/'/g, "''")}'`;
    const fallbackArgs = [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=\"${profilePath}\"`,
      "--new-window",
      "--start-maximized",
      ...(publisherUrls.length ? publisherUrls : [publisherUrl]),
    ];
    const script = `$args=@(${fallbackArgs.map(psQuote).join(",")}); Start-Process -FilePath ${psQuote(chromePath)} -ArgumentList $args -WindowStyle Normal`;
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const fallback = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded], { detached: true, stdio: "ignore", windowsHide: true });
    fallback.unref();
    isReady = await waitForChromeDebugPort(port, 10_000);
  }
  if (!isReady) {
    return res.status(500).json({
      success: false,
      error: spawnError?.message || `Chrome did not open the debugging port ${port}. Close Chrome using this profile and try again.`,
    });
  }

  if (isPublisher && existingBrowser && !/HeadlessChrome/i.test(existingBrowser)) {
    // The profile is already alive, so Chrome may ignore a second process
    // command. Create the requested check tabs through its DevTools port.
    await Promise.all(publisherUrls.map((url) => openChromeDebugTab(port, url)));
  }

  // Publisher Chrome belongs to the customer. Keep its signed-in session open and
  // never add it to the media-generation auto-close registry.
  if (!isPublisher) registerToolLaunchedChrome(port, headless);

  return res.json({
    success: true,
    message: isPublisher
      ? "Đã mở Chrome đăng bài. Hãy đăng nhập Facebook, chọn đúng Page rồi để nguyên cửa sổ này; lịch đăng sau sẽ dùng lại phiên đăng nhập đó."
      : `Chrome đã mở trên cổng ${port}.`,
  });
});

router.post("/open-chrome-legacy", async (req: Request, res: Response) => {
  try {
    const port = parseInt(req.body.port) || 9222;
    const headless = req.body?.headless !== false;
    
    // Giữ nguyên thư mục cũ cho port 9222 để không làm mất session đã đăng nhập của người dùng.
    // Các port khác sẽ dùng thư mục riêng biệt.
    const folderName = `chrome-dev-profile-${port}`;
    const profilePath = path.join(os.homedir(), folderName);
    
    // Sử dụng lệnh start của Windows để tự động tìm và mở Chrome độc lập
    // Thêm "" rỗng ở đầu lệnh start để tránh lỗi nhận nhầm đường dẫn thành Title của CMD
    const command = `start /b "" chrome --remote-debugging-port=${port} --user-data-dir="${profilePath}"${headless ? " --headless=new --disable-gpu" : ""}`;
    
    exec(command, (error) => {
      if (error) {
        console.error(`Lỗi mở Chrome port ${port}:`, error);
      }
    });
    registerToolLaunchedChrome(port, headless);
    
    return res.json({ success: true, message: `Đã mở Chrome port ${port} thành công! Hãy đăng nhập Google trên cửa sổ vừa mở.` });
  } catch (error: any) {
    console.error("Lỗi mở Chrome:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. API: Dừng quá trình sinh ảnh hàng loạt
router.post("/stop-batch", (req: Request, res: Response) => {
  setBatchCancelled(true);
  // Free the UI for a new, explicitly started batch. Existing browser work
  // observes the cancellation flag before it accepts another prompt.
  isBatchRequestActive = false;
  void closeAllAutoLaunchedPlaywrightBrowsers();
  res.json({ success: true, message: "Đã dừng ngay các tác vụ chưa hoàn tất và đóng Chrome do tool mở." });
});

export default router;
