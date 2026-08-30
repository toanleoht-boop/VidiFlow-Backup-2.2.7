import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import { apiErrorHandler, requestContextMiddleware } from "../src/server/middleware/requestContext.js";

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(requestContextMiddleware);
  app.use(express.json({ limit: "16b" }));
  app.get("/ok", (_req, res) => res.json({ ok: true }));
  app.get("/error", () => { throw new Error("secret internal detail"); });
  app.use(apiErrorHandler);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test("request context preserves a safe correlation ID", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/ok`, { headers: { "X-Request-ID": "customer-case-1234" } });
    assert.equal(response.headers.get("x-request-id"), "customer-case-1234");
  });
});

test("request context replaces unsafe IDs and redacts internal errors", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/error`, { headers: { "X-Request-ID": "bad id with spaces" } });
    const payload = await response.json();
    assert.equal(response.status, 500);
    assert.equal(payload.code, "INTERNAL_API_ERROR");
    assert.equal(payload.requestId, response.headers.get("x-request-id"));
    assert.doesNotMatch(JSON.stringify(payload), /secret internal detail/);
  });
});

test("payload errors include the same request ID", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/ok`, { method: "POST", headers: { "Content-Type": "application/json", "X-Request-ID": "payload-case-1234" }, body: JSON.stringify({ value: "too large" }) });
    const payload = await response.json();
    assert.equal(response.status, 413);
    assert.equal(payload.code, "PAYLOAD_TOO_LARGE");
    assert.equal(payload.requestId, "payload-case-1234");
  });
});
