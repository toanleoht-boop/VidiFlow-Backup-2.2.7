import React, { useEffect, useRef, useState } from "react";
import { ArchiveRestore, CheckCircle2, Download, FileJson, HardDrive, LifeBuoy, Loader2, RefreshCw, Send, ShieldCheck, Trash2, Upload, X } from "lucide-react";

type SystemInfo = {
  appVersion: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  uptimeSeconds: number;
  desktopMode: boolean;
  dataDirectory: string;
  license: { active: boolean; plan: string; expiresAt?: string | null; lastVerifiedAt?: string | null; offlineGraceRemainingHours?: number };
  providers: { gemini: boolean; ai33: boolean; viettheo: boolean; apiSource: string };
  updateSecurity: { signedUpdatesRequired: boolean; trustedPublisherConfigured: boolean };
  settingsFiles: Array<{ name: string; ready: boolean; bytes: number; updatedAt: string | null }>;
  pendingDiagnostics: number;
};

type SettingsBackup = {
  schemaVersion: number;
  product: string;
  appVersion?: string;
  exportedAt?: string;
  files: Record<string, unknown>;
  clientSettings?: Record<string, string>;
};

const SAFE_CLIENT_SETTING_KEYS = [
  "cc_soundEnabled",
  "cc_themeMode",
  "cc_characterProfiles_v1",
  "cc_characterDescription",
  "cc_selectedStyle_v2",
  "cc_savedStyles_v2",
  "imageStyle",
  "scenesCount",
  "promptsPerScene",
  "useDialogueSplit",
  "dialogueGroupSize",
  "promptsFocus",
  "isHighDensity",
  "targetPromptsCount",
  "selectedVoice",
  "autoSteps",
  "autoHookStyle",
  "automation_full_config_v1",
  "automation_easy_profile_v1",
  "automation_selected_preset_v1",
  "automation_preset_adaptive_v1",
  "automation_last_voice_v1",
  "ai33_selected_voice",
  "cc_visualConfig_v2",
  "capcut_ultra_chrome_profiles",
  "custom_image_styles_v1",
  "channel_character_profiles_v1",
] as const;

const planLabel = (plan: string) => ({ trial: "Dùng thử", starter: "Starter", monthly: "Pro", agency: "Agency", lifetime: "Lifetime" }[plan] || "Chưa kích hoạt");

export default function SupportCenter({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"" | "export" | "restore" | "send" | "exportDiagnostics" | "clearDiagnostics">("");
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pendingBackup, setPendingBackup] = useState<SettingsBackup | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [note, setNote] = useState("");
  const [reloadRequired, setReloadRequired] = useState(false);

  const loadSystemInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/support/system-info", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Không đọc được thông tin hệ thống.");
      setSystem(payload.system);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không đọc được thông tin hệ thống." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadSystemInfo(); }, []);

  const exportSettings = async () => {
    setBusy("export");
    setNotice(null);
    try {
      const response = await fetch("/api/support/settings-backup", { cache: "no-store" });
      const backup = await response.json() as SettingsBackup;
      if (!response.ok) throw new Error((backup as any)?.error || "Không thể tạo file backup.");
      const clientSettings: Record<string, string> = {};
      for (const key of SAFE_CLIENT_SETTING_KEYS) {
        const value = localStorage.getItem(key);
        if (value !== null && value.length <= 1_000_000) clientSettings[key] = value;
      }
      backup.clientSettings = clientSettings;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `VidiFlow-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice({ tone: "ok", text: "Đã xuất preset, style và cấu hình an toàn. License, API key, Telegram token và cookie không nằm trong file." });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể tạo file backup." });
    } finally {
      setBusy("");
    }
  };

  const selectBackup = async (file: File | undefined) => {
    setPendingBackup(null);
    setPendingFileName("");
    setNotice(null);
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("File backup vượt quá giới hạn 5 MB.");
      const parsed = JSON.parse(await file.text()) as SettingsBackup;
      if (parsed.schemaVersion !== 1 || parsed.product !== "vidiflow-oneclick" || !parsed.files || typeof parsed.files !== "object") {
        throw new Error("Đây không phải file backup cấu hình VidiFlow hợp lệ.");
      }
      setPendingBackup(parsed);
      setPendingFileName(file.name);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không đọc được file backup." });
    }
  };

  const restoreSettings = async () => {
    if (!pendingBackup) return;
    setBusy("restore");
    setNotice(null);
    try {
      const response = await fetch("/api/support/settings-restore", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ backup: pendingBackup }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Không thể khôi phục cấu hình.");
      let restoredClientSettings = 0;
      if (pendingBackup.clientSettings && typeof pendingBackup.clientSettings === "object") {
        for (const key of SAFE_CLIENT_SETTING_KEYS) {
          const value = pendingBackup.clientSettings[key];
          if (typeof value === "string" && value.length <= 1_000_000) {
            localStorage.setItem(key, value);
            restoredClientSettings += 1;
          }
        }
      }
      setReloadRequired(true);
      setPendingBackup(null);
      setPendingFileName("");
      setNotice({ tone: "ok", text: `Đã khôi phục ${payload.restoredFiles?.length || 0} file phía server và ${restoredClientSettings} tùy chọn giao diện. Bản cũ đã được snapshot tự động.` });
      await loadSystemInfo();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể khôi phục cấu hình." });
    } finally {
      setBusy("");
    }
  };

  const exportQueuedDiagnostics = async () => {
    setBusy("exportDiagnostics");
    setNotice(null);
    try {
      const response = await fetch("/api/support/diagnostics/export", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Không thể xuất báo cáo đang chờ.");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `VidiFlow-diagnostics-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice({ tone: "ok", text: `Đã tải ${payload.reports?.length || 0} báo cáo cục bộ. Không có API key, token hoặc mật khẩu trong file.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể xuất báo cáo đang chờ." });
    } finally {
      setBusy("");
    }
  };

  const clearQueuedDiagnostics = async () => {
    if (!window.confirm("Xóa toàn bộ báo cáo chẩn đoán đang lưu cục bộ? Thao tác này không ảnh hưởng dự án.")) return;
    setBusy("clearDiagnostics");
    setNotice(null);
    try {
      const response = await fetch("/api/support/diagnostics/queued", { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Không thể xóa hàng đợi.");
      setNotice({ tone: "ok", text: `Đã xóa ${payload.cleared || 0} báo cáo chẩn đoán cục bộ.` });
      await loadSystemInfo();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể xóa hàng đợi." });
    } finally {
      setBusy("");
    }
  };
  const sendDiagnostics = async () => {
    setBusy("send");
    setNotice(null);
    try {
      const response = await fetch("/api/support/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ page: window.location.pathname || "app", note: note.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Không gửi được báo cáo.");
      setNote("");
      setNotice({ tone: "ok", text: payload.queued ? "Máy chủ hỗ trợ chưa sẵn sàng; báo cáo đã được lưu an toàn trên máy để gửi lại." : "Đã gửi báo cáo chẩn đoán." });
      await loadSystemInfo();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không gửi được báo cáo." });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="support-center-title" className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-violet-50 px-6 py-4">
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-sky-100 p-2.5 text-sky-700"><LifeBuoy className="h-5 w-5" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">VidiFlow Care</p><h2 id="support-center-title" className="text-xl font-black text-slate-900">Hỗ trợ & an toàn dữ liệu</h2></div></div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-xl p-2 text-slate-500 hover:bg-white"><X /></button>
        </header>

        <main className="max-h-[calc(92vh-132px)] space-y-5 overflow-y-auto p-6">
          {notice && <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${notice.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{notice.text}</div>}
          {reloadRequired && <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white"><RefreshCw className="h-4 w-4" />Tải lại giao diện để áp dụng</button>}

          {loading ? <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Đang đọc trạng thái hệ thống…</div> : system && (
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Phiên bản</p><p className="mt-1 text-lg font-black text-slate-900">v{system.appVersion}</p><p className="text-xs text-slate-500">{system.desktopMode ? "Desktop" : "Local server"} · {system.arch}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Bản quyền</p><p className="mt-1 text-lg font-black text-slate-900">{planLabel(system.license.plan)}</p><p className={`text-xs font-bold ${system.license.active ? "text-emerald-600" : "text-amber-600"}`}>{system.license.active ? "Đang hoạt động" : "Chưa hoạt động"}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Cấu hình an toàn</p><p className="mt-1 text-lg font-black text-slate-900">{system.settingsFiles.filter((item) => item.ready).length}/{system.settingsFiles.length}</p><p className="text-xs text-slate-500">file sẵn sàng backup</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Báo cáo lưu cục bộ</p><p className="mt-1 text-lg font-black text-slate-900">{system.pendingDiagnostics}</p><p className="text-xs text-slate-500">đã loại dữ liệu bí mật</p>{system.pendingDiagnostics > 0 && <div className="mt-3 flex gap-1.5"><button disabled={Boolean(busy)} onClick={() => void exportQueuedDiagnostics()} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-sky-50 px-2 py-1.5 text-[10px] font-black text-sky-700 disabled:opacity-50"><Download className="h-3 w-3" />Tải file</button><button disabled={Boolean(busy)} onClick={() => void clearQueuedDiagnostics()} className="inline-flex items-center justify-center rounded-lg bg-rose-50 px-2 py-1.5 text-rose-700 disabled:opacity-50" aria-label="Xóa báo cáo cục bộ"><Trash2 className="h-3 w-3" /></button></div>}</div>
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start gap-3"><div className="rounded-xl bg-violet-100 p-2 text-violet-700"><HardDrive className="h-5 w-5" /></div><div><h3 className="font-black text-slate-900">Backup cấu hình</h3><p className="mt-1 text-xs leading-5 text-slate-600">Lưu preset, style, cấu hình automation và hồ sơ Chrome dạng tên–cổng. Không chứa API key, license, token, cookie hay media dự án.</p></div></div>
              <button disabled={Boolean(busy)} onClick={() => void exportSettings()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Xuất file backup</button>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start gap-3"><div className="rounded-xl bg-amber-100 p-2 text-amber-700"><ArchiveRestore className="h-5 w-5" /></div><div><h3 className="font-black text-slate-900">Khôi phục cấu hình</h3><p className="mt-1 text-xs leading-5 text-slate-600">VidiFlow tạo snapshot cấu hình hiện tại trước khi ghi đè, nên có thể phục hồi nếu chọn nhầm file.</p></div></div>
              <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void selectBackup(event.target.files?.[0])} />
              <button disabled={Boolean(busy)} onClick={() => inputRef.current?.click()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-800 disabled:opacity-50"><Upload className="h-4 w-4" />{pendingFileName || "Chọn file backup"}</button>
              {pendingBackup && <div className="mt-3 rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />File hợp lệ · từ v{pendingBackup.appVersion || "không rõ"}</p><button disabled={Boolean(busy)} onClick={() => void restoreSettings()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy === "restore" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}Xác nhận khôi phục</button></div>}
            </div>
          </section>

          <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-sky-700" /><div className="flex-1"><h3 className="font-black text-slate-900">Gửi chẩn đoán an toàn</h3><p className="mt-1 text-xs leading-5 text-slate-600">Chỉ gửi phiên bản, nền tảng, gói bản quyền, trạng thái cấu hình và ghi chú. API key, token, mật khẩu và đường dẫn dự án không được gửi.</p><textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 2000))} placeholder="Mô tả lỗi và thao tác ngay trước khi lỗi xảy ra…" className="mt-3 min-h-24 w-full resize-y rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500" /><div className="mt-3 flex justify-end"><button disabled={Boolean(busy) || !note.trim()} onClick={() => void sendDiagnostics()} className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Gửi báo cáo</button></div></div></div>
          </section>

          {system && <p className="break-all rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">Dữ liệu ứng dụng: {system.dataDirectory}</p>}
        </main>

        <footer className="flex justify-end border-t border-slate-200 px-6 py-4"><button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700">Đóng</button></footer>
      </div>
    </div>
  );
}
