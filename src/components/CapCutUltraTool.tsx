import React, { useState } from "react";
import { Upload, CheckCircle2, Download, Music, RefreshCw, ListOrdered, Shuffle, Move, ArrowLeftRight, Trash2, Maximize2, Volume2, RotateCcw, Type } from "lucide-react";

interface Module {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
}

export default function CapCutUltraTool() {
  const [draftContent, setDraftContent] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [processedContent, setProcessedContent] = useState<any>(null);
  
  // Custom audio order list input
  const [showOrderInput, setShowOrderInput] = useState<boolean>(false);
  const [audioOrderList, setAudioOrderList] = useState<string>("");

  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({
    dynamic_motion: true,
    auto_transition: true,
    auto_fill_canvas: true,
  });

  const modules: Module[] = [
    { id: "sync_image_to_audio", title: "SYNC IMAGE TO AUDIO", desc: "Kéo dài ảnh theo độ dài nhạc", icon: Music },
    { id: "ultra_music_mix", title: "ULTRA MUSIC MIX", desc: "Xáo trộn thứ tự nhạc hiện có", icon: RefreshCw },
    { id: "custom_audio_order", title: "CUSTOM AUDIO ORDER", desc: "Sắp xếp nhạc theo danh sách", icon: ListOrdered },
    { id: "randomize_video", title: "RANDOMIZE VIDEO", desc: "Xáo trộn từ các đoạn video", icon: Shuffle },
    { id: "dynamic_motion", title: "DYNAMIC MOTION", desc: "Zoom & pan ngẫu nhiên (ultra)", icon: Move },
    { id: "auto_transition", title: "AUTO TRANSITION", desc: "Chèn hiệu ứng chuyển cảnh", icon: ArrowLeftRight },
    { id: "clear_transitions", title: "CLEAR TRANSITIONS", desc: "Xóa tất cả chuyển cảnh cũ", icon: Trash2 },
    { id: "auto_fill_canvas", title: "AUTO FILL CANVAS", desc: "Xóa bỏ viền đen (scale to fill)", icon: Maximize2 },
    { id: "normalize_volume", title: "NORMALIZE VOLUME", desc: "Cân bằng âm lượng 0dB", icon: Volume2 },
    { id: "reverse_timeline", title: "REVERSE TIMELINE", desc: "Đảo ngược dòng thời gian", icon: RotateCcw },
    { id: "auto_subtitles", title: "AUTO SUBTITLES", desc: "Tạo chữ từ kịch bản", icon: Type },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setDraftContent(parsed);
        setSuccess(false);
        setProcessedContent(null);
      } catch (err) {
        alert("File không hợp lệ! Vui lòng chọn file JSON draft_content.");
      }
    };
    reader.readAsText(file);
  };

  const toggleModule = (id: string) => {
    setActiveModules((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (id === "custom_audio_order") {
        setShowOrderInput(next[id]);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allActive: Record<string, boolean> = {};
    modules.forEach((m) => {
      allActive[m.id] = true;
    });
    setActiveModules(allActive);
    setShowOrderInput(true);
  };

  const handleProcess = async () => {
    if (!draftContent) {
      alert("Vui lòng tải file draft_content.json lên trước!");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/timeline/ultra-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftContent,
          options: {
            ...activeModules,
            audio_order_list: audioOrderList
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.processedContent) {
        setProcessedContent(data.processedContent);
        setSuccess(true);
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Lỗi kết nối: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedContent) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedContent));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "draft_content.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleReset = () => {
    setDraftContent(null);
    setFileName("");
    setSuccess(false);
    setProcessedContent(null);
    setAudioOrderList("");
    setShowOrderInput(false);
    setActiveModules({
      dynamic_motion: true,
      auto_transition: true,
      auto_fill_canvas: true,
    });
  };

  const activeCount = Object.values(activeModules).filter(Boolean).length;

  return (
    <div className="bg-[#0A0B0D] text-slate-100 p-8 rounded-3xl border border-[#1A1F26] max-w-6xl mx-auto shadow-2xl space-y-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: File Upload & Actions */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="border-2 border-dashed border-[#1E2530] hover:border-[#00FF88] transition-all bg-[#0F1115] rounded-3xl p-8 flex flex-col items-center justify-center text-center relative group min-h-[300px]">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="w-20 h-20 bg-[#162B22] rounded-full flex items-center justify-center text-[#00FF88] group-hover:scale-110 transition-transform shadow-lg shadow-[#00ff881a] mb-6">
              <Upload className="w-10 h-10" />
            </div>
            {fileName ? (
              <div className="space-y-2">
                <span className="text-[#00FF88] font-bold text-sm tracking-widest block uppercase">ĐÃ TẢI THÀNH CÔNG</span>
                <p className="text-white font-semibold text-lg max-w-[200px] truncate mx-auto">{fileName}</p>
                <span className="text-xs text-slate-500 block">JSON DRAFT CONTENT ONLY</span>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-slate-400 font-semibold text-lg block">Tải Lên File</span>
                <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Kéo thả hoặc click chọn file draft_content.json của CapCut</p>
              </div>
            )}
          </div>

          {/* Status / Trigger Button */}
          {success ? (
            <div className="bg-[#122A1E] border border-[#00FF88] rounded-2xl py-4 px-6 flex items-center justify-center gap-3 text-[#00FF88] font-bold text-sm tracking-wider shadow-lg shadow-[#00ff880d] animate-pulse">
              <CheckCircle2 className="w-5 h-5" />
              XỬ LÝ HOÀN TẤT!
            </div>
          ) : (
            <button
              onClick={handleProcess}
              disabled={processing || !draftContent}
              className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg ${
                processing
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : draftContent
                  ? "bg-gradient-to-r from-[#00FF88] to-[#00E5FF] text-black hover:brightness-110 shadow-[#00ff8826] hover:scale-[1.02]"
                  : "bg-[#161B22] text-slate-500 cursor-not-allowed border border-[#1E2530]"
              }`}
            >
              {processing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  ĐANG XỬ LÝ...
                </div>
              ) : (
                "XỬ LÝ DRAFT CONTENT"
              )}
            </button>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!success}
            className={`w-full py-5 rounded-2xl font-black text-lg tracking-widest flex items-center justify-center gap-3 border transition-all ${
              success
                ? "border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black shadow-lg shadow-[#00ff881a]"
                : "border-[#1E2530] text-slate-600 cursor-not-allowed"
            }`}
          >
            <Download className="w-6 h-6" />
            TẢI FILE ULTRA
          </button>

          <button
            onClick={handleReset}
            className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-wider text-center transition-colors pt-2"
          >
            HỦY VÀ LÀM LẠI
          </button>
        </div>

        {/* Right Column: Modules Selection */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-wider flex items-center gap-3">
              <span className="text-[#00FF88]">⚡</span> BỘ CÔNG CỤ TỰ ĐỘNG
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-xs bg-[#161B22] border border-[#1E2530] hover:border-[#00FF88] text-slate-300 px-4 py-2 rounded-full font-bold uppercase tracking-wider transition-all"
              >
                CHỌN TẤT CẢ
              </button>
              <span className="bg-[#122A1E] text-[#00FF88] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-[#00FF8833]">
                {activeCount} ACTIVE MODULES
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((m) => {
              const Icon = m.icon;
              const isActive = !!activeModules[m.id];
              return (
                <button
                  key={m.id}
                  onClick={() => toggleModule(m.id)}
                  className={`flex items-center justify-between p-5 rounded-2xl border text-left transition-all ${
                    isActive
                      ? "border-[#00FF88] bg-[#0E1B15] shadow-lg shadow-[#00ff8808]"
                      : "border-[#1A1F26] bg-[#0F1115] hover:border-[#2C3545]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? "bg-[#162B22] text-[#00FF88]" : "bg-[#1A1F26] text-slate-400"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm tracking-wide ${isActive ? "text-white" : "text-slate-300"}`}>
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isActive ? "border-[#00FF88] bg-[#00FF88]" : "border-slate-600 bg-transparent"
                  }`}>
                    {isActive && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom audio order input box if custom_audio_order is selected */}
          {showOrderInput && (
            <div className="bg-[#0F1115] border border-[#1A1F26] rounded-2xl p-5 space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Danh sách nhạc theo thứ tự (cách nhau bằng dấu phẩy)</label>
              <input
                type="text"
                value={audioOrderList}
                onChange={(e) => setAudioOrderList(e.target.value)}
                placeholder="vd: nhạc nền 1, remix 2, intro_audio..."
                className="w-full bg-[#161B22] border border-[#1E2530] rounded-xl px-4 py-3 text-sm focus:border-[#00FF88] outline-none text-slate-200 transition-all placeholder:text-slate-600"
              />
            </div>
          )}

          {/* Footer Status Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#1A1F26]">
            {[
              { label: "ENGINE", val: "V8 TURBO" },
              { label: "STATUS", val: "READY" },
              { label: "FORMAT", val: "JSON V2" },
              { label: "SECURITY", val: "ENCRYPTED" },
            ].map((st, i) => (
              <div key={i} className="border border-[#1A1F26] bg-[#0A0B0D] rounded-xl p-4 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                  {st.label}
                </span>
                <span className="text-xs text-slate-200 font-black tracking-widest uppercase">
                  {st.val}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
