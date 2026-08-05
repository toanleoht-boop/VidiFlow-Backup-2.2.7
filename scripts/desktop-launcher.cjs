const { spawn, execFile } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const appRoot = path.dirname(process.execPath);
const runtimeNode = path.join(appRoot, "runtime", "node.exe");
const serverFile = path.join(appRoot, "app", "dist", "server.cjs");
// A dedicated port avoids accidentally opening another local app that uses 3100.
const PORT = 31888;
const appUrl = `http://localhost:${PORT}/`;
const logDirectory = path.join(appRoot, "logs");
const launcherLog = path.join(logDirectory, "launcher.log");
const serverLog = path.join(logDirectory, "server.log");

fs.mkdirSync(logDirectory, { recursive: true });

function writeLog(message) {
  fs.appendFileSync(launcherLog, `[${new Date().toISOString()}] ${message}\r\n`);
}

function showError(message) {
  execFile("powershell.exe", ["-NoProfile", "-Command", `[System.Windows.Forms.MessageBox]::Show('${message.replace(/'/g, "''")}', 'AI Content Factory')`], { windowsHide: true }, () => {});
}

function isReady() {
  return new Promise((resolve) => {
    const request = http.get(appUrl, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.setTimeout(800, () => { request.destroy(); resolve(false); });
    request.on("error", () => resolve(false));
  });
}

function openApp() {
  execFile("cmd.exe", ["/c", "start", "", appUrl], { windowsHide: true }, () => {});
}

(async () => {
  if (!fs.existsSync(runtimeNode) || !fs.existsSync(serverFile)) {
    writeLog("Missing runtime or server file.");
    showError("Khong tim thay file chay cua tool. Hay giu nguyen cau truc thu muc phat hanh.");
    process.exit(1);
  }
  if (await isReady()) {
    writeLog(`Existing tool instance found at ${appUrl}.`);
    openApp();
    return;
  }
  writeLog(`Starting server on port ${PORT}.`);
  const child = spawn(runtimeNode, [serverFile], {
    cwd: path.join(appRoot, "app"),
    detached: true,
    stdio: ["ignore", fs.openSync(serverLog, "a"), fs.openSync(serverLog, "a")],
    windowsHide: true,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "production" },
  });
  child.on("error", (error) => writeLog(`Cannot start server: ${error.message}`));
  child.unref();
  for (let attempt = 0; attempt < 25; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (await isReady()) {
      writeLog("Tool started successfully.");
      openApp();
      return;
    }
  }
  writeLog("Tool did not become ready. See server.log.");
  showError("Tool khong khoi dong duoc. Hay gui file logs\\server.log cho nguoi ho tro.");
  process.exit(1);
})();
