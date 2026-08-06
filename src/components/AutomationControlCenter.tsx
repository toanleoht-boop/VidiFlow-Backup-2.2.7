import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Captions,
  Check,
  Clapperboard,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  ImagePlus,
  Mic2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Square,
  StopCircle,
  Trash2,
  Upload,
  Volume2,
  WandSparkles,
} from "lucide-react";
import { VoiceSelectionDialog, Voice } from "./VoiceSelectionDialog";
import { vidiflowPrompt } from "./VidiFlowDialogCenter";

const SUBTITLE_STYLE_PRESETS = [
  { value: "viral_pink", label: "Viral hồng", motion: "Bật lên + nhấn từ hồng", sample: ["CÓ NHỮNG", "KHI 100.000 CŨNG"], accent: "text-fuchsia-400", italic: false },
  { value: "viral_yellow", label: "Viral vàng", motion: "Bật lên + nhấn từ vàng", sample: ["CÓ NHỮNG", "KHI 100.000 CŨNG"], accent: "text-yellow-300", italic: false },
  { value: "sport_green", label: "Năng động xanh", motion: "Nghiêng trượt + nhấn xanh", sample: ["CÓ NHỮNG", "KHI 100.000 CŨNG"], accent: "text-lime-400", italic: true },
  { value: "lime_shadow", label: "Xanh chanh 3D", motion: "Mờ hiện + bóng nổi 3D", sample: ["có những khi"], accent: "text-lime-300", italic: false },
  { value: "mega_yellow", label: "Chữ lớn vàng", motion: "Zoom mạnh nhiều dòng", sample: ["CÓ NHỮNG KHI", "100.000 CŨNG", "NHƯ CHIẾC"], accent: "text-yellow-300", italic: false },
  { value: "karaoke_yellow", label: "Karaoke vàng", motion: "Tô vàng theo từng từ", sample: ["CÓ NHỮNG", "KHI"], accent: "text-yellow-300", italic: false },
  { value: "karaoke_cyan", label: "Karaoke xanh", motion: "Tô xanh theo từng từ", sample: ["CÓ NHỮNG", "KHI"], accent: "text-cyan-300", italic: false },
  { value: "modern", label: "Hiện đại", motion: "Fade nhẹ", sample: ["THE QUICK", "BROWN FOX"], accent: "text-white", italic: false },
  { value: "boxed", label: "Hộp nền", motion: "Fade trong hộp tối", sample: ["THE QUICK BROWN FOX"], accent: "text-white", italic: false },
  { value: "minimal", label: "Tối giản", motion: "Hiện nhẹ nhàng", sample: ["The quick brown fox"], accent: "text-yellow-200", italic: false },
] as const;

const LEGACY_SUBTITLE_STYLE_PRESETS = [
  { value: "modern", label: "Hi\u1ec7n \u0111\u1ea1i", motion: "tr\u1eafng, vi\u1ec1n \u0111en" },
  { value: "boxed", label: "H\u1ed9p n\u1ec1n \u0111en", motion: "d\u1ec5 \u0111\u1ecdc" },
  { value: "minimal", label: "T\u1ed1i gi\u1ea3n", motion: "v\u00e0ng nh\u1ea1t" },
  { value: "shorts", label: "Shorts n\u1ed5i b\u1eadt", motion: "v\u00e0ng \u0111\u1eadm" },
  { value: "yellow_pop", label: "Viral v\u00e0ng", motion: "ch\u1eef l\u1edbn, vi\u1ec1n \u0111en d\u00e0y" },
  { value: "karaoke", label: "Karaoke", motion: "xanh ng\u1ecdc, t\u01b0\u01a1ng ph\u1ea3n cao" },
  { value: "news", label: "B\u1ea3n tin", motion: "tr\u1eafng, n\u1ec1n xanh \u0111\u1eadm" },
  { value: "neon", label: "Neon", motion: "t\u00edm h\u1ed3ng, n\u1ed5i b\u1eadt ban \u0111\u00eam" },
] as const;

type AutoConfig = {
  inputType: "script" | "idea" | "link";
  customGenre: string;
  scriptInstructions: string;
  preserveOriginalScript: boolean;
  genre: string;
  audience: string;
  writingStyle: string;
  rewriteLevel: string;
  rewriteLengthMode: "source" | "words" | "minutes";
  rewriteTargetWords: number;
  rewriteTargetMinutes: number;
  similarityReduction: string;
  creativity: string;
  factCheck: boolean;
  hookEnabled: boolean;
  hookPosition: string;
  hookCount: number;
  hookStyle: string;
  sceneMode: string;
  sceneCount: number;
  promptsPerScene: number;
  dialogueGroupSize: number;
  promptFocus: string;
  highDensity: boolean;
  generateType: "image" | "video";
  generationMode: string;
  aspectRatio: string;
  imageEngine: string;
  videoEngine: string;
  viettheoVideoQuality: "LITE" | "HIGH";
  videoDuration: string;
  fallbackFailedVideosToImages: boolean;
  lockedKeyframesPipeline: boolean;
  dialogueVideoMode: boolean;
  keepVideoAudio: boolean;
  useReferenceImages: boolean;
  characterBible: string;
  characterProfileId: string;
  dialogueVoiceGuide: string;
  clipTransition: string;
  chromeHeadless: boolean;
  chromeThreads: number;
  tabsPerChrome: number;
  noText: boolean;
  noBlackBorder: boolean;
  noWallPicture: boolean;
  removeAiWatermark: boolean;
  watermarkBackend: "cv2" | "migan";
  voiceProvider: string;
  voiceModel: string;
  voiceId: string;
  voiceSpeed: string;
  voicePitch: string;
  voiceEmotion: string;
  seoTone: string;
  targetKeywords: string;
  includeTracklist: boolean;
  includeChapters: boolean;
  thumbnailStyle: string;
  renderSource: string;
  resolution: string;
  motionEnabled: boolean;
  motionStyle: string;
  motionIntensity: string;
  subtitleEnabled: boolean;
  subtitleStyle: string;
  subtitlePosition: string;
  backgroundMusicEnabled: boolean;
  backgroundMusicMode: "file" | "folder";
  backgroundMusicPath: string;
  backgroundMusicFolder: string;
  backgroundMusicVolume: number;
  watermarkType: string;
  watermarkPath: string;
  watermarkText: string;
  watermarkPosition: string;
};

const DEFAULT_CONFIG: AutoConfig = {
  inputType: "script",
  genre: "storytelling",
  customGenre: "",
  scriptInstructions: "",
  audience: "general",
  writingStyle: "engaging",
  preserveOriginalScript: true,
  rewriteLevel: "original",
  rewriteLengthMode: "source",
  rewriteTargetWords: 300,
  rewriteTargetMinutes: 1,
  similarityReduction: "medium",
  creativity: "balanced",
  factCheck: false,
  hookEnabled: true,
  hookPosition: "start",
  hookCount: 4,
  hookStyle: "shocking",
  sceneMode: "dialogue",
  sceneCount: 10,
  promptsPerScene: 1,
  dialogueGroupSize: 1,
  promptFocus: "image",
  highDensity: false,
  generateType: "image",
  generationMode: "viettheo-api",
  aspectRatio: "16:9",
  imageEngine: "NANO_BANANA",
  videoEngine: "Veo 3.1 - Lite",
  viettheoVideoQuality: "HIGH",
  videoDuration: "8s",
  fallbackFailedVideosToImages: false,
  lockedKeyframesPipeline: false,
  dialogueVideoMode: false,
  keepVideoAudio: true,
  useReferenceImages: false,
  characterBible: "",
  characterProfileId: "",
  dialogueVoiceGuide: "",
  clipTransition: "cut",
  chromeHeadless: false,
  chromeThreads: 7,
  tabsPerChrome: 1,
  noText: true,
  noBlackBorder: true,
  noWallPicture: true,
  removeAiWatermark: false,
  watermarkBackend: "migan",
  voiceProvider: "premium",
  voiceModel: "Zephyr",
  voiceId: "",
  voiceSpeed: "1.0",
  voicePitch: "0",
  voiceEmotion: "natural",
  seoTone: "curiosity",
  targetKeywords: "",
  includeTracklist: false,
  includeChapters: false,
  thumbnailStyle: "from-step3",
  renderSource: "auto",
  resolution: "1080p",
  motionEnabled: true,
  motionStyle: "auto",
  motionIntensity: "gentle",
  subtitleEnabled: false,
  subtitleStyle: "modern",
  subtitlePosition: "bottom",
  backgroundMusicEnabled: false,
  backgroundMusicMode: "file",
  backgroundMusicPath: "",
  backgroundMusicFolder: "",
  backgroundMusicVolume: 18,
  watermarkType: "none",
  watermarkPath: "",
  watermarkText: "",
  watermarkPosition: "bottom-right",
};

const DEFAULT_WATERMARK_PATH = "__VIDIFLOW_DEFAULT_LOGO__";

export const IMAGE_STYLES = [
  {
    name: "Điện ảnh chân thực",
    desc: "Ánh sáng điện ảnh, độ sâu trường ảnh, chi tiết chân thực.",
    prompt:
      "cinematic photorealistic, dramatic lighting, shallow depth of field, highly detailed, professional color grading",
    preview: "from-slate-950 via-amber-900 to-orange-300",
  },
  {
    name: "Hoạt hình 3D",
    desc: "Nhân vật 3D mềm mại, màu sáng, thân thiện với gia đình.",
    prompt:
      "high quality stylized 3D animation, expressive characters, soft global illumination, colorful family-friendly look",
    preview: "from-cyan-400 via-violet-400 to-pink-300",
  },
  {
    name: "Chibi hài hước",
    desc: "Nhân vật đầu lớn, biểu cảm mạnh, phù hợp video kể chuyện vui.",
    prompt:
      "cute chibi cartoon, oversized head, simple expressive face, clean outlines, colorful humorous storytelling",
    preview: "from-lime-300 via-yellow-300 to-rose-300",
  },
  {
    name: "Anime điện ảnh",
    desc: "Khung hình anime chi tiết với ánh sáng và chuyển động kịch tính.",
    prompt:
      "cinematic anime illustration, detailed background, dynamic composition, dramatic rim light, polished animation frame",
    preview: "from-indigo-950 via-blue-600 to-pink-400",
  },
  {
    name: "Tranh màu nước",
    desc: "Mềm mại, mơ mộng, phù hợp truyện chữa lành và cảm xúc.",
    prompt:
      "dreamy watercolor illustration, soft paper texture, delicate brush strokes, pastel palette, warm emotional atmosphere",
    preview: "from-sky-200 via-pink-200 to-amber-100",
  },
  {
    name: "Bảng phấn tối giản",
    desc: "Nền bảng đen, nét phấn trắng, trực quan và tập trung nội dung.",
    prompt:
      "minimalist chalkboard illustration, hand-drawn white chalk lines, dark blackboard texture, simple conceptual composition",
    preview: "from-slate-950 via-slate-800 to-slate-500",
  },
  {
    name: "Truyện tranh cổ điển",
    desc: "Nét mực đậm, màu halftone, nhịp kể nhanh và nổi bật.",
    prompt:
      "classic comic book art, bold ink outlines, halftone texture, dynamic panels, vivid limited color palette",
    preview: "from-red-600 via-yellow-400 to-blue-700",
  },
  {
    name: "Kinh dị Gothic",
    desc: "Bóng tối, sương mù và tương phản mạnh cho nội dung bí ẩn.",
    prompt:
      "dark gothic horror illustration, eerie fog, deep shadows, desaturated palette, ominous cinematic lighting",
    preview: "from-black via-purple-950 to-red-950",
  },
  {
    name: "Lịch sử sử thi",
    desc: "Bối cảnh rộng lớn, phục trang cổ đại và ánh sáng hoành tráng.",
    prompt:
      "epic historical cinematic painting, authentic period costumes, monumental environment, dramatic golden light, rich detail",
    preview: "from-stone-800 via-amber-700 to-yellow-300",
  },
  {
    name: "Tài liệu chân thực",
    desc: "Tự nhiên, trung tính, giống hình ảnh phim tài liệu chuyên nghiệp.",
    prompt:
      "authentic documentary photography, natural available light, realistic environment, candid composition, neutral color grade",
    preview: "from-emerald-900 via-stone-500 to-sky-300",
  },
  {
    name: "Cyberpunk",
    desc: "Thành phố neon, công nghệ tương lai và không khí đậm chất sci-fi.",
    prompt:
      "cyberpunk futuristic city, neon magenta and cyan lights, rainy atmosphere, high-tech details, cinematic sci-fi composition",
    preview: "from-fuchsia-700 via-purple-950 to-cyan-400",
  },
  {
    name: "Claymation",
    desc: "Chất liệu đất sét thủ công, đáng yêu và khác biệt.",
    prompt:
      "handcrafted claymation style, tactile clay texture, miniature set, soft studio lighting, charming stop-motion aesthetic",
    preview: "from-orange-300 via-rose-300 to-teal-300",
  },
  {
    name: "Giấy cắt nhiều lớp",
    desc: "Các lớp giấy có chiều sâu, sạch và phù hợp video giáo dục.",
    prompt:
      "layered paper cut illustration, visible paper fibers, clean shapes, soft cast shadows, elegant educational composition",
    preview: "from-teal-200 via-blue-300 to-indigo-400",
  },
  {
    name: "Low-poly",
    desc: "Hình khối đơn giản, hiện đại, màu sắc rõ ràng.",
    prompt:
      "stylized low-poly 3D art, geometric shapes, clean facets, modern color palette, crisp studio lighting",
    preview: "from-emerald-400 via-cyan-500 to-indigo-600",
  },
  {
    name: "Vintage thập niên 80",
    desc: "Màu film cũ, hạt nhiễu và cảm giác hoài niệm.",
    prompt:
      "1980s vintage film still, warm faded colors, analog grain, retro wardrobe and production design, nostalgic cinematic mood",
    preview: "from-amber-200 via-orange-500 to-purple-800",
  },
];

// Các ảnh này được tạo một lần bằng model NANO_BANANA tiết kiệm và là ví dụ trực quan cho khách chọn style.
export const STYLE_DEMO_FILES = [
  "01-cinematic.jpg",
  "02-3d-animation.jpg",
  "03-chibi.jpg",
  "04-anime.jpg",
  "05-watercolor.jpg",
  "06-chalkboard.jpg",
  "07-comic.jpg",
  "08-gothic.jpg",
  "09-historical.jpg",
  "10-documentary.jpg",
  "11-cyberpunk.jpg",
  "12-claymation.jpg",
  "13-paper-cut.jpg",
  "14-low-poly.jpg",
  "15-vintage-80s.jpg",
];

type CustomStyle = {
  id: string;
  name: string;
  desc: string;
  prompt: string;
  previewImage?: string;
};
type CharacterProfile = {
  id: string;
  name: string;
  aliases?: string;
  description: string;
  referenceImages?: string[];
  updatedAt: string;
};

const characterCode = (profile: CharacterProfile, index: number) => {
  const stored = profile.id.match(/CHAR_\d+/i)?.[0];
  return stored?.toUpperCase() || `CHAR_${String(index + 1).padStart(2, "0")}`;
};

const buildCharacterLock = (
  profiles: CharacterProfile[],
  selectedIds: string[],
) => {
  const selected = profiles.filter((profile) => selectedIds.includes(profile.id));
  if (!selected.length) return "";
  return [
    "MULTI-CHARACTER IDENTITY LOCK (IMMUTABLE):",
    ...selected.map((profile) => {
      const index = profiles.findIndex((item) => item.id === profile.id);
      const aliases = profile.aliases?.trim()
        ? ` | ALIASES: ${profile.aliases.trim()}`
        : "";
      return `[${characterCode(profile, index)}] NAME: ${profile.name.trim()}${aliases}\nIDENTITY: ${profile.description.trim()}`;
    }),
    "RULES: Match characters by ID, name or alias. Keep gender, age, facial structure, skin tone, hair, body proportions, wardrobe and signature details unchanged. Never merge or swap traits. Include only characters actually present in each scene and describe every present character separately. If the attached shared cast sheet contains several labelled characters, use the printed names only to map each design to the matching scene character; never render those labels and never add a cast member whose name is absent from the scene.",
  ].join("\n\n");
};

type Props = {
  presetMode?: boolean;
  configRevision?: number;
  projectDir: string;
  onProjectDirChange: (value: string) => Promise<void>;
  rawInput: string;
  finalizedScript: string;
  setRawInput: (value: string) => void;
  onRequestInputReplacement?: (value: string) => void;
  setFinalizedScript: (value: string) => void;
  language: string;
  setLanguage: (value: string) => void;
  imageStyle: string;
  setImageStyle: (value: string) => void;
  selectedVoice: string;
  setSelectedVoice: (value: string) => void;
  thumbnailHasText: boolean;
  setThumbnailHasText: (value: boolean) => void;
  thumbnailCustomText: string;
  setThumbnailCustomText: (value: string) => void;
  setRewriteScript: (value: boolean) => void;
  setRewriteLengthMode: (value: "source" | "words" | "minutes") => void;
  setRewriteTargetWords: (value: number) => void;
  setRewriteTargetMinutes: (value: number) => void;
  setScenesCount: (value: number) => void;
  setPromptsPerScene: (value: number) => void;
  setUseDialogueSplit: (value: boolean) => void;
  setDialogueGroupSize: (value: number) => void;
  setPromptsFocus: (value: "image" | "video") => void;
  setIsHighDensity: (value: boolean) => void;
  setAutoHookStyle: (value: string) => void;
  isRunning: boolean;
  progress: number;
  logs: string[];
  onRun: () => void;
  onRunStage?: (stage: 1 | 2 | 3 | 4) => void;
  onRunVoiceOnly?: () => void;
  onRunSeoOnly?: () => void;
  onRunThumbnailOnly?: () => void;
  voiceRegenerating?: boolean;
  voiceRegenerateProgress?: number;
  seoRegenerating?: boolean;
  seoRegenerateProgress?: number;
  thumbnailRegenerating?: boolean;
  thumbnailRegenerateProgress?: number;
  onStop: () => void;
  twoStage?: boolean;
  manualStage?: 1 | 2 | 3 | 4;
  reviewReady?: boolean;
  onEditPhaseOne?: () => void;
  reviewScenes?: any[];
  reviewMedia?: Record<string, string>;
  reviewAudioUrl?: string;
  reviewSeo?: any;
  reviewThumbnailUrl?: string;
  onUpdatePrompt?: (
    sceneIndex: number,
    promptIndex: number,
    key: "englishPrompt",
    value: string,
  ) => void;
  onRegenerateMedia?: (sceneIndex: number, promptIndex: number) => void;
  onReloadMedia?: () => Promise<void>;
  regeneratingMediaKey?: string | null;
  onBackStage?: () => void;
  onSelectStage?: (stage: 1 | 2 | 3 | 4) => void;
  stats: { words: number; scenes: number; media: number; totalMedia?: number };
};

const tabs = [
  { id: "input", label: "Nội dung", icon: FileText },
  { id: "scenes", label: "Phong cách & nhân vật", icon: WandSparkles },
  { id: "media", label: "Ảnh / Video", icon: ImageIcon },
  { id: "voice", label: "Giọng đọc", icon: Mic2 },
  { id: "seo", label: "Tiêu đề & Đăng tải", icon: Search },
  { id: "render", label: "Video đầu ra", icon: Clapperboard },
] as const;

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block min-w-0 space-y-2">
    <span className="block text-xs font-extrabold text-slate-700">{label}</span>
    {children}
    {hint && (
      <span className="block text-[11px] leading-relaxed text-slate-500">
        {hint}
      </span>
    )}
  </label>
);
const Select = ({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${className}`}
  />
);
const Input = ({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${className}`}
  />
);
const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => (
  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 accent-indigo-600"
    />
    {label}
  </label>
);

export default function AutomationControlCenter(props: Props) {
  const [inputDraft, setInputDraft] = useState(props.rawInput);
  const [projectDirDraft, setProjectDirDraft] = useState(props.projectDir);
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]["id"]>("input");
  const [selectedReviewSection, setSelectedReviewSection] = useState<
    1 | 2 | 3 | 4 | null
  >(null);
  const [workspaceMode, setWorkspaceMode] = useState<"setup" | "review">(
    "setup",
  );
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [expandedThumbnailUrl, setExpandedThumbnailUrl] = useState("");
  const workflowTopRef = useRef<HTMLDivElement>(null);
  const [runRequest, setRunRequest] = useState(0);
  const [showPresetConfirm, setShowPresetConfirm] = useState(false);
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [remoteConfigHydrated, setRemoteConfigHydrated] = useState(false);
  const [reloadingMedia, setReloadingMedia] = useState(false);
  const [reviewMediaFilter, setReviewMediaFilter] = useState<
    "all" | "image" | "video"
  >("all");
  const handledRunRequestRef = useRef(0);
  const handledReviewReadyRef = useRef(false);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [subtitlePickerOpen, setSubtitlePickerOpen] = useState(false);
  const [config, setConfig] = useState<AutoConfig>(() => {
    try {
      const saved = {
        ...DEFAULT_CONFIG,
        ...JSON.parse(
          localStorage.getItem("automation_full_config_v1") || "{}",
        ),
      } as AutoConfig;
      // Migrate existing installations once from the former centered subtitle
      // default. Users can still deliberately choose middle/top afterwards.
      const subtitleBottomMigrationKey =
        "automation_subtitle_bottom_default_v1";
      if (!localStorage.getItem(subtitleBottomMigrationKey)) {
        saved.subtitlePosition = "bottom";
        localStorage.setItem(subtitleBottomMigrationKey, "1");
      }
      // Migrate only the old product defaults; intentionally selected models
      // remain untouched. New installs and prior Pro/Quality defaults start
      // with the lighter, lower-cost model.
      if (saved.imageEngine === "Nano Banana Pro") {
        saved.imageEngine =
          saved.generationMode === "labs-flow"
            ? "Nano Banana 2 Lite"
            : "3.1 Flash-Lite";
      }
      if (saved.videoEngine === "Veo 3.1 - Quality")
        saved.videoEngine = "Veo 3.1 - Lite";
      // The voice choice is saved independently as well. It survives older
      // configs and prevents the UI from falling back to Zephyr on reload.
      const recentVoice = JSON.parse(
        localStorage.getItem("automation_last_voice_v1") || "null",
      );
      if (recentVoice?.voiceModel) {
        saved.voiceProvider = recentVoice.voiceProvider || saved.voiceProvider;
        saved.voiceModel = recentVoice.voiceModel;
        saved.voiceId = recentVoice.voiceId || "";
        saved.voiceSpeed = recentVoice.voiceSpeed || saved.voiceSpeed;
        saved.voicePitch = recentVoice.voicePitch || saved.voicePitch;
        saved.voiceEmotion = recentVoice.voiceEmotion || saved.voiceEmotion;
      } else {
        // The detailed Premium voice screen stores its last selected voice in
        // this key. Use it here as well so the central automation screen shows
        // the real selection instead of falling back to the Zephyr default.
        const premiumVoice = JSON.parse(
          localStorage.getItem("ai33_selected_voice") || "null",
        );
        if (premiumVoice?.name || premiumVoice?.voice_name) {
          saved.voiceProvider = "premium";
          saved.voiceModel = premiumVoice.name || premiumVoice.voice_name;
          saved.voiceId = premiumVoice.voice_id || premiumVoice.id || "";
        }
      }
      // Apply the new platform default once to existing installations. After
      // this migration the user's deliberate platform choice is preserved.
      if (!localStorage.getItem("automation_api_flow_default_v2")) {
        saved.generationMode = "viettheo-api";
        saved.imageEngine = "NANO_BANANA";
        saved.videoEngine = "Veo 3.1 - Lite";
        localStorage.setItem("automation_api_flow_default_v2", "1");
      }
      // API Flow supports seven concurrent jobs. Migrate existing installations
      // once so the former default of five does not underuse the current plan.
      if (
        saved.generationMode === "viettheo-api" &&
        !localStorage.getItem("automation_api_concurrency_default_v2")
      ) {
        saved.chromeThreads = 7;
        localStorage.setItem("automation_api_concurrency_default_v2", "1");
      }
      const allowedImages: Record<string, string[]> = {
        "gemini-chat": [
          "3.1 Flash-Lite",
          "3.5 Flash",
          "3.1 Pro",
          "Tư duy mở rộng",
        ],
        "labs-flow": ["Nano Banana Pro", "Nano Banana 2", "Nano Banana 2 Lite"],
        "viettheo-api": ["NANO_BANANA_PRO", "NANO_BANANA"],
      };
      if (!allowedImages[saved.generationMode]?.includes(saved.imageEngine))
        saved.imageEngine =
          saved.generationMode === "gemini-chat"
            ? "3.1 Flash-Lite"
            : saved.generationMode === "labs-flow"
              ? "Nano Banana 2 Lite"
              : "NANO_BANANA";
      if (!localStorage.getItem("automation_dialogue_group_default_v2")) {
        saved.dialogueGroupSize = 1;
        localStorage.setItem("automation_dialogue_group_default_v2", "1");
      }
      // Keep the customer's saved media mode. Resetting every reload to image
      // silently breaks dialogue-video projects and makes a reviewed project
      // reopen with a different configuration.
      return saved;
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  // The Trial entitlement includes the managed Flow API. On a fresh Trial
  // setup, choose that route by default; after the user deliberately changes
  // platform we retain their choice instead of forcing it back on every open.
  useEffect(() => {
    if (localStorage.getItem("automation_trial_flow_default_v1")) return;
    let disposed = false;
    void fetch("/api/license/status")
      .then(async (response) => response.ok ? response.json() : null)
      .then((license) => {
        if (disposed || !license?.active || license?.plan !== "trial") return;
        setConfig((previous) => ({
          ...previous,
          generationMode: "viettheo-api",
          imageEngine: "NANO_BANANA",
          videoEngine: "Veo 3.1 - Lite",
          chromeThreads: 7,
        }));
        localStorage.setItem("automation_trial_flow_default_v1", "1");
      })
      .catch(() => {});
    return () => { disposed = true; };
  }, []);
  const [referenceImages, setReferenceImages] = useState<string[]>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("cc_visualConfig_v2") || "{}")
          .globalReferenceImages || []
      ).filter(
        (value: unknown) =>
          typeof value === "string" && !value.startsWith("data:"),
      );
    } catch {
      return [];
    }
  });
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("custom_image_styles_v1") || "[]");
    } catch {
      return [];
    }
  });
  const [styleLibraryHydrated, setStyleLibraryHydrated] = useState(false);
  const [characterProfiles, setCharacterProfiles] = useState<
    CharacterProfile[]
  >(() => {
    try {
      return JSON.parse(
        localStorage.getItem("channel_character_profiles_v1") || "[]",
      );
    } catch {
      return [];
    }
  });
  const [editingCharacterProfile, setEditingCharacterProfile] =
    useState<CharacterProfile | null>(null);
  const [characterGuideOpen, setCharacterGuideOpen] = useState(false);
  const [isGeneratingCharacterProfile, setIsGeneratingCharacterProfile] =
    useState(false);
  const [editingStyle, setEditingStyle] = useState<CustomStyle | null>(null);
  const styleEditorRef = useRef<HTMLDivElement>(null);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [externalVoiceUrl, setExternalVoiceUrl] = useState("");
  const [externalVoiceName, setExternalVoiceName] = useState("");
  const [voiceLibraryOpen, setVoiceLibraryOpen] = useState(false);
  const [previewingFreeVoice, setPreviewingFreeVoice] = useState(false);

  useEffect(() => {
    setInputDraft(props.rawInput);
  }, [props.rawInput]);
  useEffect(() => {
    setProjectDirDraft(props.projectDir);
  }, [props.projectDir]);
  const freeSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const update = <K extends keyof AutoConfig>(key: K, value: AutoConfig[K]) =>
    setConfig((previous) => ({ ...previous, [key]: value }));

  useEffect(() => {
    if (!props.configRevision) return;
    try {
      const next = JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}");
      if (next && typeof next === "object") {
        if (
          next.generationMode === "viettheo-api" &&
          (!Number.isFinite(Number(next.chromeThreads)) || Number(next.chromeThreads) <= 1)
        ) next.chromeThreads = 7;
        setConfig(previous => ({ ...previous, ...next }));
      }
    } catch {}
  }, [props.configRevision]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    let disposed = false;
    void fetch("/api/config/automation-default")
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (disposed || !payload?.config || !Object.keys(payload.config).length) return;
        const remoteConfig = { ...payload.config };
        if (
          remoteConfig.generationMode === "viettheo-api" &&
          (!Number.isFinite(Number(remoteConfig.chromeThreads)) || Number(remoteConfig.chromeThreads) <= 1)
        ) remoteConfig.chromeThreads = 7;
        setConfig((previous) => ({ ...previous, ...remoteConfig }));
      })
      .catch(() => {})
      .finally(() => {
        if (!disposed) setRemoteConfigHydrated(true);
      });
    return () => { disposed = true; };
  }, []);

  useLayoutEffect(() => {
    localStorage.setItem("automation_full_config_v1", JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("automationConfigUpdated", { detail: config }));
    const syncTimer = remoteConfigHydrated
      ? window.setTimeout(() => {
          void fetch("/api/config/automation-default", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ config }),
          }).catch(() => {});
        }, 250)
      : undefined;
    localStorage.setItem(
      "automation_last_voice_v1",
      JSON.stringify({
        voiceProvider: config.voiceProvider,
        voiceModel: config.voiceModel,
        voiceId: config.voiceId,
        voiceSpeed: config.voiceSpeed,
        voicePitch: config.voicePitch,
        voiceEmotion: config.voiceEmotion,
      }),
    );
    let visual: any = {};
    try {
      visual = JSON.parse(localStorage.getItem("cc_visualConfig_v2") || "{}");
    } catch {}
    // Never carry forward legacy data-URL images. They can be several MB and
    // make localStorage throw QuotaExceededError before the upload finishes.
    const {
      globalReferenceImage: legacyReferenceImage,
      globalReferenceImages: legacyReferenceImages,
      ...visualWithoutReferences
    } = visual;
    const sharedVisualConfig = {
      ...visualWithoutReferences,
      generateType: config.generateType,
      generationMode: config.generationMode,
      aspectRatio: config.aspectRatio,
      imageGeneratorEngine:
        config.generateType === "video"
          ? config.videoEngine
          : config.imageEngine,
      viettheoVideoQuality: config.viettheoVideoQuality,
      videoDuration: config.videoDuration || "10s",
      fallbackFailedVideosToImages: config.fallbackFailedVideosToImages,
      lockedKeyframesPipeline: config.lockedKeyframesPipeline,
      chromeHeadless: config.chromeHeadless,
      threadCount: config.chromeThreads,
      tabsPerChrome: config.tabsPerChrome,
      noText: config.noText,
      noBlackBorder: config.noBlackBorder,
      noWallPicture: config.noWallPicture,
      removeAiWatermark: config.removeAiWatermark,
      watermarkBackend: config.watermarkBackend,
      dialogueVideoMode: config.dialogueVideoMode,
      keepVideoAudio: config.keepVideoAudio,
      characterBible: config.characterBible,
      dialogueVoiceGuide: config.dialogueVoiceGuide,
      clipTransition: config.clipTransition,
      renderSource: config.renderSource,
      resolution: config.resolution,
      motionEnabled: config.motionEnabled,
      motionStyle: config.motionStyle,
      motionIntensity: config.motionIntensity,
      subtitleEnabled: config.subtitleEnabled,
      subtitleStyle: config.subtitleStyle,
      subtitlePosition: config.subtitlePosition,
      backgroundMusicEnabled: config.backgroundMusicEnabled,
      backgroundMusicMode: config.backgroundMusicMode,
      backgroundMusicPath: config.backgroundMusicPath,
      backgroundMusicFolder: config.backgroundMusicFolder,
      backgroundMusicVolume: config.backgroundMusicVolume,
      watermarkType: config.watermarkType,
      watermarkPath: config.watermarkPath,
      watermarkText: config.watermarkText,
      watermarkPosition: config.watermarkPosition,
      globalReferenceImages: config.useReferenceImages
        ? referenceImages.filter((value) => !value.startsWith("data:"))
        : [],
      globalReferenceImage: config.useReferenceImages
        ? referenceImages.find((value) => !value.startsWith("data:")) || null
        : null,
      characterReferenceProfiles: characterProfiles
        .filter((profile) =>
          config.characterProfileId.split(",").includes(profile.id),
        )
        .map((profile, index) => ({
          id: characterCode(
            profile,
            characterProfiles.findIndex((item) => item.id === profile.id),
          ),
          name: profile.name,
          aliases: profile.aliases || "",
          referenceImages: (profile.referenceImages || []).filter(
            (value) => value && !value.startsWith("data:"),
          ),
        })),
    };
    try {
      localStorage.setItem(
        "cc_visualConfig_v2",
        JSON.stringify(sharedVisualConfig),
      );
    } catch {
      // A previous version may already have filled this key with base64 image
      // data. Replacing that single key is safe and keeps the actual files in
      // the project folder intact.
      localStorage.removeItem("cc_visualConfig_v2");
      localStorage.setItem(
        "cc_visualConfig_v2",
        JSON.stringify(sharedVisualConfig),
      );
    }
    // The automatic creator is the central controller. Individual steps listen
    // to this event and immediately use the exact same setup, without copying
    // a second configuration by hand.
    window.dispatchEvent(
      new CustomEvent("automation-visual-config-changed", {
        detail: sharedVisualConfig,
      }),
    );
    return () => {
      if (syncTimer !== undefined) window.clearTimeout(syncTimer);
    };
  }, [config, referenceImages, characterProfiles, remoteConfigHydrated]);
  useEffect(() => {
    let disposed = false;
    void fetch("/api/config/style-library")
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (disposed) return;
        const remoteStyles: CustomStyle[] = Array.isArray(payload?.customStyles)
          ? payload.customStyles
          : [];
        setCustomStyles((localStyles) => {
          const merged = new Map<string, CustomStyle>();
          remoteStyles.forEach((style) => {
            if (style?.prompt) merged.set(String(style.id || style.prompt), style);
          });
          // First launch after this update migrates any surviving browser data
          // into the durable library. Local edits win when IDs overlap.
          localStyles.forEach((style) => {
            if (style?.prompt) merged.set(String(style.id || style.prompt), style);
          });
          return [...merged.values()];
        });
        setStyleLibraryHydrated(true);
      })
      .catch(() => setStyleLibraryHydrated(true));
    return () => { disposed = true; };
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "custom_image_styles_v1",
      JSON.stringify(customStyles),
    );
    if (styleLibraryHydrated) {
      void fetch("/api/config/style-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customStyles }),
      }).catch(() => {});
    }
  }, [customStyles, styleLibraryHydrated]);
  useEffect(() => {
    localStorage.setItem(
      "channel_character_profiles_v1",
      JSON.stringify(characterProfiles),
    );
  }, [characterProfiles]);

  useEffect(() => {
    // Exact preservation only applies while retaining the source length.
    // A word/time target still needs AI to resize the script while preserving
    // its original meaning.
    const shouldRewrite =
      config.rewriteLengthMode !== "source" ||
      (!config.preserveOriginalScript && config.rewriteLevel !== "original");
    props.setRewriteScript(shouldRewrite);
    props.setRewriteLengthMode(config.rewriteLengthMode);
    props.setRewriteTargetWords(config.rewriteTargetWords);
    props.setRewriteTargetMinutes(config.rewriteTargetMinutes);
    props.setScenesCount(config.sceneCount);
    props.setPromptsPerScene(config.promptsPerScene);
    props.setUseDialogueSplit(config.sceneMode === "dialogue");
    props.setDialogueGroupSize(config.dialogueGroupSize);
    props.setPromptsFocus(config.promptFocus as "image" | "video");
    props.setIsHighDensity(config.highDensity);
    props.setAutoHookStyle(config.hookEnabled ? config.hookStyle : "none");
  }, [
    config.preserveOriginalScript,
    config.rewriteLevel,
    config.rewriteLengthMode,
    config.rewriteTargetWords,
    config.rewriteTargetMinutes,
    config.hookEnabled,
    config.hookStyle,
    config.sceneCount,
    config.promptsPerScene,
    config.sceneMode,
    config.dialogueGroupSize,
    config.promptFocus,
    config.highDensity,
  ]);

  // Mục tiêu prompt ở phần phong cách là nguồn xác định loại media cần tạo.
  // Không để người dùng chọn "Tạo video" nhưng phía dưới lại âm thầm tạo ảnh.
  useEffect(() => {
    const intendedType = config.promptFocus === "video" ? "video" : "image";
    if (config.generateType !== intendedType)
      update("generateType", intendedType);
  }, [config.promptFocus]);

  // The automation setup owns its Premium voice. Do not let the legacy app
  // default (Zephyr) overwrite a restored selection when a tab remounts.
  useEffect(() => {
    if (
      config.voiceProvider === "premium" &&
      config.voiceModel &&
      config.voiceModel !== props.selectedVoice
    ) {
      props.setSelectedVoice(config.voiceModel);
    }
  }, [
    config.voiceProvider,
    config.voiceModel,
    props.selectedVoice,
    props.setSelectedVoice,
  ]);

  const completion = useMemo(() => {
    const checks = [
      !!props.rawInput.trim(),
      !!props.projectDir,
      !!props.imageStyle.trim(),
      !!config.voiceModel,
      !!config.aspectRatio,
      !!config.resolution,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [props.rawInput, props.projectDir, props.imageStyle, config]);
  const pipelineFinished =
    !props.isRunning &&
    props.logs.some((log) =>
      log.includes("Render video hoàn chỉnh thành công."),
    );
  const manualStage = props.manualStage || 1;
  // Keep every completed section available for inspection. The current stage
  // still determines what the primary Run button will execute; selecting an
  // older tab never restarts its work.
  const visibleTabs = props.twoStage
    ? tabs.filter((tab) =>
        manualStage === 1
          ? tab.id === "input"
          : manualStage === 2
            ? ["input", "scenes", "media"].includes(tab.id)
            : manualStage === 3
              ? ["input", "scenes", "media", "voice", "seo"].includes(tab.id)
              : true,
      )
    : tabs;
  const stageNames = [
    "",
    "Nội dung & kịch bản",
    "Phong cách, phân cảnh & media",
    "Voice, SEO & thumbnail",
    "Render video cuối",
  ];
  const stageActions = [
    "",
    "TẠO KỊCH BẢN ĐỂ REVIEW",
    "TẠO PHÂN CẢNH & MEDIA",
    "TẠO VOICE, SEO & THUMBNAIL",
    "RENDER VIDEO FINAL",
  ];
  // The review drawer should never consume setup space for a new project.
  // Once any stage has produced real output it remains available, even while
  // the customer configures a later stage.
  const hasReviewableOutput = Boolean(
    props.finalizedScript.trim() ||
    (props.reviewScenes?.length || 0) > 0 ||
    Object.keys(props.reviewMedia || {}).length > 0 ||
    props.reviewAudioUrl ||
    props.reviewSeo ||
    pipelineFinished,
  );
  const plannedMediaKeys = useMemo(
    () =>
      (props.reviewScenes || []).flatMap((scene: any, sceneIndex: number) =>
        (scene.imagePrompts || []).map((prompt: any, promptIndex: number) =>
          String(
            prompt.code ||
              `scene-${scene.sceneNumber || sceneIndex + 1}-${promptIndex + 1}`,
          ),
        ),
      ),
    [props.reviewScenes],
  );
  const completedMediaCount = useMemo(() => {
    const availableMedia = props.reviewMedia || {};
    if (!plannedMediaKeys.length) return Object.keys(availableMedia).length;
    return plannedMediaKeys.filter((mediaKey) => Boolean(availableMedia[mediaKey]))
      .length;
  }, [plannedMediaKeys, props.reviewMedia]);
  // Keep the denominator equal to the complete prompt plan. reviewMedia grows
  // one item at a time while a batch is still running.
  const totalMediaCount =
    plannedMediaKeys.length || props.stats.totalMedia || props.stats.media;

  // Follow the pipeline only when it actually advances to another stage.
  // Setup navigation must remain under the user's control while a stage is
  // running; review state changes must not force the selected setup tab back.
  useEffect(() => {
    if (!props.twoStage) return;
    // Changing the active pipeline stage must not force the user out of
    // Review mode. Review has its own selectedReviewSection state and only
    // the explicit "Quay lại Setup" button may switch workspace modes.
    if (workspaceMode !== "setup") return;
    setActiveTab(
      manualStage === 1
        ? "input"
        : manualStage === 2
          ? "scenes"
          : manualStage === 3
            ? "voice"
            : "render",
    );
  }, [props.twoStage, manualStage, workspaceMode]);

  useEffect(() => {
    if (!props.twoStage) return;
    if (!props.reviewReady) {
      handledReviewReadyRef.current = false;
      return;
    }
    if (handledReviewReadyRef.current) return;
    handledReviewReadyRef.current = true;
    setSelectedReviewSection(Math.max(1, manualStage - 1) as 1 | 2 | 3 | 4);
    setWorkspaceMode("review");
  }, [props.twoStage, manualStage, props.reviewReady]);

  // Trigger the expensive pipeline after React has committed the button click.
  // This avoids a stale callback while changing manual stages/review cards.
  useEffect(() => {
    if (!runRequest || handledRunRequestRef.current === runRequest) return;
    handledRunRequestRef.current = runRequest;
    if (props.twoStage && props.onRunStage) props.onRunStage(manualStage);
    else props.onRun();
  }, [runRequest]);

  useEffect(() => {
    if (props.isRunning) {
      setIsStartingRun(false);
      return;
    }
    if (!isStartingRun) return;
    const timeout = window.setTimeout(() => setIsStartingRun(false), 12000);
    return () => window.clearTimeout(timeout);
  }, [isStartingRun, props.isRunning]);

  const uploadReferences = async (files: FileList | null) => {
    if (!files) return;
    for (const [index, file] of Array.from(files)
      .slice(0, Math.max(0, 3 - referenceImages.length))
      .entries()) {
      if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024)
        return;
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Không thể đọc ảnh"));
        reader.onerror = () =>
          reject(reader.error || new Error("Không thể đọc ảnh"));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/upload-reference-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData,
          fileName: file.name,
          projectDir: props.projectDir,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.url)
        throw new Error(data.error || "Không thể lưu ảnh tham chiếu");
      setReferenceImages((items) => [...items, data.url].slice(0, 3));
      // Uploading a reference means the user intends it to be applied to all
      // downstream work (images, videos and voice-related prompt planning).
      update("useReferenceImages", true);

      // The first reference is also read before storyboard generation. Its
      // visual description becomes a reusable character lock in every prompt;
      // the original file remains attached later during media generation.
      if (referenceImages.length === 0 && index === 0) {
        void fetch("/api/analyze-character", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageData }),
        })
          .then(async (result) => ({
            ok: result.ok,
            data: await result.json(),
          }))
          .then(({ ok, data }) => {
            if (!ok || !data?.characterDescription) return;
            setConfig((current) => ({
              ...current,
              // A newly uploaded shared reference owns the identity lock when
              // no saved profile is selected. Otherwise a stale character
              // bible from the previous project can introduce unrelated cast.
              characterBible:
                String(current.characterProfileId || "").trim() && current.characterBible.trim()
                  ? current.characterBible
                  : `REFERENCE CHARACTER LOCK: ${data.characterDescription}`,
            }));
          })
          .catch(() => {
            /* Upload remains valid even if optional AI analysis is unavailable. */
          });
      }
    }
  };
  const uploadCharacterReferences = async (files: FileList | null) => {
    if (!files || !editingCharacterProfile) return;
    const currentImages = editingCharacterProfile.referenceImages || [];
    const selectedFiles = Array.from(files).slice(
      0,
      Math.max(0, 3 - currentImages.length),
    );
    const savedUrls: string[] = [];
    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        window.alert("Hãy chỉ chọn file ảnh hợp lệ.");
        continue;
      }
      if (file.size > 4 * 1024 * 1024) {
        window.alert("Mỗi ảnh nhân vật phải nhỏ hơn 4 MB.");
        continue;
      }
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Không thể đọc ảnh"));
        reader.onerror = () =>
          reject(reader.error || new Error("Không thể đọc ảnh"));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/upload-reference-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData,
          fileName: file.name,
          projectDir: props.projectDir,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.url) {
        window.alert(data.error || "Không thể lưu ảnh nhân vật.");
        continue;
      }
      savedUrls.push(data.url);
    }
    if (savedUrls.length) {
      setEditingCharacterProfile((current) =>
        current
          ? {
              ...current,
              referenceImages: [
                ...(current.referenceImages || []),
                ...savedUrls,
              ].slice(0, 3),
            }
          : current,
      );
    }
  };
  const uploadStyleDemo = async (input: File | FileList | null | undefined) => {
    const files =
      (input instanceof FileList ? Array.from(input) : input ? [input] : []).slice(0, 3);
    if (!files.length) return;
    if (files.some((file) => !file.type.startsWith("image/"))) {
      window.alert("Hãy chỉ chọn file ảnh hợp lệ.");
      return;
    }
    if (files.some((file) => file.size > 4 * 1024 * 1024)) {
      window.alert("Mỗi ảnh demo phải nhỏ hơn 4 MB.");
      return;
    }
    const imageDataList = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Không thể đọc ảnh."));
      reader.onerror = () => reject(new Error("Không thể đọc ảnh."));
      reader.readAsDataURL(file);
    })));
    const file = files[0];
    const imageData = imageDataList[0];
    setIsAnalyzingStyle(true);
    try {
      const [saveResponse, analysisResponse] = await Promise.all([
        fetch("/api/upload-reference-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageData,
            fileName: file.name,
            projectDir: props.projectDir,
          }),
        }),
        fetch("/api/analyze-style-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: imageDataList }),
        }),
      ]);
      const saved = await saveResponse.json();
      const analysis = await analysisResponse.json();
      if (!saveResponse.ok || !saved?.url)
        throw new Error(saved?.error || "Không thể lưu ảnh demo.");
      if (!analysisResponse.ok || !analysis?.prompt)
        throw new Error(
          analysis?.error || "AI chưa phân tích được phong cách ảnh.",
        );
      setEditingStyle((current) =>
        current
          ? {
              ...current,
              previewImage: saved.url,
              name: current.name.trim() || analysis.name,
              desc: current.desc.trim() || analysis.description,
              prompt: current.prompt.trim() || analysis.prompt,
            }
          : {
              id: `custom-${Date.now()}`,
              previewImage: saved.url,
              name: analysis.name || "Phong cách mới",
              desc: analysis.description || "",
              prompt: analysis.prompt || "",
            },
      );
    } catch (error: any) {
      window.alert(error?.message || "Không thể phân tích phong cách từ ảnh.");
    } finally {
      setIsAnalyzingStyle(false);
    }
  };
  const uploadStylePreview = async (input: File | FileList | null | undefined) => {
    const file = input instanceof FileList ? input.item(0) : input;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("Hãy chỉ chọn file ảnh hợp lệ.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      window.alert("Ảnh preview phải nhỏ hơn 4 MB.");
      return;
    }
    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Không thể đọc ảnh."));
        reader.onerror = () => reject(new Error("Không thể đọc ảnh."));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/upload-reference-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData,
          fileName: file.name,
          projectDir: props.projectDir,
        }),
      });
      const saved = await response.json();
      if (!response.ok || !saved?.url)
        throw new Error(saved?.error || "Không thể lưu ảnh preview.");
      setEditingStyle((current) =>
        current ? { ...current, previewImage: saved.url } : current,
      );
    } catch (error: any) {
      window.alert(error?.message || "Không thể dùng ảnh này làm preview.");
    }
  };
  const generateStyleDemo = async () => {
    if (!editingStyle?.prompt.trim()) return;
    setIsCreatingDemo(true);
    try {
      const visualConfig = {
        generationMode: config.generationMode,
        generateType: "Image",
        aspectRatio: "16:9",
        imageGeneratorEngine: config.imageEngine,
        chromeHeadless: config.chromeHeadless,
      };
      const response = await fetch("/api/pipeline/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${editingStyle.prompt}, 16:9`,
          style: editingStyle.prompt,
          bypassCache: true,
          visualConfig,
        }),
      });
      const data = await response.json();
      if (data.success && data.fallbackUrl)
        setEditingStyle((current) =>
          current ? { ...current, previewImage: data.fallbackUrl } : current,
        );
    } finally {
      setIsCreatingDemo(false);
    }
  };
  const saveStyle = () => {
    if (!editingStyle?.name.trim() || !editingStyle.prompt.trim()) return;
    setCustomStyles((items) =>
      items.some((item) => item.id === editingStyle.id)
        ? items.map((item) =>
            item.id === editingStyle.id ? editingStyle : item,
          )
        : [...items, editingStyle],
    );
    setEditingStyle(null);
  };
  const copyExternalVoiceScript = async () => {
    const script = (props.finalizedScript || props.rawInput).trim();
    if (!script) {
      window.alert(
        "Hãy chuẩn hóa hoặc nhập kịch bản trước khi lấy bản đọc voice.",
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(script);
      window.alert(
        "Đã copy đúng kịch bản hiện tại. Dùng nguyên văn bản này để tạo voice bên ngoài, sau đó tải file voice về đây.",
      );
    } catch {
      void vidiflowPrompt(
        "Sao chép nguyên văn kịch bản này để tạo voice bên ngoài:",
        script,
        { title: "Sao chép kịch bản voice" },
      );
    }
  };
  const uploadExternalVoice = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(mp3|wav|m4a|aac|ogg|flac|opus|wma)$/i.test(file.name)) {
      window.alert("Hãy chọn file audio (MP3, WAV, M4A...).");
      return;
    }
    if (!props.projectDir.trim()) {
      window.alert("Hãy chọn thư mục dự án trước khi tải voice.");
      return;
    }
    if (file.size > 150 * 1024 * 1024) {
      window.alert("File voice phải nhỏ hơn 150 MB.");
      return;
    }
    try {
      const query = new URLSearchParams({
        projectDir: props.projectDir,
        fileName: file.name,
      });
      const response = await fetch(`/api/upload-external-voice?${query.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });
      const data = await response.json();
      if (!response.ok || !data?.url)
        throw new Error(data?.error || "Không thể lưu voice.");
      setExternalVoiceUrl(data.url);
      setExternalVoiceName(file.name);
      update("voiceProvider", "external");
      update("voiceModel", "Voice đã tải lên");
      update("voiceId", "");
      props.setSelectedVoice("Voice đã tải lên");
    } catch (error: any) {
      window.alert(error?.message || "Không thể tải voice lên.");
    }
  };
  const openNewStyle = () => {
    setEditingStyle({
      id: `custom-${Date.now()}`,
      name: "",
      desc: "",
      prompt: "",
    });
    window.setTimeout(
      () =>
        styleEditorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      0,
    );
  };
  const chooseCharacterProfile = (profileId: string) => {
    const currentIds = config.characterProfileId
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const nextIds = profileId
      ? Array.from(new Set([...currentIds, profileId]))
      : [];
    setConfig((previous) => ({
      ...previous,
      characterProfileId: nextIds.join(","),
      characterBible: buildCharacterLock(characterProfiles, nextIds),
    }));
  };
  const removeCharacterProfileFromVideo = (profileId: string) => {
    const nextIds = config.characterProfileId
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value && value !== profileId);
    setConfig((previous) => ({
      ...previous,
      characterProfileId: nextIds.join(","),
      characterBible: buildCharacterLock(characterProfiles, nextIds),
    }));
  };
  const saveCharacterProfile = () => {
    if (
      !editingCharacterProfile?.name.trim() ||
      !editingCharacterProfile.description.trim()
    )
      return;
    const profile = {
      ...editingCharacterProfile,
      name: editingCharacterProfile.name.trim(),
      aliases: editingCharacterProfile.aliases?.trim() || "",
      description: editingCharacterProfile.description.trim(),
      updatedAt: new Date().toISOString(),
    };
    const nextProfiles = characterProfiles.some((item) => item.id === profile.id)
      ? characterProfiles.map((item) => (item.id === profile.id ? profile : item))
      : [...characterProfiles, profile];
    setCharacterProfiles(
      nextProfiles,
    );
    const selectedIds = Array.from(new Set([
      ...config.characterProfileId.split(",").map((value) => value.trim()).filter(Boolean),
      profile.id,
    ]));
    setConfig((previous) => ({
      ...previous,
      characterProfileId: selectedIds.join(","),
      characterBible: buildCharacterLock(nextProfiles, selectedIds),
    }));
    setEditingCharacterProfile(null);
  };
  const generateCharacterProfileFromScript = async () => {
    if (!props.rawInput.trim()) {
      window.alert(
        "Hãy nhập hoặc bóc tách kịch bản trước khi để AI tạo hồ sơ nhân vật.",
      );
      return;
    }
    setIsGeneratingCharacterProfile(true);
    try {
      const response = await fetch("/api/generate-character-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: props.rawInput }),
      });
      const data = await response.json();
      if (!response.ok || !data?.description)
        throw new Error(data?.error || "AI chưa tạo được hồ sơ nhân vật.");
      setEditingCharacterProfile({
        id: `CHAR_${String(characterProfiles.length + 1).padStart(2, "0")}_${Date.now()}`,
        name: "Hồ sơ nhân vật mới",
        aliases: "",
        description: data.description,
        referenceImages: [],
        updatedAt: "",
      });
    } catch (error: any) {
      window.alert(error?.message || "Không thể tạo hồ sơ nhân vật.");
    } finally {
      setIsGeneratingCharacterProfile(false);
    }
  };
  // Thêm version để trình duyệt không giữ ảnh preview cũ sau khi thay ảnh demo.
  // Phong cách tự thêm luôn được đặt trước kho có sẵn để khách nhìn thấy và
  // chọn ngay prompt phong cách riêng của kênh.
  const allStyleChoices = [
    // User-added styles are deliberately first. The full prompt remains in
    // the editable style form and is applied to every generated scene, rather
    // than overflowing the compact gallery card.
    ...customStyles.map((style) => ({ ...style, builtIn: false })),
    ...IMAGE_STYLES.map((style, index) => ({
      ...style,
      id: `built-in-${index}`,
      previewImage: `/style-demos/${STYLE_DEMO_FILES[index]}?v=20260718-2`,
      builtIn: true,
    })),
  ];
  // The full library is available in the compact selector. Avoid rendering a
  // second card gallery here: it made the setup screen visually overwhelming.
  // Keep the preview gallery explicitly collapsible; the compact select above
  // always remains available for choosing a style without opening the gallery.
  const styleChoices = stylePickerOpen ? allStyleChoices : [];
  const applyStyle = (prompt: string) => {
    props.setImageStyle(prompt);
    // Keep the visible selection and the persisted selection synchronized.
    try {
      window.localStorage.setItem("imageStyle", prompt);
    } catch {
      /* optional */
    }
  };
  const workflowStep =
    activeTab === "input"
      ? 1
      : activeTab === "scenes" || activeTab === "media"
        ? 2
        : activeTab === "voice" || activeTab === "seo"
          ? 3
          : 4;
  const actionStep =
    workspaceMode === "review" && selectedReviewSection
      ? selectedReviewSection
      : workflowStep;
  const dialogueAudioReady = Boolean(
    config.dialogueVideoMode && config.keepVideoAudio,
  );
  const workflowSteps = [
    {
      id: 1,
      label: "Nội dung & kịch bản",
      tab: "input" as const,
      complete: !!props.finalizedScript.trim(),
    },
    {
      id: 2,
      label: "Phong cách, phân cảnh & media",
      tab: "scenes" as const,
      complete: Boolean(
        props.imageStyle.trim() &&
        (props.reviewScenes?.length || 0) > 0 &&
        totalMediaCount > 0 &&
        completedMediaCount > 0,
      ),
    },
    {
      id: 3,
      label: "Voice, SEO & thumbnail",
      tab: "voice" as const,
      complete: Boolean(
        (props.reviewAudioUrl || dialogueAudioReady) && props.reviewSeo,
      ),
    },
    {
      id: 4,
      label: "Render video cuối",
      tab: "render" as const,
      complete: pipelineFinished,
    },
  ];
  const workflowStepReady = (step: number) => {
    if (step === 1) {
      return Boolean(props.projectDir.trim() && props.finalizedScript.trim());
    }
    return Boolean(workflowSteps[step - 1]?.complete);
  };
  const canContinueManual = !props.twoStage
    ? true
    : workflowStep === 1
      ? workflowStepReady(1)
      : workflowStep === 2
        ? activeTab === "scenes" || workflowStepReady(2)
        : workflowStep === 3
          ? activeTab === "voice"
            ? Boolean(props.reviewAudioUrl || dialogueAudioReady)
            : workflowStepReady(3)
          : false;
  const hasAllPlannedMedia =
    totalMediaCount > 0 && completedMediaCount >= totalMediaCount;
  const canRunCurrentStage = props.twoStage
    ? actionStep === 1
      ? Boolean(props.projectDir.trim() && props.rawInput.trim())
      : actionStep === 2
        ? Boolean(
            props.projectDir.trim() &&
              props.finalizedScript.trim() &&
              props.imageStyle.trim(),
          )
        : actionStep === 3
          ? Boolean(
              props.projectDir.trim() &&
                props.finalizedScript.trim() &&
                (props.reviewScenes?.length || 0) > 0,
            )
          : Boolean(
              props.projectDir.trim() &&
                props.finalizedScript.trim() &&
                hasAllPlannedMedia &&
                (props.reviewAudioUrl || dialogueAudioReady) &&
                props.reviewSeo,
            )
    : Boolean(props.projectDir.trim() && props.rawInput.trim());
  const goToWorkflowStep = (step: number, allowAdvance = false) => {
    const target = workflowSteps.find((item) => item.id === step);
    if (!target) return;
    if (
      props.twoStage &&
      step > manualStage &&
      (!allowAdvance || step !== manualStage + 1 || !workflowStepReady(manualStage))
    ) {
      return;
    }
    if (workspaceMode === "review") {
      setSelectedReviewSection(step as 1 | 2 | 3 | 4);
      window.setTimeout(
        () =>
          workflowTopRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        0,
      );
      return;
    }
    setWorkspaceMode("setup");
    setSelectedReviewSection(null);
    props.onSelectStage?.(step as 1 | 2 | 3 | 4);
    setActiveTab(target.tab);
    window.setTimeout(
      () =>
        workflowTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      0,
    );
  };

  if (props.presetMode) {
    const selectedProfileIds = config.characterProfileId.split(",").filter(Boolean);
    const referenceReady =
      !config.useReferenceImages ||
      referenceImages.length > 0 ||
      selectedProfileIds.length > 0;
    const ready = Boolean(
      props.projectDir.trim() && inputDraft.trim() && referenceReady,
    );
    return (
      <div className="space-y-5">
        {props.isRunning && (
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-indigo-900">Đang tạo video theo preset</p><p className="mt-1 text-[11px] text-indigo-700">{props.logs.at(-1) || "Đang chuẩn bị dữ liệu..."}</p></div><span className="text-xl font-black text-indigo-700">{Math.round(props.progress)}%</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 transition-all" style={{ width: `${props.progress}%` }} /></div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4"><p className="text-sm font-black text-slate-900">1. Dữ liệu bắt buộc</p><p className="mt-1 text-[11px] text-slate-500">Preset đã lo toàn bộ thông số kỹ thuật. Chỉ nhập nguồn nội dung và thư mục lưu.</p></div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Loại đầu vào">
              <Select value={config.inputType} disabled={props.isRunning} onChange={(event) => update("inputType", event.target.value as AutoConfig["inputType"])}>
                <option value="script">Kịch bản có sẵn</option><option value="idea">Ý tưởng / mô tả</option><option value="link">Link YouTube / TikTok / Facebook</option>
              </Select>
            </Field>
            <Field label="Ngôn ngữ">
              <Select value={props.language} disabled={props.isRunning} onChange={(event) => props.setLanguage(event.target.value)}>
                <option value="vi">Tiếng Việt</option><option value="en">Tiếng Anh</option><option value="original">Giữ nguyên ngôn ngữ gốc</option>
              </Select>
            </Field>
          </div>
          <div className="mt-3">
            <Field label={config.inputType === "link" ? "Link video" : config.inputType === "idea" ? "Mô tả ý tưởng video" : "Nội dung kịch bản"}>
              <textarea value={inputDraft} disabled={props.isRunning} onChange={(event) => setInputDraft(event.target.value)} onBlur={() => { if (inputDraft !== props.rawInput) (props.onRequestInputReplacement || props.setRawInput)(inputDraft); }} rows={6} placeholder={config.inputType === "link" ? "Dán link video..." : config.inputType === "idea" ? "Mô tả chủ đề, thông điệp và nội dung mong muốn..." : "Dán toàn bộ kịch bản..."} className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60" />
            </Field>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={projectDirDraft}
              disabled={props.isRunning}
              placeholder="Chọn thư mục trống để lưu dự án mới..."
              onChange={(event) => setProjectDirDraft(event.target.value)}
              onBlur={() => {
                if (projectDirDraft.trim() !== props.projectDir.trim())
                  void props.onProjectDirChange(projectDirDraft);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (projectDirDraft.trim() !== props.projectDir.trim())
                  void props.onProjectDirChange(projectDirDraft);
                event.currentTarget.blur();
              }}
            />
            <button type="button" disabled={props.isRunning} onClick={async () => { const response = await fetch("/api/dialog/pick?mode=dir&title=Ch%E1%BB%8Dn%20Th%C6%B0%20M%E1%BB%A5c%20D%E1%BB%B1%20%C3%81n"); const data = await response.json(); if (data.success && data.path) await props.onProjectDirChange(data.path); }} className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">Chọn thư mục dự án</button>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="mb-4"><p className="text-sm font-black text-slate-900">2. Nhân vật & ảnh tham chiếu <span className={`text-xs font-semibold ${config.useReferenceImages ? "text-amber-700" : "text-slate-400"}`}>{config.useReferenceImages ? "(bắt buộc với preset này)" : "(không bắt buộc)"}</span></p><p className="mt-1 text-[11px] text-slate-500">Chọn hồ sơ đã lưu hoặc tải ảnh dùng chung. Không có nhân vật cố định thì bỏ qua phần này.</p></div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <Select value="" disabled={props.isRunning} onChange={(event) => chooseCharacterProfile(event.target.value)}><option value="">Chọn hồ sơ nhân vật đã lưu...</option>{characterProfiles.filter((profile) => !selectedProfileIds.includes(profile.id)).map((profile, index) => <option key={profile.id} value={profile.id}>{characterCode(profile, index)} · {profile.name}</option>)}</Select>
            <button type="button" disabled={!selectedProfileIds.length || props.isRunning} onClick={() => chooseCharacterProfile("")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 disabled:opacity-40">Bỏ chọn hồ sơ</button>
          </div>
          {selectedProfileIds.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{selectedProfileIds.map((id) => { const profile = characterProfiles.find((item) => item.id === id); return profile ? <span key={id} className="rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black text-emerald-700">{profile.name} · {(profile.referenceImages || []).length} ảnh</span> : null; })}</div>}
          <div className="mt-4 flex flex-wrap gap-3">
            {referenceImages.map((src, index) => <div key={`${src}-${index}`} className="relative h-24 w-20 overflow-hidden rounded-xl border border-amber-200 bg-white"><img src={src} alt={`Ảnh tham chiếu ${index + 1}`} className="h-full w-full object-cover" /><button type="button" disabled={props.isRunning} onClick={() => setReferenceImages((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">×</button></div>)}
            {referenceImages.length < 3 && <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-amber-400 bg-white text-center text-[10px] font-black text-amber-700"><ImagePlus className="mb-1 h-5 w-5" />Tải ảnh tham chiếu<input type="file" accept="image/*" multiple disabled={props.isRunning} className="hidden" onChange={(event) => uploadReferences(event.target.files)} /></label>}
          </div>
          <p className="mt-3 text-[10px] text-slate-500">Hồ sơ nhân vật mới chỉ cần tạo một lần trong tab Tạo Video Tự Động, sau đó có thể chọn lại nhanh tại đây.</p>
        </section>

        <section className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-slate-900">3. Tạo video theo cấu hình preset</p><p className="mt-1 text-[11px] text-slate-500">{ready ? "Đã đủ dữ liệu bắt buộc. Kiểm tra tóm tắt một lần trước khi chạy." : !inputDraft.trim() || !props.projectDir.trim() ? "Cần nhập nội dung và chọn thư mục dự án." : "Cần thêm ảnh tham chiếu hoặc hồ sơ nhân vật."}</p>{config.useReferenceImages && !referenceReady && <p className="mt-2 text-[10px] font-bold text-amber-700">Preset đồng nhất nhân vật chỉ chạy sau khi có ảnh chung hoặc hồ sơ nhân vật.</p>}</div>{props.isRunning ? <button type="button" onClick={props.onStop} className="rounded-xl bg-rose-600 px-6 py-3 text-xs font-black text-white"><StopCircle className="mr-2 inline h-4 w-4" />DỪNG</button> : <button type="button" disabled={!ready || isStartingRun} onClick={() => { if (inputDraft !== props.rawInput) { (props.onRequestInputReplacement || props.setRawInput)(inputDraft); return; } setShowPresetConfirm(true); }} className="rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-7 py-3.5 text-xs font-black text-white shadow-xl shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-40">{inputDraft !== props.rawInput ? "XÁC NHẬN NỘI DUNG TRƯỚC" : "KIỂM TRA & TẠO VIDEO"}</button>}</div>
        </section>
        {showPresetConfirm && <div className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600">Kiểm tra trước khi chạy</p><h3 className="mt-1 text-xl font-black text-slate-900">Tool sẽ tạo video với cấu hình này</h3></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Nguồn nội dung</p><p className="mt-1 text-xs font-bold text-slate-700">{config.inputType} · {props.rawInput.trim().length.toLocaleString("vi-VN")} ký tự</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Thư mục</p><p className="mt-1 break-all text-xs font-bold text-slate-700">{props.projectDir}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Media</p><p className="mt-1 text-xs font-bold text-slate-700">{config.generateType} · {config.aspectRatio} · {config.sceneCount} cảnh · {config.promptsPerScene} prompt/cảnh</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Voice & phụ đề</p><p className="mt-1 text-xs font-bold text-slate-700">{config.voiceModel} · {config.voiceSpeed}x · {config.subtitleEnabled ? config.subtitleStyle : "không phụ đề"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Tham chiếu</p><p className="mt-1 text-xs font-bold text-slate-700">{referenceImages.length} ảnh chung · {selectedProfileIds.length} hồ sơ nhân vật</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Render</p><p className="mt-1 text-xs font-bold text-slate-700">{config.resolution} · {config.clipTransition} · motion {config.motionIntensity}</p></div></div><div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowPresetConfirm(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600">Quay lại sửa</button><button type="button" onClick={() => { setShowPresetConfirm(false); setIsStartingRun(true); setRunRequest((request) => request + 1); }} className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white">Xác nhận tạo video</button></div></div></div>}
      </div>
    );
  }

  return (
    <div
      ref={workflowTopRef}
      className="automation-control-center space-y-5"
      onClickCapture={(event) => {
        const button = (event.target as HTMLElement).closest("button");
        // The primary run action must call its workflow directly. Routing it
        // through a state/effect hand-off could leave the visible button inert
        // after a project-folder change or a React re-render.
        if (button?.textContent?.includes("TẠO VIDEO HOÀN CHỈNH")) {
          event.stopPropagation();
          if (isStartingRun || props.isRunning) return;
          setIsStartingRun(true);
          window.setTimeout(() => props.onRun(), 0);
          return;
        }
        if (
          props.twoStage &&
          button?.textContent?.includes(stageActions[actionStep])
        ) {
          event.stopPropagation();
          if (isStartingRun || props.isRunning) return;
          setIsStartingRun(true);
          window.setTimeout(
            () => props.onRunStage?.(actionStep as 1 | 2 | 3 | 4),
            0,
          );
          return;
        }
        // A style is selected from a preview card only once; return to the
        // compact setup immediately after that selection.
        if (button?.textContent?.includes("Thêm phong cách")) {
          window.setTimeout(
            () =>
              (
                document
                  .querySelector('textarea[placeholder^="Ví dụ: handcrafted"]')
                  ?.closest("div.mt-4") as HTMLElement | null
              )?.scrollIntoView({ behavior: "smooth", block: "center" }),
            0,
          );
        }
      }}
    >
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-900">
              {props.twoStage
                ? `BƯỚC ${manualStage}/4 · ${stageNames[manualStage]}`
                : "TẠO VIDEO TỰ ĐỘNG"}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              {props.twoStage
                ? "Chỉ thiết lập những mục cần cho bước hiện tại. Bạn vẫn có thể xem trước các bước khác mà không làm gián đoạn tác vụ đang chạy."
                : "Chọn nội dung và phong cách bạn muốn. Hệ thống sẽ tự xử lý để tạo video hoàn chỉnh."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-indigo-700 shadow-sm">
              {completion === 100
                ? "Đã đủ thiết lập"
                : `Cần bổ sung thiết lập (${completion}%)`}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm">
              {props.projectDir
                ? props.projectDir.split(/[\\/]/).filter(Boolean).pop()
                : "Chưa chọn dự án"}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={projectDirDraft}
            placeholder="Thư mục dự án lưu script, ảnh, video, voice và bản render..."
            disabled={props.isRunning}
            onChange={(event) => setProjectDirDraft(event.target.value)}
            onBlur={() => {
              if (projectDirDraft.trim() !== props.projectDir.trim())
                void props.onProjectDirChange(projectDirDraft);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (projectDirDraft.trim() !== props.projectDir.trim())
                void props.onProjectDirChange(projectDirDraft);
              event.currentTarget.blur();
            }}
          />
          <button
            type="button"
            disabled={props.isRunning}
            onClick={async () => {
              const response = await fetch(
                "/api/dialog/pick?mode=dir&title=Ch%E1%BB%8Dn%20Th%C6%B0%20M%E1%BB%A5c%20D%E1%BB%B1%20%C3%81n",
              );
              const data = await response.json();
              if (data.success && data.path)
                await props.onProjectDirChange(data.path);
            }}
            className="shrink-0 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-black text-indigo-700 disabled:opacity-50"
          >
            Chọn thư mục dự án
          </button>
        </div>
        <button
          type="button"
          aria-pressed={showAdvancedSettings}
          onClick={() => setShowAdvancedSettings((value) => !value)}
          className={`mt-3 flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left shadow-md transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-300 active:scale-[0.995] ${
            showAdvancedSettings
              ? "border-violet-500 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-violet-200"
              : "border-violet-300 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 text-violet-800 shadow-violet-100 hover:border-violet-500"
          }`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                showAdvancedSettings
                  ? "bg-white/20 text-white"
                  : "bg-violet-600 text-white shadow-sm"
              }`}
            >
              ⚙
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black">
                {showAdvancedSettings
                  ? "Ẩn thiết lập nâng cao"
                  : "Hiện thiết lập nâng cao"}
              </span>
              <span
                className={`mt-0.5 block text-[11px] font-semibold ${
                  showAdvancedSettings ? "text-violet-100" : "text-slate-500"
                }`}
              >
                Tùy chỉnh chuyên sâu về kịch bản, nhân vật, ảnh/video, voice, SEO và xuất bản
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black ${
                showAdvancedSettings
                  ? "bg-white/20 text-white"
                  : "bg-violet-100 text-violet-700"
              }`}
            >
              {showAdvancedSettings ? "ĐANG MỞ" : "MỞ TÙY CHỈNH"}
            </span>
            <span
              className={`text-lg transition-transform ${
                showAdvancedSettings ? "rotate-180" : ""
              }`}
            >
              ⌄
            </span>
          </span>
        </button>
        {workspaceMode === "review" &&
          hasReviewableOutput && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-black text-slate-700">
                CHỌN BƯỚC ĐỂ XEM KẾT QUẢ
              </p>
              <p className="text-[10px] text-slate-500">
                Mở lại kết quả bất cứ lúc nào, không chạy lại quy trình.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              {[
                {
                  id: 1 as const,
                  title: "Bước 1",
                  label: "Nội dung & kịch bản",
                  ready: !!props.finalizedScript.trim(),
                  tab: "input" as const,
                },
                {
                  id: 2 as const,
                  title: "Bước 2",
                  label: "Phong cách, phân cảnh & media",
                  ready:
                    (props.reviewScenes?.length || 0) > 0 &&
                    Object.keys(props.reviewMedia || {}).length > 0,
                  tab: "media" as const,
                },
                {
                  id: 3 as const,
                  title: "Bước 3",
                  label: "Voice, SEO & thumbnail",
                  ready: !!props.reviewAudioUrl || !!props.reviewSeo,
                  tab: "voice" as const,
                },
                {
                  id: 4 as const,
                  title: "Bước 4",
                  label: "Render video cuối",
                  ready: pipelineFinished,
                  tab: "render" as const,
                },
              ].map((section) => (
                <button
                  type="button"
                  key={section.id}
                  onClick={() => {
                    setWorkspaceMode("review");
                    setSelectedReviewSection(section.id);
                  }}
                  className={`rounded-xl border p-3 text-left transition ${selectedReviewSection === section.id ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-indigo-300"}`}
                >
                  <span className="block text-[10px] font-black uppercase text-indigo-700">
                    {section.title}
                  </span>
                  <span className="mt-1 block text-[11px] font-black text-slate-800">
                    {section.label}
                  </span>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-black ${section.ready ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {section.ready ? "CÓ KẾT QUẢ" : "CHƯA HOÀN TẤT"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="mt-4 text-[11px] font-semibold text-slate-500">
          {props.twoStage && manualStage > 1
            ? "Bạn có thể mở lại các bước đã hoàn thành để kiểm tra hoặc chỉnh sửa. Nút chạy vẫn chỉ thực hiện bước hiện tại."
            : ""}
        </p>
        <div className="sticky top-0 z-50 -mx-1 mt-3 rounded-2xl border border-indigo-200 bg-white/95 p-2 shadow-xl backdrop-blur">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {workflowSteps.map((step) => {
              const active = workspaceMode === "setup" && workflowStep === step.id;
              const failed =
                active &&
                props.logs.some((line) =>
                  /lỗi|error|failed|không thể/i.test(line),
                );
              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => goToWorkflowStep(step.id)}
                  disabled={props.twoStage && step.id > manualStage}
                  className={`group min-w-[170px] flex-1 rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                        failed
                          ? "bg-rose-500 text-white"
                          : step.complete
                            ? "bg-emerald-500 text-white"
                            : active
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {failed ? "!" : step.complete ? "✓" : step.id}
                    </span>
                    <span>
                      <span className="block text-[9px] font-black uppercase tracking-wide opacity-70">
                        Bước {step.id}
                      </span>
                      <span className="block whitespace-nowrap text-[11px] font-black">
                        {step.label}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
            {hasReviewableOutput && (
              <button
                type="button"
                onClick={() => {
                  if (workspaceMode === "review") {
                    setWorkspaceMode("setup");
                    setSelectedReviewSection(null);
                    window.setTimeout(
                      () =>
                        workflowTopRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
                      0,
                    );
                    return;
                  }
                  setWorkspaceMode("review");
                  if (selectedReviewSection === null)
                    setSelectedReviewSection(
                      Math.max(1, manualStage - 1) as 1 | 2 | 3 | 4,
                    );
                  window.setTimeout(
                    () =>
                      workflowTopRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      }),
                    0,
                  );
                }}
                className={`min-w-[120px] rounded-xl border px-3 py-2.5 text-xs font-black transition ${
                  workspaceMode === "review"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {workspaceMode === "review"
                  ? "← Quay lại Setup"
                  : "Review kết quả"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileSummaryOpen((value) => !value)}
            className="mt-1 w-full rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-600 xl:hidden"
          >
            {mobileSummaryOpen ? "Ẩn cấu hình" : "Xem cấu hình hiện tại"}
          </button>
          <div
            className={`${mobileSummaryOpen ? "grid" : "hidden"} mt-2 grid-cols-2 gap-2 text-[10px] xl:grid xl:grid-cols-5`}
          >
            {[
              ["Tỷ lệ", config.aspectRatio],
              [
                "Nền tảng",
                config.generationMode === "viettheo-api"
                  ? "API Flow"
                  : config.generationMode === "labs-flow"
                    ? "Labs / Flow"
                    : "Gemini Chat",
              ],
              ["Phân cảnh", String(props.stats.scenes)],
              [
                "Phong cách",
                allStyleChoices.find(
                  (style) => style.prompt === props.imageStyle,
                )?.name || "Tùy chỉnh",
              ],
              [
                "Tiến độ",
                props.isRunning ? `${props.progress}%` : `${completion}% setup`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="block font-bold text-slate-400">{label}</span>
                <span className="mt-0.5 block truncate font-black text-slate-700">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {workspaceMode === "setup" && workflowStep === 2 && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">
                Thiết lập Bước 2
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Chọn nhóm thiết lập cần chỉnh. Nền tảng, loại media, model và số luồng nằm trong Ảnh / Video.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveTab("scenes")}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                activeTab === "scenes"
                  ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-200"
                  : "border-violet-200 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50"
              }`}
            >
              <span className="block text-xs font-black">1. Phong cách & nhân vật</span>
              <span className={`mt-1 block text-[10px] ${activeTab === "scenes" ? "text-violet-100" : "text-slate-500"}`}>
                Style prompt, ảnh tham chiếu và hồ sơ nhân vật
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                activeTab === "media"
                  ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-200"
                  : "border-violet-200 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50"
              }`}
            >
              <span className="block text-xs font-black">2. Ảnh / Video</span>
              <span className={`mt-1 block text-[10px] ${activeTab === "media" ? "text-violet-100" : "text-slate-500"}`}>
                Nền tảng tạo, loại media, model, tỉ lệ và số luồng
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-700">
            <span>
              {props.isRunning
                ? props.twoStage
                  ? `Đang chạy Bước ${manualStage}: ${stageNames[manualStage]}...`
                  : "Đang tạo video hoàn chỉnh..."
                : pipelineFinished
                  ? "Video hoàn chỉnh đã tạo"
                  : props.twoStage && props.reviewReady
                    ? `Kết quả Bước ${Math.max(1, manualStage - 1)} đã sẵn sàng để kiểm tra`
                    : props.twoStage
                      ? `Sẵn sàng chạy Bước ${manualStage}`
                      : "Sẵn sàng tạo video hoàn chỉnh"}
            </span>
            {(props.isRunning || pipelineFinished || props.reviewReady) && (
              <span className="text-indigo-700">
                {props.isRunning ? `${props.progress}%` : "100%"}
              </span>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${props.isRunning ? props.progress : pipelineFinished || props.reviewReady ? 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500">
            <span>{props.stats.words.toLocaleString("vi-VN")} ký tự kịch bản</span>
            <span>{props.stats.scenes} phân cảnh</span>
            <span>
              {completedMediaCount}/{totalMediaCount} prompt đã tạo thành công
            </span>
            <span
              className={
                props.isRunning
                  ? "text-indigo-700"
                  : pipelineFinished
                    ? "text-emerald-700"
                    : "text-slate-500"
              }
            >
              {props.isRunning
                ? "Đang xử lý"
                : pipelineFinished
                    ? "Đã hoàn tất"
                    : props.reviewReady
                      ? "Chờ duyệt"
                    : "Chưa chạy"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {props.twoStage && manualStage > 1 && !props.isRunning && (
            <button
              type="button"
              onClick={props.onBackStage}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 hover:border-indigo-300"
            >
              ← QUAY LẠI XEM BƯỚC TRƯỚC
            </button>
          )}
          {props.isRunning ? (
            <button
              type="button"
              onClick={props.onStop}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-xs font-black text-white"
            >
              <StopCircle className="h-4 w-4" />
              DỪNG
            </button>
          ) : (
            <button
              type="button"
              disabled={isStartingRun || !canRunCurrentStage}
              onClick={() => setRunRequest((request) => request + 1)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-7 py-3.5 text-xs font-black text-white shadow-xl shadow-violet-300/60 ring-2 ring-violet-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-300/70 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isStartingRun ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isStartingRun
                ? "ĐANG KẾT NỐI SERVER..."
                : props.twoStage
                  ? stageActions[actionStep]
                  : "TẠO VIDEO HOÀN CHỈNH"}
            </button>
          )}
        </div>
      </div>
      {workspaceMode === "review" &&
        hasReviewableOutput &&
        (props.reviewReady || selectedReviewSection !== null) && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-emerald-900">
                  Kết quả Bước{" "}
                  {selectedReviewSection || Math.max(1, manualStage - 1)}
                </h3>
                <p className="mt-1 text-[11px] text-emerald-800">
                  Kiểm tra kỹ đầu ra bên dưới. Bạn có thể đổi sang bước review
                  khác ở phía trên.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">
                REVIEW DỰ ÁN
              </span>
            </div>
            {selectedReviewSection === 1 && (
              <>
                <label className="mt-4 block text-[11px] font-black text-slate-700">
                  Kịch bản đã chuẩn hóa
                </label>
                <textarea
                  value={props.finalizedScript}
                  onChange={(event) =>
                    props.setFinalizedScript(event.target.value)
                  }
                  rows={10}
                  className="mt-2 w-full rounded-xl border border-emerald-200 bg-white p-3 text-xs leading-relaxed text-slate-700 outline-none focus:border-emerald-500"
                />
              </>
            )}
            {selectedReviewSection === 2 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-xl border border-emerald-200 bg-white p-1">
                  {([
                    ["all", "TẤT CẢ"],
                    ["image", "ẢNH"],
                    ["video", "VIDEO"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewMediaFilter(value)}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-black transition ${
                        reviewMediaFilter === value
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {props.onReloadMedia && (
                <button
                  type="button"
                  disabled={reloadingMedia}
                  onClick={async () => {
                    setReloadingMedia(true);
                    try { await props.onReloadMedia?.(); }
                    finally { setReloadingMedia(false); }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                  title="Quét lại thư mục img và vid của dự án để cập nhật preview"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${reloadingMedia ? "animate-spin" : ""}`} />
                  {reloadingMedia ? "ĐANG TẢI..." : "TẢI LẠI ẢNH / VIDEO"}
                </button>
                )}
              </div>
            )}
            {selectedReviewSection === 2 &&
              (props.reviewScenes?.length || 0) > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 min-[2560px]:grid-cols-6 min-[3840px]:grid-cols-7">
                  {props.reviewScenes?.flatMap((scene, sceneIndex) =>
                    (scene.imagePrompts || []).map(
                      (prompt: any, promptIndex: number) => {
                        const mediaKey =
                          prompt.code ||
                          `scene-${scene.sceneNumber}-${promptIndex + 1}`;
                        const mediaUrl = props.reviewMedia?.[mediaKey];
                        const creating =
                          props.regeneratingMediaKey === mediaKey;
                        // Local previews are served as
                        // /api/serve-local-file?path=...scene-P2_2.mp4&t=...
                        // so endsWith('.mp4') incorrectly treated videos as
                        // images and produced a broken thumbnail.
                        const isVideoPreview =
                          !!mediaUrl &&
                          (/^data:video\//i.test(mediaUrl) ||
                            /\.(?:mp4|mov|webm|mkv)(?:[?&#]|$)/i.test(mediaUrl));
                        if (
                          (reviewMediaFilter === "video" && !isVideoPreview) ||
                          (reviewMediaFilter === "image" && (!mediaUrl || isVideoPreview))
                        )
                          return null;
                        return (
                          <div
                            key={mediaKey}
                            className="overflow-hidden rounded-2xl border border-emerald-100 bg-white"
                          >
                            {mediaUrl ? (
                              isVideoPreview ? (
                                <div
                                  className="mx-auto w-full bg-slate-100"
                                  style={{
                                    aspectRatio: config.aspectRatio.replace(
                                      ":",
                                      " / ",
                                    ),
                                  }}
                                >
                                  <video
                                    src={mediaUrl}
                                    controls
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                              ) : (
                                <img
                                  src={mediaUrl}
                                  className="block h-auto w-full"
                                />
                              )
                            ) : (
                              <div
                                className="mx-auto flex w-full items-center justify-center bg-slate-100 text-xs text-slate-400"
                                style={{
                                  aspectRatio: config.aspectRatio.replace(
                                    ":",
                                    " / ",
                                  ),
                                }}
                              >
                                Chưa có preview
                              </div>
                            )}
                            <div className="p-3">
                              <p className="mb-2 text-[11px] font-black text-emerald-700">
                                {mediaKey} · {scene.text}
                              </p>
                              <textarea
                                value={prompt.englishPrompt || ""}
                                onChange={(event) =>
                                  props.onUpdatePrompt?.(
                                    sceneIndex,
                                    promptIndex,
                                    "englishPrompt",
                                    event.target.value,
                                  )
                                }
                                rows={4}
                                className="w-full rounded-lg border border-slate-200 p-2 font-mono text-[10px] leading-relaxed text-slate-700 outline-none focus:border-emerald-400"
                              />
                              <button
                                type="button"
                                disabled={props.isRunning || creating}
                                onClick={() =>
                                  props.onRegenerateMedia?.(
                                    sceneIndex,
                                    promptIndex,
                                  )
                                }
                                className="mt-2 w-full rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-black text-white disabled:opacity-50"
                              >
                                {creating
                                  ? "ĐANG TẠO LẠI..."
                                  : "TẠO LẠI ẢNH / VIDEO NÀY"}
                              </button>
                            </div>
                          </div>
                        );
                      },
                    ),
                  )}
                </div>
              )}
            {selectedReviewSection === 3 && (
              <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                  <p className="text-[11px] font-black text-slate-700">
                    Voice đã tạo
                  </p>
                  {props.reviewAudioUrl ? (
                    <audio
                      controls
                      src={props.reviewAudioUrl}
                      className="mt-3 w-full"
                    />
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Chưa có file voice.
                    </p>
                  )}
                  {props.twoStage && props.onRunVoiceOnly && (
                    <button
                      type="button"
                      disabled={props.isRunning || props.voiceRegenerating || !props.finalizedScript.trim()}
                      onClick={() => props.onRunVoiceOnly?.()}
                      className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {props.voiceRegenerating && <RefreshCw className="h-4 w-4 animate-spin" />}
                        {props.voiceRegenerating ? `ĐANG TẠO LẠI VOICE... ${Math.round(props.voiceRegenerateProgress || 0)}%` : "TẠO LẠI RIÊNG VOICE"}
                      </span>
                    </button>
                  )}
                </div>
                <div className="flex min-h-0 flex-col rounded-2xl border border-emerald-100 bg-white p-4">
                  <p className="text-[11px] font-black text-slate-700">Thumbnail hiện tại</p>
                  <div className="mt-3 flex h-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-2">
                    {props.reviewThumbnailUrl ? (
                      <button
                        type="button"
                        onClick={() => setExpandedThumbnailUrl(props.reviewThumbnailUrl || "")}
                        className="flex h-full w-full cursor-zoom-in items-center justify-center"
                        title="Bấm để xem thumbnail kích thước lớn"
                      >
                        <img
                          src={props.reviewThumbnailUrl}
                          alt="Preview thumbnail"
                          className="h-full w-full object-contain"
                        />
                      </button>
                    ) : (
                      <p className="px-3 text-center text-xs font-bold text-slate-400">
                        Chưa có ảnh thumbnail.
                      </p>
                    )}
                  </div>
                  {props.reviewThumbnailUrl && (
                    <p className="mt-1.5 text-center text-[10px] font-bold text-slate-400">
                      Ảnh thu nhỏ đúng tỷ lệ · Bấm để xem lớn
                    </p>
                  )}
                  {props.twoStage && props.onRunThumbnailOnly && (
                    <button type="button" disabled={props.isRunning || props.thumbnailRegenerating || !props.reviewSeo?.thumbnailConcept?.imagePrompt} onClick={() => props.onRunThumbnailOnly?.()} className="mt-4 w-full rounded-xl bg-fuchsia-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-fuchsia-100 transition hover:bg-fuchsia-700 active:scale-[0.98] disabled:opacity-50">
                      <span className="inline-flex items-center justify-center gap-2">
                        {props.thumbnailRegenerating && <RefreshCw className="h-4 w-4 animate-spin" />}
                        {props.thumbnailRegenerating ? `ĐANG TẠO THUMBNAIL... ${Math.round(props.thumbnailRegenerateProgress || 0)}%` : "TẠO LẠI THUMBNAIL"}
                      </span>
                    </button>
                  )}
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                  <p className="text-[11px] font-black text-slate-700">
                    Tiêu đề & nội dung đăng tải
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {props.reviewSeo?.seoTitle || "Chưa có tiêu đề"}
                  </p>
                  <p className="mt-2 max-h-32 overflow-y-auto text-xs leading-relaxed text-slate-600">
                    {props.reviewSeo?.seoDescription || ""}
                  </p>
                  {props.twoStage && props.onRunSeoOnly && (
                    <div className="mt-4">
                      <button type="button" disabled={props.isRunning || props.seoRegenerating || !props.finalizedScript.trim()} onClick={() => props.onRunSeoOnly?.()} className="w-full rounded-xl bg-violet-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-violet-100 transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50">
                        <span className="inline-flex items-center justify-center gap-2">
                          {props.seoRegenerating && <RefreshCw className="h-4 w-4 animate-spin" />}
                          {props.seoRegenerating ? `ĐANG TẠO LẠI SEO... ${Math.round(props.seoRegenerateProgress || 0)}%` : "TẠO LẠI SEO"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedReviewSection === 4 && (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-slate-700">
                {pipelineFinished
                  ? "Video đầu ra đã render xong. Mở tab Video đầu ra để xem và xuất file."
                  : "Video đầu ra chưa render. Sau khi duyệt các bước trước, chạy Bước 4 để tạo video final."}
              </div>
            )}
          </section>
        )}

      <div className="automation-settings-panel rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
        {workspaceMode === "setup" && activeTab === "scenes" && showAdvancedSettings && (
          <section className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  Hồ sơ nhân vật của kênh
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Lưu hồ sơ để dùng lại trong các clip sau, giúp nhân vật luôn
                  nhất quán.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCharacterGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-black text-indigo-700 transition hover:bg-indigo-50 active:scale-[0.98]"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Hướng dẫn đồng bộ nhiều nhân vật
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingCharacterProfile({
                      id: `CHAR_${String(characterProfiles.length + 1).padStart(2, "0")}_${Date.now()}`,
                      name: "",
                      aliases: "",
                      description: "",
                      referenceImages: [],
                      updatedAt: "",
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-black text-white transition hover:bg-indigo-700 active:scale-[0.98]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm hồ sơ
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isGeneratingCharacterProfile}
                onClick={generateCharacterProfileFromScript}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-black text-violet-700 disabled:opacity-50"
              >
                <WandSparkles className="h-3.5 w-3.5" />
                {isGeneratingCharacterProfile
                  ? "AI đang tạo hồ sơ..."
                  : "AI tạo từ kịch bản"}
              </button>
              <span className="self-center text-[10px] text-slate-500">
                Sau đó đặt tên, chỉnh sửa và lưu để dùng cho clip sau.
              </span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <Field label="Thêm nhân vật vào video">
                <Select
                  value=""
                  onChange={(event) =>
                    chooseCharacterProfile(event.target.value)
                  }
                >
                  <option value="">Chọn một hồ sơ nhân vật...</option>
                  {characterProfiles
                    .filter((profile) => !config.characterProfileId.split(",").includes(profile.id))
                    .map((profile, index) => (
                    <option key={profile.id} value={profile.id}>
                      {characterCode(profile, index)} · {profile.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end">
                <button type="button" onClick={() => chooseCharacterProfile("")} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-black text-slate-600">
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>
            {config.characterProfileId && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {config.characterProfileId.split(",").filter(Boolean).map((profileId) => {
                  const profile = characterProfiles.find((item) => item.id === profileId);
                  if (!profile) return null;
                  const index = characterProfiles.findIndex((item) => item.id === profile.id);
                  return (
                    <div key={profile.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[9px] font-black text-emerald-700">{characterCode(profile, index)}</span>
                          <p className="text-xs font-black text-slate-800">{profile.name}</p>
                          {profile.aliases && <p className="mt-0.5 text-[9px] text-slate-500">Bí danh: {profile.aliases}</p>}
                          <p className={`mt-1 text-[9px] font-bold ${(profile.referenceImages || []).length ? "text-emerald-700" : "text-amber-700"}`}>
                            {(profile.referenceImages || []).length
                              ? `${(profile.referenceImages || []).length} ảnh tham chiếu riêng`
                              : "Chưa có ảnh tham chiếu riêng"}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setEditingCharacterProfile(profile)} className="rounded-lg bg-white p-1.5 text-indigo-700" title="Sửa hồ sơ"><Pencil className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => removeCharacterProfileFromVideo(profile.id)} className="rounded-lg bg-white p-1.5 text-rose-600" title="Bỏ khỏi video"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {editingCharacterProfile && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-white p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 px-2 py-1 font-mono text-[10px] font-black text-indigo-700">
                    {characterCode(editingCharacterProfile, Math.max(0, characterProfiles.findIndex((item) => item.id === editingCharacterProfile.id)))}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Mã này giúp AI không trộn nhân vật giữa các cảnh.</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Tên nhân vật">
                    <Input
                      value={editingCharacterProfile.name}
                      onChange={(event) =>
                        setEditingCharacterProfile({
                          ...editingCharacterProfile,
                          name: event.target.value,
                        })
                      }
                      placeholder="Ví dụ: Lan"
                    />
                  </Field>
                  <Field label="Bí danh/cách gọi trong kịch bản">
                    <Input
                      value={editingCharacterProfile.aliases || ""}
                      onChange={(event) => setEditingCharacterProfile({ ...editingCharacterProfile, aliases: event.target.value })}
                      placeholder="Ví dụ: cô ấy, người mẹ, chị Lan"
                    />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <div className="flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCharacterProfile(null)}
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] font-black text-slate-600"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={saveCharacterProfile}
                      className="rounded-xl bg-indigo-600 px-3 py-2.5 text-[11px] font-black text-white"
                    >
                      <Save className="inline h-3.5 w-3.5" /> Lưu hồ sơ
                    </button>
                  </div>
                </div>
                <Field
                  label="Mô tả nhận dạng bất biến"
                  hint="Ghi rõ giới tính, tuổi, khuôn mặt, màu da, tóc, vóc dáng, trang phục và dấu hiệu nhận diện. Không ghi hành động hoặc bối cảnh."
                >
                  <textarea
                    rows={4}
                    value={editingCharacterProfile.description}
                    onChange={(event) =>
                      setEditingCharacterProfile({
                        ...editingCharacterProfile,
                        description: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 outline-none focus:border-indigo-400"
                    placeholder="Ví dụ: Asian woman, 30 years old, oval face, black bob hair, round glasses, light-blue shirt..."
                  />
                </Field>
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                  <p className="text-[11px] font-black text-slate-800">
                    Ảnh riêng của nhân vật này
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Tool gắn các ảnh này với đúng mã nhân vật phía trên. Chúng chỉ được dùng khi phân cảnh có nhân vật này, không áp dụng cho nhân vật khác.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {(editingCharacterProfile.referenceImages || []).map(
                      (src, index) => (
                        <div
                          key={`${src}-${index}`}
                          className="relative h-24 w-20 overflow-hidden rounded-xl border border-amber-200 bg-white"
                        >
                          <img
                            src={src}
                            alt={`Ảnh nhân vật ${editingCharacterProfile.name || index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditingCharacterProfile({
                                ...editingCharacterProfile,
                                referenceImages: (
                                  editingCharacterProfile.referenceImages || []
                                ).filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              })
                            }
                            className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                            aria-label="Xóa ảnh nhân vật"
                          >
                            ×
                          </button>
                        </div>
                      ),
                    )}
                    {(editingCharacterProfile.referenceImages || []).length <
                      3 && (
                      <label className="flex h-24 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-amber-400 bg-white text-center text-[10px] font-black text-amber-700 transition hover:bg-amber-50">
                        <span>+ Thêm ảnh riêng</span>
                        <span className="mt-1 font-medium text-slate-400">
                          Tối đa 3 ảnh
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(event) =>
                            uploadCharacterReferences(event.target.files)
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
            {!editingCharacterProfile && config.characterProfileId && (
              <p className="mt-3 text-[11px] font-semibold text-indigo-700">
                Đang áp dụng hồ sơ này cho prompt:{" "}
                {config.characterBible.slice(0, 180)}
                {config.characterBible.length > 180 ? "..." : ""}
              </p>
            )}
            <div className="mt-3 border-t border-indigo-100 pt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black text-slate-700">
                    Ảnh tham chiếu chung
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Dùng chung cho phong cách, bối cảnh hoặc vật thể. Bạn cũng có thể tải 1 ảnh nhóm có đủ nhân vật và ghi tên từng người; tool dùng ảnh này khi cảnh thiếu ảnh riêng nhưng chỉ gọi những nhân vật thực sự xuất hiện trong cảnh.
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {referenceImages.map((src, index) => (
                  <div
                    key={index}
                    className="relative h-20 w-20 overflow-hidden rounded-xl border bg-white"
                  >
                    <img src={src} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setReferenceImages((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {referenceImages.length < 3 && (
                  <label className="flex h-20 w-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-indigo-300 bg-indigo-50 text-[11px] font-bold text-indigo-700">
                    + Thêm ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => uploadReferences(event.target.files)}
                    />
                  </label>
                )}
              </div>
            </div>
          </section>
        )}
        {workspaceMode === "setup" && activeTab === "scenes" && (
          <section className="mb-4 rounded-2xl border border-indigo-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  Phong cách prompt
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Chọn nhanh hoặc mở thư viện có ảnh preview.
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <div className="min-w-0 flex-1 sm:w-64">
                  <Select
                    value={props.imageStyle}
                    onChange={(event) =>
                      props.setImageStyle(event.target.value)
                    }
                  >
                    {!allStyleChoices.some(
                      (style) => style.prompt === props.imageStyle,
                    ) && (
                      <option value={props.imageStyle}>
                        Phong cách tùy chỉnh đang dùng
                      </option>
                    )}
                    {allStyleChoices.map((style) => (
                      <option key={style.id} value={style.prompt}>
                        {style.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => setStylePickerOpen((value) => !value)}
                  className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700"
                >
                  {stylePickerOpen ? "Thu gọn" : "Xem preview"}
                </button>
              </div>
            </div>
          </section>
        )}

        {workspaceMode === "setup" && activeTab === "input" && showAdvancedSettings && (
          <section className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Thể loại yêu cầu (có thể tự nhập)">
                <Input
                  value={config.customGenre}
                  onChange={(event) =>
                    update("customGenre", event.target.value)
                  }
                  placeholder="Ví dụ: Kể chuyện chữa lành, review công nghệ..."
                />
              </Field>
              <Field label="Yêu cầu thêm cho AI viết kịch bản">
                <textarea
                  rows={2}
                  value={config.scriptInstructions}
                  onChange={(event) =>
                    update("scriptInstructions", event.target.value)
                  }
                  placeholder="Ví dụ: giọng kể gần gũi, mở đầu gây tò mò, có CTA cuối video..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 outline-none focus:border-indigo-400"
                />
              </Field>
            </div>
            <p className="mt-2 text-[10px] text-indigo-700">
              Sau khi chạy Bước 1, bạn vẫn có thể sửa trực tiếp kịch bản/prompt
              hoặc nhập yêu cầu mới để chạy lại.
            </p>
          </section>
        )}
        {workspaceMode === "setup" && activeTab === "input" && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Loại đầu vào">
                <Select
                  value={config.inputType}
                  onChange={(e) =>
                    update(
                      "inputType",
                      e.target.value as AutoConfig["inputType"],
                    )
                  }
                >
                  <option value="script">Kịch bản có sẵn</option>
                  <option value="idea">Ý tưởng / mô tả</option>
                  <option value="link">Link YouTube / TikTok / Facebook</option>
                </Select>
              </Field>
              <Field label="Ngôn ngữ">
                <Select
                  value={props.language}
                  onChange={(e) => props.setLanguage(e.target.value)}
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh</option>
                  <option value="original">Giữ nguyên ngôn ngữ gốc</option>
                </Select>
              </Field>
              <Field label="Thể loại">
                <Select
                  value={config.genre}
                  onChange={(e) => update("genre", e.target.value)}
                >
                  <option value="storytelling">Kể chuyện</option>
                  <option value="history">Lịch sử</option>
                  <option value="mystery">Bí ẩn</option>
                  <option value="education">Giáo dục</option>
                  <option value="review">Review / đánh giá</option>
                  <option value="affiliate">Affiliate</option>
                  <option value="news">Tin tức</option>
                </Select>
              </Field>
            </div>
            <Field
              label={
                config.inputType === "script"
                  ? props.finalizedScript.trim()
                    ? "Kịch bản gốc (đầu vào – giữ để đối chiếu)"
                    : "Nội dung kịch bản"
                  : config.inputType === "link"
                    ? "Link video"
                    : "Mô tả ý tưởng video"
              }
            >
              <textarea
                value={inputDraft}
                onChange={(e) => setInputDraft(e.target.value)}
                onBlur={() => {
                  if (inputDraft !== props.rawInput) {
                    (props.onRequestInputReplacement || props.setRawInput)(
                      inputDraft,
                    );
                    setInputDraft(props.rawInput);
                  }
                }}
                rows={7}
                placeholder={
                  config.inputType === "script"
                    ? "Dán toàn bộ kịch bản..."
                    : config.inputType === "link"
                      ? "Dán đường dẫn video..."
                      : "Mô tả chủ đề, mạch nội dung và thông điệp..."
                }
                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </Field>
            {config.inputType === "script" && props.finalizedScript.trim() && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
                <span>Kết quả Bước 1 đã được tạo bằng {props.language === "vi" ? "Tiếng Việt" : props.language === "en" ? "Tiếng Anh" : "ngôn ngữ gốc"}. Ô phía trên luôn giữ bản nguồn để đối chiếu.</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReviewSection(1);
                    setWorkspaceMode("review");
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-white"
                >
                  XEM KỊCH BẢN KẾT QUẢ
                </button>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Mức độ viết lại">
                <Select
                  value={config.rewriteLevel}
                  onChange={(e) => {
                    const value = e.target.value;
                    update("rewriteLevel", value);
                    update("preserveOriginalScript", value === "original");
                  }}
                >
                  <option value="original">Giữ nguyên 100% nội dung gốc</option>
                  <option value="keep">Chỉ chuẩn hóa câu chữ</option>
                  <option value="light">Viết lại nhẹ</option>
                  <option value="balanced">Viết lại cân bằng</option>
                  <option value="strong">Viết lại mạnh</option>
                </Select>
              </Field>
              <Field label="Độ dài kịch bản viết lại">
                <Select
                  value={config.rewriteLengthMode}
                  onChange={(e) =>
                    update(
                      "rewriteLengthMode",
                      e.target.value as AutoConfig["rewriteLengthMode"],
                    )
                  }
                >
                  <option value="source">Giữ độ dài bản gốc</option>
                  <option value="words">Theo số từ mục tiêu</option>
                  <option value="minutes">Theo thời lượng video (phút)</option>
                </Select>
              </Field>
              {config.rewriteLengthMode === "words" && (
                <Field label="Số từ mục tiêu">
                  <Input
                    type="number"
                    min={50}
                    step={10}
                    value={config.rewriteTargetWords}
                    onChange={(e) =>
                      update(
                        "rewriteTargetWords",
                        Math.max(50, Number(e.target.value) || 50),
                      )
                    }
                  />
                </Field>
              )}
              {config.rewriteLengthMode === "minutes" && (
                <Field label="Thời lượng video (phút)">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={config.rewriteTargetMinutes}
                    onChange={(e) =>
                      update(
                        "rewriteTargetMinutes",
                        Math.max(
                          0.1,
                          Number(e.target.value.replace(",", ".")) || 0.1,
                        ),
                      )
                    }
                    hint={`Mục tiêu ${Math.round(config.rewriteTargetMinutes * (props.language === "en" ? 145 : 150))} từ · sai số tối đa 5% (AI sẽ tự hiệu chỉnh lần hai nếu lệch)`}
                  />
                </Field>
              )}
              <Toggle
                checked={config.hookEnabled}
                onChange={(value) => update("hookEnabled", value)}
                label="Tạo Hook thu hút"
              />
              <Field label="Phong cách Hook">
                <Select
                  value={config.hookStyle}
                  disabled={!config.hookEnabled}
                  onChange={(e) => update("hookStyle", e.target.value)}
                >
                  <option value="shocking">Gây sốc / bất ngờ</option>
                  <option value="question">Câu hỏi tò mò</option>
                  <option value="warning">Cảnh báo</option>
                  <option value="benefit">Hứa hẹn giá trị</option>
                </Select>
              </Field>
            </div>
            {config.inputType !== "idea" && (
              <Toggle
                checked={config.preserveOriginalScript}
                onChange={(value) => {
                  update("preserveOriginalScript", value);
                  if (value) update("rewriteLevel", "original");
                  else if (config.rewriteLevel === "original")
                    update("rewriteLevel", "balanced");
                }}
                label="Giữ nguyên kịch bản gốc"
              />
            )}
          </div>
        )}

        {workspaceMode === "setup" && activeTab === "scenes" && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-rose-200 bg-white p-4">
              <label className="flex items-start gap-2 text-xs font-black text-slate-800">
                <input
                  type="checkbox"
                  checked={config.sceneMode === "dialogue"}
                  onChange={(event) =>
                    update(
                      "sceneMode",
                      event.target.checked ? "dialogue" : "count",
                    )
                  }
                  className="mt-0.5 h-4 w-4 accent-indigo-600"
                />
                <span>
                  🔥 [NÂNG CAO] Chia kịch bản phân cảnh bám khăng khít theo từng
                  câu thoại
                  <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500">
                    Hệ thống tự chia nhỏ kịch bản bám sát theo nhịp câu thoại /
                    đoạn văn nhỏ độc lập có nghĩa trọn vẹn, giúp bối cảnh thay
                    đổi chuẩn xác theo từng câu lồng tiếng phụ đề.
                  </p>
                </span>
              </label>
              <div className="my-3 border-t border-slate-200" />
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-[11px] font-black text-slate-700">
                  CẤU HÌNH GỘP CÂU THOẠI:
                </span>
                <Select
                  value={config.dialogueGroupSize}
                  onChange={(event) =>
                    update("dialogueGroupSize", Number(event.target.value))
                  }
                  className="max-w-md"
                >
                  <option value="1">
                    1 câu thoại = 1–3 prompts (tự động theo độ dài câu)
                  </option>
                  <option value="2">2 câu thoại = 1–2 prompts</option>
                  <option value="3">3 câu thoại = 1 prompt</option>
                </Select>
              </div>
              <div className="my-3 border-t border-slate-200" />
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-[11px] font-black text-slate-700">
                  MỤC TIÊU SỬ DỤNG PROMPT:
                </span>
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => update("promptFocus", "video")}
                    className={`rounded-lg px-3 py-2 text-[10px] font-black ${config.promptFocus === "video" ? "bg-white text-indigo-700 shadow" : "text-slate-500"}`}
                  >
                    🎬 TẠO VIDEO
                  </button>
                  <button
                    type="button"
                    onClick={() => update("promptFocus", "image")}
                    className={`rounded-lg px-3 py-2 text-[10px] font-black ${config.promptFocus === "image" ? "bg-white text-indigo-700 shadow" : "text-slate-500"}`}
                  >
                    🖼️ TẠO ẢNH
                  </button>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px]">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>📊 Số câu thoại đếm được:</span>
                  <span className="rounded bg-rose-50 px-2 py-1 text-rose-600">
                    {props.stats.scenes || 0} câu
                  </span>
                </div>
                <div className="my-2 border-t border-dashed border-slate-200" />
                <p className="text-slate-500">
                  👉 Với lựa chọn nhóm {config.dialogueGroupSize} câu thoại, hệ
                  thống sẽ phát sinh tối thiểu{" "}
                  <b className="text-rose-600">
                    {props.stats.scenes
                      ? Math.ceil(props.stats.scenes / config.dialogueGroupSize)
                      : 0}{" "}
                    phân cảnh
                  </b>
                  .
                </p>
                <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2 text-[10px] text-slate-600">
                  🎬 Chế độ Tạo{" "}
                  {config.promptFocus === "video" ? "Video" : "Ảnh"}: Tối ưu số
                  lượng prompt ở mức tối giản, đồng bộ khớp thời gian lời đọc và
                  hạn chế dư thừa ảnh gây loãng mạch cảnh.
                </div>
                <p className="mt-2 text-[10px] italic text-slate-400">
                  * Toàn bộ kịch bản sẽ được AI xử lý tuần tự theo từng cụm nhỏ
                  nhằm bảo toàn diễn mạo nhân vật & bối cảnh bền vững nhất.
                </p>
              </div>
            </section>
            <div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    Chọn phong cách hình ảnh
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Chọn một mẫu để toàn bộ hình ảnh/video có diện mạo đồng
                    nhất. Hoặc tải ảnh mẫu: AI sẽ tự rút ra màu sắc, chất liệu,
                    ánh sáng và phong cách thành prompt để bạn dùng lại.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-black text-violet-700">
                    <WandSparkles className={`h-3.5 w-3.5 ${isAnalyzingStyle ? "animate-spin" : ""}`} />
                    {isAnalyzingStyle ? "Đang phân tích style..." : "Tải ảnh lấy style"}
                    <input type="file" accept="image/*" multiple className="hidden" disabled={isAnalyzingStyle} onChange={(event) => void uploadStyleDemo(event.target.files)} />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingStyle({
                        id: `custom-${Date.now()}`,
                        name: "",
                        desc: "",
                        prompt: "",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-black text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm phong cách
                  </button>
                </div>
              </div>
              {isAnalyzingStyle && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-700">
                  <WandSparkles className="h-4 w-4 animate-spin" />
                  Đang đọc ảnh mẫu và tạo prompt phong cách. Bạn có thể tiếp tục thao tác ở phần khác.
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {styleChoices.map((style) => {
                  const selected = props.imageStyle === style.prompt;
                  return (
                    <div
                      key={style.id}
                      className={`group relative overflow-hidden rounded-xl border text-left transition ${selected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200 bg-white hover:border-indigo-300"}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          applyStyle(style.prompt);
                          setStylePickerOpen(false);
                        }}
                        className="block w-full text-left"
                      >
                        <div
                          className="relative h-28 overflow-hidden bg-slate-800"
                          style={
                            style.previewImage
                              ? {
                                  backgroundImage: `url("${style.previewImage}")`,
                                  backgroundPosition: "center",
                                  backgroundSize: "cover",
                                }
                              : undefined
                          }
                        >
                          <div className="relative flex h-full items-end bg-gradient-to-t from-black/75 to-transparent p-2">
                            <span className="text-[11px] font-black text-white">
                              {style.name}
                            </span>
                          </div>
                        </div>
                        <p className="min-h-12 p-2.5 text-[10px] leading-relaxed text-slate-500">
                          {style.desc}
                        </p>
                      </button>
                      {!style.builtIn && (
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setEditingStyle(style)}
                            className="rounded bg-black/70 p-1.5 text-white"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomStyles((items) =>
                                items.filter((item) => item.id !== style.id),
                              )
                            }
                            className="rounded bg-rose-600 p-1.5 text-white"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {editingStyle && (
                <div className="mt-4 rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800">
                      {customStyles.some((item) => item.id === editingStyle.id)
                        ? "Sửa phong cách"
                        : "Thêm phong cách mới"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingStyle(null)}
                      className="text-xs font-bold text-slate-500"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Tên phong cách">
                      <Input
                        value={editingStyle.name}
                        onChange={(e) =>
                          setEditingStyle({
                            ...editingStyle,
                            name: e.target.value,
                          })
                        }
                        placeholder="Ví dụ: Stop motion giấy"
                      />
                    </Field>
                    <Field label="Mô tả ngắn">
                      <Input
                        value={editingStyle.desc}
                        onChange={(e) =>
                          setEditingStyle({
                            ...editingStyle,
                            desc: e.target.value,
                          })
                        }
                        placeholder="Mô tả để dễ chọn"
                      />
                    </Field>
                  </div>
                  <Field label="Prompt phong cách">
                    <textarea
                      value={editingStyle.prompt}
                      onChange={(e) =>
                        setEditingStyle({
                          ...editingStyle,
                          prompt: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 outline-none focus:border-indigo-400"
                      placeholder="Ví dụ: handcrafted stop-motion paper animation..."
                    />
                  </Field>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {editingStyle.previewImage ? (
                      <img
                        src={editingStyle.previewImage}
                        className="h-20 w-36 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-36 items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-400">
                        Chưa có demo 16:9
                      </div>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700">
                      <ImagePlus className="h-3.5 w-3.5" />
                      Dùng ảnh làm preview
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void uploadStylePreview(e.target.files)}
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700">
                      <WandSparkles className={`h-3.5 w-3.5 ${isAnalyzingStyle ? "animate-spin" : ""}`} />
                      {isAnalyzingStyle ? "Đang lấy style..." : "AI lấy style từ ảnh"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => uploadStyleDemo(e.target.files)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isCreatingDemo}
                      onClick={generateStyleDemo}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-black text-violet-700 disabled:opacity-50"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      {isCreatingDemo ? "Đang tạo demo..." : "Tạo ảnh demo"}
                    </button>
                    <button
                      type="button"
                      onClick={saveStyle}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-black text-white"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Lưu phong cách
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    Nếu đã có tên và prompt, chọn “Dùng ảnh làm preview” để không gọi AI.
                    Chỉ chọn “AI lấy style từ ảnh” khi muốn AI phân tích và tạo prompt mới.
                  </p>
                </div>
              )}
            </div>
            <Field label="Mô tả phong cách đang dùng">
              <textarea
                value={props.imageStyle}
                onChange={(e) => props.setImageStyle(e.target.value)}
                rows={4}
                placeholder="Mô tả phong cách đồng nhất cho tất cả cảnh..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 outline-none focus:border-indigo-400"
              />
            </Field>
          </div>
        )}

        {workspaceMode === "setup" && activeTab === "scenes" && (
          <section className="mb-4 space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-violet-950">
                  Video hội thoại có tiếng trực tiếp
                </h4>
                <p className="mt-1 text-[11px] text-violet-800">
                  Tự nhận diện vai, tạo tiếng nói phù hợp và giữ tiếng gốc từng
                  đoạn để ghép video hoàn chỉnh.
                </p>
              </div>
              <Toggle
                checked={config.dialogueVideoMode}
                onChange={(value) => {
                  update("dialogueVideoMode", value);
                  if (value) {
                    update("generateType", "video");
                    update("promptFocus", "video");
                  }
                }}
                label="Bật chế độ hội thoại"
              />
            </div>
            {config.dialogueVideoMode && (
              <>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <Toggle
                    checked={config.lockedKeyframesPipeline}
                    onChange={(value) => update("lockedKeyframesPipeline", value)}
                    label="Tự động tạo ảnh khóa trước → Image-to-Video"
                  />
                  <p className="mt-2 text-[10px] leading-relaxed text-emerald-800">
                    Tạo và lưu một keyframe 9:16 cho mỗi cảnh, sau đó dùng chính ảnh đó làm startImage của video. Mặc định tắt và không ảnh hưởng quy trình cũ.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Toggle
                    checked={config.keepVideoAudio}
                    onChange={(value) => update("keepVideoAudio", value)}
                    label="Giữ tiếng gốc trong video"
                  />
                  <Field label="Ghép cảnh">
                    <Select
                      value={config.clipTransition}
                      onChange={(event) =>
                        update("clipTransition", event.target.value)
                      }
                    >
                      <option value="cut">Cắt thẳng theo timeline voice</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Chỉ dẫn giọng nhân vật (tùy chọn)">
                  <textarea
                    rows={2}
                    value={config.dialogueVoiceGuide}
                    onChange={(event) =>
                      update("dialogueVoiceGuide", event.target.value)
                    }
                    placeholder="Để AI tự tạo giọng theo kịch bản, hoặc nhập chỉ dẫn của bạn..."
                    className="w-full rounded-xl border border-violet-200 bg-white p-3 text-xs text-slate-700 outline-none focus:border-violet-500"
                  />
                </Field>
                <Field label="Hồ sơ nhân vật xuyên suốt (tùy chọn)">
                  <textarea
                    rows={3}
                    value={config.characterBible}
                    onChange={(event) =>
                      update("characterBible", event.target.value)
                    }
                    placeholder="Để AI tự tạo hồ sơ nhân vật, hoặc nhập mô tả nhân vật của bạn..."
                    className="w-full rounded-xl border border-violet-200 bg-white p-3 text-xs text-slate-700 outline-none focus:border-violet-500"
                  />
                </Field>
                <p className="text-[10px] font-semibold text-violet-800">
                  Bước tạo voice sẽ được bỏ qua; âm thanh video AI là âm thanh
                  cuối cùng.
                </p>
              </>
            )}
          </section>
        )}

        {workspaceMode === "setup" && activeTab === "media" && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Loại file sinh ra">
                <Select
                  value={config.generateType}
                  onChange={(e) =>
                    update(
                      "generateType",
                      e.target.value as AutoConfig["generateType"],
                    )
                  }
                >
                  <option value="image">Hình ảnh</option>
                  <option value="video">Video động</option>
                </Select>
              </Field>
              <Field label="Nền tảng tạo">
                <Select
                  value={config.generationMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setConfig((previous) => ({
                      ...previous,
                      generationMode: mode,
                      chromeThreads:
                        mode === "viettheo-api" ? 7 : previous.chromeThreads,
                      imageEngine:
                        mode === "gemini-chat"
                          ? "3.1 Flash-Lite"
                          : mode === "labs-flow"
                            ? "Nano Banana 2 Lite"
                            : "NANO_BANANA",
                      videoEngine: "Veo 3.1 - Lite",
                    }));
                  }}
                >
                  <option value="viettheo-api">
                    API Flow — Liên hệ Admin để mua key
                  </option>
                  <option value="gemini-chat">Gemini Chat</option>
                  <option value="labs-flow">Google Labs / Flow</option>
                </Select>
              </Field>
              <Field label="Tỉ lệ khung hình">
                <Select
                  value={config.aspectRatio}
                  onChange={(e) => update("aspectRatio", e.target.value)}
                >
                  <option value="16:9">16:9 — YouTube ngang</option>
                  <option value="9:16">9:16 — Shorts/TikTok</option>
                  <option value="1:1">1:1 — Vuông</option>
                </Select>
              </Field>
              {config.generateType === "image" ? (
                <Field label="Model tạo ảnh">
                  <Select
                    value={config.imageEngine}
                    onChange={(e) => update("imageEngine", e.target.value)}
                  >
                    {config.generationMode === "gemini-chat" ? (
                      <>
                        <option value="3.1 Flash-Lite">3.1 Flash-Lite</option>
                        <option value="3.5 Flash">3.5 Flash</option>
                        <option value="3.1 Pro">3.1 Pro</option>
                        <option value="Tư duy mở rộng">Tư duy mở rộng</option>
                      </>
                    ) : config.generationMode === "labs-flow" ? (
                      <>
                        <option value="Nano Banana Pro">Nano Banana Pro</option>
                        <option value="Nano Banana 2">Nano Banana 2</option>
                        <option value="Nano Banana 2 Lite">
                          Nano Banana 2 Lite
                        </option>
                      </>
                    ) : (
                      <>
                        <option value="NANO_BANANA_PRO">NANO_BANANA_PRO</option>
                        <option value="NANO_BANANA">NANO_BANANA</option>
                      </>
                    )}
                  </Select>
                </Field>
              ) : (
                config.generationMode === "viettheo-api" ? (
                  <Field label="Chất lượng video API">
                    <Select
                      value={config.viettheoVideoQuality}
                      onChange={(e) => update("viettheoVideoQuality", e.target.value as "LITE" | "HIGH")}
                    >
                      <option value="LITE">LITE — nhanh, tiết kiệm</option>
                      <option value="HIGH">HIGH — chất lượng cao</option>
                    </Select>
                  </Field>
                ) : (
                  <Field label="Model tạo video">
                    <Select
                      value={config.videoEngine}
                      onChange={(e) => {
                        const videoEngine = e.target.value;
                        setConfig((previous) => ({
                          ...previous,
                          videoEngine,
                          videoDuration:
                            (videoEngine === "Veo 3.1 - Lite" ||
                              videoEngine === "Veo 3.1 - Lite [Lower Priority]") &&
                            !["4s", "6s", "8s"].includes(previous.videoDuration)
                              ? "8s"
                              : previous.videoDuration,
                        }));
                      }}
                    >
                      <option value="Omni Flash">Omni Flash</option>
                      <option value="Veo 3.1 - Lite">Veo 3.1 Lite</option>
                      <option value="Veo 3.1 - Lite [Lower Priority]">
                        Veo 3.1 Lite [Lower Priority] — Ultra
                      </option>
                      <option value="Veo 3.1 - Fast">Veo 3.1 Fast</option>
                      <option value="Veo 3.1 - Quality">Veo 3.1 Quality</option>
                    </Select>
                  </Field>
                )
              )}
              {props.twoStage ? (
                <Toggle
                  checked={config.chromeHeadless}
                  onChange={(value) => update("chromeHeadless", value)}
                  label="Chạy Chrome ẩn"
                />
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-black text-emerald-700">
                  <Check className="h-4 w-4" /> Chrome luôn chạy ẩn trong chế độ
                  tự động
                </div>
              )}
              <Field label={config.generationMode === "viettheo-api" ? "Số luồng API (tối đa 7)" : "Số Chrome / luồng"}>
                <Input
                  type="number"
                  min={1}
                  max={config.generationMode === "viettheo-api" ? 7 : 10}
                  value={config.chromeThreads}
                  onChange={(e) =>
                    update("chromeThreads", Number(e.target.value) || 1)
                  }
                />
              </Field>
              <Field label="Số tab mỗi Chrome">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={config.tabsPerChrome}
                  onChange={(e) =>
                    update("tabsPerChrome", Number(e.target.value) || 1)
                  }
                />
              </Field>
              <Toggle
                checked={config.noText}
                onChange={(value) => update("noText", value)}
                label="Không có text"
              />
              <Toggle
                checked={config.noBlackBorder}
                onChange={(value) => update("noBlackBorder", value)}
                label="Không viền đen"
              />
              <Toggle
                checked={config.noWallPicture}
                onChange={(value) => update("noWallPicture", value)}
                label="Không lỗi ảnh tường"
              />
              <Toggle
                checked={config.removeAiWatermark}
                onChange={(value) => update("removeAiWatermark", value)}
                label="Làm sạch watermark AI"
              />
              {config.removeAiWatermark && (
                <Field label="Chất lượng xóa watermark">
                  <Select
                    value={config.watermarkBackend}
                    onChange={(event) => update("watermarkBackend", event.target.value as "cv2" | "migan")}
                  >
                    <option value="migan">Đẹp hơn — MI-GAN</option>
                    <option value="cv2">Nhanh — OpenCV</option>
                  </Select>
                </Field>
              )}
            </div>
            <section className="relative overflow-hidden rounded-2xl border-2 border-violet-400 bg-gradient-to-r from-violet-100 via-fuchsia-50 to-amber-50 p-4 shadow-lg shadow-violet-100 ring-1 ring-violet-200">
                <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white">
                  Nâng cao
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">Dự phòng video lỗi</p>
                    <p className="mt-1 text-base font-black text-slate-950">Thay video tạo lỗi bằng ảnh đúng vị trí</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      Mỗi video được thử tối đa 3 lần. Nếu vẫn lỗi, tool tạo một ảnh thay thế và đặt ảnh đó vào đúng slot media; khi render, ảnh được giữ đúng thời lượng của đoạn kịch bản/voice tương ứng. Tool không chuyển ảnh thành video trước. Lỗi hết credit/quota vẫn dừng và báo rõ.
                    </p>
                  </div>
                  {config.generateType === "video" ? (
                    <Toggle
                      checked={config.fallbackFailedVideosToImages}
                      onChange={(value) => update("fallbackFailedVideosToImages", value)}
                      label="Bật thay video lỗi bằng ảnh"
                    />
                  ) : (
                    <div className="rounded-xl border-2 border-amber-300 bg-amber-100 px-4 py-3 text-xs font-black text-amber-900 shadow-sm">
                      Chọn “Video” ở Loại file sinh ra để bật tính năng
                    </div>
                  )}
                </div>
              </section>
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-relaxed text-amber-950">
              <p className="font-black">Lưu ý logo / watermark theo nền tảng</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>
                  <b>Google Labs / Flow:</b> tạo ảnh bằng tài khoản Pro hoặc
                  Ultra không có logo; tạo video Pro có logo, Ultra không có
                  logo.
                </li>
                <li>
                  <b>Gemini Chat:</b> tài khoản Pro tạo ảnh và video có logo;
                  Ultra tạo ảnh và video không có logo.
                </li>
                <li>
                  Tool chỉ gửi prompt/model bạn đã chọn; watermark là chính sách
                  tài khoản của nền tảng và có thể thay đổi theo Google.
                </li>
              </ul>
            </section>
            <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-violet-950">
                    Video hội thoại có tiếng trực tiếp
                  </h4>
                  <p className="mt-1 text-[11px] text-violet-800">
                    Tự nhận diện vai trong kịch bản, tạo tiếng nói phù hợp và
                    giữ tiếng gốc từng đoạn để ghép video hoàn chỉnh.
                  </p>
                </div>
                <Toggle
                  checked={config.dialogueVideoMode}
                  onChange={(value) => {
                    update("dialogueVideoMode", value);
                    if (value) {
                      update("generateType", "video");
                      update("promptFocus", "video");
                    }
                  }}
                  label="Bật chế độ hội thoại"
                />
              </div>
              {config.dialogueVideoMode && (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Toggle
                      checked={config.keepVideoAudio}
                      onChange={(value) => update("keepVideoAudio", value)}
                      label="Giữ tiếng gốc trong video"
                    />
                    <Field label="Ghép cảnh">
                      <Select
                        value={config.clipTransition}
                        onChange={(e) =>
                          update("clipTransition", e.target.value)
                        }
                      >
                        <option value="cut">Cắt thẳng theo timeline voice</option>
                      </Select>
                    </Field>
                  </div>
                  <Field
                    label="Chỉ dẫn giọng nhân vật (tùy chọn)"
                    hint="Để trống: AI tự nhận diện nhân vật, độ tuổi, giới tính và cảm xúc từ kịch bản. Có thể nhập chỉ dẫn chung hoặc phân vai, ví dụ: “Người kể trầm ấm; nhân vật phản diện giọng khàn; bé gái lanh lảnh.”"
                  >
                    <textarea
                      rows={2}
                      value={config.dialogueVoiceGuide}
                      onChange={(e) =>
                        update("dialogueVoiceGuide", e.target.value)
                      }
                      className="w-full rounded-xl border border-violet-200 bg-white p-3 text-xs text-slate-700 outline-none focus:border-violet-500"
                      placeholder="Để AI tự tạo giọng theo kịch bản, hoặc nhập chỉ dẫn giọng của bạn..."
                    />
                  </Field>
                  <Field
                    label="Hồ sơ nhân vật xuyên suốt (tùy chọn)"
                    hint="Để trống: AI tự khóa diện mạo các nhân vật từ kịch bản. Tải ảnh tham chiếu bên dưới nếu muốn khóa chính xác hơn."
                  >
                    <textarea
                      rows={3}
                      value={config.characterBible}
                      onChange={(e) => update("characterBible", e.target.value)}
                      className="w-full rounded-xl border border-violet-200 bg-white p-3 text-xs text-slate-700 outline-none focus:border-violet-500"
                      placeholder="Để AI tự tạo hồ sơ nhân vật, hoặc nhập mô tả nhân vật của bạn..."
                    />
                  </Field>
                  <p className="text-[10px] font-semibold text-violet-800">
                    Bước tạo Voice sẽ được bỏ qua; âm thanh của các video AI là
                    âm thanh cuối cùng.
                  </p>
                </>
              )}
            </section>
            <div className="space-y-1.5">
              <span className="block text-[11px] font-extrabold text-slate-700">
                Ảnh tham chiếu chung (tối đa 3 ảnh, mỗi ảnh dưới 4 MB)
              </span>
              <div className="flex flex-wrap gap-3">
                {referenceImages.map((src, index) => (
                  <div
                    key={index}
                    className="relative h-20 w-20 overflow-hidden rounded-xl border bg-white"
                  >
                    <img src={src} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setReferenceImages((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {referenceImages.length < 3 && (
                  <label className="flex h-20 w-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-indigo-300 bg-indigo-50 text-[11px] font-bold text-indigo-700">
                    + Thêm ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => uploadReferences(e.target.files)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {workspaceMode === "setup" && workflowStep === 3 && (
          <div className="grid gap-3 rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm lg:grid-cols-2">
            <section className={`rounded-2xl border p-3 ${activeTab === "voice" ? "border-emerald-300 bg-emerald-50/70" : "border-slate-200 bg-slate-50"}`}>
              <button type="button" onClick={() => setActiveTab("voice")} className="w-full rounded-xl bg-white px-4 py-3 text-left shadow-sm transition hover:shadow-md">
                <span className="block text-xs font-black text-emerald-700">NHÓM VOICE</span>
                <span className="mt-1 block text-[11px] text-slate-500">Thiết lập giọng đọc và thao tác tạo lại Voice.</span>
              </button>
              <button type="button" disabled={props.isRunning || props.voiceRegenerating || !props.finalizedScript.trim()} onClick={() => props.onRunVoiceOnly?.()} className="mt-2 w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                <span className="inline-flex items-center justify-center gap-2">{props.voiceRegenerating && <RefreshCw className="h-4 w-4 animate-spin" />}{props.voiceRegenerating ? `ĐANG TẠO LẠI VOICE... ${Math.round(props.voiceRegenerateProgress || 0)}%` : "TẠO LẠI RIÊNG VOICE"}</span>
              </button>
            </section>
            <section className={`rounded-2xl border p-3 ${activeTab === "seo" ? "border-violet-300 bg-violet-50/70" : "border-slate-200 bg-slate-50"}`}>
              <button type="button" onClick={() => setActiveTab("seo")} className="w-full rounded-xl bg-white px-4 py-3 text-left shadow-sm transition hover:shadow-md">
                <span className="block text-xs font-black text-violet-700">NHÓM SEO & THUMBNAIL</span>
                <span className="mt-1 block text-[11px] text-slate-500">Hai thao tác con độc lập, dùng chung thiết lập SEO & ảnh bìa.</span>
              </button>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button type="button" disabled={props.isRunning || props.seoRegenerating || !props.finalizedScript.trim()} onClick={() => props.onRunSeoOnly?.()} className="rounded-xl bg-violet-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-violet-100 transition hover:bg-violet-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="inline-flex items-center justify-center gap-2">{props.seoRegenerating && <RefreshCw className="h-4 w-4 animate-spin" />}{props.seoRegenerating ? `ĐANG TẠO LẠI SEO... ${Math.round(props.seoRegenerateProgress || 0)}%` : "TẠO LẠI SEO"}</span>
                </button>
                <button type="button" disabled={props.isRunning || props.thumbnailRegenerating || !props.reviewSeo?.thumbnailConcept?.imagePrompt} onClick={() => props.onRunThumbnailOnly?.()} className="rounded-xl bg-fuchsia-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-fuchsia-100 transition hover:bg-fuchsia-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="inline-flex items-center justify-center gap-2">{props.thumbnailRegenerating && <RefreshCw className="h-4 w-4 animate-spin" />}{props.thumbnailRegenerating ? `ĐANG TẠO THUMBNAIL... ${Math.round(props.thumbnailRegenerateProgress || 0)}%` : "TẠO LẠI THUMBNAIL"}</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {workspaceMode === "setup" && workflowStep === 4 && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-bold text-indigo-900">
            Bước này chỉ render và xuất video cuối. Tool sẽ báo rõ dữ liệu còn thiếu ở bước nào trước khi chạy.
          </div>
        )}

        {workspaceMode === "setup" && activeTab === "voice" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800">
                Giọng đọc hoặc voice đã tạo sẵn
              </h3>
              <p className="mt-1 text-[11px] text-slate-500">
                Dùng giọng Premium của tool, hoặc lấy đúng kịch bản đã chốt để
                tạo voice bên ngoài rồi tải file về đây.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div
                className={`rounded-2xl border p-4 text-left transition ${config.voiceProvider === "external" ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800">
                    Voice tạo sẵn bên ngoài
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
                    DÙNG FILE CỦA BẠN
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Copy nguyên văn kịch bản hiện tại để tạo voice ngoài tool.
                  File tải lên được chuẩn hóa thành <b>voice_original.mp3</b> để
                  Whisper cắt đúng timeline.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyExternalVoiceScript}
                    className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-[11px] font-black text-emerald-700"
                  >
                    Copy kịch bản tạo voice
                  </button>
                  <label className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-black text-white">
                    Tải voice lên
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                      className="hidden"
                      onChange={(event) =>
                        void uploadExternalVoice(event.target.files?.[0])
                      }
                    />
                  </label>
                </div>
                {externalVoiceUrl && (
                  <div className="mt-3 rounded-lg bg-white p-2">
                    <p className="mb-1 text-[10px] font-bold text-emerald-700">
                      Đã dùng: {externalVoiceName || "voice_original.mp3"}
                    </p>
                    <audio
                      controls
                      src={externalVoiceUrl}
                      className="h-8 w-full"
                    />
                  </div>
                )}
              </div>
              <div
                className={`rounded-2xl border p-4 text-left transition ${config.voiceProvider === "premium" ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800">
                    Giọng Premium
                  </span>
                  <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-black text-violet-700">
                    CẦN API
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Nhiều nền tảng, nhiều model, có tìm kiếm, lọc và nghe thử.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      update("voiceProvider", "premium");
                      setVoiceLibraryOpen(true);
                    }}
                    className="rounded-lg bg-violet-600 px-3 py-2 text-[11px] font-black text-white"
                  >
                    Mở thư viện giọng
                  </button>
                  <span className="self-center text-[11px] font-black text-violet-700">
                    API đã cấu hình sẽ được dùng tự động
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-white/80 px-3 py-2 text-[11px] font-semibold text-violet-800">
                  <span>Cần mua API Voice Premium hoặc API Flow?</span>
                  <a
                    href="https://zalo.me/0976293994"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 font-black text-violet-700"
                  >
                    Liên hệ Zalo
                  </a>
                  <a
                    href="https://t.me/leo4309"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-violet-600 px-2.5 py-1.5 font-black text-white"
                  >
                    Liên hệ Telegram
                  </a>
                </div>
              </div>
            </div>
            {config.voiceProvider !== "external" && (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Giọng đọc">
                  <Select
                    value={config.voiceModel || props.selectedVoice || "Zephyr"}
                    onChange={(e) => {
                      update("voiceModel", e.target.value);
                      props.setSelectedVoice(e.target.value);
                    }}
                  >
                    {config.voiceModel && (
                      <option value={config.voiceModel}>
                        {config.voiceModel} — giọng Premium đã chọn
                      </option>
                    )}
                    <option value="Zephyr">Zephyr</option>
                    <option value="Puck">Puck</option>
                    <option value="Charon">Charon</option>
                    <option value="Kore">Kore</option>
                    <option value="Fenrir">Fenrir</option>
                    <option value="Aoede">Aoede</option>
                  </Select>
                </Field>
                <Field label="Tốc độ">
                  <Select
                    value={config.voiceSpeed}
                    onChange={(e) => update("voiceSpeed", e.target.value)}
                  >
                    <option value="0.85">0.85× — chậm</option>
                    <option value="1.0">1.0× — tự nhiên</option>
                    <option value="1.1">1.1× — nhanh</option>
                    <option value="1.2">1.2× — rất nhanh</option>
                  </Select>
                </Field>
                <Field label="Cao độ">
                  <Select
                    value={config.voicePitch}
                    onChange={(e) => update("voicePitch", e.target.value)}
                  >
                    <option value="-2">Trầm</option>
                    <option value="0">Tự nhiên</option>
                    <option value="2">Cao</option>
                  </Select>
                </Field>
                <Field label="Cảm xúc">
                  <Select
                    value={config.voiceEmotion}
                    onChange={(e) => update("voiceEmotion", e.target.value)}
                  >
                    <option value="natural">Tự nhiên</option>
                    <option value="warm">Ấm áp</option>
                    <option value="dramatic">Kịch tính</option>
                    <option value="energetic">Năng lượng</option>
                    <option value="serious">Nghiêm túc</option>
                  </Select>
                </Field>
              </div>
            )}
          </div>
        )}
        <VoiceSelectionDialog
          isOpen={voiceLibraryOpen}
          onClose={() => setVoiceLibraryOpen(false)}
          currentLang={props.language === "en" ? "en" : "vi"}
          selectedVoiceId={config.voiceId}
          onSelectVoice={(voice: Voice) => {
            update("voiceProvider", "premium");
            update("voiceId", voice.voice_id);
            update("voiceModel", voice.name);
            props.setSelectedVoice(voice.name);
            setVoiceLibraryOpen(false);
          }}
        />

        {workspaceMode === "setup" && activeTab === "seo" && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Phong cách tiêu đề">
              <Select
                value={config.seoTone}
                onChange={(e) => update("seoTone", e.target.value)}
              >
                <option value="curiosity">Tò mò, CTR cao</option>
                <option value="authority">Uy tín, chuyên gia</option>
                <option value="emotional">Cảm xúc</option>
                <option value="direct">Trực tiếp, rõ lợi ích</option>
              </Select>
            </Field>
            <Field label="Từ khóa mục tiêu">
              <Input
                value={config.targetKeywords}
                onChange={(e) => update("targetKeywords", e.target.value)}
                placeholder="Phân cách bằng dấu phẩy"
              />
            </Field>
            <Toggle
              checked={config.includeTracklist}
              onChange={(value) => update("includeTracklist", value)}
              label="Thêm tracklist"
            />
            <Toggle
              checked={config.includeChapters}
              onChange={(value) => update("includeChapters", value)}
              label="Chia chương video"
            />
            <Field label="Phong cách Thumbnail">
              <Select
                value={config.thumbnailStyle}
                onChange={(e) => update("thumbnailStyle", e.target.value)}
              >
                <option value="from-step3">
                  Mặc định lấy phong cách Bước 2
                </option>
                <option value="high-ctr">Tương phản mạnh, CTR cao</option>
                <option value="minimal">Tối giản</option>
                <option value="cinematic">Điện ảnh</option>
              </Select>
            </Field>
          </div>
        )}

        {workspaceMode === "setup" && activeTab === "seo" && (
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:items-end">
              <Toggle
                checked={props.thumbnailHasText}
                onChange={props.setThumbnailHasText}
                label="Hiển thị chữ trên thumbnail"
              />
              {props.thumbnailHasText && (
                <Field
                  label="Chữ tự nhập trên thumbnail"
                  hint="Để trống để AI tự đề xuất từ tiêu đề video."
                >
                  <Input
                    value={props.thumbnailCustomText}
                    onChange={(event) =>
                      props.setThumbnailCustomText(event.target.value)
                    }
                    maxLength={48}
                    placeholder="Ví dụ: SỰ THẬT BẤT NGỜ"
                  />
                </Field>
              )}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Mốc chương sẽ lấy từ bước Cắt ghép âm thanh/video sau khi timeline
              đã được chốt. Tracklist đã được bỏ.
            </p>
          </section>
        )}

        {workspaceMode === "setup" && activeTab === "render" && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Nguồn ghép">
                <Select
                  value={config.renderSource}
                  onChange={(e) => update("renderSource", e.target.value)}
                >
                  <option value="auto">Tự nhận ảnh/video đã tạo</option>
                  <option value="image">Chỉ dùng ảnh</option>
                  <option value="video">Chỉ dùng video</option>
                </Select>
              </Field>
              <Field label="Độ phân giải">
                <Select
                  value={config.resolution}
                  onChange={(e) => update("resolution", e.target.value)}
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p FHD</option>
                  <option value="4k">4K UHD</option>
                </Select>
              </Field>
              <Toggle
                checked={config.motionEnabled}
                onChange={(value) => update("motionEnabled", value)}
                label="Hiệu ứng chuyển động ảnh"
              />
              <Field label="Kiểu chuyển động">
                <Select
                  value={config.motionStyle}
                  onChange={(e) => update("motionStyle", e.target.value)}
                >
                  <option value="auto">Luân phiên 10 hiệu ứng</option>
                  <option value="zoom_in_center">Zoom vào</option>
                  <option value="zoom_out_center">Zoom ra</option>
                  <option value="pan_l_to_r">Pan trái → phải</option>
                  <option value="pan_r_to_l">Pan phải → trái</option>
                  <option value="pan_t_to_b">Pan trên → dưới</option>
                  <option value="diagonal_tl_to_br">Pan chéo</option>
                </Select>
              </Field>
              <Field label="Tốc độ hiệu ứng">
                <Select
                  value={config.motionIntensity}
                  onChange={(e) => update("motionIntensity", e.target.value)}
                >
                  <option value="gentle">Nhẹ nhàng</option>
                  <option value="natural">Tự nhiên</option>
                  <option value="dynamic">Năng động</option>
                </Select>
              </Field>
              <Toggle
                checked={config.subtitleEnabled}
                onChange={(value) => update("subtitleEnabled", value)}
                label="Tạo phụ đề từ lời thoại Bước 2"
              />
              <Field label="Mẫu phụ đề">
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <Select value={config.subtitleStyle} onChange={(event) => update("subtitleStyle", event.target.value)}>
                      {LEGACY_SUBTITLE_STYLE_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>{preset.label} — {preset.motion}</option>
                      ))}
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubtitlePickerOpen((value) => !value)}
                    className="hidden"
                  >
                    {subtitlePickerOpen ? "Thu gọn" : "Xem preview"}
                  </button>
                </div>
                {false && subtitlePickerOpen && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                    {SUBTITLE_STYLE_PRESETS.map((preset) => {
                      const selected = config.subtitleStyle === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => { update("subtitleStyle", preset.value); setSubtitlePickerOpen(false); }}
                          className={`group overflow-hidden rounded-xl border p-1.5 text-left transition-all ${selected ? "border-cyan-400 bg-cyan-50 shadow-[0_0_0_2px_rgba(34,211,238,.16)]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"}`}
                        >
                          <span className="flex min-h-[74px] items-center justify-center rounded-lg bg-[#171717] px-2 text-center">
                            <span className={`font-black uppercase leading-[1.02] tracking-tight text-white [text-shadow:0_2px_0_#000,2px_0_0_#000,-2px_0_0_#000,0_-2px_0_#000] ${preset.italic ? "italic" : ""}`}>
                              {preset.sample.map((line, index) => (
                                <React.Fragment key={`${preset.value}-${line}`}>
                                  <span className={index === preset.sample.length - 1 ? preset.accent : ""}>{line}</span>
                                  {index < preset.sample.length - 1 && <br />}
                                </React.Fragment>
                              ))}
                            </span>
                          </span>
                          <span className="mt-1.5 block truncate px-1 text-[10px] font-extrabold text-slate-700">{preset.label}</span>
                          <span className="block truncate px-1 pb-1 text-[9px] text-slate-500">{preset.motion}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Field>
              <Field label="Vị trí phụ đề">
                <Select
                  value={config.subtitlePosition}
                  onChange={(e) => update("subtitlePosition", e.target.value)}
                >
                  <option value="bottom">Phía dưới</option>
                  <option value="middle">Chính giữa</option>
                  <option value="top">Phía trên</option>
                </Select>
              </Field>
              <Field
                label="Nhạc nền"
                hint="Chọn nhạc từ máy để trộn khi render. Voice giữ nguyên 100%, nhạc nền mặc định 18% và tự lặp đến hết video."
              >
                <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-black text-slate-700">
                    <input
                      type="checkbox"
                      checked={config.backgroundMusicEnabled}
                      onChange={(event) => update("backgroundMusicEnabled", event.target.checked)}
                      className="h-4 w-4 accent-violet-600"
                    />
                    Chèn nhạc nền vào video cuối
                  </label>
                  {config.backgroundMusicEnabled && (
                    <>
                      <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1 shadow-sm">
                        {([
                          ["file", "Một file"],
                          ["folder", "Thư mục random"],
                        ] as const).map(([mode, label]) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => update("backgroundMusicMode", mode)}
                            className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                              config.backgroundMusicMode === mode
                                ? "bg-violet-600 text-white shadow"
                                : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {config.backgroundMusicMode === "folder" ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={config.backgroundMusicFolder}
                              readOnly
                              placeholder="Chưa chọn thư mục nhạc nền"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const response = await fetch(
                                  "/api/dialog/pick?mode=dir&title=Ch%E1%BB%8Dn%20th%C6%B0%20m%E1%BB%A5c%20nh%E1%BA%A1c%20n%E1%BB%81n",
                                );
                                const data = await response.json();
                                if (data.success && data.path) update("backgroundMusicFolder", String(data.path));
                              }}
                              className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-violet-700 active:scale-95"
                            >
                              Chọn thư mục
                            </button>
                          </div>
                          <p className="rounded-lg border border-violet-100 bg-white px-3 py-2 text-[10px] leading-relaxed text-slate-600">
                            Mỗi video tự chọn một bài. Tool ưu tiên bài ít được dùng và tránh các bài vừa chọn để tỷ lệ trùng thấp nhất.
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                        <Input
                          value={config.backgroundMusicPath}
                          readOnly
                          placeholder="Chưa chọn file MP3, WAV, M4A, AAC, OGG hoặc FLAC"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const response = await fetch(
                              "/api/dialog/pick?mode=file&title=Ch%E1%BB%8Dn%20nh%E1%BA%A1c%20n%E1%BB%81n",
                            );
                            const data = await response.json();
                            if (data.success && data.path) update("backgroundMusicPath", String(data.path));
                          }}
                          className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-violet-700 active:scale-95"
                        >
                          Tải nhạc lên
                        </button>
                        </div>
                      )}
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
                          <span>Âm lượng nhạc nền</span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-violet-700">{config.backgroundMusicVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="1"
                          value={config.backgroundMusicVolume}
                          onChange={(event) => update("backgroundMusicVolume", Number(event.target.value))}
                          className="w-full accent-violet-600"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">Khuyến nghị 12–25% để nhạc không lấn giọng đọc.</p>
                      </div>
                    </>
                  )}
                </div>
              </Field>
              <Field label="Watermark">
                <Select
                  value={config.watermarkType}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setConfig((previous) => ({
                      ...previous,
                      watermarkType: nextType,
                      watermarkPath:
                        nextType === "image" && !previous.watermarkPath
                          ? DEFAULT_WATERMARK_PATH
                          : previous.watermarkPath,
                    }));
                  }}
                >
                  <option value="none">Không dùng</option>
                  <option value="image">Logo hình ảnh</option>
                  <option value="text">Logo dạng chữ</option>
                </Select>
              </Field>
              {config.watermarkType === "text" && (
                <Field label="Chữ watermark">
                  <Input
                    value={config.watermarkText}
                    onChange={(e) => update("watermarkText", e.target.value)}
                  />
                </Field>
              )}
              {config.watermarkType === "image" && (
                <Field
                  label="File logo watermark"
                  hint="Chọn ảnh PNG nền trong suốt hoặc JPG trên máy. Logo này sẽ được chèn khi xuất video."
                >
                  <div className="flex gap-2">
                    <Input
                      value={
                        config.watermarkPath === DEFAULT_WATERMARK_PATH
                          ? "Logo VidiFlow mặc định"
                          : config.watermarkPath
                      }
                      readOnly
                      placeholder="Chưa chọn file logo PNG/JPG"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const response = await fetch(
                          "/api/dialog/pick?mode=file&title=Ch%E1%BB%8Dn%20logo%20watermark",
                        );
                        const data = await response.json();
                        if (data.success && data.path) {
                          update("watermarkPath", String(data.path));
                        }
                      }}
                      className="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-700 transition hover:border-violet-400 hover:bg-violet-100 active:scale-95"
                    >
                      Tải logo lên
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
                    <img
                      src={
                        !config.watermarkPath || config.watermarkPath === DEFAULT_WATERMARK_PATH
                          ? "/brand/vidiflow-logo.png"
                          : `/api/serve-local-file?path=${encodeURIComponent(config.watermarkPath)}`
                      }
                      alt="Xem trước logo watermark"
                      className="h-12 w-12 rounded-lg object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-slate-700">Logo sẽ được chèn khi xuất video</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">Nếu không tải logo riêng, tool tự dùng logo VidiFlow mặc định.</p>
                    </div>
                    {config.watermarkPath !== DEFAULT_WATERMARK_PATH && (
                      <button type="button" onClick={() => update("watermarkPath", DEFAULT_WATERMARK_PATH)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-black text-slate-600">Dùng logo mặc định</button>
                    )}
                  </div>
                </Field>
              )}
              <Field label="Vị trí watermark">
                <Select
                  value={config.watermarkPosition}
                  onChange={(e) => update("watermarkPosition", e.target.value)}
                >
                  <option value="bottom-right">Dưới phải</option>
                  <option value="bottom-left">Dưới trái</option>
                  <option value="top-right">Trên phải</option>
                  <option value="top-left">Trên trái</option>
                </Select>
              </Field>
            </div>
          </div>
        )}
      </div>

      {workspaceMode === "setup" && (
        <div className="fixed bottom-5 left-1/2 z-[80] flex w-[min(720px,calc(100vw-32px))] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-white/95 p-2.5 shadow-[0_20px_60px_rgba(30,41,59,.25)] backdrop-blur">
          <button
            type="button"
            disabled={workflowStep === 1}
            onClick={() => {
              if (workflowStep === 2 && activeTab === "media") {
                setActiveTab("scenes");
                window.setTimeout(
                  () =>
                    workflowTopRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    }),
                  0,
                );
                return;
              }
              goToWorkflowStep(workflowStep - 1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Quay lại
          </button>
          <div className="hidden min-w-0 text-center sm:block">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-indigo-500">
              Bước {workflowStep}/4
            </p>
            <p className="truncate text-xs font-black text-slate-800">
              {workflowSteps[workflowStep - 1]?.label}
            </p>
          </div>
          <button
            type="button"
            disabled={(workflowStep === 4 && activeTab === "render") || !canContinueManual}
            onClick={() => {
              if (workflowStep === 2 && activeTab === "scenes") {
                setActiveTab("media");
                window.setTimeout(
                  () =>
                    workflowTopRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    }),
                  0,
                );
                return;
              }
              if (workflowStep === 3 && activeTab === "voice") {
                setActiveTab("seo");
                window.setTimeout(
                  () =>
                    workflowTopRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    }),
                  0,
                );
                return;
              }
              if (workflowStep < 4) {
                goToWorkflowStep(workflowStep + 1, true);
                return;
              }
              window.setTimeout(
                () =>
                  workflowTopRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  }),
                0,
              );
            }}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {workflowStep === 2 && activeTab === "scenes"
              ? "Tiếp tục: Ảnh / Video →"
              : workflowStep === 3 && activeTab === "voice"
                ? "Tiếp tục SEO →"
                : workflowStep === 3 && activeTab === "seo"
                  ? "Tiếp tục xuất video →"
              : workflowStep === 4
                ? "Đã tới bước cuối"
                : "Tiếp tục →"}
          </button>
        </div>
      )}

      <div className="hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">
              TIẾN ĐỘ TẠO VIDEO
            </span>
            <span className="text-xs font-black text-indigo-700">
              {props.progress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${props.progress}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-2">
              <b className="block text-lg text-indigo-700">
                {props.stats.words}
              </b>
              <span className="text-[10px] text-slate-500">Từ kịch bản</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <b className="block text-lg text-indigo-700">
                {props.stats.scenes}
              </b>
              <span className="text-[10px] text-slate-500">Phân cảnh</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <b className="block text-lg text-indigo-700">
                {props.stats.media}
              </b>
              <span className="text-[10px] text-slate-500">Media</span>
            </div>
          </div>
          <div
            className={`mt-3 rounded-xl border px-3 py-3 text-xs font-bold ${props.isRunning ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
          >
            {props.isRunning
              ? "Hệ thống đang tạo video hoàn chỉnh. Bạn có thể theo dõi tiến độ phía trên."
              : "Đã sẵn sàng. Các lựa chọn của bạn được lưu tự động."}
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-700 to-slate-950 p-4 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span className="text-[11px] font-bold">
              Đã tự động lưu các lựa chọn
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-indigo-100">
            Hệ thống sẽ tự hoàn thành mọi công việc cần thiết và trả về video
            cuối cùng để xem, tải xuống và sử dụng.
          </p>
        </div>
      </div>
      {characterGuideOpen && (
        <div
          className="fixed inset-0 z-[260] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          onClick={() => setCharacterGuideOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Hướng dẫn đồng bộ nhiều nhân vật"
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/70 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-700"><HelpCircle className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">VidiFlow OneClick</p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">Hướng dẫn đồng bộ nhiều nhân vật</h2>
                  <p className="mt-1 text-xs text-slate-500">Tạo hồ sơ và gắn ảnh đúng người để tool tự chọn tham chiếu cho từng phân cảnh.</p>
                </div>
              </div>
              <button type="button" onClick={() => setCharacterGuideOpen(false)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-100" aria-label="Đóng hướng dẫn">✕</button>
            </div>

            <div className="space-y-5 px-6 py-5 text-sm text-slate-700">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-black text-amber-900">Nguyên tắc dễ nhớ</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">Mỗi nhân vật có một hồ sơ và bộ ảnh riêng. Tool đọc ID, tên hoặc bí danh trong prompt để lấy đúng ảnh của người xuất hiện ở cảnh đó.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="font-black text-indigo-950">Ảnh riêng theo hồ sơ</p>
                  <p className="mt-1 text-xs leading-5 text-indigo-800">Tải trong từng hồ sơ nhân vật, tối đa 3 ảnh/người. Chỉ được dùng khi prompt khớp ID, tên hoặc bí danh của nhân vật đó.</p>
                </div>
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                  <p className="font-black text-cyan-950">Ảnh tham chiếu chung</p>
                  <p className="mt-1 text-xs leading-5 text-cyan-800">Dùng cho phong cách, bối cảnh hoặc đồ vật chung. Bạn cũng có thể dùng một ảnh nhóm có đủ nhân vật và ghi rõ tên từng người; tool sẽ đối chiếu tên trong nội dung cảnh và chỉ yêu cầu đúng nhân vật đang xuất hiện.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-900">
                <b>Thứ tự tool chọn ảnh:</b> ảnh riêng của nhân vật được gọi trong prompt → ảnh tham chiếu chung → tạo không kèm ảnh nếu cả hai đều trống.
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["1", "Tạo từng nhân vật", "Bấm “Thêm hồ sơ”. Không gộp cả gia đình hoặc cả nhóm vào một hồ sơ."],
                  ["2", "Điền tên và bí danh", "Ví dụ tên “Lan”; bí danh “cô ấy, người mẹ, chị Lan”. Dùng đúng các cách gọi này trong kịch bản."],
                  ["3", "Khóa đặc điểm nhận dạng", "Ghi giới tính, tuổi, khuôn mặt, da, tóc, vóc dáng, trang phục và dấu hiệu riêng. Không ghi hành động hoặc bối cảnh."],
                  ["4", "Tải ảnh riêng cho từng người", "Trong chính hồ sơ đó, tải 1–3 ảnh rõ mặt của đúng một người. Không dùng chung một ảnh cho nhiều hồ sơ."],
                  ["5", "Chọn đủ người cho video", "Tại ô “Thêm nhân vật vào video”, chọn tất cả nhân vật sẽ xuất hiện. Các thẻ màu xanh là hồ sơ đang dùng."],
                  ["6", "Kiểm tra prompt trước khi tạo", "Mỗi cảnh phải có ID, tên hoặc bí danh của đúng người xuất hiện. Nếu nhận sai, sửa prompt rồi mới tạo lại media."],
                ].map(([number, title, body]) => (
                  <div key={number} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">{number}</span>
                      <div><p className="font-black text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{body}</p></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="font-black text-indigo-950">Ví dụ thiết lập đúng</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-white p-3 text-xs leading-5"><b>CHAR_01 · Lan</b><br />Bí danh: cô ấy, người mẹ<br />Nữ Việt Nam 30 tuổi, mặt trái xoan, tóc bob đen, kính tròn, áo sơ mi xanh nhạt.</div>
                  <div className="rounded-xl bg-white p-3 text-xs leading-5"><b>CHAR_02 · Minh</b><br />Bí danh: cậu bé, con trai Lan<br />Bé trai Việt Nam 8 tuổi, mặt tròn, tóc đen ngắn, áo hoodie vàng, ba lô xanh.</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-black text-slate-900">Cách gọi nhân vật trong từng cảnh</p>
                <div className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
                  <p><b>Cảnh có 1 người:</b> <code className="rounded bg-white px-1.5 py-1">[CHAR_01] Lan đứng bên cửa sổ</code> → chỉ lấy ảnh của Lan.</p>
                  <p><b>Cảnh có 2 người:</b> <code className="rounded bg-white px-1.5 py-1">[CHAR_01] Lan nói chuyện với [CHAR_02] Minh</code> → lấy cả hai bộ ảnh.</p>
                  <p><b>Cảnh có 3 người:</b> ghi đủ ba ID/tên trong prompt → tool ghép tham chiếu của đúng ba hồ sơ.</p>
                  <p><b>Cảnh không có nhân vật:</b> prompt chỉ mô tả bối cảnh/đồ vật → dùng ảnh tham chiếu chung nếu có.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-800">
                <b>Tránh:</b> đổi tuổi hoặc trang phục giữa các hồ sơ; dùng cùng một bí danh cho hai người; gộp nhiều người vào một hồ sơ; tải ảnh có nhiều khuôn mặt, quá mờ hoặc dùng cùng một ảnh cho nhiều nhân vật.
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
              <button type="button" onClick={() => setCharacterGuideOpen(false)} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-indigo-200 transition hover:brightness-105 active:scale-[0.98]">Đã hiểu, bắt đầu thiết lập</button>
            </div>
          </div>
        </div>
      )}
      {expandedThumbnailUrl && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/85 p-5 backdrop-blur-sm"
          onClick={() => setExpandedThumbnailUrl("")}
          role="dialog"
          aria-modal="true"
          aria-label="Xem Thumbnail kích thước lớn"
        >
          <div className="relative flex max-h-[92vh] max-w-[92vw] items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <img src={expandedThumbnailUrl} alt="Thumbnail kích thước lớn" className="max-h-[92vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" />
            <button type="button" onClick={() => setExpandedThumbnailUrl("")} className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-2 text-xs font-black text-white shadow-lg transition hover:bg-black">Đóng ✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
