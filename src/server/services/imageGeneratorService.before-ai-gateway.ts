import { getPlaywrightPage, initPlaywright, closePlaywright, closeAutoLaunchedPlaywrightBrowser, globalPlaywrightPages, pageContext, portContext } from "./audioService.js";
import { EXTERNAL_URLS, BACKEND_MESSAGES, STICKMAN_KEYWORDS, DEFAULT_IMAGE_KEYWORDS, PROMPT_FILLER_WORDS, STICKMAN_STYLE_MODIFIERS, DEFAULT_PROJECT_ID, NON_ALPHANUMERIC_SPACE_REGEX, PLAYWRIGHT_SUBMIT_ICON_REGEX, PLAYWRIGHT_SUBMIT_TEXT_REGEX, IMAGE_GEN_VIDEO_SECTION_REGEX, IMAGE_GEN_IMAGE_SECTION_REGEX, IMAGE_GEN_SAVE_BTN_REGEX, IMAGE_GEN_IMAGEN_EXACT_REGEX, IMAGE_GEN_IMAGEN_FALLBACK_REGEX, IMAGE_GEN_LABS_EXACT_REGEX, IMAGE_GEN_LABS_FALLBACK_REGEX, IMAGE_GEN_VEO_EXACT_REGEX, IMAGE_GEN_VEO_FALLBACK_REGEX } from "../../constants";
import { appLog, appError, createAppError } from "../../lib/logger.js";
import { randomDelay, getBatchDelayMs } from "../../lib/shared-utils.js";
import { GenerateType, ImageGeneratorEngine, PromptInputMethod, ImageGenerationMode, GeminiChatModelName, GeminiChatSelector, GeminiChatTextOption, GeminiChatSpeed, GEMINI_CHAT_SPEED_TAB_COUNT, AspectRatio, BatchImageItem, BatchImageResult } from "../../types.js";
import { Locator, Page } from "playwright";
import fs from "fs";
import path from "path";
import { delayAsync } from "../../lib/shared-utils.js";
import { uploadToCatbox } from './catboxUploader.js';

const VIETTHEO_BASE_URL = 'https://viettheo.site';
const getViettheoApiKey = () => {
  const key = process.env.VIETTHEO_API_KEY;
  if (!key) throw new Error('Chưa cấu hình VIETTHEO_API_KEY trong Cài đặt.');
  return key;
};

async function readViettheoApiResponse(response: Response): Promise<any> {
  const raw = await response.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Viettheo từ chối API key (401/403). Hãy vào Cài đặt, dán lại key Viettheo còn hiệu lực rồi bấm Lưu.');
    }
    throw new Error(data?.message || data?.error || `Viettheo API trả về lỗi HTTP ${response.status}.`);
  }
  return data;
}

export async function smoothMouseMove(page: Page, locator: Locator) {
  try {
    const box = await locator.boundingBox();
    if (!box) return;

    const startX = Math.floor(Math.random() * 800 + 100);
    const startY = Math.floor(Math.random() * 600 + 100);
    const targetX = Math.floor(box.x + box.width / 2 + (Math.random() - 0.5) * 10);
    const targetY = Math.floor(box.y + box.height / 2 + (Math.random() - 0.5) * 5);

    await page.mouse.move(startX, startY);

    const steps = Math.floor(Math.random() * 5 + 8);
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const currentX = startX + (targetX - startX) * t;
      const currentY = startY + (targetY - startY) * t + Math.sin(t * Math.PI) * (Math.random() - 0.5) * 15;
      await page.mouse.move(currentX, currentY);
      await randomDelay(5, 15);
    }

    await page.mouse.move(targetX, targetY);
    await randomDelay(100, 250);
  } catch (e) {
    await locator.hover().catch(() => { });
  }
}

export async function humanType(page: Page, text: string) {
  const chars = text.split("");
  const pauseChars = [" ", ",", "."];
  for (const char of chars) {
    await page.keyboard.type(char);
    let delay = Math.floor(Math.random() * 25 + 10);
    if (pauseChars.includes(char)) {
      delay += Math.floor(Math.random() * 50 + 30);
    }
    await delayAsync(delay);
  }
}

export const getImgIdSafe = (url: string): string => {
  if (!url) return "";
  try {
    const u = new URL(url);
    const id = u.searchParams.get("id") || u.searchParams.get("docid");
    if (id) return id;
    ["token", "sig", "signature", "expires", "t"].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch (e) {
    return url;
  }
};

export class SimpleMutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const release = () => {
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          if (next) next();
        } else {
          this.locked = false;
        }
      };

      if (this.locked) {
        this.queue.push(() => resolve(release));
      } else {
        this.locked = true;
        resolve(release);
      }
    });
  }
}

export const imageGenMutex = new SimpleMutex();
let activeFlowProjectId = "";
const imageGenMutexByPort = new Map<number, SimpleMutex>();
const imageGenMutexByPage = new WeakMap<Page, SimpleMutex>();
const flowProjectByPage = new WeakMap<Page, string>();

function getWorkerMutex(): SimpleMutex {
  const workerPage = pageContext.getStore();
  if (workerPage) {
    let mutex = imageGenMutexByPage.get(workerPage);
    if (!mutex) {
      mutex = new SimpleMutex();
      imageGenMutexByPage.set(workerPage, mutex);
    }
    return mutex;
  }
  const port = portContext.getStore() || 9222;
  let mutex = imageGenMutexByPort.get(port);
  if (!mutex) {
    mutex = new SimpleMutex();
    imageGenMutexByPort.set(port, mutex);
  }
  return mutex;
}

export interface ImageGeneratorOptions {
  prompt: string;
  style?: string;
  visualConfig?: {
    chromeHeadless?: boolean;
    generateType?: GenerateType;
    aspectRatio?: string;
    generateCount?: number;
    imageGeneratorEngine?: ImageGeneratorEngine;
    promptInputMethod?: PromptInputMethod;
    generationMode?: ImageGenerationMode;
    geminiChatSpeed?: GeminiChatSpeed;
  };
  sandboxConfig?: {
    projectId?: string;
  };
}

export interface ImageGeneratorResult {
  success: boolean;
  base64: string | null;
  fallbackUrl: string;
  warning?: string;
}

export const extractKeywords = (text: string): string => {
  if (!text) return "aesthetic,cinematic";
  const clean = text.replace(NON_ALPHANUMERIC_SPACE_REGEX, " ");
  const words = clean
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 3);
  const filtered = words.filter((w) => !PROMPT_FILLER_WORDS.includes(w as any));
  return filtered.slice(0, 3).join(",");
};

let lastPlaywrightConfigState: string | null = null;
let consecutiveGeminiErrors = 0;
let lastGeminiConfigState: string | null = null;
const globalBatchPagesByPort = new Map<number, Page[]>();
const batchPagesErrors = new WeakMap<Page, number>();
const batchPagesConfigs = new WeakMap<Page, string>();

export let isBatchCancelled = false;
export const setBatchCancelled = (val: boolean) => { isBatchCancelled = val; };

let labsHasUploadedRefImage = false;

async function uploadReferenceImage(page: Page, base64OrPath: string, platform: 'gemini' | 'labs') {
  if (!base64OrPath) return;

  appLog(`[Playwright] Uploading reference image natively on ${platform}...`);
  try {
    const localPathMatch = base64OrPath.match(/\/api\/serve-local-file\?path=([^&]+)/i);
    let buffer: Buffer;
    if (localPathMatch) {
      const localPath = decodeURIComponent(localPathMatch[1]);
      if (!fs.existsSync(localPath)) throw new Error(`Reference image no longer exists: ${localPath}`);
      buffer = fs.readFileSync(localPath);
    } else {
      let cleanBase64 = base64OrPath;
      if (cleanBase64.includes(",")) cleanBase64 = cleanBase64.split(",")[1];
      buffer = Buffer.from(cleanBase64, 'base64');
    }
    
    // References can be uploaded by parallel batch tabs, so never share a
    // single temporary filename between scenes.
    const tempDir = path.join(process.cwd(), "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `reference-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
    fs.writeFileSync(tempPath, buffer);

    if (platform === 'gemini') {
        // Gemini image/video reference uploads use this hidden Filedata input.
        const nativeUploadInput = page.locator('input[type="file"][name="Filedata"]');
        let uploadedThroughNativeInput = false;
        if (await nativeUploadInput.count()) {
            await nativeUploadInput.last().setInputFiles(tempPath);
            appLog("[Playwright] Uploaded reference image through Gemini File upload input.");
            await page.waitForTimeout(2500);
            uploadedThroughNativeInput = true;
        }
        // ALWAYS use the click plus (+) -> click "Tải tệp lên" flow with FileChooser for Gemini Chat
        let fileChooserPromise = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
        const geminiAttachBtn = page.locator('button[aria-label*="Nội dung tải lên" i], button[aria-label*="Nội dung tải lên và công cụ" i]').first();
        
        if (!uploadedThroughNativeInput && await geminiAttachBtn.isVisible()) {
            await geminiAttachBtn.click({ force: true });
            appLog("[Playwright] Clicked plus (+) attach button in Gemini.");
            await page.waitForTimeout(1500);
            
            const uploadFileBtn = page.locator('button, [role="menuitem"]').filter({ hasText: /Tải tệp lên|Upload/i }).first();
            if (await uploadFileBtn.isVisible()) {
                await uploadFileBtn.click({ force: true });
                appLog("[Playwright] Clicked 'Tải tệp lên' button in Gemini.");
                const fileChooser = await fileChooserPromise;
                if (fileChooser) {
                   await fileChooser.setFiles(tempPath);
                   appLog("[Playwright] Uploaded file via FileChooser in Gemini.");
                   await page.waitForTimeout(3000);
                } else {
                   appLog("[Playwright] FileChooser not detected in Gemini!");
                }
            } else {
                appLog("[Playwright] 'Tải tệp lên' option not found in attach menu.");
            }
        } else {
            appLog("[Playwright] Gemini attach button (+) not found or not visible.");
        }

        // Check and handle Gemini's disclaimer dialog
        const agreeBtn = page.locator('button[data-test-id="upload-image-agree-button"], button').filter({ hasText: /Đồng ý|Agree/i }).first();
        if (await agreeBtn.isVisible()) {
            await agreeBtn.click({ force: true });
            appLog("[Playwright] Clicked 'Đồng ý' on Gemini disclaimer dialog.");
            await page.waitForTimeout(2000);
        }
    } else {
        let isUploadClicked = false;
        // Flow's documented control is labelled "Tải nội dung nghe nhìn lên".
        // Prefer its accessible name over CSS classes that change frequently.
        const documentedUploadBtn = page.getByRole('button', { name: /Tải nội dung nghe nhìn lên|Upload media/i }).last();
        let fileChooserPromise = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
        
        // Exact locator for attach button (+) from HTML: icon hasText: add_2
         const attachBtn = page.locator('button[aria-haspopup="dialog"]').filter({ has: page.locator('i').filter({ hasText: /add_2|add/ }) }).first();

         // Follow the Flow picker sequence from the supplied HTML exactly:
         // open add_2 -> upload in the dialog -> select its card -> Add to
         // prompt. A thumbnail created by upload alone is not a reference.
         if (await attachBtn.isVisible()) {
           const picker = page.locator('[role="dialog"]').last();
           const imagesBeforeAttach = await page.locator('img[alt]').count();
           await attachBtn.click({ force: true });
           await picker.waitFor({ state: 'visible', timeout: 15000 });

           const pickerUpload = picker.locator('button').filter({ has: page.locator('i').filter({ hasText: /^upload$/i }) }).last();
           await pickerUpload.waitFor({ state: 'visible', timeout: 15000 });
           const pickerFileChooser = page.waitForEvent('filechooser', { timeout: 15000 });
           await pickerUpload.click({ force: true });
           await (await pickerFileChooser).setFiles(tempPath);
           appLog('[Playwright] Uploaded reference image into the Flow media picker.');

           const fileName = path.basename(tempPath);
           const uploadedOption = picker.locator('div[role="option"]').filter({ hasText: fileName }).last();
           await uploadedOption.waitFor({ state: 'visible', timeout: 60000 });
           // Flow removes the item from the list as soon as it is selected.
            // The enabled Add-to-prompt action is therefore the authoritative
            // confirmation, not a second lookup of the disappearing card.
            await uploadedOption.click();
            await page.waitForTimeout(500);

            // Current Flow versions attach the selected item immediately and
            // close the picker. Older versions keep it open and expose the
            // bottom Add-to-prompt button, which is the final button there.
            if (await picker.isVisible()) {
              const pickerButtons = picker.locator('button');
              const pickerButtonCount = await pickerButtons.count();
              if (pickerButtonCount === 0) throw new Error('Flow media picker has no attach action.');
              const addToPrompt = pickerButtons.last();
              if (!await addToPrompt.isEnabled()) throw new Error('Flow has not enabled Add to prompt for the selected reference image.');
              await addToPrompt.click();
              await picker.waitFor({ state: 'hidden', timeout: 30000 });
            }

           const attachmentDeadline = Date.now() + 30000;
           while (Date.now() < attachmentDeadline && await page.locator('img[alt]').count() <= imagesBeforeAttach) {
             await page.waitForTimeout(250);
           }
           if (await page.locator('img[alt]').count() <= imagesBeforeAttach) throw new Error('Flow did not attach the selected reference image to the prompt.');
           appLog('[Playwright] Reference image was selected and added to the Flow prompt.');
           return;
         }
        const directUploadBtn = page.locator('button').filter({ hasText: /Tải nội dung nghe nhìn lên|Upload media/i }).first();
        
        if (await documentedUploadBtn.isVisible()) {
           await documentedUploadBtn.click({ force: true });
           isUploadClicked = true;
        } else if (await directUploadBtn.isVisible()) {
           await directUploadBtn.click({ force: true });
           isUploadClicked = true;
        } else if (await attachBtn.isVisible()) {
           await attachBtn.click({ force: true });
           await page.waitForTimeout(1500);
           const popupUploadBtn = page.locator('button, [role="menuitem"], li, span').filter({ hasText: /Tải nội dung nghe nhìn lên|Upload media/i }).first();
           if (await popupUploadBtn.isVisible()) {
               await popupUploadBtn.click({ force: true });
               isUploadClicked = true;
           } else {
               isUploadClicked = true;
           }
        }

        if (isUploadClicked) {
          const fileChooser = await fileChooserPromise;
          const imagesBeforeUpload = await page.locator('img[alt]').count();
          if (fileChooser) {
             await fileChooser.setFiles(tempPath);
             appLog("[Playwright] Uploaded file via FileChooser in Labs.");

             // In the current Flow UI, choosing a file attaches it straight to
             // the composer. Wait for that new thumbnail instead of reopening
             // the media library (which changes the active selection away from
             // the just-uploaded reference).
             const attachedDeadline = Date.now() + 60000;
             let attachedToPrompt = false;
             while (Date.now() < attachedDeadline) {
               const composerImages = page.locator('img[alt]');
               const imageCount = await composerImages.count();
               if (imageCount > imagesBeforeUpload) {
                 attachedToPrompt = true;
                 break;
               }
               await page.waitForTimeout(500);
             }
             if (!attachedToPrompt) throw new Error('Flow did not attach the uploaded reference image to the prompt.');
             await page.waitForTimeout(500);
             appLog('[Playwright] Reference image upload completed and is attached to the Flow prompt.');
             return;
          } else {
             appLog("[Playwright] No fileChooser event detected after clicking upload!");
          }

          await page.waitForTimeout(4000); // Give Labs time to process upload

          // A completed upload is only in Flow's media library. Re-open that
          // dialog and attach the exact uploaded card before allowing prompt
          // entry. All locators are scoped to the dialog to avoid matching a
          // similarly-named control in the project canvas.
          const attachDialog = page.locator('[role="dialog"]').filter({ hasText: /Tệp tải lên|Thêm vào câu lệnh|Upload media|Add to prompt/i }).last();
          if (!await attachDialog.isVisible()) {
            if (!await attachBtn.isVisible()) throw new Error('Flow media library could not be opened.');
            await attachBtn.click({ force: true });
            await attachDialog.waitFor({ state: 'visible', timeout: 15000 });
          }

          const uploadTabInDialog = attachDialog.locator('button[role="tab"]').filter({ hasText: /Tệp tải lên|Uploaded files/i }).first();
          await uploadTabInDialog.waitFor({ state: 'visible', timeout: 15000 });
          await uploadTabInDialog.click({ force: true });

          const uploadedCard = attachDialog.locator('div[role="option"]').filter({ hasText: path.basename(tempPath) }).first();
          await uploadedCard.waitFor({ state: 'visible', timeout: 60000 });
          const uploadDeadline = Date.now() + 60000;
          let cardReady = false;
          while (Date.now() < uploadDeadline) {
            const thumbnail = uploadedCard.locator('img');
            const thumbnailCount = await thumbnail.count();
            const loaded = thumbnailCount > 0 && await thumbnail.first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0).catch(() => false);
            const busy = await uploadedCard.locator('[role="progressbar"], [aria-busy="true"]').count() > 0;
            if (loaded && !busy) {
              cardReady = true;
              break;
            }
            await page.waitForTimeout(500);
          }
          if (!cardReady) throw new Error('Reference image did not finish uploading in Flow.');

          await uploadedCard.click();
          await page.waitForTimeout(250);
          const selectedMedia = attachDialog.locator('div[role="option"][aria-selected="true"]');
          if (await selectedMedia.count() !== 1) {
            throw new Error('Flow did not select the uploaded reference image.');
          }

          const attachAction = attachDialog.locator('button').filter({ hasText: /\u0054h\u00eam v\u00e0o c\u00e2u l\u1ec7nh|Add to prompt/i }).last();
          await attachAction.waitFor({ state: 'visible', timeout: 30000 });
          if (!await attachAction.isEnabled()) throw new Error('Flow has not enabled attaching the selected reference image.');
          await attachAction.click();
          await attachDialog.waitFor({ state: 'hidden', timeout: 30000 });
          appLog('[Playwright] Reference image finished uploading and is attached to the Flow prompt.');
          return;
          const addToPrompt = attachDialog.locator('button').filter({ hasText: /Thêm vào câu lệnh|Add to prompt/i }).first();
          await addToPrompt.waitFor({ state: 'visible', timeout: 30000 });
          if (!await addToPrompt.isEnabled()) throw new Error('Flow has not enabled attaching the uploaded reference image.');
          await addToPrompt.click({ force: true });
          await attachDialog.waitFor({ state: 'hidden', timeout: 30000 });
          appLog('[Playwright] Reference image finished uploading and is attached to the Flow prompt.');
          return;

          // Check if library is already open. If not, click (+) to open it
          const isLibraryOpen = await page.locator('button').filter({ hasText: /Tải nội dung nghe nhìn lên/i }).first().isVisible();
          if (!isLibraryOpen) {
             appLog("[Playwright] Re-clicking attach button (+) to open library in Labs...");
             if (await attachBtn.isVisible()) {
                await attachBtn.click({ force: true });
                await page.waitForTimeout(2000);
             }
          } else {
             appLog("[Playwright] Library dialog is already open.");
          }

          // Switch to tab "Tệp tải lên" (Upload files) first for faster file listing
          const uploadsTab = page.locator('button[role="tab"]').filter({ hasText: /Tệp tải lên/i }).first();
          try {
             await uploadsTab.waitFor({ state: 'visible', timeout: 5000 });
             await uploadsTab.click({ force: true });
             appLog("[Playwright] Switched to 'Tệp tải lên' tab in Labs.");
             await page.waitForTimeout(1500);
          } catch(e) {
             appLog("[Playwright] 'Tệp tải lên' tab not visible, skipping switch.");
          }

          appLog("[Playwright] Waiting up to 15s for uploaded temp_ref.png option in library...");
          const tempRefCard = page.locator('div[role="option"]').filter({ hasText: path.basename(tempPath) }).first();
          try {
             // A library card can appear while Flow is still uploading it.  Do
             // not select/send it until its thumbnail is rendered and Flow has
             // removed the upload progress indicator.
             await tempRefCard.waitFor({ state: 'visible', timeout: 60000 });
             const uploadDeadline = Date.now() + 60000;
             let uploadReady = false;
             while (Date.now() < uploadDeadline) {
                const preview = tempRefCard.locator('img');
                const previewCount = await preview.count();
                const previewReady = previewCount > 0 && await preview.first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0).catch(() => false);
                const inProgress = await tempRefCard.locator('[role="progressbar"], [aria-busy="true"]').count() > 0;
                if (previewReady && !inProgress) {
                  uploadReady = true;
                  break;
                }
                await page.waitForTimeout(500);
             }
             if (!uploadReady) throw new Error('Flow has not finished uploading the reference image.');
             await tempRefCard.click({ force: true });
             appLog("[Playwright] Reference image upload completed and was selected in Labs.");
          } catch (e: any) {
             appLog("[Playwright] temp_ref.png option did not become visible: " + e.message);
             throw e;
          }

          // Wait robustly for "Thêm vào câu lệnh" button to appear and click it
          const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh|Add to prompt/i }).first();
          try {
             appLog("[Playwright] Waiting up to 15s for 'Thêm vào câu lệnh' button to be visible...");
             await addBtn.waitFor({ state: 'visible', timeout: 60000 });
             const attachDeadline = Date.now() + 60000;
             while (Date.now() < attachDeadline && !(await addBtn.isEnabled())) {
                await page.waitForTimeout(500);
             }
             if (!(await addBtn.isEnabled())) throw new Error('Flow has not enabled Add to prompt for the uploaded reference image.');
             await addBtn.click({ force: true });
             appLog("[Playwright] Clicked 'Thêm vào câu lệnh' in Labs.");
             // The dialog must close before we enter the prompt; otherwise the
             // image is still only in the library, not attached to the request.
             await tempRefCard.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
             await page.waitForTimeout(500);
          } catch (err: any) {
             appLog("[Playwright] 'Thêm vào câu lệnh' button not visible/found: " + err.message);
             // Never generate when the image is merely present in Flow's media
             // library.  It must be attached to the prompt first.
             throw new Error("Reference image was uploaded but not attached to the Flow prompt.");
          }
        } else {
          appLog("[Playwright] Image already in library or attach button not found.");
          const isLibraryOpen = await page.locator('button').filter({ hasText: /Tải nội dung nghe nhìn lên/i }).first().isVisible();
          if (!isLibraryOpen && (await attachBtn.isVisible())) {
             await attachBtn.click({ force: true });
             await page.waitForTimeout(2000);
          }
          const uploadsTab = page.locator('button[role="tab"]').filter({ hasText: /Tệp tải lên/i }).first();
          if (await uploadsTab.isVisible()) {
             await uploadsTab.click({ force: true });
             await page.waitForTimeout(1500);
          }
          const tempRefCard = page.locator('div[role="option"]').filter({ hasText: path.basename(tempPath) }).first();
          try {
             await tempRefCard.waitFor({ state: 'visible', timeout: 10000 });
             await tempRefCard.click({ force: true });
             await page.waitForTimeout(1500);
             const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh/i }).first();
             if (await addBtn.isVisible()) {
                await addBtn.click({ force: true });
                appLog("[Playwright] Clicked 'Thêm vào câu lệnh' from library in Labs.");
                await page.waitForTimeout(1500);
             }
          } catch (e: any) {
             appLog("[Playwright] temp_ref.png already in library but could not click it: " + e.message);
          }
        }
    }
  } catch (e: any) {
    appLog("[Playwright] Failed to upload reference image: " + e.message);
    throw e;
  }
}


export async function generateImageWithPlaywright(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const { prompt, style, visualConfig, sandboxConfig = {} } = options;

  const mode = visualConfig?.generationMode || ImageGenerationMode.GeminiChat;
  if (mode === ImageGenerationMode.GeminiChat || (mode as any) === "gemini_chat") {
    return generateImageWithGeminiChat(options);
  }

  const isStickman = !![style, prompt].some((str) => str && STICKMAN_KEYWORDS.some((kw) => str.toLowerCase().includes(kw)));

  let finalPrompt = prompt || "";
  if (isStickman) {
    const stickmanStyleModifiers = STICKMAN_STYLE_MODIFIERS;
    finalPrompt = `${finalPrompt}, ${stickmanStyleModifiers}`;
  }

  // Google Flow does not offer a separate negative-prompt field. Translate the
  // three UI switches into explicit, strict constraints in the request itself.
  const negativeConstraints: string[] = [];
  // Scene media must stay text-free. A thumbnail with an explicit title is
  // the one exception: never send both "no text" and required typography.
  if (visualConfig?.noText && !(visualConfig as any)?.thumbnailTextRequired) negativeConstraints.push("absolute zero typography, no text, no letters, no words, no numbers, no glyphs, no captions, no subtitles, no title cards, no speech bubbles, no handwriting, no readable signs, no watermark, no logo; every sign-like, paper or display surface must remain blank and unreadable");
  if ((visualConfig as any)?.thumbnailTextRequired) {
    finalPrompt += `\n\nTHUMBNAIL TEXT IS REQUIRED: render the exact, bold, readable on-image text \"${String((visualConfig as any).thumbnailText || "").trim()}\". This is a thumbnail-only instruction; do not omit, replace, or turn the text into a logo.`;
  }
  if (visualConfig?.noBlackBorder) negativeConstraints.push("no black border, no black frame, no letterboxing, full-bleed composition");
  if (visualConfig?.noWallPicture) negativeConstraints.push("no framed pictures, paintings, posters, photographs, or screens on walls");
  if (negativeConstraints.length > 0) {
    finalPrompt = `${finalPrompt}\n\nSTRICT NEGATIVE CONSTRAINTS: ${negativeConstraints.join("; ")}.`;
  }


  const kws = extractKeywords(prompt);
  const fallbackUrl = isStickman ? `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/stickman,cartoon` : `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${encodeURIComponent(kws || "cinematic,landscape")}`;
  const release = await getWorkerMutex().acquire();

  let responseText = "";
  let success = false;
  let attempts = 0;
  const maxAttempts = 2;

  try {
    if (!getPlaywrightPage() || getPlaywrightPage()!.isClosed()) {
      appLog(BACKEND_MESSAGES.PLAYWRIGHT_PAGE_CLOSED_REINIT);
      await initPlaywright(visualConfig?.chromeHeadless ?? true, "google_labs");
    }
    if (!getPlaywrightPage()) {
      throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
    }

    try {
      await getPlaywrightPage()!.evaluate(
        ({ getImgIdStr }) => {
          if (typeof window !== "undefined") {
            if (!(window as any).__name) {
              (window as any).__name = (target: any, value: any) => {
                try {
                  Object.defineProperty(target, "name", {
                    value,
                    configurable: true,
                  });
                } catch (e) { }
                return target;
              };
            }
            if (!(window as any).__getImgId) {
              (window as any).__getImgId = new Function("return " + getImgIdStr)();
            }
          }
        },
        { getImgIdStr: getImgIdSafe.toString() },
      );
    } catch (err) {
      appError("Failed to inject helpers on current page context:", err);
    }

    const projectId = sandboxConfig?.projectId || DEFAULT_PROJECT_ID;
    const rememberedProjectId = flowProjectByPage.get(getPlaywrightPage()!);
    let cleanProjectId = rememberedProjectId || projectId;
    if (cleanProjectId.startsWith("projects/")) {
      cleanProjectId = cleanProjectId.replace("projects/", "");
    }
    const targetUrl = `${EXTERNAL_URLS.GOOGLE_LABS_FLOW}/${cleanProjectId}`;

    while (attempts < maxAttempts && !success) {
      attempts++;
      appLog(`${BACKEND_MESSAGES.IMAGE_RENDER_ATTEMPT}${attempts}/${maxAttempts}${BACKEND_MESSAGES.IMAGE_RENDER_STARTING}`);
      try {
        if (!getPlaywrightPage() || getPlaywrightPage()!.isClosed()) {
          appLog(BACKEND_MESSAGES.PLAYWRIGHT_PAGE_CLOSED_PREV_ATTEMPT);
          await initPlaywright(visualConfig?.chromeHeadless ?? true, "google_labs");
        }
        if (!getPlaywrightPage()) {
          throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
        }
        const SELECTOR_INPUT = '[contenteditable="true"]';
        // Match both older and newer Labs Submit buttons
        const submitBtnLocator = getPlaywrightPage()!.locator("button").filter({
            has: getPlaywrightPage()!.locator("i").filter({ hasText: /spark|send|magic_button|arrow_forward/i }),
        }).or(getPlaywrightPage()!.locator('button').filter({ hasText: /Video \u00B7|T\u1EA1o \u1EA3nh|T\u1EA1o|Create/i })).last();

        let isAlreadyOnFlowPage = false;
        try {
          const currentUrl = getPlaywrightPage()!.url();
          if ([cleanProjectId, "labs.google"].every((kw) => currentUrl.includes(kw))) {
            isAlreadyOnFlowPage = true;
          }
        } catch (e) {
          isAlreadyOnFlowPage = false;
        }

        if (!isAlreadyOnFlowPage) {
          const redirectUrl = cleanProjectId !== DEFAULT_PROJECT_ID ? targetUrl : EXTERNAL_URLS.GOOGLE_LABS_FLOW;
          appLog(`${BACKEND_MESSAGES.PLAYWRIGHT_REDIRECT_LOG}${cleanProjectId !== DEFAULT_PROJECT_ID ? cleanProjectId : "New Project"} (Attempt ${attempts})...`);
          await getPlaywrightPage()!.goto(redirectUrl, {
            waitUntil: "commit",
            timeout: 60000,
          });
        }

        // The neutral Flow URL can initially show Google's promotional landing
        // page instead of the composer.  The old flow waited for an editor that
        // did not exist there, then reported a generic generation error. Enter
        // Flow explicitly and only continue once the real composer is present.
        const flowPage = getPlaywrightPage()!;
        const composer = flowPage.locator(SELECTOR_INPUT).last();
        if (!await composer.isVisible()) {
          const entryButtons = await flowPage.locator('button, a, [role="button"]')
            .filter({ hasText: /Create with Google Flow|Tạo bằng Google Flow|Mở Google Flow/i }).all();
          let enteredFlow = false;
          for (const button of entryButtons) {
            if (await button.isVisible()) {
              appLog("[Playwright] Opening the Flow studio from its landing page...");
              await button.click({ force: true });
              enteredFlow = true;
              break;
            }
          }
          if (enteredFlow) {
            await composer.waitFor({ state: "visible", timeout: 45000 });
          }
        }

        // Dismiss account/profile drawers and any stale Flow menus before
        // looking for the project tile or the composer.
        await getPlaywrightPage()!.keyboard.press("Escape").catch(() => {});
        await getPlaywrightPage()!.waitForTimeout(500);

        try {
          if (cleanProjectId === DEFAULT_PROJECT_ID) {
            appLog("[Playwright] Looking for Create Project button...");
            await getPlaywrightPage()!.waitForTimeout(5000); // Wait for React to render

            let clicked = false;
            const possibleBtns = await getPlaywrightPage()!.locator('button, div[role="button"], a[role="button"], div.card')
              .filter({ hasText: /Dự án mới|New project|Tạo dự án|Create project/i }).all();

            for (const btn of possibleBtns) {
              if (await btn.isVisible()) {
                const text = await btn.textContent();
                // Ensure it's not a huge container element by checking its size
                const box = await btn.boundingBox();
                if (box && box.width < 500 && box.height < 500) {
                  appLog(`[Playwright] Clicking Create Project button... (text: ${text?.trim()})`);
                  await btn.click({ force: true });
                  clicked = true;
                  break;
                }
              }
            }
            if (clicked) {
              await getPlaywrightPage()!.waitForURL(/\/project\//, { timeout: 30000, waitUntil: "domcontentloaded" }).catch(() => {});
              await getPlaywrightPage()!.waitForTimeout(2000);

              const newUrl = getPlaywrightPage()!.url();
              const match = newUrl.match(/project\/([a-z0-9\-]+)/i);
              if (match) {
                cleanProjectId = match[1];
                flowProjectByPage.set(getPlaywrightPage()!, cleanProjectId);
                appLog("[Playwright] Captured new project ID: " + cleanProjectId);
              } else {
                throw new Error("Flow did not open a project after selecting New Project.");
              }
            } else {
              appLog("[Playwright] Create Project button not found, maybe we are already in a project.");
            }
          }
        } catch (e: any) {
          appLog("[Playwright] Error finding create button: " + e.message);
        }

        appLog(`${BACKEND_MESSAGES.PLAYWRIGHT_INPUT_LOG}"${finalPrompt || prompt}"`);

        const inputEl = await getPlaywrightPage()!.waitForSelector(SELECTOR_INPUT, {
          timeout: 30000,
        });
        if (!inputEl) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_INPUT_NOT_FOUND);

        try {
          const currentConfigState = JSON.stringify({
            generateType: visualConfig?.generateType || GenerateType.Image,
            aspectRatio: visualConfig?.aspectRatio || AspectRatio.SixteenNine,
            generateCount: visualConfig?.generateCount || 1,
            imageGeneratorEngine: visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
          });

          if (true) { // Always configure to ensure parameters match UI state perfectly
            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);
            
            // Flow has shipped several controls for this popover.  The current
            // UI commonly displays only "Video 1x" (or "Hình ảnh 1x") on the
            // trigger, while older versions display the selected model name.
            // Look for both forms and only use the legacy tune-icon control as
            // a final fallback.
            const page = getPlaywrightPage()!;
            const compactSettingsBtn = page.locator("button").filter({
              hasText: /(?:Hình ảnh|Image|Video)\s*(?:[·•]\s*)?\d+x/i,
            }).last();
            const modelSettingsBtn = page
              .locator('button[aria-haspopup="menu"]')
              .filter({ hasText: /Nano Banana|Omni Flash|Veo\s*3\.1/i })
              .last();
            const flowMediaSettingsBtn = page
              .locator('button[aria-haspopup="menu"]')
              .filter({ has: page.locator("i").filter({ hasText: /crop_(?:16_9|9_16)|crop_free/i }) })
              .last();
            const legacySettingsBtn = page.locator("button").filter({
              has: page.locator("i").filter({ hasText: /tune|crop_|image|video/i }),
            }).filter({ hasText: /tune|1x|x2|x3|Video|Hình ảnh|Image/i }).last();

            let actualConfigBtn = compactSettingsBtn;
            if (!await actualConfigBtn.isVisible()) actualConfigBtn = modelSettingsBtn;
            if (!await actualConfigBtn.isVisible()) actualConfigBtn = flowMediaSettingsBtn;
            if (!await actualConfigBtn.isVisible()) actualConfigBtn = legacySettingsBtn;

            if (await actualConfigBtn.isVisible()) {
              await actualConfigBtn.click({ force: true });
              await getPlaywrightPage()!.waitForTimeout(1000);

              const isVideo = visualConfig?.generateType === GenerateType.Video || String(visualConfig?.generateType).toLowerCase() === "video";
              
              // 1. Chọn Tab Hình ảnh hoặc Video (UI Mới)
              // Flow keeps page-level navigation tabs in the DOM behind the
              // settings popover. The popover is appended last, so choose its
              // last matching tab instead of the background navigation tab.
              const flowTabs = getPlaywrightPage()!.locator('button.flow_tab_slider_trigger');
              const typeTab = flowTabs.filter({ hasText: isVideo ? /Video/i : /Hình ảnh|Image/i }).last();
              if (await typeTab.isVisible()) {
                await typeTab.click();
                await getPlaywrightPage()!.waitForTimeout(500);
              }

              // A reference image for video is a character/object component,
              // not a first-frame instruction.  Select Flow's "Thành phần"
              // mode explicitly so the uploaded image governs the subject in
              // the generated clip.
              if (isVideo && options.referenceImage) {
                const referenceModeTab = flowTabs.filter({ hasText: /Thành phần|Components|Ingredients/i }).last();
                if (await referenceModeTab.isVisible()) {
                  await referenceModeTab.click();
                  await getPlaywrightPage()!.waitForTimeout(300);
                }
              }

              // 2. Chọn Tỉ lệ khung hình (Aspect Ratio)
              const targetRatio = visualConfig?.aspectRatio || AspectRatio.SixteenNine;
              const ratioTab = flowTabs.filter({ hasText: new RegExp(targetRatio, "i") }).last();
              if (await ratioTab.isVisible()) {
                await ratioTab.click();
                await getPlaywrightPage()!.waitForTimeout(300);
              }

              // 3. Chọn Số lượng tạo (x2 / 1x)
              const countVal = visualConfig?.generateCount || 1;
              const countLabel = countVal === 1 ? '1x' : `x${countVal}`; 
              const countTab = flowTabs.filter({ hasText: new RegExp(countLabel, "i") }).last();
              if (await countTab.isVisible()) {
                await countTab.click();
                await getPlaywrightPage()!.waitForTimeout(300);
              }

              // 3.5. Chọn Thời lượng (chỉ hiển thị khi là video)
              if (isVideo) {
                const targetDuration = visualConfig?.videoDuration || "10s";
                const durationTab = flowTabs.filter({ hasText: new RegExp(targetDuration, "i") }).last();
                if (await durationTab.isVisible()) {
                  await durationTab.click();
                  await getPlaywrightPage()!.waitForTimeout(300);
                }
              }

              // 4. Chọn Model (Engine)
              const engineDropdownBtn = getPlaywrightPage()!.locator('button[aria-haspopup="menu"]').filter({ has: getPlaywrightPage()!.locator('i').filter({ hasText: /arrow_drop_down/ }) }).last();
              
              if (await engineDropdownBtn.isVisible()) {
                await engineDropdownBtn.click({ force: true });
                await getPlaywrightPage()!.waitForTimeout(500);
                
                const imageModels = ["Nano Banana Pro", "Nano Banana 2", "Nano Banana 2 Lite"];
                const videoModels = ["Omni Flash", "Veo 3.1 - Lite", "Veo 3.1 - Fast", "Veo 3.1 - Quality"];
                let targetEngine = String(visualConfig?.imageGeneratorEngine || "");
                // Saved image and video models are not interchangeable in Flow.
                if (isVideo && !videoModels.includes(targetEngine)) targetEngine = "Omni Flash";
                if (!isVideo && !imageModels.includes(targetEngine)) targetEngine = "Nano Banana Pro";
                // Escape special regex characters in the user's selected engine name
                const escapedTargetEngine = targetEngine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const engineRegex = new RegExp(escapedTargetEngine, "i");
                
                let optionBtn = getPlaywrightPage()!.locator('[role="menuitem"]' + ':visible').filter({ hasText: engineRegex }).first();
                if (await optionBtn.isVisible()) {
                  await optionBtn.click({ force: true });
                } else {
                  // Never choose the first option: it can switch a video request
                  // back to an image model.
                  await getPlaywrightPage()!.keyboard.press("Escape").catch(() => {});
                  appLog(`[Playwright] Flow model option not found: ${targetEngine}`);
                }
                await getPlaywrightPage()!.waitForTimeout(500);
              }

              // 5. Lưu và Đóng Popover
              const saveBtn = getPlaywrightPage()!
                .locator("button" + ":visible")
                .filter({ hasText: IMAGE_GEN_SAVE_BTN_REGEX })
                .first();
              if (await saveBtn.isVisible()) {
                await saveBtn.click();
              } else {
                await actualConfigBtn.click({ force: true }).catch(() => {});
                await getPlaywrightPage()!.mouse.click(0, 0).catch(() => {});
              }
              await getPlaywrightPage()!.waitForTimeout(1000);

              lastPlaywrightConfigState = currentConfigState;
              appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SUCCESS);
            } else {
              appLog("[Playwright] Không tìm thấy nút cấu hình Flow (tune), bỏ qua cài đặt thông số.");
            }
          }
        } catch (configErr) {
          appError(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SKIP + ' ' + (configErr as any)?.message);
        }

        // Flow determines whether an attachment is a component or a frame from
        // the active video setting.  Configure that setting first, then attach
        // the reference; attaching it beforehand lets Flow treat it as a plain
        // library upload and it is ignored by the generation request.
        if (options.referenceImage) {
          await uploadReferenceImage(getPlaywrightPage()!, options.referenceImage, 'labs');
        }

        // Flow leaves its media-settings popover open after a configuration
        // change. Close it before focusing the composer, otherwise the prompt
        // is never entered and the disabled send button looks like a hang.
        await getPlaywrightPage()!.keyboard.press("Escape").catch(() => {});
        await getPlaywrightPage()!.waitForTimeout(250);

        let targetPrompt = finalPrompt || prompt;
        if (options.referenceImage) {
          const isVideoRequest = visualConfig?.generateType === GenerateType.Video || String(visualConfig?.generateType).toLowerCase() === "video";
          const referenceInstruction = isVideoRequest
            ? "Use the attached reference image as a mandatory character and visual reference. Preserve the same subject identity, face, proportions, clothing, colors, line style, and key visual details throughout this video. Do not replace the referenced subject with a different character."
            : "Use the attached reference image as a mandatory visual reference. Preserve the same subject identity, face, proportions, clothing, colors, line style, and key visual details. Do not replace the referenced subject with a different character.";
          targetPrompt = `${referenceInstruction}\n\n${targetPrompt}`;
        }
        if (targetPrompt) {
          targetPrompt = targetPrompt.replace(/Depicting:\s*["“”']?[^"“”'.]+["“”']?\.?\s*/ig, '');
          targetPrompt = targetPrompt.replace(/Depicting:.+?(?=[A-Za-z])/ig, '');
          targetPrompt = targetPrompt.replace(/Depicting:\s*/ig, '');
        }
        if (targetPrompt && targetPrompt.length > 0) {
          


          const inputMethod = visualConfig?.promptInputMethod || PromptInputMethod.Paste;
          appLog(inputMethod === PromptInputMethod.Type ? BACKEND_MESSAGES.PLAYWRIGHT_TYPE_LOG : BACKEND_MESSAGES.PLAYWRIGHT_PASTE_LOG);

          const inputLoc = getPlaywrightPage()!.locator(SELECTOR_INPUT);

          await smoothMouseMove(getPlaywrightPage()!, inputLoc);
          await inputLoc.click();
          await randomDelay(50, 100);

          await getPlaywrightPage()!.keyboard.press("Control+A");
          await randomDelay(50, 100);
          await getPlaywrightPage()!.keyboard.press("Backspace");
          await randomDelay(50, 100);

          if (inputMethod === PromptInputMethod.Type) {
            await humanType(getPlaywrightPage()!, targetPrompt);
          } else {
            await getPlaywrightPage()!.keyboard.insertText(targetPrompt);
          }
          await randomDelay(50, 100);

          await getPlaywrightPage()!.keyboard.press("Space");
          await randomDelay(50, 100);
          await getPlaywrightPage()!.keyboard.press("Backspace");

          await randomDelay(500, 1000);
        }

        const oldIds = await getPlaywrightPage()!.evaluate((getImgIdStr) => {
          const getImgId = new Function("return " + getImgIdStr)();
          const imgs = Array.from(document.querySelectorAll("img"));
          return imgs
            .filter((img) => img.src && img.src.includes("getMediaUrlRedirect"))
            .map((img) => {
              if (typeof (window as any).__getImgId === "function") {
                return (window as any).__getImgId(img.src);
              }
              return getImgId(img.src);
            })
            .filter(Boolean);
        }, getImgIdSafe.toString());

        let isBtnDisabled = true;
        for (let i = 0; i < 6; i++) {
          try {
            isBtnDisabled = await submitBtnLocator.evaluate((btn) => {
              return !btn || btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true";
            });
          } catch (e) {
            isBtnDisabled = true;
          }
          if (!isBtnDisabled) break;
          await delayAsync(500);
        }

        appLog(BACKEND_MESSAGES.PLAYWRIGHT_SUBMIT_LOG);
        await submitBtnLocator.waitFor({ state: "visible", timeout: 5000 });
        await submitBtnLocator.scrollIntoViewIfNeeded();

        await smoothMouseMove(getPlaywrightPage()!, submitBtnLocator);
        await randomDelay(50, 100);
        await submitBtnLocator.click();

        appLog(BACKEND_MESSAGES.PLAYWRIGHT_WAITING_GEN);
        const isVideo = visualConfig?.generateType === "video" || visualConfig?.generateType === 1;

        const base64Data = await getPlaywrightPage()!.waitForFunction(
          ([oldIdsList, getImgIdStr, isVideoArg]) => {
            // Wait for generation to finish. If we see "đang tạo" / "generating", we must wait.
            const pageText = (document.body?.innerText || "").toLowerCase();
            const creditSignals = [
              "out of credits", "no credits", "insufficient credits",
              "credit balance", "generation credits", "quota exceeded",
              "rate limit", "hết credit", "hết lượt", "hết tín dụng",
              "không đủ tín dụng", "vượt quá hạn mức", "đã dùng hết lượt"
            ];
            if (creditSignals.some((signal) => pageText.includes(signal))) return "flow_credit_exhausted";

            const statusElements = Array.from(document.querySelectorAll("span, div, p"));
            const isGenerating = statusElements.some(el => {
              const text = (el.textContent || "").trim();
              if (/^\d+%$/.test(text)) return true;
              const lower = text.toLowerCase();
              return lower === 'đang t\u1EA1o' || lower === 'generating' || lower === 'creating' || lower === 'đang t\u1EA1o...';
            });
            if (isGenerating) return null;

            const getImgId = new Function("return " + getImgIdStr)();
            const medias = Array.from(document.querySelectorAll("img, video"));
            const genMedias = medias.filter((el) => {
              const src = (el as HTMLImageElement | HTMLVideoElement).src;
              if (!src) return false;
              if (isVideoArg) return el.tagName.toLowerCase() === 'video';
              if (el.tagName.toLowerCase() === 'video') return true;
              return src.includes("getMediaUrlRedirect");
            });

            const newMedia = genMedias.find((el) => {
              const src = (el as HTMLImageElement | HTMLVideoElement).src;
              const mediaId = getImgId(src);
              return mediaId && !oldIdsList.includes(mediaId);
            });

            if (newMedia) {
              try {
                newMedia.scrollIntoView({ behavior: "instant", block: "center" });
              } catch (e) { }

              if (newMedia.tagName.toLowerCase() === 'video') {
                 (window as any).__foundVideoEl = newMedia;
                 return "video_found";
              }

              const newImg = newMedia as HTMLImageElement;
              if (!newImg.complete || newImg.naturalWidth === 0) return null;

              const canvas = document.createElement("canvas");
              canvas.width = newImg.naturalWidth;
              canvas.height = newImg.naturalHeight;
              canvas.getContext("2d")?.drawImage(newImg, 0, 0);
              try {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
                if (dataUrl.length > 1000) return dataUrl;
              } catch (e) { }
            }
            return null;
          },
          [oldIds, getImgIdSafe.toString(), isVideo] as const,
          // Video creation often exceeds 150 seconds. Waiting in the same
          // tab avoids re-submitting an already accepted prompt and creating
          // a duplicate video on Flow.
          { timeout: isVideo ? 600000 : 180000 },
        );

        let finalBase64 = await base64Data.jsonValue();
        if (finalBase64 === "flow_credit_exhausted") {
          throw new Error("Google Flow không thể tạo video vì Chrome/tài khoản hiện tại đã hết credit hoặc hết lượt tạo. Hãy chọn Chrome khác còn credit rồi chạy lại các cảnh lỗi.");
        }
        if (finalBase64 === "video_found") {
           appLog("[Playwright] Phát hiện kết quả là Video. Đang kích hoạt Tải Xuống Native...");
           // Native download logic for video!
           try {
               await getPlaywrightPage()!.waitForTimeout(2000);
               
               // Hover the found video so the download button appears
               const videoLoc = getPlaywrightPage()!.locator('video').last();
               if (await videoLoc.isVisible()) {
                   await videoLoc.hover();
                   await getPlaywrightPage()!.waitForTimeout(1000);
               }
               
               // Find native download button
               const downloadBtn = getPlaywrightPage()!.locator('button').filter({ has: getPlaywrightPage()!.locator('i').filter({ hasText: /download|t\u1ea3i xu\u1ed1ng/i }) }).first();
               if (await downloadBtn.isVisible()) {
                   appLog("[Playwright] Clicked Native Download button on video.");
                   const [download] = await Promise.all([
                       getPlaywrightPage()!.waitForEvent('download', { timeout: 60000 }),
                       downloadBtn.click({ force: true })
                   ]);
                   const downloadPath = await download.path();
                   if (downloadPath) {
                       const buffer = require('fs').readFileSync(downloadPath);
                       finalBase64 = "data:video/mp4;base64," + buffer.toString("base64");
                   } else {
                       throw new Error("Download returned null path");
                   }
               } else {
                   // Fallback to script fetch if native button not found
                   appLog("[Playwright] Native download button not found. Fallback to fetch script...");
                   const videoBase64 = await getPlaywrightPage()!.evaluate(async () => {
                       const videoEl = (window as any).__foundVideoEl as HTMLVideoElement;
                       let s = videoEl.src || videoEl.querySelector("source")?.src;
                       if (!s) return "ERROR: no src found";
                       const res = await fetch(s);
                       const buffer = await res.arrayBuffer();
                       const bytes = new Uint8Array(buffer);
                       let binary = '';
                       for (let i = 0; i < bytes.length; i += 8192) {
                         binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 8192)));
                       }
                       return "data:video/mp4;base64," + btoa(binary);
                   });
                   if (videoBase64 && videoBase64.startsWith("ERROR:")) throw new Error(videoBase64);
                   finalBase64 = videoBase64;
               }
           } catch (e: any) {
               throw new Error("Native Download Failed: " + e.message);
           }
        }
        appLog(BACKEND_MESSAGES.PLAYWRIGHT_BASE64_SUCCESS);

        responseText = JSON.stringify({ directBase64: finalBase64 });
        success = true;
      } catch (err: any) {
        appError(`[Image Render] Attempt ${attempts} failed: ${err.message}`);

        try {
          if (getPlaywrightPage() && !getPlaywrightPage()!.isClosed()) {
            await getPlaywrightPage()!.screenshot({ path: "public/flow-debug.png", fullPage: true });
            appLog("[Playwright] Saved debug screenshot to public/flow-debug.png");
          }
        } catch (e) { }

        const closedKeywords = ["closed", "close", "context"];
        const isClosedError = closedKeywords.some((kw) => err.message?.toLowerCase().includes(kw));
        if (isClosedError) {
          appLog(BACKEND_MESSAGES.PLAYWRIGHT_CLOSED_DETECTED_RESET);
          await closePlaywright().catch(() => { });
        }

        if (attempts < maxAttempts) {
          try {
            if (getPlaywrightPage() && !getPlaywrightPage()!.isClosed()) {
              appLog(BACKEND_MESSAGES.IMAGE_RENDER_RELOAD);
              await getPlaywrightPage()!.reload({
                waitUntil: "domcontentloaded",
              });
              await getPlaywrightPage()!.waitForTimeout(5000);
            }
          } catch (reloadErr: any) {
            appError("FAILED_RELOAD_PAGE_RETRY", reloadErr);
            if (closedKeywords.some((kw) => reloadErr.message?.toLowerCase().includes(kw))) {
              await closePlaywright().catch(() => { });
            }
          }
        } else {
          throw err;
        }
      }
    }
  } catch (axiosErr: any) {
    const errText = axiosErr.response?.data || axiosErr.message;
    appError(`[Labs Sandbox Error] returned status ${axiosErr.response?.status || "Unknown"}: ${errText}`);

    let warnReason = `${BACKEND_MESSAGES.PLAYWRIGHT_SANDBOX_ERR} (HTTP ${axiosErr.response?.status || "Unknown"}). ${BACKEND_MESSAGES.PLAYWRIGHT_RECAPTCHA}`;
    try {
      const errorJson = typeof errText === "string" ? JSON.parse(errText) : errText;
      if (errorJson?.error?.details?.[0]?.reason) {
        warnReason += ` ${BACKEND_MESSAGES.PLAYWRIGHT_REASON}${errorJson.error.details[0].reason}`;
      }
    } catch (e) { }

    return {
      success: false,
      base64: null,
      fallbackUrl,
      warning: warnReason,
    };
  } finally {
    const delayTime = await randomDelay();
    appLog(BACKEND_MESSAGES.PLAYWRIGHT_MUTEX_DELAY.replace("{0}", delayTime.toString()));
    release();
  }

  try {
    const parsed = JSON.parse(responseText);
    if (parsed.directBase64) {
      let cleanBase64 = parsed.directBase64;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }

      return {
        success: true,
        base64: cleanBase64,
        fallbackUrl: parsed.directBase64,
      };
    }
  } catch (e) { }

  return {
    success: false,
    base64: null,
    fallbackUrl,
    warning: BACKEND_MESSAGES.PLAYWRIGHT_DECODE_ERR,
  };
}

export async function generateImageWithGeminiChat(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const { prompt, style, visualConfig } = options;

  const isStickman = !![style, prompt].some((str) => str && STICKMAN_KEYWORDS.some((kw) => str.toLowerCase().includes(kw)));

  let finalPrompt = prompt || "";
  const isVideoRequest = visualConfig?.generateType === GenerateType.Video || String(visualConfig?.generateType).toLowerCase() === "video";
  if (isVideoRequest) {
    const duration = String(visualConfig?.videoDuration || "10s").replace(/[^0-9.]/g, "") || "10";
    finalPrompt = `${finalPrompt}\n\nVIDEO DURATION REQUIREMENT: Create a complete ${duration}-second video clip. Do not return a short preview, teaser, loop, or a 3-second clip.`;
  }
  if (finalPrompt) {
    finalPrompt = finalPrompt.replace(/Depicting:\s*["“”']?[^"“”'.]+["“”']?\.?\s*/ig, '');
    finalPrompt = finalPrompt.replace(/Depicting:.+?(?=[A-Za-z])/ig, '');
    finalPrompt = finalPrompt.replace(/Depicting:\s*/ig, '');
  }
  if (isStickman) {
    finalPrompt = `${finalPrompt}, ${STICKMAN_STYLE_MODIFIERS}`;
  }

  if (visualConfig?.aspectRatio) {
    finalPrompt = `${finalPrompt}, aspect ratio ${visualConfig.aspectRatio}`;
  }

  // Gemini follows the negative prompt more strongly than typography. Keep
  // the text ban strictly for scene media, never for a text thumbnail.
  if ((visualConfig as any)?.noText && !(visualConfig as any)?.thumbnailTextRequired) finalPrompt += ", NO text, NO letters, NO words, NO watermark";
  if ((visualConfig as any)?.thumbnailTextRequired) finalPrompt += `, REQUIRED THUMBNAIL TYPOGRAPHY: display this exact bold readable text on the image: \"${String((visualConfig as any).thumbnailText || "").trim()}\"`;
  if ((visualConfig as any)?.noBlackBorder) finalPrompt += ", NO black borders, NO frames, full screen image";
  if ((visualConfig as any)?.noWallPicture) finalPrompt += ", NO wall pictures, NO picture frames on wall, NO paintings on wall, realistic scenery";

  const kws = extractKeywords(finalPrompt);
  const fallbackUrl = isStickman ? `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/stickman,cartoon` : `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${encodeURIComponent(kws || "cinematic,landscape")}`;

  const release = await getWorkerMutex().acquire();
  await randomDelay(1000, 4000);
  let success = false;
  let base64Result: string | null = null;
  let roomAttempts = 0;
  const maxRoomAttempts = 2;

  try {
    while (roomAttempts < maxRoomAttempts && !success) {
      roomAttempts++;

      let needNewRoom = false;
      if (!getPlaywrightPage() || getPlaywrightPage()!.isClosed()) {
        needNewRoom = true;
      } else {
        const currentUrl = getPlaywrightPage()!.url();
        if (!currentUrl.includes("gemini.google.com")) {
          needNewRoom = true;
        } else if (consecutiveGeminiErrors >= 2) {
          needNewRoom = true;
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_FORCED);
        }
      }

      if (needNewRoom) {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_START_ROOM.replace("{0}", roomAttempts.toString()).replace("{1}", maxRoomAttempts.toString()));
        try {
          if (!getPlaywrightPage() || getPlaywrightPage()!.isClosed()) {
            await initPlaywright(visualConfig?.chromeHeadless ?? true);
          }
          if (!getPlaywrightPage()) {
            throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
          }

          await getPlaywrightPage()!.goto(EXTERNAL_URLS.GEMINI_CHAT, { waitUntil: "commit", timeout: 60000 });
          await randomDelay(3000, 5000);
          consecutiveGeminiErrors = 0;
        } catch (err: any) {
          appError(BACKEND_MESSAGES.GEMINI_CHAT_INIT_FAILED.replace("{0}", err.message));
          if (roomAttempts >= maxRoomAttempts) throw err;
          continue;
        }
      } else {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_REUSE);
      }

      let reloadAttempts = 0;
      const maxReloadAttempts = 4;

      while (reloadAttempts < maxReloadAttempts && !success) {
        reloadAttempts++;
        if (reloadAttempts > 1) {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD.replace("{0}", (reloadAttempts - 1).toString()));
          try {
            await getPlaywrightPage()!.reload({ waitUntil: "domcontentloaded" });
            await randomDelay(3000, 5000);
          } catch (reloadErr: any) {
            appError(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD_FAILED.replace("{0}", reloadErr.message));
            continue;
          }
        }

        try {
          const inputLoc = getPlaywrightPage()!.locator(GeminiChatSelector.Input).first();
          await inputLoc.waitFor({ state: "visible", timeout: 60000 });

          const currentConfigState = JSON.stringify({
            generateType: visualConfig?.generateType || GenerateType.Image,
            imageGeneratorEngine: visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
          });
          const isConfigChanged = currentConfigState !== lastGeminiConfigState;
          const forceSetting = needNewRoom || isConfigChanged;

          await configureGeminiGenerateType(getPlaywrightPage()!, visualConfig, forceSetting);
          await configureGeminiModel(getPlaywrightPage()!, visualConfig, forceSetting);

          if (forceSetting) {
            lastGeminiConfigState = currentConfigState;
          }
          
          if (options.referenceImage) {
            await uploadReferenceImage(getPlaywrightPage()!, options.referenceImage, 'gemini');
          }

          await enterGeminiPrompt(getPlaywrightPage()!, finalPrompt, visualConfig);

          const initialResponseCount = await getPlaywrightPage()!.locator("model-response").count();
          const sendBtn = getPlaywrightPage()!.locator(GeminiChatSelector.SendButton).first();
          let clicked = false;
          try {
            if ((await sendBtn.isVisible()) && !(await sendBtn.isDisabled())) {
              await sendBtn.click();
              clicked = true;
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_CLICKED_SEND);
            }
          } catch (e: any) {
            appError(BACKEND_MESSAGES.GEMINI_CHAT_CLICK_SEND_FAILED.replace("{0}", e.message));
          }

          if (!clicked) {
            await getPlaywrightPage()!.keyboard.press("Enter");
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_PRESSED_ENTER);
          }
          await randomDelay(1200, 2200);

          base64Result = await waitForDownloadAndGetBase64(getPlaywrightPage()!, visualConfig, initialResponseCount);
          if (base64Result) {
            success = true;
            consecutiveGeminiErrors = 0;
          } else {
            throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
          }
        } catch (err: any) {
          consecutiveGeminiErrors++;
          appError(BACKEND_MESSAGES.GEMINI_CHAT_ATTEMPT_FAILED.replace("{0}", reloadAttempts.toString()).replace("{1}", roomAttempts.toString()).replace("{2}", err.message));
        }
      }
    }
  } catch (err: any) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_FAILED_COMPLETELY.replace("{0}", err.message));
  } finally {
    // A connected Chrome may be the user's signed-in browser. The helper is
    // intentionally a no-op unless initPlaywright launched this profile.
    await closeAutoLaunchedPlaywrightBrowser().catch(() => { });
    const delayTime = await randomDelay();
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_MUTEX_DELAY.replace("{0}", delayTime.toString()));
    release();
  }

  if (success && base64Result) {
    return { success: true, base64: base64Result, fallbackUrl: `data:image/jpeg;base64,${base64Result}` };
  }
  return { success: false, base64: null, fallbackUrl, warning: BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING };
}

export interface BatchImageItem {
  sceneId: string;
  prompt: string;
  referenceImage?: string | null;
}

export interface BatchImageResult {
  sceneId: string;
  success: boolean;
  base64: string | null;
  fallbackUrl: string;
  warning?: string;
}

export async function closeAllBatchPages() {
  const entries = [...globalBatchPagesByPort.entries()];
  for (const [port, pages] of entries) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_CLOSE_TABS.replace("{0}", pages.length.toString()));
    for (const page of pages) {
      try { if (!page.isClosed()) await page.close(); } catch (e) { }
    }
    globalBatchPagesByPort.delete(port);
  }
}

async function applyBatchDelay(visualConfig: any): Promise<number> {
  const ms = getBatchDelayMs(visualConfig?.batchDelay);
  await delayAsync(ms);
  return ms;
}

export async function generateBatchImagesWithGoogleLabs(items: BatchImageItem[], visualConfig: any, style?: string, onProgress?: (result: BatchImageResult) => void): Promise<BatchImageResult[]> {
  const results: BatchImageResult[] = [];
  for (let i = 0; i < items.length; i++) {
    if (isBatchCancelled) {
      results.push({ sceneId: items[i].sceneId, success: false, base64: null, fallbackUrl: "", warning: "Bị huỷ bỏ bởi người dùng" });
      continue;
    }
    const item = items[i];
    try {
      let refImg = item.referenceImage || "";
      if (!refImg && visualConfig?.globalReferenceImages && visualConfig.globalReferenceImages.length > 0) {
        refImg = visualConfig.globalReferenceImages[0];
      }
      const res = await generateImageWithPlaywright({ prompt: item.prompt, style, visualConfig, referenceImage: refImg });
      const batchRes = { sceneId: item.sceneId, base64: res.base64, success: res.success, warning: res.warning, fallbackUrl: res.fallbackUrl || "" };
      results.push(batchRes);
      if (onProgress) onProgress(batchRes);
      if (i < items.length - 1) await applyBatchDelay(visualConfig);
    } catch (e: any) {
      const errRes = { sceneId: item.sceneId, success: false, base64: null, fallbackUrl: "", warning: e.message };
      results.push(errRes);
      if (onProgress) onProgress(errRes);
    }
  }
  return results;
}

/** Runs one persistent Flow project per tab and never reuses a prompt slot. */
export async function generateParallelBatchImagesWithGoogleLabs(items: BatchImageItem[], visualConfig: any, style?: string, onProgress?: (result: BatchImageResult) => void): Promise<BatchImageResult[]> {
  if (!items.length) return [];
  if (!getPlaywrightPage() || getPlaywrightPage()!.isClosed()) {
    await initPlaywright(visualConfig?.chromeHeadless ?? true, "google_labs");
  }
  const primaryPage = getPlaywrightPage();
  if (!primaryPage) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
  const tabCount = Math.min(items.length, Math.max(1, Number(visualConfig?.threadCount) || 1));
  const pages: Page[] = [primaryPage];
  while (pages.length < tabCount) pages.push(await primaryPage.context().newPage());
  globalBatchPagesByPort.set(portContext.getStore() || 9222, pages);

  const results: BatchImageResult[] = [];
  let nextIndex = 0;
  const executeWorker = async (page: Page) => {
    while (!isBatchCancelled) {
      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) return;
      const item = items[currentIndex];
      try {
        const refImg = item.referenceImage || visualConfig?.globalReferenceImages?.[0] || "";
        const res = await pageContext.run(page, () => generateImageWithPlaywright({ prompt: item.prompt, style, visualConfig, referenceImage: refImg }));
        const batchRes: BatchImageResult = { sceneId: item.sceneId, base64: res.base64, success: res.success, warning: res.warning, fallbackUrl: res.fallbackUrl || "" };
        results.push(batchRes);
        onProgress?.(batchRes);
      } catch (e: any) {
        const batchRes: BatchImageResult = { sceneId: item.sceneId, success: false, base64: null, fallbackUrl: "", warning: e.message };
        results.push(batchRes);
        onProgress?.(batchRes);
      }
      if (!isBatchCancelled && nextIndex < items.length) await applyBatchDelay(visualConfig);
    }
  };
  await Promise.all(pages.map(executeWorker));
  return results;
}

export async function generateBatchImagesWithGeminiChat(items: BatchImageItem[], visualConfig: any, style?: string, onProgress?: (result: BatchImageResult) => void): Promise<BatchImageResult[]> {
  if (!items || items.length === 0) return [];
  
  const isVideo = visualConfig?.generateType === GenerateType.Video || visualConfig?.generateType === "video";
  let concurrency = visualConfig?.threadCount || GEMINI_CHAT_SPEED_TAB_COUNT[visualConfig?.geminiChatSpeed || GeminiChatSpeed.Slow] || 1;
  
  if (isVideo) {
    concurrency = Math.min(concurrency, 2); // Khuyến nghị chỉ chạy 2 luồng cho video trên Gemini
  }
  
  const maxTabs = Math.min(items.length, concurrency);

  if (maxTabs === 1) {
    const results: BatchImageResult[] = [];
    for (let i = 0; i < items.length; i++) {
      if (isBatchCancelled) {
        appLog("BATCH CANCELED BY USER");
        break;
      }
      const item = items[i];
      let refImg = item.referenceImage || "";
      if (!refImg && visualConfig?.globalReferenceImages && visualConfig.globalReferenceImages.length > 0) {
        refImg = visualConfig.globalReferenceImages[0];
      }
      const result = await generateImageWithGeminiChat({ prompt: item.prompt, style, visualConfig, referenceImage: refImg });
      const batchRes = { sceneId: item.sceneId, ...result };
      results.push(batchRes);
      if (onProgress) onProgress(batchRes);
      if (i < items.length - 1) {
        const delayTime = await applyBatchDelay(visualConfig);
        appLog(BACKEND_MESSAGES.SPAM_PREVENTION_DELAY.replace("{0}", delayTime.toString()));
      }
    }
    return results;
  }

  const release = await getWorkerMutex().acquire();
  const results: BatchImageResult[] = [];
  try {
    if (!getPlaywrightPage() || getPlaywrightPage()!.isClosed()) {
      await initPlaywright(visualConfig?.chromeHeadless ?? true);
    }
    if (!getPlaywrightPage()) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);

    const browser = getPlaywrightPage()!.context().browser();
    if (!browser) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
    const context = browser.contexts()[0];
    if (!context) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);

    const currentPort = portContext.getStore() || 9222;
    const batchPages = (globalBatchPagesByPort.get(currentPort) || []).filter((p) => !p.isClosed());
    globalBatchPagesByPort.set(currentPort, batchPages);
    if (batchPages.length < maxTabs) {
      const needed = maxTabs - batchPages.length;
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_START.replace("{0}", needed.toString()));
      for (let i = 0; i < needed; i++) {
        const newPage = await context.newPage();
        await newPage.goto(EXTERNAL_URLS.GEMINI_CHAT, { waitUntil: "commit", timeout: 60000 });
        await randomDelay(2000, 4000);
        batchPages.push(newPage);
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_INIT.replace("{0}", batchPages.length.toString()).replace("{1}", maxTabs.toString()));
      }
    }

    const activePages = batchPages.slice(0, maxTabs);
    for (let i = 0; i < activePages.length; i++) {
      const page = activePages[i];
      try {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM.replace("{0}", (i + 1).toString()));
        await page.goto(EXTERNAL_URLS.GEMINI_CHAT, { waitUntil: "commit", timeout: 60000 });
        await randomDelay(2000, 4000);
        batchPagesErrors.set(page, 0);
      } catch (err: any) {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM_ERR.replace("{0}", (i + 1).toString()).replace("{1}", err.message));
      }
    }

    const generateOnTab = async (page: Page, item: BatchImageItem, tabIndex: number): Promise<BatchImageResult> => {
      const isStickman = !![style, item.prompt].some((str) => str && STICKMAN_KEYWORDS.some((kw) => str.toLowerCase().includes(kw)));
      let finalPrompt = item.prompt || "";
      if (isStickman) finalPrompt = `${finalPrompt}, ${STICKMAN_STYLE_MODIFIERS}`;
      if ((visualConfig as any)?.noText) {
        finalPrompt += ", NO text, NO letters, NO words, NO captions, NO subtitles, NO watermark, NO logo";
      }
      if ((visualConfig as any)?.noBlackBorder) {
        finalPrompt += ", NO black borders, NO frames, NO letterboxing, full screen image";
      }
      if ((visualConfig as any)?.noWallPicture) {
        finalPrompt += ", NO wall pictures, NO picture frames, NO paintings, NO posters on walls";
      }
      if (visualConfig?.aspectRatio) finalPrompt = `${finalPrompt}, aspect ratio ${visualConfig.aspectRatio}`;

      const kws = extractKeywords(finalPrompt);
      const fallbackUrl = isStickman ? `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/stickman,cartoon` : `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${encodeURIComponent(kws || DEFAULT_IMAGE_KEYWORDS)}`;

      let success = false;
      let base64Result: string | null = null;
      let roomAttempts = 0;
      const maxRoomAttempts = 2;

      try {
        while (roomAttempts < maxRoomAttempts && !success) {
          roomAttempts++;
          if (page.isClosed()) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_PAGE_CLOSED);

          const currentUrl = page.url();
          const consecutiveErrors = batchPagesErrors.get(page) || 0;
          let needNewRoom = false;

          if (!currentUrl.includes("gemini.google.com")) {
            needNewRoom = true;
          } else if (consecutiveErrors >= 2) {
            needNewRoom = true;
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_FORCED_NEW_ROOM.replace("{0}", (tabIndex + 1).toString()).replace("{1}", consecutiveErrors.toString()));
          }

          if (needNewRoom) {
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_REDIRECT_ATTEMPT.replace("{0}", (tabIndex + 1).toString()).replace("{1}", roomAttempts.toString()).replace("{2}", maxRoomAttempts.toString()));
            try {
              await page.goto(EXTERNAL_URLS.GEMINI_CHAT, { waitUntil: "commit", timeout: 60000 });
              await randomDelay(2000, 4000);
              batchPagesErrors.set(page, 0);
            } catch (err: any) {
              appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_REDIRECT_FAILED.replace("{0}", (tabIndex + 1).toString()).replace("{1}", err.message));
              if (roomAttempts >= maxRoomAttempts) throw err;
              continue;
            }
          } else {
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_ROOM_REUSE.replace("{0}", (tabIndex + 1).toString()));
          }

          let reloadAttempts = 0;
          const maxReloadAttempts = 4;
          while (reloadAttempts < maxReloadAttempts && !success) {
            reloadAttempts++;
            if (reloadAttempts > 1) {
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_ATTEMPT.replace("{0}", (tabIndex + 1).toString()).replace("{1}", (reloadAttempts - 1).toString()));
              try {
                await page.reload({ waitUntil: "domcontentloaded" });
                await randomDelay(3000, 5000);
              } catch (reloadErr: any) {
                appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_FAILED.replace("{0}", (tabIndex + 1).toString()).replace("{1}", reloadErr.message));
                continue;
              }
            }

            try {
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", item.sceneId));
              const inputLoc = page.locator(GeminiChatSelector.Input).first();
              await inputLoc.waitFor({ state: "visible", timeout: 60000 });

              const currentConfigState = JSON.stringify({
                generateType: visualConfig?.generateType || GenerateType.Image,
                imageGeneratorEngine: visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
              });

              const lastConfig = batchPagesConfigs.get(page);
              const isConfigChanged = currentConfigState !== lastConfig;
              const forceSetting = needNewRoom || isConfigChanged;

              await configureGeminiGenerateType(page, visualConfig, forceSetting);
              await configureGeminiModel(page, visualConfig, forceSetting);

              if (forceSetting) batchPagesConfigs.set(page, currentConfigState);

              let refImg = item.referenceImage || "";
              if (!refImg && visualConfig?.globalReferenceImages && visualConfig.globalReferenceImages.length > 0) {
                refImg = visualConfig.globalReferenceImages[0];
              }
              if (refImg) {
                await uploadReferenceImage(page, refImg, 'gemini');
              }

              await enterGeminiPrompt(page, finalPrompt, visualConfig);

              const initialResponseCount = await page.locator("model-response").count();
              const sendBtn = page.locator(GeminiChatSelector.SendButton).first();
              let clicked = false;
              try {
                if ((await sendBtn.isVisible()) && !(await sendBtn.isDisabled())) {
                  await sendBtn.click();
                  clicked = true;
                  appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_CLICKED_SEND}`));
                }
              } catch (e: any) {
                appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_CLICK_SEND_FAILED.replace("{0}", e.message)}`));
              }

              if (!clicked) {
                await page.keyboard.press("Enter");
                appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_PRESSED_ENTER}`));
              }
              await randomDelay(1200, 2200);

              base64Result = await waitForDownloadAndGetBase64(page, visualConfig, initialResponseCount);
              if (base64Result) {
                success = true;
                batchPagesErrors.set(page, 0);
              } else {
                throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
              }
            } catch (err: any) {
              batchPagesErrors.set(page, (batchPagesErrors.get(page) || 0) + 1);
              appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_ATTEMPT_FAILED.replace("{0}", reloadAttempts.toString()).replace("{1}", roomAttempts.toString()).replace("{2}", err.message)}`));
            }
          }
        }
      } catch (err: any) {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_FAILED_COMPLETELY.replace("{0}", err.message)}`));
      }

      if (success && base64Result) {
        return { sceneId: item.sceneId, success: true, base64: base64Result, fallbackUrl: `data:image/jpeg;base64,${base64Result}` };
      }
      return { sceneId: item.sceneId, success: false, base64: null, fallbackUrl, warning: BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING };
    };

    const runBatchWithConcurrency = async () => {
      let index = 0;
      const executeNext = async (page: Page, tabIndex: number): Promise<void> => {
        if (index >= items.length) return;
        const currentIndex = index++;
        if (isBatchCancelled) {
          appLog("BATCH CANCELED BY USER");
          return;
        }
        const item = items[currentIndex];
        const res = await generateOnTab(page, item, tabIndex);
        results.push(res);
        if (onProgress) onProgress(res);

        if (currentIndex < items.length - 1) {
          const delayTime = await applyBatchDelay(visualConfig);
          appLog(BACKEND_MESSAGES.SPAM_PREVENTION_DELAY.replace("{0}", delayTime.toString()));
        }

        await executeNext(page, tabIndex);
      };

      const promises = activePages.map((page, i) => executeNext(page, i));
      await Promise.all(promises);
    };

    await runBatchWithConcurrency();
  } catch (err: any) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_FAILED_COMPLETELY.replace("{0}", err.message));
  } finally {
    // Keep every worker tab and its chat/project alive for the next batch.
    // Closing or resetting here destroys the requested Chrome → tab mapping.
    const delayTime = await randomDelay();
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_MUTEX_DELAY.replace("{0}", delayTime.toString()));
    release();
  }

  return results;
}

async function configureGeminiModel(page: any, visualConfig: any, forceSetting: boolean) {
  let targetModelText = "Pro";
  if (visualConfig?.geminiModel) {
    const modelStr = visualConfig.geminiModel.toLowerCase();
    if (modelStr.includes("lite")) targetModelText = "Flash-Lite";
    else if (modelStr.includes("flash")) targetModelText = "Flash";
    else if (modelStr.includes("tư duy mở rộng") || modelStr.includes("advanced")) targetModelText = "Advanced";
    else targetModelText = "Pro";
  } else {
    const engine = visualConfig?.imageGeneratorEngine;
    if (engine === "gemini_chat" || engine === "veo3") {
      targetModelText = "Pro";
    }
  }

  const currentModelBtn = page.locator('.gemini-chat-model-picker, [data-test-id="model-picker-button"], button[data-test-id="bard-mode-menu-button"], button.input-area-switch, button[aria-label*="Model" i], button[aria-label*="mô hình" i], button[aria-haspopup="menu"]:has-text("Gemini")').first();
  try {
    if (await currentModelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (forceSetting) {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_CONFIG_MODEL.replace("{0}", targetModelText));
        const currentText = await currentModelBtn.textContent();
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_CURRENT_MODEL.replace("{0}", currentText || "Unknown"));

        let isCorrect = false;
        if (targetModelText === "Flash-Lite" && currentText?.includes("Lite")) {
          isCorrect = true;
        } else if (targetModelText === "Flash" && currentText?.includes("Flash") && !currentText?.includes("Lite")) {
          isCorrect = true;
        } else if (targetModelText === "Pro" && currentText?.includes("Pro")) {
          isCorrect = true;
        } else if (targetModelText === "Advanced" && (currentText?.includes("Advanced") || currentText?.toLowerCase().includes("mở rộng"))) {
          isCorrect = true;
        }

        if (isCorrect) {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_CORRECT);
          return;
        }

        await currentModelBtn.click();
        await randomDelay(800, 1500);

        const regexStr = targetModelText === "Advanced" ? "Advanced|mở rộng" : targetModelText;
        const optionBtn = page.locator('.cdk-overlay-pane button, mat-menu button, [role="menuitem"]').filter({ hasText: new RegExp(regexStr, "i") }).first();
        if (await optionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await optionBtn.click();
          await randomDelay(1000, 1500);
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_SUCCESS.replace("{0}", targetModelText));
        } else {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_NOT_FOUND.replace("{0}", targetModelText));
          await page.keyboard.press("Escape").catch(() => { });
          await randomDelay(500, 800);
        }
      } else {
        if (Math.random() < 0.3) {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_MOCK_CHECK);
          await currentModelBtn.click();
          await randomDelay(500, 800);
          await page.keyboard.press("Escape").catch(() => { });
        }
      }
    } else {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);
    }
  } catch (err: any) {
    appLog("[Gemini Chat] Error configuring model: " + err.message);
  }
}


async function configureGeminiGenerateType(page: Page, visualConfig: any, forceSetting: boolean) {
  const isVideo = visualConfig?.generateType === GenerateType.Video || visualConfig?.generateType === "video";
  const targetText = isVideo ? GeminiChatTextOption.CreateVideoVi : GeminiChatTextOption.CreateImageVi;
  const targetRegex = isVideo ? new RegExp(GeminiChatTextOption.CreateVideoRegexStr, "i") : new RegExp(GeminiChatTextOption.CreateImageRegexStr, "i");

  const plusBtn = page.locator(GeminiChatSelector.PlusButton).first();
  if (!(await plusBtn.isVisible())) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_PLUS_NOT_FOUND);
    return;
  }

  if (forceSetting) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_CONFIG_GEN_TYPE.replace("{0}", targetText));
    await randomDelay(800, 1500);
    await plusBtn.click();
    await randomDelay(1000, 1800);

    const optionBtn = page.locator(GeminiChatSelector.PlusMenuOptions + ', .cdk-overlay-container [role="menuitem"]').filter({ hasText: targetRegex }).first();

    if (await optionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isDisabled = await optionBtn.getAttribute('disabled') !== null || await optionBtn.getAttribute('aria-disabled') === 'true' || await optionBtn.evaluate((el: any) => el.classList.contains('disabled') || el.classList.contains('mdc-list-item--disabled'));
      if (isDisabled) {
          throw new Error(`Tài khoản Gemini của bạn đã đạt giới hạn (hoặc bị khóa) tính năng: ${targetText}`);
      }
      await randomDelay(500, 1000);
      try {
        await optionBtn.scrollIntoViewIfNeeded();
        await optionBtn.click({ timeout: 2000 });
      } catch (e) {
        await optionBtn.evaluate((el: HTMLElement) => el.click());
      }
      await randomDelay(1200, 2000);
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_SUCCESS.replace("{0}", targetText));
    } else {
      const optionBtnFallback = page.locator(".cdk-overlay-container button, .cdk-overlay-pane button, [role='menuitem']").filter({ hasText: targetRegex }).first();
      if (await optionBtnFallback.isVisible()) {
        const isDisabled = await optionBtnFallback.getAttribute('disabled') !== null || await optionBtnFallback.getAttribute('aria-disabled') === 'true' || await optionBtnFallback.evaluate((el: any) => el.classList.contains('disabled') || el.classList.contains('mdc-list-item--disabled'));
        if (isDisabled) {
            throw new Error(`Tài khoản Gemini của bạn đã đạt giới hạn (hoặc bị khóa) tính năng: ${targetText}`);
        }
        await randomDelay(500, 1000);
        await optionBtnFallback.click();
        await randomDelay(1200, 2000);
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_FALLBACK.replace("{0}", targetText));
      } else {
        appLog("[Playwright] Tuỳ chọn chưa xuất hiện, thử lại sau 3 giây...");
        await page.keyboard.press("Escape");
        await randomDelay(3000, 4000);
        await plusBtn.click();
        await randomDelay(1500, 2500);
        if (await optionBtnFallback.isVisible()) {
          const isDisabled = await optionBtnFallback.getAttribute('disabled') !== null || await optionBtnFallback.getAttribute('aria-disabled') === 'true' || await optionBtnFallback.evaluate((el: any) => el.classList.contains('disabled') || el.classList.contains('mdc-list-item--disabled'));
          if (isDisabled) {
              throw new Error(`Tài khoản Gemini của bạn đã đạt giới hạn (hoặc bị khóa) tính năng: ${targetText}`);
          }
          await optionBtnFallback.click();
          await randomDelay(1200, 2000);
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_FALLBACK.replace("{0}", targetText));
        } else {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_NOT_FOUND.replace("{0}", targetText));
          await page.keyboard.press("Escape");
          await randomDelay(500, 800);
          if (isVideo) {
             throw new Error(`Tài khoản Gemini của bạn chưa hỗ trợ tính năng: ${targetText}`);
          }
        }
      }
    }

    if (isVideo) {
      // 1. Tắt popup giới thiệu (nếu có)
      const popupBtn = page.locator('dialog button, [role="dialog"] button').filter({ hasText: /Dùng thử|Cuộc trò chuyện mới|Bắt đầu|Start|Đã hiểu|Got it/i }).first();
      if (await popupBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        appLog("[Playwright] Đóng popup giới thiệu Video/Chuyển room...");
        await popupBtn.click({ force: true });
        await randomDelay(2000, 3000);
        // Wait for the new chat interface to fully load
        await page.waitForSelector(GeminiChatSelector.InputTextarea, { state: "visible", timeout: 10000 }).catch(() => { });
        await randomDelay(1000, 2000);
        appLog("[Playwright] Kiểm tra lại tuỳ chọn Tạo video sau khi đóng popup...");
        await configureGeminiGenerateType(page, visualConfig, true);
        return;
      }
    }

  } else {
    if (Math.random() < 0.3) {
      try {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_PLUS_MOCK_CHECK);
        await randomDelay(600, 1200);
        await plusBtn.click();
        await randomDelay(1200, 2000);
        await page.keyboard.press("Escape").catch(() => { });
        await randomDelay(600, 1200);
      } catch (e) { }
    }
  }

  // 2. Chọn Tỉ lệ khung hình (Aspect Ratio) - Thực hiện luôn nếu là Video (không phụ thuộc forceSetting)
  if (isVideo) {
    // Gemini may keep the short-preview duration used by a previous chat. Select the
    // requested duration explicitly whenever the control is available.
    const requestedDuration = String(visualConfig?.videoDuration || "10s");
    const durationChip = page.locator('gem-button.input-companion-chip-button, input-companion-chip button, button').filter({
      hasText: /(^|\s)(3|4|5|6|8|10)s(\s|$)/i,
    }).first();
    if (await durationChip.isVisible({ timeout: 2500 }).catch(() => false)) {
      const currentDuration = (await durationChip.textContent().catch(() => "")) || "";
      if (!currentDuration.includes(requestedDuration)) {
        await durationChip.click({ timeout: 2000 }).catch(() => {});
        await randomDelay(500, 900);
        const durationOption = page.locator('input-companion-item, .cdk-overlay-container [role="menuitemradio"], .cdk-overlay-container [role="menuitem"], .cdk-overlay-container button').filter({
          hasText: new RegExp(`(^|\\s)${requestedDuration.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`, "i"),
        }).last();
        if (await durationOption.isVisible({ timeout: 2200 }).catch(() => false)) {
          await durationOption.click({ timeout: 2000 }).catch(async () => {
            await durationOption.evaluate((el: HTMLElement) => el.click());
          });
          appLog(`[Gemini Chat] Selected video duration: ${requestedDuration}`);
          await randomDelay(500, 900);
        } else {
          await page.keyboard.press("Escape").catch(() => {});
          appLog(`[Gemini Chat] Duration selector has no ${requestedDuration} option; the prompt will require it.`);
        }
      }
    } else {
      appLog(`[Gemini Chat] Duration selector is unavailable; the prompt will require ${requestedDuration}.`);
    }

    const targetRatio = visualConfig?.aspectRatio || "16:9";
    const ratioChip = page.locator('gem-button.input-companion-chip-button, input-companion-chip button').filter({ hasText: /16:9|9:16|1:1|Ngang|Dọc/i }).first();

    appLog("[Playwright] Đang kiểm tra nút Tỷ lệ khung hình...");
    if (await ratioChip.isVisible({ timeout: 3000 }).catch(() => false)) {
      const currentText = await ratioChip.textContent();
      if (!currentText || !currentText.includes(targetRatio)) {
        appLog("[Playwright] Cần đổi tỷ lệ thành " + targetRatio);
        await ratioChip.click({ timeout: 2000 });
        await randomDelay(1000, 1500);
        const targetNumberText = targetRatio.replace(":", "");
        const menuOption = page.locator('input-companion-item, .cdk-overlay-container [role="menuitemradio"], .cdk-overlay-container [role="menuitem"]').filter({ hasText: new RegExp(targetRatio + "|" + targetNumberText + "|Ngang|Dọc", "i") }).filter({ hasText: new RegExp(targetRatio, "i") }).last();
        if (await menuOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          try {
            await menuOption.scrollIntoViewIfNeeded();
            await menuOption.click({ timeout: 2000 });
          } catch (e) {
            await menuOption.evaluate((el: HTMLElement) => el.click());
          }
          await randomDelay(800, 1500);
        } else {
          appLog("[Playwright] Không tìm thấy tuỳ chọn tỷ lệ trong menu.");
          await page.keyboard.press("Escape").catch(() => { });
        }
      } else {
        appLog("[Playwright] Tỷ lệ hiện tại đã đúng: " + targetRatio);
      }
    } else {
      appLog("[Playwright] Không thấy nút tỷ lệ nào xuất hiện trên giao diện.");
    }
  }
}

async function enterGeminiPrompt(page: Page, originalPromptText: string, visualConfig: any) {
  let promptText = originalPromptText;
  if (visualConfig?.generateType === GenerateType.Video || visualConfig?.generateType === "video") {
    const targetRatio = visualConfig?.aspectRatio || "16:9";
    promptText = `Tạo video với tỷ lệ khung hình ${targetRatio}, nội dung: ${originalPromptText}`;
  }

  const inputLoc = page.locator(GeminiChatSelector.InputTextarea).first();
  await smoothMouseMove(page, inputLoc);
  await inputLoc.focus();
  await randomDelay(300, 600);
  await inputLoc.click();
  await randomDelay(50, 100);

  const inputMethod = visualConfig?.promptInputMethod || PromptInputMethod.Paste;
  if (inputMethod === PromptInputMethod.Type) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_TYPING_PROMPT);
    await humanType(page, promptText);
  } else {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_PASTING_PROMPT);
    try {
      const context = page.context();
      await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => { });
      const clipboardSuccess = await page.evaluate(async (text) => {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {
          return false;
        }
      }, promptText);

      if (clipboardSuccess) {
        await page.keyboard.press("Control+V");
      } else {
        await page.keyboard.insertText(promptText);
      }
    } catch (pasteErr) {
      await page.keyboard.insertText(promptText);
    }
  }
  await randomDelay(500, 1000);
}

async function waitForGeminiFinished(page: Page, timeoutMs = 240000, initialResponseCount?: number) {
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_WAITING_RESPONSE);

  if (initialResponseCount !== undefined) {
    try {
      await page.waitForFunction((expected) => document.querySelectorAll("model-response").length >= expected, initialResponseCount + 1, { timeout: 60000 });
    } catch (e) {
      appError(BACKEND_MESSAGES.GEMINI_CHAT_WAIT_NEW_RESPONSE_TIMEOUT);
      throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_NO_NEW_RESPONSE);
    }
  }

  try {

    await page.locator("thinking-overlay").waitFor({ state: "detached", timeout: 30000 });
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_THINKING_DETACHED);
  }

  const latestResponse = page.locator("model-response").last();
  try {
    const processingChip = latestResponse.locator("async-processing-chip").first();
    if (await processingChip.isVisible({ timeout: 5000 }).catch(() => false)) {
      appLog("[Playwright] Hệ thống đang xử lý tạo media... (có thể mất vài phút)");
      await processingChip.waitFor({ state: "detached", timeout: timeoutMs });
    }
  } catch (e) { }

  try {
    const busyDiv = latestResponse.locator('message-content div[aria-busy="true"]').first();
    if (await busyDiv.isVisible({ timeout: 2000 }).catch(() => false)) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_BUSY_WAIT);
      await latestResponse.locator('message-content div[aria-busy="false"]').first().waitFor({ state: "attached", timeout: timeoutMs });
    }
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_BUSY_TIMEOUT);
  }

  try {
    const mediaContainer = latestResponse.locator(".attachment-container.generated-images, download-generated-image-button, img.loaded, generated-video, video").first();
    await mediaContainer.waitFor({ state: "attached", timeout: 60000 });
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_NO_CONTAINER);
  }

  await page.waitForTimeout(3000);
}

async function getBase64FromBlobUrl(page: Page, mediaElement: Locator): Promise<string | null> {
  try {
    const tagName = await mediaElement.evaluate((el: HTMLElement) => el.tagName.toLowerCase());

    let src = "";
    for (let i = 0; i < 30; i++) {
      src = await mediaElement.evaluate((el: any) => {
        let s = el.currentSrc || el.src || el.getAttribute("src");
        if (!s && el.tagName.toLowerCase() === "video") {
          const sourceEl = el.querySelector("source");
          if (sourceEl) s = sourceEl.src || sourceEl.getAttribute("src");
        }
        if (s && s.startsWith("/")) {
          s = window.location.origin + s;
        }
        return s || "";
      });
      if (src.startsWith("blob:") || src.startsWith("http") || src.startsWith("data:")) {
        break;
      }
      await page.waitForTimeout(500);
    }

    // Try native Playwright download first for robust extraction (especially for videos)
    try {
      const downloadBtn = mediaElement.locator('xpath=ancestor::model-response//*[@download] | ancestor::model-response//*[contains(@aria-label, "Download") or contains(@aria-label, "Tải xuống") or contains(@mattooltip, "Download") or contains(@mattooltip, "Tải xuống")]').first();
      await mediaElement.hover({ timeout: 2000 }).catch(() => { });
      if (await downloadBtn.waitFor({ state: "attached", timeout: 3000 }).then(() => true).catch(() => false)) {
        appLog("[Playwright] Found UI Download button, attempting native download...");
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 60000 }).catch(() => null),
          downloadBtn.click({ force: true })
        ]);

        if (download) {
          const downloadPath = await download.path();
          if (downloadPath) {
            
            const buffer = fs.readFileSync(downloadPath);
            if (buffer.length > 10 && buffer.toString('utf8', 0, 15).toLowerCase().includes('<!doctype')) {
              appLog("[Playwright] Native download returned HTML (Sign-in page?), falling back to extraction...");
            } else {
              appLog("[Playwright] Native download successful.");
              return buffer.toString("base64");
            }
          }
        } else {
          appLog("[Playwright] Native download timed out.");
        }
      }
    } catch (e) {
      appLog("[Playwright] Native download failed or button not found. Falling back to extraction...");
    }

    if (!src) {
      appError(BACKEND_MESSAGES.GEMINI_CHAT_NO_SRC);
      return null;
    }

    if (src.startsWith("data:")) {
      const parts = src.split(",");
      return parts[1] || null;
    }

    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACTING_MEDIA.replace("{0}", tagName).replace("{1}", src));

    if (src.startsWith("http")) {
      appLog("[Playwright] Found HTTP URL. Bypassing browser CORS using Playwright request API...");
      try {
        const response = await page.context().request.get(src, {
          headers: {
            "Referer": page.url()
          }
        });
        if (response.ok()) {
          const buffer = await response.body();
          appLog("[Playwright] Successfully downloaded media via Playwright request.");
          return buffer.toString("base64");
        } else {
          appLog(`[Playwright] Playwright request failed with status: ${response.status()}`);
        }
      } catch (err: any) {
        appLog("[Playwright] Playwright request failed: " + err.message + ". Falling back to browser evaluation...");
      }
    }

    if (tagName === "img") {
      const base64Data = await mediaElement.evaluate(async (imgEl) => {
        try {
          const img = imgEl as HTMLImageElement;
          if (!img.complete || img.naturalWidth === 0) {
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              setTimeout(reject, 15000);
            });
          }
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 800;
          canvas.height = img.naturalHeight || img.height || 800;
          const ctx = canvas.getContext("2d");
          if (!ctx) return "ERROR:Could not get canvas context";
          ctx.drawImage(img, 0, 0);
          return canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
        } catch (e: any) {
          try {
            const res = await fetch((imgEl as HTMLImageElement).src || imgEl.getAttribute("src") || "");
            const blob = await res.blob();
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve((reader.result as string).split(",")[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (fetchErr: any) {
            return "ERROR:" + fetchErr.message;
          }
        }
      });

      if (base64Data && !base64Data.startsWith("ERROR:")) {
        return base64Data;
      } else {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERROR.replace("{0}", base64Data || "Unknown error"));
        return null;
      }
    } else if (tagName === "video") {
      const base64Data = await mediaElement.evaluate(async (videoEl) => {
        try {
          let s = (videoEl as HTMLVideoElement).src || videoEl.getAttribute("src");
          if (!s) {
            const sourceEl = videoEl.querySelector("source");
            if (sourceEl) s = sourceEl.src || sourceEl.getAttribute("src");
          }
          const res = await fetch(s || "");
          const buffer = await res.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          // To avoid Maximum call stack size exceeded, chunk the string conversion
          const chunkSize = 8192;
          let binary = '';
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
          }
          return btoa(binary);
        } catch (err: any) {
          return "ERROR:" + err.message;
        }
      });

      if (base64Data && !base64Data.startsWith("ERROR:")) {
        return base64Data;
      } else {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERROR.replace("{0}", base64Data || "Unknown error"));
        return null;
      }
    }
  } catch (e: any) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERROR.replace("{0}", e.message));
  }
  return null;
}

async function waitForDownloadAndGetBase64(page: Page, visualConfig: any, initialResponseCount?: number): Promise<string | null> {
  await waitForGeminiFinished(page, 300000, initialResponseCount);

  const latestResponse = page.locator("model-response").last();
  await latestResponse.waitFor({ state: "visible", timeout: 60000 });

  if (initialResponseCount !== undefined) {
    const currentCount = await page.locator("model-response").count();
    if (currentCount <= initialResponseCount) {
      throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_PREVENT_OLD_IMAGE);
    }
  }

  const isVideo = visualConfig?.generateType === "video" || visualConfig?.generateType === GenerateType.Video;
  const mediaSelector = isVideo ? "video" : "img";
  const mediaLoc = latestResponse.locator(mediaSelector).first();
  await mediaLoc.waitFor({ state: "attached", timeout: 240000 });

  const base64 = await getBase64FromBlobUrl(page, mediaLoc);
  if (base64) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return base64;
  }

  throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
}


async function deleteGeminiActivity1Hour(page: Page) {
  try {
    appLog("[Gemini Chat] Đang dọn dẹp lịch sử hoạt động 1 giờ qua...");
    await page.goto("https://myactivity.google.com/product/gemini?utm_source=gemini", { waitUntil: "domcontentloaded", timeout: 60000 });

    // Đợi nút Xóa xuất hiện
    const deleteBtn = page.locator('div[jsaction="JIbuQc:GE6tde;"]').filter({ hasText: 'Xóa' }).first();
    await deleteBtn.waitFor({ state: "visible", timeout: 15000 });
    await deleteBtn.click();
    await page.waitForTimeout(1000);

    // Đợi menu xuất hiện và chọn "Một giờ qua"
    const oneHourOption = page.locator('span[jsname="K4r5Ff"]').filter({ hasText: 'Một giờ qua' }).first();
    await oneHourOption.waitFor({ state: "visible", timeout: 10000 });
    await oneHourOption.click();

    // Đợi một chút để Google xử lý xóa
    await page.waitForTimeout(4000);
    appLog("[Gemini Chat] Đã xóa lịch sử hoạt động 1 giờ qua thành công.");
  } catch (err: any) {
    appLog("[Gemini Chat] Bỏ qua lỗi khi xóa lịch sử hoạt động: " + err.message);
  }
}


export async function generateImageWithViettheoAPI(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const { prompt, style, visualConfig, referenceImage } = options;
  const isVideo = visualConfig?.generateType === 'video' || visualConfig?.generateType === 'Video' || (visualConfig?.generateType as any) === 'video';
  const type = isVideo ? 'VIDEO_GENERATION' : 'IMAGE_GENERATION';
  const model = visualConfig?.imageGeneratorEngine || 'VEO';

  const globalRefImages = visualConfig?.globalReferenceImages || [];
  const hasReference = Boolean(referenceImage || globalRefImages.length || visualConfig?.autoStartImage);
  const referenceLockInstruction = hasReference
    ? (isVideo
      ? "REFERENCE LOCK (MANDATORY): Use the supplied reference image(s) as the exact subject/component source. Preserve identity, face, age, body proportions, hairstyle, wardrobe, colors and visual style. Do not redesign or replace the referenced subject."
      : "REFERENCE LOCK (MANDATORY): Use the supplied reference image as the exact visual and character source. Preserve identity, face, age, body proportions, hairstyle, wardrobe, colors and visual style. Do not redesign or replace the referenced subject.")
    : "";
  const payload: any = {
    prompt: [referenceLockInstruction, style, prompt].filter(Boolean).join("\n\n"),
    config: {
      aspectRatio: visualConfig?.aspectRatio || '16:9',
    }
  };
  
  const autoStartImage = visualConfig?.autoStartImage;

  async function processBase64Image(base64: string): Promise<string> {
    if (!base64) return '';
    if (base64.startsWith('http')) return base64;
    // The UI persists only a lightweight local serving URL. Convert it back
    // to bytes here, immediately before the external image API needs it.
    const localPathMatch = base64.match(/\/api\/serve-local-file\?path=([^&]+)/i);
    if (localPathMatch) {
      const localPath = decodeURIComponent(localPathMatch[1]);
      if (!fs.existsSync(localPath)) throw new Error(`Reference image no longer exists: ${localPath}`);
      const extension = path.extname(localPath).slice(1).toLowerCase() || 'png';
      const mime = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : extension === 'webp' ? 'image/webp' : 'image/png';
      base64 = `data:${mime};base64,${fs.readFileSync(localPath).toString('base64')}`;
    }
    appLog('[Catbox] Uploading reference image to public URL...');
    const url = await uploadToCatbox(base64, 'reference.png');
    if (!url) throw new Error('Failed to upload reference image to public server.');
    return url;
  }

  if (isVideo) {
    let vq = visualConfig?.viettheoVideoQuality || 'HIGH';
    if ((visualConfig?.aspectRatio === '9:16' || visualConfig?.aspectRatio === '1:1') && !visualConfig?.viettheoVideoQuality) {
      vq = 'LITE';
    }
    payload.config.videoQuality = vq;
    payload.config.video_mode = visualConfig?.viettheoVideoMode || 'frame';

    if (globalRefImages.length > 1) {
      const urls = await Promise.all(globalRefImages.slice(0, 3).map((img: string) => processBase64Image(img)));
      payload.referenceimages = urls;
      payload.config.video_mode = 'component';
    } else if (referenceImage) {
      payload.startImage = await processBase64Image(referenceImage);
    } else if (globalRefImages.length > 0) {
      payload.startImage = await processBase64Image(globalRefImages[0]);
    } else if (autoStartImage) {
      payload.startImage = await processBase64Image(autoStartImage);
    }
  } else {
    const apiModel = model === 'NANO_BANANA_PRO' || model === 'NANO_BANANA' ? model : 'NANO_BANANA_PRO';
    payload.config.imageModel = apiModel;
    
    if (referenceImage) {
      payload.referenceImage = await processBase64Image(referenceImage);
    } else if (globalRefImages.length > 0) {
      payload.referenceImage = await processBase64Image(globalRefImages[0]);
    }
  }

  const headers = {
    'x-api-key': getViettheoApiKey(),
    'Content-Type': 'application/json'
  };

  appLog('[Viettheo API] Đang gửi yêu cầu tạo ' + (isVideo ? 'video' : 'ảnh') + '...');
  
  let createRes;
  try {
    const fetchRes = await fetch(VIETTHEO_BASE_URL + '/api/api-media?type=' + type, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    createRes = await readViettheoApiResponse(fetchRes);
  } catch (e: any) {
    throw new Error('Lỗi kết nối tới Viettheo API: ' + e.message);
  }

  if (!createRes.success) {
    throw new Error(createRes.message || 'Lỗi khởi tạo job trên Viettheo API');
  }

  const jobId = createRes.jobId;
  appLog('[Viettheo API] Tạo Job thành công! Job ID: ' + jobId + '. Bắt đầu Polling...');

  const statusUrl = VIETTHEO_BASE_URL + '/api/api-media/job/' + jobId;
  while (true) {
    if (isBatchCancelled) {
      throw new Error('Người dùng huỷ tiến trình');
    }
    
    await delayAsync(5000);
    
    let statusRes;
    try {
      const sFetchRes = await fetch(statusUrl, { headers });
      statusRes = await readViettheoApiResponse(sFetchRes);
    } catch(e) {
      appLog('[Viettheo API] Lỗi mạng khi kiểm tra trạng thái, thử lại sau...');
      continue;
    }
    
    if (statusRes.success) {
      const { status, progress } = statusRes.data;
      const resultData = statusRes.data?.resultData || statusRes.data;
      appLog('[Viettheo API] Job ' + jobId + ' - Trạng thái: ' + status + ' | Tiến độ: ' + progress + '%');

      if (status === 'SUCCEEDED') {
        appLog('[Viettheo API] DEBUG resultData: ' + JSON.stringify(resultData));
        let base64 = '';
        let fallbackUrl = '';
        
        if (resultData) {
          if (Array.isArray(resultData.images) && resultData.images.length > 0) {
            fallbackUrl = resultData.images[0].imageUrl || resultData.images[0].url || resultData.images[0].fileUrl || '';
          } else if (Array.isArray(resultData.videos) && resultData.videos.length > 0) {
            fallbackUrl = resultData.videos[0].videoUrl || resultData.videos[0].url || '';
          } else {
            for (const key of Object.keys(resultData)) {
              if (typeof resultData[key] === 'string' && resultData[key].startsWith('http')) {
                fallbackUrl = resultData[key];
                break;
              }
            }
          }
        }
        
        if (!isVideo && fallbackUrl) {
          try {
            appLog('[Viettheo API] Đang tải ảnh từ ' + fallbackUrl + ' để chuyển sang base64...');
            base64 = await fetchImageAsBase64(fallbackUrl);
          } catch(e) {
            console.error('Lỗi tải ảnh base64', e);
          }
        }
        
        appLog('[Viettheo API] Tạo thành công!');
        return { success: true, fallbackUrl, base64 };
      } else if (status === 'FAILED') {
        appLog('[Viettheo API] Thất bại với phản hồi: ' + JSON.stringify(statusRes));
        const errorMsg = statusRes.data?.errorMessage || statusRes.data?.message || 'Lỗi không xác định từ Viettheo API';
        throw new Error('API từ chối: ' + errorMsg);
      }
    } else {
      throw new Error(statusRes.message || 'Không thể lấy dữ liệu trạng thái Viettheo API.');
    }
  }
}

export async function generateBatchImagesWithViettheoAPI(items: BatchImageItem[], visualConfig: any, style?: string, onProgress?: (result: BatchImageResult) => void): Promise<BatchImageResult[]> {
  if (!items || items.length === 0) return [];
  const results: BatchImageResult[] = [];
  const concurrency = 1;
  
  appLog('[Viettheo API] Bắt đầu tạo hàng loạt ' + items.length + ' mục với concurrency = ' + concurrency);

  for (let i = 0; i < items.length; i += concurrency) {
    if (isBatchCancelled) break;
    const chunk = items.slice(i, i + concurrency);
    
    const chunkPromises = chunk.map(async (item) => {
      if (isBatchCancelled) return null;
      try {
        const res = await generateImageWithViettheoAPI({
          prompt: item.prompt,
          visualConfig,
          style,
          referenceImage: item.referenceImage || undefined,
        });
        const batchRes: BatchImageResult = {
          sceneId: item.sceneId,
          base64: res.base64 || '',
          fallbackUrl: res.fallbackUrl || '',
          success: true
        };
        if (onProgress) onProgress(batchRes);
        return batchRes;
      } catch (err: any) {
        const batchRes: BatchImageResult = {
          sceneId: item.sceneId,
          base64: '',
          success: false,
          warning: err.message
        };
        if (onProgress) onProgress(batchRes);
        return batchRes;
      }
    });
    
    const chunkResults = (await Promise.all(chunkPromises)).filter(r => r !== null) as BatchImageResult[];
    results.push(...chunkResults);
    
    if (i + concurrency < items.length && !isBatchCancelled) {
      await delayAsync(2000);
    }
  }
  
  return results;
}
