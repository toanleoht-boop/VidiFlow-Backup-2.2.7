import fs from "fs";
import path from "path";

export type PublishPlatform = "youtube" | "facebook" | "tiktok";
export type PublishMetadata = {
  title?: string;
  description?: string;
  tags?: string[];
  privacy?: "public" | "private" | "unlisted";
};

export type PublishingConfig = {
  youtube?: { clientId?: string; clientSecret?: string; refreshToken?: string; accessToken?: string };
  facebook?: { pageId?: string; accessToken?: string; graphVersion?: string };
  tiktok?: { accessToken?: string; privacyLevel?: string; disableComment?: boolean; disableDuet?: boolean; disableStitch?: boolean };
};

const jsonHeaders = { "Content-Type": "application/json; charset=UTF-8" };

async function parseResponse(response: Response) {
  const text = await response.text();
  let payload: any = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { raw: text }; }
  if (!response.ok) throw new Error(payload?.error?.message || payload?.error?.code || payload?.message || `HTTP_${response.status}`);
  return payload;
}

async function youtubeAccessToken(config: PublishingConfig["youtube"]) {
  if (config?.refreshToken && config.clientId && config.clientSecret) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const payload = await parseResponse(response);
    if (payload.access_token) return String(payload.access_token);
  }
  if (config?.accessToken) return config.accessToken;
  throw new Error("YOUTUBE_NOT_CONNECTED");
}

async function uploadYouTube(videoPath: string, metadata: PublishMetadata, config: PublishingConfig["youtube"]) {
  const accessToken = await youtubeAccessToken(config);
  const size = fs.statSync(videoPath).size;
  const privacyStatus = metadata.privacy || "private";
  const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(size),
      "X-Upload-Content-Type": "video/mp4",
    },
    body: JSON.stringify({
      snippet: {
        title: (metadata.title || path.basename(videoPath, path.extname(videoPath))).slice(0, 100),
        description: metadata.description || "",
        tags: metadata.tags || [],
        categoryId: "22",
      },
      status: { privacyStatus, selfDeclaredMadeForKids: false },
    }),
  });
  if (!init.ok) await parseResponse(init);
  const uploadUrl = init.headers.get("location");
  if (!uploadUrl) throw new Error("YOUTUBE_UPLOAD_URL_MISSING");
  const uploaded = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(size) },
    body: fs.createReadStream(videoPath),
    duplex: "half",
  } as any);
  const payload = await parseResponse(uploaded);
  return { id: String(payload.id || ""), url: payload.id ? `https://youtu.be/${payload.id}` : "", state: "published" };
}

async function uploadFacebook(videoPath: string, metadata: PublishMetadata, config: PublishingConfig["facebook"]) {
  if (!config?.pageId || !config.accessToken) throw new Error("FACEBOOK_NOT_CONNECTED");
  const graphVersion = config.graphVersion || "v23.0";
  const form = new FormData();
  form.set("access_token", config.accessToken);
  form.set("title", (metadata.title || path.basename(videoPath, path.extname(videoPath))).slice(0, 255));
  form.set("description", metadata.description || "");
  form.set("published", "true");
  form.set("source", new Blob([await fs.promises.readFile(videoPath)], { type: "video/mp4" }), path.basename(videoPath));
  const response = await fetch(`https://graph-video.facebook.com/${graphVersion}/${encodeURIComponent(config.pageId)}/videos`, { method: "POST", body: form });
  const payload = await parseResponse(response);
  return { id: String(payload.id || ""), url: payload.id ? `https://www.facebook.com/${payload.id}` : "", state: "submitted" };
}

async function uploadTikTok(videoPath: string, metadata: PublishMetadata, config: PublishingConfig["tiktok"]) {
  if (!config?.accessToken) throw new Error("TIKTOK_NOT_CONNECTED");
  const size = fs.statSync(videoPath).size;
  const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: { ...jsonHeaders, Authorization: `Bearer ${config.accessToken}` },
    body: JSON.stringify({
      post_info: {
        title: `${metadata.title || path.basename(videoPath, path.extname(videoPath))}${metadata.description ? `\n${metadata.description}` : ""}`.slice(0, 2200),
        privacy_level: config.privacyLevel || "SELF_ONLY",
        disable_comment: config.disableComment !== false,
        disable_duet: config.disableDuet !== false,
        disable_stitch: config.disableStitch !== false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 },
    }),
  });
  const initPayload = await parseResponse(initResponse);
  const uploadUrl = initPayload?.data?.upload_url;
  const publishId = initPayload?.data?.publish_id;
  if (!uploadUrl || !publishId) throw new Error("TIKTOK_UPLOAD_URL_MISSING");
  const uploaded = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(size), "Content-Range": `bytes 0-${size - 1}/${size}` },
    body: fs.createReadStream(videoPath),
    duplex: "half",
  } as any);
  if (!uploaded.ok) await parseResponse(uploaded);
  return { id: String(publishId), url: "", state: "submitted" };
}

export async function publishVideo(platform: PublishPlatform, videoPath: string, metadata: PublishMetadata, config: PublishingConfig) {
  if (!fs.existsSync(videoPath) || !fs.statSync(videoPath).isFile()) throw new Error("VIDEO_FILE_NOT_FOUND");
  if (platform === "youtube") return uploadYouTube(videoPath, metadata, config.youtube);
  if (platform === "facebook") return uploadFacebook(videoPath, metadata, config.facebook);
  return uploadTikTok(videoPath, metadata, config.tiktok);
}

export async function testPublishingConnection(platform: PublishPlatform, config: PublishingConfig) {
  if (platform === "youtube") {
    const token = await youtubeAccessToken(config.youtube);
    return parseResponse(await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${token}` } }));
  }
  if (platform === "facebook") {
    const item = config.facebook;
    if (!item?.pageId || !item.accessToken) throw new Error("FACEBOOK_NOT_CONNECTED");
    return parseResponse(await fetch(`https://graph.facebook.com/${item.graphVersion || "v23.0"}/${encodeURIComponent(item.pageId)}?fields=id,name&access_token=${encodeURIComponent(item.accessToken)}`));
  }
  const item = config.tiktok;
  if (!item?.accessToken) throw new Error("TIKTOK_NOT_CONNECTED");
  return parseResponse(await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", { headers: { Authorization: `Bearer ${item.accessToken}` } }));
}
