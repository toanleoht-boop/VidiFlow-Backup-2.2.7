import fs from "node:fs";
import path from "node:path";

export type DiagnosticPayload = Record<string, unknown>;
const MAX_QUEUE_ITEMS = 200;
const MAX_ITEM_BYTES = 16 * 1024;

const readQueue = (queueFile: string): DiagnosticPayload[] => {
  try {
    return fs.readFileSync(queueFile, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        try {
          const item = JSON.parse(line);
          if (!item || typeof item !== "object" || Array.isArray(item)) return null;
          if (Buffer.byteLength(JSON.stringify(item), "utf8") > MAX_ITEM_BYTES) return null;
          return item as DiagnosticPayload;
        } catch {
          return null;
        }
      })
      .filter((item): item is DiagnosticPayload => Boolean(item));
  } catch {
    return [];
  }
};

const writeQueue = (queueFile: string, items: DiagnosticPayload[]) => {
  if (!items.length) {
    try { fs.unlinkSync(queueFile); } catch {}
    return;
  }
  fs.mkdirSync(path.dirname(queueFile), { recursive: true });
  const temporary = `${queueFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${items.map((item) => JSON.stringify(item)).join("\n")}\n`, "utf8");
  fs.renameSync(temporary, queueFile);
};

export const readQueuedDiagnostics = (queueFile: string) => readQueue(queueFile);
export const countQueuedDiagnostics = (queueFile: string) => readQueue(queueFile).length;
export const clearDiagnosticQueue = (queueFile: string) => {
  const count = readQueue(queueFile).length;
  try { fs.unlinkSync(queueFile); } catch {}
  return count;
};

export const enqueueDiagnostic = (queueFile: string, payload: DiagnosticPayload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("DIAGNOSTIC_PAYLOAD_INVALID");
  if (Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_ITEM_BYTES) throw new Error("DIAGNOSTIC_PAYLOAD_TOO_LARGE");
  const queue = readQueue(queueFile);
  const next = [...queue.slice(-(MAX_QUEUE_ITEMS - 1)), payload];
  writeQueue(queueFile, next);
  return next.length;
};

export const flushDiagnosticQueue = async (
  queueFile: string,
  sender: (payload: DiagnosticPayload) => Promise<boolean>,
  limit = 20,
) => {
  const queue = readQueue(queueFile);
  const remaining: DiagnosticPayload[] = [];
  let sent = 0;
  const boundedLimit = Math.max(1, Math.min(50, Math.floor(limit) || 20));
  for (let index = 0; index < queue.length; index += 1) {
    const payload = queue[index];
    if (index >= boundedLimit) {
      remaining.push(payload);
      continue;
    }
    try {
      if (await sender(payload)) sent += 1;
      else remaining.push(payload);
    } catch {
      remaining.push(payload);
    }
  }
  writeQueue(queueFile, remaining);
  return { sent, remaining: remaining.length, attempted: Math.min(queue.length, boundedLimit) };
};
