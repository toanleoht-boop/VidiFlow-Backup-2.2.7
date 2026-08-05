import React, { useState, useEffect } from 'react';
import { Scissors, RefreshCw, Layers, FolderOpen, FileText, Music, Image as ImageIcon, Play, Save, Zap, Move, ArrowLeftRight, Trash2, Maximize2, Volume2, RotateCcw, Type, RefreshCw as ShuffleIcon, ListOrdered, Video } from 'lucide-react';

interface UltraModule {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
}

interface AudioTimelineProProps {
  projectDir?: string;
  storyboardData?: any;
  seoTitle?: string;
  getAutoScriptPath?: () => Promise<string | null>;
  onComplete?: () => void;
}

export default function AudioTimelinePro({ projectDir, storyboardData, seoTitle, getAutoScriptPath, onComplete }: AudioTimelineProProps) {
  const automationDefaults = (() => {
    try { return JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}"); }
    catch { return {}; }
  })();
  const [sliceScript, setSliceScript] = useState("");
  const [sliceAudio, setSliceAudio] = useState("");
  const [sliceOut, setSliceOut] = useState("");
  
  const [syncJson, setSyncJson] = useState("");
  const [restartSync, setRestartSync] = useState(false);
  
  const [imgDir, setImgDir] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [useMediaAudio, setUseMediaAudio] = useState(false);
  const [smartDialogueCut, setSmartDialogueCut] = useState(true);
  const [mediaFolders, setMediaFolders] = useState({ imageDir: "", videoDir: "", imageCount: 0, videoCount: 0 });
  const [templateProj, setTemplateProj] = useState("");
  const [newProjName, setNewProjName] = useState("");
  const [skipSlice, setSkipSlice] = useState(false);
  const [mixVoicesDir, setMixVoicesDir] = useState("");
  const [teleAutomix, setTeleAutomix] = useState(false);
  const [restartAutomix, setRestartAutomix] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isLoadingProjectFiles, setIsLoadingProjectFiles] = useState(false);
  const [sliceFeedback, setSliceFeedback] = useState<{ state: "idle" | "running" | "success" | "error"; message: string }>({ state: "idle", message: "" });

  useEffect(() => {
    if (!projectDir) return;
    let cancelled = false;
    setIsLoadingProjectFiles(true);
    setNewProjName("FINAL_VIDEO");

    void (async () => {
      try {
        const response = await fetch("/api/timeline/project-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectDir }),
        });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok || !data.success) throw new Error(data.error || "Không thể tải file dự án.");
        setSliceScript(data.script);
        setSliceAudio(data.audio);
        setSliceOut(data.voiceDir);
        const initialType: "image" | "video" = data.imageCount > 0 ? "image" : "video";
        setMediaFolders({
          imageDir: data.imageDir || projectDir + "\\img",
          videoDir: data.videoDir || projectDir + "\\vid",
          imageCount: Number(data.imageCount || 0),
          videoCount: Number(data.videoCount || 0),
        });
        setMediaType(initialType);
        setImgDir(initialType === "image" ? (data.imageDir || projectDir + "\\img") : (data.videoDir || projectDir + "\\vid"));
        setMixVoicesDir(data.voiceDir);
      } catch (error) {
        if (cancelled) return;
        // Keep a useful default even if the project was just created.
        setSliceScript(projectDir + "\\script.txt");
        setSliceAudio(projectDir + "\\voice_original.mp3");
        setSliceOut(projectDir + "\\vocie");
        setImgDir(projectDir + "\\img");
        setMixVoicesDir(projectDir + "\\vocie");
      } finally {
        if (!cancelled) setIsLoadingProjectFiles(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectDir]);

  // Step 7 runs before rendering: use its SEO title as the export filename,
  // while keeping the field editable for a manual title.
  useEffect(() => {
    const safeTitle = String(seoTitle || "").replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
    if (safeTitle) setNewProjName(safeTitle.slice(0, 120));
  }, [seoTitle]);

  // FFMPEG States
  const [ffmpegRes, setFfmpegRes] = useState(automationDefaults.resolution || "1080p");
  const [ffmpegRatio, setFfmpegRatio] = useState("16:9");
  const [motionTemplate, setMotionTemplate] = useState(automationDefaults.motionEnabled === false ? "none" : automationDefaults.motionStyle || "auto");
  const [motionIntensity, setMotionIntensity] = useState(automationDefaults.motionIntensity || "gentle");
  const [subtitleEnabled, setSubtitleEnabled] = useState(!!automationDefaults.subtitleEnabled);
  const [subtitleScriptPath, setSubtitleScriptPath] = useState("");
  const [subtitleStyle, setSubtitleStyle] = useState(automationDefaults.subtitleStyle || "modern");
  const [subtitlePosition, setSubtitlePosition] = useState(automationDefaults.subtitlePosition || "bottom");
  const [watermarkType, setWatermarkType] = useState<"image" | "text">(automationDefaults.watermarkType === "text" ? "text" : "image");
  const [watermarkPath, setWatermarkPath] = useState(automationDefaults.watermarkPath || "");
  const [watermarkText, setWatermarkText] = useState(automationDefaults.watermarkText || "");
  const [watermarkPosition, setWatermarkPosition] = useState(automationDefaults.watermarkPosition || "bottom-right");
  const [renderPreviewPath, setRenderPreviewPath] = useState("");
  const [renderFeedback, setRenderFeedback] = useState<{ state: "idle" | "running" | "success" | "error"; message: string }>({ state: "idle", message: "" });

  // Step 6 follows the aspect ratio last used to generate images/videos.
  // PipelineStep1 persists this configuration before the render screen mounts.
  useEffect(() => {
    try {
      const visualConfig = JSON.parse(localStorage.getItem("cc_visualConfig_v2") || "{}");
      const generatedRatio = String(visualConfig?.aspectRatio || "");
      if (["16:9", "9:16", "1:1"].includes(generatedRatio)) {
        setFfmpegRatio(generatedRatio);
      }
    } catch {
      // Keep the safe 16:9 default when old local data is malformed.
    }
  }, []);

  // Ultra Tool States
  const [ultraEnabled, setUltraEnabled] = useState(false);
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({
    dynamic_motion: true,
    auto_transition: true,
    auto_fill_canvas: true,
  });
  const [showOrderInput, setShowOrderInput] = useState<boolean>(false);
  const [audioOrderList, setAudioOrderList] = useState<string>("");

  const ultraModules: UltraModule[] = [
    { id: "sync_image_to_audio", title: "SYNC IMAGE TO AUDIO", desc: "Kéo dài ảnh theo độ dài nhạc", icon: Music },
    { id: "ultra_music_mix", title: "ULTRA MUSIC MIX", desc: "Xáo trộn thứ tự nhạc", icon: ShuffleIcon },
    { id: "custom_audio_order", title: "CUSTOM AUDIO ORDER", desc: "Sắp xếp nhạc theo danh sách", icon: ListOrdered },
    { id: "randomize_video", title: "RANDOMIZE VIDEO", desc: "Xáo trộn đoạn video", icon: ShuffleIcon },
    { id: "dynamic_motion", title: "DYNAMIC MOTION", desc: "Zoom & pan ngẫu nhiên", icon: Move },
    { id: "auto_transition", title: "AUTO TRANSITION", desc: "Chèn hiệu ứng chuyển cảnh", icon: ArrowLeftRight },
    { id: "clear_transitions", title: "CLEAR TRANSITIONS", desc: "Xóa chuyển cảnh cũ", icon: Trash2 },
    { id: "auto_fill_canvas", title: "AUTO FILL CANVAS", desc: "Xóa bỏ viền đen", icon: Maximize2 },
    { id: "normalize_volume", title: "NORMALIZE VOLUME", desc: "Cân bằng âm lượng 0dB", icon: Volume2 },
    { id: "reverse_timeline", title: "REVERSE TIMELINE", desc: "Đảo ngược dòng thời gian", icon: RotateCcw },
    { id: "auto_subtitles", title: "AUTO SUBTITLES", desc: "Tạo chữ từ kịch bản", icon: Type },
  ];

  const toggleModule = (id: string) => {
    setActiveModules((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (id === "custom_audio_order") {
        setShowOrderInput(next[id]);
      }
      return next;
    });
  };

  const addGlobalLog = (msg: string) => {
    window.dispatchEvent(new CustomEvent("global-terminal-log", { detail: msg }));
  };

  const clearGlobalLogs = () => {
    window.dispatchEvent(new CustomEvent("global-terminal-log", { detail: "CLEAR" }));
  };

  const pickPath = async (mode: 'file' | 'dir', title: string, setter: (val: string) => void) => {
    try {
      const res = await fetch(`/api/dialog/pick?mode=${mode}&title=${encodeURIComponent(title)}`);
      const data = await res.json();
      if (data.success && data.path) {
        setter(data.path);
      }
    } catch (err) {
      console.error("Lỗi chọn đường dẫn", err);
    }
  };

  const runPythonCommand = async (action: string, params: any) => {
    setLoadingAction(action);
    clearGlobalLogs();
    if (action === "slice") setSliceFeedback({ state: "running", message: "Đang chuẩn bị cắt voice..." });
    
    try {
      const response = await fetch("/api/timeline/run-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, params }),
      });

      if (!response.ok) {
        throw new Error(`Lỗi server: ${response.status}`);
      }

      if (!response.body) throw new Error("Không thể đọc luồng dữ liệu (Stream)");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i].replace(/^data:\s*/, '').trim();
          if (part) {
            try {
              const evt = JSON.parse(part);
              if (evt.type === 'log') {
                addGlobalLog(evt.message);
                setRenderFeedback({ state: "running", message: evt.message });
                if (action === "slice") setSliceFeedback({ state: "running", message: evt.message });
              } else if (evt.type === 'result') {
                if (evt.data.success) {
                  addGlobalLog("✅ Hoàn tất xử lý.");
                  if (action === "slice") {
                    const count = evt.data.count ? ` ${evt.data.count} file voice` : " voice";
                    setSliceFeedback({ state: "success", message: `Đã cắt xong${count}. Bạn có thể kiểm tra thư mục vocie.` });
                  }
                } else {
                  addGlobalLog(`❌ Lỗi xử lý: ${evt.data.error}`);
                  if (action === "slice") setSliceFeedback({ state: "error", message: evt.data.error || "Không thể cắt voice." });
                }
              } else if (evt.type === 'error') {
                setRenderFeedback({ state: "error", message: evt.message || "Render thất bại." });
                addGlobalLog(`⚠️ ${evt.message}`);
              }
            } catch (e) {
              console.log("Failed to parse SSE", part);
            }
          }
        }
        buffer = parts[parts.length - 1];
      }
    } catch (err: any) {
      setRenderFeedback({ state: "error", message: err.message || "Không thể bắt đầu render." });
      addGlobalLog(`❌ Exception: ${err.message}`);
      if (action === "slice") setSliceFeedback({ state: "error", message: err.message || "Không thể kết nối để cắt voice." });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSlice = async () => {
    let scriptToUse = sliceScript;
    // Always prefer the current Step 3 scene dialogue. It is the source that
    // generated the media, so it is the only reliable 1:1 mapping for Whisper.
    if (projectDir && storyboardData?.scenes?.length) {
      const lines: string[] = ["=== DIALOGUE TIMELINE FROM STEP 3 ===", ""];
      let voicePartIndex = 0;
      storyboardData.scenes.forEach((scene: any, sceneIndex: number) => {
        const prompts = scene.imagePrompts || [];
        if (!prompts.length) {
          const dialogue = String(scene.text_vi || scene.text || "").trim();
          if (dialogue) {
            voicePartIndex++;
            lines.push(`--- Scene ${voicePartIndex} ---`, `[Dialogue]: ${dialogue}`, "");
          }
          return;
        }
        prompts.forEach((prompt: any, promptIndex: number) => {
          const dialogue = String(
            prompt.subText_vi || prompt.subText ||
            (prompts.length === 1 ? (scene.text_vi || scene.text || "") : "")
          ).trim();
          if (!dialogue) return;
          voicePartIndex++;
          const code = prompt.code || `S${sceneIndex + 1}.${promptIndex + 1}`;
          lines.push(`--- Scene ${voicePartIndex} (${code}) ---`, `[Dialogue]: ${dialogue}`, "");
        });
      });
      if (voicePartIndex) {
        const step3Path = projectDir + "\\step3_dialogues.txt";
        try {
          const response = await fetch("/api/save-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: step3Path, content: lines.join("\n") }),
          });
          if (!response.ok) throw new Error("Không thể lưu thoại Bước 3.");
          scriptToUse = step3Path;
          setSliceScript(step3Path);
          addGlobalLog(`Dùng trực tiếp ${voicePartIndex} câu thoại từ Bước 3 để Whisper cắt voice.`);
        } catch (error: any) {
          addGlobalLog(`⚠️ Không thể lấy thoại trực tiếp từ Bước 3: ${error.message}`);
        }
      }
    }
    if (!scriptToUse && getAutoScriptPath) {
      addGlobalLog("Đang tải kịch bản backup tự động từ các bước trước...");
      const autoPath = await getAutoScriptPath();
      if (autoPath) {
        scriptToUse = autoPath;
        setSliceScript(autoPath);
      }
    }
    
    if (!scriptToUse) {
      addGlobalLog("❌ Không có file kịch bản!");
      return;
    }
    
    runPythonCommand('slice', { script: scriptToUse, audio: sliceAudio, outdir: sliceOut, imgdir: imgDir });
  };

  const handleSync = () => {
    runPythonCommand('sync', { json: syncJson });
  };

  const handleRenderFfmpeg = async () => {
    setLoadingAction("ffmpeg");
    setRenderPreviewPath("");
    setRenderFeedback({ state: "running", message: "Đang gửi yêu cầu render..." });
    clearGlobalLogs();
    
    try {
      const response = await fetch("/api/render-ffmpeg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imgDir, 
          voiceDir: mixVoicesDir || sliceOut, 
          outputDir: projectDir || "D:\\Capcut_Projects\\Export", 
          newProjName: newProjName || "Headless_Render",
          resolution: ffmpegRes,
          aspectRatio: ffmpegRatio,
          originalAudio: sliceAudio,
          mediaType,
          useMediaAudio: mediaType === "video" && useMediaAudio,
          smartDialogueCut: mediaType === "video" && useMediaAudio && smartDialogueCut,
          motionTemplate,
          motionIntensity,
          subtitleEnabled,
          subtitleScriptPath: subtitleScriptPath || sliceScript,
          subtitleStyle,
          subtitlePosition,
          watermarkType,
          watermarkPath,
          watermarkText,
          watermarkPosition,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || `Lỗi server: ${response.status}`);
      }
      if (!response.body) throw new Error("Không thể đọc luồng dữ liệu (Stream)");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i].replace(/^data:\s*/, '').trim();
          if (part) {
            try {
              const evt = JSON.parse(part);
              if (evt.type === 'log') {
                addGlobalLog(evt.message);
                if (evt.message.includes('Thành công') || evt.message.includes('success')) {
                  if (onComplete) onComplete();
                }
              } else if (evt.type === 'error') {
                addGlobalLog(`⚠️ Lỗi: ${evt.message}`);
              } else if (evt.type === 'done') {
                setRenderFeedback({ state: "success", message: "Render hoàn tất. Bạn có thể xem trước hoặc tải video." });
                if (evt.outputPath) {
                  setRenderPreviewPath(`/api/serve-local-file?path=${encodeURIComponent(evt.outputPath)}&t=${Date.now()}`);
                  addGlobalLog(`Preview sẵn sàng: ${evt.outputPath}`);
                }
                if (onComplete) onComplete();
              }
            } catch (e) {}
          }
        }
        buffer = parts[parts.length - 1];
      }
    } catch (err: any) {
      addGlobalLog(`❌ Exception: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAutomix = () => {
    runPythonCommand('automix', { 
      imgdir: imgDir, 
      template: templateProj, 
      name: newProjName, 
      skip_slice: skipSlice, 
      mix_voices: mixVoicesDir,
      ultra_options: ultraEnabled ? {
        ...activeModules,
        audio_order_list: audioOrderList
      } : null
    });
  };

  const selectMediaType = (nextType: "image" | "video") => {
    setMediaType(nextType);
    const directory = nextType === "image" ? mediaFolders.imageDir : mediaFolders.videoDir;
    if (directory) setImgDir(directory);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
            <Music className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">AUDIO & TIMELINE PRO (TÍCH HỢP ULTRA)</h2>
            <p className="text-slate-500 mt-1 text-sm">Cắt voice tự động, tạo project và tự động áp dụng hiệu ứng CapCut Ultra</p>
          </div>
        </div>

        <div className="p-6 space-y-10">
          
          {/* Section 1: Cut Voice */}
          <div className="space-y-5 relative">
            <div className="flex items-center gap-3 text-slate-800 font-bold text-lg border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Scissors className="w-5 h-5 text-blue-500" />
              </div>
              <h3>1. CẮT VOICE (CHẠY LẺ)</h3>
            </div>
            
            {projectDir && (
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-3 rounded-xl text-sm font-medium mb-4 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                {isLoadingProjectFiles ? "Đang tự động tải file và thư mục của dự án..." : "Đã tự động nạp kịch bản, voice gốc, media và thư mục xuất vocie từ dự án."}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> File Kịch bản (.txt)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sliceScript}
                    onChange={(e) => setSliceScript(e.target.value)}
                    placeholder={projectDir ? "Sẽ tự động lấy kịch bản từ Bước 1..." : "Chọn file Backup .txt..."}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-500 outline-none text-slate-700 transition-all shadow-sm"
                  />
                  <button 
                    onClick={() => pickPath('file', 'Chọn File Kịch Bản (.txt)', setSliceScript)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200 whitespace-nowrap shadow-sm hover:shadow">
                    Chọn File
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Music className="w-4 h-4 text-slate-400" /> Audio Gốc (.mp3/.wav)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sliceAudio}
                    onChange={(e) => setSliceAudio(e.target.value)}
                    placeholder="Đường dẫn file Audio gốc..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 transition-all"
                  />
                  <button 
                    onClick={() => pickPath('file', 'Chọn File Audio (.mp3/.wav)', setSliceAudio)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200 whitespace-nowrap shadow-sm hover:shadow">
                    Chọn File
                  </button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-slate-400" /> Thư mục xuất Voice
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sliceOut}
                    onChange={(e) => setSliceOut(e.target.value)}
                    placeholder="Chọn thư mục chứa các file voice cắt nhỏ..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 transition-all"
                  />
                  <button 
                    onClick={() => pickPath('dir', 'Chọn Thư Mục Xuất Voice', setSliceOut)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200 whitespace-nowrap shadow-sm hover:shadow">
                    Chọn Thư mục
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSlice}
              disabled={loadingAction !== null || isLoadingProjectFiles}
              className={`flex items-center justify-center gap-2 w-full md:w-auto md:px-8 py-3 rounded-xl font-bold text-white transition-all ${loadingAction === 'slice' || isLoadingProjectFiles ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
            >
              {loadingAction === 'slice' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Scissors className="w-5 h-5" />
              )}
              {isLoadingProjectFiles ? 'ĐANG TẢI DỰ ÁN...' : loadingAction === 'slice' ? 'ĐANG CẮT VOICE...' : 'CHẠY CẮT VOICE LẺ'}
            </button>
            {sliceFeedback.state !== "idle" && (
              <div className={`mt-3 w-full md:w-auto md:inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                sliceFeedback.state === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                sliceFeedback.state === "error" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {sliceFeedback.state === "running" && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                <span>{sliceFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Section 2: Sync Timeline (HIDDEN) */}
          {false && (
            <div className="space-y-5 relative">
              <div className="flex items-center gap-3 text-slate-800 font-bold text-lg border-b border-slate-100 pb-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-indigo-500" />
                </div>
                <h3>2. ĐỒNG BỘ TIMELINE (CHẠY LẺ)</h3>
              </div>
            </div>
          )}

          {/* Section 3: Auto-Mix & Ultra (HIDDEN) */}
          {false && (
            <div className="space-y-5 relative bg-slate-50 -mx-6 p-6 sm:mx-0 sm:rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3 text-slate-800 font-bold text-lg">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Layers className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3>3. TẠO PROJECT AUTO-MIX & ULTRA</h3>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Render Headless FFMPEG */}
          <div className="space-y-5 relative bg-white border border-slate-200 shadow-sm p-6 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3 text-slate-800 font-bold text-lg">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Video className="w-5 h-5 text-red-600" />
                </div>
                <h3>2. RENDER NHANH FFMPEG (KHÔNG CẦN CAPCUT)</h3>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 font-medium">Sử dụng FFMPEG để tự động ghép Ảnh + Audio thành Video cực nhanh mà không cần mở phần mềm thứ 3.</p>

            {mediaFolders.imageCount > 0 && mediaFolders.videoCount > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-sm font-semibold text-amber-900">Dự án có cả ảnh và video. Chọn nguồn để render:</span>
                <select value={mediaType} onChange={(e) => selectMediaType(e.target.value as "image" | "video")}
                  className="bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none">
                  <option value="image">Dùng ảnh ({mediaFolders.imageCount} file) + hiệu ứng chuyển động</option>
                  <option value="video">Dùng video ({mediaFolders.videoCount} file) + giữ chuyển động gốc</option>
                </select>
              </div>
            )}
            {(mediaFolders.imageCount > 0 || mediaFolders.videoCount > 0) && (
              <p className="text-xs font-medium text-slate-500 mb-0 leading-relaxed">
                Nguồn tự động: {mediaType === "image" ? `Ảnh (${mediaFolders.imageCount} file, có hiệu ứng FFmpeg)` : `Video (${mediaFolders.videoCount} file, không thêm hiệu ứng ảnh)`}.
              </p>
            )}

            {mediaType === "video" && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-violet-950">
                  <input type="checkbox" checked={useMediaAudio} onChange={(e) => setUseMediaAudio(e.target.checked)} className="h-4 w-4 accent-violet-600" />
                  <Volume2 className="w-4 h-4 text-violet-700" /> Giữ tiếng hội thoại trực tiếp từ video AI
                </label>
                <p className="text-xs leading-relaxed text-violet-800">Dành cho clip có nhân vật nói trực tiếp. Tool dùng tiếng gốc của từng video, không thay bằng voice ngoài.</p>
                {useMediaAudio && <label className="flex items-start gap-2 text-xs font-semibold text-violet-900">
                  <input type="checkbox" checked={smartDialogueCut} onChange={(e) => setSmartDialogueCut(e.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-600" />
                  <span><b>Cắt tinh tế bằng AI (Whisper)</b><br />Quét lời thoại từng clip, chỉ rút phần im lặng quá dài ở đầu/cuối; giữ khoảng nghỉ tự nhiên và toàn bộ khoảng lặng giữa câu.</span>
                </label>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" /> Thư mục nguồn {mediaType === "image" ? "ảnh" : "video"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imgDir}
                    onChange={(e) => setImgDir(e.target.value)}
                    placeholder={mediaType === "image" ? "Nơi chứa ảnh 1, 2, 3..." : "Nơi chứa video 1, 2, 3..."}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 transition-all shadow-sm"
                  />
                  <button 
                    onClick={() => pickPath('dir', mediaType === "image" ? 'Chọn Thư Mục Ảnh' : 'Chọn Thư Mục Video', setImgDir)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200 whitespace-nowrap shadow-sm hover:shadow">
                    Chọn Thư mục
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Music className="w-4 h-4 text-slate-400" /> Thư mục Voice đã cắt
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mixVoicesDir}
                    onChange={(e) => setMixVoicesDir(e.target.value)}
                    placeholder="Nếu trống sẽ lấy từ Bước 1..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 transition-all"
                  />
                  <button 
                    onClick={() => pickPath('dir', 'Chọn Thư Mục Voice', setMixVoicesDir)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200 whitespace-nowrap shadow-sm hover:shadow">
                    Chọn Thư mục
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Save className="w-4 h-4 text-slate-400" /> Tên Video Xuất
                </label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Tên video (ví dụ: video_demo)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 transition-all shadow-sm"
                />
                {seoTitle && <p className="text-xs text-emerald-600 font-medium">Đã tự lấy từ tiêu đề SEO ở Bước 3; bạn vẫn có thể sửa tên file.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 min-w-0">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">Độ phân giải</label>
                  <select 
                    value={ffmpegRes} 
                    onChange={(e) => setFfmpegRes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 transition-all shadow-sm"
                  >
                    <option value="1080p">1080p (FHD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="4k">4K (UHD)</option>
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">Khung hình <span className="text-[10px] font-medium text-emerald-600">Tự đồng bộ từ bước tạo ảnh/video</span></label>
                  <select 
                    value={ffmpegRatio} 
                    onChange={(e) => setFfmpegRatio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 transition-all shadow-sm"
                  >
                    <option value="16:9">16:9 (Youtube)</option>
                    <option value="9:16">9:16 (Shorts/Tiktok)</option>
                    <option value="1:1">1:1 (Square)</option>
                  </select>
                </div>
              </div>
            </div>

            {mediaType === "image" && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-2">
                <label className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                  <Move className="w-4 h-4" /> Hiệu ứng chuyển động ảnh
                </label>
                <select value={motionTemplate} onChange={(e) => setMotionTemplate(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none">
                  <option value="auto">Tự động luân phiên 10 hiệu ứng</option>
                  <option value="none">Không dùng hiệu ứng (ảnh tĩnh)</option>
                  <option value="zoom_in_center">Zoom vào giữa</option>
                  <option value="zoom_out_center">Zoom ra giữa</option>
                  <option value="zoom_in_corner">Zoom vào góc trên trái</option>
                  <option value="zoom_out_corner">Zoom ra góc dưới phải</option>
                  <option value="pan_l_to_r">Pan trái sang phải</option>
                  <option value="pan_r_to_l">Pan phải sang trái</option>
                  <option value="pan_t_to_b">Pan trên xuống dưới</option>
                  <option value="pan_b_to_t">Pan dưới lên trên</option>
                  <option value="diagonal_tl_to_br">Pan chéo trên trái xuống dưới phải</option>
                  <option value="diagonal_bl_to_tr">Pan chéo dưới trái lên trên phải</option>
                </select>
                <select value={motionIntensity} onChange={(e) => setMotionIntensity(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none">
                  <option value="gentle">Nhẹ nhàng — khuyên dùng (zoom/pan rất chậm)</option>
                  <option value="natural">Tự nhiên (chậm vừa)</option>
                  <option value="dynamic">Năng động (nhanh hơn)</option>
                </select>
                <p className="text-xs text-indigo-700 leading-relaxed">Mỗi ảnh chạy theo toàn bộ thời lượng câu thoại. Mặc định nhẹ nhàng để không tạo cảm giác lia máy gấp.</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <input type="checkbox" checked={subtitleEnabled} onChange={(e) => setSubtitleEnabled(e.target.checked)} className="h-4 w-4 accent-red-600" />
                  <Type className="w-4 h-4 text-red-600" /> Tạo phụ đề trong video
                </label>
                <p className="text-xs text-slate-500">Dùng lời thoại từ phần chia cảnh ở Bước 2 và timeline voice để tạo file SRT, rồi chèn phụ đề dưới video.</p>
                <div className="space-y-2">
                  {subtitleEnabled && <div className="flex gap-2">
                    <input value={subtitleScriptPath} onChange={(e) => setSubtitleScriptPath(e.target.value)} placeholder="Tự dùng step3_dialogues.txt" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none" />
                    <button type="button" onClick={() => pickPath('file', 'Chọn file lời thoại', setSubtitleScriptPath)} className="rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">Chọn</button>
                  </div>}
                  <div className="grid grid-cols-2 gap-2">
                    <select value={subtitleStyle} onChange={(e) => setSubtitleStyle(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none">
                      <option value="modern">Hiện đại — chữ trắng viền đen</option>
                      <option value="boxed">Hộp nền đen — dễ đọc</option>
                      <option value="minimal">Tối giản — chữ nhỏ nhẹ</option>
                      <option value="shorts">Shorts — chữ lớn nổi bật</option>
                    </select>
                    <select value={subtitlePosition} onChange={(e) => setSubtitlePosition(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none">
                      <option value="bottom">Phía dưới</option>
                      <option value="middle">Chính giữa</option>
                      <option value="top">Phía trên</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-emerald-700">Phụ đề tự chia thành các cụm ngắn, tối đa 2 dòng và tự thu gọn hơn với video 9:16.</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ImageIcon className="w-4 h-4 text-red-600" /> Logo kênh / Watermark</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setWatermarkType("image")} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${watermarkType === "image" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-600"}`}>Logo hình ảnh</button>
                  <button type="button" onClick={() => setWatermarkType("text")} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${watermarkType === "text" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-600"}`}>Logo dạng chữ</button>
                </div>
                {watermarkType === "image" ? <div className="flex gap-2">
                  <input value={watermarkPath} onChange={(e) => setWatermarkPath(e.target.value)} placeholder="Chọn PNG/JPG logo (có thể trong suốt)" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none" />
                  <button type="button" onClick={() => pickPath('file', 'Chọn logo watermark', setWatermarkPath)} className="rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">Chọn</button>
                </div> : <input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Nhập tên kênh hoặc nội dung watermark" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none" />}
                <select value={watermarkPosition} onChange={(e) => setWatermarkPosition(e.target.value)} disabled={watermarkType === "image" ? !watermarkPath : !watermarkText.trim()} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none disabled:opacity-50">
                  <option value="bottom-right">Góc dưới phải</option><option value="bottom-left">Góc dưới trái</option><option value="top-right">Góc trên phải</option><option value="top-left">Góc trên trái</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleRenderFfmpeg}
              disabled={loadingAction !== null || !imgDir || (!mixVoicesDir && !sliceOut)}
              className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black tracking-wide text-white transition-all shadow-md mt-6 ${
                loadingAction === 'ffmpeg' 
                  ? 'bg-slate-500 cursor-not-allowed' 
                  : !imgDir || (!mixVoicesDir && !sliceOut)
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {loadingAction === 'ffmpeg' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Video className="w-5 h-5" />
              )}
              {loadingAction === 'ffmpeg' ? 'ĐANG RENDER FFMPEG...' : '🚀 RENDER NGAY BẰNG FFMPEG'}
            </button>
            {renderFeedback.state !== "idle" && (
              <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                renderFeedback.state === "error" ? "border-rose-200 bg-rose-50 text-rose-700" :
                renderFeedback.state === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                "border-blue-200 bg-blue-50 text-blue-700"
              }`}>
                {renderFeedback.state === "running" && <span className="inline-block w-3.5 h-3.5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin align-[-2px]" />}
                {renderFeedback.message}
              </div>
            )}
            {renderPreviewPath && (
              <div className="mt-5 rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-emerald-800">Render hoàn tất — xem trước video</span>
                  <a href={renderPreviewPath} download className="text-xs font-bold text-emerald-700 hover:text-emerald-900">Tải video</a>
                </div>
                <video src={renderPreviewPath} controls className="w-full max-h-[520px] rounded-lg bg-black" />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
