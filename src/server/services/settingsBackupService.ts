import fs from "node:fs";
import path from "node:path";

export const SETTINGS_BACKUP_FILE_NAMES = [
  "automation-default.json",
  "automation-presets.json",
  "style-library.json",
  "background-music-history.json",
] as const;

export type SettingsBackupFileName = (typeof SETTINGS_BACKUP_FILE_NAMES)[number];
export type SettingsBackup = {
  schemaVersion: 1;
  product: "vidiflow-oneclick";
  appVersion: string;
  exportedAt: string;
  files: Partial<Record<SettingsBackupFileName, unknown>>;
  clientSettings?: Record<string, string>;
};

const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const readJson = (filePath: string): unknown =>
  JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));

export const getSettingsFileStatus = (dataDirectory: string) =>
  SETTINGS_BACKUP_FILE_NAMES.map((name) => {
    const filePath = path.join(dataDirectory, name);
    if (!fs.existsSync(filePath)) return { name, ready: false, bytes: 0, updatedAt: null };
    const stat = fs.statSync(filePath);
    return { name, ready: stat.isFile(), bytes: stat.size, updatedAt: stat.mtime.toISOString() };
  });

export const createSettingsBackup = (dataDirectory: string, appVersion: string): SettingsBackup => {
  const files: SettingsBackup["files"] = {};
  for (const name of SETTINGS_BACKUP_FILE_NAMES) {
    const filePath = path.join(dataDirectory, name);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) continue;
    const value = readJson(filePath);
    const serialized = JSON.stringify(value);
    if (Buffer.byteLength(serialized, "utf8") > MAX_FILE_BYTES) throw new Error(`SETTINGS_FILE_TOO_LARGE:${name}`);
    files[name] = value;
  }
  return {
    schemaVersion: 1,
    product: "vidiflow-oneclick",
    appVersion,
    exportedAt: new Date().toISOString(),
    files,
  };
};

const assertValidBackup = (input: unknown): SettingsBackup => {
  const serialized = JSON.stringify(input);
  if (Buffer.byteLength(serialized, "utf8") > MAX_BACKUP_BYTES) throw new Error("SETTINGS_BACKUP_TOO_LARGE");
  const backup = input as Partial<SettingsBackup> | null;
  if (backup?.schemaVersion !== 1 || backup.product !== "vidiflow-oneclick" || !backup.files || typeof backup.files !== "object" || Array.isArray(backup.files)) {
    throw new Error("SETTINGS_BACKUP_INVALID");
  }
  for (const [name, value] of Object.entries(backup.files)) {
    if (!SETTINGS_BACKUP_FILE_NAMES.includes(name as SettingsBackupFileName)) throw new Error(`SETTINGS_FILE_NOT_ALLOWED:${name}`);
    if (value === null || typeof value !== "object") throw new Error(`SETTINGS_FILE_INVALID:${name}`);
    if (Buffer.byteLength(JSON.stringify(value), "utf8") > MAX_FILE_BYTES) throw new Error(`SETTINGS_FILE_TOO_LARGE:${name}`);
  }
  return backup as SettingsBackup;
};

export const restoreSettingsBackup = (dataDirectory: string, input: unknown) => {
  const backup = assertValidBackup(input);
  fs.mkdirSync(dataDirectory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotDirectory = path.join(dataDirectory, "backups", `settings-before-restore-${stamp}`);
  const restoredFiles: string[] = [];

  for (const name of SETTINGS_BACKUP_FILE_NAMES) {
    if (!(name in backup.files)) continue;
    const target = path.join(dataDirectory, name);
    if (fs.existsSync(target)) {
      fs.mkdirSync(snapshotDirectory, { recursive: true });
      fs.copyFileSync(target, path.join(snapshotDirectory, name));
    }
    const temporary = `${target}.restore-${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(backup.files[name], null, 2), "utf8");
    fs.renameSync(temporary, target);
    restoredFiles.push(name);
  }

  if (!restoredFiles.length) throw new Error("SETTINGS_BACKUP_EMPTY");
  return {
    restoredFiles,
    snapshotDirectory: fs.existsSync(snapshotDirectory) ? snapshotDirectory : null,
    exportedAt: backup.exportedAt || null,
    sourceVersion: backup.appVersion || null,
  };
};
