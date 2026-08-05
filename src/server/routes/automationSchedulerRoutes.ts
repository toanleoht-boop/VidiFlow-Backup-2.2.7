import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawn } from "child_process";
import ffmpegStatic from "ffmpeg-static";
import { publishVideo, testPublishingConnection, type PublishMetadata, type PublishPlatform, type PublishingConfig } from "../services/socialPublisherService";
import { prepareChromePublish } from "../services/chromePublisherService";

type Preset = { id: string; name: string; description: string; config: Record<string, unknown>; createdAt: string; updatedAt: string };
type JobStatus = "scheduled" | "running" | "interrupted" | "completed" | "failed" | "cancelled";
type PublishStatus = "not_requested" | "waiting" | "publishing" | "published" | "partial" | "failed";
type PublishResult = { platform: PublishPlatform; state: string; id?: string; url?: string; error?: string; updatedAt: string };
type PublishMethod = "api" | "chrome";
type YouTubePublishMode = "schedule" | "immediate";
type AutomationJob = {
  id: string; source: "tool" | "telegram"; inputType: "script" | "idea" | "link"; input: string;
  presetId: string; presetName: string; scheduledAt: string; projectDir: string; projectBaseDir?: string; status: JobStatus; progress: number;
  publishPlatforms: PublishPlatform[]; publishAt?: string; publishMethod?: PublishMethod; youtubePublishMode?: YouTubePublishMode; youtubeLeadMinutes?: number; chromeProfilePort?: number; youtubeChannelId?: string; youtubeChannelName?: string; facebookPageName?: string; facebookPageUrl?: string; publishStatus: PublishStatus; publishResults: PublishResult[];
  publishMetadata?: PublishMetadata; outputVideoPath?: string; message?: string; telegramChatId?: string; createdAt: string; updatedAt: string;
};
type TelegramConfig = {
  enabled: boolean;
  botToken: string;
  allowedChatId: string;
  defaultPresetId: string;
  lastUpdateId: number;
  publishMethod?: PublishMethod;
  chromeProfilePort?: number;
  youtubeChannelId?: string;
  youtubeChannelName?: string;
  facebookPageName?: string;
  facebookPageUrl?: string;
  youtubePublishMode?: YouTubePublishMode;
  youtubeLeadMinutes?: number;
};
type TelegramDraft = { stage: "content" | "preset" | "create_time" | "platforms" | "publish_time"; inputType?: AutomationJob["inputType"]; input?: string; presetId?: string; scheduledAt?: string; platforms?: PublishPlatform[] };

const now = () => new Date().toISOString();
const safeRead = <T,>(file: string, fallback: T): T => { try { return JSON.parse(fs.readFileSync(file, "utf8")) as T; } catch { return fallback; } };
const safeWrite = (file: string, value: unknown) => { fs.mkdirSync(path.dirname(file), { recursive: true }); const temp = `${file}.${process.pid}.tmp`; fs.writeFileSync(temp, JSON.stringify(value, null, 2), "utf8"); fs.renameSync(temp, file); };
const cleanName = (value: string) => value.replace(/[<>:"/\\|?*\x00-\x1f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
const detectInputType = (input: string): AutomationJob["inputType"] => /^https?:\/\//i.test(input.trim()) ? "link" : input.trim().length < 240 ? "idea" : "script";
const parseTelegramDate = (value: string) => {
  const normalized = String(value || "").trim().replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})$/, "$1T$2");
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

export function createAutomationSchedulerRouter(dataDir: string) {
  const router = express.Router();
  const presetsFile = path.join(dataDir, "automation-presets.json");
  const jobsFile = path.join(dataDir, "automation-jobs.json");
  const telegramFile = path.join(dataDir, "telegram-integration.json");
  const publishingFile = path.join(dataDir, "social-publishing.json");
  const telegramDraftsFile = path.join(dataDir, "telegram-drafts.json");
  const projectRoot = path.join(os.homedir(), "Documents", "VidiFlow Projects");
  const ffmpegPath = typeof ffmpegStatic === "string" && ffmpegStatic ? ffmpegStatic : "ffmpeg";
  const readPresets = () => safeRead<Preset[]>(presetsFile, []);
  const writePresets = (items: Preset[]) => safeWrite(presetsFile, items);
  const readJobs = () => safeRead<AutomationJob[]>(jobsFile, []);
  const writeJobs = (items: AutomationJob[]) => safeWrite(jobsFile, items.slice(0, 500));
  const readJobsWithInterruptedRecovery = () => {
    const jobs = readJobs();
    const staleBefore = Date.now() - 20_000;
    let changed = false;
    const recovered = jobs.map(job => {
      if (
        job.status !== "running" ||
        !Number.isFinite(new Date(job.updatedAt).getTime()) ||
        new Date(job.updatedAt).getTime() >= staleBefore
      )
        return job;
      changed = true;
      return {
        ...job,
        status: "interrupted" as JobStatus,
        message: "Tool đã đóng hoặc khởi động lại khi task đang chạy. Dữ liệu dự án vẫn được giữ; hãy chọn Chạy tiếp hoặc Chạy lại.",
        updatedAt: now(),
      };
    });
    if (changed) writeJobs(recovered);
    return recovered;
  };
  const readTelegramRaw = () => safeRead<TelegramConfig>(telegramFile, { enabled: false, botToken: "", allowedChatId: "", defaultPresetId: "", lastUpdateId: 0 });
  /* A preset can be renamed/recreated or removed while the Telegram config
     still points to its old id. Heal that stale pointer on read so the bot
     never appears connected but silently refuses to create scheduled jobs. */
  const readTelegram = () => {
    const config = readTelegramRaw();
    const presets = readPresets();
    if (config.defaultPresetId && presets.some(item => item.id === config.defaultPresetId)) return config;
    const fallbackPresetId = presets[0]?.id || "";
    if (fallbackPresetId !== config.defaultPresetId) {
      const healed = { ...config, defaultPresetId: fallbackPresetId };
      writeTelegram(healed);
      return healed;
    }
    return config;
  };
  const writeTelegram = (value: TelegramConfig) => safeWrite(telegramFile, value);
  const readPublishing = () => safeRead<PublishingConfig>(publishingFile, {});
  const writePublishing = (value: PublishingConfig) => safeWrite(publishingFile, value);
  const readTelegramDrafts = () => safeRead<Record<string, TelegramDraft>>(telegramDraftsFile, {});
  const writeTelegramDrafts = (value: Record<string, TelegramDraft>) => safeWrite(telegramDraftsFile, value);
  const normalizePlatforms = (value: unknown): PublishPlatform[] => Array.from(new Set((Array.isArray(value) ? value : []).filter(item => ["youtube", "facebook", "tiktok"].includes(String(item))) as PublishPlatform[]));
  const normalizeFacebookPageUrl = (value: unknown) => {
    try {
      const url = new URL(String(value || "").trim());
      const host = url.hostname.toLowerCase();
      if (url.protocol !== "https:" || (host !== "facebook.com" && host !== "www.facebook.com" && !host.endsWith(".facebook.com"))) return "";
      url.hash = "";
      return url.toString();
    } catch { return ""; }
  };
  const getFacebookCaption = (job: AutomationJob) => {
    const storedDescription = String(job.publishMetadata?.description || "").trim();
    if (storedDescription) return storedDescription;
    try {
      const seoText = fs.readFileSync(path.join(job.projectDir, "seo.txt"), "utf8");
      const match = seoText.match(/MÔ TẢ\s*\r?\n([\s\S]*?)(?:\r?\n\s*PROMPT THUMBNAIL|$)/i);
      return String(match?.[1] || "").trim();
    } catch {
      return "";
    }
  };
  const findLatestThumbnail = (job: AutomationJob) => {
    const directories = Array.from(new Set([
      job.projectDir,
      job.outputVideoPath ? path.dirname(job.outputVideoPath) : "",
    ].filter(Boolean)));
    const candidates = directories.flatMap(directory => {
      try {
        return fs.readdirSync(directory, { withFileTypes: true })
          .filter(item => item.isFile() && /^(thumbnail|thumb|cover).*\.(png|jpe?g|webp)$/i.test(item.name) && !/^thumbnail_publish_ready_/i.test(item.name))
          .map(item => {
            const filePath = path.join(directory, item.name);
            return { filePath, modifiedAt: fs.statSync(filePath).mtimeMs };
          });
      } catch {
        return [];
      }
    });
    return candidates.sort((left, right) => right.modifiedAt - left.modifiedAt)[0]?.filePath;
  };

  const detectPublishThumbnailSize = async (job: AutomationJob) => {
    let stderr = "";
    if (job.outputVideoPath && fs.existsSync(job.outputVideoPath)) {
      await new Promise<void>(resolve => {
        const child = spawn(ffmpegPath, ["-hide_banner", "-i", job.outputVideoPath!], {
          windowsHide: true,
          stdio: ["ignore", "ignore", "pipe"],
        });
        child.stderr.on("data", chunk => { stderr += String(chunk); });
        child.once("error", () => resolve());
        child.once("close", () => resolve());
      });
      const match = stderr.match(/Video:[^\r\n]*?\b(\d{2,5})x(\d{2,5})\b/i);
      if (match) {
        const width = Number(match[1]);
        const height = Number(match[2]);
        if (height > width * 1.05) return { width: 1080, height: 1920, label: "9:16" };
        if (Math.abs(width - height) <= Math.max(width, height) * 0.05)
          return { width: 1080, height: 1080, label: "1:1" };
        return { width: 1280, height: 720, label: "16:9" };
      }
    }
    const preset = readPresets().find(item => item.id === job.presetId);
    const config = (preset?.config || {}) as any;
    const aspect = String(config?.autoConfig?.aspectRatio || config?.aspectRatio || "16:9");
    return aspect.includes("9:16")
      ? { width: 1080, height: 1920, label: "9:16" }
      : aspect.includes("1:1")
        ? { width: 1080, height: 1080, label: "1:1" }
        : { width: 1280, height: 720, label: "16:9" };
  };

  const prepareThumbnailForPublish = async (job: AutomationJob, sourcePath?: string) => {
    if (!sourcePath) return undefined;
    if (!fs.existsSync(sourcePath)) throw new Error("THUMBNAIL_FILE_NOT_FOUND");
    const target = await detectPublishThumbnailSize(job);
    const outputPath = path.join(
      job.projectDir,
      `thumbnail_publish_ready_${target.label.replace(":", "x")}.jpg`,
    );
    const sourceModifiedAt = fs.statSync(sourcePath).mtimeMs;
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).mtimeMs >= sourceModifiedAt)
      return outputPath;
    const tempPath = `${outputPath}.${process.pid}.tmp.jpg`;
    const filter = [
      `scale=${target.width}:${target.height}:force_original_aspect_ratio=increase`,
      `crop=${target.width}:${target.height}:(in_w-out_w)/2:(in_h-out_h)/2`,
      "setsar=1",
    ].join(",");
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          ffmpegPath,
          ["-y", "-i", sourcePath, "-vf", filter, "-frames:v", "1", "-q:v", "2", tempPath],
          { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
        );
        let errorText = "";
        child.stderr.on("data", chunk => { errorText += String(chunk); });
        child.once("error", reject);
        child.once("close", code =>
          code === 0 && fs.existsSync(tempPath)
            ? resolve()
            : reject(new Error(errorText.split(/\r?\n/).slice(-6).join("\n") || "FFmpeg crop failed")),
        );
      });
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      fs.renameSync(tempPath, outputPath);
      return outputPath;
    } catch (error: any) {
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
      throw new Error(`THUMBNAIL_CROP_FAILED_${target.label}: ${error?.message || "unknown error"}`);
    }
  };

  const notifyTelegram = async (chatId: string, text: string, replyMarkup?: Record<string, unknown>) => {
    const config = readTelegram();
    if (!config.botToken || !chatId) return;
    await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }) }).catch(() => null);
  };
  const answerTelegramCallback = async (callbackId: string) => {
    const config = readTelegram(); if (!config.botToken || !callbackId) return;
    await fetch(`https://api.telegram.org/bot${config.botToken}/answerCallbackQuery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: callbackId }) }).catch(() => null);
  };
  const platformKeyboard = { inline_keyboard: [[
    { text: "YouTube", callback_data: "vf:platform:youtube" },
    { text: "Facebook", callback_data: "vf:platform:facebook" },
    { text: "TikTok", callback_data: "vf:platform:tiktok" },
  ], [{ text: "Cả 3 nền tảng", callback_data: "vf:platform:all" }, { text: "Chỉ tạo video", callback_data: "vf:platform:none" }]] };
  const createTimeKeyboard = { inline_keyboard: [[{ text: "Chạy ngay", callback_data: "vf:create:now" }, { text: "Chọn ngày giờ", callback_data: "vf:create:custom" }]] };
  const createJob = (payload: Partial<AutomationJob>, source: AutomationJob["source"], chatId = "") => {
    const presets = readPresets();
    const preset = presets.find(item => item.id === payload.presetId) || presets[0];
    if (!preset) throw new Error("PRESET_REQUIRED");
    const input = String(payload.input || "").trim();
    if (!input) throw new Error("INPUT_REQUIRED");
    const id = crypto.randomBytes(6).toString("hex").toUpperCase();
    const scheduledAt = payload.scheduledAt && Number.isFinite(new Date(payload.scheduledAt).getTime()) ? new Date(payload.scheduledAt).toISOString() : now();
    const requestedBaseDir = String(payload.projectBaseDir || "").trim();
    const projectBaseDir = requestedBaseDir && path.isAbsolute(requestedBaseDir)
      ? path.resolve(requestedBaseDir)
      : projectRoot;
    const projectDir = path.join(projectBaseDir, `${scheduledAt.slice(0, 10)}_${id}_${cleanName(preset.name) || "Preset"}`);
    fs.mkdirSync(projectDir, { recursive: true });
    const publishPlatforms = normalizePlatforms(payload.publishPlatforms);
    const publishAt = payload.publishAt && Number.isFinite(new Date(payload.publishAt).getTime()) ? new Date(payload.publishAt).toISOString() : undefined;
    const publishMethod: PublishMethod = payload.publishMethod === "api" ? "api" : "chrome";
    const youtubePublishMode: YouTubePublishMode = payload.youtubePublishMode === "immediate" ? "immediate" : "schedule";
    const youtubeLeadMinutes = youtubePublishMode === "schedule"
      ? Math.min(180, Math.max(5, Math.round(Number(payload.youtubeLeadMinutes) || 15)))
      : undefined;
    const chromeProfilePort = publishMethod === "chrome" && Number(payload.chromeProfilePort) >= 1024 && Number(payload.chromeProfilePort) <= 65535 ? Number(payload.chromeProfilePort) : undefined;
    const youtubeChannelId = publishMethod === "chrome" ? cleanName(String(payload.youtubeChannelId || "")).replace(/[^A-Za-z0-9_-]/g, "") : "";
    const youtubeChannelName = publishMethod === "chrome" ? cleanName(String(payload.youtubeChannelName || "")) : "";
    const requestedFacebookPageUrl = publishMethod === "chrome" ? normalizeFacebookPageUrl(payload.facebookPageUrl) : "";
    const facebookPageUrl = requestedFacebookPageUrl;
    const facebookPageName = publishMethod === "chrome" ? cleanName(String(payload.facebookPageName || "")) : "";
    if (publishMethod === "chrome" && publishPlatforms.includes("facebook") && (!facebookPageName || !facebookPageUrl)) throw new Error("FACEBOOK_PAGE_REQUIRED");
    const job: AutomationJob = {
      id, source, inputType: payload.inputType || detectInputType(input), input, presetId: preset.id, presetName: preset.name,
      scheduledAt, projectDir, projectBaseDir, status: "scheduled", progress: 0, publishPlatforms, publishAt, publishMethod, youtubePublishMode, youtubeLeadMinutes, chromeProfilePort, youtubeChannelId: youtubeChannelId || undefined, youtubeChannelName: youtubeChannelName || undefined, facebookPageName: facebookPageName || undefined, facebookPageUrl: facebookPageUrl || undefined,
      publishStatus: publishPlatforms.length ? "waiting" : "not_requested", publishResults: [],
      publishMetadata: payload.publishMetadata || {}, telegramChatId: chatId || undefined, createdAt: now(), updatedAt: now(),
    };
    const jobs = readJobs(); jobs.unshift(job); writeJobs(jobs); return job;
  };

  router.get("/presets", (_req, res) => res.json({ presets: readPresets() }));
  router.post("/presets", (req, res) => {
    const name = cleanName(String(req.body?.name || "")); const config = req.body?.config;
    if (!name || !config || typeof config !== "object" || Array.isArray(config)) return res.status(400).json({ error: "INVALID_PRESET" });
    const presets = readPresets(); const existing = presets.find(item => item.id === req.body?.id); const stamp = now();
    const preset: Preset = existing ? { ...existing, name, description: String(req.body?.description || ""), config, updatedAt: stamp } : { id: crypto.randomBytes(6).toString("hex"), name, description: String(req.body?.description || ""), config, createdAt: stamp, updatedAt: stamp };
    writePresets(existing ? presets.map(item => item.id === preset.id ? preset : item) : [preset, ...presets]);
    return res.json({ saved: true, preset });
  });
  router.delete("/presets/:id", (req, res) => { const presets = readPresets(); writePresets(presets.filter(item => item.id !== req.params.id)); return res.json({ deleted: presets.some(item => item.id === req.params.id) }); });

  router.get("/jobs", (_req, res) => res.json({ jobs: readJobsWithInterruptedRecovery().map(job => ({ ...job, publishPlatforms: job.publishPlatforms || [], publishStatus: job.publishStatus || "not_requested", publishResults: job.publishResults || [] })) }));
  router.post("/jobs", (req, res) => { try { return res.json({ created: true, job: createJob(req.body || {}, "tool") }); } catch (error: any) { return res.status(400).json({ error: error.message || "INVALID_JOB" }); } });
  router.patch("/jobs/:id/config", (req, res) => {
    try {
      const jobs = readJobs();
      const index = jobs.findIndex(item => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: "JOB_NOT_FOUND" });
      if (jobs[index].status !== "scheduled") return res.status(409).json({ error: "JOB_ALREADY_STARTED" });

      const presets = readPresets();
      const preset = presets.find(item => item.id === req.body?.presetId);
      if (!preset) return res.status(400).json({ error: "PRESET_REQUIRED" });
      const input = String(req.body?.input || "").trim();
      if (!input) return res.status(400).json({ error: "INPUT_REQUIRED" });

      const scheduledAt = req.body?.scheduledAt && Number.isFinite(new Date(req.body.scheduledAt).getTime())
        ? new Date(req.body.scheduledAt).toISOString()
        : jobs[index].scheduledAt;
      const publishPlatforms = normalizePlatforms(req.body?.publishPlatforms);
      const publishAt = req.body?.publishAt && Number.isFinite(new Date(req.body.publishAt).getTime())
        ? new Date(req.body.publishAt).toISOString()
        : undefined;
      const publishMethod: PublishMethod = req.body?.publishMethod === "chrome" ? "chrome" : "api";
      const youtubePublishMode: YouTubePublishMode = req.body?.youtubePublishMode === "immediate" ? "immediate" : "schedule";
      const youtubeLeadMinutes = youtubePublishMode === "schedule"
        ? Math.min(180, Math.max(5, Math.round(Number(req.body?.youtubeLeadMinutes) || 15)))
        : undefined;
      const chromeProfilePort = publishMethod === "chrome" && Number(req.body?.chromeProfilePort) >= 1024 && Number(req.body?.chromeProfilePort) <= 65535
        ? Number(req.body.chromeProfilePort)
        : undefined;
      const youtubeChannelId = publishMethod === "chrome" ? cleanName(String(req.body?.youtubeChannelId || "")).replace(/[^A-Za-z0-9_-]/g, "") : "";
      const youtubeChannelName = publishMethod === "chrome" ? cleanName(String(req.body?.youtubeChannelName || "")) : "";
      const facebookPageUrl = publishMethod === "chrome" ? normalizeFacebookPageUrl(req.body?.facebookPageUrl) : "";
      const facebookPageName = publishMethod === "chrome" ? cleanName(String(req.body?.facebookPageName || "")) : "";
      if (publishMethod === "chrome" && publishPlatforms.includes("facebook") && (!facebookPageName || !facebookPageUrl)) return res.status(400).json({ error: "FACEBOOK_PAGE_REQUIRED" });

      jobs[index] = {
        ...jobs[index],
        inputType: ["script", "idea", "link"].includes(req.body?.inputType) ? req.body.inputType : detectInputType(input),
        input,
        presetId: preset.id,
        presetName: preset.name,
        scheduledAt,
        publishPlatforms,
        publishAt,
        publishMethod,
        youtubePublishMode,
        youtubeLeadMinutes,
        chromeProfilePort,
        youtubeChannelId: youtubeChannelId || undefined,
        youtubeChannelName: youtubeChannelName || undefined,
        facebookPageName: facebookPageName || undefined,
        facebookPageUrl: facebookPageUrl || undefined,
        publishStatus: publishPlatforms.length ? "waiting" : "not_requested",
        publishResults: [],
        message: "Lịch sản xuất đã được cập nhật.",
        updatedAt: now(),
      };
      writeJobs(jobs);
      return res.json({ updated: true, job: jobs[index] });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "INVALID_JOB" });
    }
  });
  router.post("/jobs/:id/resume", (req, res) => {
    const jobs = readJobsWithInterruptedRecovery();
    const index = jobs.findIndex(item => item.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: "JOB_NOT_FOUND" });
    if (!["interrupted", "failed", "cancelled"].includes(jobs[index].status))
      return res.status(409).json({ error: "JOB_NOT_RESUMABLE" });
    const preset = readPresets().find(item => item.id === jobs[index].presetId);
    if (!preset) return res.status(400).json({ error: "PRESET_REQUIRED" });
    jobs[index] = {
      ...jobs[index],
      // Resume opens the existing project at its recovery stage for review.
      // The pipeline itself will switch the job to running when the user
      // actually starts that stage; marking it running here creates a false
      // "Đang tạo" state while no worker is active.
      status: "interrupted",
      publishStatus: jobs[index].publishPlatforms.length ? "waiting" : "not_requested",
      message: "Đang khôi phục dự án và tự động chạy tiếp từ dữ liệu đang có.",
      updatedAt: now(),
    };
    writeJobs(jobs);
    return res.json({ resumed: true, job: jobs[index], preset });
  });
  router.post("/jobs/:id/restart", (req, res) => {
    try {
      const source = readJobs().find(item => item.id === req.params.id);
      if (!source) return res.status(404).json({ error: "JOB_NOT_FOUND" });
      if (source.status === "running")
        return res.status(409).json({ error: "JOB_IS_RUNNING" });
      const job = createJob({
        input: source.input,
        inputType: source.inputType,
        presetId: source.presetId,
        projectBaseDir: source.projectBaseDir,
        scheduledAt: now(),
        publishPlatforms: source.publishPlatforms,
        publishAt: source.publishAt,
        publishMethod: source.publishMethod,
        youtubePublishMode: source.youtubePublishMode,
        youtubeLeadMinutes: source.youtubeLeadMinutes,
        chromeProfilePort: source.chromeProfilePort,
        youtubeChannelId: source.youtubeChannelId,
        youtubeChannelName: source.youtubeChannelName,
        facebookPageName: source.facebookPageName,
        facebookPageUrl: source.facebookPageUrl,
      }, source.source, source.telegramChatId || "");
      return res.json({ restarted: true, job });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || "JOB_RESTART_FAILED" });
    }
  });
  router.delete("/jobs/:id", (req, res) => {
    const jobs = readJobs();
    const job = jobs.find(item => item.id === req.params.id);
    if (!job) return res.status(404).json({ error: "JOB_NOT_FOUND" });
    if (job.status === "running") return res.status(409).json({ error: "JOB_IS_RUNNING" });
    writeJobs(jobs.filter(item => item.id !== req.params.id));
    return res.json({ deleted: true, projectFilesKept: true });
  });
  router.post("/jobs/claim", (req, res) => {
    const requestedId = String(req.body?.id || "");
    const jobs = readJobs(); const index = jobs.findIndex(item => item.status === "scheduled" && new Date(item.scheduledAt).getTime() <= Date.now() && (!requestedId || item.id === requestedId));
    if (index < 0) return res.json({ job: null });
    const preset = readPresets().find(item => item.id === jobs[index].presetId);
    if (!preset) { jobs[index] = { ...jobs[index], status: "failed", message: "Preset không còn tồn tại", updatedAt: now() }; writeJobs(jobs); return res.json({ job: null }); }
    jobs[index] = { ...jobs[index], status: "running", progress: 1, message: "Desktop đã nhận tác vụ", updatedAt: now() }; writeJobs(jobs);
    return res.json({ job: jobs[index], preset });
  });
  router.patch("/jobs/:id", (req, res) => {
    const jobs = readJobs(); const index = jobs.findIndex(item => item.id === req.params.id); if (index < 0) return res.status(404).json({ error: "JOB_NOT_FOUND" });
    const status: JobStatus = ["scheduled", "running", "interrupted", "completed", "failed", "cancelled"].includes(req.body?.status) ? req.body.status : jobs[index].status;
    const outputVideoPath = String(req.body?.outputVideoPath ?? jobs[index].outputVideoPath ?? "").trim();
    jobs[index] = {
      ...jobs[index], status,
      progress: Math.max(0, Math.min(100, Number(req.body?.progress ?? jobs[index].progress) || 0)),
      message: String(req.body?.message ?? jobs[index].message ?? "").slice(0, 1000),
      outputVideoPath: outputVideoPath || undefined,
      publishMetadata: req.body?.publishMetadata && typeof req.body.publishMetadata === "object" ? req.body.publishMetadata : jobs[index].publishMetadata,
      publishStatus: status === "completed" && (jobs[index].publishPlatforms || []).length ? "waiting" : (jobs[index].publishStatus || "not_requested"),
      updatedAt: now(),
    };
    writeJobs(jobs);
    if (["completed", "failed", "cancelled"].includes(status) && jobs[index].telegramChatId) { const icon = status === "completed" ? "✅" : status === "cancelled" ? "⏹" : "❌"; void notifyTelegram(jobs[index].telegramChatId!, `${icon} <b>${status === "completed" ? "Video đã hoàn thành" : status === "cancelled" ? "Tác vụ đã dừng" : "Tác vụ gặp lỗi"}</b>\nMã: <code>${jobs[index].id}</code>\nPreset: <b>${jobs[index].presetName}</b>\n${jobs[index].message || ""}`); }
    return res.json({ updated: true, job: jobs[index] });
  });
  router.post("/jobs/:id/retry-publish", (req, res) => {
    const jobs = readJobs(); const index = jobs.findIndex(item => item.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: "JOB_NOT_FOUND" });
    if (jobs[index].status !== "completed" || !jobs[index].outputVideoPath || !(jobs[index].publishPlatforms || []).length) return res.status(400).json({ error: "VIDEO_NOT_READY_FOR_PUBLISH" });
    const chromePublish = jobs[index].publishMethod === "chrome";
    jobs[index] = {
      ...jobs[index],
      publishStatus: "waiting",
      publishAt: now(),
      publishResults: (jobs[index].publishResults || []).filter(item => ["scheduled", "published"].includes(item.state)),
      message: chromePublish
        ? "Đã xếp lại lịch đăng bằng Chrome. Tool sẽ mở đúng Page và chuẩn bị lại bài đăng."
        : "Đã xếp lại phần đăng bằng API bị lỗi.",
      updatedAt: now(),
    };
    writeJobs(jobs); return res.json({ queued: true, job: jobs[index] });
  });
  router.post("/jobs/:id/prepare-chrome-publish", async (req, res) => {
    const jobs = readJobs(); const index = jobs.findIndex(item => item.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: "JOB_NOT_FOUND" });
    const job = jobs[index];
    if (job.publishMethod !== "chrome") return res.status(400).json({ error: "CHROME_PUBLISH_NOT_SELECTED" });
    if (job.status !== "completed" || !job.outputVideoPath || !fs.existsSync(job.outputVideoPath)) return res.status(400).json({ error: "VIDEO_NOT_READY_FOR_PUBLISH" });
    if (!job.publishPlatforms.length) return res.status(400).json({ error: "PUBLISH_PLATFORM_REQUIRED" });
    if (!job.chromeProfilePort) return res.status(400).json({ error: "CHROME_PROFILE_REQUIRED" });
    if (job.publishPlatforms.includes("facebook") && !job.facebookPageUrl) return res.status(400).json({ error: "FACEBOOK_PAGE_REQUIRED" });

    jobs[index] = { ...job, publishStatus: "publishing", message: "Đang mở Chrome và chuẩn bị bài đăng trên các nền tảng...", updatedAt: now() };
    writeJobs(jobs);
    try {
      const thumbnailPath = await prepareThumbnailForPublish(
        job,
        findLatestThumbnail(job),
      );
      const results: PublishResult[] = [];
      const details: string[] = [];
      for (const platform of job.publishPlatforms) {
        try {
          const prepared = await prepareChromePublish(platform, {
            port: job.chromeProfilePort,
            facebookPageUrl: job.facebookPageUrl,
            youtubeChannelId: job.youtubeChannelId,
            videoPath: job.outputVideoPath,
            thumbnailPath,
            title: platform === "youtube" ? String(job.publishMetadata?.title || "") : "",
            description: platform === "youtube" ? String(job.publishMetadata?.description || "") : getFacebookCaption(job),
            tags: platform === "youtube" ? job.publishMetadata?.tags : undefined,
          });
          results.push({ platform, state: "prepared", url: prepared.pageUrl, updatedAt: now() });
          details.push(prepared.detail);
        } catch (error: any) {
          results.push({ platform, state: "failed", error: String(error?.message || "CHROME_PUBLISH_PREPARE_FAILED").slice(0, 1000), updatedAt: now() });
        }
      }
      const failed = results.filter(item => item.state === "failed");
      jobs[index] = {
        ...jobs[index], publishStatus: failed.length ? (failed.length === results.length ? "failed" : "partial") : "waiting",
        publishResults: [...(jobs[index].publishResults || []).filter(item => !job.publishPlatforms.includes(item.platform)), ...results],
        message: [...details, ...failed.map(item => `${item.platform}: ${item.error}`)].join("\n"), updatedAt: now(),
      };
      writeJobs(jobs);
      return res.status(failed.length === results.length ? 502 : 200).json({ prepared: !failed.length, requiresUserConfirmation: true, job: jobs[index] });
    } catch (error: any) {
      const errorText = String(error?.message || "CHROME_PUBLISH_PREPARE_FAILED").slice(0, 1000);
      jobs[index] = { ...jobs[index], publishStatus: "failed", message: errorText, updatedAt: now() };
      writeJobs(jobs);
      return res.status(502).json({ error: errorText, job: jobs[index] });
    }
  });

  router.get("/publishing", (_req, res) => {
    const config = readPublishing();
    return res.json({
      youtube: { connected: !!(config.youtube?.accessToken || config.youtube?.refreshToken), clientIdHint: config.youtube?.clientId ? `••••${config.youtube.clientId.slice(-8)}` : "", hasRefreshToken: !!config.youtube?.refreshToken },
      facebook: { connected: !!(config.facebook?.pageId && config.facebook?.accessToken), pageId: config.facebook?.pageId || "", graphVersion: config.facebook?.graphVersion || "v23.0" },
      tiktok: { connected: !!config.tiktok?.accessToken, privacyLevel: config.tiktok?.privacyLevel || "SELF_ONLY" },
    });
  });
  router.post("/publishing", (req, res) => {
    const previous = readPublishing(); const body = req.body || {};
    const config: PublishingConfig = {
      youtube: {
        clientId: String(body.youtube?.clientId || previous.youtube?.clientId || "").trim(),
        clientSecret: String(body.youtube?.clientSecret || previous.youtube?.clientSecret || "").trim(),
        refreshToken: String(body.youtube?.refreshToken || previous.youtube?.refreshToken || "").trim(),
        accessToken: String(body.youtube?.accessToken || previous.youtube?.accessToken || "").trim(),
      },
      facebook: {
        pageId: String(body.facebook?.pageId || previous.facebook?.pageId || "").trim(),
        accessToken: String(body.facebook?.accessToken || previous.facebook?.accessToken || "").trim(),
        graphVersion: String(body.facebook?.graphVersion || previous.facebook?.graphVersion || "v23.0").trim(),
      },
      tiktok: {
        accessToken: String(body.tiktok?.accessToken || previous.tiktok?.accessToken || "").trim(),
        privacyLevel: String(body.tiktok?.privacyLevel || previous.tiktok?.privacyLevel || "SELF_ONLY").trim(),
        disableComment: body.tiktok?.disableComment ?? previous.tiktok?.disableComment ?? true,
        disableDuet: body.tiktok?.disableDuet ?? previous.tiktok?.disableDuet ?? true,
        disableStitch: body.tiktok?.disableStitch ?? previous.tiktok?.disableStitch ?? true,
      },
    };
    writePublishing(config); return res.json({ saved: true });
  });
  router.post("/publishing/test/:platform", async (req, res) => {
    const platform = String(req.params.platform) as PublishPlatform;
    if (!["youtube", "facebook", "tiktok"].includes(platform)) return res.status(400).json({ error: "INVALID_PLATFORM" });
    try { const detail = await testPublishingConnection(platform, readPublishing()); return res.json({ connected: true, detail }); }
    catch (error: any) { return res.status(502).json({ connected: false, error: error.message || "CONNECTION_FAILED" }); }
  });

  router.get("/telegram", (_req, res) => { const config = readTelegram(); return res.json({
    enabled: config.enabled,
    allowedChatId: config.allowedChatId,
    defaultPresetId: config.defaultPresetId,
    hasToken: !!config.botToken,
    tokenHint: config.botToken ? `••••${config.botToken.slice(-6)}` : "",
    publishMethod: config.publishMethod || "chrome",
    chromeProfilePort: config.chromeProfilePort,
    youtubeChannelId: config.youtubeChannelId,
    youtubeChannelName: config.youtubeChannelName,
    facebookPageName: config.facebookPageName,
    facebookPageUrl: config.facebookPageUrl,
    youtubePublishMode: config.youtubePublishMode || "schedule",
    youtubeLeadMinutes: config.youtubeLeadMinutes || 15,
  }); });
  router.post("/telegram", (req, res) => {
    const previous = readTelegram(); const token = String(req.body?.botToken || "").trim();
    const requestedPresetId = String(req.body?.defaultPresetId || "").trim();
    const validPresetId = readPresets().some(item => item.id === requestedPresetId)
      ? requestedPresetId
      : (previous.defaultPresetId || readPresets()[0]?.id || "");
    const publishMethod: PublishMethod = req.body?.publishMethod === "api" ? "api" : "chrome";
    const chromeProfilePort = publishMethod === "chrome" && Number(req.body?.chromeProfilePort) >= 1024 && Number(req.body?.chromeProfilePort) <= 65535
      ? Number(req.body.chromeProfilePort)
      : previous.chromeProfilePort;
    const youtubeChannelId = cleanName(String(req.body?.youtubeChannelId || previous.youtubeChannelId || "")).replace(/[^A-Za-z0-9_-]/g, "");
    const youtubeChannelName = cleanName(String(req.body?.youtubeChannelName || previous.youtubeChannelName || ""));
    const facebookPageUrl = normalizeFacebookPageUrl(req.body?.facebookPageUrl || previous.facebookPageUrl || "");
    const facebookPageName = cleanName(String(req.body?.facebookPageName || previous.facebookPageName || ""));
    const youtubePublishMode: YouTubePublishMode = req.body?.youtubePublishMode === "immediate" ? "immediate" : "schedule";
    const youtubeLeadMinutes = youtubePublishMode === "schedule"
      ? Math.min(180, Math.max(5, Math.round(Number(req.body?.youtubeLeadMinutes) || Number(previous.youtubeLeadMinutes) || 15)))
      : undefined;
    const config: TelegramConfig = {
      enabled: req.body?.enabled === true,
      botToken: token || previous.botToken,
      allowedChatId: String(req.body?.allowedChatId || "").trim(),
      defaultPresetId: validPresetId,
      lastUpdateId: previous.lastUpdateId || 0,
      publishMethod,
      chromeProfilePort,
      youtubeChannelId: youtubeChannelId || undefined,
      youtubeChannelName: youtubeChannelName || undefined,
      facebookPageName: facebookPageName || undefined,
      facebookPageUrl: facebookPageUrl || undefined,
      youtubePublishMode,
      youtubeLeadMinutes,
    };
    if (config.enabled && (!config.botToken || !config.allowedChatId || !config.defaultPresetId)) return res.status(400).json({ error: "TELEGRAM_CONFIG_INCOMPLETE" });
    writeTelegram(config); return res.json({ saved: true, hasToken: !!config.botToken });
  });
  router.post("/telegram/test", async (_req, res) => {
    const config = readTelegram(); if (!config.botToken || !config.allowedChatId) return res.status(400).json({ error: "TELEGRAM_CONFIG_INCOMPLETE" });
    try { const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: config.allowedChatId, text: "✅ VidiFlow đã kết nối Telegram thành công. Hãy gửi link, ý tưởng hoặc kịch bản để tạo video." }) }); const result: any = await response.json(); if (!response.ok || !result?.ok) throw new Error(result?.description || "TELEGRAM_TEST_FAILED"); return res.json({ sent: true }); } catch (error: any) { return res.status(502).json({ error: error.message || "TELEGRAM_TEST_FAILED" }); }
  });

  const presetKeyboard = () => ({ inline_keyboard: readPresets().slice(0, 20).map(item => [{ text: item.name, callback_data: `vf:preset:${item.id}` }]) });
  const finishTelegramJob = (chatId: string, draft: TelegramDraft, publishAt?: string) => {
    try {
      const telegram = readTelegram();
      const job = createJob({
        input: draft.input,
        inputType: draft.inputType,
        presetId: draft.presetId || telegram.defaultPresetId,
        scheduledAt: draft.scheduledAt || now(),
        publishPlatforms: draft.platforms || [],
        publishAt,
        publishMethod: telegram.publishMethod || "chrome",
        chromeProfilePort: telegram.chromeProfilePort,
        youtubeChannelId: telegram.youtubeChannelId,
        youtubeChannelName: telegram.youtubeChannelName,
        facebookPageName: telegram.facebookPageName,
        facebookPageUrl: telegram.facebookPageUrl,
        youtubePublishMode: telegram.youtubePublishMode || "schedule",
        youtubeLeadMinutes: telegram.youtubeLeadMinutes || 15,
      }, "telegram", chatId);
      const drafts = readTelegramDrafts(); delete drafts[chatId]; writeTelegramDrafts(drafts);
      void notifyTelegram(chatId, `📥 <b>Đã tạo lịch sản xuất</b>\nMã: <code>${job.id}</code>\nLoại: <b>${job.inputType}</b>\nPreset: <b>${job.presetName}</b>\nTạo lúc: <b>${new Date(job.scheduledAt).toLocaleString("vi-VN")}</b>\nĐăng: <b>${job.publishPlatforms.length ? job.publishPlatforms.join(", ") : "Không tự đăng"}</b>${job.publishAt ? `\nGiờ đăng: <b>${new Date(job.publishAt).toLocaleString("vi-VN")}</b>` : ""}`);
    } catch (error: any) {
      const code = String(error?.message || "TELEGRAM_JOB_CREATE_FAILED");
      const detail = code === "FACEBOOK_PAGE_REQUIRED"
        ? "Chưa lưu Facebook Page mặc định trong cấu hình Telegram. Mở tool, chọn Page rồi bấm Lưu bot."
        : code;
      void notifyTelegram(chatId, `❌ Không thể tạo lịch tự đăng: ${detail}`);
    }
  };

  let polling = false;
  const pollTelegram = async () => {
    if (polling) return; const config = readTelegram(); if (!config.enabled || !config.botToken || !config.allowedChatId || !config.defaultPresetId) return; polling = true;
    try {
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getUpdates?timeout=1&offset=${config.lastUpdateId + 1}`, { signal: AbortSignal.timeout(5000) }); const payload: any = await response.json(); if (!payload?.ok || !Array.isArray(payload.result)) return;
      for (const update of payload.result) {
        config.lastUpdateId = Math.max(config.lastUpdateId, Number(update.update_id) || 0);
        const callback = update.callback_query; const message = update.message || update.edited_message || callback?.message;
        const chatId = String(message?.chat?.id || ""); const text = String((update.message || update.edited_message)?.text || (update.message || update.edited_message)?.caption || "").trim(); if (!chatId) continue;
        if (chatId !== config.allowedChatId) { void notifyTelegram(chatId, "⛔ Chat này chưa được cấp quyền điều khiển VidiFlow."); continue; }
        const drafts = readTelegramDrafts(); const current = drafts[chatId];
        if (callback?.data) {
          void answerTelegramCallback(String(callback.id || "")); const data = String(callback.data);
          if (data === "vf:new") { drafts[chatId] = { stage: "content" }; writeTelegramDrafts(drafts); void notifyTelegram(chatId, "Bạn muốn gửi loại nội dung nào?", { inline_keyboard: [[{ text: "Kịch bản", callback_data: "vf:type:script" }, { text: "Mô tả/ý tưởng", callback_data: "vf:type:idea" }, { text: "Link video", callback_data: "vf:type:link" }]] }); continue; }
          if (data.startsWith("vf:type:")) { drafts[chatId] = { stage: "content", inputType: data.slice(8) as AutomationJob["inputType"] }; writeTelegramDrafts(drafts); void notifyTelegram(chatId, "Gửi nội dung cho video trong một tin nhắn."); continue; }
          if (data.startsWith("vf:preset:") && current?.input) { drafts[chatId] = { ...current, stage: "create_time", presetId: data.slice(10) }; writeTelegramDrafts(drafts); void notifyTelegram(chatId, "Chọn thời gian bắt đầu tạo video:", createTimeKeyboard); continue; }
          if (data === "vf:create:now" && current?.input) { drafts[chatId] = { ...current, stage: "platforms", scheduledAt: now() }; writeTelegramDrafts(drafts); void notifyTelegram(chatId, "Chọn nền tảng đăng sau khi tạo xong:", platformKeyboard); continue; }
          if (data === "vf:create:custom" && current?.input) { drafts[chatId] = { ...current, stage: "create_time" }; writeTelegramDrafts(drafts); void notifyTelegram(chatId, "Nhập ngày giờ tạo theo dạng <code>YYYY-MM-DD HH:mm</code>."); continue; }
          if (data.startsWith("vf:platform:") && current?.input) {
            const choice = data.slice(12); const platforms = choice === "all" ? ["youtube", "facebook", "tiktok"] as PublishPlatform[] : choice === "none" ? [] : [choice as PublishPlatform];
            if (!platforms.length) { finishTelegramJob(chatId, { ...current, platforms }); continue; }
            drafts[chatId] = { ...current, stage: "publish_time", platforms }; writeTelegramDrafts(drafts); void notifyTelegram(chatId, "Nhập ngày giờ đăng <code>YYYY-MM-DD HH:mm</code>, hoặc gửi <code>ngay</code> để đăng khi render xong."); continue;
          }
        }
        if (text === "/start" || text === "/help") { void notifyTelegram(chatId, "<b>VidiFlow Production Bot</b>\nChọn loại đầu vào, preset, giờ tạo, nền tảng và giờ đăng. Tool dùng đúng setup đã lưu trong preset.", { inline_keyboard: [[{ text: "Tạo lịch video mới", callback_data: "vf:new" }]] }); continue; }
        if (text === "/new") { drafts[chatId] = { stage: "content" }; writeTelegramDrafts(drafts); void notifyTelegram(chatId, "Bạn muốn gửi loại nội dung nào?", { inline_keyboard: [[{ text: "Kịch bản", callback_data: "vf:type:script" }, { text: "Mô tả/ý tưởng", callback_data: "vf:type:idea" }, { text: "Link video", callback_data: "vf:type:link" }]] }); continue; }
        if (current?.stage === "content" && text) { drafts[chatId] = { ...current, stage: "preset", input: text, inputType: current.inputType || detectInputType(text) }; writeTelegramDrafts(drafts); void notifyTelegram(chatId, "Chọn preset sản xuất:", presetKeyboard()); continue; }
        if (current?.stage === "create_time" && text) {
          const parsed = parseTelegramDate(text);
          if (!parsed) { void notifyTelegram(chatId, "Ngày giờ chưa đúng. Ví dụ: <code>2026-07-22 20:30</code>"); continue; }
          drafts[chatId] = { ...current, stage: "platforms", scheduledAt: parsed.toISOString() };
          writeTelegramDrafts(drafts);
          void notifyTelegram(chatId, "Chọn nền tảng đăng sau khi tạo xong:", platformKeyboard);
          continue;
        }
        if (current?.stage === "publish_time" && text) {
          const parsed = text.toLowerCase() === "ngay" ? new Date() : parseTelegramDate(text);
          if (!parsed) { void notifyTelegram(chatId, "Ngày giờ chưa đúng. Ví dụ: <code>2026-07-23 08:00</code>, hoặc gửi <code>ngay</code>."); continue; }
          finishTelegramJob(chatId, current, parsed.toISOString());
          continue;
        }
        let scheduledAt = now(); let input = text; const scheduled = text.match(/^\/schedule\s+([^\n]+)\n([\s\S]+)$/i);
        if (scheduled) {
          const parsed = parseTelegramDate(scheduled[1]);
          if (!parsed) { void notifyTelegram(chatId, "Ngày giờ chưa đúng. Ví dụ: <code>/schedule 2026-07-23 08:00\nNội dung video</code>"); continue; }
          scheduledAt = parsed.toISOString();
          input = scheduled[2].trim();
        }
        try { const job = createJob({ input, presetId: config.defaultPresetId, scheduledAt }, "telegram", chatId); void notifyTelegram(chatId, `📥 <b>Đã nhận yêu cầu</b>\nMã: <code>${job.id}</code>\nLoại: <b>${job.inputType}</b>\nPreset: <b>${job.presetName}</b>\nChạy lúc: <b>${new Date(job.scheduledAt).toLocaleString("vi-VN")}</b>`); } catch (error: any) { void notifyTelegram(chatId, `❌ Không thể tạo tác vụ: ${error.message || "Dữ liệu không hợp lệ"}`); }
      }
      writeTelegram(config);
    } catch {} finally { polling = false; }
  };
  const timer = setInterval(() => { void pollTelegram(); }, 5000); timer.unref();

  let publishing = false;
  const youtubeProcessingLeadMs = (job: AutomationJob) =>
    (job.youtubePublishMode === "immediate"
      ? 0
      : Math.min(180, Math.max(5, Number(job.youtubeLeadMinutes) || 15))) *
    60 *
    1000;
  const publishWorkerDueAt = (job: AutomationJob) => {
    if (!job.publishAt) return 0;
    const publishAtMs = new Date(job.publishAt).getTime();
    const youtubeAlreadyQueued = (job.publishResults || []).some(item => item.platform === "youtube" && ["scheduled", "published"].includes(item.state));
    return job.publishMethod === "chrome" && job.publishPlatforms.includes("youtube") && !youtubeAlreadyQueued
      ? publishAtMs - youtubeProcessingLeadMs(job)
      : publishAtMs;
  };
  const processPublishingQueue = async () => {
    if (publishing) return;
    publishing = true;
    try {
      const jobs = readJobs();
      const index = jobs.findIndex(job =>
        job.status === "completed" &&
        job.publishStatus === "waiting" &&
        !!job.outputVideoPath &&
        !(job.publishMethod === "chrome" && (job.publishResults || []).some(item => item.state === "prepared")) &&
        publishWorkerDueAt(job) <= Date.now(),
      );
      if (index < 0) return;
      const job = jobs[index];
      if (!job.outputVideoPath || !fs.existsSync(job.outputVideoPath)) {
        jobs[index] = { ...job, publishStatus: "failed", message: "Không tìm thấy file video hoàn chỉnh để đăng.", updatedAt: now() };
        writeJobs(jobs);
        return;
      }
      if (job.publishMethod === "chrome") {
        if (!job.chromeProfilePort || (job.publishPlatforms.includes("facebook") && !job.facebookPageUrl)) {
          jobs[index] = {
            ...job,
            publishStatus: "failed",
            message: !job.chromeProfilePort ? "Chưa có hồ sơ Chrome Publisher." : "Chưa chọn Facebook Page cho lịch đăng.",
            updatedAt: now(),
          };
          writeJobs(jobs);
          return;
        }
        jobs[index] = {
          ...job,
          publishStatus: "publishing",
          message: "Đến giờ đăng: đang mở Chrome và tải video lên các nền tảng...",
          updatedAt: now(),
        };
        writeJobs(jobs);
        const thumbnailPath = await prepareThumbnailForPublish(
          job,
          findLatestThumbnail(job),
        );
        let results = [...(job.publishResults || [])];
        const details: string[] = [];
        for (const platform of job.publishPlatforms) {
          if (results.some(item => item.platform === platform && ["scheduled", "published"].includes(item.state))) continue;
          const platformDueAt = !job.publishAt
            ? 0
            : new Date(job.publishAt).getTime() - (platform === "youtube" ? youtubeProcessingLeadMs(job) : 0);
          if (platformDueAt > Date.now()) continue;
          try {
            const published = await prepareChromePublish(platform, {
              port: job.chromeProfilePort,
              facebookPageUrl: job.facebookPageUrl,
              youtubeChannelId: job.youtubeChannelId,
              videoPath: job.outputVideoPath,
              thumbnailPath,
              title: platform === "youtube" ? String(job.publishMetadata?.title || "") : "",
              description: platform === "youtube" ? String(job.publishMetadata?.description || "") : getFacebookCaption(job),
              tags: platform === "youtube" ? job.publishMetadata?.tags : undefined,
              scheduledPublishAt:
                platform === "youtube" && job.youtubePublishMode !== "immediate"
                  ? job.publishAt
                  : undefined,
              autoSubmit: true,
              headless: true,
              closeWhenDone: true,
            });
            results = results.filter(item => item.platform !== platform);
            results.push({ platform, state: published.state, url: published.pageUrl, updatedAt: now() });
            details.push(published.detail);
          } catch (error: any) {
            const errorText = String(error?.message || "CHROME_PUBLISH_PREPARE_FAILED").slice(0, 1000);
            results = results.filter(item => item.platform !== platform);
            results.push({ platform, state: "failed", error: errorText, updatedAt: now() });
            details.push(`${platform}: ${errorText}`);
          }
        }
        const completedCount = results.filter(item => job.publishPlatforms.includes(item.platform) && ["scheduled", "published"].includes(item.state)).length;
        const failedCount = results.filter(item => job.publishPlatforms.includes(item.platform) && item.state === "failed").length;
        const pendingCount = Math.max(0, job.publishPlatforms.length - completedCount - failedCount);
        const latest = readJobs();
        const latestIndex = latest.findIndex(item => item.id === job.id);
        if (latestIndex >= 0) {
          latest[latestIndex] = {
            ...latest[latestIndex],
            publishStatus: completedCount === job.publishPlatforms.length
              ? "published"
              : failedCount > 0
                ? (completedCount ? "partial" : "failed")
                : pendingCount > 0
                  ? "waiting"
                  : "failed",
            publishResults: results,
            message: details.length ? details.join("\n") : latest[latestIndex].message,
            updatedAt: now(),
          };
          writeJobs(latest);
        }
        return;
      }
      jobs[index] = { ...job, publishStatus: "publishing", message: "Đang đăng video lên các nền tảng đã chọn...", updatedAt: now() };
      writeJobs(jobs);
      const config = readPublishing();
      const results = [...(job.publishResults || [])];
      for (const platform of job.publishPlatforms || []) {
        if (results.some(item => item.platform === platform && item.state === "published")) continue;
        try {
          const published = await publishVideo(platform, job.outputVideoPath, job.publishMetadata || {}, config);
          results.push({ platform, state: "published", id: published.id, url: published.url, updatedAt: now() });
        } catch (error: any) {
          results.push({ platform, state: "failed", error: String(error?.message || "PUBLISH_FAILED").slice(0, 1000), updatedAt: now() });
        }
      }
      const successCount = results.filter(item => item.state === "published").length;
      const failedCount = results.filter(item => item.state === "failed").length;
      const publishStatus: PublishStatus = successCount === job.publishPlatforms.length ? "published" : successCount ? "partial" : "failed";
      const latest = readJobs(); const latestIndex = latest.findIndex(item => item.id === job.id);
      if (latestIndex >= 0) {
        latest[latestIndex] = { ...latest[latestIndex], publishStatus, publishResults: results, message: `Đăng thành công ${successCount}/${job.publishPlatforms.length} nền tảng${failedCount ? `, lỗi ${failedCount}` : ""}.`, updatedAt: now() };
        writeJobs(latest);
      }
      if (job.telegramChatId) {
        const details = results.map(item => `${["scheduled", "published"].includes(item.state) ? "✅" : "❌"} ${item.platform}${item.state === "scheduled" ? " (đã lên lịch)" : ""}${item.url ? `: ${item.url}` : item.error ? `: ${item.error}` : ""}`).join("\n");
        void notifyTelegram(job.telegramChatId, `📣 <b>Kết quả đăng video</b>\nMã: <code>${job.id}</code>\n${details}`);
      }
    } catch (error) {
      console.error("Automation publishing worker failed:", error);
    } finally {
      publishing = false;
    }
  };
  const publishingTimer = setInterval(() => { void processPublishingQueue(); }, 10000); publishingTimer.unref();
  return router;
}
