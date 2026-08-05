import React, { useState, useRef } from 'react';
import { Video, Sparkles, Download, RefreshCw, CheckCircle } from 'lucide-react';
import { Storyboard } from '../types';
import { vidiflowConfirm } from './VidiFlowDialogCenter';

interface VideoGenerationStudioProps {
  projectDir: string;
  storyboardData: Storyboard | null;
  generatedImages: Record<string, string>; // Maps code to VietTheo public image URL
  telegramToken: string;
  telegramChatId: string;
  onComplete?: () => void;
}

interface VideoStatus {
  status: 'queued' | 'rendering' | 'upscaling' | 'done' | 'error';
  progress: number;
  message?: string;
  url?: string;
}

export default function VideoGenerationStudio({
  projectDir,
  storyboardData,
  generatedImages,
  telegramToken,
  telegramChatId,
  onComplete
}: VideoGenerationStudioProps) {
  const [videoStatus, setVideoStatus] = useState<Record<string, VideoStatus>>({});
  const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string>("");

  const abortController = useRef<AbortController | null>(null);

  const sendTelegramNotification = async (message: string) => {
    if (!telegramToken || !telegramChatId) return;
    try {
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: "HTML"
        })
      });
    } catch(e) {
      console.error("Lỗi gửi Telegram", e);
    }
  };

  const handleGenerateVideo = async (code: string, englishPrompt: string, startImageUrl: string, signal?: AbortSignal) => {
    if (!startImageUrl) return;
    setVideoStatus(prev => ({ ...prev, [code]: { status: 'rendering', progress: 10, message: 'Khởi tạo Video Job...' } }));
    
    try {
      // 1. Tạo Job Video
      setVideoStatus(prev => ({ ...prev, [code]: { status: 'rendering', progress: 20, message: 'Gửi yêu cầu render...' } }));
      const initRes = await fetch("/api/api-media/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              prompt: englishPrompt,
              startImage: startImageUrl
          }),
          signal
      });
      const initData = await initRes.json();
      if (!initData.success || !initData.jobId) throw new Error(initData.error || "Lỗi tạo Video Job API");

      let jobId = initData.jobId;
      let flow2RequestId = null;

      // 2. Polling Video Gốc
      setVideoStatus(prev => ({ ...prev, [code]: { status: 'rendering', progress: 30, message: 'Đang sinh video gốc...' } }));
      while (true) {
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
          await new Promise(r => setTimeout(r, 5000)); // Chờ 5 giây
          const pollRes = await fetch(`/api/api-media/job/${jobId}`, { signal });
          const pollData = await pollRes.json();
          
          if (pollData.status === "SUCCEEDED") {
              flow2RequestId = pollData.flow2RequestId;
              break;
          } else if (pollData.status === "FAILED") {
              throw new Error("Lỗi ở quá trình sinh video gốc");
          } else {
              const prog = pollData.progress || 30;
              setVideoStatus(prev => ({ ...prev, [code]: { status: 'rendering', progress: 30 + Math.floor(prog * 0.4), message: `Đang sinh video (${prog}%)...` } }));
          }
      }

      // 3. Upscale Video 1080p
      setVideoStatus(prev => ({ ...prev, [code]: { status: 'upscaling', progress: 75, message: `Bắt đầu Upscale 1080p...` } }));
      const upRes = await fetch("/api/api-media/upsample-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: flow2RequestId }),
          signal
      });
      const upData = await upRes.json();
      if (!upData.success || !upData.jobId) throw new Error(upData.error || "Lỗi tạo Upscale Video Job");

      let upscaleJobId = upData.jobId;
      let finalUrl = null;

      // 4. Polling Upscale Video
      while (true) {
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
          await new Promise(r => setTimeout(r, 5000));
          const pollRes = await fetch(`/api/api-media/job/${upscaleJobId}`, { signal });
          const pollData = await pollRes.json();

          if (pollData.status === "SUCCEEDED") {
              finalUrl = pollData.url;
              break;
          } else if (pollData.status === "FAILED") {
              throw new Error("Lỗi ở quá trình Upscale Video");
          } else {
              const prog = pollData.progress || 0;
              setVideoStatus(prev => ({ ...prev, [code]: { status: 'upscaling', progress: 75 + Math.floor(prog * 0.25), message: `Đang Upscale 1080p (${prog}%)...` } }));
          }
      }

      if (finalUrl) {
          setGeneratedVideos(prev => ({ ...prev, [code]: finalUrl }));
          setVideoStatus(prev => ({ ...prev, [code]: { status: 'done', progress: 100 } }));
          autoSaveVideo(finalUrl, code);
          if (onComplete) onComplete();
          await sendTelegramNotification(`🛎️ <b>[Render Video Xong - ${code}]</b>\nĐã upscale 1080p thành công.`);
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setVideoStatus(prev => {
            const newState = { ...prev };
            delete newState[code];
            return newState;
        });
        return;
      }
      setVideoStatus(prev => ({ ...prev, [code]: { status: 'error', progress: 0, message: err.message } }));
    }
  };

  const autoSaveVideo = async (url: string, code: string) => {
    if (projectDir && url) {
        try {
          await fetch("/api/download-audio", { // Vẫn dùng /download-audio do backend viết đa năng lưu file
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: url,
              path: projectDir + "\\video\\scene-" + code + ".mp4"
            })
          });
        } catch (e) {
          console.error("Failed to auto-save video", e);
        }
    }
  };

  const handleGenerateAllVideos = async () => {
    if (!storyboardData) return;
    const allItems: { code: string; prompt: string; startImage: string }[] = [];
    storyboardData.scenes.forEach(s => {
      s.imagePrompts.forEach(p => {
        if (generatedImages[p.code]) {
          allItems.push({ code: p.code, prompt: p.englishPrompt, startImage: generatedImages[p.code] });
        }
      });
    });

    if (allItems.length === 0) {
      alert("Chưa có ảnh nào được tạo ở Bước 2. Hãy sinh ảnh trước khi tạo video!");
      return;
    }
    
    if (!(await vidiflowConfirm(`Bạn có muốn tự động tạo ${allItems.length} video chuyển động không?`, {
      title: "Xác nhận tạo video",
      confirmLabel: "Bắt đầu tạo",
      cancelLabel: "Quay lại",
    }))) return;

    setIsPlayingAll(true);
    const controller = new AbortController();
    abortController.current = controller;

    try {
      for (const item of allItems) {
        if (controller.signal.aborted) break;
        if (generatedVideos[item.code]) continue;
        await handleGenerateVideo(item.code, item.prompt, item.startImage, controller.signal);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsPlayingAll(false);
    }
  };

  const handleCancel = () => {
    if (abortController.current) {
        abortController.current.abort();
    }
    setIsPlayingAll(false);
  };

  // Tính số lượng ảnh đã có sẵn
  const totalAvailableImages = storyboardData ? storyboardData.scenes.reduce((acc, s) => acc + s.imagePrompts.filter(p => generatedImages[p.code]).length, 0) : 0;

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden mb-6 transition-all">
      <div className="p-5 md:p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-indigo-50 to-white relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
            <Video className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">BƯỚC 2: TẠO VIDEO AI (VIETTHEO)</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
              Chuyển đổi từng bức ảnh đã vẽ thành Video chuyển động 1080p bằng VietTheo.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-7">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Cột trái */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">Điều Khiển Tạo Video Hàng Loạt:</span>
              
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-700 font-medium">
                Video sinh ra sẽ dùng ảnh gốc ở Bước 2 làm điểm bắt đầu và tự động Upscale lên 1080p sắc nét.
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateAllVideos}
                    disabled={isPlayingAll || totalAvailableImages === 0}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 tracking-tight active:scale-95 transition-all shadow-xs disabled:bg-slate-300"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isPlayingAll ? "Đang tạo video..." : `Sinh Tất Cả Video (${totalAvailableImages} cảnh)`}
                  </button>
                  {isPlayingAll && (
                    <button onClick={handleCancel} className="bg-slate-800 text-white font-bold px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
                      Dừng
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải */}
          <div className="md:col-span-8 space-y-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">DANH SÁCH KHUNG HÌNH (CẦN TẠO ẢNH TRƯỚC):</span>
                {storyboardData && (
                  <span className="text-xs font-bold text-slate-500">
                    Hoàn thành: {Object.keys(generatedVideos).length} / {totalAvailableImages}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[650px] overflow-y-auto pr-2 pb-4">
                {storyboardData ? (
                  storyboardData.scenes.map((s) => (
                    s.imagePrompts.map((p, pi) => {
                      const hasImage = !!generatedImages[p.code];
                      return (
                        <div key={`${s.sceneNumber}-${pi}`} className={`bg-white border ${hasImage ? 'border-indigo-200 hover:border-indigo-400 hover:shadow-md' : 'border-slate-200 opacity-60'} rounded-2xl p-4 flex flex-col justify-between gap-4 items-stretch shadow-sm transition-all h-full group`}>
                          
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-1 rounded-md shrink-0">{p.code}</span>
                              <span className="text-[11px] font-bold text-slate-700 truncate" title={p.vietnameseLabel}>{p.vietnameseLabel}</span>
                            </div>
                          </div>
                          
                          {/* Image/Video Preview Area */}
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center aspect-video shrink-0 border border-slate-200">
                            {hasImage ? (
                              generatedVideos[p.code] ? (
                                <video src={generatedVideos[p.code]} controls className="w-full h-full object-contain bg-black" />
                              ) : (
                                <>
                                  <img src={generatedImages[p.code]} alt="Original" className="w-full h-full object-cover opacity-60" />
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                                      Ảnh gốc (Chờ tạo Video)
                                    </div>
                                  </div>
                                </>
                              )
                            ) : (
                              <div className="text-[10px] text-slate-400 font-medium flex flex-col items-center gap-1">
                                <Video className="w-6 h-6 text-slate-300" />
                                <span>Chưa tạo ảnh</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-end min-h-[40px]">
                            {hasImage && videoStatus[p.code] && !generatedVideos[p.code] ? (
                              <div className="w-full">
                                {videoStatus[p.code].status === 'error' ? (
                                  <div className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100 text-center line-clamp-2" title={videoStatus[p.code].message}>
                                    Lỗi: {videoStatus[p.code].message}
                                  </div>
                                ) : (
                                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">
                                    <div className="flex justify-between items-center mb-1.5">
                                      <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1.5 truncate">
                                        <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                                        <span className="truncate">{videoStatus[p.code].message}</span>
                                      </span>
                                      <span className="text-[10px] font-bold text-indigo-600 shrink-0">{videoStatus[p.code].progress}%</span>
                                    </div>
                                    <div className="w-full bg-indigo-200/50 rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-indigo-600 h-1.5 transition-all duration-500 ease-out" style={{ width: `${videoStatus[p.code].progress}%` }}></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : hasImage ? (
                              <button
                                onClick={() => handleGenerateVideo(p.code, p.englishPrompt, generatedImages[p.code])}
                                disabled={videoStatus[p.code]?.status === 'rendering' || videoStatus[p.code]?.status === 'upscaling'}
                                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-sm"
                              >
                                <Video className="w-3.5 h-3.5" />
                                {generatedVideos[p.code] ? "Làm Lại (Re-roll)" : "Tạo Video Mới"}
                              </button>
                            ) : null}
                          </div>

                        </div>
                      );
                    })
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Chưa có phân cảnh khởi tạo.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
