import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const base = String(process.env.QA_BASE_URL || "http://127.0.0.1:3110").replace(/\/$/, "");
const qaLicenseKey = String(process.env.QA_LICENSE_KEY || "").trim();
const runLiveProviders = process.env.QA_LIVE_PROVIDERS === "1";
const tests = [];
const record = (name, pass, detail = "") => tests.push({ name, pass: Boolean(pass), detail: String(detail).slice(0, 500) });
const json = async (route, init = {}) => {
  const response = await fetch(`${base}${route}`, {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(payload)}`);
  return payload;
};
const post = (route, body) => json(route, { method: "POST", body: JSON.stringify(body) });
const run = async (name, callback) => {
  try {
    const detail = await callback();
    record(name, true, typeof detail === "string" ? detail : JSON.stringify(detail));
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : error);
  }
};

const project = path.join(os.tmpdir(), "VidiFlow QA ảnh tiếng Việt");
const imageDirectory = path.join(project, "img");
const videoDirectory = path.join(project, "vid");
fs.mkdirSync(imageDirectory, { recursive: true });
fs.mkdirSync(videoDirectory, { recursive: true });
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
fs.writeFileSync(path.join(imageDirectory, "001_Cảnh_đầu.png"), pixel);
fs.writeFileSync(path.join(project, "script.txt"), "Kịch bản thử đường dẫn tiếng Việt", "utf8");

if (qaLicenseKey) {
  await run("Local QA license activation", async () => {
    const result = await post("/api/license/activate", { key: qaLicenseKey });
    if (!result.active) throw new Error(JSON.stringify(result));
    return { plan: result.plan, source: result.source };
  });
}
await run("Health", async () => {
  const result = await json("/api/health-check");
  if (result.status !== "ok") throw new Error(JSON.stringify(result));
  return result;
});await run("Unknown API returns JSON 404", async () => {
  const response = await fetch(`${base}/api/qa-route-that-must-not-exist`);
  const contentType = String(response.headers.get("content-type") || "");
  const result = await response.json().catch(() => ({}));
  if (
    response.status !== 404 ||
    !contentType.includes("application/json") ||
    result.error !== "API_NOT_FOUND"
  ) {
    throw new Error(
      JSON.stringify({ status: response.status, contentType, result }),
    );
  }
  return { status: response.status, error: result.error };
});
await run("Launcher status", async () => {
  const result = await json("/api/launcher/status");
  if (result.app !== "vidiflow-oneclick") throw new Error(JSON.stringify(result));
  return result;
});
await run("Shared automation setup", async () => {
  await post("/api/config/automation-default", {
    config: {
      generationMode: "viettheo-api",
      aspectRatio: "9:16",
      generateType: "image",
      chromeThreads: 7,
      voiceModel: "release-qa",
    },
  });
  const { config } = await json("/api/config/automation-default");
  if (config.generationMode !== "viettheo-api" || config.aspectRatio !== "9:16" || config.chromeThreads !== 7) {
    throw new Error(JSON.stringify(config));
  }
  return { generationMode: config.generationMode, aspectRatio: config.aspectRatio, generateType: config.generateType, chromeThreads: config.chromeThreads, voiceModel: config.voiceModel };
});
await run("Provider secrets are masked", async () => {
  const result = await json("/api/config/keys");
  for (const key of ["GEMINI_API_KEY", "AI_33_API_KEY", "VIETTHEO_API_KEY"]) {
    if (result[key] && !String(result[key]).includes("*")) throw new Error(`${key} is not masked`);
  }
  return result;
});
await run("Unicode project path", async () => {
  const result = await post("/api/check-file", { path: path.join(project, "script.txt") });
  if (!result.exists) throw new Error(JSON.stringify(result));
  return project;
});
await run("Reload Unicode media", async () => {
  const result = await post("/api/list-project-media", { directory: imageDirectory });
  if (!result.success || !result.files.includes("001_Cảnh_đầu.png")) throw new Error(JSON.stringify(result));
  return result;
});
await run("Reference image upload and preview", async () => {
  const result = await post("/api/upload-reference-image", { imageData: `data:image/png;base64,${pixel.toString("base64")}`, fileName: "ảnh_mẫu.png", projectDir: project });
  const response = await fetch(`${base}${result.url}`);
  if (!result.success || !response.ok || !(await response.arrayBuffer()).byteLength) throw new Error(JSON.stringify(result));
  return result.path;
});
await run("Restore project state", async () => {
  const result = await post("/api/project-state", { path: project });
  if (!result.success) throw new Error(JSON.stringify(result));
  return result;
});
await run("Project output summary", async () => {
  const result = await post("/api/project-output-summary", { projectDir: project });
  if (!result.success || !result.script.ready || result.media.imageCount < 1) throw new Error(JSON.stringify(result));
  return { progress: result.progress, imageCount: result.media.imageCount, scriptReady: result.script.ready };
});
await run("Offline storyboard fallback", async () => {
  const result = await post("/api/generate-storyboard-fallback", { script: "Thứ nhất, đây là câu dài có nhiều ý. Thứ hai, đây là nội dung tiếp theo cần chia thành các cảnh hợp lý.", promptsPerScene: 2, stylePrompt: "cinematic" });
  if (!Array.isArray(result.scenes) || result.scenes.length < 2) throw new Error(JSON.stringify(result));
  return { scenes: result.scenes.length };
});
if (runLiveProviders) {
  await run("Live provider voice model list", async () => {
    const result = await json("/api/ai33/voices?provider=minimax&page=1&page_size=5");
    if (!result.success || !Array.isArray(result.data) || !result.data.length) throw new Error(JSON.stringify(result));
    return { voices: result.data.length };
  });
} else {
  record("Live provider checks", true, "Skipped; set QA_LIVE_PROVIDERS=1 to enable credentialed provider tests.");
}

for (const test of tests) console.log(`${test.pass ? "PASS" : "FAIL"} | ${test.name} | ${test.detail}`);
const failed = tests.filter((test) => !test.pass);
console.log(`SUMMARY ${tests.length - failed.length}/${tests.length} passed`);
if (failed.length) process.exitCode = 1;
