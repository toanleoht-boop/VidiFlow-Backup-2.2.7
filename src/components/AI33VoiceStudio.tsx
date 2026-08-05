import React, { useState, useEffect } from 'react';
import { VoiceSelectionDialog, Voice } from './VoiceSelectionDialog';
import { Volume2, Loader2, Play, Download, CheckCircle, Search } from 'lucide-react';

interface AI33VoiceStudioProps {
  defaultText?: string;
  projectDir?: string;
  onAudioGenerated?: (url: string) => void;
}

export default function AI33VoiceStudio({ defaultText = "", projectDir, onAudioGenerated }: AI33VoiceStudioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(() => {
    try {
      const saved = localStorage.getItem("ai33_selected_voice");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [text, setText] = useState(defaultText);
  // Audio is always resolved from the active project folder. Persisting a
  // browser URL here can make a new project display an old project's voice.
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem("ai33_selected_voice", JSON.stringify(selectedVoice));
    }
  }, [selectedVoice]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalVoiceExists, setIsLocalVoiceExists] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setText(defaultText);
    // Always clear the previous project's player before checking this folder.
    // Otherwise an empty new project could still display an old voice URL.
    setAudioUrl(null);
    setIsLocalVoiceExists(false);
    onAudioGenerated?.("");
    
    // Kiểm tra xem file voice gốc đã tải về thư mục chưa
    if (projectDir) {
        fetch("/api/check-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: projectDir + "/voice_original.mp3" })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.exists || cancelled) return;
            if (data.exists) {
                setIsLocalVoiceExists(true);
                const localUrl = `/api/serve-local-file?path=${encodeURIComponent(projectDir + "/voice_original.mp3")}`;
                setAudioUrl(localUrl);
                if (onAudioGenerated) onAudioGenerated(localUrl); // Trigger step 5 completion
            }
        })
        .catch(err => console.error("Lỗi check file:", err));
    }
    return () => { cancelled = true; };
  }, [defaultText, projectDir]);

  const generateAudio = async (text: string, voiceId: string) => {
    // 1. Gửi request tạo Task (sử dụng backend proxy)
    const ttsRes = await fetch("/api/ai33/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        speed: 1,
        with_transcript: false
      }),
    });
    
    const ttsData = await ttsRes.json();
    if (!ttsData.success || !ttsData.task_id) throw new Error(ttsData.error || "Tạo task thất bại! (Vui lòng kiểm tra thiết lập API Key)");
    
    const taskId = ttsData.task_id;
    
    // 2. Polling liên tục kiểm tra trạng thái Task
    let finalUrl = null;
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Chờ 3 giây
      
      const pollRes = await fetch(`/api/ai33/task/${taskId}`);
      const pollData = await pollRes.json();
      
      if (pollData.status === "DONE" || pollData.status === "done") {
        finalUrl = pollData.metadata?.audio_url || pollData.audio_url;
        break;
      } else if (pollData.status === "ERROR" || pollData.status === "error") {
        throw new Error(pollData.error_message || "Lỗi tạo giọng nói");
      }
    }
    
    return finalUrl;
  };

  const handleStartGeneration = async () => {
    if (!selectedVoice) {
      setError("Vui lòng chọn giọng đọc!");
      return;
    }
    if (!text.trim()) {
      setError("Vui lòng nhập văn bản!");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const url = await generateAudio(text, selectedVoice.voice_id);
      if (url) {
        setAudioUrl(url);
        if (onAudioGenerated) onAudioGenerated(url);

        // Tự động lưu vào thư mục dự án (nếu có)
        if (projectDir) {
            try {
                await fetch('/api/download-audio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: projectDir + '/voice_original.mp3',
                        url: url
                    })
                });
                setIsLocalVoiceExists(true);
            } catch(e) { 
                console.error("Tự động lưu thất bại", e); 
            }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Tạo Audio (Chuẩn VOICE_DOCUMENTATION.md)</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Giọng đọc</label>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium transition-colors"
            >
              Chọn Giọng Đọc
            </button>
            {selectedVoice && (
              <p className="text-blue-600 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> 
                Đã chọn: {selectedVoice.name}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Văn bản cần đọc</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        <button 
          onClick={handleStartGeneration}
          disabled={isGenerating}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white transition-all ${isGenerating ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {isGenerating ? 'Đang tạo Audio...' : 'Bắt đầu tạo Audio'}
        </button>

        {audioUrl && (
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-3">
            <p className="text-green-700 font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Tạo thành công!
              {projectDir && (
                <span className="text-xs bg-green-200 px-2 py-1 rounded-full ml-auto">
                  Đã lưu vào {projectDir}/voice_original.mp3
                </span>
              )}
            </p>
            <audio src={audioUrl} controls className="w-full" />
            <a href={audioUrl} target="_blank" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
              <Download className="w-4 h-4" /> Tải xuống file mp3 gốc
            </a>
          </div>
        )}

        {isLocalVoiceExists && !audioUrl && (
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-3">
            <p className="text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Đã có file Voice gốc
              <span className="text-xs bg-emerald-200 px-2 py-1 rounded-full ml-auto">
                {projectDir}\voice_original.mp3
              </span>
            </p>
            <p className="text-emerald-600 text-xs">Hệ thống đã ghi nhận file voice này tại thư mục dự án.</p>
          </div>
        )}
      </div>

      <VoiceSelectionDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentLang="vi"
        onSelectVoice={(voice) => {
          setSelectedVoice(voice);
          setIsOpen(false);
        }}
        favoriteVoices={[]} 
        onToggleFavoriteVoice={(id, name) => {
           console.log("Xử lý thêm/xoá yêu thích", id, name)
        }}
      />
    </div>
  )
}
