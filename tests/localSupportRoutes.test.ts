import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createLocalSupportRouter } from "../src/server/routes/localSupportRoutes.js";
import { enqueueDiagnostic } from "../src/server/services/diagnosticQueueService.js";

async function withServer(directory: string, queueFile: string, run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use("/api/support", createLocalSupportRouter({ appVersion: "2.3.1-test", dataDirectory: directory, diagnosticsQueueFile: queueFile, buildSystemInfo: () => ({ marker: "local-only" }) }));
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

async function jsonRequest(baseUrl: string, pathname: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  return { response, body: await response.json() };
}

test("local support router exposes system info and manages queued diagnostics", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "vidiflow-support-router-"));
  const queueFile = path.join(directory, "diagnostics-pending.jsonl");
  try {
    enqueueDiagnostic(queueFile, { id: "queued-report", note: "safe" });
    await withServer(directory, queueFile, async (baseUrl) => {
      const system = await jsonRequest(baseUrl, "/api/support/system-info");
      assert.equal(system.response.status, 200);
      assert.deepEqual(system.body, { ok: true, system: { marker: "local-only" } });
      const exported = await jsonRequest(baseUrl, "/api/support/diagnostics/export");
      assert.equal(exported.body.reports[0].id, "queued-report");
      assert.match(exported.response.headers.get("content-disposition") || "", /VidiFlow-diagnostics-/);
      const cleared = await jsonRequest(baseUrl, "/api/support/diagnostics/queued", { method: "DELETE" });
      assert.deepEqual(cleared.body, { ok: true, cleared: 1 });
      assert.equal(fs.existsSync(queueFile), false);
    });
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("local support router rejects an invalid settings restore", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "vidiflow-support-restore-"));
  try {
    await withServer(directory, path.join(directory, "diagnostics.jsonl"), async (baseUrl) => {
      const restored = await jsonRequest(baseUrl, "/api/support/settings-restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ backup: null }) });
      assert.equal(restored.response.status, 400);
      assert.equal(restored.body.ok, false);
      assert.equal(typeof restored.body.error, "string");
    });
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
