import path from "node:path";

export type LocalRequestHeaders = {
  host?: string | null;
  origin?: string | null;
  fetchSite?: string | null;
};

export type LocalRequestDecision =
  | { allowed: true }
  | {
      allowed: false;
      code:
        | "LOCAL_HOST_BLOCKED"
        | "LOCAL_ORIGIN_BLOCKED"
        | "LOCAL_CROSS_SITE_BLOCKED";
    };

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export const LOCAL_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const parseLocalUrl = (host: string) => {
  try {
    return new URL("http://" + host);
  } catch {
    return null;
  }
};

export const isLoopbackHostname = (hostname: string) =>
  LOOPBACK_HOSTS.has(String(hostname || "").trim().toLowerCase());

export function validateLocalRequest(
  headers: LocalRequestHeaders,
): LocalRequestDecision {
  const hostUrl = parseLocalUrl(String(headers.host || ""));
  if (!hostUrl || !isLoopbackHostname(hostUrl.hostname)) {
    return { allowed: false, code: "LOCAL_HOST_BLOCKED" };
  }

  if (String(headers.fetchSite || "").toLowerCase() === "cross-site") {
    return { allowed: false, code: "LOCAL_CROSS_SITE_BLOCKED" };
  }

  const rawOrigin = String(headers.origin || "").trim();
  if (!rawOrigin) return { allowed: true };
  if (rawOrigin.toLowerCase() === "null") {
    return { allowed: false, code: "LOCAL_ORIGIN_BLOCKED" };
  }

  try {
    const origin = new URL(rawOrigin);
    if (
      !["http:", "https:"].includes(origin.protocol) ||
      !isLoopbackHostname(origin.hostname) ||
      origin.port !== hostUrl.port
    ) {
      return { allowed: false, code: "LOCAL_ORIGIN_BLOCKED" };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, code: "LOCAL_ORIGIN_BLOCKED" };
  }
}

const LOCAL_MEDIA_EXTENSIONS = new Set([
  ".aac",
  ".ass",
  ".avi",
  ".avif",
  ".bmp",
  ".flac",
  ".gif",
  ".jpeg",
  ".jpg",
  ".m4a",
  ".m4v",
  ".mkv",
  ".mov",
  ".mp3",
  ".mp4",
  ".ogg",
  ".opus",
  ".png",
  ".srt",
  ".vtt",
  ".wav",
  ".webm",
  ".webp",
]);

export function resolveAllowedLocalMediaPath(rawPath: string) {
  const value = String(rawPath || "").trim();
  if (!value || value.includes("\0") || !path.isAbsolute(value)) {
    throw new Error("LOCAL_MEDIA_PATH_INVALID");
  }
  const resolved = path.resolve(value);
  if (!LOCAL_MEDIA_EXTENSIONS.has(path.extname(resolved).toLowerCase())) {
    throw new Error("LOCAL_MEDIA_TYPE_NOT_ALLOWED");
  }
  return resolved;
}

export function isSupportedImageContent(
  mimeType: string,
  content: Uint8Array,
) {
  const mime = String(mimeType || "").toLowerCase();
  if (mime === "image/png") {
    return (
      content.length >= 8 &&
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
        (value, index) => content[index] === value,
      )
    );
  }
  if (mime === "image/jpeg") {
    return (
      content.length >= 3 &&
      content[0] === 0xff &&
      content[1] === 0xd8 &&
      content[2] === 0xff
    );
  }
  if (mime === "image/webp") {
    return (
      content.length >= 12 &&
      String.fromCharCode(...content.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...content.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}
