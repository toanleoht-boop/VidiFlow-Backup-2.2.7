import crypto from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,80}$/;

export const normalizeRequestId = (value: unknown): string => {
  const candidate = String(value || "").trim();
  return SAFE_REQUEST_ID.test(candidate) ? candidate : crypto.randomUUID();
};

export const requestContextMiddleware: RequestHandler = (req, res, next) => {
  const requestId = normalizeRequestId(req.get("x-request-id"));
  res.locals.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};

export const apiErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const requestId = normalizeRequestId(res.locals.requestId);
  res.setHeader("X-Request-ID", requestId);

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      code: "PAYLOAD_TOO_LARGE",
      error: "Tệp hoặc nội dung tải lên vượt quá giới hạn an toàn.",
      requestId,
    });
  }

  const method = String(req.method || "UNKNOWN").slice(0, 12);
  const pathname = String(req.path || "/").slice(0, 240);
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(`[API_ERROR] requestId=${requestId} method=${method} path=${pathname} type=${errorName}`);
  return res.status(500).json({
    success: false,
    code: "INTERNAL_API_ERROR",
    error: "VidiFlow gặp lỗi nội bộ. Hãy cung cấp mã sự cố cho bộ phận hỗ trợ.",
    requestId,
  });
};
