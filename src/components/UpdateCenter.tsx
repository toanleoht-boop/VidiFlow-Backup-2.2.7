import React, { useEffect, useState } from "react";
import { Download, RefreshCw, RotateCcw, ShieldCheck, X } from "lucide-react";

type UpdateManifest = {
  configured?: boolean;
  installed_version?: string;
  update_available?: boolean;
  version?: string;
  notes?: string;
  published_at?: string;
  download_url?: string;
  sha256?: string;
  mandatory?: boolean;
  error?: string;
};

type InstallState = "idle" | "downloading" | "ready" | "installing" | "done" | "error";

export default function UpdateCenter({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<UpdateManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [installError, setInstallError] = useState("");
  const [installMessage, setInstallMessage] = useState("");

  const checkForUpdates = async () => {
    setLoading(true);
    setInstallState("idle");
    setInstallError("");
    setInstallMessage("");
    try {
      const response = await fetch(`/api/update/check?t=${Date.now()}`, { cache: "no-store" });
      setData(await response.json());
    } catch {
      setData({ error: "Không thể kết nối máy chủ cập nhật." });
    } finally {
      setLoading(false);
    }
  };

  const downloadUpdate = async () => {
    setInstallState("downloading");
    setInstallError("");
    try {
      const response = await fetch("/api/update/download", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.detail || payload?.error || "Không thể tải bản cập nhật.");
      setInstallMessage("Đã tải xuống và xác minh SHA-256 thành công. Bạn có thể tiếp tục làm việc hoặc khởi động lại để cài ngay.");
      setInstallState("ready");
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : "Không thể tải bản cập nhật.");
      setInstallState("error");
    }
  };

  const restartAndInstall = async () => {
    setInstallState("installing");
    setInstallError("");
    setInstallMessage("VidiFlow đang đóng để cài đặt. Sau khi cài xong, phiên bản mới sẽ tự mở lại…");
    try {
      const response = await fetch("/api/update/install", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.detail || payload?.error || "Không thể khởi động trình cập nhật.");
      setInstallState("done");
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : "Không thể khởi động trình cập nhật.");
      setInstallState("error");
    }
  };

  useEffect(() => { void checkForUpdates(); }, []);

  const updateReady = Boolean(
    data?.configured && data?.update_available && data.version && data.download_url && data.sha256,
  );

  return (
    <div className="vidiflow-update-center fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="vidiflow-update-dialog w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-violet-700">VidiFlow Updater</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Cập nhật ứng dụng</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X /></button>
        </header>

        <main className="p-6">
          {loading ? (
            <div className="flex items-center gap-3 py-10 text-sm text-slate-500"><RefreshCw className="animate-spin" />Đang kiểm tra phiên bản mới…</div>
          ) : updateReady ? (
            <>
              <div className="rounded-2xl bg-violet-50 p-5">
                <p className="text-sm font-bold text-violet-700">Đang dùng v{data?.installed_version || "hiện tại"}</p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">Có bản cập nhật v{data?.version}</h3>
                {data?.mandatory && <p className="mt-2 text-xs font-bold text-rose-600">Bản cập nhật này được khuyến nghị cài đặt trước khi tiếp tục làm việc.</p>}
                {data?.published_at && <p className="mt-2 text-xs text-slate-500">Phát hành: {new Date(data.published_at).toLocaleString("vi-VN")}</p>}
              </div>
              <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-700">
                {data?.notes || "Chưa có ghi chú phát hành."}
              </div>
              <div className="mt-4 flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                File cài đặt sẽ được kiểm tra SHA-256 trước khi mở: {data?.sha256?.slice(0, 16)}…
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm leading-relaxed text-slate-600">
              {data?.error || (data?.configured
                ? `Bạn đang dùng phiên bản mới nhất (v${data.installed_version || "hiện tại"}).`
                : "Chưa có bản cập nhật được cấu hình trên máy chủ. Admin cần nhập phiên bản, URL HTTPS và SHA-256 của file cài đặt.")}
            </div>
          )}
        </main>

        {(installState === "ready" || installState === "installing" || installState === "done") && <p className="mx-6 mb-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{installMessage}</p>}
        {installState === "error" && <p className="mx-6 mb-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{installError || "Không thể tự động cài. Hãy kiểm tra URL và SHA-256 trong trang quản trị."}</p>}

        <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={() => void checkForUpdates()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">
            <RefreshCw className="h-4 w-4" />Kiểm tra lại
          </button>
          {updateReady && (
            <div className="flex gap-2">
              <a href={data?.download_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-bold text-violet-700">
                <Download className="h-4 w-4" />Tải thủ công
              </a>
              {installState === "ready" ? (
                <button onClick={() => void restartAndInstall()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700">
                  <RotateCcw className="h-4 w-4" />Khởi động lại để cài
                </button>
              ) : (
                <button disabled={installState === "downloading" || installState === "installing" || installState === "done"} onClick={() => void downloadUpdate()} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
                  {installState === "downloading" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {installState === "downloading" ? "Đang tải & xác minh…" : installState === "installing" || installState === "done" ? "Đang khởi động lại…" : "Tự động tải xuống"}
                </button>
              )}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
