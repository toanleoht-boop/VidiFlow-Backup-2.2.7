import React, { useEffect, useMemo, useState } from "react";
import { Check, Film, Image as ImageIcon, Mic, Palette, Pencil, Save, Sparkles, WandSparkles, X } from "lucide-react";
import { VoiceSelectionDialog, type Voice } from "./VoiceSelectionDialog";
import { IMAGE_STYLES, STYLE_DEMO_FILES } from "./AutomationControlCenter";

export type AutomationPreset = {
  id: string;
  name: string;
  badge: string;
  description: string;
  bestFor: string;
  imageStyle: string;
  language: string;
  config: Record<string, unknown>;
};

export const AUTOMATION_PRESETS: AutomationPreset[] = [
  {
    id: "short-story-viral",
    name: "Shorts kể chuyện viral",
    badge: "Dễ dùng nhất",
    description: "Nhịp nhanh, hook mạnh, phụ đề nổi bật và khung dọc tối ưu Shorts/TikTok/Reels.",
    bestFor: "Truyện ngắn, drama, bài học cuộc sống",
    imageStyle: "cinematic photorealistic, expressive characters, dramatic lighting, strong visual storytelling, consistent identity",
    language: "original",
    config: { genre: "storytelling", writingStyle: "engaging", rewriteLevel: "balanced", rewriteLengthMode: "minutes", rewriteTargetMinutes: 1, hookEnabled: true, hookStyle: "shocking", sceneMode: "dialogue", sceneCount: 10, promptsPerScene: 2, dialogueGroupSize: 1, promptFocus: "image", highDensity: true, generateType: "image", aspectRatio: "9:16", motionEnabled: true, motionStyle: "auto", motionIntensity: "natural", subtitleEnabled: true, subtitleStyle: "yellow_pop", subtitlePosition: "bottom", seoTone: "curiosity", clipTransition: "cut" },
  },
  {
    id: "youtube-faceless",
    name: "YouTube Faceless dài",
    badge: "Bền vững",
    description: "Kể chuyện mạch lạc, nhiều hình minh họa, chuyển động nhẹ và bố cục ngang chuyên nghiệp.",
    bestFor: "Video 5–15 phút, kiến thức, tổng hợp",
    imageStyle: "cinematic documentary illustration, realistic environments, natural lighting, coherent visual narrative, high detail",
    language: "original",
    config: { genre: "education", writingStyle: "engaging", rewriteLevel: "balanced", rewriteLengthMode: "source", hookEnabled: true, hookStyle: "question", sceneMode: "dialogue", sceneCount: 30, promptsPerScene: 2, dialogueGroupSize: 2, promptFocus: "image", highDensity: true, generateType: "image", aspectRatio: "16:9", motionEnabled: true, motionStyle: "auto", motionIntensity: "gentle", subtitleEnabled: true, subtitleStyle: "minimal", subtitlePosition: "bottom", includeChapters: true, seoTone: "authority", clipTransition: "cut" },
  },
  {
    id: "cinematic-video",
    name: "Video AI điện ảnh",
    badge: "Chất lượng cao",
    description: "Ưu tiên tạo video cho từng prompt; tự thay cảnh lỗi bằng ảnh nếu đã thử lại nhưng vẫn thất bại.",
    bestFor: "Trailer, phim ngắn, câu chuyện điện ảnh",
    imageStyle: "cinematic film still, dramatic volumetric lighting, dynamic camera movement, coherent characters, premium color grading",
    language: "original",
    config: { genre: "storytelling", writingStyle: "cinematic", rewriteLevel: "balanced", hookEnabled: true, hookStyle: "shocking", sceneMode: "dialogue", sceneCount: 12, promptsPerScene: 1, dialogueGroupSize: 1, promptFocus: "video", highDensity: false, generateType: "video", aspectRatio: "16:9", videoDuration: "8s", fallbackFailedVideosToImages: true, dialogueVideoMode: true, keepVideoAudio: false, clipTransition: "cut", subtitleEnabled: false, seoTone: "curiosity" },
  },
  {
    id: "tiktok-product",
    name: "TikTok bán hàng",
    badge: "Chuyển đổi",
    description: "Mở đầu bằng lợi ích, cảnh ngắn, khung dọc và phụ đề dễ đọc trên điện thoại.",
    bestFor: "Review sản phẩm, affiliate, dịch vụ",
    imageStyle: "premium commercial product video, clean studio lighting, vivid colors, persuasive visual demonstration, modern social media aesthetic",
    language: "original",
    config: { genre: "affiliate", audience: "buyers", writingStyle: "persuasive", rewriteLevel: "balanced", rewriteLengthMode: "minutes", rewriteTargetMinutes: 1, hookEnabled: true, hookStyle: "benefit", sceneMode: "dialogue", sceneCount: 9, promptsPerScene: 1, dialogueGroupSize: 1, promptFocus: "video", highDensity: false, generateType: "video", aspectRatio: "9:16", videoDuration: "8s", fallbackFailedVideosToImages: true, motionEnabled: true, subtitleEnabled: true, subtitleStyle: "neon", subtitlePosition: "bottom", seoTone: "direct", clipTransition: "cut" },
  },
  {
    id: "news-explainer",
    name: "Tin tức & giải thích",
    badge: "Rõ thông tin",
    description: "Ưu tiên tính rõ ràng, giữ nguyên dữ kiện nguồn, không bịa số liệu và minh họa sát từng ý trong lời thoại.",
    bestFor: "Tin nhanh, phân tích, kiến thức thời sự",
    imageStyle: "clean editorial documentary visuals, factual locations and objects, professional broadcast composition, neutral color grade",
    language: "original",
    config: { genre: "news", writingStyle: "clear", rewriteLevel: "light", rewriteLengthMode: "source", factCheck: true, hookEnabled: true, hookStyle: "question", sceneMode: "dialogue", sceneCount: 12, promptsPerScene: 2, dialogueGroupSize: 1, promptFocus: "image", highDensity: true, generateType: "image", aspectRatio: "16:9", motionEnabled: true, motionStyle: "auto", motionIntensity: "gentle", subtitleEnabled: true, subtitleStyle: "boxed", subtitlePosition: "bottom", includeChapters: true, seoTone: "authority", clipTransition: "cut" },
  },
  {
    id: "history-documentary",
    name: "Lịch sử tài liệu",
    badge: "Đồng nhất",
    description: "Khung cảnh rộng, trang phục đúng thời kỳ và nhịp kể chậm vừa để giữ tính sử thi.",
    bestFor: "Lịch sử, danh nhân, chiến dịch, bí ẩn cổ đại",
    imageStyle: "epic historical cinematic painting, authentic period costumes and architecture, dramatic golden light, rich detail, consistent era",
    language: "original",
    config: { genre: "history", writingStyle: "documentary", rewriteLevel: "balanced", rewriteLengthMode: "source", factCheck: true, hookEnabled: true, hookStyle: "shocking", sceneMode: "dialogue", sceneCount: 18, promptsPerScene: 2, dialogueGroupSize: 2, promptFocus: "image", highDensity: true, generateType: "image", aspectRatio: "16:9", motionEnabled: true, motionStyle: "auto", motionIntensity: "gentle", subtitleEnabled: false, includeChapters: true, seoTone: "curiosity", clipTransition: "cut" },
  },
  {
    id: "horror-mystery",
    name: "Kinh dị & bí ẩn",
    badge: "Giữ chân",
    description: "Tương phản mạnh, không khí căng thẳng, nhịp cảnh dồn và có ảnh thay thế khi video lỗi.",
    bestFor: "Truyện ma, creepypasta, bí ẩn chưa giải đáp",
    imageStyle: "dark gothic horror illustration, eerie fog, deep shadows, unsettling cinematic lighting, consistent characters, ominous atmosphere",
    language: "original",
    config: { genre: "mystery", writingStyle: "suspenseful", rewriteLevel: "balanced", hookEnabled: true, hookStyle: "warning", sceneMode: "dialogue", sceneCount: 12, promptsPerScene: 1, dialogueGroupSize: 1, promptFocus: "video", highDensity: false, generateType: "video", aspectRatio: "9:16", videoDuration: "8s", fallbackFailedVideosToImages: true, motionEnabled: true, motionStyle: "auto", motionIntensity: "natural", subtitleEnabled: true, subtitleStyle: "boxed", subtitlePosition: "bottom", seoTone: "curiosity", clipTransition: "cut" },
  },
  {
    id: "healing-sleep",
    name: "Chữa lành & kể chuyện ngủ",
    badge: "Nhẹ nhàng",
    description: "Hình ảnh mềm, chuyển động chậm, giọng tự nhiên và không dùng phụ đề gây mất tập trung.",
    bestFor: "Thiền, truyện ngủ, chữa lành, triết lý",
    imageStyle: "dreamy watercolor illustration, soft paper texture, pastel palette, warm peaceful atmosphere, gentle visual continuity",
    language: "original",
    config: { genre: "storytelling", writingStyle: "calm", rewriteLevel: "light", rewriteLengthMode: "source", hookEnabled: false, sceneMode: "dialogue", sceneCount: 16, promptsPerScene: 1, dialogueGroupSize: 3, promptFocus: "image", highDensity: false, generateType: "image", aspectRatio: "16:9", motionEnabled: true, motionStyle: "auto", motionIntensity: "gentle", voiceSpeed: "0.9", subtitleEnabled: false, seoTone: "emotional", clipTransition: "cut" },
  },
  {
    id: "anime-character-lock",
    name: "Anime đồng nhất nhân vật",
    badge: "Ảnh tham chiếu",
    description: "Bật sẵn tham chiếu và tối ưu prompt theo nhân vật; khách hàng vẫn chọn ảnh chung hoặc hồ sơ riêng.",
    bestFor: "Anime nhiều cảnh, nhiều nhân vật, series",
    imageStyle: "cinematic Japanese anime, clean line art, expressive eyes, soft cel shading, dramatic lighting, consistent character design, anime movie quality",
    language: "original",
    config: { genre: "storytelling", writingStyle: "cinematic", rewriteLevel: "balanced", hookEnabled: true, hookStyle: "shocking", sceneMode: "dialogue", sceneCount: 12, promptsPerScene: 2, dialogueGroupSize: 1, promptFocus: "image", highDensity: true, generateType: "image", aspectRatio: "9:16", useReferenceImages: true, noText: true, noWallPicture: true, motionEnabled: true, motionStyle: "auto", motionIntensity: "natural", subtitleEnabled: true, subtitleStyle: "karaoke", subtitlePosition: "bottom", seoTone: "curiosity", clipTransition: "cut" },
  },
  {
    id: "kids-3d",
    name: "Hoạt hình trẻ em 3D",
    badge: "Gia đình",
    description: "Màu sáng, nhân vật biểu cảm, nhịp dễ theo dõi và nội dung thân thiện với gia đình.",
    bestFor: "Truyện thiếu nhi, giáo dục, bài học ngắn",
    imageStyle: "high quality stylized 3D animation, expressive friendly characters, soft global illumination, colorful family-safe world, consistent design",
    language: "original",
    config: { genre: "education", audience: "family", writingStyle: "simple", rewriteLevel: "balanced", hookEnabled: true, hookStyle: "question", sceneMode: "dialogue", sceneCount: 10, promptsPerScene: 2, dialogueGroupSize: 1, promptFocus: "image", highDensity: true, generateType: "image", aspectRatio: "16:9", noText: true, motionEnabled: true, motionStyle: "auto", motionIntensity: "natural", subtitleEnabled: true, subtitleStyle: "yellow_pop", subtitlePosition: "bottom", seoTone: "emotional", clipTransition: "cut" },
  },
];

type Props = {
  disabled?: boolean;
  onApply: (preset: AutomationPreset) => Promise<void> | void;
  selectedVoice: string;
  setSelectedVoice: (value: string) => void;
  imageStyle: string;
  setImageStyle: (value: string) => void;
  language?: string;
};

type PresetCustomStyle = {
  id: string;
  name: string;
  desc: string;
  prompt: string;
  previewImage?: string;
  preview?: string;
};

export default function PresetAutomationHub({ disabled, onApply, selectedVoice, setSelectedVoice, imageStyle, setImageStyle, language = "vi" }: Props) {
  const initialId = localStorage.getItem("automation_selected_preset_v1") || AUTOMATION_PRESETS[0].id;
  const initialPreset = AUTOMATION_PRESETS.find((item) => item.id === initialId) || AUTOMATION_PRESETS[0];
  const [selectedId, setSelectedId] = useState(initialId);
  const [applying, setApplying] = useState(false);
  const [appliedId, setAppliedId] = useState("");
  const [platform, setPlatform] = useState<"preset" | "short" | "youtube" | "square">("preset");
  const [duration, setDuration] = useState<"preset" | "1" | "3" | "5" | "10">("preset");
  const [mediaMode, setMediaMode] = useState<"preset" | "image" | "video" | "mixed">("preset");
  const [pacing, setPacing] = useState<"preset" | "slow" | "normal" | "fast">("preset");
  const [subtitleMode, setSubtitleMode] = useState<"preset" | "none" | "minimal" | "viral" | "karaoke">("preset");
  const [referenceMode, setReferenceMode] = useState<"preset" | "on" | "off">("preset");
  const [voiceSpeed, setVoiceSpeed] = useState(String(initialPreset.config.voiceSpeed || "1.0"));
  const [resolution, setResolution] = useState("1080p");
  const [hookEnabled, setHookEnabled] = useState(initialPreset.config.hookEnabled !== false);
  const [hookStyle, setHookStyle] = useState(String(initialPreset.config.hookStyle || "shocking"));
  const [seoTone, setSeoTone] = useState(String(initialPreset.config.seoTone || "curiosity"));
  const [motionIntensity, setMotionIntensity] = useState(String(initialPreset.config.motionIntensity || "gentle"));
  const [noText, setNoText] = useState(initialPreset.config.noText !== false);
  const [noBlackBorder, setNoBlackBorder] = useState(initialPreset.config.noBlackBorder !== false);
  const [editingSection, setEditingSection] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [voiceLibraryOpen, setVoiceLibraryOpen] = useState(false);
  const [styleLibraryOpen, setStyleLibraryOpen] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => {
    try {
      const recent = JSON.parse(localStorage.getItem("automation_last_voice_v1") || "null");
      if (recent?.voiceModel === selectedVoice) return String(recent.voiceId || "");
      const premium = JSON.parse(localStorage.getItem("ai33_selected_voice") || "null");
      return (premium?.name || premium?.voice_name) === selectedVoice
        ? String(premium?.voice_id || premium?.id || "")
        : "";
    } catch {
      return "";
    }
  });
  const [customStyles, setCustomStyles] = useState<PresetCustomStyle[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("custom_image_styles_v1") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    let disposed = false;
    void fetch("/api/config/style-library")
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (disposed || !Array.isArray(payload?.customStyles)) return;
        setCustomStyles((localStyles) => {
          const merged = new Map<string, PresetCustomStyle>();
          payload.customStyles.forEach((style: PresetCustomStyle) => {
            if (style?.prompt) merged.set(String(style.id || style.prompt), style);
          });
          localStyles.forEach((style) => {
            if (style?.prompt) merged.set(String(style.id || style.prompt), style);
          });
          return [...merged.values()];
        });
      })
      .catch(() => {});
    return () => { disposed = true; };
  }, []);
  const selected = useMemo(() => AUTOMATION_PRESETS.find((item) => item.id === selectedId) || AUTOMATION_PRESETS[0], [selectedId]);
  const styleChoices = useMemo(() => [
    ...customStyles.map((style) => ({ ...style, builtIn: false })),
    ...IMAGE_STYLES.map((style, index) => ({
      ...style,
      id: `built-in-${index}`,
      previewImage: `/style-demos/${STYLE_DEMO_FILES[index]}?v=20260718-2`,
      builtIn: true,
    })),
  ], [customStyles]);

  const persistPremiumVoice = (voice: Voice) => {
    setSelectedVoice(voice.name);
    setSelectedVoiceId(voice.voice_id);
    const recentVoice = {
      voiceProvider: "premium",
      voiceModel: voice.name,
      voiceId: voice.voice_id,
      voiceSpeed,
      voicePitch: "0",
      voiceEmotion: "natural",
    };
    try {
      localStorage.setItem("ai33_selected_voice", JSON.stringify(voice));
      localStorage.setItem("automation_last_voice_v1", JSON.stringify(recentVoice));
      const fullConfig = JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}");
      const nextConfig = { ...fullConfig, ...recentVoice };
      localStorage.setItem("automation_full_config_v1", JSON.stringify(nextConfig));
      window.dispatchEvent(new CustomEvent("automationConfigUpdated", { detail: nextConfig }));
    } catch {
      /* local persistence is optional */
    }
    setVoiceLibraryOpen(false);
  };

  const applyStyle = (prompt: string) => {
    setImageStyle(prompt);
    try {
      localStorage.setItem("imageStyle", prompt);
      localStorage.setItem("cc_selectedStyle_v2", prompt);
    } catch {
      /* local persistence is optional */
    }
    setStyleLibraryOpen(false);
  };

  const adaptivePreset = useMemo<AutomationPreset>(() => {
    const original = selected.config;
    const minutes = duration === "preset" ? 0 : Number(duration);
    const presetPacing = original.highDensity === false
      ? "slow"
      : Number(original.dialogueGroupSize || 1) <= 1
        ? "fast"
        : "normal";
    const effectivePacing = pacing === "preset" ? presetPacing : pacing;
    const scenesPerMinute = effectivePacing === "slow" ? 4 : effectivePacing === "fast" ? 9 : 6;
    const calculatedScenes = minutes
      ? Math.max(6, Math.min(48, Math.round(minutes * scenesPerMinute)))
      : Number(original.sceneCount || 10);
    const aspectRatio = platform === "short" ? "9:16" : platform === "youtube" ? "16:9" : platform === "square" ? "1:1" : original.aspectRatio;
    const generateType = mediaMode === "image" ? "image" : mediaMode === "video" || mediaMode === "mixed" ? "video" : original.generateType;
    const subtitle = subtitleMode === "none"
      ? { subtitleEnabled: false }
      : subtitleMode === "minimal"
        ? { subtitleEnabled: true, subtitleStyle: "minimal", subtitlePosition: "bottom" }
        : subtitleMode === "viral"
          ? { subtitleEnabled: true, subtitleStyle: "yellow_pop", subtitlePosition: "bottom" }
          : subtitleMode === "karaoke"
            ? { subtitleEnabled: true, subtitleStyle: "karaoke", subtitlePosition: "bottom" }
            : {};
    return {
      ...selected,
      imageStyle: imageStyle.trim() || selected.imageStyle,
      config: {
        ...original,
        aspectRatio,
        generateType,
        promptFocus: generateType,
        fallbackFailedVideosToImages: mediaMode === "mixed" ? true : mediaMode === "video" ? false : original.fallbackFailedVideosToImages,
        rewriteLengthMode: minutes ? "minutes" : original.rewriteLengthMode,
        rewriteTargetMinutes: minutes || original.rewriteTargetMinutes,
        sceneCount: calculatedScenes,
        promptsPerScene: pacing === "preset" ? original.promptsPerScene : pacing === "slow" ? 1 : 2,
        dialogueGroupSize: pacing === "preset" ? original.dialogueGroupSize : pacing === "slow" ? 3 : pacing === "fast" ? 1 : 2,
        highDensity: pacing === "preset" ? original.highDensity : pacing !== "slow",
        resolution,
        voiceModel: selectedVoice,
        voiceSpeed,
        hookEnabled,
        hookStyle,
        seoTone,
        clipTransition: "cut",
        motionIntensity,
        noText,
        noBlackBorder,
        useReferenceImages: referenceMode === "on" ? true : referenceMode === "off" ? false : original.useReferenceImages,
        ...subtitle,
      },
    };
  }, [selected, platform, duration, mediaMode, pacing, subtitleMode, referenceMode, imageStyle, selectedVoice, voiceSpeed, resolution, hookEnabled, hookStyle, seoTone, motionIntensity, noText, noBlackBorder]);
  const presetDurationLabel = selected.config.rewriteLengthMode === "minutes"
    ? `Theo preset · khoảng ${String(selected.config.rewriteTargetMinutes || 1)} phút`
    : "Theo preset · giữ độ dài nội dung";
  const pacingLabel = pacing === "preset"
    ? "Theo preset"
    : pacing === "slow"
      ? "Chậm, chuyển động nhẹ"
      : pacing === "fast"
        ? "Nhanh, mật độ cao"
        : "Cân bằng";

  const selectPreset = (preset: AutomationPreset) => {
    setSelectedId(preset.id);
    setPlatform("preset");
    setDuration("preset");
    setMediaMode("preset");
    setPacing("preset");
    setSubtitleMode("preset");
    setReferenceMode("preset");
    setResolution("1080p");
    setImageStyle(preset.imageStyle);
    setVoiceSpeed(String(preset.config.voiceSpeed || "1.0"));
    setHookEnabled(preset.config.hookEnabled !== false);
    setHookStyle(String(preset.config.hookStyle || "shocking"));
    setSeoTone(String(preset.config.seoTone || "curiosity"));
    setMotionIntensity(String(preset.config.motionIntensity || "gentle"));
    setNoText(preset.config.noText !== false);
    setNoBlackBorder(preset.config.noBlackBorder !== false);
    setAppliedId("");
  };

  const saveDefaultProfile = () => {
    localStorage.setItem("automation_easy_profile_v1", JSON.stringify({ selectedId, platform, duration, mediaMode, pacing, subtitleMode, referenceMode, stylePrompt: imageStyle || selected.imageStyle, voiceModel: selectedVoice, voiceSpeed, resolution, hookEnabled, hookStyle, seoTone, motionIntensity, noText, noBlackBorder }));
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 1800);
  };

  const loadDefaultProfile = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("automation_easy_profile_v1") || "null");
      if (!saved) return;
      const preset = AUTOMATION_PRESETS.find((item) => item.id === saved.selectedId) || selected;
      setSelectedId(preset.id); setPlatform(saved.platform || "preset"); setDuration(saved.duration && saved.duration !== "source" ? saved.duration : "preset"); setMediaMode(saved.mediaMode || "preset"); setPacing(saved.pacing || "preset"); setSubtitleMode(saved.subtitleMode || "preset"); setReferenceMode(saved.referenceMode || "preset"); setImageStyle(saved.stylePrompt || preset.imageStyle); setSelectedVoice(saved.voiceModel || "Zephyr"); setVoiceSpeed(saved.voiceSpeed || "1.0"); setResolution(saved.resolution === "4K" ? "4k" : saved.resolution || "1080p"); setHookEnabled(saved.hookEnabled !== false); setHookStyle(saved.hookStyle || "shocking"); setSeoTone(saved.seoTone || "curiosity"); setMotionIntensity(["gentle", "natural", "dynamic"].includes(saved.motionIntensity) ? saved.motionIntensity : "gentle"); setNoText(saved.noText !== false); setNoBlackBorder(saved.noBlackBorder !== false);
    } catch {}
  };

  const apply = async () => {
    setApplying(true);
    try {
      await onApply(adaptivePreset);
      localStorage.setItem("automation_selected_preset_v1", selected.id);
      localStorage.setItem("automation_preset_adaptive_v1", JSON.stringify({ platform, duration, mediaMode, pacing, subtitleMode, referenceMode }));
      setAppliedId(selected.id);
    } finally {
      setApplying(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-indigo-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-600 px-6 py-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.16em] text-indigo-100"><Sparkles className="h-4 w-4" /> Tự động theo Preset</div>
            <h2 className="mt-2 text-xl font-black">Chọn mục tiêu, nhập dữ liệu và tạo video</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-indigo-100">Mỗi preset đã cấu hình đầy đủ từ xử lý nội dung, chia cảnh, media, voice, SEO đến render. Khách hàng chỉ nhập dữ liệu dự án và chọn tài nguyên riêng bên dưới.</p>
          </div>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black">10 PRESET TỐI ƯU</span>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
        {AUTOMATION_PRESETS.map((preset) => {
          const active = preset.id === selectedId;
          const isVideo = preset.config.generateType === "video";
          return (
            <button key={preset.id} type="button" onClick={() => selectPreset(preset)} className={`relative rounded-2xl border p-4 text-left transition ${active ? "border-violet-500 bg-violet-50 shadow-md ring-2 ring-violet-100" : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm"}`}>
              {active && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white"><Check className="h-3.5 w-3.5" /></span>}
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${isVideo ? "bg-rose-100 text-rose-600" : "bg-sky-100 text-sky-600"}`}>{isVideo ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}</span>
              <p className="mt-3 pr-5 text-sm font-black text-slate-900">{preset.name}</p>
              <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-600">{preset.badge}</span>
              <p className="mt-2 text-[11px] leading-4 text-slate-500">{preset.bestFor}</p>
            </button>
          );
        })}
      </div>

      <div className="mx-5 mb-5 grid gap-4 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-cyan-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3"><div><span className="flex items-center gap-2 text-xs font-black text-slate-800"><Mic className="h-4 w-4 text-cyan-600" /> Voice trong Preset</span><p className="mt-1 text-[10px] text-slate-500">Cùng thư viện Voice Premium như tab setup.</p></div><span className="text-[9px] font-black text-cyan-700">ĐỒNG BỘ</span></div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3"><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase text-slate-400">Giọng đang chọn</p><p className="truncate text-sm font-black text-slate-800">{selectedVoice || "Chưa chọn Voice"}</p></div><select value={voiceSpeed} onChange={(event) => setVoiceSpeed(event.target.value)} className="rounded-xl border border-cyan-200 bg-white px-2 py-2 text-xs font-bold text-slate-700"><option value="0.85">0.85x</option><option value="0.9">0.9x</option><option value="1.0">1.0x</option><option value="1.1">1.1x</option><option value="1.2">1.2x</option></select></div>
          <button type="button" onClick={() => setVoiceLibraryOpen(true)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-black text-white hover:bg-cyan-700"><Mic className="h-4 w-4" /> Mở thư viện Voice đầy đủ</button>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3"><div><span className="flex items-center gap-2 text-xs font-black text-slate-800"><Palette className="h-4 w-4 text-violet-600" /> Style Prompt trong Preset</span><p className="mt-1 text-[10px] text-slate-500">Chọn từ thư viện có ảnh preview hoặc tự chỉnh prompt.</p></div><span className="text-[9px] font-black text-violet-700">ĐỒNG BỘ</span></div>
          <select value={imageStyle || selected.imageStyle} onChange={(event) => applyStyle(event.target.value)} className="mt-3 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700">{!styleChoices.some((style) => style.prompt === (imageStyle || selected.imageStyle)) && <option value={imageStyle || selected.imageStyle}>Phong cách tùy chỉnh đang dùng</option>}{styleChoices.map((style) => <option key={style.id} value={style.prompt}>{style.name}</option>)}</select>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2"><textarea value={imageStyle || selected.imageStyle} onChange={(event) => setImageStyle(event.target.value)} rows={2} className="w-full resize-none rounded-xl border border-violet-200 bg-white p-3 text-[11px] leading-5 text-slate-700 outline-none focus:ring-2 focus:ring-violet-100" /><button type="button" onClick={() => setStyleLibraryOpen((open) => !open)} className="rounded-xl bg-violet-600 px-3 text-[11px] font-black text-white hover:bg-violet-700">{styleLibraryOpen ? "Thu gọn" : "Xem preview"}</button></div>
        </div>
      </div>

      {styleLibraryOpen && <div className="mx-5 mb-5 rounded-2xl border border-violet-200 bg-violet-50/50 p-4"><div className="mb-3"><p className="text-sm font-black text-slate-900">Thư viện Style Prompt</p><p className="mt-1 text-[10px] text-slate-500">Nhấp ảnh để áp dụng trực tiếp cho Preset và đồng bộ sang các tab setup.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{styleChoices.map((style) => { const active = (imageStyle || selected.imageStyle) === style.prompt; return <button key={style.id} type="button" onClick={() => applyStyle(style.prompt)} className={`overflow-hidden rounded-xl border bg-white text-left transition ${active ? "border-violet-500 ring-2 ring-violet-200" : "border-slate-200 hover:border-violet-300"}`}><div className={`relative h-28 overflow-hidden bg-gradient-to-br ${style.preview || "from-slate-800 to-slate-500"}`} style={style.previewImage ? { backgroundImage: `url("${style.previewImage}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}><div className="flex h-full items-end bg-gradient-to-t from-black/80 to-transparent p-2"><span className="text-[11px] font-black text-white">{style.name}</span></div></div><p className="min-h-12 p-2.5 text-[10px] leading-relaxed text-slate-500">{style.desc}</p></button>; })}</div></div>}

      <div className="mx-5 mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div><p className="text-sm font-black text-slate-900">Tinh chỉnh nhanh theo video thực tế</p><p className="mt-1 text-[11px] text-slate-500">Tool tự tính lại số cảnh, prompt và nhịp dựng; không cần mở thiết lập nâng cao.</p></div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">THÍCH ỨNG TỰ ĐỘNG</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1.5"><span className="text-[11px] font-black text-slate-700">Nền tảng / tỷ lệ</span><select value={platform} onChange={(event) => setPlatform(event.target.value as typeof platform)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700"><option value="preset">Theo preset</option><option value="short">TikTok / Shorts · 9:16</option><option value="youtube">YouTube · 16:9</option><option value="square">Facebook vuông · 1:1</option></select></label>
          <label className="space-y-1.5"><span className="text-[11px] font-black text-slate-700">Độ dài mục tiêu</span><select value={duration} onChange={(event) => setDuration(event.target.value as typeof duration)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700"><option value="preset">{presetDurationLabel}</option><option value="1">Khoảng 1 phút</option><option value="3">Khoảng 3 phút</option><option value="5">Khoảng 5 phút</option><option value="10">Khoảng 10 phút</option></select></label>
          <label className="space-y-1.5"><span className="text-[11px] font-black text-slate-700">Chiến lược Media</span><select value={mediaMode} onChange={(event) => setMediaMode(event.target.value as typeof mediaMode)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700"><option value="preset">Theo preset</option><option value="image">Chỉ tạo ảnh</option><option value="video">Chỉ tạo video</option><option value="mixed">Video, lỗi thì thay bằng ảnh</option></select></label>
          <label className="space-y-1.5"><span className="text-[11px] font-black text-slate-700">Nhịp kể / dựng</span><select value={pacing} onChange={(event) => setPacing(event.target.value as typeof pacing)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700"><option value="preset">Theo preset</option><option value="slow">Chậm · ít cảnh, nhẹ nhàng</option><option value="normal">Vừa · cân bằng</option><option value="fast">Nhanh · nhiều cảnh, giữ chân</option></select></label>
          <label className="space-y-1.5"><span className="text-[11px] font-black text-slate-700">Phụ đề</span><select value={subtitleMode} onChange={(event) => setSubtitleMode(event.target.value as typeof subtitleMode)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700"><option value="preset">Theo preset</option><option value="none">Không phụ đề</option><option value="minimal">Tối giản</option><option value="viral">Viral nổi bật</option><option value="karaoke">Karaoke theo từ</option></select></label>
          <label className="space-y-1.5"><span className="text-[11px] font-black text-slate-700">Ảnh tham chiếu nhân vật</span><select value={referenceMode} onChange={(event) => setReferenceMode(event.target.value as typeof referenceMode)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700"><option value="preset">Theo preset</option><option value="on">Bật đồng nhất nhân vật</option><option value="off">Không dùng tham chiếu</option></select></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black">
          <span className="rounded-full bg-white px-3 py-1.5 text-violet-700">{String(adaptivePreset.config.aspectRatio)}</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-sky-700">{adaptivePreset.config.generateType === "video" ? "Video AI" : "Ảnh AI"}</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-amber-700">{String(adaptivePreset.config.sceneCount)} cảnh dự kiến</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-emerald-700">{String(adaptivePreset.config.promptsPerScene)} prompt/cảnh</span>
        </div>
      </div>

      <div className="mx-5 mb-5 rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3"><WandSparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><p className="text-sm font-black text-slate-900">Preview cấu hình · {selected.name}</p><p className="mt-1 text-xs leading-5 text-slate-600">{selected.description}</p></div></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={loadDefaultProfile} className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs font-black text-violet-700">Dùng hồ sơ mặc định</button><button type="button" onClick={saveDefaultProfile} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs font-black text-violet-700"><Save className="h-3.5 w-3.5" />{profileSaved ? "Đã lưu" : "Lưu làm mặc định"}</button><button type="button" disabled={disabled || applying} onClick={apply} className="shrink-0 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">{applying ? "Đang áp dụng..." : appliedId === selected.id ? "✓ Đã áp dụng" : "Dùng preset này"}</button></div>
        </div>
        <p className="mt-3 text-[10px] font-semibold text-violet-700">Nhấp vào từng ô bên dưới để chỉnh đúng nhóm thiết lập đó.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["output", "Đầu ra", `${String(adaptivePreset.config.aspectRatio)} · ${adaptivePreset.config.resolution || "1080p"}`],
            ["media", "Media", adaptivePreset.config.generateType === "video" ? (adaptivePreset.config.fallbackFailedVideosToImages ? "Video · lỗi thay bằng ảnh" : "Chỉ video") : "Ảnh AI"],
            ["scenes", "Phân cảnh", `${String(adaptivePreset.config.sceneCount)} cảnh · ${String(adaptivePreset.config.promptsPerScene)} prompt/cảnh`],
            ["pacing", "Nhịp dựng", pacingLabel],
            ["hook", "Hook", adaptivePreset.config.hookEnabled === false ? "Không dùng" : `${String(adaptivePreset.config.hookStyle || "tự động")} · đầu video`],
            ["voice", "Voice", `${String(adaptivePreset.config.voiceModel || "Voice đã chọn")} · tốc độ ${String(adaptivePreset.config.voiceSpeed || "1.0")}`],
            ["subtitle", "Phụ đề", adaptivePreset.config.subtitleEnabled === false ? "Không dùng" : `${String(adaptivePreset.config.subtitleStyle || "theo preset")} · ${String(adaptivePreset.config.subtitlePosition || "bottom")}`],
            ["character", "Nhân vật", adaptivePreset.config.useReferenceImages ? "Bật ảnh tham chiếu" : "Không bắt buộc tham chiếu"],
            ["seo", "SEO", `Giọng ${String(adaptivePreset.config.seoTone || "tự động")} · thumbnail ${String(adaptivePreset.config.thumbnailStyle || "theo nội dung")}`],
            ["render", "Render", `Cắt thẳng · motion ${String(adaptivePreset.config.motionIntensity || "gentle")}`],
            ["constraints", "Ràng buộc ảnh", adaptivePreset.config.noText ? "Không chữ · không viền đen" : "Cho phép chữ"],
            ["duration", "Độ dài", duration === "preset" ? presetDurationLabel : `Khoảng ${duration} phút`],
          ].map(([id, label, value]) => <button type="button" onClick={() => setEditingSection(id)} key={id} className="group rounded-xl border border-white bg-white/80 px-3 py-2.5 text-left transition hover:border-violet-300 hover:bg-white hover:shadow-sm"><span className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-wide text-violet-500">{label}</span><Pencil className="h-3 w-3 text-slate-300 group-hover:text-violet-500" /></span><span className="mt-1 block text-[11px] font-bold text-slate-700">{value}</span></button>)}
        </div>
      </div>
      {editingSection && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-violet-600">Chỉnh thiết lập preset</p><h3 className="mt-1 text-lg font-black text-slate-900">{editingSection}</h3></div><button type="button" onClick={() => setEditingSection("")} className="rounded-xl bg-slate-100 p-2 text-slate-500"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-4">
        {editingSection === "output" && <><label className="block text-xs font-black text-slate-700">Tỷ lệ<select value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)} className="mt-2 w-full rounded-xl border p-3"><option value="preset">Theo preset</option><option value="short">9:16</option><option value="youtube">16:9</option><option value="square">1:1</option></select></label><label className="block text-xs font-black text-slate-700">Độ phân giải<select value={resolution} onChange={(e) => setResolution(e.target.value)} className="mt-2 w-full rounded-xl border p-3"><option value="720p">720p</option><option value="1080p">1080p</option><option value="4k">4K</option></select></label></>}
        {editingSection === "media" && <label className="block text-xs font-black text-slate-700">Chiến lược Media<select value={mediaMode} onChange={(e) => setMediaMode(e.target.value as typeof mediaMode)} className="mt-2 w-full rounded-xl border p-3"><option value="preset">Theo preset</option><option value="image">Chỉ ảnh</option><option value="video">Chỉ video</option><option value="mixed">Video lỗi thay bằng ảnh</option></select></label>}
        {(editingSection === "scenes" || editingSection === "pacing" || editingSection === "duration") && <><label className="block text-xs font-black text-slate-700">Độ dài<select value={duration} onChange={(e) => setDuration(e.target.value as typeof duration)} className="mt-2 w-full rounded-xl border p-3"><option value="preset">{presetDurationLabel}</option><option value="1">1 phút</option><option value="3">3 phút</option><option value="5">5 phút</option><option value="10">10 phút</option></select></label><label className="block text-xs font-black text-slate-700">Nhịp dựng<select value={pacing} onChange={(e) => setPacing(e.target.value as typeof pacing)} className="mt-2 w-full rounded-xl border p-3"><option value="preset">Theo preset</option><option value="slow">Chậm</option><option value="normal">Cân bằng</option><option value="fast">Nhanh</option></select></label></>}
        {editingSection === "hook" && <><label className="flex items-center gap-2 text-xs font-black text-slate-700"><input type="checkbox" checked={hookEnabled} onChange={(e) => setHookEnabled(e.target.checked)} /> Dùng Hook đầu video</label><select value={hookStyle} onChange={(e) => setHookStyle(e.target.value)} className="w-full rounded-xl border p-3"><option value="shocking">Gây sốc</option><option value="question">Câu hỏi</option><option value="warning">Cảnh báo</option><option value="benefit">Lợi ích</option></select></>}
        {editingSection === "voice" && <><div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3"><p className="text-[10px] font-black uppercase text-cyan-700">Voice đang chọn</p><p className="mt-1 text-sm font-black text-slate-800">{selectedVoice || "Chưa chọn"}</p></div><button type="button" onClick={() => setVoiceLibraryOpen(true)} className="w-full rounded-xl bg-cyan-600 p-3 text-xs font-black text-white">Mở thư viện Voice đầy đủ</button><select value={voiceSpeed} onChange={(e) => setVoiceSpeed(e.target.value)} className="w-full rounded-xl border p-3"><option value="0.85">0.85x</option><option value="0.9">0.9x</option><option value="1.0">1.0x</option><option value="1.1">1.1x</option><option value="1.2">1.2x</option></select></>}
        {editingSection === "subtitle" && <select value={subtitleMode} onChange={(e) => setSubtitleMode(e.target.value as typeof subtitleMode)} className="w-full rounded-xl border p-3"><option value="preset">Theo preset</option><option value="none">Không phụ đề</option><option value="minimal">Tối giản</option><option value="viral">Viral</option><option value="karaoke">Karaoke</option></select>}
        {editingSection === "character" && <select value={referenceMode} onChange={(e) => setReferenceMode(e.target.value as typeof referenceMode)} className="w-full rounded-xl border p-3"><option value="preset">Theo preset</option><option value="on">Bật tham chiếu</option><option value="off">Không dùng tham chiếu</option></select>}
        {editingSection === "seo" && <select value={seoTone} onChange={(e) => setSeoTone(e.target.value)} className="w-full rounded-xl border p-3"><option value="curiosity">Tò mò</option><option value="authority">Uy tín</option><option value="emotional">Cảm xúc</option><option value="direct">Trực tiếp, rõ lợi ích</option></select>}
        {editingSection === "render" && <><div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-600">Ghép cảnh: Cắt thẳng theo timeline voice</div><select value={motionIntensity} onChange={(e) => setMotionIntensity(e.target.value)} className="w-full rounded-xl border p-3"><option value="gentle">Nhẹ</option><option value="natural">Tự nhiên</option><option value="dynamic">Năng động</option></select></>}
        {editingSection === "constraints" && <><label className="flex items-center gap-2 text-xs font-black"><input type="checkbox" checked={noText} onChange={(e) => setNoText(e.target.checked)} /> Không tạo chữ trong ảnh</label><label className="flex items-center gap-2 text-xs font-black"><input type="checkbox" checked={noBlackBorder} onChange={(e) => setNoBlackBorder(e.target.checked)} /> Không viền đen</label></>}
      </div><button type="button" onClick={() => setEditingSection("")} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white">Lưu thay đổi</button></div></div>}
      <VoiceSelectionDialog isOpen={voiceLibraryOpen} onClose={() => setVoiceLibraryOpen(false)} currentLang={language === "en" ? "en" : "vi"} selectedVoiceId={selectedVoiceId} onSelectVoice={persistPremiumVoice} />
    </section>
  );
}
