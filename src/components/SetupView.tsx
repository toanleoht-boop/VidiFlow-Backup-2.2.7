import React, { useState, useEffect } from "react";
import { Save, AlertCircle, CheckCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ChromeProfileManager } from "./pipeline/ChromeProfileManager";

export default function SetupView() {
  const [geminiKey, setGeminiKey] = useState("");
  const [ai33Key, setAi33Key] = useState("");
  const [viettheoKey, setViettheoKey] = useState("");
  const [apiSource, setApiSource] = useState<"managed" | "personal">("managed");
  const [loading, setLoading] = useState(false);
  const [geminiKeys, setGeminiKeys] = useState<Array<{ id: string; label: string; key: string; isActive: boolean }>>([]);
  const [backupLabel, setBackupLabel] = useState("");
  const [backupKey, setBackupKey] = useState("");
  const [keyActionLoading, setKeyActionLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });

  useEffect(() => {
    fetch("/api/config/keys")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGeminiKey(data.GEMINI_API_KEY || "");
          setAi33Key(data.AI_33_API_KEY || "");
          setViettheoKey(data.VIETTHEO_API_KEY || "");
          setApiSource(data.API_SOURCE === "personal" ? "personal" : "managed");
        }
      })
      .catch(err => console.error("Failed to load keys", err));
    loadGeminiKeys();
  }, []);

  const loadGeminiKeys = async () => {
    try {
      const response = await fetch("/api/config/gemini-keys");
      const data = await response.json();
      if (data.success) setGeminiKeys(data.keys || []);
    } catch (error) {
      console.error("Failed to load Gemini keys", error);
    }
  };

  const manageBackupKey = async (action: "add" | "activate" | "remove", payload: Record<string, string> = {}) => {
    setKeyActionLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const response = await fetch("/api/config/gemini-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Không thể cập nhật key.");
      setBackupKey("");
      setBackupLabel("");
      await loadGeminiKeys();
      if (action === "activate") {
        setGeminiKey("");
        setStatus({ type: "success", message: "Đã đổi sang key đã chọn. Bạn có thể chạy lại phần đang dừng." });
      } else {
        setStatus({ type: "success", message: action === "add" ? "Đã lưu key dự phòng." : "Đã xóa key dự phòng." });
      }
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setKeyActionLoading(false);
    }
  };


  const handleSave = async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await fetch("/api/config/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          GEMINI_API_KEY: geminiKey,
          AI_33_API_KEY: ai33Key,
          VIETTHEO_API_KEY: viettheoKey,
          API_SOURCE: apiSource
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: "success", message: "Đã lưu API Keys thành công!" });
      } else {
        setStatus({ type: "error", message: data.error || "Có lỗi xảy ra khi lưu." });
      }
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            🔑
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">API tích hợp & tài khoản riêng</h2>
            <p className="text-xs text-slate-500">Mặc định tool dùng API từ vidiflow.site theo hạn mức gói. Các key bên dưới hoàn toàn tùy chọn.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-black text-emerald-900">✓ API mặc định được cung cấp an toàn từ website</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800">Khóa API thật không tải xuống máy khách. Tool gửi yêu cầu bằng token bản quyền và website trả kết quả về. Bạn vẫn có thể chọn Google Pro/Ultra qua Chrome hoặc nhập API riêng để ưu tiên dùng tài khoản của mình.</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <label htmlFor="setup-api-source" className="block text-sm font-black text-slate-800">Nguồn API mặc định</label>
          <select id="setup-api-source" value={apiSource} onChange={(event) => setApiSource(event.target.value as "managed" | "personal")} className="mt-2 w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200">
            <option value="managed">API tích hợp từ vidiflow.site (khuyến nghị)</option>
            <option value="personal">API riêng đã nhập trên máy này</option>
          </select>
          <p className="mt-2 text-[11px] leading-5 text-slate-600">Lựa chọn này chỉ áp dụng cho chế độ API. Google Pro/Ultra chạy qua Chrome vẫn được chọn độc lập ở phần tạo Media.</p>
        </div>
        {/* Gemini API Key */}
        <div className="space-y-2">
          <label htmlFor="setup-gemini-key" className="block text-sm font-semibold text-slate-700">Gemini API riêng <span className="font-medium text-slate-400">(tùy chọn)</span></label>
          <p className="text-xs text-slate-500 mb-2">Để trống để dùng hạn mức AI tích hợp từ website. Nếu nhập key riêng, tool ưu tiên key này.</p>
          <input 
            id="setup-gemini-key"
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
          />
        </div>

        {false && <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Key Gemini dự phòng</h3>
            <p className="mt-1 text-xs text-slate-600">Khi gặp lỗi 429, chọn một key đã lưu bên dưới rồi chạy lại. Tool không tự đổi key.</p>
          </div>
          <div className="space-y-2">
            {geminiKeys.length === 0 ? (
              <p className="text-xs text-slate-500">Chưa có key Gemini nào được cấu hình.</p>
            ) : geminiKeys.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs border border-slate-200">
                <span className={`h-2 w-2 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="font-semibold text-slate-700 flex-1">{item.label}</span>
                <code className="text-slate-500">{item.key}</code>
                {item.isActive ? (
                  <span className="ml-2 rounded bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">Đang dùng</span>
                ) : <>
                  <button type="button" disabled={keyActionLoading} onClick={() => manageBackupKey("activate", { id: item.id })} className="rounded bg-indigo-600 px-2 py-1 font-semibold text-white disabled:opacity-50">Dùng key này</button>
                  <button type="button" disabled={keyActionLoading} aria-label={`Xóa ${item.label}`} onClick={() => manageBackupKey("remove", { id: item.id })} className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </>}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_auto]">
            <input aria-label="Tên key Gemini dự phòng" value={backupLabel} onChange={(event) => setBackupLabel(event.target.value)} placeholder="Tên gợi nhớ, ví dụ: Tài khoản 2" className="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
            <input aria-label="Key Gemini dự phòng" type="password" autoComplete="new-password" spellCheck={false} value={backupKey} onChange={(event) => setBackupKey(event.target.value)} placeholder="AIzaSy..." className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono" />
            <button type="button" disabled={keyActionLoading || !backupKey.trim()} onClick={() => manageBackupKey("add", { label: backupLabel, key: backupKey })} className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Thêm</button>
          </div>
          <button type="button" onClick={loadGeminiKeys} disabled={keyActionLoading} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"><RefreshCw className="h-3.5 w-3.5" /> Làm mới danh sách</button>
        </div>}

        {/* AI33 API Key */}
        <div className="space-y-2">
          <label htmlFor="setup-voice-key" className="block text-base font-bold text-slate-800">API Voice riêng <span className="font-medium text-slate-400">(tùy chọn)</span></label>
          <p className="mb-2 text-sm text-slate-500">Để trống để dùng ký tự Voice trong gói. Nhập <code className="text-xs font-mono">AI_33_API_KEY</code> nếu muốn dùng tài khoản riêng.</p>
          <input 
            id="setup-voice-key"
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            value={ai33Key}
            onChange={(e) => setAi33Key(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
          />
        </div>

        {/* VietTheo API Key */}
        <div className="space-y-2">
          <label htmlFor="setup-media-key" className="block text-base font-bold text-slate-800">API Media riêng <span className="font-medium text-slate-400">(tùy chọn)</span></label>
          <p className="mb-2 text-sm text-slate-500">Để trống để dùng lượt Media tích hợp từ website. Nhập <code className="text-xs font-mono">VIETTHEO_API_KEY</code> nếu muốn dùng tài khoản riêng.</p>
          <input 
            id="setup-media-key"
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            value={viettheoKey}
            onChange={(e) => setViettheoKey(e.target.value)}
            placeholder="f2api_..."
            className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
          />
        </div>

        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-indigo-700">API & hỗ trợ</p>
              <h3 className="mt-1 text-base font-extrabold text-slate-900">Liên hệ Admin để mua API</h3>
              <p className="mt-1 text-sm text-slate-600">Mua <b>API Flow</b> để tạo ảnh/video AI hoặc <b>API Voice Premium</b> để tạo giọng đọc. Liên hệ trực tiếp qua một trong các kênh bên dưới.</p>
            </div>
            <span className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-black text-white">2 LOẠI API</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <a href="https://www.facebook.com/me/" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700">Facebook Admin</a>
            <a href="https://zalo.me/0976293994" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">Zalo: 0976293994</a>
            <a href="https://t.me/leo4309" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700">Telegram: @leo4309</a>
          </div>
        </section>

        {status.message && (
          <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {status.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="font-medium mt-0.5">{status.message}</span>
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full block"></span>
            ) : (
              <Save className="w-5 h-5" />
            )}
            Lưu Cấu Hình
          </button>
        </div>
      </div>
      
      {/* Chrome Profile Manager Section */}
      <ChromeProfileManager />
    </div>
  );
}
