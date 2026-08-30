import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createSettingsBackup, restoreSettingsBackup } from "../src/server/services/settingsBackupService.js";

const tempDirectory = () => fs.mkdtempSync(path.join(os.tmpdir(), "vidiflow-settings-test-"));

test("settings backup includes only the explicit safe allowlist", () => {
  const directory = tempDirectory();
  try {
    fs.writeFileSync(path.join(directory, "automation-default.json"), JSON.stringify({ chromeThreads: 7 }));
    fs.writeFileSync(path.join(directory, "secrets.env"), "GEMINI_API_KEY=must-not-leak");
    fs.writeFileSync(path.join(directory, "license.json"), JSON.stringify({ key: "must-not-leak" }));
    const backup = createSettingsBackup(directory, "2.3.1");
    assert.deepEqual(backup.files["automation-default.json"], { chromeThreads: 7 });
    assert.equal("secrets.env" in backup.files, false);
    assert.equal("license.json" in backup.files, false);
    assert.doesNotMatch(JSON.stringify(backup), /must-not-leak/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("settings restore snapshots existing files and rejects unknown files", () => {
  const directory = tempDirectory();
  try {
    fs.writeFileSync(path.join(directory, "style-library.json"), JSON.stringify({ customStyles: [{ name: "Old" }] }));
    const result = restoreSettingsBackup(directory, {
      schemaVersion: 1,
      product: "vidiflow-oneclick",
      appVersion: "2.3.1",
      exportedAt: new Date().toISOString(),
      files: { "style-library.json": { customStyles: [{ name: "New" }] } },
    });
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, "style-library.json"), "utf8")), { customStyles: [{ name: "New" }] });
    assert.ok(result.snapshotDirectory);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(result.snapshotDirectory!, "style-library.json"), "utf8")), { customStyles: [{ name: "Old" }] });
    assert.throws(() => restoreSettingsBackup(directory, {
      schemaVersion: 1,
      product: "vidiflow-oneclick",
      files: { "secrets.env": { key: "no" } },
    }), /SETTINGS_FILE_NOT_ALLOWED/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
