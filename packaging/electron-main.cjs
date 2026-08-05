const { app, BrowserWindow, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');

let serverProcess = null;
let mainWindow = null;

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

function openInChrome(url) {
  const chromeCandidates = [
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];
  const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  if (chrome) {
    const browser = spawn(chrome, [url], { detached: true, stdio: 'ignore', windowsHide: true });
    browser.unref();
    return;
  }
  void shell.openExternal(url);
}

function getAvailablePort(port = 3102) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => {
      if (port >= 37999) reject(new Error('No available local port.'));
      else resolve(getAvailablePort(port + 1));
    });
    probe.once('listening', () => probe.close(() => resolve(port)));
    probe.listen(port, '127.0.0.1');
  });
}

function waitForServer(url, attempts = 180) {
  return new Promise((resolve, reject) => {
    const check = (remaining) => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode >= 200 && response.statusCode < 500) resolve();
        else retry(remaining);
      });
      request.setTimeout(1500, () => { request.destroy(); retry(remaining); });
      request.on('error', () => retry(remaining));
    };
    const retry = (remaining) => {
      if (remaining <= 0) reject(new Error('VidiFlow server did not respond.'));
      else setTimeout(() => check(remaining - 1), 500);
    };
    check(attempts);
  });
}

async function launch() {
  app.setAppUserModelId('com.vidiflow.oneclick');
  const appRoot = app.getAppPath();
  // Keep the desktop origin stable so Chromium localStorage survives restarts.
  // A changing per-process port makes every launch look like a new website and
  // causes the customer's saved setup to appear empty.
  const port = await getAvailablePort(3102);
  const dataRoot = path.join(app.getPath('home'), '.vidiflow-oneclick');
  fs.mkdirSync(dataRoot, { recursive: true });
  const legacyDataRoot = app.getPath('userData');
  for (const name of ['license.json', 'automation-default.json']) {
    const oldFile = path.join(legacyDataRoot, name);
    const newFile = path.join(dataRoot, name);
    if (!fs.existsSync(newFile) && fs.existsSync(oldFile)) fs.copyFileSync(oldFile, newFile);
  }
  const logPath = path.join(dataRoot, 'server.log');
  // spawn() needs numeric file descriptors (or "pipe"/"ignore") for stdio.
  // A WriteStream is not ready immediately and its fd can still be null,
  // which caused the desktop app to fail before the server even started.
  const logFd = fs.openSync(logPath, 'a');
  fs.writeSync(logFd, `[Electron] Starting bundled server on port ${port}\n`);
  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: 'production',
    DISABLE_HMR: 'true',
    VIDIFLOW_DATA_DIR: dataRoot,
    VIDIFLOW_APP_VERSION: app.getVersion(),
    VIDIFLOW_LAUNCHER_MODE: '1',
    // Used only by the verified updater: it must wait until Electron has
    // released Chromium DLLs before the installer replaces them.
    VIDIFLOW_DESKTOP_PID: String(process.pid),
    VIDIFLOW_DESKTOP_EXE: process.execPath,
    WHISPER_CPP_PATH: path.join(appRoot, 'runtime', 'whisper', 'Release', 'whisper-cli.exe'),
    WHISPER_MODEL_PATH: path.join(appRoot, 'runtime', 'whisper', 'ggml-base.bin'),
    ELECTRON_RUN_AS_NODE: '1',
  };
  serverProcess = spawn(process.execPath, [path.join(appRoot, 'dist', 'server.cjs')], {
    cwd: appRoot,
    env,
    windowsHide: true,
    stdio: ['ignore', logFd, logFd],
  });
  await waitForServer(`http://127.0.0.1:${port}/`);
  const window = new BrowserWindow({
    width: 1520,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    title: 'VidiFlow OneClick Content Studio',
    icon: path.join(appRoot, 'brand', 'vidiflow-logo.png'),
    autoHideMenuBar: true,
    backgroundColor: '#0b1028',
    webPreferences: { contextIsolation: true, nodeIntegration: false, devTools: false },
  });
  mainWindow = window;
  window.on('closed', () => {
    mainWindow = null;
  });
  window.removeMenu();
  // Mua key và các liên kết ngoài phải mở trên Chrome đã đăng nhập của khách,
  // không mở trong cửa sổ tool.
  window.webContents.setWindowOpenHandler(({ url }) => {
    openInChrome(url);
    return { action: 'deny' };
  });
  await window.loadURL(`http://127.0.0.1:${port}/`);
}

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

if (hasSingleInstanceLock) app.whenReady().then(launch).catch((error) => {
  dialog.showErrorBox('Không thể khởi động VidiFlow', `${error.message}\n\nXem log tại: ${path.join(app.getPath('userData'), 'server.log')}`);
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});
