import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Download, FileText, Image as ImageIcon, Loader2, Mic2, PlayCircle, RefreshCw, Video } from "lucide-react";

type Summary = {
  success: boolean; progress: number; latestError?: string;
  script: { ready: boolean; path: string; size: number };
  media: { ready: boolean; imageCount: number; videoCount: number; previewImage: string; previewVideo: string };
  voice: { ready: boolean; originalPath: string; cutCount: number };
  seo?: { ready: boolean; path?: string };
  thumbnail?: { ready: boolean; path?: string; name?: string };
  finalVideo: { ready: boolean; path?: string; name?: string; size?: number; updatedAt?: string };
};

type Props = { projectDir: string; isRunning: boolean; liveProgress: number; logs: string[]; seoData?: any };

const formatSize = (bytes = 0) => bytes ? `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 1 : 2)} MB` : "—";
const localUrl = (filePath?: string) => filePath ? `/api/serve-local-file?path=${encodeURIComponent(filePath)}` : "";

export default function OutputPreviewView({ projectDir, isRunning, liveProgress, logs, seoData }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    if (!projectDir) { setSummary(null); setError("Hãy chọn thư mục dự án để xem kết quả."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/project-output-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectDir }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Không thể đọc kết quả dự án.");
      setSummary(data); setError("");
    } catch (reason: any) { setError(reason.message || "Không thể đọc kết quả dự án."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [projectDir]);
  useEffect(() => { if (!isRunning) return; const timer = window.setInterval(() => void refresh(), 3000); return () => window.clearInterval(timer); }, [isRunning, projectDir]);

  const progress = isRunning ? Math.max(liveProgress, summary?.progress || 0) : summary?.progress || 0;
  const friendlyProblem = useMemo(() => {
    // A completed, healthy project must not inherit warning-looking log lines
    // from earlier attempts in the same app session.
    if (summary?.finalVideo.ready && !summary?.latestError) return "";
    const raw = summary?.latestError || logs.slice().reverse().find(log => /lỗi|error|failed/i.test(log)) || "";
    if (!raw) return "";
    if (/voice|audio/i.test(raw)) return "Giọng đọc hoặc file âm thanh chưa sẵn sàng. Hãy kiểm tra file voice trong thư mục dự án rồi thử lại.";
    if (/ảnh|image|video|media/i.test(raw)) return "Một số hình ảnh hoặc video chưa được tạo đủ. Hãy thử tạo lại các nội dung bị thiếu.";
    if (/api|quota|429/i.test(raw)) return "Dịch vụ AI đang bận hoặc đã hết hạn mức. Hãy chờ ít phút hoặc đổi API key rồi tiếp tục.";
    return "Quá trình tạo video gặp sự cố. Bạn có thể bấm Thử kiểm tra lại; dữ liệu đã hoàn thành trước đó vẫn được giữ nguyên.";
  }, [summary?.finalVideo.ready, summary?.latestError, logs]);

  const cards = [
    { label: "Nội dung", done: !!summary?.script.ready, detail: summary?.script.ready ? "Đã chuẩn bị xong" : "Đang chờ", icon: FileText },
    ...(summary?.media.imageCount ? [{ label: "Hình ảnh", done: true, detail: `${summary.media.imageCount} ảnh đã tạo`, icon: ImageIcon }] : []),
    ...(summary?.media.videoCount ? [{ label: "Video cảnh", done: true, detail: `${summary.media.videoCount} video đã tạo`, icon: Video }] : []),
    ...(!summary?.media.imageCount && !summary?.media.videoCount ? [{ label: "Hình ảnh", done: false, detail: "Đang chờ", icon: ImageIcon }] : []),
    { label: "Giọng đọc", done: !!summary?.voice.ready, detail: summary?.voice.ready ? `Đã có voice · ${summary?.voice.cutCount || 0} đoạn` : "Đang chờ", icon: Mic2 },
    { label: "Video hoàn chỉnh", done: !!summary?.finalVideo.ready, detail: summary?.finalVideo.ready ? "Sẵn sàng sử dụng" : "Chưa hoàn thành", icon: Video },
  ];

  return <div className="space-y-5">
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black text-slate-900">Kết quả & Theo dõi</h2><p className="mt-1 text-xs text-slate-500">Xem tiến độ, nội dung đã tạo, lỗi cần xử lý và video cuối cùng tại một nơi.</p></div><button onClick={() => void refresh()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-black text-indigo-700 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}Kiểm tra lại</button></div>
      <div className="mt-5 flex items-center justify-between text-xs font-black text-slate-700"><span>{isRunning ? "Đang tạo video..." : summary?.finalVideo.ready ? "Đã hoàn thành" : "Tiến độ hiện tại"}</span><span className="text-indigo-700">{progress}%</span></div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-500 ${friendlyProblem ? "bg-amber-500" : summary?.finalVideo.ready ? "bg-emerald-500" : "bg-indigo-600"}`} style={{ width: `${progress}%` }}/></div>
    </div>

    {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4"/>{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => { const Icon = card.icon; return <div key={card.label} className={`rounded-2xl border p-4 ${card.done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between"><span className={`rounded-xl p-2 ${card.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><Icon className="h-5 w-5"/></span>{card.done ? <CheckCircle2 className="h-5 w-5 text-emerald-600"/> : isRunning ? <Loader2 className="h-5 w-5 animate-spin text-indigo-500"/> : <Clock3 className="h-5 w-5 text-slate-400"/>}</div><h3 className="mt-3 text-sm font-black text-slate-800">{card.label}</h3><p className="mt-1 text-xs text-slate-500">{card.detail}</p></div>; })}</div>

    {friendlyProblem && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"/><div><h3 className="text-sm font-black text-rose-800">Cần bạn kiểm tra</h3><p className="mt-1 text-xs leading-relaxed text-rose-700">{friendlyProblem}</p><button onClick={() => void refresh()} className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white">Thử kiểm tra lại</button></div></div></div>}

    {seoData && <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-black text-violet-900">Tiêu đề & mô tả sẵn sàng đăng</h3><p className="mt-1 text-[11px] text-violet-700">Đã tạo trong bước SEO. Có thể sao chép trực tiếp.</p></div><button onClick={() => navigator.clipboard.writeText(`${seoData.seoTitle || ""}\n\n${seoData.seoDescription || ""}`)} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white">Sao chép tất cả</button></div><div className="mt-4 rounded-xl border border-violet-100 bg-white p-3"><p className="text-[10px] font-black uppercase text-violet-600">Tiêu đề</p><div className="mt-1 flex items-start justify-between gap-3"><p className="text-sm font-black text-slate-800">{seoData.seoTitle}</p><button onClick={() => navigator.clipboard.writeText(seoData.seoTitle || "")} className="shrink-0 text-xs font-bold text-violet-700">Copy</button></div></div><div className="mt-3 rounded-xl border border-violet-100 bg-white p-3"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase text-violet-600">Mô tả</p><button onClick={() => navigator.clipboard.writeText(seoData.seoDescription || "")} className="text-xs font-bold text-violet-700">Copy</button></div><pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700">{seoData.seoDescription}</pre></div></div>}

    {summary?.thumbnail?.ready && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex flex-wrap items-center gap-4"><img src={localUrl(summary.thumbnail.path)} className="h-24 w-44 rounded-lg border border-amber-200 object-cover"/><div><h3 className="text-sm font-black text-amber-900">Ảnh thumbnail đã tạo</h3><p className="mt-1 text-xs text-amber-800">{summary.thumbnail.name}</p><a href={localUrl(summary.thumbnail.path)} download={summary.thumbnail.name} className="mt-2 inline-flex rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-white">Tải thumbnail</a></div></div></div>}

    <div className="grid gap-5 xl:grid-cols-2">
      <div className="space-y-3">
        {summary?.finalVideo.ready ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 min-h-72 flex items-center justify-center"><video key={summary.finalVideo.path} src={localUrl(summary.finalVideo.path)} controls className="max-h-[520px] w-full bg-black"/></div> : <>
          {summary?.media.previewImage && <div><p className="mb-2 text-xs font-black text-slate-700">Xem trước ảnh</p><div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 min-h-72 flex items-center justify-center"><img src={localUrl(summary.media.previewImage)} className="max-h-[520px] w-full object-contain"/></div></div>}
          {summary?.media.previewVideo && <div><p className="mb-2 text-xs font-black text-slate-700">Xem trước video cảnh</p><div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 min-h-72 flex items-center justify-center"><video src={localUrl(summary.media.previewVideo)} controls className="max-h-[520px] w-full bg-black"/></div></div>}
          {!summary?.media.previewImage && !summary?.media.previewVideo && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 min-h-72 flex items-center justify-center"><div className="p-8 text-center text-slate-400"><PlayCircle className="mx-auto h-12 w-12"/><p className="mt-3 text-sm font-bold">Preview sẽ xuất hiện khi hệ thống tạo được nội dung.</p></div></div>}
        </>}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-800">Kết quả cuối cùng</h3>{summary?.finalVideo.ready ? <div className="mt-4 space-y-3"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-black text-emerald-800">Video đã sẵn sàng</p><p className="mt-1 break-all text-[11px] text-emerald-700">{summary.finalVideo.name}</p></div><div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-400">Dung lượng</span><b className="mt-1 block text-slate-800">{formatSize(summary.finalVideo.size)}</b></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-400">Cập nhật</span><b className="mt-1 block text-slate-800">{summary.finalVideo.updatedAt ? new Date(summary.finalVideo.updatedAt).toLocaleString("vi-VN") : "—"}</b></div></div><a href={localUrl(summary.finalVideo.path)} download={summary.finalVideo.name} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white"><Download className="h-4 w-4"/>Tải video xuống</a><p className="break-all text-[10px] text-slate-400">{summary.finalVideo.path}</p></div> : <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><Clock3 className="mx-auto h-8 w-8 text-slate-400"/><p className="mt-2 text-xs font-bold text-slate-600">Video hoàn chỉnh chưa có.</p><p className="mt-1 text-[11px] text-slate-400">Bạn có thể quay lại trang Tạo Video Tự Động để bắt đầu hoặc tiếp tục.</p></div>}</div>
    </div>
  </div>;
}
