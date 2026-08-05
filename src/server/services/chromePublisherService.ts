import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { chromium } from "playwright";

export type ChromePublishRequest = {
  port: number;
  facebookPageUrl?: string;
  youtubeChannelId?: string;
  videoPath: string;
  thumbnailPath?: string;
  title?: string;
  description?: string;
  tags?: string[];
  scheduledPublishAt?: string;
  autoSubmit?: boolean;
  headless?: boolean;
  closeWhenDone?: boolean;
};

export type ChromePublishResult = {
  state: "prepared" | "scheduled" | "published";
  pageUrl: string;
  detail: string;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function closePublisherFileDialog(port: number): Promise<void> {
  if (process.platform !== "win32") return;
  const script = [
    "$signature='[DllImport(\"user32.dll\")] public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr extraData);",
    "[DllImport(\"user32.dll\", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr handle, StringBuilder text, int count);",
    "[DllImport(\"user32.dll\")] public static extern int GetWindowTextLength(IntPtr handle);",
    "[DllImport(\"user32.dll\")] public static extern uint GetWindowThreadProcessId(IntPtr handle, out uint processId);",
    "[DllImport(\"user32.dll\")] public static extern IntPtr SendMessage(IntPtr handle, uint message, IntPtr wParam, IntPtr lParam);",
    "public delegate bool EnumWindowsProc(IntPtr handle, IntPtr extraData);';",
    "Add-Type -MemberDefinition $signature -Name VidiFlowDialog -Namespace Native -UsingNamespace System.Text;",
    `$port=${port};`,
    "$callback=[Native.VidiFlowDialog+EnumWindowsProc]{ param($handle,$extraData)",
    "$length=[Native.VidiFlowDialog]::GetWindowTextLength($handle);",
    "if($length -le 0){ return $true };",
    "$title=New-Object Text.StringBuilder ($length+1);",
    "[void][Native.VidiFlowDialog]::GetWindowText($handle,$title,$title.Capacity);",
    "if($title.ToString() -notmatch '^(Open|Mở)$'){ return $true };",
    "[uint32]$processIdValue=0;",
    "[void][Native.VidiFlowDialog]::GetWindowThreadProcessId($handle,[ref]$processIdValue);",
    // Querying Win32_Process.CommandLine can be denied on customer machines,
    // which previously left Chrome's native file dialog open forever. The
    // dialog itself already belongs to a chrome.exe process, which is a safe
    // and sufficient ownership check for the dialog this upload just opened.
    "$process=Get-Process -Id $processIdValue -ErrorAction SilentlyContinue;",
    "if($process -and $process.ProcessName -eq 'chrome'){",
    "[void][Native.VidiFlowDialog]::SendMessage($handle,0x0010,[IntPtr]::Zero,[IntPtr]::Zero);",
    "}; return $true };",
    "[void][Native.VidiFlowDialog]::EnumWindows($callback,[IntPtr]::Zero);",
  ].join(" ");
  await new Promise<void>(resolve => {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script],
      { windowsHide: true, stdio: "ignore" },
    );
    const finish = () => resolve();
    child.once("exit", finish);
    child.once("error", finish);
    setTimeout(() => {
      try { child.kill(); } catch { /* Best-effort dialog cleanup only. */ }
      resolve();
    }, 5_000);
  });
}

async function isChromeDebugPortReady(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`, {
      signal: AbortSignal.timeout(1_500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const headlessPublisherPorts = new Set<number>();

async function closePublisherChrome(port: number): Promise<void> {
  if (!(await isChromeDebugPortReady(port))) {
    headlessPublisherPorts.delete(port);
    return;
  }
  try {
    const attached = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 8_000 });
    await attached.close();
  } catch {
    // The browser may have already exited after a successful publish.
  } finally {
    headlessPublisherPorts.delete(port);
  }
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!(await isChromeDebugPortReady(port))) return;
    await sleep(250);
  }
}

async function ensurePublisherChrome(port: number, facebookPageUrl: string, headless = false): Promise<void> {
  if (await isChromeDebugPortReady(port)) {
    if (!headless || headlessPublisherPorts.has(port)) return;
    // Login/setup Chrome is intentionally visible. At publish time close that
    // dedicated Publisher window and reopen the same persistent profile in
    // headless mode; cookies and channel sessions remain on disk.
    await closePublisherChrome(port);
  }
  const chromeCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
  ];
  const chromePath = chromeCandidates.find(candidate => fs.existsSync(candidate));
  if (!chromePath) throw new Error("GOOGLE_CHROME_NOT_FOUND");
  const profilePath = path.join(
    process.env.LOCALAPPDATA || os.homedir(),
    "VidiFlow OneClick",
    `Chrome Publisher ${port}`,
  );
  fs.mkdirSync(profilePath, { recursive: true });
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    ...(headless
      ? ["--headless=new", "--disable-gpu", "--window-size=1920,1080"]
      : ["--new-window", "--start-maximized"]),
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-mode",
    facebookPageUrl,
  ], { detached: true, stdio: "ignore", windowsHide: headless });
  chrome.unref();
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isChromeDebugPortReady(port)) {
      if (headless) headlessPublisherPorts.add(port);
      return;
    }
    await sleep(500);
  }
  throw new Error("CHROME_PROFILE_NOT_CONNECTED");
}

async function firstVisible<T>(items: Array<() => Promise<T>>): Promise<T | null> {
  for (const item of items) {
    try { return await item(); } catch { /* Try the next UI variant. */ }
  }
  return null;
}

async function navigateWithRetry(page: any, url: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.bringToFront();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!/ERR_CONNECTION_CLOSED|ERR_CONNECTION_RESET|ERR_NETWORK_CHANGED|Timeout/i.test(message) || attempt === 3) throw error;
      await sleep(attempt * 1_500);
    }
  }
  throw lastError;
}

export async function prepareChromePublish(
  platform: "youtube" | "facebook" | "tiktok",
  request: ChromePublishRequest,
): Promise<ChromePublishResult> {
  if (platform === "facebook") return prepareFacebookChromePublish(request);
  if (!fs.existsSync(request.videoPath)) throw new Error("VIDEO_FILE_NOT_FOUND");
  if (!Number.isInteger(request.port) || request.port < 1024 || request.port > 65535) throw new Error("CHROME_PROFILE_PORT_INVALID");

  const uploadUrl = platform === "youtube"
    ? "https://studio.youtube.com/"
    : "https://www.tiktok.com/tiktokstudio/upload";
  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;
  let publishCompleted = false;
  try {
    await ensurePublisherChrome(request.port, uploadUrl, request.headless === true);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${request.port}`, { timeout: 12_000 });
    const context = browser.contexts()[0];
    if (!context) throw new Error("CHROME_PROFILE_NOT_READY");
    // Always prepare a fresh Studio tab for a new upload. Reusing an old tab
    // is unsafe because YouTube can close/replace the upload page after a
    // completed or cancelled dialog, leaving Playwright with a stale target.
    // The new tab still belongs to the same persistent Chrome profile, so the
    // signed-in channel/session is preserved.
    const page = await context.newPage();
    const requestedChannelId = String(request.youtubeChannelId || "").trim();
    const activeChannelId = platform === "youtube"
      ? (requestedChannelId || page.url().match(/studio\.youtube\.com\/channel\/([^/?#]+)/i)?.[1])
      : undefined;
    const targetUploadUrl = activeChannelId
      ? `https://studio.youtube.com/channel/${activeChannelId}/videos/upload?d=ud`
      : uploadUrl;
    await navigateWithRetry(page, targetUploadUrl);
    await sleep(1_500);

    if (/accounts\.google\.com|youtube\.com\/signin/i.test(page.url())) throw new Error("YOUTUBE_LOGIN_REQUIRED");
    if (/tiktok\.com\/login/i.test(page.url())) throw new Error("TIKTOK_LOGIN_REQUIRED");

    let uploadError: unknown;
    let uploadAccepted = false;
    for (let uploadAttempt = 1; uploadAttempt <= 3 && !uploadAccepted; uploadAttempt += 1) {
      const fileInput = await firstVisible([
        async () => { const item = page.locator('input[type="file"][accept*="video"]').first(); await item.waitFor({ state: "attached", timeout: 30_000 }); return item; },
        async () => { const item = page.locator('input[name="Filedata"][type="file"]').first(); await item.waitFor({ state: "attached", timeout: 30_000 }); return item; },
        async () => { const item = page.locator('input[type="file"]').first(); await item.waitFor({ state: "attached", timeout: 30_000 }); return item; },
      ]);
      if (!fileInput) {
        uploadError = new Error(platform === "youtube" ? "YOUTUBE_UPLOAD_INPUT_NOT_FOUND" : "TIKTOK_UPLOAD_INPUT_NOT_FOUND");
      } else {
        try {
          // A 30-second action timeout is too short for larger MP4 files on
          // slower customer disks/Chrome sessions. Give the browser enough
          // time to accept the file before deciding that the attempt failed.
          await (fileInput as any).setInputFiles(request.videoPath, { timeout: 120_000 });
          uploadAccepted = true;
        } catch (error) {
          uploadError = error;
          // Playwright can time out after Chrome has already accepted the
          // file. The upload-details editor is authoritative in that case;
          // never attach the same video a second time when it is already open.
          const acceptedByUi = platform === "youtube"
            ? await page.locator('#textbox[contenteditable="true"]').first().isVisible().catch(() => false)
            : await page.locator('[contenteditable="true"][role="textbox"], textarea').first().isVisible().catch(() => false);
          if (acceptedByUi) {
            uploadAccepted = true;
            break;
          }
        }
      }
      if (!uploadAccepted && uploadAttempt < 3) {
        await sleep(uploadAttempt * 2_000);
        await navigateWithRetry(page, targetUploadUrl);
        await sleep(1_500);
      }
    }
    if (!uploadAccepted) {
      const message = uploadError instanceof Error ? uploadError.message : String(uploadError || "UPLOAD_FAILED");
      throw new Error(`${platform === "youtube" ? "YOUTUBE" : "TIKTOK"}_UPLOAD_FILE_RETRIES_EXHAUSTED: ${message}`);
    }

    const title = String(request.title || "").trim();
    const description = String(request.description || "").trim();
    if (platform === "youtube") {
      const editors = page.locator('#textbox[contenteditable="true"]');
      await editors.first().waitFor({ state: "visible", timeout: 30_000 });
      if (title) await editors.nth(0).fill(title.slice(0, 100));
      if (description) await editors.nth(1).fill(description.slice(0, 5_000));
      if (request.thumbnailPath && fs.existsSync(request.thumbnailPath)) {
        const thumbnailInput = page.locator('input[type="file"][accept*="image"]').first();
        if (await thumbnailInput.count()) await thumbnailInput.setInputFiles(request.thumbnailPath, { timeout: 20_000 });
      }
      const notForKids = await firstVisible([
        async () => { const item = page.locator('[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]'); await item.waitFor({ state: "visible", timeout: 15_000 }); await item.click(); return true; },
        async () => { const item = page.getByText(/Không, nội dung này không dành cho trẻ em|No, it's not made for kids/i); await item.waitFor({ state: "visible", timeout: 15_000 }); await item.click(); return true; },
      ]);
      if (!notForKids) throw new Error("YOUTUBE_AUDIENCE_NOT_FOR_KIDS_NOT_FOUND");
      const tags = (Array.isArray(request.tags) ? request.tags : []).map(item => String(item).trim()).filter(Boolean).slice(0, 30);
      if (tags.length) {
        await firstVisible([
          async () => { const item = page.locator('ytcp-button#toggle-button'); await item.click({ timeout: 10_000 }); return true; },
          async () => { const item = page.getByRole("button", { name: /Show more|Hiển thị thêm|Hiện thêm/i }); await item.click({ timeout: 10_000 }); return true; },
          async () => { const item = page.getByText(/Show more|Hiển thị thêm|Hiện thêm/i); await item.click({ timeout: 10_000 }); return true; },
        ]);
        const tagsInput = await firstVisible([
          async () => { const item = page.locator('ytcp-form-input-container#tags-container input, #tags-container input, #tags-container #text-input'); await item.waitFor({ state: "visible", timeout: 12_000 }); return item; },
          async () => { const item = page.locator('input[aria-label*="Tags"], input[aria-label*="Thẻ"]'); await item.waitFor({ state: "visible", timeout: 12_000 }); return item; },
        ]);
        if (!tagsInput) throw new Error("YOUTUBE_TAGS_INPUT_NOT_FOUND");
        await (tagsInput as any).fill(tags.join(", ").slice(0, 500));
      }
      if (request.autoSubmit) {
        for (let step = 0; step < 3; step += 1) {
          const next = page.getByRole("button", { name: /^(Next|Tiếp)$/i }).last();
          await next.waitFor({ state: "visible", timeout: 90_000 });
          while (await next.isDisabled().catch(() => true)) await sleep(1_000);
          await next.click();
          await sleep(700);
        }
        const scheduledAt = request.scheduledPublishAt ? new Date(request.scheduledPublishAt) : null;
        if (scheduledAt && Number.isFinite(scheduledAt.getTime()) && scheduledAt.getTime() > Date.now() + 60_000) {
          const scheduleSelected = await firstVisible([
            async () => { const item = page.locator('ytcp-icon-button#second-container-expand-button'); await item.waitFor({ state: "visible", timeout: 8_000 }); await item.click({ timeout: 10_000 }); return true; },
            async () => { const item = page.locator('ytcp-text-dropdown-trigger#datepicker-trigger'); await item.waitFor({ state: "visible", timeout: 8_000 }); return true; },
          ]);
          if (!scheduleSelected) throw new Error("YOUTUBE_SCHEDULE_OPTION_NOT_FOUND");
          const pad = (value: number) => String(value).padStart(2, "0");
          const dateValue = `${pad(scheduledAt.getDate())}/${pad(scheduledAt.getMonth() + 1)}/${scheduledAt.getFullYear()}`;
          const timeValue = `${pad(scheduledAt.getHours())}:${pad(scheduledAt.getMinutes())}`;
          const dateTrigger = page.locator('ytcp-text-dropdown-trigger#datepicker-trigger');
          await dateTrigger.waitFor({ state: "visible", timeout: 12_000 });
          await dateTrigger.click({ timeout: 10_000 });
          const dateInput = page.locator('ytcp-date-picker tp-yt-iron-input#input-2 input, ytcp-date-picker input').last();
          await dateInput.waitFor({ state: "visible", timeout: 12_000 });
          const currentDateValue = await dateInput.inputValue().catch(() => "");
          const localizedDateValue = /thg/i.test(currentDateValue)
            ? `${scheduledAt.getDate()} thg ${scheduledAt.getMonth() + 1}, ${scheduledAt.getFullYear()}`
            : dateValue;
          const timeInput = await firstVisible([
            async () => { const item = page.locator('tp-yt-iron-input#input-1 input'); await item.waitFor({ state: "visible", timeout: 12_000 }); return item; },
            async () => { const item = page.locator('input[aria-label*="time" i], input[aria-label*="giờ" i]'); await item.waitFor({ state: "visible", timeout: 12_000 }); return item; },
          ]);
          if (!dateInput || !timeInput) throw new Error("YOUTUBE_SCHEDULE_DATETIME_INPUT_NOT_FOUND");
          await dateInput.fill(localizedDateValue);
          await dateInput.press("Enter");
          await (timeInput as any).fill(timeValue);
          const scheduleButton = await firstVisible([
            async () => { const item = page.locator('ytcp-button#done-button'); await item.waitFor({ state: "visible", timeout: 15_000 }); return item; },
            async () => { const item = page.getByRole("button", { name: /^(Schedule|Lên lịch)$/i }); await item.waitFor({ state: "visible", timeout: 15_000 }); return item; },
          ]);
          if (!scheduleButton) throw new Error("YOUTUBE_SCHEDULE_BUTTON_NOT_FOUND");
          await (scheduleButton as any).click({ timeout: 20_000 });
          const scheduleConfirmed = await firstVisible([
            async () => { const item = page.getByText(/Video scheduled|Video đã được lên lịch|Đã lên lịch/i); await item.waitFor({ state: "visible", timeout: 45_000 }); return true; },
            async () => { const item = page.locator('ytcp-uploads-dialog'); await item.waitFor({ state: "hidden", timeout: 45_000 }); return true; },
          ]);
          if (!scheduleConfirmed) throw new Error("YOUTUBE_SCHEDULE_NOT_CONFIRMED");
          publishCompleted = true;
          return { state: "scheduled", pageUrl: page.url(), detail: `YouTube Studio đã nhận lịch đăng lúc ${dateValue} ${timeValue}.` };
        }
        // The real visibility controls are collapsed on YouTube's current UI.
        // Text matching alone can hit the explanatory copy and leave the
        // Schedule panel selected, so target the stable PUBLIC radio control.
        const publicRadio = page.locator('tp-yt-paper-radio-button[name="PUBLIC"]');
        if (!(await publicRadio.isVisible().catch(() => false))) {
          await page.locator('ytcp-icon-button#first-container-expand-button').click({ timeout: 15_000 });
        }
        await publicRadio.waitFor({ state: "visible", timeout: 15_000 });
        await publicRadio.click({ timeout: 15_000 });
        const done = page.locator('ytcp-button#done-button');
        await done.waitFor({ state: "visible", timeout: 30_000 });
        const publishDeadline = Date.now() + 120_000;
        while (await done.getAttribute("aria-disabled") === "true") {
          if (Date.now() >= publishDeadline) throw new Error("YOUTUBE_PUBLISH_BUTTON_DISABLED_TIMEOUT");
          await sleep(1_000);
        }
        await done.click({ timeout: 30_000 });
        await page.locator('ytcp-uploads-dialog').waitFor({ state: "hidden", timeout: 90_000 });
        publishCompleted = true;
        return { state: "published", pageUrl: page.url(), detail: "YouTube Studio đã nhận lệnh đăng video bằng Chrome." };
      }
      await page.bringToFront();
      return { state: "prepared", pageUrl: page.url(), detail: "Video, tiêu đề, mô tả, thumbnail, từ khóa SEO và lựa chọn Không dành cho trẻ em đã được nạp vào YouTube Studio." };
    }

    const caption = [title, description].filter(Boolean).join("\n\n").trim();
    if (caption) {
      const captionInput = await firstVisible([
        async () => { const item = page.locator('[contenteditable="true"][role="textbox"]').first(); await item.waitFor({ state: "visible", timeout: 20_000 }); return item; },
        async () => { const item = page.locator('textarea').first(); await item.waitFor({ state: "visible", timeout: 20_000 }); return item; },
      ]);
      if (!captionInput) throw new Error("TIKTOK_CAPTION_INPUT_NOT_FOUND");
      await (captionInput as any).fill(caption.slice(0, 2_200));
    }
    if (request.autoSubmit) {
      const post = page.getByRole("button", { name: /^(Post|Đăng)$/i }).last();
      await post.waitFor({ state: "visible", timeout: 120_000 });
      while (await post.isDisabled().catch(() => true)) await sleep(1_000);
      await post.click({ timeout: 20_000 });
      publishCompleted = true;
      return { state: "published", pageUrl: page.url(), detail: "TikTok Studio đã nhận lệnh đăng video bằng Chrome." };
    }
    await page.bringToFront();
    return { state: "prepared", pageUrl: page.url(), detail: "Video và nội dung đã được nạp vào TikTok Studio." };
  } catch (error: any) {
    const message = String(error?.message || "CHROME_PUBLISH_PREPARE_FAILED");
    if (/ECONNREFUSED|connectOverCDP|Target page, context or browser has been closed/i.test(message)) throw new Error("CHROME_PROFILE_NOT_CONNECTED");
    throw new Error(message);
  } finally {
    if (request.closeWhenDone && request.autoSubmit && publishCompleted) {
      try { await browser?.close(); } catch { /* Browser may already be closed. */ }
      headlessPublisherPorts.delete(request.port);
    } else {
      try { (browser as any)?._connection?.close(); } catch { /* Keep Chrome for login/debug on failure. */ }
    }
    browser = undefined;
  }
}

/**
 * Prepares a Facebook upload in the dedicated signed-in Publisher Chrome.
 * The final Publish button is clicked only when autoSubmit is explicitly set.
 */
export async function prepareFacebookChromePublish(request: ChromePublishRequest): Promise<ChromePublishResult> {
  if (!fs.existsSync(request.videoPath)) throw new Error("VIDEO_FILE_NOT_FOUND");
  if (request.thumbnailPath && !fs.existsSync(request.thumbnailPath)) throw new Error("THUMBNAIL_FILE_NOT_FOUND");
  if (!/^https:\/\/(www\.)?facebook\.com\//i.test(String(request.facebookPageUrl || ""))) throw new Error("FACEBOOK_PAGE_REQUIRED");
  if (!Number.isInteger(request.port) || request.port < 1024 || request.port > 65535) throw new Error("CHROME_PROFILE_PORT_INVALID");

  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;
  let publishCompleted = false;
  try {
    await ensurePublisherChrome(request.port, request.facebookPageUrl!, request.headless === true);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${request.port}`, { timeout: 12_000 });
    const context = browser.contexts()[0];
    if (!context) throw new Error("CHROME_PROFILE_NOT_READY");
    // Use a fresh tab for every upload. Reusing an unrelated YouTube/Facebook
    // tab can carry stale dialogs and makes one publisher disturb another.
    const page = await context.newPage();

    // A failed/aborted previous upload can leave Facebook's unsaved-composer
    // confirmation on screen. Discard that stale draft before starting the
    // scheduled retry, otherwise every locator below is blocked by the dialog.
    await firstVisible([
      async () => {
        const item = page.getByRole("button", { name: /^(Rời khỏi Trang|Leave Page|Discard)$/i }).last();
        await item.click({ timeout: 2_500 });
        await sleep(750);
        return true;
      },
      async () => {
        const item = page.getByText(/^(Rời khỏi Trang|Leave Page|Discard)$/i).last();
        await item.click({ timeout: 2_500 });
        await sleep(750);
        return true;
      },
    ]);

    // Navigate to the exact Page link saved for this job first.
    await navigateWithRetry(page, request.facebookPageUrl!);
    await sleep(1_200);
    // Facebook may show the stale-draft confirmation only after navigation
    // has been requested. Clear it here as well; otherwise it intercepts every
    // composer click and makes an automatic retry appear to hang.
    await firstVisible([
      async () => {
        const item = page.getByRole("button", { name: /^(Rời khỏi Trang|Leave Page|Discard)$/i }).last();
        await item.click({ timeout: 3_500 });
        await sleep(900);
        return true;
      },
      async () => {
        const item = page.getByText(/^(Rời khỏi Trang|Leave Page|Discard)$/i).last();
        await item.click({ timeout: 3_500 });
        await sleep(900);
        return true;
      },
    ]);
    if (/facebook\.com\/login/i.test(page.url())) throw new Error("FACEBOOK_LOGIN_REQUIRED");

    // New Pages Experience can explicitly ask to switch into the Page identity.
    const switchedToPage = await firstVisible([
      async () => {
        const panel = page.locator('div').filter({ hasText: /Chuyển sang Trang của|Switch into the Page/i });
        const item = panel.getByRole("button", { name: /^(Chuyển|Switch)$/i }).last();
        await item.click({ timeout: 5_000 });
        return true;
      },
      async () => { const item = page.getByRole("button", { name: /^(Chuyển|Switch)$/i }).last(); await item.click({ timeout: 4_000 }); return true; },
      async () => { const item = page.getByRole("button", { name: /chuyển ngay|chuyển sang|switch now|switch into/i }).first(); await item.click({ timeout: 3_000 }); return true; },
      async () => { const item = page.getByText(/chuyển ngay|chuyển sang trang|switch now|switch into this page/i).first(); await item.click({ timeout: 3_000 }); return true; },
    ]);
    if (switchedToPage) {
      // Facebook opens a second confirmation dialog after the first Page switch
      // action. Confirm it before looking for the Page composer.
      await sleep(1_200);
      await firstVisible([
        async () => {
          const item = page.locator('[role="button"][aria-label="Chuyển"], [role="button"][aria-label="Switch"]').last();
          await item.click({ timeout: 5_000 });
          return true;
        },
        async () => {
          const item = page.getByRole("button", { name: /^(Chuyển|Switch)$/i }).last();
          await item.click({ timeout: 5_000 });
          return true;
        },
      ]);
      await page.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => undefined);
      await sleep(4_000);
    }

    let composerOpened = await firstVisible([
      async () => { const item = page.getByRole("button", { name: /ảnh\/video|photo\/video|reel/i }).first(); await item.click({ timeout: 5_000 }); return true; },
      async () => { const item = page.locator('div[role="button"]').filter({ hasText: /Ảnh\/video|Photo\/video|Tạo thước phim|Create reel/i }).first(); await item.click({ timeout: 5_000 }); return true; },
      async () => { const item = page.locator('[aria-label*="Photo/video"], [aria-label*="Ảnh/video"], [aria-label*="Reel"], [aria-label*="Thước phim"]').first(); await item.click({ timeout: 5_000 }); return true; },
      async () => { const item = page.getByText(/tạo thước phim|create reel|ảnh\/video|photo\/video/i).first(); await item.click({ timeout: 5_000 }); return true; },
    ]);
    if (!composerOpened) throw new Error("FACEBOOK_COMPOSER_NOT_FOUND");

    const fileInput = await firstVisible([
      async () => { const item = page.locator('input[type="file"][accept*="video"]').last(); await item.waitFor({ state: "attached", timeout: 15_000 }); return item; },
      async () => { const item = page.locator('input[type="file"]').last(); await item.waitFor({ state: "attached", timeout: 15_000 }); return item; },
      async () => { const item = page.getByLabel(/ảnh\/video|photo\/video|tải lên|upload/i).locator('input[type="file"]').last(); await item.waitFor({ state: "attached", timeout: 12_000 }); return item; },
    ]);
    if (!fileInput) throw new Error("FACEBOOK_UPLOAD_INPUT_NOT_FOUND");
    // Large rendered MP4 files can take much longer than Playwright's default
    // action timeout to be transferred to the visible Chrome session.
    await fileInput.setInputFiles(request.videoPath, { timeout: 120_000 });

    const caption = [request.title, request.description].filter(Boolean).join("\n\n").trim();
    if (caption) {
      const captionFilled = await firstVisible([
        async () => {
          const dialog = page.getByRole("dialog").last();
          const item = dialog.locator('[contenteditable="true"][role="textbox"]').last();
          await item.waitFor({ state: "visible", timeout: 10_000 });
          await item.fill(caption, { timeout: 10_000 });
          return (await item.innerText()).includes(caption);
        },
        async () => {
          const item = page.locator('[contenteditable="true"][role="textbox"]').last();
          await item.waitFor({ state: "visible", timeout: 10_000 });
          await item.fill(caption, { timeout: 10_000 });
          return (await item.innerText()).includes(caption);
        },
        async () => {
          const item = page.locator('textarea').last();
          await item.waitFor({ state: "visible", timeout: 10_000 });
          await item.fill(caption, { timeout: 10_000 });
          return (await item.inputValue()).includes(caption);
        },
      ]);
      if (!captionFilled) throw new Error("FACEBOOK_CAPTION_INPUT_NOT_FOUND");
    }

    let thumbnailSelected = false;
    if (request.thumbnailPath) {
      const thumbnailButton = await firstVisible([
        async () => {
          const item = page.locator('[role="button"]').filter({ hasText: /Ch\u1ecdn h\u00ecnh thu nh\u1ecf|Choose thumbnail/i }).last();
          await item.waitFor({ state: "visible", timeout: 8_000 });
          return item;
        },
        async () => {
          const item = page.getByText(/Ch\u1ecdn h\u00ecnh thu nh\u1ecf|Choose thumbnail/i, { exact: true }).last();
          await item.waitFor({ state: "visible", timeout: 8_000 });
          return item;
        },
      ]);
      if (thumbnailButton) {
        // Depending on the Page/composer variant this control either opens an
        // inline editor or a native Windows picker. Close the native picker
        // immediately; Playwright will attach the file to its real input.
        await thumbnailButton.click({ timeout: 10_000 });
        await sleep(500);
        await closePublisherFileDialog(request.port);
        const thumbnailInput = page
          .locator('input[type="file"][accept=".png,.jpg,.jpeg"]')
          .last();
        const hasThumbnailInput = await thumbnailInput
          .waitFor({ state: "attached", timeout: 15_000 })
          .then(() => true)
          .catch(() => false);
        if (hasThumbnailInput) {
          await thumbnailInput.setInputFiles(request.thumbnailPath, { timeout: 60_000 });
          await closePublisherFileDialog(request.port);
          await sleep(2_000);

          await firstVisible([
            async () => {
              const dialog = page.getByRole("dialog").last();
              const item = dialog.getByRole("button", { name: /^(L\u01b0u|Save)$/i }).last();
              await item.click({ timeout: 10_000 });
              return true;
            },
            async () => {
              const item = page.getByRole("button", { name: /^(L\u01b0u|Save)$/i }).last();
              await item.click({ timeout: 10_000 });
              return true;
            },
          ]);
          // Some Facebook variants save the uploaded image immediately and
          // close this dialog, so the Save button can legitimately disappear.
          thumbnailSelected = true;
          await sleep(1_500);
        }
      }
    }

    await page.bringToFront();

    if (request.autoSubmit) {
      // Use Unicode escapes so this matcher remains stable when the TypeScript
      // source is copied/bundled on Windows with a different console code page.
      // A single locator also avoids waiting 180 seconds twice in sequence.
      const publishButton = page
        .getByRole("button", { name: /^(\u0110\u0103ng|Post|Publish)$/i })
        .last();
      await publishButton.waitFor({ state: "visible", timeout: 180_000 })
        .catch(() => { throw new Error("FACEBOOK_PUBLISH_BUTTON_NOT_FOUND"); });
      const submitDeadline = Date.now() + 180_000;
      while (await publishButton.isDisabled().catch(() => true)) {
        if (Date.now() >= submitDeadline) throw new Error("FACEBOOK_VIDEO_PROCESSING_TIMEOUT");
        await sleep(1_500);
      }
      await publishButton.click({ timeout: 15_000 });
      const confirmation = await firstVisible([
        async () => {
          const item = page.getByText(/\u0110\u00e3 chia s\u1ebb B\u00e0i vi\u1ebft c\u1ee7a b\u1ea1n|Your post was shared/i).last();
          await item.waitFor({ state: "visible", timeout: 90_000 });
          return true;
        },
        async () => {
          const item = page.getByText(/B\u00e0i vi\u1ebft c\u1ee7a b\u1ea1n \u0111ang \u0111\u01b0\u1ee3c x\u1eed l\u00fd|Your post is being processed/i).last();
          await item.waitFor({ state: "visible", timeout: 90_000 });
          return true;
        },
      ]);
      if (!confirmation) throw new Error("FACEBOOK_PUBLISH_NOT_CONFIRMED");
      publishCompleted = true;
      return {
        state: "published",
        pageUrl: page.url(),
        detail: thumbnailSelected
          ? "Facebook đã xác nhận đăng video và Thumbnail thành công."
          : "Facebook đã xác nhận đăng video thành công.",
      };
    }

    return {
      state: "prepared",
      pageUrl: page.url(),
      detail: thumbnailSelected
        ? "Video và ảnh Thumbnail đã được nạp vào Chrome. Hãy kiểm tra đúng Page, nội dung và quyền riêng tư rồi bấm Đăng trên Facebook."
        : "Video đã được nạp vào Chrome. Hãy kiểm tra đúng Page, nội dung và quyền riêng tư rồi bấm Đăng trên Facebook.",
    };
  } catch (error: any) {
    const message = String(error?.message || "CHROME_PUBLISH_PREPARE_FAILED");
    if (/ECONNREFUSED|connectOverCDP|Target page, context or browser has been closed/i.test(message)) throw new Error("CHROME_PROFILE_NOT_CONNECTED");
    throw new Error(message);
  } finally {
    // Detach only Playwright's client connection. browser.close() would close
    // the real Publisher Chrome; keeping old CDP sessions alive, however, can
    // make Facebook dialogs race and leave the visible window unresponsive.
    if (request.closeWhenDone && request.autoSubmit && publishCompleted) {
      try { await browser?.close(); } catch { /* Browser may already be closed. */ }
      headlessPublisherPorts.delete(request.port);
    } else {
      try { (browser as any)?._connection?.close(); } catch { /* Keep Chrome for login/debug on failure. */ }
    }
    browser = undefined;
  }
}
