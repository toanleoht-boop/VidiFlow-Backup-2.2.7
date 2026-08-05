import fs from "fs";
import { Page } from "playwright";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { EXTERNAL_URLS } from "../../constants";
import { appLog, appError } from "../../lib/logger.js";
import _ from 'lodash';
import { exec, spawn } from "child_process";
import os from "os";
import path from "path";
import { AsyncLocalStorage } from 'async_hooks';

chromium.use(stealthPlugin());

export const globalPlaywrightPages = new Map<number, Page>();
export const globalBearerTokens = new Map<number, string>();
// Keep ownership separate from CDP connections that were already opened by
// the user. Only Chrome instances started as a fallback by this app may be
// closed automatically after a batch finishes.
const autoLaunchedChromePorts = new Set<number>();
// A CDP port can belong to a visible Chrome that the user opened manually.
// Keep this separate from tool-owned hidden Chrome: the two cannot safely
// share the same profile process on Windows.
const autoLaunchedHeadlessChromePorts = new Set<number>();
export const portContext = new AsyncLocalStorage<number>();
// Batch workers can share one Chrome profile while using different tabs.  The
// tab context keeps helper calls scoped to the worker that owns the prompt.
export const pageContext = new AsyncLocalStorage<Page>();

/** Mark a Chrome profile that was launched from VidiFlow's settings UI.
 * It has the same disposable profile convention as an automation fallback,
 * so it must be cleaned up when the run finishes instead of accumulating
 * background Chrome processes. */
export function registerToolLaunchedChrome(port: number, headless = false): void {
  autoLaunchedChromePorts.add(port);
  if (headless) autoLaunchedHeadlessChromePorts.add(port);
  else autoLaunchedHeadlessChromePorts.delete(port);
}

export function getPlaywrightPage(): Page | null {
  const workerPage = pageContext.getStore();
  if (workerPage && !workerPage.isClosed()) return workerPage;
  const port = portContext.getStore() || 9222;
  return globalPlaywrightPages.get(port) || null;
}

export const ensureDirectoryExists = (dir: string): void => {
  if (_.eq(fs.existsSync(dir), false)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export async function initPlaywright(headless: boolean = false, mode: string = "google_labs", port?: number) {
  const currentPort = port || portContext.getStore() || 9222;
  const existingPage = globalPlaywrightPages.get(currentPort);
  if (existingPage && !existingPage.isClosed()) {
    const isToolOwned = autoLaunchedChromePorts.has(currentPort);
    const isCurrentlyHeadless = autoLaunchedHeadlessChromePorts.has(currentPort);
    if (isToolOwned && isCurrentlyHeadless !== headless) {
      // Apply the newest choice from the UI for a tool-owned Chrome.
      // This is required when a user changes between visible and hidden mode.
      await closePlaywrightBrowser(currentPort);
      autoLaunchedChromePorts.delete(currentPort);
      autoLaunchedHeadlessChromePorts.delete(currentPort);
    }
    // Reuse a signed-in Chrome already listening on this port. Blocking it here
    // made the automatic pipeline stop before media generation.
    try {
      await existingPage.evaluate("1");
      return;
    } catch (e) {
      globalPlaywrightPages.delete(currentPort);
    }
  }

  try {
    appLog(`PLAYWRIGHT_CONNECTING (Port: ${currentPort})`);
    let browser: any;
    let connectedToExistingChrome = false;
    try {
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${currentPort}`);
      connectedToExistingChrome = true;
    } catch (e) {
      // Chrome is not running at this port; start a tool-owned instance below.
    }

    // Detect headless mode through Chrome's own CDP endpoint. This survives a
    // server restart, unlike the in-memory ownership set.
    let existingChromeIsHeadless = false;
    if (connectedToExistingChrome) {
      try {
        const versionResponse = await fetch(`http://127.0.0.1:${currentPort}/json/version`);
        const versionInfo: any = await versionResponse.json();
        existingChromeIsHeadless = /HeadlessChrome/i.test(String(versionInfo?.["User-Agent"] || ""));
      } catch {}
    }
    // A Chrome that merely looks headless is not proof that this tool owns it
    // (the server may have restarted, or another app may use the same CDP
    // port). Never close it unless this process recorded launching it.
    if (connectedToExistingChrome && browser && !headless && existingChromeIsHeadless && autoLaunchedChromePorts.has(currentPort)) {
      try {
        const existingContext = browser.contexts()[0];
        const existingTab = existingContext?.pages()[0];
        if (existingTab) {
          const session = await existingContext.newCDPSession(existingTab);
          await session.send("Browser.close").catch(() => {});
        }
        await browser.close().catch(() => {});
      } finally {
        browser = null;
        connectedToExistingChrome = false;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Google Labs frequently challenges the real HeadlessChrome user agent
    // with reCAPTCHA. "Chạy Chrome ẩn" therefore uses a normal signed-in
    // Chrome window positioned outside the desktop instead. If an old true
    // headless process is still on this port, replace it before continuing.
    if (connectedToExistingChrome && browser && headless && existingChromeIsHeadless && autoLaunchedChromePorts.has(currentPort)) {
      try {
        const existingContext = browser.contexts()[0];
        const existingTab = existingContext?.pages()[0];
        if (existingTab) {
          const session = await existingContext.newCDPSession(existingTab);
          await session.send("Browser.close").catch(() => {});
        }
        await browser.close().catch(() => {});
      } finally {
        browser = null;
        connectedToExistingChrome = false;
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    }

    // The server can be restarted while one of its old hidden Chrome instances
    // is still alive. Ownership is then no longer in memory, but CDP exposes a
    // HeadlessChrome user agent. When the UI asks for a visible browser, close
    // only that invisible instance and relaunch it in visible mode.
    if (connectedToExistingChrome && browser && !headless && autoLaunchedChromePorts.has(currentPort)) {
      try {
        const existingContext = browser.contexts()[0];
        const existingTab = existingContext?.pages()[0];
        if (existingTab) {
          const session = await existingContext.newCDPSession(existingTab);
          const version = await session.send("Browser.getVersion");
          const isExistingHeadless = /HeadlessChrome/i.test(String(version?.userAgent || ""));
          if (isExistingHeadless) {
            appLog(`PLAYWRIGHT_RELAUNCH_VISIBLE (Port: ${currentPort})`);
            await session.send("Browser.close").catch(() => {});
            await browser.close().catch(() => {});
            browser = null;
            connectedToExistingChrome = false;
            await new Promise(resolve => setTimeout(resolve, 700));
          }
        }
      } catch (e) {
        // If inspection fails, preserve the existing browser behavior.
      }
    }

    // A user-opened signed-in Chrome is valid for an invisible automation run.
    // The tool only places newly launched windows off-screen; it never closes
    // or relocates a Chrome window that belongs to the user.

    if (!browser) {
      console.log(`PLAYWRIGHT_AUTO_LAUNCHING_TRY (Port: ${currentPort})`);
      try {
        const profileFolderName = `chrome-dev-profile-${currentPort}`;
        const profilePath = path.join(os.homedir(), profileFolderName);
        const chromeCandidates = [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
        ];
        const chromePath = chromeCandidates.find(candidate => fs.existsSync(candidate)) || "chrome.exe";
        // Do not use the HeadlessChrome user agent for Google Labs. It triggers
        // reCAPTCHA on otherwise signed-in profiles. Hidden mode is a real
        // Chrome window kept outside the visible desktop.
        const chromeProcess = spawn(chromePath, [
          `--remote-debugging-port=${currentPort}`,
          `--user-data-dir=${profilePath}`,
          ...(headless
            ? ["--new-window", "--window-position=-32000,-32000", "--window-size=1280,900", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"]
            : ["--new-window"]),
        ], { detached: true, stdio: "ignore", windowsHide: true });
        chromeProcess.unref();
        autoLaunchedChromePorts.add(currentPort);
        if (headless) autoLaunchedHeadlessChromePorts.add(currentPort);
        else autoLaunchedHeadlessChromePorts.delete(currentPort);
        await new Promise(r => setTimeout(r, 4000));
        browser = await chromium.connectOverCDP(`http://127.0.0.1:${currentPort}`);
      } catch (innerErr) {
        console.error(`Auto launch failed on port ${currentPort}:`, innerErr);
        throw innerErr;
      }
    }
    
    let ctx = browser.contexts()[0];
    if (!ctx) {
      ctx = await browser.newContext();
    }
    const page = ctx.pages()[0] || (await ctx.newPage());
    
    await page.addInitScript(`
      if (typeof window !== 'undefined') {
        if (!window.__name) {
          window.__name = (t, v) => {
            try { Object.defineProperty(t, "name", { value: v, configurable: true }); } catch {}
            return t;
          };
        }
        window.__getImgId = (url) => {
          if (!url) return "";
          try {
            const u = new URL(url);
            const id = u.searchParams.get("id") || u.searchParams.get("docid");
            return id || "";
          } catch {
            return "";
          }
        };
      }
    `);

    page.setDefaultTimeout(60000);

    // Bắt token (chỉ cần cho Labs, nhưng cứ để đây không sao)
    page.on("request", (req) => {
      const auth = req.headers()["authorization"];
      if (auth && auth.startsWith("Bearer ")) {
        globalBearerTokens.set(port, auth);
        if (!(global as any).globalGoogleHeaders) {
            (global as any).globalGoogleHeaders = new Map();
        }
        (global as any).globalGoogleHeaders.set(port, req.headers());
      }
    });

    if (mode === "preserve") {
      // Reuse the authenticated Chrome context without navigating the user's
      // current working tab. Callers can open and close their own temporary tab.
      appLog(`PLAYWRIGHT_CONTEXT_CONNECTED (Port: ${currentPort})`);
    } else if (mode === "gemini_chat" || mode === "gemini-chat") {
      await page.goto(EXTERNAL_URLS.GEMINI_CHAT, { waitUntil: "domcontentloaded" });
      appLog(`PLAYWRIGHT_GEMINI_CONNECTED (Port: ${currentPort})`);
    } else {
      await page.goto(EXTERNAL_URLS.GOOGLE_LABS, { waitUntil: "domcontentloaded" });
      if (!globalBearerTokens.get(currentPort)) {
        appLog(`PLAYWRIGHT_LOGIN_PROMPT (Port: ${currentPort})`);
        page
          .waitForResponse((res) => res.url().includes("GenerateContent") && res.status() === 200, { timeout: 120000 })
          .then(() => appLog(`PLAYWRIGHT_AUTH_SUCCESS (Port: ${currentPort})`))
          .catch(() => {});
      } else {
        appLog(`PLAYWRIGHT_AUTH_SUCCESS (Port: ${currentPort})`);
      }
    }

    globalPlaywrightPages.set(currentPort, page);
  } catch (e: any) {
    console.error("FULL INIT PLAYWRIGHT ERROR:", e);
    appError("PLAYWRIGHT_CONNECT_ERR", e?.message || e);
    _.forEach(["PLAYWRIGHT_BORDER", "PLAYWRIGHT_CHROME_MANDATE", "PLAYWRIGHT_CHROME_COMMAND", "PLAYWRIGHT_BORDER_BOTTOM"], (k) => appLog(k));
    throw e;
  }
}

export async function closePlaywright(port?: number) {
  const currentPort = port || portContext.getStore() || 9222;
  const page = globalPlaywrightPages.get(currentPort);
  if (page) {
    try {
      await page.close();
    } catch (e) {}
    globalPlaywrightPages.delete(currentPort);
  }
}

export async function closePlaywrightBrowser(port?: number) { 
  const currentPort = port || portContext.getStore() || 9222;
  const page = globalPlaywrightPages.get(currentPort);
  if (page) { 
    try { 
      const client = await page.context().newCDPSession(page);
      await client.send('Browser.close');
    } catch(e){} 
    try { 
      await page.context().browser()?.close(); 
    } catch(e){} 
    globalPlaywrightPages.delete(currentPort);
  } 
}

/** Close a Chrome process only when initPlaywright started it for this app. */
export async function closeAutoLaunchedPlaywrightBrowser(port?: number): Promise<boolean> {
  const currentPort = port || portContext.getStore() || 9222;
  if (!autoLaunchedChromePorts.has(currentPort)) return false;
  await closePlaywrightBrowser(currentPort);
  autoLaunchedChromePorts.delete(currentPort);
  autoLaunchedHeadlessChromePorts.delete(currentPort);
  return true;
}

/** Stop every Chrome instance that this tool started itself.  User-opened,
 * signed-in Chrome profiles are deliberately never touched. */
export async function closeAllAutoLaunchedPlaywrightBrowsers(): Promise<void> {
  const ports = [...autoLaunchedChromePorts];
  await Promise.all(ports.map(port => closeAutoLaunchedPlaywrightBrowser(port).catch(() => false)));
}
