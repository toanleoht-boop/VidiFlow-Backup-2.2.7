import express, { type Router } from "express";
import { clearDiagnosticQueue, readQueuedDiagnostics } from "../services/diagnosticQueueService.js";
import { createSettingsBackup, restoreSettingsBackup } from "../services/settingsBackupService.js";

export type LocalSupportRouterOptions = {
  appVersion: string;
  dataDirectory: string;
  diagnosticsQueueFile: string;
  buildSystemInfo: () => unknown;
};

/**
 * Local-only support operations. This router deliberately contains no remote
 * transport, credentials or installation tokens.
 */
export function createLocalSupportRouter(options: LocalSupportRouterOptions): Router {
  const router = express.Router();

  router.get("/system-info", (_req, res) => {
    return res.json({ ok: true, system: options.buildSystemInfo() });
  });

  router.get("/settings-backup", (_req, res) => {
    try {
      const backup = createSettingsBackup(options.dataDirectory, options.appVersion);
      const stamp = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Disposition", `attachment; filename="VidiFlow-settings-${stamp}.json"`);
      return res.json(backup);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "SETTINGS_BACKUP_FAILED";
      return res.status(500).json({ ok: false, error: message });
    }
  });

  router.post("/settings-restore", (req, res) => {
    try {
      const result = restoreSettingsBackup(options.dataDirectory, req.body?.backup);
      return res.json({ ok: true, ...result, reloadRequired: true });
    } catch (error: unknown) {
      const code = error instanceof Error ? error.message : "SETTINGS_RESTORE_FAILED";
      return res.status(400).json({ ok: false, error: code });
    }
  });

  router.get("/diagnostics/export", (_req, res) => {
    const reports = readQueuedDiagnostics(options.diagnosticsQueueFile);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Disposition", `attachment; filename="VidiFlow-diagnostics-${stamp}.json"`);
    return res.json({
      schemaVersion: 1,
      product: "vidiflow-oneclick",
      exportedAt: new Date().toISOString(),
      reports,
    });
  });

  router.delete("/diagnostics/queued", (_req, res) => {
    return res.json({ ok: true, cleared: clearDiagnosticQueue(options.diagnosticsQueueFile) });
  });

  return router;
}
