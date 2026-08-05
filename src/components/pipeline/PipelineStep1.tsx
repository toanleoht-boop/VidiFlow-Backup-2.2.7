import React from "react";
import { Image as ImageIcon, Loader2, ExternalLink, Upload, CircleAlert, Clock3, RefreshCw } from "lucide-react";
// Import hook vừa tạo phía trên
import { usePipelineWizard, PipelineWizardProps } from "./usePipelineWizard";
import { STORAGE_KEYS } from "../../constants/storageKeys";

export default function PipelineStep1(props: PipelineWizardProps) {
  const { project, setProject, loadingStates, batchProgress, handleUploadReferenceImage, handleUploadGlobalReferenceImages, handleRemoveGlobalReferenceImage, handleGenerateImage, handleGenerateAllImages, handleStopBatch, handleReloadMediaPreviews } = usePipelineWizard(props);
  const isBatchLoading = loadingStates.batchRender;
  const visibleBatchProgress = batchProgress || (() => {
    const sceneStates = Object.fromEntries((project.storyboard || []).map((scene: any) => [scene.id, scene.currentImage ? "completed" : "pending"])) as Record<string, "pending" | "running" | "completed" | "failed" | "stopped">;
    const completed = Object.values(sceneStates).filter((state) => state === "completed").length;
    return { total: project.storyboard?.length || 0, completed, succeeded: completed, failed: 0, sceneStates };
  })();
  const canStopBatch = isBatchLoading || Object.values(visibleBatchProgress.sceneStates).some((state) => state === "running" || state === "pending");
  // These display branches belong to scene cards below. Keep the Labs model
  // selector independent from them: an earlier edit referenced undeclared
  // values here, which crashed the whole page as soon as Google Labs was
  // selected.
  const isSceneRendering = false;
  const isBatchWaiting = false;
  const isBatchFailed = false;

  // Always initialize chromeProfiles from local storage on mount to ensure we have the latest Setup
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHROME_PROFILES);
      if (stored) {
        setProject((p: any) => ({
          ...p,
          visualConfig: {
            ...(p.visualConfig || {}),
            chromeProfiles: JSON.parse(stored)
          }
        }));
      } else {
        setProject((p: any) => ({
          ...p,
          visualConfig: {
            ...(p.visualConfig || {}),
            chromeProfiles: { 
              profiles: [{ id: Date.now().toString(), name: "Chrome Mặc Định", port: 9222, concurrency: 1, active: true }], 
              enabled: false 
            }
          }
        }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="storyboard-container bg-white rounded-3xl shadow-xs border border-slate-200 overflow-visible mb-6 p-6">
      {/* Header & Settings sticky container */}
      <div className="sticky -top-6 z-30 bg-white/95 backdrop-blur pb-4 mb-6 border-b border-slate-100 -mx-6 px-6 pt-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-800 uppercase">BƯỚC 2: TẠO ẢNH / VIDEO STUDIO (Playwright Pipeline)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Sử dụng tự động hóa Playwright để lấy ảnh trực tiếp từ UI Google Labs / Gemini Chat.
          </p>
          
          {/* Cấu hình nâng cao */}
          <div className="flex flex-wrap items-center gap-4 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {/* Chế độ nền tảng */}
            <label className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">Nền tảng:</span>
              <select 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={project.visualConfig?.generationMode || "gemini-chat"}
                onChange={(e) => {
                  const generationMode = e.target.value;
                  setProject((p: any) => ({
                    ...p,
                    visualConfig: {
                      ...p.visualConfig,
                      generationMode,
                      threadCount:
                        generationMode === "viettheo-api"
                          ? 5
                          : p.visualConfig?.threadCount,
                    },
                  }));
                }}
              >
                <option value="gemini-chat">Gemini Chat</option>
                <option value="labs-flow">Google Labs</option>
                <option value="viettheo-api">API Flow — Liên hệ Admin để mua key</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">Loại:</span>
              <select 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={project.visualConfig?.generateType || "image"}
                onChange={(e) => {
                  const generateType = e.target.value;
                  setProject((p: any) => ({
                    ...p,
                    visualConfig: {
                      ...p.visualConfig,
                      generateType,
                      imageGeneratorEngine: generateType === "video" ? "Omni Flash" : "Nano Banana Pro",
                    },
                  }));
                }}
              >
                <option value="image">Tạo Ảnh</option>
                <option value="video">Tạo Video</option>
              </select>
            </label>

            <div className="w-px h-5 bg-slate-300"></div>

            {/* Model Setup */}
            {project.visualConfig?.generationMode === "viettheo-api" ? (
              <>
                {project.visualConfig?.generateType === "video" ? (
                  <span className="text-[11px] font-bold text-slate-500 italic">Cấu hình video tự động tối ưu</span>
                ) : (
                  <label className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">Model API:</span>
                    <select 
                      className="text-[11px] border border-slate-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-purple-500 max-w-[150px]"
                      value={project.visualConfig?.imageGeneratorEngine || "NANO_BANANA_PRO"}
                      onChange={(e) => setProject((p: any) => ({ ...p, visualConfig: { ...p.visualConfig, imageGeneratorEngine: e.target.value } }))}
                    >
                      <option value="NANO_BANANA_PRO">NANO_BANANA_PRO</option>
                      <option value="NANO_BANANA">NANO_BANANA</option>
                    </select>
                  </label>
                )}
              </>
            ) : project.visualConfig?.generationMode === "labs-flow" ? (
              <>
                <label className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600">Model Google Labs:</span>
                  <select 
                    className="text-[11px] border border-slate-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-purple-500 max-w-[150px]"
                    value={project.visualConfig?.imageGeneratorEngine || (project.visualConfig?.generateType === "video" ? "Veo 3.1 - Quality" : "Nano Banana 2")}
                    onChange={(e) => {
                      const imageGeneratorEngine = e.target.value;
                      setProject((p: any) => ({
                        ...p,
                        visualConfig: {
                          ...p.visualConfig,
                          imageGeneratorEngine,
                          videoDuration:
                            (imageGeneratorEngine === "Veo 3.1 - Lite" ||
                              imageGeneratorEngine === "Veo 3.1 - Lite [Lower Priority]") &&
                            !["4s", "6s", "8s"].includes(p.visualConfig?.videoDuration || "10s")
                              ? "8s"
                              : p.visualConfig?.videoDuration,
                        },
                      }));
                    }}
                  >
                    {project.visualConfig?.generateType === "video" ? (
                      <>
                        <option value="Omni Flash">Omni Flash</option>
                        <option value="Veo 3.1 - Lite">Veo 3.1 - Lite</option>
                        <option value="Veo 3.1 - Lite [Lower Priority]">Veo 3.1 - Lite [Lower Priority] — Ultra</option>
                        <option value="Veo 3.1 - Fast">Veo 3.1 - Fast</option>
                        <option value="Veo 3.1 - Quality">Veo 3.1 - Quality</option>
                      </>
                    ) : isSceneRendering ? (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-600 text-white gap-3">
                        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                        <span className="text-[11px] font-extrabold">Đang tạo {project.visualConfig?.generateType === "video" ? "video" : "ảnh"}...</span>
                      </div>
                    ) : isBatchWaiting ? (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100 text-slate-500 gap-2">
                        <Clock3 className="w-7 h-7 text-amber-500" />
                        <span className="text-[11px] font-extrabold">Đang đợi tạo...</span>
                      </div>
                    ) : isBatchFailed ? (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-rose-50 text-rose-600 gap-2">
                        <CircleAlert className="w-8 h-8" />
                        <span className="text-[11px] font-extrabold">Tạo lỗi</span>
                      </div>
                    ) : (
                      <>
                        <option value="Nano Banana Pro">Nano Banana Pro</option>
                        <option value="Nano Banana 2">Nano Banana 2</option>
                        <option value="Nano Banana 2 Lite">Nano Banana 2 Lite</option>
                      </>
                    )}
                  </select>
                </label>
                
                {project.visualConfig?.generateType === "video" && (
                  <label className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">Thời lượng:</span>
                    <select 
                      className="text-[11px] border border-slate-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-purple-500 max-w-[80px]"
                      value={project.visualConfig?.videoDuration || "10s"}
                      onChange={(e) => setProject((p: any) => ({ ...p, visualConfig: { ...p.visualConfig, videoDuration: e.target.value } }))}
                    >
                      <option value="4s">4s</option>
                      <option value="6s">6s</option>
                      <option value="8s">8s</option>
                      <option value="10s">10s</option>
                    </select>
                  </label>
                )}
              </>
            ) : (
              <label className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600">Model Gemini:</span>
                <select 
                  className="text-[11px] border border-slate-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-purple-500 max-w-[150px]"
                  value={project.visualConfig?.geminiModel || "3.1 Pro"}
                  onChange={(e) => setProject((p: any) => ({ ...p, visualConfig: { ...p.visualConfig, geminiModel: e.target.value } }))}
                >
                  <option value="3.1 Flash-Lite">3.1 Flash-Lite</option>
                  <option value="3.5 Flash">3.5 Flash</option>
                  <option value="3.1 Pro">3.1 Pro</option>
                  <option value="Tư duy mở rộng">Tư duy mở rộng</option>
                </select>
              </label>
            )}

            <div className="w-px h-5 bg-slate-300"></div>

            {/* Tỉ lệ ảnh */}
            <label className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">Tỉ lệ:</span>
              <select 
                className="text-[11px] border border-slate-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-purple-500"
                value={project.visualConfig?.aspectRatio || "16:9"}
                onChange={(e) => setProject((p: any) => ({ ...p, visualConfig: { ...p.visualConfig, aspectRatio: e.target.value } }))}
              >
                <option value="16:9">16:9</option>
                <option value="1:1">1:1</option>
                <option value="9:16">9:16</option>
              </select>
            </label>

            <div className="w-px h-5 bg-slate-300"></div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-3.5 h-3.5 text-purple-600 rounded"
                checked={project.visualConfig?.chromeHeadless ?? true}
                onChange={(e) => {
                  setProject((prev: any) => ({
                    ...prev,
                    visualConfig: { ...prev.visualConfig, chromeHeadless: e.target.checked }
                  }));
                }}
              />
              <span className="text-[11px] font-bold text-slate-600">Chạy Chrome Ẩn</span>
            </label>
            
            <div className="w-px h-5 bg-slate-300"></div>
            
            <label className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">Luồng:</span>
              <input 
                type="number" 
                min="1" max={project.visualConfig?.generationMode === "viettheo-api" ? "7" : "5"}
                className="w-12 px-1.5 py-1 text-[11px] border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={
                  project.visualConfig?.threadCount ||
                  (project.visualConfig?.generationMode === "viettheo-api" ? 7 : 1)
                }
                onChange={(e) => {
                  setProject((prev: any) => ({
                    ...prev,
                    visualConfig: { ...prev.visualConfig, threadCount: parseInt(e.target.value) || 1 }
                  }));
                }}
              />
            </label>
          
            <div className="w-px h-5 bg-slate-300"></div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-3.5 h-3.5 text-purple-600 rounded"
                checked={project.visualConfig?.noText || false}
                onChange={(e) => {
                  setProject((prev: any) => ({
                    ...prev,
                    visualConfig: { ...prev.visualConfig, noText: e.target.checked }
                  }));
                }}
              />
              <span className="text-[11px] font-bold text-slate-600">Không có text</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-3.5 h-3.5 text-purple-600 rounded"
                checked={project.visualConfig?.noBlackBorder || false}
                onChange={(e) => {
                  setProject((prev: any) => ({
                    ...prev,
                    visualConfig: { ...prev.visualConfig, noBlackBorder: e.target.checked }
                  }));
                }}
              />
              <span className="text-[11px] font-bold text-slate-600">Không viền đen</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-3.5 h-3.5 text-purple-600 rounded"
                checked={project.visualConfig?.noWallPicture || false}
                onChange={(e) => {
                  setProject((prev: any) => ({
                    ...prev,
                    visualConfig: { ...prev.visualConfig, noWallPicture: e.target.checked }
                  }));
                }}
              />
              <span className="text-[11px] font-bold text-slate-600">Không lỗi ảnh tường</span>
            </label>

            <div className="w-px h-5 bg-slate-300"></div>

            {/* Global Reference Image */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">Ảnh tham chiếu chung:</span>
              <div className="flex items-center gap-2">
                {project.visualConfig?.globalReferenceImages?.map((imgStr: string, idx: number) => (
                  <div key={idx} className="relative group">
                    <img src={imgStr} alt="Global Ref" className="h-6 w-10 object-cover rounded border border-slate-300" />
                    <button 
                      onClick={() => handleRemoveGlobalReferenceImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {(!project.visualConfig?.globalReferenceImages || project.visualConfig.globalReferenceImages.length < 3) && (
                  <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-[11px] px-2 py-1 rounded text-slate-600 flex items-center gap-1 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{project.visualConfig?.globalReferenceImages?.length ? "Thêm ảnh" : "Tải lên"}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleUploadGlobalReferenceImages(e.target.files);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            onClick={handleReloadMediaPreviews}
            title="Quét lại thư mục img/ hoặc vid và tải lại preview ảnh/video"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới media
          </button>
          {canStopBatch && (
            <button 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
              onClick={handleStopBatch}
            >
              Dừng
            </button>
          )}
          {/* Nút sinh ảnh hàng loạt */}
          <button 
            className="bg-purple-650 hover:bg-purple-700 disabled:bg-slate-350 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            onClick={handleGenerateAllImages}
            disabled={isBatchLoading || !project.storyboard || project.storyboard.length === 0}
          >
            {isBatchLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang {project.visualConfig?.generateType === "video" ? "tạo video" : "vẽ ảnh"} toàn bộ...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                {project.visualConfig?.generateType === "video" ? "Tạo video" : "Tạo ảnh"} cho tất cả Scene ({project.storyboard?.length || 0})
              </>
            )}
          </button>
        </div>
      </div>
      </div>

      {/* Hiển thị từng Scene */}
      {visibleBatchProgress.total > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-extrabold text-indigo-900">Tiến độ tạo {project.visualConfig?.generateType === "video" ? "video" : "ảnh"}: {visibleBatchProgress.completed}/{visibleBatchProgress.total}</span><span className="font-bold text-slate-600">Xong {visibleBatchProgress.succeeded} · Lỗi {visibleBatchProgress.failed} · Còn {Math.max(0, visibleBatchProgress.total - visibleBatchProgress.completed)}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-indigo-100"><div className="h-full rounded-full bg-indigo-600 transition-all duration-300" style={{ width: `${visibleBatchProgress.total ? (visibleBatchProgress.completed / visibleBatchProgress.total) * 100 : 0}%` }} /></div>
          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pt-0.5">
            {(Object.entries(visibleBatchProgress.sceneStates) as Array<[string, "pending" | "running" | "completed" | "failed" | "stopped"]>).map(([sceneId, state]) => {
              const appearance = { pending: "bg-slate-100 text-slate-600 border-slate-200", running: "bg-amber-100 text-amber-800 border-amber-300 animate-pulse", completed: "bg-emerald-100 text-emerald-800 border-emerald-300", failed: "bg-rose-100 text-rose-800 border-rose-300", stopped: "bg-orange-100 text-orange-800 border-orange-300" } as const;
              const label = { pending: "chờ", running: "đang tạo", completed: "xong", failed: "lỗi", stopped: "đã dừng" } as const;
              return <span key={sceneId} className={`rounded-md border px-2 py-1 text-[10px] font-bold ${appearance[state]}`}>Cảnh {sceneId}: {label[state]}</span>;
            })}
          </div>
        </div>
      )}

      {!project.storyboard || project.storyboard.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <p className="text-sm text-slate-500 font-medium">Chưa có phân cảnh khởi tạo. Vui lòng hoàn thành phần chia cảnh và prompt ở Bước 2 trước.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.storyboard.map((scene: any) => {
            const isLoading = loadingStates["renderScene_" + scene.id];
            const batchSceneState = visibleBatchProgress.sceneStates[scene.id];
            const isBatchRendering = isBatchLoading && batchSceneState === "running";
            const isBatchWaiting = isBatchLoading && batchSceneState === "pending";
            const isBatchFailed = batchSceneState === "failed";
            const isSceneRendering = isLoading || isBatchRendering;
            // Local preview URLs append &t=... to prevent stale caching, so
            // treat an ampersand after .mp4 as a video URL as well.
            const sceneHasVideo = /^data:video\//i.test(scene.currentImage || "") || /\.mp4(?:[?&#]|$)/i.test(scene.currentImage || "");

            return (
              <div key={scene.id} className="scene-card border border-slate-200 p-4.5 rounded-2xl bg-slate-50/50 hover:border-purple-300 transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                      Cảnh {scene.id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold truncate max-w-[150px]" title={scene.vietnameseLabel}>
                      {scene.vietnameseLabel}
                    </span>
                  </div>

                  {/* Vùng hiển thị ảnh */}
                  <div className={`image-preview w-full ${
                    (project.visualConfig?.aspectRatio === "9:16") ? "aspect-[9/16]" :
                    (project.visualConfig?.aspectRatio === "1:1") ? "aspect-square" :
                    "aspect-video"
                  } bg-slate-200 rounded-xl relative overflow-hidden mb-3.5 border border-slate-300 flex items-center justify-center group`}>
                    {scene.currentImage ? (
                      sceneHasVideo ? (
                        <video src={scene.currentImage} className="w-full h-full object-contain bg-black" controls playsInline />
                      ) : (
                        <img src={scene.currentImage} alt="Scene Visual" className="w-full h-full object-contain bg-black" />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full text-slate-400 gap-1.5">
                        <ImageIcon className="w-6 h-6 text-slate-350" />
                        <span className="text-[10px] font-bold">Chưa có ảnh</span>
                      </div>
                    )}

                    {/* Reference Image Overlay */}
                    {scene.referenceImage && (
                      <div className="absolute top-2 left-2 w-12 h-12 rounded bg-black/50 border border-white/50 overflow-hidden shadow-sm" title="Ảnh tham chiếu (Reference Image)">
                        <img src={scene.referenceImage} alt="Ref" className="w-full h-full object-cover opacity-90" />
                      </div>
                    )}

                    {/* Upload Reference Button (Hiện khi hover) */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg flex items-center gap-1 backdrop-blur-sm" title="Tải lên ảnh mồi/tham chiếu">
                        <Upload className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold">Tham chiếu</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0] && handleUploadReferenceImage) {
                              handleUploadReferenceImage(scene.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Loading Spinner mờ đè lên nếu đang sinh ảnh */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  <textarea 
                    className="w-full text-[11px] p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono leading-relaxed h-16 border border-slate-950 focus:outline-none"
                    value={scene.imagePrompt}
                    readOnly
                  />
                </div>

                {/* Nút Sinh ảnh đơn */}
                <button
                  className="mt-3.5 w-full bg-rose-650 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs"
                  onClick={() => handleGenerateImage(scene.id, scene.imagePrompt)}
                  disabled={isSceneRendering || isBatchWaiting}
                >
                  {isSceneRendering ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang vẽ...
                    </>
                  ) : isBatchWaiting ? (
                    <>
                      <Clock3 className="w-3.5 h-3.5" />
                      Đang đợi tạo...
                    </>
                  ) : isBatchFailed ? (
                    <>
                      <CircleAlert className="w-3.5 h-3.5" />
                      Tạo lỗi — thử lại
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5" />
                      Render Scene ({project.visualConfig?.generateType === "video" ? "Tạo video" : "Vẽ ảnh"})
                    </>
                  )}
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
