import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Globe2, Mic, Play, Search, Square, Upload, UserRound, X } from "lucide-react";

export type VieNeuSelection = {
  voice: string;
  language: "vi" | "en" | "bilingual";
  referenceAudioPath?: string;
  referenceName?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice?: string;
  selectedLanguage?: "vi" | "en" | "bilingual";
  referenceName?: string;
  onSelect: (selection: VieNeuSelection) => void;
};

const VOICES = [
  { id: "Minh Đức", gender: "male", accent: "Bắc", description: "Nam rõ ràng, cân bằng, phù hợp thuyết minh tổng hợp." },
  { id: "Phạm Tuyên", gender: "male", accent: "Bắc", description: "Nam miền Bắc, chắc và giàu tính dẫn chuyện." },
  { id: "Thái Sơn", gender: "male", accent: "Bắc", description: "Nam mạnh mẽ, phù hợp tin tức và nội dung kiến thức." },
  { id: "Xuân Vĩnh", gender: "male", accent: "Nam", description: "Nam trẻ, tươi sáng và giàu năng lượng." },
  { id: "Thanh Bình", gender: "male", accent: "Bắc", description: "Nam điềm tĩnh, nhịp đọc đều và dễ nghe." },
  { id: "Minh Triết", gender: "male", accent: "Bắc", description: "Nam trưởng thành, phù hợp tài liệu và kể chuyện." },
  { id: "Quang Sơn", gender: "male", accent: "Nam", description: "Nam ấm, tự nhiên và gần gũi." },
  { id: "Trúc Ly", gender: "female", accent: "Bắc", description: "Nữ trẻ trung, trong sáng, phù hợp video mạng xã hội." },
  { id: "Ngọc Linh", gender: "female", accent: "Bắc", description: "Nữ sáng, phát âm rõ và linh hoạt." },
  { id: "Đoan Trang", gender: "female", accent: "Nam", description: "Nữ miền Nam, mềm mại và thân thiện." },
  { id: "Mai Anh", gender: "female", accent: "Bắc", description: "Nữ tự nhiên, phù hợp nội dung đời sống." },
  { id: "Thục Đoan", gender: "female", accent: "Nam", description: "Nữ ấm áp, phù hợp kể chuyện dài." },
  { id: "Thùy Dung", gender: "female", accent: "Bắc", description: "Nữ trưởng thành, nhịp đọc vững." },
  { id: "Ngọc Trân", gender: "female", accent: "Nam", description: "Nữ miền Nam trẻ, nhẹ nhàng và hiện đại." },
] as const;

const SAMPLE_TEXT = {
  vi: "Xin chào, đây là bản nghe thử giọng đọc VieNeu bằng tiếng Việt.",
  en: "Hello, this is an English voice preview generated locally by VieNeu.",
  bilingual: "Xin chào, this is a bilingual Vietnamese and English voice preview.",
};

export default function VieNeuVoiceLibrary({ isOpen, onClose, selectedVoice, selectedLanguage = "vi", referenceName, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [language, setLanguage] = useState<"vi" | "en" | "bilingual">(selectedLanguage);
  const [playing, setPlaying] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [status, setStatus] = useState("Sẵn sàng kiểm tra engine");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) { audioRef.current?.pause(); setPlaying(null); return; }
    setLanguage(selectedLanguage);
    setStatus("Đang kiểm tra VieNeu Local...");
    fetch("/api/vieneu/status").then(async response => {
      const payload = await response.json();
      if (!response.ok || !payload.installed) throw new Error(payload.error || "VieNeu chưa sẵn sàng.");
      setStatus(payload.loaded ? "Model đã nạp · sẵn sàng nghe thử" : "Engine đã cài · model sẽ tải/nạp khi nghe thử lần đầu");
    }).catch(err => setStatus(err instanceof Error ? err.message : "Không kiểm tra được VieNeu."));
  }, [isOpen, selectedLanguage]);

  const filtered = useMemo(() => VOICES.filter(voice => {
    const query = search.trim().toLocaleLowerCase("vi");
    return (!gender || voice.gender === gender) && (!query || `${voice.id} ${voice.accent} ${voice.description}`.toLocaleLowerCase("vi").includes(query));
  }), [search, gender]);

  const preview = async (voice: string) => {
    if (playing === voice) { audioRef.current?.pause(); setPlaying(null); return; }
    audioRef.current?.pause();
    setPreviewLoading(voice); setError("");
    try {
      const response = await fetch("/api/vieneu/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: SAMPLE_TEXT[language], voice, speed: 1, emotion: "natural" }) });
      const payload = await response.json();
      if (!response.ok || !payload.audioUrl) throw new Error(payload.error || "Không tạo được bản nghe thử.");
      const audio = new Audio(payload.audioUrl);
      audio.onended = () => setPlaying(null);
      await audio.play();
      audioRef.current = audio; setPlaying(voice); setStatus("Model đã nạp · VieNeu đang hoạt động offline");
    } catch (err) { setError(err instanceof Error ? err.message : "Không nghe thử được giọng."); }
    finally { setPreviewLoading(null); }
  };

  const uploadReference = async (file?: File) => {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setError("Audio mẫu phải nhỏ hơn 30 MB."); return; }
    setUploading(true); setError("");
    try {
      const response = await fetch(`/api/vieneu/reference?name=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: await file.arrayBuffer() });
      const payload = await response.json();
      if (!response.ok || !payload.path) throw new Error(payload.error || "Không lưu được audio mẫu.");
      onSelect({ voice: `Clone: ${file.name}`, language, referenceAudioPath: payload.path, referenceName: file.name });
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Không tải được audio mẫu."); }
    finally { setUploading(false); }
  };

  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10"><Mic className="h-5 w-5 text-sky-400"/></div><div><h2 className="text-xl font-bold text-white">Thư viện VieNeu Local</h2><p className="text-sm text-slate-400">Offline · 48 kHz · Việt–Anh · nhân bản giọng</p></div></div>
          <button onClick={onClose} className="rounded-full border border-slate-700 p-2.5 text-slate-400 hover:bg-slate-800"><X className="h-5 w-5"/></button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="w-full shrink-0 space-y-5 overflow-y-auto border-r border-slate-800 bg-slate-950/40 p-5 md:w-72">
            <div><label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400"><Globe2 className="h-3.5 w-3.5"/>Ngôn ngữ đọc</label><select value={language} onChange={e => setLanguage(e.target.value as typeof language)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="bilingual">Việt–Anh song ngữ</option></select></div>
            <div><label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400"><Search className="h-3.5 w-3.5"/>Tìm kiếm</label><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên, vùng miền..." className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500"/></div>
            <div><label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400"><UserRound className="h-3.5 w-3.5"/>Giới tính</label><div className="grid grid-cols-3 gap-2">{[["", "Tất cả"], ["male", "Nam"], ["female", "Nữ"]].map(([id, label]) => <button key={id} onClick={() => setGender(id as typeof gender)} className={`rounded-xl border py-2 text-xs font-bold ${gender === id ? "border-sky-500 bg-sky-500/10 text-sky-400" : "border-slate-700 text-slate-400"}`}>{label}</button>)}</div></div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs leading-relaxed text-sky-200"><b>Trạng thái:</b><br/>{status}</div>
            <div className="rounded-xl border border-dashed border-slate-600 p-3"><p className="text-sm font-bold text-white">Nhân bản giọng</p><p className="mt-1 text-xs text-slate-400">Tải WAV/MP3 sạch khoảng 3–10 giây.</p><label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white"><Upload className="h-4 w-4"/>{uploading ? "Đang tải..." : referenceName || "Tải audio mẫu"}<input type="file" accept="audio/*,.wav,.mp3,.m4a,.flac" disabled={uploading} className="hidden" onChange={e => void uploadReference(e.target.files?.[0])}/></label></div>
          </aside>
          <main className="min-h-[500px] flex-1 overflow-y-auto p-5"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">{filtered.length} giọng · nghe thử theo {language === "vi" ? "Tiếng Việt" : language === "en" ? "English" : "Việt–Anh"}</span></div>{error && <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{filtered.map(voice => { const chosen = selectedVoice === voice.id && !referenceName; const busy = previewLoading === voice.id; return <div key={voice.id} onClick={() => { onSelect({ voice: voice.id, language }); onClose(); }} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${chosen ? "border-sky-500/50 bg-sky-500/10 ring-1 ring-sky-500/20" : "border-slate-700 bg-slate-900 hover:border-slate-500"}`}><button onClick={e => { e.stopPropagation(); void preview(voice.id); }} disabled={!!previewLoading} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${playing === voice.id ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-300"}`}>{busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-white"/> : playing === voice.id ? <Square className="h-4 w-4 fill-current"/> : <Play className="ml-0.5 h-5 w-5 fill-current"/>}</button><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-white">{voice.id}</h3>{chosen && <span className="flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-400"><Check className="h-3 w-3"/>Đã chọn</span>}</div><div className="my-2 flex gap-1.5"><span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">{voice.gender === "male" ? "Nam" : "Nữ"}</span><span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">Miền {voice.accent}</span><span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">Việt–Anh</span></div><p className="text-xs italic leading-relaxed text-slate-400">{voice.description}</p></div></div>; })}</div></main>
        </div>
      </div>
    </div>, document.body,
  );
}
