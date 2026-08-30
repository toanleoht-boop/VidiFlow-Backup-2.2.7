import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { countQueuedDiagnostics, enqueueDiagnostic, flushDiagnosticQueue } from "../src/server/services/diagnosticQueueService.js";

const queueFixture = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "vidiflow-diagnostics-test-"));
  return { directory, file: path.join(directory, "diagnostics-pending.jsonl") };
};

test("diagnostic queue persists reports and removes only delivered items", async () => {
  const fixture = queueFixture();
  try {
    enqueueDiagnostic(fixture.file, { id: "first", note: "one" });
    enqueueDiagnostic(fixture.file, { id: "second", note: "two" });
    assert.equal(countQueuedDiagnostics(fixture.file), 2);
    const result = await flushDiagnosticQueue(fixture.file, async (payload) => payload.id === "first");
    assert.deepEqual(result, { sent: 1, remaining: 1, attempted: 2 });
    assert.equal(countQueuedDiagnostics(fixture.file), 1);
    const remaining = fs.readFileSync(fixture.file, "utf8");
    assert.match(remaining, /second/);
    assert.doesNotMatch(remaining, /first/);
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("diagnostic queue removes its file after every report is delivered", async () => {
  const fixture = queueFixture();
  try {
    enqueueDiagnostic(fixture.file, { id: "only" });
    const result = await flushDiagnosticQueue(fixture.file, async () => true);
    assert.equal(result.sent, 1);
    assert.equal(result.remaining, 0);
    assert.equal(fs.existsSync(fixture.file), false);
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("diagnostic queue rejects oversized payloads", () => {
  const fixture = queueFixture();
  try {
    assert.throws(() => enqueueDiagnostic(fixture.file, { note: "x".repeat(20_000) }), /DIAGNOSTIC_PAYLOAD_TOO_LARGE/);
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});
