import React, { useState, useEffect, useRef } from "react";
import { vidiflowConfirm } from "../VidiFlowDialogCenter";

// Reference images must never be kept as data URLs in localStorage. A single
// photo can exceed the browser quota and crash the whole editor. The server
// stores the bytes in the selected project; the UI retains only its local URL.
const storedReferenceUrls = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string" && !item.startsWith("data:"))
  : [];

const compactVisualConfig = (value: any) => {
  const globalReferenceImages = storedReferenceUrls(value?.globalReferenceImages);
  return {
    ...(value || {}),
    globalReferenceImages,
    globalReferenceImage: globalReferenceImages[0] || null,
  };
};

export interface PipelineWizardProps {
  projectDir?: string;
  storyboardData?: any;
  imageStyle?: string;
  telegramToken?: string;
  telegramChatId?: string;
  generatedImages?: Record<string, string>;
  setGeneratedImages?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onComplete?: () => void;
}

export function usePipelineWizard(props: PipelineWizardProps = {}) {
  const [project, setProject] = useState<any>(() => {
    let savedConfig = {};
    try {
      const stored = localStorage.getItem("cc_visualConfig_v2");
      if (stored) savedConfig = compactVisualConfig(JSON.parse(stored));
    } catch(e) {}
    return { storyboard: [], visualConfig: { ...savedConfig, chromeHeadless: false } };
  });

  useEffect(() => {
    if (project.visualConfig && Object.keys(project.visualConfig).length > 0) {
      // Store only settings and local reference URLs, never base64 image data.
      localStorage.setItem("cc_visualConfig_v2", JSON.stringify(compactVisualConfig(project.visualConfig)));
    }
  }, [project.visualConfig]);

  // Keep Step 4 as a live view of the central automatic-video setup. It does
  // not own a separate visual configuration; changing a setting in the
  // automatic creator is reflected here before the next render starts.
  useEffect(() => {
    const applyAutomationVisualConfig = (event: Event) => {
      const nextConfig = (event as CustomEvent<any>).detail;
      if (!nextConfig || typeof nextConfig !== "object") return;
      setProject((previous: any) => ({
        ...previous,
        visualConfig: { ...(previous.visualConfig || {}), ...nextConfig }
      }));
    };
    window.addEventListener("automation-visual-config-changed", applyAutomationVisualConfig);
    return () => window.removeEventListener("automation-visual-config-changed", applyAutomationVisualConfig);
  }, []);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    completed: number;
    succeeded: number;
    failed: number;
    sceneStates: Record<string, "pending" | "running" | "completed" | "failed" | "stopped">;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  // Lets the user reconcile previews with files already saved in img/ or vid/.
  const [mediaPreviewReloadNonce, setMediaPreviewReloadNonce] = useState(0);
  const cancelBatchRef = useRef(false);
  const batchAbortControllerRef = useRef<AbortController | null>(null);

  // Map V2's storyboardData structure to project.storyboard structure
  useEffect(() => {
    console.log("usePipelineWizard Mapping storyboardData:", props.storyboardData);
    if (props.storyboardData?.scenes) {
      const mappedStoryboard: any[] = [];
      props.storyboardData.scenes.forEach((s: any) => {
        if (s.imagePrompts) {
          s.imagePrompts.forEach((p: any) => {
            mappedStoryboard.push({
              id: p.code,
              imagePrompt: p.englishPrompt,
              currentImage: props.generatedImages?.[p.code] || "",
              vietnameseLabel: p.vietnameseLabel,
              characterContext: [
                s?.speaker,
                s?.text,
                s?.text_vi,
                s?.text_en,
                p?.speaker,
                p?.subText,
                p?.subText_vi,
                p?.subText_en,
                p?.vietnameseLabel,
              ].filter(Boolean).join("\n"),
            });
          });
        }
      });
      console.log("Mapped Storyboard length:", mappedStoryboard.length);
      setProject((prev: any) => ({
        ...prev,
        visualConfig: {
          ...(prev?.visualConfig || {}),
          style: props.imageStyle || prev?.visualConfig?.style || "",
          quality: prev?.visualConfig?.quality || "2K",
          imageGeneratorEngine: prev?.visualConfig?.imageGeneratorEngine || "Veo3"
        },
        storyboard: mappedStoryboard
      }));
    }
  }, [props.storyboardData, props.imageStyle, props.generatedImages]);

  // Quét đĩa cứng để tự động load ảnh/video nếu có
  useEffect(() => {
    const scanDisk = async () => {
      if (!props.projectDir || !project.storyboard || project.storyboard.length === 0) return;
      const isVideoOutput = project.visualConfig?.generateType === "video";
      // Keep image and video previews separate. Only recover the output type
      // selected in the current setup.
      const mediaFolders = [isVideoOutput ? "vid" : "img"];
      const mediaFiles: Array<{ folder: string; file: string }> = [];
      await Promise.all(mediaFolders.map(async (folder) => {
        try {
          const listResponse = await fetch("/api/list-project-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ directory: props.projectDir + "/" + folder })
          });
          const listed = await listResponse.json();
          if (Array.isArray(listed.files)) listed.files.forEach((file: string) => mediaFiles.push({ folder, file }));
        } catch {}
      }));
      
      // Start from an empty map so a switch Image <-> Video cannot retain a
      // preview URL from the other output folder.
      const newGeneratedImages: Record<string, string> = {};
      let changed = false;

      for (const [sceneIndex, sc] of project.storyboard.entries()) {
        // Accept jpg/png/webp and recover files made by an earlier batch.
        // This is more reliable than assuming every generator uses .jpg.
        // Different generators save scene codes as P1.1 or P1_1. Normalize
        // punctuation before comparing so existing files always restore.
        const normalizeSceneName = (value: string, stripMediaExtension = false) => String(value)
          // Scene IDs can legitimately contain a dot (P1.1). Only strip a
          // known media extension from disk filenames, never from the ID.
          .replace(stripMediaExtension ? /\.(?:png|jpe?g|webp|mp4)$/i : /$^/, "")
          .replace(/^scene[-_]?/i, "")
          .replace(/[^a-z0-9]/gi, "")
          .toLowerCase();
        const expectedBase = normalizeSceneName(String(sc.id));
        let mediaFile = mediaFiles.find((entry) => normalizeSceneName(entry.file, true) === expectedBase);
        // Also support simple exported names such as scene-1-video.mp4 and
        // scene-1-image.jpg. These refer to the 1st, 2nd, ... storyboard card
        // in display order, while older exports use scene-P1.1.jpg.
        if (!mediaFile) {
          const ordinalPattern = new RegExp(`^scene[-_]?${sceneIndex + 1}[-_]?(?:image|video)(?:\\.[a-z0-9]+)?$`, "i");
          mediaFile = mediaFiles.find((entry) => ordinalPattern.test(entry.file));
        }
        if (!mediaFile) {
          if (sc.currentImage || props.generatedImages?.[sc.id]) changed = true;
          continue;
        }
        const filePath = props.projectDir + "/" + mediaFile.folder + "/" + mediaFile.file;
        try {
          const res = await fetch("/api/check-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: filePath })
          });
          const data = await res.json();
          if (data.exists) {
            const serveUrl = "/api/serve-local-file?path=" + encodeURIComponent(filePath) + "&t=" + Date.now();
            if (sc.currentImage !== serveUrl) {
               newGeneratedImages[sc.id] = serveUrl;
               changed = true;
            }
          } else if (sc.currentImage || props.generatedImages?.[sc.id]) changed = true;
        } catch (e) {}
      }

      if (changed && props.setGeneratedImages) {
        props.setGeneratedImages(newGeneratedImages);
        setProject((prev: any) => {
          const updated = prev.storyboard.map((sc: any) => {
            return { ...sc, currentImage: newGeneratedImages[sc.id] || "" };
          });
          return { ...prev, storyboard: updated };
        });
        setBatchProgress((previous) => {
          if (!previous) return previous;
          const sceneStates = { ...previous.sceneStates };
          Object.keys(newGeneratedImages).forEach((sceneId) => {
            if (newGeneratedImages[sceneId] && sceneStates[sceneId]) sceneStates[sceneId] = "completed";
          });
          const completed = Object.values(sceneStates).filter((state) => state === "completed").length;
          return { ...previous, sceneStates, completed, succeeded: completed, failed: 0 };
        });
      }
    };
    scanDisk();
  }, [props.projectDir, project.visualConfig?.generateType, project.storyboard?.length, mediaPreviewReloadNonce]);

  const handleReloadMediaPreviews = () => {
    // Rebuild local URLs with a fresh cache-buster and remove broken ones.
    setMediaPreviewReloadNonce(Date.now());
  };

  // Hàm xử lý khi user upload ảnh tham chiếu
  const handleUploadReferenceImage = (sceneId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProject((prev: any) => ({
        ...prev,
        storyboard: prev.storyboard.map((sc: any) => 
          sc.id === sceneId ? { ...sc, referenceImage: base64String } : sc
        )
      }));
    };
    reader.readAsDataURL(file);
  };

  // Hàm xử lý khi user upload ảnh tham chiếu chung (Global) - Hỗ trợ nhiều ảnh
  const handleUploadGlobalReferenceImages = async (files: FileList | File[]) => {
    const existingCount = storedReferenceUrls(project.visualConfig?.globalReferenceImages).length;
    const fileArray = Array.from(files).slice(0, Math.max(0, 3 - existingCount));
    if (!fileArray.length) return;

    try {
      const savedUrls = await Promise.all(fileArray.map(async (file) => {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} không phải là ảnh hợp lệ.`);
        if (file.size > 4 * 1024 * 1024) throw new Error(`${file.name} lớn hơn giới hạn 4 MB.`);
        const imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error(`Không thể đọc ảnh ${file.name}.`));
          reader.readAsDataURL(file);
        });
        const response = await fetch("/api/upload-reference-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData, fileName: file.name, projectDir: props.projectDir || "" }),
        });
        const data = await response.json();
        if (!response.ok || !data?.success || !data?.url) throw new Error(data?.error || `Không thể lưu ảnh ${file.name}.`);
        return String(data.url);
      }));

      setProject((prev: any) => {
        const currentImages = storedReferenceUrls(prev.visualConfig?.globalReferenceImages);
        const globalReferenceImages = [...currentImages, ...savedUrls].slice(0, 3);
        return {
          ...prev,
          visualConfig: {
            ...prev.visualConfig,
            globalReferenceImages,
            globalReferenceImage: globalReferenceImages[0] || null,
          },
        };
      });
    } catch (error: any) {
      setErrorMsg(error?.message || "Không thể tải ảnh tham chiếu.");
    }
  };

  // Hàm xóa ảnh tham chiếu chung
  const handleRemoveGlobalReferenceImage = (index: number) => {
    setProject((prev: any) => {
      const currentImages = prev.visualConfig?.globalReferenceImages || [];
      const newImages = currentImages.filter((_: any, idx: number) => idx !== index);
      return {
        ...prev,
        visualConfig: {
          ...prev.visualConfig,
          globalReferenceImages: newImages,
          globalReferenceImage: newImages[0] || null
        }
      };
    });
  };

  // Hàm xử lý khi user nhấn "Tạo ảnh" cho 1 cảnh cụ thể (sceneId)
  const buildUnifiedMediaPrompt = (rawPrompt: string) => {
    const style = String(project.visualConfig?.style || props.imageStyle || "").trim();
    const savedAspectRatio = String(project.visualConfig?.aspectRatio || "16:9");
    const aspectRatio = savedAspectRatio.includes("9:16") ? "9:16" : savedAspectRatio.includes("1:1") ? "1:1" : "16:9";
    const isVideo = String(project.visualConfig?.generateType || "image").toLowerCase() === "video";
    const illustrated = /(chalk|blackboard|hand[- ]drawn|cartoon|animation|watercolou?r|comic|anime|clay|paper|low[- ]poly|chibi|illustration)/i.test(style);
    const styleGuard = illustrated
      ? "This is an illustrated artwork, never a photograph, never live action, never photorealistic."
      : "Use the selected visual medium consistently.";
    const noTypography = isVideo
      ? "Do not display dialogue as captions, subtitles, signs or on-screen text."
      : "ABSOLUTE TYPOGRAPHY BAN: create a purely visual scene with zero visible glyphs, captions, labels, signs, handwriting, numbers, letters, title cards or speech bubbles.";
    const identityLock = String(project.visualConfig?.characterBible || "").trim();
    return `STRICT STYLE CONTRACT — ${style}. ${styleGuard} Keep exactly this medium, palette, line work and texture in every scene. VISUAL STORY ONLY: communicate the narrative meaning through character action, expression, objects, composition and environment. ${noTypography} Scene content: ${String(rawPrompt || "").trim()}. STYLE MUST REMAIN: ${style}. --ar ${aspectRatio}${identityLock ? `\n\n${identityLock}` : ""}`;
  };

  const handleGenerateImage = async (
    sceneId: string, 
    customPrompt: string, 
    isForce: boolean = false, 
    isBatch: boolean = false
  ) => {
    if (!isBatch) setLoadingStates((prev) => ({ ...prev, ["renderScene_" + sceneId]: true }));
    if (!isBatch) setErrorMsg("");

    try {
      // 2. Gửi request gọi API backend
      const scene = project.storyboard?.find((sc: any) => sc.id === sceneId);
      const refImg = scene?.referenceImage || project.visualConfig?.globalReferenceImage || null;
      
      
      let activeProfiles = [];
      let chromeProfilesEnabled = false;
      try {
        const stored = localStorage.getItem("capcut_ultra_chrome_profiles");
        if (stored) {
          const config = JSON.parse(stored);
          chromeProfilesEnabled = !!config.enabled;
          if (config.enabled && config.profiles) {
            activeProfiles = config.profiles.filter((p: any) => p.active);
          }
        }
      } catch (e) {}

      const response = await fetch("/api/pipeline/generate-image", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildUnifiedMediaPrompt(customPrompt || ""),
          style: project.visualConfig?.style,
          resolution: "Standard",
          bypassCache: isForce,
          
          engine: project.visualConfig?.imageGeneratorEngine || "Veo3",
          visualConfig: {
          ...project.visualConfig,
            chromeProfiles: activeProfiles,
            chromeProfilesEnabled
          },
          referenceImage: refImg,

        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.warning || data.error || "Có lỗi khi gọi backend pipeline");
      }

      // 3. Nếu thành công, có thể là base64 hoặc local fallback
      const isVideo = project.visualConfig?.generateType === "video";
      let imageUrl = "";
      if (data.base64) {
        imageUrl = isVideo ? `data:video/mp4;base64,${data.base64}` : `data:image/jpeg;base64,${data.base64}`;
      } else if (data.fallbackUrl) {
        imageUrl = data.fallbackUrl;
      }

      // 4. Nếu có projectDir và imageUrl, lưu xuống local auto
      if (props.projectDir && imageUrl) {
        const folder = isVideo ? "vid" : "img";
        const ext = isVideo ? ".mp4" : ".jpg";
        const payload: any = { path: props.projectDir + "/" + folder + "/scene-" + sceneId + ext };
        if (data.base64) {
          payload.audioData = data.base64;
        } else {
          payload.url = imageUrl;
        }
        const saveResponse = await fetch("/api/download-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const saved = await saveResponse.json().catch(() => null);
        // Do not replace a valid provider/base64 preview with a local URL
        // until the media file has really been written. Previously this made a
        // successful one-scene generation look broken when saving failed.
        if (saveResponse.ok && saved?.success) {
          imageUrl = "/api/serve-local-file?path=" + encodeURIComponent(payload.path) + "&t=" + Date.now();
        } else {
          setErrorMsg("Ảnh/video đã tạo nhưng chưa lưu được vào thư mục dự án. Preview tạm thời vẫn được giữ; có thể bấm Làm mới media sau khi kiểm tra thư mục dự án.");
        }
      }

      if (!isBatch) {
        setProject((prev: any) => {
          const updatedStoryboard = prev.storyboard.map((sc: any) => {
            if (sc.id === sceneId) {
              return { ...sc, currentImage: imageUrl };
            }
            return sc;
          });
          return { ...prev, storyboard: updatedStoryboard };
        });

        if (props.setGeneratedImages) {
          props.setGeneratedImages((prev: any) => ({
            ...prev,
            [sceneId]: imageUrl
          }));
        }
      }
    } catch (error: any) {
      console.error(error);
      if (!isBatch) setErrorMsg(error?.message || "Không thể tạo lại media này.");
    } finally {
      // 5. Tắt loading
      if (!isBatch) {
        setLoadingStates((prev) => ({ ...prev, ["renderScene_" + sceneId]: false }));
      }
    }
  };

  const handleGenerateAllImages = async () => {
    if (!project.storyboard || project.storyboard.length === 0) return;
    setLoadingStates((prev) => ({ ...prev, batchRender: true }));
    cancelBatchRef.current = false;
    const batchController = new AbortController();
    batchAbortControllerRef.current = batchController;
    
    try {
      let itemsToGenerate = project.storyboard.filter((sc: any) => !sc.currentImage || sc.currentImage.includes("placehold.co"));
      if (itemsToGenerate.length === 0) {
        const isConfirmed = await vidiflowConfirm(
          "Tất cả phân cảnh hiện đã có ảnh hoặc video. Nếu tiếp tục, toàn bộ media hiện tại sẽ được tạo lại.",
          {
            title: "Tạo lại toàn bộ media?",
            confirmLabel: "Tạo lại tất cả",
            cancelLabel: "Giữ media hiện tại",
          },
        );
        if (!isConfirmed) {
          setLoadingStates((prev) => ({ ...prev, batchRender: false }));
          return;
        }
        // Nếu đồng ý, lấy toàn bộ danh sách để tạo lại
        itemsToGenerate = project.storyboard;
      }

      const items = itemsToGenerate.map((sc: any) => ({
        sceneId: sc.id,
        prompt: buildUnifiedMediaPrompt(sc.imagePrompt || ""),
        characterContext: sc.characterContext || sc.vietnameseLabel || "",
        referenceImage: sc.referenceImage || project.visualConfig?.globalReferenceImage || null
      }));

      // Gọi API batch-images đa luồng của backend
      
      let activeProfiles = [];
      let chromeProfilesEnabled = false;
      try {
        const stored = localStorage.getItem("capcut_ultra_chrome_profiles");
        if (stored) {
          const config = JSON.parse(stored);
          chromeProfilesEnabled = !!config.enabled;
          if (config.enabled && config.profiles) {
            activeProfiles = config.profiles.filter((p: any) => p.active);
          }
        }
      } catch (e) {}

      const requestedChromeCount = Math.max(
        1,
        Number(project.visualConfig?.threadCount) ||
          (project.visualConfig?.generationMode === "viettheo-api" ? 7 : 1),
      );
      const scheduledProfiles = chromeProfilesEnabled
        ? activeProfiles.slice(0, requestedChromeCount)
        : [];
      const workerCount = chromeProfilesEnabled
        // Keep the visible queue aligned with the server scheduler. The run's
        // tab setting is authoritative; profile.concurrency is legacy data.
        ? Math.max(1, scheduledProfiles.length * Math.max(1, Number(project.visualConfig?.tabsPerChrome) || 1))
        : requestedChromeCount;
      const initialSceneStates: Record<string, "pending" | "running" | "completed" | "failed" | "stopped"> = {};
      items.forEach((item: any, index: number) => { initialSceneStates[item.sceneId] = index < workerCount ? "running" : "pending"; });
      setBatchProgress({ total: items.length, completed: 0, succeeded: 0, failed: 0, sceneStates: initialSceneStates });
      
      const applyBatchResult = async (res: any) => {
        const isVideo = project.visualConfig?.generateType === "video";
        let imageUrl = "";
        if (res.success) {
          imageUrl = res.base64
            ? (isVideo ? `data:video/mp4;base64,${res.base64}` : `data:image/jpeg;base64,${res.base64}`)
            : (res.fallbackUrl || "");
        }
        if (!imageUrl) {
          imageUrl = `https://placehold.co/800x450/ef4444/ffffff?text=Loi+Tao+${isVideo ? 'Video' : 'Anh'}`;
          setErrorMsg(`Không thể tạo ${isVideo ? "video" : "ảnh"} ${res.sceneId}: ${res.error || res.warning || "Nhà cung cấp không trả về media."}`);
        }

        const updateScene = (url: string) => {
          setProject((prev: any) => ({ ...prev, storyboard: prev.storyboard.map((sc: any) => sc.id === res.sceneId ? { ...sc, currentImage: url } : sc) }));
          props.setGeneratedImages?.((prev: any) => ({ ...prev, [res.sceneId]: url }));
        };
        updateScene(imageUrl);

        setBatchProgress((previous) => {
          if (!previous || previous.sceneStates[res.sceneId] === "completed" || previous.sceneStates[res.sceneId] === "failed") return previous;
          const sceneStates = { ...previous.sceneStates, [res.sceneId]: res.success ? "completed" as const : "failed" as const };
          const running = Object.values(sceneStates).filter((state) => state === "running").length;
          const nextScene = Object.keys(sceneStates).find((sceneId) => sceneStates[sceneId] === "pending");
          if (nextScene && running < workerCount) sceneStates[nextScene] = "running";
          return {
            ...previous,
            completed: previous.completed + 1,
            succeeded: previous.succeeded + (res.success ? 1 : 0),
            failed: previous.failed + (res.success ? 0 : 1),
            sceneStates,
          };
        });

        if (props.projectDir && res.success) {
          const folder = isVideo ? "vid" : "img";
          const ext = isVideo ? ".mp4" : ".jpg";
          const path = `${props.projectDir}/${folder}/scene-${res.sceneId}${ext}`;
          const payload: any = { path };
          if (res.base64) payload.audioData = res.base64;
          else payload.url = imageUrl;
          await fetch("/api/download-audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
          updateScene(`/api/serve-local-file?path=${encodeURIComponent(path)}&t=${Date.now()}`);
        }
      };

      const response = await fetch("/api/pipeline/generate-batch-images-stream", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          
          items,
          visualConfig: {
          ...project.visualConfig,
            chromeProfiles: scheduledProfiles,
            chromeProfilesEnabled
          },
          style: project.visualConfig?.style

        }),
        signal: batchController.signal,
      });
      if (!response.ok || !response.body) throw new Error("Không thể bắt đầu luồng tạo ảnh/video.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || "";
        for (const message of messages) {
          const line = message.split("\n").find(part => part.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6));
          if (event.type === "fallback") {
            const sceneCount = Array.isArray(event.sceneIds) ? event.sceneIds.length : 0;
            setErrorMsg(`⚠ Chrome ${event.fromPort} gặp lỗi hoặc hết credit. Đang dùng Chrome ${event.toPort} để tạo lại ${sceneCount} cảnh.`);
            continue;
          }
          if (event.type === "progress" && event.result && !cancelBatchRef.current) await applyBatchResult(event.result);
          if (event.type === "error") throw new Error(event.message || "Lỗi khi tạo hàng loạt");
        }
      }
      const data = { success: false, results: [] as any[] };
      
      if (cancelBatchRef.current) return;
      
      if (data.success && data.results) {
        const isVideo = project.visualConfig?.generateType === "video";
        for (const res of data.results) {
          if (cancelBatchRef.current) break;
          
          let imageUrl = "";
          if (res.success) {
            if (res.base64) {
              imageUrl = isVideo ? `data:video/mp4;base64,${res.base64}` : `data:image/jpeg;base64,${res.base64}`;
            } else if (res.fallbackUrl) {
              imageUrl = res.fallbackUrl;
            } else {
              imageUrl = `https://placehold.co/800x450/ef4444/ffffff?text=Loi+Tao+${isVideo ? 'Video' : 'Anh'}`;
            }
          } else {
            imageUrl = `https://placehold.co/800x450/ef4444/ffffff?text=Loi+Tao+${isVideo ? 'Video' : 'Anh'}`;
          }

          setProject((prev: any) => {
            const updated = prev.storyboard.map((sc: any) => {
              if (sc.id === res.sceneId) {
                return { ...sc, currentImage: imageUrl };
              }
              return sc;
            });
            return { ...prev, storyboard: updated };
          });

          if (props.setGeneratedImages) {
            props.setGeneratedImages((prev: any) => ({
              ...prev,
              [res.sceneId]: imageUrl
            }));
          }

          if (props.projectDir && imageUrl && res.success) {
            const folder = isVideo ? "vid" : "img";
            const ext = isVideo ? ".mp4" : ".jpg";
            const payload: any = { path: props.projectDir + "/" + folder + "/scene-" + res.sceneId + ext };
            
            if (res.base64) {
              payload.audioData = res.base64;
              console.log("Downloading media to path:", payload.path, "with base64");
            } else {
              payload.url = imageUrl;
              console.log("Downloading media to path:", payload.path, "from URL");
            }
            
            await fetch("/api/download-audio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            }).catch((e) => console.error("Failed to auto-save media", e));
            
            // Re-update the UI with local file path instead of base64 to save memory and ensure sync with folder
            const localUrl = "/api/serve-local-file?path=" + encodeURIComponent(payload.path) + "&t=" + Date.now();
            
            setProject((prev: any) => {
              const updated = prev.storyboard.map((sc: any) => {
                if (sc.id === res.sceneId) {
                  return { ...sc, currentImage: localUrl };
                }
                return sc;
              });
              return { ...prev, storyboard: updated };
            });

            if (props.setGeneratedImages) {
              props.setGeneratedImages((prev: any) => ({
                ...prev,
                [res.sceneId]: localUrl
              }));
            }
          }
        }
      }
    } catch (e: any) {
      // Stopping is intentional: do not turn the remaining scenes into errors.
      if (e?.name !== "AbortError") console.error("Batch rendering failed:", e);
    } finally {
      if (batchAbortControllerRef.current === batchController) batchAbortControllerRef.current = null;
      setLoadingStates((prev) => ({ ...prev, batchRender: false }));
    }
  };

  const handleStopBatch = async () => {
    cancelBatchRef.current = true;
    batchAbortControllerRef.current?.abort();
    batchAbortControllerRef.current = null;
    setBatchProgress((previous) => previous ? {
      ...previous,
      sceneStates: Object.fromEntries(Object.entries(previous.sceneStates).map(([sceneId, state]) => [sceneId, state === "running" || state === "pending" ? "stopped" : state])) as typeof previous.sceneStates,
    } : previous);
    setLoadingStates((prev) => ({ ...prev, batchRender: false }));
    try {
      await fetch("/api/pipeline/stop-batch", { method: "POST" });
    } catch (e) {
      console.error("Failed to stop backend batch:", e);
    }
  };

  return {
    project,
    setProject,
    loadingStates,
    batchProgress,
    errorMsg,
    handleUploadReferenceImage,
    handleUploadGlobalReferenceImages,
    handleRemoveGlobalReferenceImage,
    handleGenerateImage,
    handleGenerateAllImages,
    handleStopBatch,
    handleReloadMediaPreviews,
  };
}
