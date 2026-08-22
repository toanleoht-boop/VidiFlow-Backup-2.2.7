import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Download,
  AlertCircle,
  FileText,
  Volume2,
  Video,
  Search,
  ThumbsUp,
  MessageSquare,
  Image as ImageIcon,
  CheckSquare,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Info,
  Layers,
  Flame,
  User,
  Users,
  Eye,
  HelpCircle,
  Sliders,
  RefreshCw,
  Wand2,
  Upload,
  X,
  Edit3,
  Trash2,
  Plus,
  Settings,
  FolderOpen,
  Sun,
  Moon
} from "lucide-react";
import { BrainstormResult, Storyboard, SEOResults, ProductionProgress } from "./types";
import type { AutomationPreset } from "./components/PresetAutomationHub";

type CharacterProfile = {
  id: string;
  name: string;
  aliases: string;
  description: string;
};

const createCharacterProfile = (index: number, description = ""): CharacterProfile => ({
  id: `CHAR_${String(index + 1).padStart(2, "0")}`,
  name: index === 0 ? "Nhân vật chính" : `Nhân vật ${index + 1}`,
  aliases: "",
  description,
});

const buildCharacterBible = (profiles: CharacterProfile[]): string => {
  const validProfiles = profiles.filter((profile) => profile.description.trim());
  if (!validProfiles.length) return "";

  return [
    "CHARACTER BIBLE — IMMUTABLE IDENTITY LOCK",
    ...validProfiles.map((profile) => {
      const aliases = profile.aliases.trim() ? `; aliases: ${profile.aliases.trim()}` : "";
      return `[${profile.id}; name: ${profile.name.trim() || profile.id}${aliases}] ${profile.description.trim()}`;
    }),
    "RULES: Match each character by ID, name or alias. Keep that person's gender, age range, facial structure, skin tone, hairstyle, body proportions, wardrobe and signature details unchanged in every scene and thumbnail. Never merge, swap or transfer traits between profiles. Include only profiles actually present in the scene; when multiple profiles appear, describe each identity separately.",
  ].join("\n");
};
import { vidiflowAlert, vidiflowConfirm } from "./components/VidiFlowDialogCenter";
import PipelineStep1 from "./components/pipeline/PipelineStep1";
import LicenseGate from "./components/LicenseGate";
import UpdateCenter from "./components/UpdateCenter";

// These screens are large and are not needed during the initial dashboard
// paint. Load each one only when the customer opens its workflow so startup
// remains responsive on ordinary Windows laptops.
const PromptTemplatesHub = React.lazy(() => import("./components/PromptTemplatesHub"));
const WorkflowGuideView = React.lazy(() => import("./components/WorkflowGuideView"));
const CapCutSynchronizer = React.lazy(() => import("./components/CapCutSynchronizer"));
const DetailedReportView = React.lazy(() => import("./components/DetailedReportView"));
const AI33VoiceStudio = React.lazy(() => import("./components/AI33VoiceStudio"));
const AudioTimelinePro = React.lazy(() => import("./components/AudioTimelinePro"));
const AutomationControlCenter = React.lazy(() => import("./components/AutomationControlCenter"));
const PresetAutomationHub = React.lazy(() => import("./components/PresetAutomationHub"));
const OutputPreviewView = React.lazy(() => import("./components/OutputPreviewView"));
const CustomerGuideView = React.lazy(() => import("./components/CustomerGuideView"));
const SetupView = React.lazy(() => import("./components/SetupView"));
const TelegramAutomationScheduler = React.lazy(() => import("./components/TelegramAutomationScheduler"));

const FacebookMark = () => <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current"><path d="M13.8 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V4a21 21 0 0 0-2.3-.1c-2.3 0-3.8 1.4-3.8 4V10H8.3v3h2.6v8h2.9Z" /></svg>;
const ZaloMark = () => <span aria-hidden="true" className="text-[15px] font-black italic tracking-[-0.12em]">Zalo</span>;
const TelegramMark = () => <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current"><path d="M21.4 3.4 2.9 10.5c-1.3.5-1.3 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.5.1.7.6.7.3 0 .5-.1.7-.3l2.2-2.1 4.6 3.4c.8.4 1.4.2 1.6-.8l3.1-14.7c.3-1.2-.4-1.7-1.6-1.2Zm-11.1 9.6 8.9-5.6c.4-.3.8-.1.5.2l-7.2 6.5-.3 3.2-1.9-4.5Z" /></svg>;

// A hook is only the opening beat, never the whole narration. Scripts pasted
// as one paragraph previously made `split("\n").slice(0, 3)` return every
// word, so Step 2 replaced the complete script with a short hook summary.
const extractOpeningHookText = (source: string, maxWords = 36): string => {
  const normalized = String(source || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const sentences = normalized.match(/.*?[.!?\u2026](?:\s+|$)/g)?.map((value) => value.trim()).filter(Boolean) || [];
  let opening = sentences[0] || normalized;
  if (opening.split(/\s+/).length < 12 && sentences[1]) opening += ` ${sentences[1]}`;
  const words = opening.split(/\s+/).filter(Boolean);
  return words.length > maxWords ? words.slice(0, maxWords).join(" ") : opening;
};

// Gợi ý danh sách Niche mẫu để người dùng bắt đầu nhanh
const SUGGESTED_NICHES = [
  {
    category: "historical-mysteries",
    title: "Lịch Sử Bí Ẩn ngoại truyện",
    description: "Kể chuyện lịch sử, thuyết âm mưu, bí ẩn cổ đại, tra tấn kinh hoàng... Đây là chủ đề dễ nổ view ngoại quốc cực kỳ mạnh.",
    hotness: "Rất Cao",
    viewSource: "Ngoại Quốc (Nhiều View)",
    suggestedStyles: "cinematic historic realism, oil painting style, dark ambient lighting, 8k resolution"
  },
  {
    category: "sleep-stories",
    title: "Kể Chuyện Trị Liệu / Khó Ngủ",
    description: "Những câu chuyện thần thoại, truyền thuyết đô thị, giọng đọc trầm ấm giúp dễ ngủ sâu. Thu hút nhóm khán giả trung thành cao.",
    hotness: "Cao",
    viewSource: "Cả hai",
    suggestedStyles: "surreal ambient watercolor illustration, soft pastels, dreamy fantasy glow, quiet atmospheric"
  },
  {
    category: "creepypasta",
    title: "Tâm Linh & Cổ Tích Kinh Dị Vietnamese",
    description: "Tái hiện các mẩu chuyện ma dân gian, dị bản cổ tích Việt Nam và thế giới. Rất kích thích người xem bình luận tranh cãi.",
    hotness: "Rất Cao",
    viewSource: "Trong Nước",
    suggestedStyles: "dark asian gothic illustration, eerie shadows, fog, cinematic horror lighting, dramatic concept art"
  },
  {
    category: "life-lessons",
    title: "Triết Lý Cuộc Sống / Bài Học Thâm Thúy",
    description: "Kịch bản kể về bài học nghèo khổ, lòng tốt giả tạo, nhân quả báo ứng... Đánh mạnh vào cảm xúc và chia sẻ mạng xã hội.",
    hotness: "Cao",
    viewSource: "Trong Nước",
    suggestedStyles: "modern high-contrast anime style, emotional lighting, soft focus depth, expressive character face"
  }
];

type OverviewZoomEntry = { code: string; groupId: string; rows: number; cols: number; focusIndex: number; sourceCode?: string };

type OverviewBoardItem = { sceneNumber: number; label: string };
type OverviewScriptBoard = { title: string; items: OverviewBoardItem[] };

const planOverviewBoardsFromScript = async (script: string, scenes: any[], enabled: boolean): Promise<OverviewScriptBoard[]> => {
  if (!enabled || scenes.length < 2) return [];
  const response = await fetch('/api/plan-overview-zoom', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, scenes }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success !== true) {
    throw new Error(payload?.error || 'Không thể phân tích các mục đánh số theo kịch bản cho ảnh tổng quan.');
  }
  return Array.isArray(payload.boards) ? payload.boards : [];
};

const applyScriptOverviewZoomPlan = (storyboard: any, enabled: boolean, boards: OverviewScriptBoard[], style: string, aspectRatio: string) => {
  const scenes = Array.isArray(storyboard?.scenes) ? storyboard.scenes : [];
  const entries: OverviewZoomEntry[] = [];
  for (const scene of scenes) for (const prompt of Array.isArray(scene?.imagePrompts) ? scene.imagePrompts : []) {
    if (prompt?.overviewBasePrompt) { prompt.englishPrompt = prompt.overviewBasePrompt; prompt.prompt = prompt.overviewBasePrompt; }
    delete prompt.overviewZoom;
  }
  if (!enabled || !boards.length) {
    storyboard.overviewZoom = { enabled: false, version: 3, entries: [] };
    return storyboard.overviewZoom;
  }
  boards.forEach((board, boardIndex) => {
    const items = Array.isArray(board?.items) ? board.items : [];
    const resolved = items.map((item) => {
      const scene = scenes.find((candidate: any, index: number) => Number(candidate?.sceneNumber || index + 1) === Number(item.sceneNumber));
      const prompt = scene?.imagePrompts?.[0];
      return scene && prompt ? { item, scene, prompt } : null;
    }).filter(Boolean) as Array<{ item: OverviewBoardItem; scene: any; prompt: any }>;
    if (resolved.length < 2) return;
    const count = resolved.length;
    const cols = String(aspectRatio).includes('9:16') ? 2 : count > 6 ? 4 : count > 3 ? 3 : 2;
    const rows = Math.ceil(count / cols);
    const groupId = `G${boardIndex + 1}`;
    const sourceCode = String(resolved[0].prompt.code || `P${resolved[0].item.sceneNumber}.1`);
    const cells = resolved.map(({ item, scene, prompt }, index) => {
      const sceneContent = String(prompt.subText || prompt.subText_vi || scene.text || '').replace(/\s+/g, ' ').trim().slice(0, 180);
      return `CELL ${index + 1} — ${item.label}: ${sceneContent}`;
    });
    const boardPrompt = `${style || 'clean visual storytelling'}. OVERVIEW_ZOOM_BOARD_V3, title: ${board.title}. Create one single unified overview board arranged as an exact ${cols}-column by ${rows}-row grid. The board must contain these spoken numbered items in this exact order: ${cells.join('; ')}. Every cell must clearly visualize its own exact item and narration content, with consistent characters, palette, scale and art direction across the whole board. Use equal cell geometry and clear boundaries. Keep the full board readable before zoom. No invented sections, no generic unrelated icons, no duplicated cells, no extra text unless explicitly requested. --ar ${aspectRatio}`;
    resolved.forEach(({ item, prompt }, focusIndex) => {
      const code = String(prompt.code || `P${item.sceneNumber}.1`);
      const basePrompt = String(prompt.overviewBasePrompt || prompt.englishPrompt || prompt.prompt || '').trim();
      prompt.overviewBasePrompt = basePrompt;
      prompt.englishPrompt = boardPrompt;
      prompt.prompt = boardPrompt;
      prompt.overviewZoom = { groupId, title: board.title, rows, cols, focusIndex, sourceCode };
      entries.push({ code, groupId, rows, cols, focusIndex, sourceCode });
    });
  });
  storyboard.overviewZoom = { enabled: entries.length > 0, version: 3, boards, entries };
  return storyboard.overviewZoom;
};
const saveOverviewZoomManifest = async (projectDir: string, manifest: any) => {
  if (!projectDir) return;
  const response = await fetch('/api/save-file', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: projectDir + '\\overview_zoom_manifest.json', content: JSON.stringify(manifest, null, 2) }),
  });
  if (!response.ok) throw new Error('Không thể lưu cấu hình tổng quan-zoom vào project.');
};
export default function App() {
  // Refs cho abort controllers hỗ trợ huỷ bỏ tiến trình
  const brainstormAbortController = useRef<AbortController | null>(null);
  const processScriptAbortController = useRef<AbortController | null>(null);
  const hookAbortController = useRef<AbortController | null>(null);
  const adjustAbortController = useRef<AbortController | null>(null);
  const analyzeStyleAbortController = useRef<AbortController | null>(null);
  const storyboardAbortController = useRef<AbortController | null>(null);
  const seoAbortController = useRef<AbortController | null>(null);

  const voiceAbortController = useRef<AbortController | null>(null);
  const autoPipelineAbortController = useRef<AbortController | null>(null);
  const autoPipelineRunningRef = useRef(false);
  const projectLoadRequestRef = useRef(0);

  const brainstormAbort = () => {
    if (brainstormAbortController.current) {
      brainstormAbortController.current.abort();
      setBrainstormLoading(false);
    }
  };
  const processScriptAbort = () => {
    if (processScriptAbortController.current) {
      processScriptAbortController.current.abort();
      setProcessScriptLoading(false);
    }
  };
  const hookAbort = () => {
    if (hookAbortController.current) {
      hookAbortController.current.abort();
      setHookLoading(false);
    }
  };
  const adjustAbort = () => {
    if (adjustAbortController.current) {
      adjustAbortController.current.abort();
      setAdjustLoading(false);
    }
  };
  const analyzeStyleAbort = () => {
    if (analyzeStyleAbortController.current) {
      analyzeStyleAbortController.current.abort();
      setAnalyzingStyle(false);
    }
  };
  const storyboardAbort = () => {
    if (storyboardAbortController.current) {
      storyboardAbortController.current.abort();
      setStoryboardLoading(false);
    }
  };
  const seoAbort = () => {
    if (seoAbortController.current) {
      seoAbortController.current.abort();
      setSeoLoading(false);
    }
  };
  const voiceAbort = () => {
    if (voiceAbortController.current) {
      voiceAbortController.current.abort();
      setVoiceGenerating(false);
    }
  };
  const autoPipelineAbort = () => {
    if (autoPipelineAbortController.current) {
      autoPipelineAbortController.current.abort();
    }
    // The browser workers run on the server, therefore stopping the fetch
    // alone is not enough.  Explicitly cancel the media batch as well.
    void fetch("/api/pipeline/stop-batch", { method: "POST" }).catch(() => {});
    setAutoStepStatus((previous) => Object.fromEntries(Object.entries(previous).map(([key, status]) => [key, status === "running" ? "stopped" : status])) as typeof previous);
    setIsPlayingAutoPipeline(false);
  };

  const handleCancelStep = (step: string) => {
    switch (step) {
      case "brainstorm":
        brainstormAbort();
        break;
      case "script":
        processScriptAbort();
        break;
      case "hook":
        hookAbort();
        break;
      case "adjust":
        adjustAbort();
        break;
      case "analyzeStyle":
        analyzeStyleAbort();
        break;
      case "storyboard":
        storyboardAbort();
        break;
      case "seo":
        seoAbort();
        break;
      case "voice":
        voiceAbort();
        break;
      case "auto":
        autoPipelineAbort();
        break;
      default:
        break;
    }
  };

  // Trạng thái bước hiện tại
  const [activeStep, setActiveStep] = useState<string>("home");
  const [manualControlTab, setManualControlTab] = useState<"script" | "prompts" | "voice" | "media" | "seo" | "render">("script");
  // Bản giao khách chỉ cần hai khu vực: chuẩn bị và sản xuất. Trạng thái chốt
  // là cánh cổng không cho chạy bất kỳ tác vụ sản xuất nào quá sớm.
  const [manualContentApproved, setManualContentApproved] = useState(false);
  const [apiKeyOk, setApiKeyOk] = useState<boolean | null>(null);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [geminiStatusLabel, setGeminiStatusLabel] = useState<string>("Đang kiểm tra...");
  const [licensePlan, setLicensePlan] = useState<"none" | "trial" | "starter" | "monthly" | "agency" | "lifetime">("none");
  const [showUpdateCenter, setShowUpdateCenter] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const completedReleaseCheckedRef = useRef(false);
  const autoPipelineRunnerRef = useRef<(twoStage?: boolean, manualStageOverride?: 1 | 2 | 3 | 4) => Promise<void>>(async () => {});
  const scheduledJobRef = useRef<string | null>(null);
  const scheduledJobLaunchRef = useRef<{
    jobId: string;
    input: string;
    projectDir: string;
  } | null>(null);
  const [automationConfigRevision, setAutomationConfigRevision] = useState(0);

  // The portable launcher runs the UI in the customer's normal browser.
  // Periodic heartbeats let the local server shut down when that browser is
  // no longer using VidiFlow, preventing one background Node process per run.
  useEffect(() => {
    const heartbeat = () => { void fetch("/api/launcher/heartbeat", { method: "POST" }).catch(() => {}); };
    void fetch("/api/launcher/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((status) => {
        if (typeof status?.app_version === "string" && status.app_version) {
          setAppVersion(status.app_version);
        }
      })
      .catch(() => {});
    heartbeat();
    const timer = window.setInterval(heartbeat, 30000);
    return () => window.clearInterval(timer);
  }, []);

  // Show the changelog once, only after the detached updater has successfully
  // installed and reopened the target version. Fresh installations have no
  // completion marker, so they do not receive an incorrect update popup.
  useEffect(() => {
    if (completedReleaseCheckedRef.current) return;
    completedReleaseCheckedRef.current = true;
    const showCompletedRelease = async () => {
      try {
        const response = await fetch(`/api/update/completed-release?t=${Date.now()}`, { cache: "no-store" });
        const release = await response.json();
        if (!release?.available || !release?.version) return;
        const notes = String(release?.notes || "").trim() || "Phiên bản mới đã được cài đặt thành công.";
        await vidiflowAlert(notes, {
          title: `Đã cập nhật VidiFlow v${release.version}`,
          tone: "success",
          confirmLabel: "Bắt đầu sử dụng",
        });
        await fetch("/api/update/completed-release/acknowledge", { method: "POST" }).catch(() => {});
      } catch {
        // A release notice must never block the editor from opening.
      }
    };
    void showCompletedRelease();
  }, []);

  // Check once when the customer opens VidiFlow. The update window is only
  // shown when this installed version is actually older than the server one.
  // Manual "Kiểm tra cập nhật" remains available in the sidebar.
  useEffect(() => {
    let cancelled = false;
    const checkStartupUpdate = async () => {
      try {
        const response = await fetch(`/api/update/check?t=${Date.now()}`, {
          cache: "no-store",
        });
        const update = await response.json();
        if (cancelled) return;
        if (typeof update?.installed_version === "string" && update.installed_version) setAppVersion(update.installed_version);
        if (update?.configured && update?.update_available && update?.version && update?.download_url && update?.sha256) {
          setShowUpdateCenter(true);
        }
      } catch {
        // Update connectivity must never block opening the editor.
      }
    };
    void checkStartupUpdate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const refreshLicensePlan = async () => {
      try {
        const response = await fetch("/api/license/status");
        const data = await response.json();
        if (mounted) setLicensePlan(data?.active ? data.plan : "none");
      } catch {
        if (mounted) setLicensePlan("none");
      }
    };
    void refreshLicensePlan();
    const timer = window.setInterval(() => void refreshLicensePlan(), 30000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  // Thư mục Dự Án (Global Project Directory)
  const [projectDir, setProjectDir] = useState<string>(() => localStorage.getItem("projectDir") || "");
  const activeProjectDirRef = useRef(projectDir);
  // Selecting an empty destination while an older project is visible must
  // not copy that older project's files into the new folder. Persistence
  // resumes when a newly generated storyboard replaces this snapshot.
  const blockedProjectSnapshotRef = useRef<any>(null);
  const [projectHistory, setProjectHistory] = useState<Array<{ path: string; name: string; lastOpened: string }>>(() => {
    try { return JSON.parse(localStorage.getItem("project_history_v1") || "[]"); } catch { return []; }
  });
  const [projectHistoryChecking, setProjectHistoryChecking] = useState(false);
  const [viewingProjectDir, setViewingProjectDir] = useState("");

  // States lưu tiến trình làm video
  const [nicheCategory, setNicheCategory] = useState<string>("historical-mysteries");
  const [customKeyword, setCustomKeyword] = useState<string>("");
  const [brainstormLoading, setBrainstormLoading] = useState<boolean>(false);
  const [brainstormData, setBrainstormData] = useState<BrainstormResult | null>(null);

  // Bước 1: Chuẩn hóa kịch bản
  const [rawTranscript, setRawTranscript] = useState<string>("");
  const [scriptInputKind, setScriptInputKind] = useState<"transcript" | "idea">("transcript");
  const [scriptIdea, setScriptIdea] = useState<string>("");
  const [ideaLengthMode, setIdeaLengthMode] = useState<"characters" | "duration">("duration");
  const [ideaTargetCharacters, setIdeaTargetCharacters] = useState<number>(5000);
  // Display minutes for clarity; the API still receives seconds.
  const [ideaTargetMinutes, setIdeaTargetMinutes] = useState<number>(5);
  const [ideaWriting, setIdeaWriting] = useState(false);
  const [transcribeLoading, setTranscribeLoading] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [socialUrl, setSocialUrl] = useState<string>("");
  const [socialTranscribeLoading, setSocialTranscribeLoading] = useState<boolean>(false);
  const [scriptImportMode, setScriptImportMode] = useState<"upload" | "social">("upload");
  const [processScriptLoading, setProcessScriptLoading] = useState<boolean>(false);
  const [standardizedScript, setStandardizedScript] = useState<string>("");
  const [isProgrammatic, setIsProgrammatic] = useState<boolean>(false);
  const [scriptLang, setScriptLang] = useState<string>("original");
  // Backup files are intentionally single-language. Keep their language
  // selection independent from the bilingual storyboard preview controls.
  const [backupLanguage, setBackupLanguage] = useState<"vi" | "en">("vi");
  const [scriptEditRequest, setScriptEditRequest] = useState<string>("");
  const [rewriteScript, setRewriteScript] = useState<boolean>(false);
  const [preserveOriginalScript, setPreserveOriginalScript] = useState<boolean>(true);
  const [newScriptLength, setNewScriptLength] = useState<string>("equal"); // "equal" | "shorter" | "longer"
  const [autoRewriteLengthMode, setAutoRewriteLengthMode] = useState<"source" | "words" | "minutes">("source");
  const [autoRewriteTargetWords, setAutoRewriteTargetWords] = useState<number>(300);
  const [autoRewriteTargetMinutes, setAutoRewriteTargetMinutes] = useState<number>(1);
  const [modifyIntroOnly, setModifyIntroOnly] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showClearProjectModal, setShowClearProjectModal] = useState<boolean>(false);
  const [pendingPastedText, setPendingPastedText] = useState<string>("");
  const [showProjectFolderModal, setShowProjectFolderModal] = useState<boolean>(false);
  const [pendingProjectFolder, setPendingProjectFolder] = useState<string>("");
  const [showProjectDataChoiceModal, setShowProjectDataChoiceModal] = useState(false);
  const [pipelineErrorModal, setPipelineErrorModal] = useState<{
    message: string;
    mode: "auto" | "manual";
    stage?: 1 | 2 | 3 | 4;
    recoveryStage?: 1 | 2 | 3 | 4;
  } | null>(null);
  const [pipelineSuccessModal, setPipelineSuccessModal] = useState<{
    elapsedMs: number;
    projectPath: string;
    videoName: string;
  } | null>(null);

  // Bước 2: Viết lại Hook
  const [rawHook, setRawHook] = useState<string>("");
  const [hookLoading, setHookLoading] = useState<boolean>(false);
  const [hookOptionsText, setHookOptionsText] = useState<string>("");
  const [hookOptions, setHookOptions] = useState<Array<{ style: string; hookText: string; explanation?: string }>>([]);
  const [chosenHookText, setChosenHookText] = useState<string>("" );
  const [isHookProgrammatic, setIsHookProgrammatic] = useState<boolean>(false);
  const [hookLang, setHookLang] = useState<string>("original");
  const [hookRewriteStyle, setHookRewriteStyle] = useState<string>("different"); // "different" | "close"

  // Trạng thái điều chỉnh độ dài kịch bản ở Bước 2
  const [targetWordsAdjust, setTargetWordsAdjust] = useState<number | "">(300);
  const [targetDurationAdjust, setTargetDurationAdjust] = useState<number | "">(120);
  const [adjustLoading, setAdjustLoading] = useState<boolean>(false);

  // SOUND EFFECT ENGINE & TOGGLE
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("cc_soundEnabled");
    return saved !== "false";
  });

  // Step 4 & 5 & 6 Status
  const [step4Done, setStep4Done] = useState<boolean>(false);
  const [step5Done, setStep5Done] = useState<boolean>(false);
  const [step6Done, setStep6Done] = useState<boolean>(false);

  // Lifted state for Step 4 -> 6
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [manualMediaRegenerating, setManualMediaRegenerating] = useState<string | null>(null);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem("cc_soundEnabled", String(newVal));
    setTimeout(() => playSound("success"), 50);
  };

  const playSound = (type: "click" | "success" | "error" | "launch" | "switch") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, duration: number, typeWave: OscillatorType = "sine", delay = 0) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = typeWave;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      if (type === "click") {
        playTone(900, 0.05, "triangle");
      } else if (type === "switch") {
        playTone(600, 0.04, "sine");
      } else if (type === "success") {
        playTone(523.25, 0.08, "sine", 0);     // C5
        playTone(659.25, 0.08, "sine", 0.06);  // E5
        playTone(783.99, 0.15, "sine", 0.12);  // G5
      } else if (type === "error") {
        playTone(220, 0.12, "sawtooth", 0);
        playTone(180, 0.18, "sawtooth", 0.08);
      } else if (type === "launch") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (err) {
      console.warn("Lỗi phát âm thanh:", err);
    }
  };

  // LIGHT/DARK MODE STATE
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("cc_themeMode");
    return (saved as "light" | "dark") || "light";
  });

  const toggleTheme = () => {
    const nextTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextTheme);
    localStorage.setItem("cc_themeMode", nextTheme);
    playSound("switch");
  };

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);

  // CHARACTER CONSISTENCY STATE — supports separate immutable identities.
  const [characterProfiles, setCharacterProfiles] = useState<CharacterProfile[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cc_characterProfiles_v1") || "null");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    const legacyDescription = localStorage.getItem("cc_characterDescription") || "";
    return [createCharacterProfile(0, legacyDescription)];
  });
  const [charImageLoadingId, setCharImageLoadingId] = useState<string>("");
  const characterDescription = useMemo(
    () => buildCharacterBible(characterProfiles),
    [characterProfiles],
  );

  const saveCharacterProfiles = (profiles: CharacterProfile[]) => {
    const normalized = profiles.map((profile, index) => ({
      ...profile,
      id: `CHAR_${String(index + 1).padStart(2, "0")}`,
    }));
    setCharacterProfiles(normalized);
    localStorage.setItem("cc_characterProfiles_v1", JSON.stringify(normalized));
    localStorage.setItem("cc_characterDescription", normalized[0]?.description || "");
  };

  const updateCharacterProfile = (id: string, patch: Partial<CharacterProfile>) => {
    saveCharacterProfiles(characterProfiles.map((profile) => (
      profile.id === id ? { ...profile, ...patch } : profile
    )));
  };

  // Bước 3: Chia phân cảnh & Prompt ảnh
  const [imageStyle, setImageStyle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("cc_selectedStyle_v2");
      if (saved) return saved;
    } catch (e) {}
    return "commercial cinematic storytelling, 4k concept art, atmospheric shadows";
  });

  useEffect(() => {
    try {
      localStorage.setItem("cc_selectedStyle_v2", imageStyle);
    } catch (e) {}
  }, [imageStyle]);
  const [savedStyles, setSavedStyles] = useState<Array<{ name: string; value: string }>>(() => {
    try {
      const saved = localStorage.getItem("cc_savedStyles_v2");
      if (saved) {
        return JSON.parse(saved);
      }
      const legacySaved = localStorage.getItem("cc_savedStyles");
      if (legacySaved) {
        const parsed = JSON.parse(legacySaved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, idx: number) => {
            if (typeof item === 'string') {
              return { name: `Phong cách ${idx + 1}`, value: item };
            }
            return item;
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { name: "Phim Điện Ảnh", value: "commercial cinematic storytelling, 4k concept art, atmospheric shadows" },
      { name: "Sơn Dầu Chi Tiết", value: "cinematic dark storytelling, hyper-detailed oil painting" },
      { name: "Màu Nước Thơ Mộng", value: "dreamy magical watercolor style, soft illustration" },
      { name: "Retro Anime Ghibli", value: "retro anime background art, high contrast, studio ghibli vibes" },
      { name: "Kinh Dị Siêu Thực", value: "3D realistic hyper-detailed horror photography, eerie realism" }
    ];
  });
  const [savedStyleLibraryHydrated, setSavedStyleLibraryHydrated] = useState(false);
  useEffect(() => {
    let disposed = false;
    void fetch("/api/config/style-library")
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (disposed) return;
        const remoteStyles: Array<{ name: string; value: string }> =
          Array.isArray(payload?.savedStyles) ? payload.savedStyles : [];
        setSavedStyles((localStyles) => {
          const merged = new Map<string, { name: string; value: string }>();
          remoteStyles.forEach((style) => {
            if (style?.value) merged.set(`${style.name}\u0000${style.value}`, style);
          });
          localStyles.forEach((style) => {
            if (style?.value) merged.set(`${style.name}\u0000${style.value}`, style);
          });
          return [...merged.values()];
        });
        setSavedStyleLibraryHydrated(true);
      })
      .catch(() => setSavedStyleLibraryHydrated(true));
    return () => { disposed = true; };
  }, []);
  useEffect(() => {
    if (!savedStyleLibraryHydrated) return;
    try {
      localStorage.setItem("cc_savedStyles_v2", JSON.stringify(savedStyles));
    } catch {}
    void fetch("/api/config/style-library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedStyles }),
    }).catch(() => {});
  }, [savedStyles, savedStyleLibraryHydrated]);
  const [newStyleNameInput, setNewStyleNameInput] = useState<string>("");
  const [newStyleValueInput, setNewStyleValueInput] = useState<string>("");
  const [editingStyleIdx, setEditingStyleIdx] = useState<number | null>(null);
  const [editingStyleNameVal, setEditingStyleNameVal] = useState<string>("");
  const [editingStyleVal, setEditingStyleVal] = useState<string>("");
  const [styleToDelete, setStyleToDelete] = useState<number | null>(null);

  const saveStylesToLocalStorage = (styles: Array<{ name: string; value: string }>) => {
    setSavedStyles(styles);
    try {
      localStorage.setItem("cc_savedStyles_v2", JSON.stringify(styles));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStyle = () => {
    const val = newStyleValueInput.trim();
    const name = newStyleNameInput.trim() || `Phong cách mới ${savedStyles.length + 1}`;
    if (!val) {
      alert("Vui lòng điền nội dung chi tiết phong cách mẫu!");
      playSound("error");
      return;
    }
    const updated = [...savedStyles, { name, value: val }];
    saveStylesToLocalStorage(updated);
    setNewStyleNameInput("");
    setNewStyleValueInput("");
    playSound("success");
  };

  const handleEditStyle = (index: number) => {
    setEditingStyleIdx(index);
    setEditingStyleNameVal(savedStyles[index].name);
    setEditingStyleVal(savedStyles[index].value);
    playSound("click");
  };

  const handleSaveEditedStyle = (index: number) => {
    if (!editingStyleVal.trim()) {
      alert("Nội dung phong cách không được để trống!");
      playSound("error");
      return;
    }
    const updated = [...savedStyles];
    updated[index] = {
      name: editingStyleNameVal.trim() || `Phong cách ${index + 1}`,
      value: editingStyleVal.trim()
    };
    saveStylesToLocalStorage(updated);
    setEditingStyleIdx(null);
    setEditingStyleNameVal("");
    setEditingStyleVal("");
    playSound("success");
  };

  const handleDeleteStyle = (index: number) => {
    const updated = savedStyles.filter((_, idx) => idx !== index);
    saveStylesToLocalStorage(updated);
    playSound("success");
  };
  const [storyboardLoading, setStoryboardLoading] = useState<boolean>(false);
  const [translatingLanguage, setTranslatingLanguage] = useState<boolean>(false);
  const [targetTranslationLang, setTargetTranslationLang] = useState<"vi" | "en">("vi");
  const [storyboardViewLang, setStoryboardViewLang] = useState<"vi" | "en" | "both">("vi");
  const [storyboardData, setStoryboardData] = useState<Storyboard | null>(null);
  const [isStoryboardProgrammatic, setIsStoryboardProgrammatic] = useState<boolean>(false);
  const [scenesCount, setScenesCount] = useState<number>(4);
  const [promptsPerScene, setPromptsPerScene] = useState<number>(3);
  const [useDialogueSplit, setUseDialogueSplit] = useState<boolean>(true);
  const [dialogueGroupSize, setDialogueGroupSize] = useState<number>(1);
  const [promptsFocus, setPromptsFocus] = useState<"video" | "image">("video");
  const [isHighDensity, setIsHighDensity] = useState<boolean>(false);
  const [targetPromptsCount, setTargetPromptsCount] = useState<number>(30);
  const [pipelineExpectedPromptCount, setPipelineExpectedPromptCount] =
    useState<number>(0);
  const [storyboardEditRequest, setStoryboardEditRequest] = useState<string>("");
  const [regeneratePromptsOnly, setRegeneratePromptsOnly] = useState<boolean>(false);
  const [selectedPromptCodesForEdit, setSelectedPromptCodesForEdit] = useState<string>("");
  const [specificEditInstructions, setSpecificEditInstructions] = useState<string>("");
  const [rewriteSpecificPromptsLoading, setRewriteSpecificPromptsLoading] = useState<boolean>(false);
  const [sampleImages, setSampleImages] = useState<string[]>([]);
  const [analyzingStyle, setAnalyzingStyle] = useState<boolean>(false);
  const [styleAnalysisError, setStyleAnalysisError] = useState<string>("");

  // States hỗ trợ Copy Prompts theo Số Lượng / Khoảng chỉ định
  const [copyQtyMode, setCopyQtyMode] = useState<"count" | "range">("count");
  const [copyQtyCount, setCopyQtyCount] = useState<number>(5);
  const [copyQtyStart, setCopyQtyStart] = useState<number>(1);
  const [copyQtyEnd, setCopyQtyEnd] = useState<number>(10);

  // Bước 7 & 8: SEO & Seeding
  const [channelName, setChannelName] = useState<string>("");
  const [targetKeywords, setTargetKeywords] = useState<string>("");
  const [seoLoading, setSeoLoading] = useState<boolean>(false);
  const [seoRegenerateProgress, setSeoRegenerateProgress] = useState<number>(0);
  const [thumbnailRegenerating, setThumbnailRegenerating] = useState<boolean>(false);
  const [thumbnailRegenerateProgress, setThumbnailRegenerateProgress] = useState<number>(0);
  const [seoData, setSeoData] = useState<SEOResults | null>(null);
  const [isSeoProgrammatic, setIsSeoProgrammatic] = useState<boolean>(false);

  // SEO & Thumbnail Options
  const [thumbStyleImage, setThumbStyleImage] = useState<string | null>(null);
  const [isAnalyzingThumbStyle, setIsAnalyzingThumbStyle] = useState<boolean>(false);
  const [thumbStyleAnalysis, setThumbStyleAnalysis] = useState<string>("");
  const [thumbHasText, setThumbHasText] = useState<boolean>(true);
  const [thumbCustomText, setThumbCustomText] = useState<string>("");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>("");
  const [thumbnailRevision, setThumbnailRevision] = useState(0);
  const [expandedThumbnailUrl, setExpandedThumbnailUrl] = useState<string>("");
  const [seoIncludeChapters, setSeoIncludeChapters] = useState<boolean>(false);
  const [seoIncludeTracklist, setSeoIncludeTracklist] = useState<boolean>(false);

  useEffect(() => {
    const openThumbnail = (event: MouseEvent) => {
      const image = (event.target as HTMLElement | null)?.closest?.('img[alt="Thumbnail video"]') as HTMLImageElement | null;
      if (!image?.src) return;
      event.preventDefault();
      setExpandedThumbnailUrl(image.src);
    };
    document.addEventListener("click", openThumbnail);
    return () => document.removeEventListener("click", openThumbnail);
  }, []);

  const analyzeThumbStyle = async (base64Img: string) => {
    setIsAnalyzingThumbStyle(true);
    try {
      const res = await fetch("/api/analyze-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [base64Img] })
      });
      const data = await res.json();
      if (res.ok && data.style) {
        setThumbStyleAnalysis(data.style);
      } else {
        console.error("Lỗi trích xuất style ảnh bìa:", data.error);
      }
    } catch (err) {
      console.error("Lỗi khi kết nối phân tích style:", err);
    } finally {
      setIsAnalyzingThumbStyle(false);
    }
  };

  // Keep the actual exported thumbnail together with SEO, title and
  // description so the publishing screen is the single hand-off point.
  useEffect(() => {
    // A destination may be selected before any project is produced. Avoid a
    // disk scan until the SEO/output stage actually has a thumbnail to find.
    if (!projectDir.trim() || projectDir !== activeProjectDirRef.current || !seoData?.seoTitle) { setThumbnailPreviewUrl(""); return; }
    void fetch("/api/list-project-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ directory: projectDir }),
    })
      .then(response => response.json())
      .then(data => {
        const latestDetails = (Array.isArray(data?.details) ? data.details : [])
          .filter((item: { name?: string }) => /^thumbnail_.*\.(?:jpe?g|png|webp)$/i.test(String(item?.name || "")))
          .sort((a: { mtimeMs?: number }, b: { mtimeMs?: number }) => Number(b?.mtimeMs || 0) - Number(a?.mtimeMs || 0));
        const file = latestDetails[0]?.name || (Array.isArray(data?.files) ? data.files : [])
          .filter((name: string) => /^thumbnail_.*\.(?:jpe?g|png|webp)$/i.test(name))
          .sort()
          .at(-1);
        setThumbnailPreviewUrl(file ? `/api/serve-local-file?path=${encodeURIComponent(`${projectDir}\\${file}`)}&t=${Date.now()}` : "");
      })
      .catch(() => setThumbnailPreviewUrl(""));
  }, [projectDir, seoData?.seoTitle, thumbnailRevision]);

  const removeProjectFromHistory = async (path: string) => {
    const confirmed = await vidiflowConfirm(
      "Dự án sẽ được xóa khỏi danh sách Dự án đã chạy. Toàn bộ file trong thư mục dự án vẫn được giữ nguyên.",
      {
        title: "Xóa dự án khỏi danh sách?",
        confirmLabel: "Xóa khỏi danh sách",
        cancelLabel: "Giữ lại",
      },
    );
    if (!confirmed) return;
    setProjectHistory(previous => {
      const next = previous.filter(project => project.path !== path);
      localStorage.setItem("project_history_v1", JSON.stringify(next));
      return next;
    });
  };

  // Bước 5: Tạo giọng đọc Google AI Studio
  const [selectedVoice, setSelectedVoice] = useState<string>("Zephyr");
  const [generatedAudio, setGeneratedAudio] = useState<string>(""); // Base64 Audio WAV Data URL
  const [voiceGenerating, setVoiceGenerating] = useState<boolean>(false);
  const [voiceRegenerateProgress, setVoiceRegenerateProgress] = useState<number>(0);
  const [isPlayingAllImages, setIsPlayingAllImages] = useState<boolean>(false);

  // Utils trạng thái sao chép nhanh
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedFormatted, setCopiedFormatted] = useState<boolean>(false);

  // States cho quy trình tự động hóa liên hoàn (Auto Pipeline Suite VIP)
  const [autoSteps, setAutoSteps] = useState({
    step1: true,
    step2: true,
    step3: true,
  });
  const [autoHookStyle, setAutoHookStyle] = useState<string>("shocking"); // shocking, question, warning, benefit
  const [telegramToken, setTelegramToken] = useState<string>("");
  const [telegramChatId, setTelegramChatId] = useState<string>("");
  const [telegramToolName, setTelegramToolName] = useState<string>("🚀 CapCut Fast Video Creator Studio VIP");
  const [isPlayingAutoPipeline, setIsPlayingAutoPipeline] = useState<boolean>(false);
  const [autoPipelineLogs, setAutoPipelineLogs] = useState<string[]>([]);
  const [autoPipelineProgress, setAutoPipelineProgress] = useState<number>(0);
  // Async pipeline callbacks keep the render-time state value in their
  // closure. Track the live value separately so a late provider failure does
  // not write an obsolete 0% back to a scheduled job.
  const autoPipelineProgressRef = useRef<number>(0);
  useEffect(() => {
    autoPipelineProgressRef.current = autoPipelineProgress;
  }, [autoPipelineProgress]);
  // Manual mode advances only after each stage has produced a reviewable result.
  const [manualTwoStageReviewReady, setManualTwoStageReviewReady] = useState(false);
  const [manualWorkflowStage, setManualWorkflowStage] = useState<1 | 2 | 3 | 4>(1);
  const [autoStepStatus, setAutoStepStatus] = useState<Record<"step1" | "step2" | "step3", "pending" | "running" | "completed" | "skipped" | "failed" | "stopped">>({
    step1: "pending",
    step2: "pending",
    step3: "pending",
  });

  // Check health and API Key
  useEffect(() => {
    fetch("/api/health-check")
      .then((res) => res.json())
      .then((data) => {
        setApiKeyOk(data.apiKeyConfigured);
        setGeminiStatusLabel(String(data?.gemini?.label || (data.apiKeyConfigured ? "API đã cấu hình" : "Chưa cấu hình API")));
        setCheckingKey(false);
      })
      .catch((err) => {
        console.error("Health check error:", err);
        setApiKeyOk(false);
        setGeminiStatusLabel("Không kết nối được dịch vụ API");
        setCheckingKey(false);
      });
  }, []);

  // Khôi phục tất cả các trạng thái từ localStorage khi khởi chạy ứng dụng
  useEffect(() => {
    try {
      const savedActiveStep = localStorage.getItem("activeStep");
      if (savedActiveStep) setActiveStep(savedActiveStep);

      const savedNicheCategory = localStorage.getItem("nicheCategory");
      if (savedNicheCategory) setNicheCategory(savedNicheCategory);

      const savedCustomKeyword = localStorage.getItem("customKeyword");
      if (savedCustomKeyword) setCustomKeyword(savedCustomKeyword);

      const savedBrainstormData = localStorage.getItem("brainstormData");
      if (savedBrainstormData) setBrainstormData(JSON.parse(savedBrainstormData));

      const savedRawTranscript = localStorage.getItem("rawTranscript");
      if (savedRawTranscript) setRawTranscript(savedRawTranscript);

      const savedStandardizedScript = localStorage.getItem("standardizedScript");
      if (savedStandardizedScript) setStandardizedScript(savedStandardizedScript);

      const savedScriptLang = localStorage.getItem("scriptLang");
      if (savedScriptLang) setScriptLang(savedScriptLang);

      const savedScriptEditRequest = localStorage.getItem("scriptEditRequest");
      if (savedScriptEditRequest) setScriptEditRequest(savedScriptEditRequest);

      const savedRawHook = localStorage.getItem("rawHook");
      if (savedRawHook) setRawHook(savedRawHook);

      const savedHookOptions = localStorage.getItem("hookOptions");
      if (savedHookOptions) setHookOptions(JSON.parse(savedHookOptions));

      const savedChosenHookText = localStorage.getItem("chosenHookText");
      if (savedChosenHookText) setChosenHookText(savedChosenHookText);

      const savedHookLang = localStorage.getItem("hookLang");
      if (savedHookLang) setHookLang(savedHookLang);

      const savedImageStyle = localStorage.getItem("imageStyle");
      if (savedImageStyle) setImageStyle(savedImageStyle);

      const savedStoryboardData = localStorage.getItem("storyboardData");
      if (savedStoryboardData) setStoryboardData(JSON.parse(savedStoryboardData));

      const savedStoryboardEditRequest = localStorage.getItem("storyboardEditRequest");
      if (savedStoryboardEditRequest) setStoryboardEditRequest(savedStoryboardEditRequest);

      const savedScenesCount = localStorage.getItem("scenesCount");
      if (savedScenesCount) setScenesCount(Number(savedScenesCount));

      const savedPromptsPerScene = localStorage.getItem("promptsPerScene");
      if (savedPromptsPerScene) setPromptsPerScene(Number(savedPromptsPerScene));

      const savedUseDialogueSplit = localStorage.getItem("useDialogueSplit");
      if (savedUseDialogueSplit) setUseDialogueSplit(savedUseDialogueSplit === "true");

      const savedDialogueGroupSize = localStorage.getItem("dialogueGroupSize");
      if (savedDialogueGroupSize) setDialogueGroupSize(Number(savedDialogueGroupSize));

      const savedPromptsFocus = localStorage.getItem("promptsFocus");
      if (savedPromptsFocus) setPromptsFocus(savedPromptsFocus as "video" | "image");

      const savedIsHighDensity = localStorage.getItem("isHighDensity");
      if (savedIsHighDensity) setIsHighDensity(savedIsHighDensity === "true");

      const savedTargetPromptsCount = localStorage.getItem("targetPromptsCount");
      if (savedTargetPromptsCount) setTargetPromptsCount(Number(savedTargetPromptsCount));

      const savedChannelName = localStorage.getItem("channelName");
      if (savedChannelName) setChannelName(savedChannelName);

      const savedTargetKeywords = localStorage.getItem("targetKeywords");
      if (savedTargetKeywords && !/Chuyện kỳ bí, tóm tắt video hot/i.test(savedTargetKeywords)) setTargetKeywords(savedTargetKeywords);

      const savedSeoData = localStorage.getItem("seoData");
      if (savedSeoData) {
        const restoredSeo = JSON.parse(savedSeoData);
        const removeOldGenericKeyword = (value: unknown) => String(value || "")
          .replace(/\s*[-|,:]?\s*Chuyện kỳ bí, tóm tắt video hot/gi, "")
          .replace(/\s{2,}/g, " ").trim();
        restoredSeo.seoTitle = removeOldGenericKeyword(restoredSeo.seoTitle);
        if (Array.isArray(restoredSeo.titleOptions)) restoredSeo.titleOptions = restoredSeo.titleOptions.map(removeOldGenericKeyword).filter(Boolean);
        setSeoData(restoredSeo);
      }

      const savedGeneratedImages = localStorage.getItem("generatedImages");
      if (savedGeneratedImages) setGeneratedImages(JSON.parse(savedGeneratedImages));

      const savedSelectedVoice = localStorage.getItem("selectedVoice");
      if (savedSelectedVoice) setSelectedVoice(savedSelectedVoice);

      // Legacy global audio URLs can belong to a different project. The Voice
      // screen now reloads its file only from the currently selected folder.
      localStorage.removeItem("generatedAudio");

      // Khôi phục bộ nhớ Telegram & Auto Pipeline
      const savedTelegramToken = localStorage.getItem("telegramToken");
      if (savedTelegramToken) setTelegramToken(savedTelegramToken);

      const savedTelegramChatId = localStorage.getItem("telegramChatId");
      if (savedTelegramChatId) setTelegramChatId(savedTelegramChatId);

      const savedTelegramToolName = localStorage.getItem("telegramToolName");
      if (savedTelegramToolName) setTelegramToolName(savedTelegramToolName);

      const savedAutoSteps = localStorage.getItem("autoSteps");
      if (savedAutoSteps) setAutoSteps(JSON.parse(savedAutoSteps));

      const savedAutoHookStyle = localStorage.getItem("autoHookStyle");
      if (savedAutoHookStyle) setAutoHookStyle(savedAutoHookStyle);
    } catch (e) {
      console.error("Lỗi khi khôi phục dữ liệu gần nhất từ localStorage:", e);
    }
  }, []);

  // Tự động lưu trữ các trường dữ liệu mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem("activeStep", activeStep);
  }, [activeStep]);

  useEffect(() => {
    localStorage.setItem("projectDir", projectDir);
  }, [projectDir]);

  // "Dự án đã chạy" must contain only folders that have a final render.
  // Older versions added every folder the user merely opened, which mixed
  // unfinished work into this list and made reopening look unreliable.
  useEffect(() => {
    if (activeStep !== "projects" || projectHistory.length === 0) return;
    let cancelled = false;
    setProjectHistoryChecking(true);
    void Promise.all(projectHistory.map(async project => {
      try {
        const response = await fetch("/api/project-output-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectDir: project.path }) });
        const summary = await response.json();
        const fallbackName = String(summary?.finalVideo?.name || "").replace(/\.[^.]+$/, "").replace(/_img_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/i, "").trim();
        return summary?.success && summary?.finalVideo?.ready
          ? { ...project, name: String(summary?.seo?.title || fallbackName || project.path.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || "Dự án video") }
          : null;
      } catch { return null; }
    })).then(verified => {
      if (cancelled) return;
      const next = verified.filter(Boolean) as Array<{ path: string; name: string; lastOpened: string }>;
      if (JSON.stringify(next) !== JSON.stringify(projectHistory)) {
        setProjectHistory(next);
        localStorage.setItem("project_history_v1", JSON.stringify(next));
      }
    }).finally(() => { if (!cancelled) setProjectHistoryChecking(false); });
    return () => { cancelled = true; };
  }, [activeStep, projectHistory]);

  useEffect(() => {
    localStorage.setItem("nicheCategory", nicheCategory);
  }, [nicheCategory]);

  useEffect(() => {
    localStorage.setItem("customKeyword", customKeyword);
  }, [customKeyword]);

  useEffect(() => {
    if (brainstormData) {
      localStorage.setItem("brainstormData", JSON.stringify(brainstormData));
    } else {
      localStorage.removeItem("brainstormData");
    }
  }, [brainstormData]);

  useEffect(() => {
    localStorage.setItem("rawTranscript", rawTranscript);
  }, [rawTranscript]);

  useEffect(() => {
    localStorage.setItem("standardizedScript", standardizedScript);
  }, [standardizedScript]);

  useEffect(() => {
    localStorage.setItem("scriptLang", scriptLang);
  }, [scriptLang]);

  useEffect(() => {
    localStorage.setItem("scriptEditRequest", scriptEditRequest);
  }, [scriptEditRequest]);

  useEffect(() => {
    localStorage.setItem("rawHook", rawHook);
  }, [rawHook]);

  useEffect(() => {
    if (hookOptions && hookOptions.length > 0) {
      localStorage.setItem("hookOptions", JSON.stringify(hookOptions));
    } else {
      localStorage.removeItem("hookOptions");
    }
  }, [hookOptions]);

  useEffect(() => {
    localStorage.setItem("chosenHookText", chosenHookText);
  }, [chosenHookText]);

  useEffect(() => {
    localStorage.setItem("hookLang", hookLang);
  }, [hookLang]);

  useEffect(() => {
    localStorage.setItem("imageStyle", imageStyle);
  }, [imageStyle]);

  useEffect(() => {
    if (storyboardData) {
      localStorage.setItem("storyboardData", JSON.stringify(storyboardData));
    } else {
      localStorage.removeItem("storyboardData");
    }
  }, [storyboardData]);

  // Step 6 must use the exact dialogue assigned to every prompt in Step 3,
  // not the general, rewritten script. Save a dedicated timeline source as
  // soon as scenes or their dialogue are changed.
  useEffect(() => {
    // Selecting a fresh destination must not copy the storyboard/timeline
    // still held in memory from the previous project. The destination is
    // unblocked only after a new storyboard is created for that project.
    if (
      !projectDir ||
      projectDir !== activeProjectDirRef.current ||
      !storyboardData?.scenes?.length ||
      storyboardData === blockedProjectSnapshotRef.current
    ) return;
    const lines: string[] = ["=== DIALOGUE TIMELINE FROM STEP 3 ===", ""];
    let promptIndex = 0;
    storyboardData.scenes.forEach((scene: any, sceneIndex: number) => {
      const prompts = scene.imagePrompts || [];
      if (!prompts.length) {
        const dialogue = String(scene.text_vi || scene.text || "").trim();
        if (dialogue) {
          promptIndex++;
          lines.push(`--- Scene ${promptIndex} ---`, `[Dialogue]: ${dialogue}`, "");
        }
        return;
      }
      prompts.forEach((prompt: any, promptIndexInScene: number) => {
        const dialogue = String(
          prompt.subText_vi || prompt.subText ||
          (prompts.length === 1 ? (scene.text_vi || scene.text || "") : "")
        ).trim();
        if (!dialogue) return;
        promptIndex++;
        const code = prompt.code || `S${sceneIndex + 1}.${promptIndexInScene + 1}`;
        lines.push(`--- Scene ${promptIndex} (${code}) ---`, `[Dialogue]: ${dialogue}`, "");
      });
    });
    if (promptIndex === 0) return;
    void fetch("/api/save-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: projectDir + "\\step3_dialogues.txt", content: lines.join("\n") }),
    }).catch(error => console.error("Không thể lưu thoại Bước 3 cho timeline:", error));
  }, [projectDir, storyboardData]);

  // `script.txt` is the portable project backup. Keep it complete whenever
  // the standardized script or the Step 3 dialogue/prompt structure changes.
  useEffect(() => {
    // Persist project files only after storyboard/prompt creation. Picking a
    // destination while drafting must not create or overwrite files there.
    if (
      !projectDir ||
      projectDir !== activeProjectDirRef.current ||
      !storyboardData?.scenes?.length ||
      storyboardData === blockedProjectSnapshotRef.current
    ) return;
    // During app hydration React may already have the restored storyboard
    // while both script states are still empty. Do not erase the valid files
    // on disk in that short window.
    if (!String(standardizedScript || rawTranscript || "").trim()) return;
    void Promise.all([
      fetch("/api/save-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: projectDir + "\\script.txt", content: generateBackupContent(backupLanguage) }),
      }),
      fetch("/api/save-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: projectDir + "\\raw_script.txt", content: standardizedScript || rawTranscript || "" }),
      }),
    ]).catch(error => console.error("Không thể cập nhật dữ liệu kịch bản dự án:", error));
  }, [projectDir, standardizedScript, chosenHookText, rawTranscript, storyboardData, seoData, backupLanguage]);

  useEffect(() => {
    localStorage.setItem("scenesCount", String(scenesCount));
  }, [scenesCount]);

  useEffect(() => {
    localStorage.setItem("promptsPerScene", String(promptsPerScene));
  }, [promptsPerScene]);

  useEffect(() => {
    localStorage.setItem("useDialogueSplit", String(useDialogueSplit));
  }, [useDialogueSplit]);

  useEffect(() => {
    localStorage.setItem("dialogueGroupSize", String(dialogueGroupSize));
  }, [dialogueGroupSize]);

  useEffect(() => {
    localStorage.setItem("promptsFocus", promptsFocus);
  }, [promptsFocus]);

  useEffect(() => {
    localStorage.setItem("isHighDensity", String(isHighDensity));
  }, [isHighDensity]);

  useEffect(() => {
    localStorage.setItem("targetPromptsCount", String(targetPromptsCount));
  }, [targetPromptsCount]);

  useEffect(() => {
    const plannedTotal =
      storyboardData?.scenes?.reduce(
        (total, scene) => total + (scene.imagePrompts?.length || 0),
        0,
      ) || 0;
    setPipelineExpectedPromptCount(plannedTotal);
  }, [storyboardData]);

  useEffect(() => {
    localStorage.setItem("storyboardEditRequest", storyboardEditRequest);
  }, [storyboardEditRequest]);

  useEffect(() => {
    localStorage.setItem("channelName", channelName);
  }, [channelName]);

  useEffect(() => {
    localStorage.setItem("targetKeywords", targetKeywords);
  }, [targetKeywords]);

  useEffect(() => {
    if (seoData) {
      localStorage.setItem("seoData", JSON.stringify(seoData));
    } else {
      localStorage.removeItem("seoData");
    }
  }, [seoData]);

  useEffect(() => {
    if (generatedImages && Object.keys(generatedImages).length > 0) {
      localStorage.setItem("generatedImages", JSON.stringify(generatedImages));
    } else {
      localStorage.removeItem("generatedImages");
    }
  }, [generatedImages]);

  // Rebuild preview mappings from verified filenames whenever a saved project
  // is opened. This fixes old localStorage entries produced by the former
  // P1.1/P11.1 collision and prevents one scene from borrowing another image.
  useEffect(() => {
    if (!projectDir.trim() || !storyboardData?.scenes?.length) return;
    let cancelled = false;
    const normalizeMediaKey = (value: string) => String(value)
      .replace(/^scene[-_]?/i, "")
      .replace(/^\d{1,4}[_-]+/, "")
      .replace(/\.(?:jpe?g|png|webp|mp4|mov)$/i, "")
      .replace(/[._-]+/g, "_")
      .replace(/[^a-z0-9_]/gi, "")
      .toLowerCase();
    const prompts = storyboardData.scenes.flatMap((scene: any) => (scene.imagePrompts || []).map((prompt: any, promptIndex: number) => ({
      key: String(prompt.code || `scene-${scene.sceneNumber || 1}-${promptIndex + 1}`),
    })));
    const restoreVerifiedPreviews = async () => {
      try {
        const directories = [`${projectDir}\\img`, `${projectDir}\\vid`];
        const responses = await Promise.all(directories.map(directory => fetch("/api/list-project-media", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ directory }),
        }).then(async response => ({ directory, data: response.ok ? await response.json() : { files: [] } }))));
        if (cancelled) return;
        const files = responses.flatMap(({ directory, data }) => (Array.isArray(data?.files) ? data.files : []).map((file: string) => ({ directory, file })));
        setGeneratedImages(previous => {
          const next = { ...previous };
          prompts.forEach(({ key }) => {
            delete next[key];
            const match = files.find(item => normalizeMediaKey(item.file) === normalizeMediaKey(key));
            if (match) next[key] = `/api/serve-local-file?path=${encodeURIComponent(`${match.directory}\\${match.file}`)}&t=${Date.now()}`;
          });
          return next;
        });
      } catch {
        // Disk preview reconciliation is optional; a later media run retries it.
      }
    };
    void restoreVerifiedPreviews();
    return () => { cancelled = true; };
  }, [projectDir, storyboardData]);

  useEffect(() => {
    localStorage.setItem("selectedVoice", selectedVoice);
  }, [selectedVoice]);

  useEffect(() => {
    localStorage.setItem("telegramToken", telegramToken);
  }, [telegramToken]);

  useEffect(() => {
    localStorage.setItem("telegramChatId", telegramChatId);
  }, [telegramChatId]);

  useEffect(() => {
    localStorage.setItem("telegramToolName", telegramToolName);
  }, [telegramToolName]);

  useEffect(() => {
    localStorage.setItem("autoSteps", JSON.stringify(autoSteps));
  }, [autoSteps]);

  useEffect(() => {
    localStorage.setItem("autoHookStyle", autoHookStyle);
  }, [autoHookStyle]);

  // Auto-save settings ends
  useEffect(() => {
    if (!projectDir) return;
    try {
      const savedByProject = JSON.parse(localStorage.getItem("generatedAudioByProject") || "{}");
      savedByProject[projectDir] = generatedAudio;
      localStorage.setItem("generatedAudioByProject", JSON.stringify(savedByProject));
    } catch {
      // A failed cache write must never affect the active voice.
    }
  }, [generatedAudio, projectDir]);

  // Choosing a destination is independent from opening an old project. Users
  // often paste a link/script first and select a folder later; that selection
  // must never erase the work currently on screen.
  const useProjectDirectoryAsDestination = (nextProjectDir: string) => {
    const normalizedDir = nextProjectDir.trim();
    blockedProjectSnapshotRef.current = normalizedDir ? storyboardData : null;
    activeProjectDirRef.current = normalizedDir;
    setProjectDir(normalizedDir);
    setViewingProjectDir("");
  };

  const handleProjectDirChange = async (nextProjectDir: string, restoreExistingProject = false) => {
    const normalizedDir = nextProjectDir.trim();
    const requestId = ++projectLoadRequestRef.current;
    if (!normalizedDir) {
      useProjectDirectoryAsDestination("");
      return;
    }
    // An explicit project switch exits read-only history preview mode.
    setViewingProjectDir("");
    if (!restoreExistingProject) {
      try {
        const response = await fetch("/api/project-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: normalizedDir, summary: true }),
        });
        const summary = await response.json();
        if (response.ok && summary?.success && summary?.hasData) {
          await handleProjectDirChange(normalizedDir, true);
          return;
        }
      } catch {
        // A folder can still be used as an empty destination when its contents
        // cannot be inspected (for example a removable drive waking up).
      }
      useProjectDirectoryAsDestination(normalizedDir);
      return;
    }
    try {
      const response = await fetch("/api/project-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: normalizedDir }),
      });
      const projectState = await response.json();
      if (requestId !== projectLoadRequestRef.current) return;
      if (!response.ok || !projectState?.success) {
        throw new Error(projectState?.error || "Không thể đọc dữ liệu trong thư mục dự án.");
      }

      const backupScript = String(projectState.backupScript || "").trim();
      const rawScript = String(projectState.rawScript || "").trim();
      if (backupScript.includes("YT CREATOR PIPELINE 2026 BACKUP")) {
        restoreBackupContent(backupScript, false);
      } else if (rawScript) {
        setRawTranscript(rawScript);
        setStandardizedScript(rawScript);
      }

      activeProjectDirRef.current = normalizedDir;
      blockedProjectSnapshotRef.current = null;
      setProjectDir(normalizedDir);
      setGeneratedAudio(
        projectState.hasVoice && projectState.voicePath
          ? `/api/serve-local-file?path=${encodeURIComponent(projectState.voicePath)}&t=${Date.now()}`
          : "",
      );
      await handleReloadProjectMedia(normalizedDir);
    } catch (error) {
      if (requestId !== projectLoadRequestRef.current) return;
      console.error("Không thể nạp dữ liệu thư mục dự án:", error);
      activeProjectDirRef.current = normalizedDir;
      setProjectDir(normalizedDir);
    }
  };

  // `projectDir` is persisted between launches. Previously the saved path was
  // painted back into the textbox but its durable script/media state was not
  // restored until the user selected the same folder again. Hydrate it once
  // on startup so manual steps can continue an existing project immediately.
  useEffect(() => {
    const persistedProjectDir = localStorage.getItem("projectDir")?.trim() || "";
    if (!persistedProjectDir) return;
    void handleProjectDirChange(persistedProjectDir, true);
    // This is intentionally a one-time startup hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const claimAndRunScheduledJob = async (requestedId?: string) => {
    if (autoPipelineRunningRef.current || scheduledJobRef.current) return;
    try {
      const response = await fetch("/api/automation/jobs/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestedId || "" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.job || !payload?.preset?.config) return;
      const job = payload.job;
      const snapshot = payload.preset.config || {};
      const storedSettings = snapshot.settings && typeof snapshot.settings === "object" ? snapshot.settings : {};
      for (const [key, value] of Object.entries(storedSettings)) {
        if (value !== undefined && value !== null) {
          localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        }
      }
      const config = { ...(snapshot.autoConfig || snapshot), inputType: job.inputType };
      scheduledJobRef.current = job.id;
      scheduledJobLaunchRef.current = {
        jobId: String(job.id),
        input: String(job.input || "").trim(),
        projectDir: String(job.projectDir || "").trim(),
      };
      localStorage.setItem("automation_full_config_v1", JSON.stringify(config));
      await fetch("/api/config/automation-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      // A scheduled job is an isolated new project. Apply the preset to the
      // pipeline's live React state as well as localStorage; otherwise the
      // runner can inherit scene/prompt counts from the project currently open.
      const presetSceneCount = Number(storedSettings.scenesCount ?? config.sceneCount);
      const presetPromptsPerScene = Number(storedSettings.promptsPerScene ?? config.promptsPerScene);
      const presetDialogueGroupSize = Number(storedSettings.dialogueGroupSize ?? config.dialogueGroupSize);
      const presetTargetPrompts = Number(storedSettings.targetPromptsCount ?? config.targetPromptsCount);
      if (Number.isFinite(presetSceneCount) && presetSceneCount > 0) setScenesCount(Math.round(presetSceneCount));
      if (Number.isFinite(presetPromptsPerScene) && presetPromptsPerScene > 0) setPromptsPerScene(Math.round(presetPromptsPerScene));
      if (Number.isFinite(presetDialogueGroupSize) && presetDialogueGroupSize > 0) setDialogueGroupSize(Math.round(presetDialogueGroupSize));
      if (Number.isFinite(presetTargetPrompts) && presetTargetPrompts > 0) setTargetPromptsCount(Math.round(presetTargetPrompts));
      const presetPromptFocus = String(storedSettings.promptsFocus ?? config.promptFocus ?? "image");
      setPromptsFocus(presetPromptFocus === "video" ? "video" : "image");
      setUseDialogueSplit(String(storedSettings.useDialogueSplit ?? config.sceneMode) !== "false");
      setIsHighDensity(String(storedSettings.isHighDensity ?? config.highDensity) === "true");
      setPreserveOriginalScript(config.preserveOriginalScript !== false);
      setRewriteScript(
        config.preserveOriginalScript === false ||
        config.rewriteLengthMode !== "source" ||
        Boolean(String(config.scriptInstructions || "").trim()),
      );
      const presetRewriteLengthMode = String(config.rewriteLengthMode || "source");
      setAutoRewriteLengthMode(
        presetRewriteLengthMode === "words"
          ? "words"
          : presetRewriteLengthMode === "minutes"
            ? "minutes"
            : "source",
      );
      if (Number.isFinite(Number(config.rewriteTargetWords)) && Number(config.rewriteTargetWords) > 0) {
        setAutoRewriteTargetWords(Math.round(Number(config.rewriteTargetWords)));
      }
      if (Number.isFinite(Number(config.rewriteTargetMinutes)) && Number(config.rewriteTargetMinutes) > 0) {
        setAutoRewriteTargetMinutes(Number(config.rewriteTargetMinutes));
      }
      if (storedSettings.autoSteps && typeof storedSettings.autoSteps === "object") {
        setAutoSteps({
          step1: storedSettings.autoSteps.step1 !== false,
          step2: storedSettings.autoSteps.step2 !== false,
          step3: storedSettings.autoSteps.step3 !== false,
        });
      }
      if (typeof storedSettings.autoHookStyle === "string" && storedSettings.autoHookStyle.trim()) {
        setAutoHookStyle(storedSettings.autoHookStyle);
      }
      if (typeof storedSettings.channelName === "string") setChannelName(storedSettings.channelName);
      if (typeof storedSettings.targetKeywords === "string") setTargetKeywords(storedSettings.targetKeywords);
      if (typeof storedSettings.imageStyle === "string" && storedSettings.imageStyle.trim()) {
        setImageStyle(storedSettings.imageStyle);
      }
      if (typeof storedSettings.selectedVoice === "string" && storedSettings.selectedVoice.trim()) {
        setSelectedVoice(storedSettings.selectedVoice);
      }

      // Never carry derived content from the project that happened to be open
      // when the scheduler claimed this job. These values are rebuilt from the
      // job's own input inside its own newly-created project directory.
      setStoryboardData(null);
      setGeneratedImages({});
      setGeneratedAudio("");
      setSeoData(null);
      setThumbnailPreviewUrl("");
      setRawHook("");
      setHookOptions([]);
      setChosenHookText("");
      setAutoPipelineLogs([]);
      setAutoPipelineProgress(0);
      setPipelineExpectedPromptCount(0);
      setStep4Done(false);
      setStep5Done(false);
      setStep6Done(false);
      setRawTranscript(String(job.input || ""));
      setStandardizedScript("");
      useProjectDirectoryAsDestination(String(job.projectDir || ""));
      setActiveStep("autopipeline");
      setAutomationConfigRevision(value => value + 1);
    } catch (error) {
      scheduledJobLaunchRef.current = null;
      console.error("Không thể nhận tác vụ Telegram/preset:", error);
    }
  };

  // Start only after React has committed the job-specific input, directory and
  // cleared output state. A fixed timeout was racy on slower machines and could
  // execute the runner closure from the previous project.
  useEffect(() => {
    const pending = scheduledJobLaunchRef.current;
    if (!pending || autoPipelineRunningRef.current) return;
    if (scheduledJobRef.current !== pending.jobId) return;
    if (activeStep !== "autopipeline") return;
    if (rawTranscript.trim() !== pending.input) return;
    if (projectDir.trim() !== pending.projectDir) return;
    if (standardizedScript.trim() || storyboardData?.scenes?.length) return;
    if (Object.keys(generatedImages).length || generatedAudio || seoData) return;
    scheduledJobLaunchRef.current = null;
    void autoPipelineRunnerRef.current(false);
  }, [
    activeStep,
    automationConfigRevision,
    generatedAudio,
    generatedImages,
    projectDir,
    rawTranscript,
    seoData,
    standardizedScript,
    storyboardData,
  ]);

  const openScheduledJobForResume = async (jobId: string) => {
    if (autoPipelineRunningRef.current)
      throw new Error("Một quy trình khác đang chạy. Hãy dừng hoặc chờ task đó hoàn tất.");
    const response = await fetch(`/api/automation/jobs/${jobId}/resume`, {
      method: "POST",
    });
    const payload = await response.json();
    if (!response.ok || !payload?.job || !payload?.preset?.config)
      throw new Error(
        payload.error === "JOB_NOT_RESUMABLE"
          ? "Task chưa ở trạng thái có thể tiếp tục."
          : payload.error || "Không thể mở task để tiếp tục.",
      );
    const job = payload.job;
    const snapshot = payload.preset.config || {};
    const storedSettings =
      snapshot.settings && typeof snapshot.settings === "object"
        ? snapshot.settings
        : {};
    for (const [key, value] of Object.entries(storedSettings)) {
      if (value !== undefined && value !== null)
        localStorage.setItem(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
    }
    const config = { ...(snapshot.autoConfig || snapshot), inputType: job.inputType };
    scheduledJobRef.current = job.id;
    localStorage.setItem("automation_full_config_v1", JSON.stringify(config));
    await fetch("/api/config/automation-default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    setRawTranscript(String(job.input || ""));
    await handleProjectDirChange(String(job.projectDir || ""), true);
    const progress = Math.max(0, Math.min(99, Number(job.progress) || 0));
    const recoveryStage: 1 | 2 | 3 | 4 =
      progress >= 94 ? 4 : progress >= 84 ? 3 : progress >= 60 ? 2 : 1;
    setAutoPipelineProgress(progress);
    setManualWorkflowStage(recoveryStage);
    setManualTwoStageReviewReady(true);
    setAutomationConfigRevision(value => value + 1);
    // Telegram resume is a one-click automatic continuation. Reuse the
    // proven stage handlers internally, but never send the customer to the
    // manual tab or require another button press. Completed files are scanned
    // at each stage, so only missing media/work is produced.
    setActiveStep("autopipeline");
    window.setTimeout(() => {
      void (async () => {
        const stages: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4].filter(
          (stage): stage is 1 | 2 | 3 | 4 => stage >= recoveryStage,
        );
        for (const stage of stages) {
          // A failed/cancelled stage clears this link in the pipeline finally
          // block. Stop the chain instead of advancing with incomplete data.
          if (scheduledJobRef.current !== job.id) break;
          setManualWorkflowStage(stage);
          await autoPipelineRunnerRef.current(true, stage);
          if (scheduledJobRef.current !== job.id) break;
          // Let React publish the durable output of the previous stage before
          // the next stage reads it (storyboard -> voice -> render).
          await new Promise(resolve => window.setTimeout(resolve, 500));
        }
      })();
    }, 700);
  };

  useEffect(() => {
    const poll = () => { if (!autoPipelineRunningRef.current && !scheduledJobRef.current) void claimAndRunScheduledJob(); };
    const timer = window.setInterval(poll, 7000);
    poll();
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const jobId = scheduledJobRef.current;
    if (!jobId || !isPlayingAutoPipeline) return;
    const latestDetail = autoPipelineLogs[autoPipelineLogs.length - 1] || "VidiFlow đang xử lý Auto Pipeline...";
    void fetch(`/api/automation/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "running",
        progress: Math.max(1, Math.min(99, Math.round(autoPipelineProgress))),
        message: latestDetail,
      }),
    }).catch(() => null);
  }, [autoPipelineLogs, autoPipelineProgress, isPlayingAutoPipeline]);

  useEffect(() => {
    if (!isPlayingAutoPipeline || !scheduledJobRef.current) return;
    const timer = window.setInterval(() => {
      const jobId = scheduledJobRef.current;
      if (!jobId) return;
      const latestDetail = autoPipelineLogs[autoPipelineLogs.length - 1] || "VidiFlow đang xử lý Auto Pipeline...";
      void fetch(`/api/automation/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "running",
          progress: Math.max(1, Math.min(99, Math.round(autoPipelineProgress))),
          message: latestDetail,
        }),
      }).catch(() => null);
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [autoPipelineLogs, autoPipelineProgress, isPlayingAutoPipeline]);

  const handleClearSavedData = (silent = false) => {
    const executeClear = () => {
      try {
        // Reset only the project currently displayed in the tool. Settings,
        // API configuration, signed-in Chrome profiles, custom styles and
        // all files on disk remain untouched.
        const projectOnlyKeys = [
          "projectDir", "rawTranscript", "standardizedScript", "scriptEditRequest",
          "rawHook", "hookOptions", "chosenHookText", "hookLang", "brainstormData",
          "customKeyword", "storyboardData", "storyboardEditRequest", "generatedImages",
          "generatedAudioByProject", "seoData", "activeStep"
        ];
        projectOnlyKeys.forEach(key => localStorage.removeItem(key));
        sessionStorage.clear();
      } catch (e) {
        console.error("Lỗi khi xoá bộ nhớ trình duyệt:", e);
      }
      // Reload lại trang để làm sạch toàn bộ React states và bắt đầu lại hoàn toàn mới
      window.location.reload();
    };

    if (silent) {
      executeClear();
    } else {
      setShowClearProjectModal(true);
    }
  };

  const triggerCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Hàm gửi tin nhắn thông báo về Telegram Bot của người dùng
  const sendTelegramNotification = async (msg: string) => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      return false;
    }
    try {
      const url = `https://api.telegram.org/bot${telegramToken.trim()}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId.trim(),
          text: msg,
          parse_mode: "HTML"
        })
      });
      return res.ok;
    } catch (e) {
      console.error("Lỗi gửi tin Telegram:", e);
      return false;
    }
  };

  // Hàm chạy toàn bộ quy trình tự động hóa liên hoàn (Run Suite Pipeline)
  const handleRunAutoPipeline = async (twoStage = false, manualStageOverride?: 1 | 2 | 3 | 4) => {
    const updateScheduledJob = async (status: "running" | "completed" | "failed" | "cancelled", progress: number, message: string, details: Record<string, unknown> = {}) => {
      const jobId = scheduledJobRef.current;
      if (!jobId) return;
      await fetch(`/api/automation/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, progress, message, ...details }),
      }).catch(() => null);
    };
    if (!twoStage) {
      try {
        const entitlement = await fetch("/api/license/authorize-auto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: activeStep === "presetpipeline" ? "preset" : "full" }),
        });
        const data = await entitlement.json();
        if (!entitlement.ok || !data.allowed) {
          await updateScheduledJob("failed", 0, data.error || "Gói hiện tại không có quyền dùng Tạo video tự động.");
          scheduledJobRef.current = null;
          window.alert(data.error || "Gói hiện tại không có quyền dùng Tạo video tự động.");
          return;
        }
        setLicensePlan(data.plan || "none");
      } catch {
        await updateScheduledJob("failed", 0, "Không thể xác minh quyền dùng Tạo video tự động với dashboard.");
        scheduledJobRef.current = null;
        window.alert("Không thể xác minh quyền dùng Tạo video tự động với dashboard.");
        return;
      }
    }
    // Use a ref as the actual concurrency lock. React state is for UI only;
    // relying on a rendered closure here could make a newly selected manual
    // stage appear clickable while its action immediately returned.
    if (autoPipelineRunningRef.current) return;
    if (!projectDir.trim()) {
      setShowProjectFolderModal(true);
      return;
    }
    
    const pipelineStartedAt = Date.now();
    autoPipelineRunningRef.current = true;
    setIsPlayingAutoPipeline(true);
    setAutoPipelineProgress(5);
    const controller = new AbortController();
    autoPipelineAbortController.current = controller;
    const manualStage = twoStage ? (manualStageOverride || manualWorkflowStage) : 0;
    if (twoStage) setManualTwoStageReviewReady(false);
    const isProductionStage = twoStage && manualStage > 1;
    // Running one manual step must never erase output from another completed
    // step. A full reset already has its own explicit action in the UI.
    setAutoStepStatus({
      step1: !isProductionStage && autoSteps.step1 ? "pending" : "skipped",
      step2: !isProductionStage && autoSteps.step2 ? "pending" : "skipped",
      step3: !isProductionStage && autoSteps.step3 ? "pending" : "skipped",
    });
    let runningAutoStep: "step1" | "step2" | "step3" | null = null;
    const logs: string[] = [];
    const addLog = (text: string) => {
      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour12: false });
      logs.push(`[${timeStr}] ${text}`);
      setAutoPipelineLogs([...logs]);
    };

    addLog("🚀 KHỞI ĐỘNG QUY TRÌNH TỰ ĐỘNG HÓA LIÊN HOÀN VIP...");
    addLog(`Dự án/Từ khóa cốt lõi: "${customKeyword || brainstormData?.topicRecommended || "Dự Án Chưa Đặt Tên"}"`);
    
    let currentScript = isProductionStage ? (standardizedScript || rawTranscript) : rawTranscript;
    let finalScript = isProductionStage ? (standardizedScript || rawTranscript) : "";
    let chosenHook = "";
    let preserveOriginalMode = false;
    let autoStoryboard: any = storyboardData;
    let restoredSeoFromProject: any = null;
    let pipelineRecoveryStage: 1 | 2 | 3 | 4 = 1;
    let effectiveCharacterLock = characterDescription.trim();
    let pipelineAutomationConfig: any = {};
    try { pipelineAutomationConfig = JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}"); } catch {}
    // Google Labs / Flow may request an interactive login or reCAPTCHA.
    // Keep its Chrome window visible so the customer can complete that step.
    if (pipelineAutomationConfig.generationMode === "labs-flow") {
      pipelineAutomationConfig.chromeHeadless = false;
    } else if (!twoStage) {
      pipelineAutomationConfig.chromeHeadless = true;
    }
    // A reference image is analyzed immediately on upload. Use that visual
    // bible before Step 3, not only later when the generator attaches the file.
    if (!effectiveCharacterLock && pipelineAutomationConfig.characterBible) {
      effectiveCharacterLock = String(pipelineAutomationConfig.characterBible).trim();
      if (effectiveCharacterLock) addLog("✓ Đã áp dụng hồ sơ từ ảnh tham chiếu trước khi tạo prompt.");
    }

    let pipelineCompletedSuccessfully = false;
    let pipelineFailedOrCancelled = false;
    try {
      // A completed project may be reopened after React state was cleared or
      // after the app restarted. Manual steps must use the durable script.txt
      // backup instead of treating the project as empty while its media still
      // exists on disk.
      if (
        isProductionStage &&
        (!String(finalScript || "").trim() ||
          !autoStoryboard?.scenes?.length ||
          (manualStage === 4 && !seoData))
      ) {
        const projectStateResponse = await fetch("/api/project-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ path: projectDir }),
        });
        const projectState = projectStateResponse.ok
          ? await projectStateResponse.json()
          : null;
        const restored = projectState?.backupScript
          ? restoreBackupContent(projectState.backupScript, false)
          : null;
        if (restored?.restoredScript && !String(finalScript || "").trim()) {
          finalScript = restored.restoredScript;
          currentScript = restored.restoredScript;
        }
        if (restored?.scenes?.length && !autoStoryboard?.scenes?.length) {
          autoStoryboard = {
            scenes: restored.scenes,
            ...(scriptLang === "vi"
              ? { script_vi: restored.restoredScript }
              : { script_en: restored.restoredScript }),
          };
          addLog(`✓ Đã khôi phục ${restored.scenes.length} phân cảnh/prompt từ script.txt của dự án.`);
        }
        restoredSeoFromProject = restored?.seoData || null;
      }
      // Link mạng xã hội không phải là kịch bản. Luôn bóc tách thành transcript
      // trước khi đưa vào AI chuẩn hóa để tránh AI "viết lại" chính URL đó.
      if (/^https?:\/\//i.test(currentScript.trim())) {
        addLog("▶ Đã phát hiện link video: đang tải và bóc tách kịch bản trước khi chạy chuỗi.");
        setAutoPipelineProgress(8);
        const extractResponse = await fetch("/api/transcribe-social-link", {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({ url: currentScript.trim() }),
        });
        const extracted = await extractResponse.json();
        if (!extractResponse.ok || !extracted.transcript) {
          throw new Error(extracted.error || "Không thể bóc tách kịch bản từ link video.");
        }
        currentScript = String(extracted.transcript).trim();
        setRawTranscript(currentScript);
        addLog(`✓ Đã bóc tách kịch bản (${currentScript.split(/\s+/).filter(Boolean).length} từ).`);
      }
      // ---------------- BƯỚC 1: CHUẨN HÓA KỊCH BẢN ----------------
      if (!isProductionStage && autoSteps.step1) {
        runningAutoStep = "step1";
        setAutoStepStatus((previous) => ({ ...previous, step1: "running" }));
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        addLog("▶ [1/3] Đang chuẩn hóa tinh chất kịch bản bằng AI...");
        setAutoPipelineProgress(15);
        
        if (!currentScript.trim()) {
          throw new Error("Không tìm thấy transcript thô ở Bước 1 để tự động xử lý. Vui lòng dán văn bản mẫu hoặc dán kịch bản vào Bước 1 trước!");
        }

        let automationConfig: any = {};
        try { automationConfig = JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}"); } catch {}
        // "Giữ nguyên 100%" is intentionally not sent through the AI
        // normalizer: punctuation, wording and line breaks must remain exact.
        const requestedRewriteLevel = String(automationConfig.rewriteLevel || "original");
        const rewriteRequestedByConfig = ["keep", "light", "balanced", "strong"].includes(requestedRewriteLevel);
        const shouldRewriteCurrentScript =
          scriptLang !== "original" ||
          rewriteRequestedByConfig ||
          automationConfig.rewriteLengthMode !== "source" ||
          Boolean(String(automationConfig.scriptInstructions || "").trim());
        preserveOriginalMode =
          scriptLang === "original" &&
          automationConfig.rewriteLengthMode === "source" &&
          !String(automationConfig.scriptInstructions || "").trim() &&
          automationConfig.inputType !== "idea" &&
          !rewriteRequestedByConfig &&
          (automationConfig.preserveOriginalScript !== false || requestedRewriteLevel === "original");
        if (preserveOriginalMode) {
          finalScript = currentScript;
          setStandardizedScript(finalScript);
          setRawHook(extractOpeningHookText(finalScript));
          addLog("✓ Giữ nguyên 100% nội dung gốc theo lựa chọn.");
          setAutoPipelineProgress(35);
          setAutoStepStatus((previous) => ({ ...previous, step1: "completed" }));
        } else {
        const res = await fetch("/api/process-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            transcript: currentScript,
            language: scriptLang,
            rewriteScript: shouldRewriteCurrentScript,
            rewriteLevel: requestedRewriteLevel,
            newScriptLength,
            rewriteLengthMode: autoRewriteLengthMode,
            targetWords: autoRewriteLengthMode === "words" ? autoRewriteTargetWords : undefined,
            targetDurationMinutes: autoRewriteLengthMode === "minutes" ? autoRewriteTargetMinutes : undefined,
            contentGenre: automationConfig.customGenre || automationConfig.genre,
            contentAudience: automationConfig.audience || "general",
            writingStyle: automationConfig.writingStyle || "engaging",
            factCheck: automationConfig.factCheck === true,
            additionalInstructions: automationConfig.scriptInstructions || "",
            modifyIntroOnly
          }),
          signal: controller.signal
        });
        
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        if (!res.ok) {
          let errMsg = "Lỗi chuẩn hóa kịch bản ở Bước 1.";
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch (e) {
            try {
              const htmlText = await res.text();
              errMsg = htmlText.includes("Timeout") || htmlText.includes("timeout") 
                ? "Thời gian xử lý quá lâu (Gateway Timeout). Kịch bản quá dài khiến AI quá tải."
                : `Lỗi máy chủ (${res.status}): ` + htmlText.slice(0, 150) + "...";
            } catch (inner) {}
          }
          throw new Error(errMsg);
        }
        const data = await res.json();

        finalScript = data.processedScript;
        setStandardizedScript(finalScript);
        setIsProgrammatic(!!data.isProgrammaticFallback);
        
        // Cập nhật rawHook dính kèm
        const firstLines = extractOpeningHookText(data.processedScript);
        setRawHook(firstLines);
        
        addLog(`✅ Đã chuẩn hóa kịch bản hoàn chỉnh (Tổng số ký tự: ${finalScript.length}).`);
        setAutoPipelineProgress(35);
        setAutoStepStatus((previous) => ({ ...previous, step1: "completed" }));

        // Gửi báo cáo Telegram từng bước 1
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`🛎️ <b>[Xong Bước 1] Chuẩn Hóa Kịch Bản</b>\n- Độ dài kịch bản: <code>${finalScript.length} ký tự</code>\n- Trạng thái: <code>Thành Công</code>`);
        }
        }
      } else {
        addLog("⏸ Bỏ qua Bước 1 (Sử dụng kịch bản đã có sẵn ở Bước 1).");
        finalScript = standardizedScript || rawTranscript;
        // React state can be empty immediately after a restart even though the
        // selected project still has a complete portable backup on disk.
        // Restore it before rejecting a manual Step 2 rerun.
        if (!finalScript.trim() && projectDir) {
          const projectStateResponse = await fetch("/api/project-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({ path: projectDir }),
          });
          const projectState = projectStateResponse.ok
            ? await projectStateResponse.json()
            : null;
          const restored = projectState?.backupScript
            ? restoreBackupContent(projectState.backupScript, false)
            : null;
          if (restored?.restoredScript) {
            finalScript = restored.restoredScript;
            currentScript = restored.restoredScript;
            if (restored.scenes?.length) {
              autoStoryboard = {
                scenes: restored.scenes,
                ...(scriptLang === "vi"
                  ? { script_vi: restored.restoredScript }
                  : { script_en: restored.restoredScript }),
              };
            }
            addLog(`✓ Đã khôi phục kịch bản và ${restored.scenes?.length || 0} phân cảnh từ script.txt.`);
          } else if (String(projectState?.rawScript || "").trim()) {
            finalScript = String(projectState.rawScript).trim();
            currentScript = finalScript;
            addLog("✓ Đã khôi phục nội dung kịch bản từ raw_script.txt.");
          }
        }
        if (!finalScript.trim()) {
          throw new Error("Kịch bản của bạn hiện đang trống rỗng. Hãy kích hoạt Bước 1 trong luồng tự động để AI tự viết!");
        }
      }

      // ---------------- BƯỚC 2: VIẾT LẠI HOOK GIỮ CHÂN ----------------
      // Respect the automatic-screen Hook toggle. A disabled Hook must not
      // block the production run before storyboarding/media generation.
      if (!isProductionStage && autoSteps.step2 && !preserveOriginalMode && pipelineAutomationConfig.hookEnabled !== false) {
        runningAutoStep = "step2";
        setAutoStepStatus((previous) => ({ ...previous, step2: "running" }));
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        addLog("▶ [2/3] Đang cải tiến câu Hook mở đầu bằng AI...");
        setAutoPipelineProgress(45);
        
        const savedHook = rawHook.trim();
        const hookToImprove = savedHook && finalScript.includes(savedHook)
          ? savedHook
          : extractOpeningHookText(finalScript);
        if (!hookToImprove.trim()) {
          throw new Error("Nội dung Hook mở đầu hiện trống rỗng. Không thể cải tiến.");
        }

        const res = await fetch("/api/generate-hook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldHook: hookToImprove,
            context: finalScript,
            language: hookLang,
            rewriteStyle: hookRewriteStyle
          }),
          signal: controller.signal
        });

        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        if (!res.ok) {
          let errMsg = "Lỗi cải tiến Hook ở Bước 2.";
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch (e) {
            try {
              const htmlText = await res.text();
              errMsg = htmlText.includes("Timeout") || htmlText.includes("timeout") 
                ? "Thời gian xử lý quá lâu (Gateway Timeout). Kịch bản quá dài khiến AI quá tải."
                : `Lỗi máy chủ (${res.status}): ` + htmlText.slice(0, 150) + "...";
            } catch (inner) {}
          }
          throw new Error(errMsg);
        }
        const data = await res.json();

        if (Array.isArray(data.hookOptions) && data.hookOptions.length > 0) {
          setHookOptions(data.hookOptions);
          setHookOptionsText(JSON.stringify(data.hookOptions));
          
          // Trích lọc Hook theo style yêu thích trước
          let selectedOption = data.hookOptions[0];
          const styleUpper = autoHookStyle.toLowerCase();
          if (styleUpper === "shocking") {
            const found = data.hookOptions.find((o: any) => o.style.toLowerCase().includes("sốc") || o.style.toLowerCase().includes("chấn") || o.style.toLowerCase().includes("kịch tính") || o.style.toLowerCase().includes("shock"));
            if (found) selectedOption = found;
          } else if (styleUpper === "question") {
            const found = data.hookOptions.find((o: any) => o.style.toLowerCase().includes("hỏi") || o.style.toLowerCase().includes("tò mò") || o.style.toLowerCase().includes("question"));
            if (found) selectedOption = found;
          } else if (styleUpper === "warning") {
            const found = data.hookOptions.find((o: any) => o.style.toLowerCase().includes("cảnh báo") || o.style.toLowerCase().includes("nguy hiểm") || o.style.toLowerCase().includes("báo") || o.style.toLowerCase().includes("warning"));
            if (found) selectedOption = found;
          } else if (styleUpper === "benefit") {
            const found = data.hookOptions.find((o: any) => o.style.toLowerCase().includes("lợi ích") || o.style.toLowerCase().includes("hứa hẹn") || o.style.toLowerCase().includes("quả") || o.style.toLowerCase().includes("benefit"));
            if (found) selectedOption = found;
          }
          
          chosenHook = selectedOption.hookText;
          setChosenHookText(chosenHook);
          
          // Tự động ghép Hook mới vào kịch bản tổng thể
          const scriptBeforeHook = finalScript;
          const openingToReplace = hookToImprove.trim() && finalScript.includes(hookToImprove.trim())
            ? hookToImprove.trim()
            : extractOpeningHookText(finalScript);
          let updatedScript = openingToReplace && finalScript.includes(openingToReplace)
            ? finalScript.replace(openingToReplace, chosenHook)
            : `${chosenHook}\n\n${finalScript}`;

          // Final safety net: improving a hook may alter the opening, but it
          // must never collapse the rest of the narration into a summary.
          const beforeWords = scriptBeforeHook.split(/\s+/).filter(Boolean).length;
          const afterWords = updatedScript.split(/\s+/).filter(Boolean).length;
          if (beforeWords > 0 && afterWords < Math.floor(beforeWords * 0.8)) {
            updatedScript = `${chosenHook}\n\n${scriptBeforeHook}`;
          }
          
          finalScript = updatedScript;
          setStandardizedScript(finalScript);
          setRawHook(chosenHook);
          getAutoScriptPath();
          addLog(`✅ Đã cải tiến thành công Hook mở đầu theo phong cách [${selectedOption.style}]: "${chosenHook.slice(0, 50)}..."`);
          setAutoPipelineProgress(60);
          setAutoStepStatus((previous) => ({ ...previous, step2: "completed" }));

          // Gửi báo cáo Telegram từng bước 2
          if (telegramToken.trim() && telegramChatId.trim()) {
            await sendTelegramNotification(`🛎️ <b>[Xong Bước 2] Viết Lại Hook Giữ Chân</b>\n- Style được chọn: <code>${selectedOption.style}</code>\n- Hook mới: <code>${chosenHook.slice(0, 100)}...</code>\n- Trạng thái: <code>Thành Công</code>`);
          }
        } else {
          addLog("⚠️ AI không trả về các tuỳ chọn Hook hợp lệ, bỏ qua việc chèn Hook.");
        }
      } else {
        addLog(preserveOriginalMode ? "⏸ Bỏ qua tạo Hook để giữ nguyên 100% kịch bản gốc." : "⏸ Bỏ qua Bước 2.");
        chosenHook = chosenHookText;
        setAutoStepStatus((previous) => ({ ...previous, step2: "skipped" }));
        setAutoPipelineProgress(60);
      }

      // ---------------- BƯỚC 3: CHIA PHÂN CẢNH & PROMPT ẢNH ----------------
      // Once the script is available, an interrupted automatic run can safely
      // continue from the storyboard/media step in the manual workflow.
      if (finalScript.trim()) pipelineRecoveryStage = 2;

      if (twoStage && !isProductionStage) {
        if (!finalScript.trim()) throw new Error("Kịch bản chưa sẵn sàng để kiểm tra.");
        setManualTwoStageReviewReady(true);
        setManualWorkflowStage(2);
        setAutoPipelineProgress(100);
        addLog("Phần 1 đã hoàn tất. Hãy kiểm tra/chỉnh kịch bản, sau đó bấm Chạy Phần 2.");
        return;
      }

      const reuseScheduledStoryboard = Boolean(
        twoStage &&
        manualStage === 2 &&
        scheduledJobRef.current &&
        autoStoryboard?.scenes?.length,
      );
      if (autoSteps.step3 && (!twoStage || manualStage === 2) && !reuseScheduledStoryboard) {
        runningAutoStep = "step3";
        setAutoStepStatus((previous) => ({ ...previous, step3: "running" }));
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        addLog("▶ [3/3] Đang phân tích kịch bản mới để chia phân cảnh & viết Camera Prompt...");
        setAutoPipelineProgress(70);

        // When no reference image or manual character description is supplied,
        // lock an explicit reusable cast in the prompt. This prevents the
        // generator from reinventing a face, outfit or age on every scene.
        if (!effectiveCharacterLock) {
          effectiveCharacterLock = "AUTO CAST LOCK — Analyze this script and identify every recurring character, including their role and likely age/gender when the script supports it. Before drafting scenes, create a fixed visual bible for each character: face shape, hairstyle, age range, skin tone, outfit, color palette and one defining accessory. Repeat the exact same visual markers for each character in every prompt and never replace, age-shift, gender-swap or redesign them between scenes.";
          addLog("✓ Không có ảnh tham chiếu: đã tự khóa hồ sơ nhân vật bằng prompt cho toàn bộ cảnh.");
        }
        let storyboardAspectRatio = "16:9";
        try {
          const savedVisualConfig = JSON.parse(
            localStorage.getItem("automation_full_config_v1") || "{}",
          );
          const savedAspect = String(savedVisualConfig.aspectRatio || "16:9");
          storyboardAspectRatio = savedAspect.includes("9:16")
            ? "9:16"
            : savedAspect.includes("1:1")
              ? "1:1"
              : "16:9";
        } catch {}
        const explicitSceneLabels = Array.from(
          finalScript.matchAll(/\[\s*Cảnh\s+\d+[^\]]*\]/gi),
        );
        const hasExplicitScenePlan = explicitSceneLabels.length >= 2;
        let res = await fetch("/api/generate-storyboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            script: finalScript,
            style: imageStyle,
            scenesCount: hasExplicitScenePlan
              ? explicitSceneLabels.length
              : scenesCount,
            promptsPerScene,
            // A script that explicitly labels [Cảnh 1], [Cảnh 2]... already
            // defines its scene boundaries. Splitting it again by sentence
            // turned eight requested clips into nine or more clips.
            useDialogueSplit: hasExplicitScenePlan ? false : useDialogueSplit,
            dialogueGroupSize,
            promptsFocus,
            isHighDensity: false, // Forcing to false
            targetPromptsCount,
            characterDescription: effectiveCharacterLock
          }),
          signal: controller.signal
        });

        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        if (!res.ok) {
          let errMsg = "Lỗi tạo kịch bản phân cảnh ở Bước 3.";
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch (e) {
            try {
              const htmlText = await res.text();
              errMsg = htmlText.includes("Timeout") || htmlText.includes("timeout") 
                ? "Thời gian xử lý quá lâu (Gateway Timeout). Kịch bản quá dài khiến AI quá tải."
                : `Lỗi máy chủ (${res.status}): ` + htmlText.slice(0, 150) + "...";
            } catch (inner) {}
          }
          throw new Error(errMsg);
        }
        const data = await res.json();
        if (Array.isArray(data?.scenes)) {
          data.scenes = data.scenes.map((scene: any) => ({
            ...scene,
            imagePrompts: Array.isArray(scene?.imagePrompts)
              ? scene.imagePrompts.map((prompt: any) => {
                  const normalizeAspect = (value: unknown) => {
                    const text = String(value || "").trim();
                    const withoutAspect = text
                      .replace(/\s*--ar\s+(?:16:9|9:16|1:1)\b/gi, "")
                      .trim();
                    return `${withoutAspect} --ar ${storyboardAspectRatio}`.trim();
                  };
                  return {
                    ...prompt,
                    englishPrompt: normalizeAspect(
                      prompt.englishPrompt || prompt.prompt,
                    ),
                    prompt: normalizeAspect(
                      prompt.prompt || prompt.englishPrompt,
                    ),
                  };
                })
              : scene?.imagePrompts,
          }));
        }

        const overviewEnabled = pipelineAutomationConfig.overviewZoomEnabled === true;
        const overviewBoards = await planOverviewBoardsFromScript(finalScript, data.scenes || [], overviewEnabled);
        const overviewManifest = applyScriptOverviewZoomPlan(data, overviewEnabled, overviewBoards, imageStyle, storyboardAspectRatio);
        await saveOverviewZoomManifest(projectDir, overviewManifest);
        if (overviewManifest.enabled) addLog(`✓ Đã tạo bảng tổng quan với ${overviewManifest.entries.length} mốc zoom đúng theo câu thoại đánh số; không tăng prompt/voice.`);
        else if (overviewEnabled) addLog("ℹ Không thấy chuỗi Phần/Bước/Cấp độ/Kiểu/Loại đánh số rõ ràng; tự bỏ qua ảnh tổng quan.");

        autoStoryboard = data;
        setStoryboardData(data);
        setIsStoryboardProgrammatic(!!data.isProgrammaticFallback);
        // Keep existing preview state. Step 4 will reconcile it with files on
        // disk and only create the prompts that are genuinely missing.
        
        const totalPrompts = data.scenes?.reduce((acc: number, s: any) => acc + (s.imagePrompts?.length || 0), 0) || 0;
        addLog(`✅ Đã chia kịch bản thành ${data.scenes?.length || 0} phân cảnh chính với tổng ${totalPrompts} ảnh prompts chi tiết.`);
        // Storyboard is only the planning phase. Do not show 100% until media,
        // voice, SEO and the final render have all completed.
        setAutoPipelineProgress(72);
        setAutoStepStatus((previous) => ({ ...previous, step3: "completed" }));

        // Gửi báo cáo Telegram từng bước 3
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`🛎️ <b>[Xong Bước 3] Chia Phân Cảnh & Prompts Ảnh</b>\n- Số phân cảnh: <code>${data.scenes?.length || 0} cảnh</code>\n- Tổng số prompts: <code>${totalPrompts} prompts</code>\n- Trạng thái: <code>Thành Công</code>`);
        }
      } else if (reuseScheduledStoryboard) {
        const restoredPromptCount = autoStoryboard.scenes.reduce(
          (total: number, scene: any) => total + (scene.imagePrompts?.length || 0),
          0,
        );
        addLog(
          `✓ Tiếp tục task: giữ nguyên ${autoStoryboard.scenes.length} phân cảnh và ${restoredPromptCount} prompt đã duyệt; chỉ tạo media còn thiếu.`,
        );
        setAutoPipelineProgress(72);
        setAutoStepStatus((previous) => ({ ...previous, step3: "completed" }));
      } else {
        addLog("⏸ Bỏ qua Bước 3.");
      }

      // ---------------- BƯỚC 4: TẠO ẢNH / VIDEO ----------------
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      if (!autoStoryboard && !finalScript) {
        throw new Error("Chưa thể chạy bước này: thiếu kịch bản ở Bước 1 và thiếu phân cảnh/prompt ở Bước 2.");
      }
      // Dùng kết quả Bước 3 trong cùng lượt chạy, không chờ React cập nhật state bất đồng bộ.
      const activeStoryboard = autoStoryboard;
      if (!activeStoryboard?.scenes?.length) {
        throw new Error("Chưa thể chạy bước này: thiếu phân cảnh và prompt ở Bước 2. Hãy tạo hoặc nạp lại dữ liệu Bước 2 trước.");
      }
      let visualConfig: any = {};
      try { visualConfig = JSON.parse(localStorage.getItem("cc_visualConfig_v2") || "{}"); } catch {}
      if (visualConfig.generationMode === "labs-flow") {
        visualConfig.chromeHeadless = false;
      } else if (!twoStage) {
        visualConfig.chromeHeadless = true;
      }
      try {
        const chromeConfig = JSON.parse(localStorage.getItem("capcut_ultra_chrome_profiles") || "{}");
        visualConfig.chromeProfilesEnabled = !!chromeConfig.enabled;
        visualConfig.chromeProfiles = chromeConfig.enabled ? (chromeConfig.profiles || []).filter((profile: any) => profile.active) : [];
      } catch {}
      // Saved configurations may hold display labels (for example 9:16 with a
      // descriptive suffix). Keep one concrete value for every downstream job.
      const savedAspectRatio = String(visualConfig.aspectRatio || "16:9");
      const targetAspectRatio = savedAspectRatio.includes("9:16") ? "9:16" : savedAspectRatio.includes("1:1") ? "1:1" : "16:9";
      visualConfig.aspectRatio = targetAspectRatio;
      visualConfig.videoDuration = String(visualConfig.videoDuration || "10s");
      const isVideoOutput = String(visualConfig.generateType || "image").toLowerCase() === "video";
      const useDialogueVideoAudio = isVideoOutput && visualConfig.dialogueVideoMode === true && visualConfig.keepVideoAudio !== false;
      const fallbackFailedVideosToImages =
        isVideoOutput &&
        !useDialogueVideoAudio &&
        visualConfig.fallbackFailedVideosToImages === true;
      // Keep the style lock in the same scope as every media path. Both the
      // batch generator and the individual-scene fallback build their prompts
      // through this helper.
      const illustratedStyle = /(chalk|blackboard|hand[- ]drawn|cartoon|animation|watercolou?r|comic|anime|clay|paper|low[- ]poly|chibi|illustration)/i.test(imageStyle);
      const filterCharacterLockForScene = (
        fullLock: string,
        sceneEvidence: string,
      ) => {
        const lock = String(fullLock || "").trim();
        if (!lock || !/MULTI-CHARACTER IDENTITY LOCK/i.test(lock)) return lock;
        const evidence = String(sceneEvidence || "").toLocaleLowerCase("vi");
        const blocks = Array.from(
          lock.matchAll(
            /(\[CHAR_\d+\][\s\S]*?)(?=\n\n\[CHAR_\d+\]|\n\nRULES:|$)/gi,
          ),
          (match) => match[1].trim(),
        );
        const matchedBlocks = blocks.filter((block) => {
          const header = block.match(
            /^\[(CHAR_\d+)\]\s+NAME:\s*([^|\n]+)(?:\s*\|\s*ALIASES:\s*([^\n]+))?/i,
          );
          if (!header) return false;
          const fullName = String(header[2] || "").trim();
          const nameParts = fullName.split(/\s+/).filter(Boolean);
          const identities = [
            header[1],
            fullName,
            nameParts[0],
            nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
            ...String(header[3] || "").split(/[,;|]/),
          ]
            .map((value) => value.trim().toLocaleLowerCase("vi"))
            .filter((value) => value.length >= 2);
          return identities.some((identity) => evidence.includes(identity));
        });
        // Pronoun-only scenes cannot be mapped safely. Preserve the original
        // lock in that case instead of silently dropping identity guidance.
        if (!matchedBlocks.length) return lock;
        const rules =
          lock.match(/\n\nRULES:[\s\S]*$/i)?.[0].trim() ||
          "RULES: Preserve every listed identity exactly and include only the characters present in this scene.";
        return [
          "MULTI-CHARACTER IDENTITY LOCK (IMMUTABLE):",
          ...matchedBlocks,
          rules,
        ].join("\n\n");
      };
      const lockSceneStyle = (
        scenePrompt: string,
        spokenText = "",
        characterEvidence = "",
      ) => {
        const rawSpokenText = String(spokenText || "").replace(/\s+/g, " ").trim();
        let visualOnlyPrompt = String(scenePrompt || "")
          .replace(/Narrative beat to depict exactly\s*\([^)]*voice-over[^)]*\)\s*:\s*/gi, "")
          .replace(/Narrative beat to depict exactly\s*:\s*/gi, "");
        // Keep the transcript in subText for voice/timeline only. Supplying a
        // verbatim quoted sentence to an image model often makes it render a
        // caption even when the same request also contains "no text".
        if (rawSpokenText) visualOnlyPrompt = visualOnlyPrompt.split(rawSpokenText).join(" ");
        visualOnlyPrompt = visualOnlyPrompt.replace(/\s+/g, " ").replace(/^\s*[.:;,-]+\s*/, "").trim();
        const allowInfographicText = !isVideoOutput && visualConfig.noText === false;
        let cleanedPrompt = illustratedStyle
          ? visualOnlyPrompt.replace(/\b(photorealistic|photo[- ]realistic|realistic photograph|live[- ]action|cinematic realism|hyperrealistic)\b/gi, "")
          : visualOnlyPrompt;
        if (allowInfographicText) {
          // Saved storyboard prompts may still contain the old global ban.
          // Remove only typography prohibitions; logo/watermark restrictions
          // remain intact.
          cleanedPrompt = cleanedPrompt
            .replace(/\b(?:no|zero)\s+(?:visible\s+)?(?:text|typography|letters?|words?|numbers?|glyphs?|captions?|subtitles?|title cards?|speech bubbles?)\b/gi, " ")
            .replace(/\bdo not (?:render|show|display) (?:the )?(?:narration|text|captions?|subtitles?|typography)[^.;]*/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
        const styleGuard = illustratedStyle
          ? "This is an illustrated artwork, never a photograph, never live action, never photorealistic."
          : "Use the selected visual medium consistently.";
        const textLanguage = /[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/i.test(rawSpokenText)
          ? "Vietnamese"
          : "the narration language";
        const noTypography = allowInfographicText
          ? `INFOGRAPHIC TEXT POLICY: On-image text is optional and must only clarify the visual meaning. Use at most 1–3 concise labels, a short descriptive phrase, a percentage, ratio, formula or key number when the narration genuinely benefits from it. Write in ${textLanguage}. Summarize the idea; never copy the full narration, never create subtitles, paragraphs, dialogue captions or title-card prose. Keep typography clean, large, readable and integrated with the diagram. Do not invent facts or numbers absent from the narration.`
          : !isVideoOutput
            ? "ABSOLUTE TYPOGRAPHY BAN: create a purely visual scene with zero visible glyphs. Do not render narration, quotations, labels, signs, handwriting, numbers, letters, captions, title cards or speech bubbles anywhere in the image. Every sign-like, paper or display surface must be blank and unreadable."
            : "Do not display the dialogue as captions, subtitles, signs or on-screen text.";
        const identityLock = filterCharacterLockForScene(
          String(
            visualConfig.characterBible || effectiveCharacterLock || "",
          ).trim(),
          `${scenePrompt}\n${spokenText}\n${characterEvidence}`,
        );
        // Content must lead the request. Previously the same long style block
        // appeared before, inside and after the scene plan, so image models
        // often produced a generic on-theme illustration instead of the exact
        // subjects and action from the narration.
        const escapedStyle = String(imageStyle || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const sceneVisualPlan = cleanedPrompt
          .replace(escapedStyle ? new RegExp(escapedStyle, "gi") : /$^/, " ")
          .replace(/MANDATORY (?:SCENE CONTENT|NARRATIVE BEAT TO VISUALIZE):[\s\S]*?(?=(?:Depict|Visually communicate))/gi, " ")
          .replace(/(?:Depict the concrete subjects|Visually communicate this exact narrative meaning)[\s\S]*?(?=--ar|$)/gi, " ")
          .replace(/--ar\s*(?:16:9|9:16|1:1)/gi, " ")
          .replace(/\s+/g, " ")
          .replace(/^\s*[.:;,-]+\s*/, "")
          .trim();
        const narrativePriority = rawSpokenText || "Use the exact subjects and action specified in the scene visual plan.";
        return [
          "VIDIFLOW_SCENE_PRIORITY_V2",
          `PRIMARY NARRATIVE MEANING — HIGHEST PRIORITY: ${narrativePriority}`,
          "CONTENT RULE: Show the concrete subjects, action, objects and setting required by the primary narrative. Every named subject must be visibly present and performing the stated action. If any later instruction conflicts with this narrative, ignore the conflicting instruction.",
          "TOPIC-SYMBOL BAN: Do not add a brain, neural network, science icon, glowing orb, infographic symbol, generic presenter or other topic-themed metaphor unless the primary narrative or scene visual plan explicitly requires it.",
          `SCENE VISUAL PLAN: ${sceneVisualPlan || narrativePriority}`,
          `${noTypography}`,
          `VISUAL STYLE — PRESENTATION ONLY, NEVER CONTENT: ${imageStyle}. ${styleGuard} Apply only the medium, palette, line work and texture after satisfying the scene content.`,
          `ASPECT RATIO: ${targetAspectRatio}`,
          identityLock,
        ].filter(Boolean).join("\n\n");
      };
      const cleanDialogueForVideo = (value: unknown) =>
        String(value || "")
          .replace(/^\s*\[?\s*Cảnh\s*\d+[^\]]*\]?\s*/i, "")
          .replace(/^\s*(?:Lời\s*thoại|Thoại)\s*:\s*/i, "")
          .replace(/^.*?\b(?:Lời\s*thoại|Thoại)\s*:\s*/i, "")
          .replace(/\s+/g, " ")
          .trim();
      const buildDialogueVideoPrompt = (scene: any, prompt: any) => {
        // Prefer the Vietnamese transcript. The previous English-first order
        // made Vietnamese projects speak the translated helper text.
        const spokenText = cleanDialogueForVideo(
          prompt.subText_vi ||
            prompt.subText ||
            scene.text_vi ||
            scene.text ||
            prompt.text_vi ||
            prompt.subText_en ||
            prompt.text_en ||
            scene.text_en ||
            "",
        );
        const characterEvidence = [
          scene?.speaker,
          scene?.text,
          scene?.text_vi,
          scene?.text_en,
          prompt?.speaker,
          prompt?.vietnameseLabel,
        ].filter(Boolean).join("\n");
        const basePrompt = lockSceneStyle(
          prompt.englishPrompt || prompt.prompt || "",
          spokenText,
          characterEvidence,
        );
        if (!useDialogueVideoAudio) return basePrompt;
        const dialogue = spokenText;
        const role = String(scene?.speaker || prompt?.speaker || "the on-screen speaking character").trim();
        const voiceGuide = String(visualConfig.dialogueVoiceGuide || "").trim() || "Infer the speaker's voice from the script and role. Create one distinctive, natural voice per recurring character, then preserve that exact voice identity, accent, age impression and speaking style in every later clip where the same character appears.";
        return `${basePrompt}\n\nDIALOGUE VIDEO MODE: Create one self-contained ${visualConfig.videoDuration} video clip with synchronized, intelligible spoken audio. The speaker is ${role} and says exactly: "${dialogue}". The quoted sentence is the only speech allowed. Speak it in Vietnamese exactly as written; never translate it, never read the prompt, and never add English words, narration, background dialogue, filler syllables or extra sentences. VOICE CONSISTENCY LOCK: ${voiceGuide} Follow only the scene-specific character identity lock above; do not add any other cast member. Natural lip sync, appropriate facial expression and body language. Do not add subtitles, captions, music, logos, or text on screen. Preserve the generated dialogue audio in the video. DURATION IS STRICT: do not return a 3-second preview or teaser.`;
      };
      const mediaFolder = projectDir + (isVideoOutput ? "\\vid" : "\\img");
      const mediaExt = isVideoOutput ? ".mp4" : ".jpg";
      const cleanSavedMedia = async (localPath: string) => {
        if (visualConfig.removeAiWatermark !== true) return;
        addLog(`Đang làm sạch watermark AI: ${localPath.split(/[\\/]/).pop() || "media"}...`);
        const response = await fetch("/api/clean-ai-watermark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            path: localPath,
            mediaType: isVideoOutput ? "video" : "image",
            backend: visualConfig.watermarkBackend === "cv2" ? "cv2" : "migan",
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.success) {
          const message = result?.error || "lỗi không xác định";
          addLog(`✕ Dừng preview cảnh này: chưa xóa được watermark (${message}).`);
          throw new Error(`WATERMARK_CLEANUP_FAILED:${message}`);
        }
        addLog(result.cleaned
          ? `✓ Đã làm sạch watermark; giữ bản gốc tại ${result.backupPath}`
          : "✓ Không phát hiện watermark cần xóa.");
      };
      const cleanExistingMediaBeforePreview = async () => {
        if (visualConfig.removeAiWatermark !== true) return;
        const response = await fetch("/api/list-project-media", {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({ directory: mediaFolder }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.success) throw new Error("WATERMARK_CLEANUP_FAILED:Không thể kiểm tra media cũ trước khi preview.");
        const files: string[] = Array.isArray(result.files) ? result.files : [];
        if (!files.length) return;
        addLog(`Đang kiểm tra/xóa watermark cho ${files.length} media đã có trước khi preview...`);
        for (const file of files) await cleanSavedMedia(`${mediaFolder}\\${file}`);
      };
      const allPrompts = activeStoryboard.scenes.flatMap((scene: any) => (scene.imagePrompts || []).map((prompt: any, promptIndex: number) => ({ scene, prompt, promptIndex })));
      // An overview board is one shared image. Generate its master once and
      // alias every numbered item to that same file; focusIndex remains in the
      // manifest and is applied only during the final render zoom.
      const normalizeOverviewCode = (value: any) => String(value || '').replace(/[._-]+/g, '_').toUpperCase();
      const overviewMasterByCode = new Map<string, string>();
      const overviewAliasesByMaster = new Map<string, string[]>();
      const overviewEntries = Array.isArray(activeStoryboard?.overviewZoom?.entries) ? activeStoryboard.overviewZoom.entries : [];
      for (const entry of overviewEntries) {
        const code = normalizeOverviewCode(entry?.code);
        const master = normalizeOverviewCode(entry?.sourceCode || entry?.code);
        if (!code || !master) continue;
        overviewMasterByCode.set(code, master);
        const aliases = overviewAliasesByMaster.get(master) || [];
        aliases.push(String(entry.code));
        overviewAliasesByMaster.set(master, aliases);
      }
      const mediaGenerationPrompts = allPrompts.filter(({ prompt }: any) => {
        const code = normalizeOverviewCode(prompt.code);
        const master = overviewMasterByCode.get(code);
        return !master || master === code;
      });
      const generationCount = mediaGenerationPrompts.length;
      const generatedKeysFor = (key: string) => {
        const master = overviewMasterByCode.get(normalizeOverviewCode(key));
        return master ? [master, ...(overviewAliasesByMaster.get(master) || [])] : [key];
      };
      const assignGeneratedMedia = (key: string, url: string, generatedMedia: Record<string, string>) => {
        for (const alias of generatedKeysFor(key)) generatedMedia[alias] = url;
      };
      const copyOverviewAliases = async (key: string, sourcePath: string) => {
        const master = overviewMasterByCode.get(normalizeOverviewCode(key));
        const aliases = master ? (overviewAliasesByMaster.get(master) || []) : [];
        const copied = new Set<string>();
        for (const alias of aliases) {
          const aliasFile = String(alias).replace(/[^a-z0-9_-]/gi, "_");
          if (!aliasFile || copied.has(aliasFile) || normalizeOverviewCode(alias) === normalizeOverviewCode(key)) continue;
          copied.add(aliasFile);
          const targetPath = mediaFolder + "\\scene-" + aliasFile + mediaExt;
          await fetch("/api/copy-local-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourcePath, targetPath }),
          });
        }
      };
      setPipelineExpectedPromptCount(allPrompts.length);
      if (generationCount < allPrompts.length) {
        addLog(`Ảnh tổng quan: tạo ${generationCount} ảnh master cho ${allPrompts.length} prompt, các mục cùng bảng dùng chung file.`);
      }
      if (!allPrompts.length) throw new Error("Các phân cảnh chưa có prompt tạo media.");
      const lockedKeyframesPipeline = isVideoOutput && visualConfig.lockedKeyframesPipeline === true;
      const lockedKeyframeByPrompt: Record<string, string> = {};
      if (lockedKeyframesPipeline && (!twoStage || manualStage === 2)) {
        addLog(`▶ Đang tạo ${allPrompts.length} ảnh khóa trước khi tạo video...`);
        const keyframeFolder = `${projectDir}\\keyframes`;
        const allKeyframeItems = mediaGenerationPrompts.map(({ scene, prompt, promptIndex }: any, index: number) => {
          const previewKey = String(prompt.code || `scene-${scene.sceneNumber || index + 1}-${promptIndex + 1}`);
          const spokenText = cleanDialogueForVideo(prompt.subText_vi || prompt.subText || scene.text_vi || scene.text || "");
          return {
            sceneId: `keyframe-${String(index + 1).padStart(3, "0")}-${previewKey.replace(/[^a-z0-9_-]/gi, "_")}`,
            previewKey,
            prompt: lockSceneStyle(prompt.englishPrompt || prompt.prompt || "", spokenText, `${scene?.speaker || ""}\n${scene?.text || ""}\n${prompt?.vietnameseLabel || ""}`),
            characterContext: `${scene?.speaker || ""}\n${scene?.text || ""}\n${prompt?.vietnameseLabel || ""}`,
          };
        });
        try {
          const listedResponse = await fetch("/api/list-project-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({ directory: keyframeFolder }),
          });
          const listed = await listedResponse.json();
          const files: string[] = Array.isArray(listed.files) ? listed.files : [];
          for (const item of allKeyframeItems) {
            const expected = `scene-${item.previewKey.replace(/[^a-z0-9_-]/gi, "_")}.jpg`.toLowerCase();
            const existing = files.find(file => String(file).replace(/\\/g, "/").split("/").pop()?.toLowerCase() === expected);
            if (!existing) continue;
            const path = `${keyframeFolder}\\${String(existing).replace(/\\/g, "/").split("/").pop()}`;
            const keyframeUrl = `/api/serve-local-file?path=${encodeURIComponent(path)}&t=${Date.now()}`;
            for (const alias of generatedKeysFor(item.previewKey)) lockedKeyframeByPrompt[alias] = keyframeUrl;
          }
          if (Object.keys(lockedKeyframeByPrompt).length) addLog(`✓ Tiếp tục từ ${Object.keys(lockedKeyframeByPrompt).length}/${allPrompts.length} ảnh khóa đã lưu.`);
        } catch {}
        const keyframeItems = allKeyframeItems.filter(item => !lockedKeyframeByPrompt[item.previewKey]);
        const keyframeFailures: string[] = [];
        if (keyframeItems.length) {
        const response = await fetch("/api/pipeline/generate-batch-images-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ items: keyframeItems, style: imageStyle, visualConfig: { ...visualConfig, generateType: "image", imageGeneratorEngine: "NANO_BANANA_PRO", autoStartImage: "" } }),
        });
        if (!response.ok || !response.body) throw new Error("Không thể khởi chạy batch ảnh khóa.");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const saveKeyframeResult = async (result: any) => {
          if (!result?.success) {
            const warning = String(result?.warning || result?.error || "Lỗi tạo ảnh không xác định").trim();
            if (warning) keyframeFailures.push(warning);
            return;
          }
          const item = keyframeItems.find(entry => entry.sceneId === result.sceneId);
          if (!item || lockedKeyframeByPrompt[item.previewKey]) return;
          const sourceUrl = result.base64 ? `data:image/jpeg;base64,${result.base64}` : result.fallbackUrl;
          if (!sourceUrl) {
            keyframeFailures.push(`${item.previewKey}: nhà cung cấp không trả về dữ liệu ảnh.`);
            return;
          }
          const path = `${keyframeFolder}\\scene-${item.previewKey.replace(/[^a-z0-9_-]/gi, "_")}.jpg`;
          const saved = await fetch("/api/download-audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result.base64 ? { path, audioData: result.base64 } : { path, url: sourceUrl }) });
          const savedData = await saved.json().catch(() => ({}));
          if (!saved.ok || !savedData?.success) throw new Error(`Không thể lưu ảnh khóa ${item.previewKey}.`);
          await cleanSavedMedia(path);
          const keyframeUrl = `/api/serve-local-file?path=${encodeURIComponent(path)}&t=${Date.now()}`;
          for (const alias of generatedKeysFor(item.previewKey)) lockedKeyframeByPrompt[alias] = keyframeUrl;
          addLog(`✓ Ảnh khóa ${Object.keys(lockedKeyframeByPrompt).length}/${allPrompts.length}: ${item.previewKey}`);
        };
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const event of events) {
            const dataLine = event.split("\n").find(line => line.startsWith("data: "));
            if (!dataLine) continue;
            const data = JSON.parse(dataLine.slice(6));
            if (data.type === "progress") await saveKeyframeResult(data.result);
            if (data.type === "complete" && Array.isArray(data.results)) {
              for (const result of data.results) await saveKeyframeResult(result);
            }
            if (data.type === "error" && data.message) keyframeFailures.push(String(data.message));
          }
        }
        }
        if (Object.keys(lockedKeyframeByPrompt).length !== allPrompts.length) {
          const details = [...new Set(keyframeFailures)].slice(0, 3).join(" | ");
          throw new Error(`Ảnh khóa chưa đủ: ${Object.keys(lockedKeyframeByPrompt).length}/${allPrompts.length}. Đã dừng trước bước video.${details ? ` Chi tiết: ${details}` : ""}`);
        }
        setGeneratedImages(previous => ({ ...previous, ...lockedKeyframeByPrompt }));
        addLog("✓ Đã đủ ảnh khóa. Bắt đầu Image-to-Video bằng startImage riêng từng cảnh.");
      }
      // Only stage 2 creates scene media. Later manual stages must reuse the
      // reviewed output, rather than silently generating every image/video again.
      if (!twoStage || manualStage === 2) {
      addLog(`▶ [4/7] Đang tạo ${allPrompts.length} ${isVideoOutput ? "video" : "ảnh"}...`);
      setAutoPipelineProgress(74);
      const generatedMedia: Record<string, string> = {};
      // Resume safely: media already saved in the current output folder is a
      // completed scene, not a reason to call Google Labs again. Keep the
      // scene and prompt numbers separate: P1.1 must become p1_1, while
      // P11.1 becomes p11_1. Removing every dot as if it were an extension
      // made P11.1 collide with the filename for P1.1.
      if (!lockedKeyframesPipeline) try {
        await cleanExistingMediaBeforePreview();
        const listedResponse = await fetch("/api/list-project-media", {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({ directory: mediaFolder }),
        });
        const listed = await listedResponse.json();
        const files: string[] = Array.isArray(listed.files) ? listed.files : [];
        const normalizeSceneFile = (value: string) => String(value)
          .replace(/^scene[-_]?/i, "")
          .replace(/^\d{1,4}[_-]+/, "")
          .replace(/\.(?:jpe?g|png|webp|mp4|mov)$/i, "")
          .replace(/[._-]+/g, "_")
          .replace(/[^a-z0-9_]/gi, "")
          .toLowerCase();
        let restored = 0;
        for (const { scene, prompt, promptIndex } of allPrompts) {
          const previewKey = String(prompt.code || `scene-${scene.sceneNumber || 1}-${promptIndex + 1}`);
          const masterKey = overviewMasterByCode.get(normalizeOverviewCode(previewKey)) || previewKey;
          const wanted = normalizeSceneFile(masterKey);
          const existing = files.find(file => normalizeSceneFile(file) === wanted);
          if (!existing) continue;
          const localPath = `${mediaFolder}\\${existing}`;
          const localUrl = `/api/serve-local-file?path=${encodeURIComponent(localPath)}&t=${Date.now()}`;
          assignGeneratedMedia(previewKey, localUrl, generatedMedia);
          restored += 1;
        }
        // Remove stale browser/localStorage previews for the current prompt
        // set before merging files verified on disk. This immediately clears
        // old P1.1 -> P11.1 mix-ups instead of continuing to show them.
        setGeneratedImages(previous => {
          const next = { ...previous };
          allPrompts.forEach(({ scene, prompt, promptIndex }: any) => {
            const previewKey = String(prompt.code || `scene-${scene.sceneNumber || 1}-${promptIndex + 1}`);
            delete next[previewKey];
          });
          return { ...next, ...generatedMedia };
        });
        if (restored) {
          addLog(`Bo qua ${restored}/${allPrompts.length} ${isVideoOutput ? "video" : "anh"} da co trong thu muc du an.`);
        }
      } catch (error: any) {
        // Watermark cleanup is an explicit gate: no old file may be previewed
        // or reused when the user has requested cleanup and it did not finish.
        if (String(error?.message || "").startsWith("WATERMARK_CLEANUP_FAILED:")) throw error;
        // A normal disk scan failure must not block a brand-new project.
      } else {
        setGeneratedImages(previous => {
          const next = { ...previous };
          allPrompts.forEach(({ scene, prompt, promptIndex }: any) => {
            const key = String(prompt.code || `scene-${scene.sceneNumber || 1}-${promptIndex + 1}`);
            next[key] = lockedKeyframeByPrompt[key];
          });
          return next;
        });
        addLog("â„¹ Chế độ Image-to-Video đang bật: bỏ qua toàn bộ MP4 cũ, chỉ dùng keyframe vừa tạo.");
      }
      // Assign work deterministically: one worker equals one selected Chrome,
      // and its tab count is handled by the server-side batch engine.
      const selectedProfiles = Array.isArray(visualConfig.chromeProfiles) ? visualConfig.chromeProfiles : [];
      const requestedChromeCount = Math.max(
        1,
        Number(visualConfig.threadCount) ||
          (visualConfig.generationMode === "viettheo-api" ? 7 : 1),
      );
      if (visualConfig.generationMode === "viettheo-api") {
        const apiConcurrency = Math.min(7, allPrompts.length, requestedChromeCount);
        addLog(`API VietTheo: đang chạy tối đa ${apiConcurrency} job ${isVideoOutput ? "video" : "ảnh"} song song. Video vẫn cần chờ nhà cung cấp render từng job nên sẽ lâu hơn ảnh.`);
      }
      const profiles = visualConfig.chromeProfilesEnabled
        ? selectedProfiles.slice(0, requestedChromeCount)
        : [{ port: 9222, concurrency: Math.max(1, Number(visualConfig.tabsPerChrome) || 1) }];
      if (visualConfig.chromeProfilesEnabled && profiles.length < requestedChromeCount) {
        addLog(`⚠️ Chỉ có ${profiles.length}/${requestedChromeCount} Chrome đang sẵn sàng. Tiếp tục bằng các Chrome đã chọn.`);
      }
      const failedVideoItems = new Map<string, string>();
      const isCreditOrQuotaFailure = (message: string) =>
        /(hết\s*credit|insufficient\s*(credit|balance)|quota\s*(exceeded|exhausted))/i.test(
          String(message || ""),
        );
      const createFallbackImage = async (
        mediaId: string,
        profile: any,
        failureReason = "",
      ) => {
        if (!fallbackFailedVideosToImages) throw new Error(failureReason || `Không thể tạo video ${mediaId}`);
        if (isCreditOrQuotaFailure(failureReason)) throw new Error(failureReason);
        const source = allPrompts.find(({ scene, prompt, promptIndex }: any) =>
          String(prompt.code || `scene-${scene.sceneNumber || 1}-${promptIndex + 1}`) === mediaId,
        );
        if (!source) throw new Error(`Không tìm thấy prompt gốc để tạo ảnh thay thế cho ${mediaId}.`);
        addLog(`⚠️ Video ${mediaId} vẫn lỗi sau tối đa 3 lần thử. Đang tạo ảnh thay thế...`);
        const spokenText = String(
          source.prompt.subText_en || source.prompt.subText || source.prompt.text_en ||
          source.prompt.subText_vi || source.scene.text_en || source.scene.text || source.scene.text_vi || "",
        ).replace(/\s+/g, " ").trim();
        const characterEvidence = [
          source.scene?.speaker,
          source.scene?.text,
          source.scene?.text_vi,
          source.scene?.text_en,
          source.prompt?.speaker,
          source.prompt?.vietnameseLabel,
        ].filter(Boolean).join("\n");
        const response = await fetch("/api/pipeline/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            prompt: lockSceneStyle(
              source.prompt.englishPrompt || source.prompt.prompt || "",
              spokenText,
              characterEvidence,
            ),
            style: imageStyle,
            bypassCache: true,
            visualConfig: {
              ...visualConfig,
              generateType: "image",
              imageGeneratorEngine: visualConfig.imageEngine || "NANO_BANANA",
              chromeProfiles: [profile],
              noText: visualConfig.noText !== false,
              noBlackBorder: visualConfig.noBlackBorder !== false,
              noWallPicture: visualConfig.noWallPicture !== false,
            },
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.error || result.warning || `Không thể tạo ảnh thay thế cho ${mediaId}.`);
        }
        const imageUrl = result.base64
          ? `data:image/jpeg;base64,${result.base64}`
          : result.fallbackUrl;
        if (!imageUrl) throw new Error(`Không nhận được ảnh thay thế cho ${mediaId}.`);
        const safeId = mediaId.replace(/[^a-z0-9_-]/gi, "_");
        // Keep the fallback as a real image in the same ordered media folder.
        // The final renderer holds this image for the matching script/voice
        // timeline slot; it must not be pre-converted to an arbitrary MP4.
        const fallbackImagePath = `${mediaFolder}\\scene-${safeId}.jpg`;
        const saved = await fetch("/api/download-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            result.base64
              ? { path: fallbackImagePath, audioData: result.base64 }
              : { path: fallbackImagePath, url: imageUrl },
          ),
        });
        const savedData = await saved.json().catch(() => ({}));
        if (!saved.ok || !savedData?.success) {
          throw new Error(savedData?.error || `Không thể lưu ảnh thay thế cho ${mediaId}.`);
        }
        await cleanSavedMedia(fallbackImagePath);
        const previewUrl = `/api/serve-local-file?path=${encodeURIComponent(fallbackImagePath)}&t=${Date.now()}`;
        assignGeneratedMedia(mediaId, previewUrl, generatedMedia);
        setGeneratedImages(previous => ({ ...previous, ...Object.fromEntries(generatedKeysFor(mediaId).map(key => [key, previewUrl])) }));
        addLog(`✓ ${mediaId}: đã dùng ảnh thay thế đúng vị trí video lỗi; thời lượng sẽ lấy theo đoạn kịch bản/voice khi render.`);
      };
      let batchCompleted = false;
      try {
        const batchItems = mediaGenerationPrompts.map(({ scene, prompt, promptIndex }: any, index: number) => ({
          sceneId: `auto-${String(index + 1).padStart(3, "0")}-${String(prompt.code || `scene-${scene.sceneNumber || index + 1}-${promptIndex + 1}`).replace(/[^a-z0-9_-]/gi, "_")}`,
          // Keep the UI key identical to the storyboard prompt code. sceneId
          // is only for the batch scheduler and must be unique across workers.
          previewKey: String(prompt.code || `scene-${scene.sceneNumber || index + 1}-${promptIndex + 1}`),
          prompt: buildDialogueVideoPrompt(scene, prompt),
          characterContext: [
            scene?.speaker,
            scene?.text,
            scene?.text_vi,
            scene?.text_en,
            prompt?.speaker,
            prompt?.subText,
            prompt?.subText_vi,
            prompt?.subText_en,
            prompt?.vietnameseLabel,
          ].filter(Boolean).join("\n"),
          autoStartImage: lockedKeyframeByPrompt[
            String(prompt.code || `scene-${scene.sceneNumber || index + 1}-${promptIndex + 1}`)
          ] || "",
        }));
        // A cold Chrome profile can occasionally fail its first request.  Do not
        // discard the whole production run in that case: retry only the scenes
        // which do not yet have a saved media file, never the completed ones.
        let pendingBatchItems = batchItems.filter(item => !generatedMedia[item.previewKey]);
        let completed = Object.keys(generatedMedia).length;
        let batchError = "";
        const terminalMediaFailures = new Map<string, string>();
        // Every provider/generation failure gets the backend's full retry
        // budget. Only exhausted balance/quota or explicit cancellation is
        // terminal. In particular, "job data expired on Redis" is an
        // infrastructure timeout, not a rejected prompt/content-policy error.
        const isTerminalMediaFailure = (message: string) => /(hết\s*credit|insufficient\s*(credit|balance)|quota\s*(exceeded|exhausted)|content\s*policy|policy\s*violation|refused\s+to\s+create|violat(?:es?|ion)|người\s*dùng\s*(huỷ|hủy)|user\s*cancel(?:led|ed)?)/i.test(String(message || ""));
        if (pendingBatchItems.length === 0) {
          batchCompleted = true;
          addLog(`Tat ca ${allPrompts.length} ${isVideoOutput ? "video" : "anh"} da ton tai, khong tao lai.`);
        }
        // Finish a complete pass, scan the saved results, then automatically
        // submit only missing/failed scene IDs. VietTheo uses one provider
        // attempt per pass: one original pass plus three automatic retries.
        const maxBatchAttempts = 4;
        for (let attempt = 1; pendingBatchItems.length > 0 && attempt <= maxBatchAttempts; attempt += 1) {
          if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
          batchError = "";
          const batchResponse = await fetch("/api/pipeline/generate-batch-images-stream", {
            method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
            body: JSON.stringify({ items: pendingBatchItems, style: imageStyle, visualConfig: { ...visualConfig, chromeProfiles: profiles, noText: visualConfig.noText !== false, noBlackBorder: visualConfig.noBlackBorder !== false, noWallPicture: visualConfig.noWallPicture !== false } }),
          });
          if (!batchResponse.ok || !batchResponse.body) throw new Error("Khong the khoi chay tao media hang loat.");
          const reader = batchResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";
            for (const event of events) {
              const dataLine = event.split("\n").find(line => line.startsWith("data: "));
              if (!dataLine) continue;
              const data = JSON.parse(dataLine.slice(6));
              if (data.type === "error") { batchError = data.message || "Tao media hang loat that bai."; continue; }
              if (data.type === "fallback") {
                const sceneCount = Array.isArray(data.sceneIds) ? data.sceneIds.length : 0;
                addLog(`⚠️ Chrome ${data.fromPort} gặp lỗi/hết credit. Đang chuyển ${sceneCount} cảnh sang Chrome ${data.toPort} để tạo lại.`);
                continue;
              }
              if (data.type !== "progress") continue;
              const result = data.result || {};
              const index = batchItems.findIndex((item: any) => item.sceneId === result.sceneId);
              if (index < 0 || !result.success) {
                const failureMessage = result.error || result.warning || batchError || "Không thể tạo media.";
                batchError = failureMessage;
                if (index >= 0 && fallbackFailedVideosToImages) {
                  failedVideoItems.set(batchItems[index].previewKey, failureMessage);
                }
                if (index >= 0 && isTerminalMediaFailure(failureMessage)) {
                  const failedItem = batchItems[index];
                  terminalMediaFailures.set(failedItem.previewKey, failureMessage);
                  addLog(`✕ Media ${failedItem.previewKey} bị nhà cung cấp từ chối: ${failureMessage}. Đã dừng tự thử lại cảnh này.`);
                }
                continue;
              }
              const previewKey = batchItems[index].previewKey;
              if (generatedMedia[previewKey]) continue;
              const mediaUrl = result.base64 ? (isVideoOutput ? `data:video/mp4;base64,${result.base64}` : `data:image/jpeg;base64,${result.base64}`) : result.fallbackUrl;
              if (!mediaUrl) { batchError = "Khong nhan duoc file media."; continue; }
              const localPath = `${mediaFolder}\\scene-${previewKey.replace(/[^a-z0-9_-]/gi, "_")}${mediaExt}`;
              const saved = await fetch("/api/download-audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result.base64 ? { path: localPath, audioData: result.base64 } : { path: localPath, url: mediaUrl }) });
              const savedData = await saved.json().catch(() => ({}));
              if (!saved.ok || !savedData?.success) throw new Error(savedData?.error || "Không thể lưu media trước khi xoá watermark.");
        await cleanSavedMedia(localPath);
              // Do not replace a valid provider preview with a local URL until
              // the file is actually saved. This keeps preview/retry usable on
              // network errors and on project folders with Vietnamese names.
              const previewUrl = saved.ok && savedData?.success
                ? `/api/serve-local-file?path=${encodeURIComponent(localPath)}&t=${Date.now()}`
                : mediaUrl;
              assignGeneratedMedia(previewKey, previewUrl, generatedMedia);
              setGeneratedImages(previous => ({ ...previous, ...Object.fromEntries(generatedKeysFor(previewKey).map(key => [key, previewUrl])) }));
              completed += 1;
              setAutoPipelineProgress(74 + Math.round((completed / allPrompts.length) * 10));
              addLog(`Media ${completed}/${allPrompts.length} da tao va hien thi preview.`);
            }
          }
          pendingBatchItems = batchItems.filter(item => !generatedMedia[item.previewKey] && !terminalMediaFailures.has(item.previewKey));
          if (pendingBatchItems.length > 0 && attempt < maxBatchAttempts) {
            const retryDelayMs = Math.min(60_000, 15_000 * (2 ** (attempt - 1)));
            addLog(`⚠️ Còn ${pendingBatchItems.length} cảnh chưa tạo. Sẽ tự thử lại lượt ${attempt + 1}/${maxBatchAttempts} sau ${Math.round(retryDelayMs / 1000)} giây; không tạo lại cảnh đã xong.`);
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          }
        }
        if (terminalMediaFailures.size > 0 && !fallbackFailedVideosToImages) {
          const details = [...terminalMediaFailures.entries()].map(([key, message]) => `${key}: ${message}`).join("; ");
          throw new Error(`TERMINAL_MEDIA_FAILURE:${terminalMediaFailures.size} cảnh bị từ chối và không được tự gửi lại. ${details}`);
        }
        if (pendingBatchItems.length > 0 && !fallbackFailedVideosToImages) throw new Error(`MEDIA_RETRIES_EXHAUSTED:${batchError || "Khong the tao du media."} Còn ${pendingBatchItems.length}/${allPrompts.length} cảnh chưa hoàn tất sau ${maxBatchAttempts} lượt (1 lượt đầu + 3 lượt tự thử lại).`);
        batchCompleted = pendingBatchItems.length === 0 && terminalMediaFailures.size === 0;
      } catch (error: any) {
        if (String(error?.message || "").startsWith("TERMINAL_MEDIA_FAILURE:")) {
          throw new Error(String(error.message).replace("TERMINAL_MEDIA_FAILURE:", ""));
        }
        if (String(error?.message || "").startsWith("MEDIA_RETRIES_EXHAUSTED:")) {
          throw new Error(String(error.message).replace("MEDIA_RETRIES_EXHAUSTED:", ""));
        }
        // The streaming batch may fail when one Chrome has not finished
        // warming up. Continue with the per-scene recovery path below rather
        // than aborting the complete 7-step production run.
        addLog(`⚠️ Batch chưa hoàn tất (${error?.message || "lỗi không xác định"}). Chuyển sang tạo riêng các cảnh còn thiếu.`);
      }
      if (!batchCompleted) {
      if (fallbackFailedVideosToImages && failedVideoItems.size > 0) {
        let fallbackIndex = 0;
        for (const [mediaId, reason] of failedVideoItems.entries()) {
          const profile = profiles[fallbackIndex % profiles.length];
          fallbackIndex += 1;
          await createFallbackImage(mediaId, profile, reason);
        }
      }
      const missingMediaTasks = mediaGenerationPrompts.filter(({ scene, prompt, promptIndex }: any, index: number) => {
        const mediaId = String(prompt.code || `scene-${scene.sceneNumber || index + 1}-${promptIndex + 1}`);
        return !generatedMedia[mediaId];
      });
      let nextMediaIndex = 0;
      let completedMedia = Object.keys(generatedMedia).length;
      const runMediaTask = async (index: number, profile: any) => {
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        const { scene, prompt, promptIndex } = missingMediaTasks[index];
        const mediaId = String(prompt.code || `scene-${scene.sceneNumber || index + 1}-${promptIndex + 1}`);
        const response = await fetch("/api/pipeline/generate-image", {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({
            prompt: buildDialogueVideoPrompt(scene, prompt),
            style: imageStyle,
            bypassCache: true,
            visualConfig: { ...visualConfig, chromeProfiles: [profile], noText: visualConfig.noText !== false, noBlackBorder: visualConfig.noBlackBorder !== false, noWallPicture: visualConfig.noWallPicture !== false },
          }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || result.warning || `Không thể tạo media cảnh ${index + 1}`);
        const mediaUrl = result.base64 ? (isVideoOutput ? `data:video/mp4;base64,${result.base64}` : `data:image/jpeg;base64,${result.base64}`) : result.fallbackUrl;
        if (!mediaUrl) throw new Error(`Không nhận được file media cho cảnh ${index + 1}`);
        const localPath = `${mediaFolder}\\${String(index + 1).padStart(3, "0")}_${mediaId.replace(/[^a-z0-9_-]/gi, "_")}${mediaExt}`;
        const saved = await fetch("/api/download-audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result.base64 ? { path: localPath, audioData: result.base64 } : { path: localPath, url: mediaUrl }) });
        const savedData = await saved.json().catch(() => ({}));
        if (!saved.ok || !savedData?.success) throw new Error(savedData?.error || "Không thể lưu media trước khi xoá watermark.");
        await cleanSavedMedia(localPath);
        await copyOverviewAliases(mediaId, localPath);
        const previewUrl = saved.ok && savedData?.success
          ? `/api/serve-local-file?path=${encodeURIComponent(localPath)}&t=${Date.now()}`
          : mediaUrl;
        assignGeneratedMedia(mediaId, previewUrl, generatedMedia);
        setGeneratedImages(previous => ({ ...previous, ...Object.fromEntries(generatedKeysFor(mediaId).map(key => [key, previewUrl])) }));
        completedMedia += 1;
        setAutoPipelineProgress(74 + Math.round((completedMedia / allPrompts.length) * 10));
        addLog(`✓ Media ${completedMedia}/${allPrompts.length} đã tạo và hiển thị preview.`);
      };
      await Promise.all(profiles.map(async (profile: any) => {
        while (true) {
          const index = nextMediaIndex++;
          if (index >= missingMediaTasks.length) return;
          try {
            await runMediaTask(index, profile);
          } catch (error: any) {
            const { scene, prompt, promptIndex } = missingMediaTasks[index];
            const mediaId = String(prompt.code || `scene-${scene.sceneNumber || index + 1}-${promptIndex + 1}`);
            await createFallbackImage(mediaId, profile, error?.message || String(error));
          }
        }
      }));
      }
      setStep4Done(true);
      pipelineRecoveryStage = 3;
      }
      if (twoStage && manualStage === 2) {
        setManualWorkflowStage(3);
        setManualTwoStageReviewReady(true);
        setAutoPipelineProgress(100);
        addLog("Đã tạo xong phân cảnh và media. Hãy kiểm tra từng cảnh trước khi tạo voice.");
        return;
      }

      let completedSeo: any = seoData || restoredSeoFromProject;
      if (!twoStage || manualStage === 3) {
      // ---------------- BƯỚC 5: TẠO VOICE ----------------
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      if (useDialogueVideoAudio) {
        addLog("✓ [5/7] Giữ tiếng hội thoại gốc trong từng video AI; bỏ qua tạo voice rời.");
        setStep5Done(true);
        setAutoPipelineProgress(85);
      } else {
      addLog("▶ [5/7] Đang tạo voice cho toàn bộ kịch bản...");
      setAutoPipelineProgress(85);
      let automationVoice: any = {};
      try { automationVoice = JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}"); } catch {}
      let audioUrl = "";
      const projectVoicePath = projectDir + "\\voice_original.mp3";
      const existingProjectVoice = await fetch("/api/check-file", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: projectVoicePath })
      }).then(result => result.json()).catch(() => ({ exists: false }));
      // Re-running a project must not create (or charge for) the same voice
      // again. The user can replace the file from the Voice tab when needed.
      const reuseExistingProjectVoice = existingProjectVoice?.exists === true;
      if (reuseExistingProjectVoice) {
        audioUrl = `/api/serve-local-file?path=${encodeURIComponent(projectVoicePath)}&t=${Date.now()}`;
        addLog("✓ Dùng lại voice đã tạo của dự án; không tạo voice mới và không trừ điểm.");
      } else if (automationVoice.voiceProvider === "external") {
        const externalVoicePath = projectVoicePath;
        const existingVoice = await fetch("/api/check-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: externalVoicePath }) }).then(result => result.json()).catch(() => ({ exists: false }));
        if (!existingVoice?.exists) throw new Error("Bạn đã chọn voice bên ngoài nhưng chưa tải file voice lên. Vào tab Giọng đọc để tải file trước khi chạy.");
        audioUrl = `/api/serve-local-file?path=${encodeURIComponent(externalVoicePath)}&t=${Date.now()}`;
        addLog("✓ Dùng voice đã tải lên; bỏ qua bước tạo voice của tool.");
      } else if (automationVoice.voiceProvider === "vieneu") {
        const voiceResponse = await fetch("/api/vieneu/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ text: finalScript, voice: automationVoice.voiceModel, speed: Number(automationVoice.voiceSpeed) || 1, emotion: automationVoice.voiceEmotion || "natural", referenceAudioPath: automationVoice.voiceReferencePath || undefined }),
        });
        const voice = await voiceResponse.json();
        if (!voiceResponse.ok || !voice.success) throw new Error(voice.error || "Không thể tạo voice VieNeu Local.");
        audioUrl = voice.audioUrl || "";
        addLog(`✓ VieNeu Local đã tạo voice ${automationVoice.voiceModel || "mặc định"} hoàn toàn offline.`);
      } else if (automationVoice.voiceProvider === "premium" && automationVoice.voiceId) {
        const ttsResponse = await fetch("/api/ai33/tts", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ text: finalScript, voice_id: automationVoice.voiceId, speed: Number(automationVoice.voiceSpeed) || 1 }) });
        const tts = await ttsResponse.json();
        if (!tts.success || !tts.task_id) throw new Error(tts.error || "Không thể khởi tạo tác vụ voice Premium.");
        for (let attempts = 0; attempts < 120; attempts += 1) {
          await new Promise(resolve => setTimeout(resolve, 2500));
          if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
          const taskResponse = await fetch(`/api/ai33/task/${tts.task_id}`, { signal: controller.signal });
          const task = await taskResponse.json();
          if (String(task.status).toLowerCase() === "done") { audioUrl = task.metadata?.audio_url || task.audio_url || ""; break; }
          if (String(task.status).toLowerCase() === "error") throw new Error(task.error_message || "Tạo voice Premium thất bại.");
        }
      } else {
        throw new Error("Hãy chọn Giọng Premium hoặc tải voice đã tạo sẵn ở tab Giọng đọc trước khi chạy.");
        const voiceResponse = await fetch("/api/generate-tts", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ text: finalScript, voiceName: automationVoice.voiceModel || selectedVoice, rate: Math.round(((Number(automationVoice.voiceSpeed) || 1) - 1) * 10) }) });
        const voice = await voiceResponse.json();
        if (!voiceResponse.ok) throw new Error(voice.error || "Không thể tạo voice.");
        audioUrl = voice.audioUrl || "";
      }
      if (!audioUrl) throw new Error("Voice chưa trả về file âm thanh.");
      // File voice ngoài đã được lưu/chuẩn hóa trực tiếp thành
      // voice_original.mp3 ở lúc tải lên; không tải đè chính nó qua HTTP.
      if (!reuseExistingProjectVoice && automationVoice.voiceProvider !== "external") {
        await fetch("/api/download-audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: projectDir + "\\voice_original.mp3", url: audioUrl }) });
      }
      const savedAudioUrl = `/api/serve-local-file?path=${encodeURIComponent(projectDir + "\\voice_original.mp3")}&t=${Date.now()}`;
      setGeneratedAudio(savedAudioUrl); setStep5Done(true);
      // Build a continuous Whisper timeline before render. Cut files are only
      // alignment references; final audio remains the uninterrupted original.
      addLog("Dang dung Whisper can timeline voice goc voi tung media...");
      const timelineLines: string[] = ["=== DIALOGUE TIMELINE FROM STEP 3 ===", ""];
      let timelineIndex = 0;
      activeStoryboard.scenes.forEach((scene: any, sceneIndex: number) => {
        const prompts = Array.isArray(scene.imagePrompts) ? scene.imagePrompts : [];
        prompts.forEach((prompt: any, promptIndex: number) => {
          const dialogue = String(prompt.subText_vi || prompt.subText || (prompts.length === 1 ? (scene.text_vi || scene.text || "") : "")).trim();
          if (!dialogue) return;
          timelineIndex += 1;
          const code = prompt.code || `S${sceneIndex + 1}.${promptIndex + 1}`;
          timelineLines.push(`--- Scene ${timelineIndex} (${code}) ---`, `[Dialogue]: ${dialogue}`, "");
        });
      });
      if (timelineIndex !== allPrompts.length) {
        throw new Error(`Timeline loi thoai co ${timelineIndex} canh nhung media co ${allPrompts.length} canh. Hay tao lai prompt de moi media co loi thoai tuong ung.`);
      }
      const timelineScriptPath = projectDir + "\\step3_dialogues.txt";
      const timelineVoiceDir = projectDir + "\\vocie";
      await fetch("/api/save-file", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ path: timelineScriptPath, content: timelineLines.join("\n") }),
      });
      const sliceResponse = await fetch("/api/timeline/run-command", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ action: "slice", params: { script: timelineScriptPath, audio: projectDir + "\\voice_original.mp3", outdir: timelineVoiceDir, imgdir: mediaFolder } }),
      });
      if (!sliceResponse.ok || !sliceResponse.body) throw new Error("Khong the khoi chay Whisper de can voice.");
      const sliceReader = sliceResponse.body.getReader();
      const sliceDecoder = new TextDecoder();
      let sliceBuffer = "";
      let sliceSucceeded = false;
      let sliceError = "";
      let alignedTimeline: Array<{ code?: string; startMs: number; durationMs: number }> = [];
      while (true) {
        const { value, done } = await sliceReader.read();
        if (done) break;
        sliceBuffer += sliceDecoder.decode(value, { stream: true });
        const events = sliceBuffer.split("\n\n");
        sliceBuffer = events.pop() || "";
        for (const event of events) {
          const dataLine = event.split("\n").find(line => line.startsWith("data: "));
          if (!dataLine) continue;
          const payload = JSON.parse(dataLine.slice(6));
          if (payload.type === "log" && payload.message) addLog(payload.message);
          if (payload.type === "result") {
            sliceSucceeded = payload.data?.success === true;
            sliceError = payload.data?.error || sliceError;
            alignedTimeline = Array.isArray(payload.data?.timeline) ? payload.data.timeline : alignedTimeline;
          }
        }
      }
      if (!sliceSucceeded) throw new Error(sliceError || "Whisper khong the tao timeline voice chinh xac.");
      if (alignedTimeline.length === allPrompts.length) {
        let alignedIndex = 0;
        const formatTimelineTime = (milliseconds: number) => {
          const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
          return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
        };
        const timedScenes = activeStoryboard.scenes.map((scene: any) => {
          const promptCount = Math.max(1, Array.isArray(scene.imagePrompts) ? scene.imagePrompts.length : 0);
          const entries = alignedTimeline.slice(alignedIndex, alignedIndex + promptCount);
          alignedIndex += promptCount;
          if (!entries.length) return scene;
          const startMs = Number(entries[0].startMs || 0);
          const last = entries[entries.length - 1];
          const endMs = Number(last.startMs || 0) + Number(last.durationMs || 0);
          return { ...scene, timeSegment: `${formatTimelineTime(startMs)} - ${formatTimelineTime(endMs)}` };
        });
        setStoryboardData({ ...activeStoryboard, scenes: timedScenes });
        addLog("Đã cập nhật timestamp phân cảnh theo mốc voice thật.");
      }
      addLog("Timeline da giu nguyen tu dau den cuoi voice goc, bao gom ca khoang lang.");
      addLog("✓ Đã tạo và lưu voice gốc.");
      }

      // ---------------- BƯỚC 6: SEO ----------------
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      addLog("▶ [6/7] Đang tạo tiêu đề và mô tả SEO...");
      setAutoPipelineProgress(90);
      const seoResponse = await fetch("/api/generate-seo-seeding", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ script: finalScript, channelName: channelName || "Kênh Của Tôi", targetKeywords: targetKeywords.trim(), thumbnailStyle: resolveThumbnailStyle(), thumbnailHasText: thumbHasText, thumbnailCustomText: thumbCustomText, characterDescription: effectiveCharacterLock, seoTone: pipelineAutomationConfig.seoTone || "curiosity", includeChapters: pipelineAutomationConfig.includeChapters === true || seoIncludeChapters, includeTracklist: false }) });
      const seoResult = await seoResponse.json();
      if (!seoResponse.ok) {
        const keyword = String(targetKeywords || "").trim() || "Video mới";
        const summary = finalScript.replace(/\s+/g, " ").trim().slice(0, 260);
        completedSeo = {
          seoTitle: `${keyword} | Câu chuyện đáng suy ngẫm`.slice(0, 95),
          titleOptions: [`${keyword} | Câu chuyện đáng suy ngẫm`],
          seoDescription: `${summary}\n\nĐăng ký kênh để theo dõi các nội dung tiếp theo.\n#${keyword.replace(/\s+/g, "")} #vidiflow`,
          tags: { primaryKeyword: keyword, secondaryKeyword: "câu chuyện", channelTag: channelName || "VidiFlow", competitorTags: [] },
          thumbnailConcept: {
            visualIdea: `Một chủ thể nổi bật minh họa trực tiếp cho ${keyword}, bố cục thumbnail rõ ràng và tương phản cao.`,
            thumbnailText: thumbHasText ? (thumbCustomText.trim() || keyword).split(/\s+/).slice(0, 5).join(" ") : "",
            imagePrompt: `High-impact YouTube thumbnail about ${keyword}. Show one concrete focal subject and action directly supported by this script summary: ${summary}. Strong visual hierarchy, clean uncluttered composition, high contrast, expressive focal point, no unrelated symbols or generic presenter.`,
          },
          seedingComments: [],
          isProgrammaticFallback: true,
        };
        addLog(`⚠ SEO AI lỗi (${seoResult?.error || "không xác định"}). Tool dùng SEO dự phòng và tiếp tục render.`);
      } else {
        completedSeo = { ...seoResult, titleOptions: Array.isArray(seoResult.titleOptions) ? seoResult.titleOptions.filter(Boolean) : [], seoDescription: String(seoResult.seoDescription || "").replace(/\\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() };
      }
      setSeoData(completedSeo);
      pipelineRecoveryStage = 4;
      await fetch("/api/save-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: projectDir + "\\seo.txt", content: `TIÊU ĐỀ\n${completedSeo.seoTitle || ""}\n\nMÔ TẢ\n${completedSeo.seoDescription || ""}\n\nPROMPT THUMBNAIL\n${completedSeo.thumbnailConcept?.imagePrompt || ""}` }) });
      const fallbackThumbnailPrompt = `High-impact YouTube thumbnail illustrating the central idea of this script: ${finalScript.replace(/\s+/g, " ").trim().slice(0, 500)}. Show one concrete focal subject and action, clean uncluttered composition, strong contrast, no unrelated symbols or generic presenter.`;
      const thumbnailPrompt = String(completedSeo.thumbnailConcept?.imagePrompt || fallbackThumbnailPrompt).trim();
      if (!completedSeo.thumbnailConcept) completedSeo.thumbnailConcept = { visualIdea: "", thumbnailText: "", imagePrompt: thumbnailPrompt };
      else if (!String(completedSeo.thumbnailConcept.imagePrompt || "").trim()) completedSeo.thumbnailConcept.imagePrompt = thumbnailPrompt;
      setSeoData({ ...completedSeo });
      const thumbnailCharacterLock = effectiveCharacterLock
        ? ` CHARACTER IDENTITY LOCK: ${effectiveCharacterLock}. Keep the same gender, age range, face, body proportions, hairstyle, skin tone and wardrobe as the video scenes; never gender-swap, age-shift or redesign the recurring character.`
        : "";
      addLog("▶ Đang tạo ảnh thumbnail từ prompt SEO...");
      const thumbnailText = String(completedSeo.thumbnailConcept?.thumbnailText || completedSeo.seoTitle || "").trim().split(/\s+/).slice(0, 5).join(" ");
      const thumbnailOverlay = thumbHasText ? `. MANDATORY IN-IMAGE TYPOGRAPHY: Render this exact Vietnamese title as visible typography inside the generated thumbnail: "${thumbCustomText.trim() || thumbnailText}". Place it prominently, large, bold, high-contrast, fully legible, with clean spelling. This text must be part of the generated image itself; do not leave the image text-free.` : ". Do not include any text, letters, captions, logos, or typography.";
      const requiredThumbnailText = thumbCustomText.trim() || thumbnailText;
      let thumbnail: any = null;
      let thumbnailError = "";
      for (let thumbnailAttempt = 1; thumbnailAttempt <= 3; thumbnailAttempt += 1) {
        const thumbnailResponse = await fetch("/api/pipeline/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            prompt: `${thumbnailPrompt}${thumbnailCharacterLock}${thumbnailOverlay} --ar ${targetAspectRatio}`,
            style: imageStyle,
            bypassCache: true,
            visualConfig: { ...visualConfig, generateType: "image", aspectRatio: targetAspectRatio, noText: false, thumbnailTextRequired: thumbHasText, thumbnailText: requiredThumbnailText, characterBible: effectiveCharacterLock },
          }),
        });
        thumbnail = await thumbnailResponse.json().catch(() => ({}));
        if (thumbnailResponse.ok && thumbnail?.success && (thumbnail.base64 || thumbnail.fallbackUrl)) break;
        thumbnailError = thumbnail?.error || thumbnail?.warning || `HTTP ${thumbnailResponse.status}`;
        thumbnail = null;
        if (thumbnailAttempt < 3) {
          addLog(`⚠ Thumbnail lần ${thumbnailAttempt}/3 chưa thành công (${thumbnailError}). Đang thử lại...`);
          await new Promise(resolve => setTimeout(resolve, thumbnailAttempt * 2500));
        }
      }
      if (!thumbnail) throw new Error(`Không thể tạo thumbnail sau 3 lần thử: ${thumbnailError || "nhà cung cấp không trả ảnh"}`);
      const thumbnailPath = projectDir + "\\thumbnail_latest.jpg";
      const thumbnailSaveResponse = await fetch("/api/download-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(thumbnail.base64 ? { path: thumbnailPath, audioData: thumbnail.base64 } : { path: thumbnailPath, url: thumbnail.fallbackUrl }),
      });
      const thumbnailSaveResult = await thumbnailSaveResponse.json().catch(() => ({}));
      if (!thumbnailSaveResponse.ok || thumbnailSaveResult?.success === false) {
        throw new Error(thumbnailSaveResult?.error || "Thumbnail đã tạo nhưng không thể lưu vào thư mục dự án.");
      }
      // Text is generated natively by the image model; no FFmpeg overlay is used.
      setThumbnailPreviewUrl(`/api/serve-local-file?path=${encodeURIComponent(thumbnailPath)}&t=${Date.now()}`);
      setThumbnailRevision(previous => previous + 1);
      addLog("✓ Đã tạo, kiểm tra và lưu thumbnail_latest.jpg vào thư mục dự án.");
      addLog("✓ Đã tạo SEO và tên video xuất.");
      if (twoStage && manualStage === 3) {
        setManualWorkflowStage(4);
        setManualTwoStageReviewReady(true);
        setAutoPipelineProgress(100);
        addLog("Đã tạo xong voice, tiêu đề, mô tả và thumbnail. Hãy kiểm tra trước khi render.");
        return;
      }
      }
      if (twoStage && manualStage === 4) {
        const missingForRender: string[] = [];
        if (!String(finalScript || "").trim()) {
          missingForRender.push("Bước 1: chưa có kịch bản hoàn chỉnh");
        }
        if (!activeStoryboard?.scenes?.length || allPrompts.length === 0) {
          missingForRender.push("Bước 2: chưa có phân cảnh và prompt");
        }

        const normalizeMediaKey = (value: string) => String(value)
          .replace(/^scene[-_]?/i, "")
          .replace(/^\d{1,4}[_-]+/, "")
          .replace(/\.(?:jpe?g|png|webp|mp4|mov)$/i, "")
          .replace(/[._-]+/g, "_")
          .replace(/[^a-z0-9_]/gi, "")
          .toLowerCase();
        const listedMedia = await fetch("/api/list-project-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ directory: mediaFolder }),
        }).then(response => response.ok ? response.json() : { files: [] }).catch(() => ({ files: [] }));
        const mediaFiles: string[] = Array.isArray(listedMedia?.files) ? listedMedia.files : [];
        const completedPromptCount = allPrompts.filter(({ scene, prompt, promptIndex }: any) => {
          const key = String(prompt.code || `scene-${scene.sceneNumber || 1}-${promptIndex + 1}`);
          return mediaFiles.some(file => normalizeMediaKey(file) === normalizeMediaKey(key));
        }).length;
        if (allPrompts.length > 0 && completedPromptCount < allPrompts.length) {
          missingForRender.push(`Bước 2: media mới đủ ${completedPromptCount}/${allPrompts.length} prompt`);
        }

        if (!useDialogueVideoAudio) {
          const voiceState = await fetch("/api/check-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: projectDir + "\\voice_original.mp3" }),
          }).then(response => response.ok ? response.json() : { exists: false }).catch(() => ({ exists: false }));
          if (!generatedAudio && voiceState?.exists !== true) {
            missingForRender.push("Bước 3: chưa tạo hoặc tải lên voice");
          }
        }
        if (!completedSeo?.seoTitle || !completedSeo?.seoDescription) {
          missingForRender.push("Bước 3: chưa có tiêu đề và nội dung SEO");
        }
        if (missingForRender.length > 0) {
          throw new Error(`Chưa thể render video. Còn thiếu:\n• ${missingForRender.join("\n• ")}`);
        }
      } else if (!completedSeo) {
        throw new Error("Chưa có tiêu đề và dữ liệu SEO ở Bước 3 để render video.");
      }

      // ---------------- BƯỚC 7: RENDER ----------------
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      addLog("▶ [7/7] Đang render video cuối cùng...");
      setAutoPipelineProgress(95);
      const outputName = String(completedSeo.seoTitle || "VIDEO_HOAN_CHINH").slice(0, 90);
      const renderResponse = await fetch("/api/render-ffmpeg", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ imgDir: mediaFolder, voiceDir: projectDir + "\\vocie", outputDir: projectDir, newProjName: outputName, resolution: visualConfig.resolution || "1080p", aspectRatio: targetAspectRatio, originalAudio: useDialogueVideoAudio ? "" : projectDir + "\\voice_original.mp3", mediaType: isVideoOutput && fallbackFailedVideosToImages ? "mixed" : isVideoOutput ? "video" : "image", useMediaAudio: useDialogueVideoAudio, motionTemplate: visualConfig.motionEnabled === false ? "none" : visualConfig.motionStyle || "auto", motionIntensity: visualConfig.motionIntensity || "gentle", subtitleEnabled: visualConfig.subtitleEnabled === true, subtitleScriptPath: visualConfig.subtitleEnabled ? projectDir + "\\step3_dialogues.txt" : "", subtitleStyle: visualConfig.subtitleStyle || "modern", subtitlePosition: visualConfig.subtitlePosition || "bottom", backgroundMusicEnabled: visualConfig.backgroundMusicEnabled === true, backgroundMusicMode: visualConfig.backgroundMusicMode || "file", backgroundMusicPath: visualConfig.backgroundMusicPath || "", backgroundMusicFolder: visualConfig.backgroundMusicFolder || "", backgroundMusicVolume: Number(visualConfig.backgroundMusicVolume || 18), watermarkType: visualConfig.watermarkType || "none", watermarkPath: visualConfig.watermarkPath || "", watermarkText: visualConfig.watermarkText || "", watermarkPosition: visualConfig.watermarkPosition || "bottom-right", overviewZoomEnabled: visualConfig.overviewZoomEnabled === true }) });
      if (!renderResponse.ok) throw new Error((await renderResponse.json().catch(() => ({}))).error || "Render video thất bại.");
      const renderStream = await renderResponse.text();
      if (/"type"\s*:\s*"error"/i.test(renderStream)) {
        let renderError = "";
        for (const line of renderStream.split(/\r?\n/)) {
          const payloadText = line.startsWith("data: ") ? line.slice(6) : "";
          if (!payloadText) continue;
          try {
            const payload = JSON.parse(payloadText);
            if (payload?.type === "log" && payload?.message) addLog(String(payload.message));
            if (payload?.type === "error" && payload?.message) renderError = String(payload.message);
          } catch {}
        }
        throw new Error(renderError || "Render FFmpeg đã báo lỗi.");
      }
      setStep6Done(true);
      if (twoStage) setManualTwoStageReviewReady(true);
      setProjectHistory(previous => {
        const entry = { path: projectDir, name: String(completedSeo.seoTitle || projectDir.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || "Dự án video"), lastOpened: new Date().toISOString() };
        const next = [entry, ...previous.filter(item => item.path.toLowerCase() !== projectDir.toLowerCase())].slice(0, 30);
        localStorage.setItem("project_history_v1", JSON.stringify(next));
        return next;
      });
      addLog("✓ Render video hoàn chỉnh thành công.");

      // ---------------- HOÀN THÀNH ----------------
      setAutoPipelineProgress(100);
      addLog("🎉 CHUỖI QUY TRÌNH TỰ ĐỘNG HÓA LIÊN HOÀN HOÀN TẤT THÀNH CÔNG RỰC RỠ!");
      addLog("✨ Toàn bộ dữ liệu của bạn đã được cập nhật an toàn ở các bước, sẵn sàng sử dụng!");

      // ---------------- GỬI BÁO CÁO TELEGRAM ----------------
      if (telegramToken.trim() && telegramChatId.trim()) {
        addLog("📤 Đang gửi thông báo kết quả báo cáo về kênh Telegram của bạn...");
        
        const totalWordCount = finalScript.trim().split(/\s+/).filter(Boolean).length;
        const totalPromptsCount = storyboardData?.scenes?.reduce((acc, s) => acc + (s.imagePrompts?.length || 0), 0) || 0;
        const estDuration = Math.round(totalWordCount / 2.3); // 2.3 từ mỗi giây

        const telegramMsg = `<b>${telegramToolName}</b>

<b>🔔 THÔNG BÁO: HOÀN THÀNH QUY TRÌNH CHẠY LOẠT TỰ ĐỘNG!</b>
------------------------------------------------------
👤 <b>Dự án/Từ khóa:</b> <code>${customKeyword || brainstormData?.topicRecommended || "Dự án mới"}</code>
📈 <b>Chủ đề niche:</b> <code>${nicheCategory}</code>
------------------------------------------------------
📝 <b>KẾT QUẢ CÁC BƯỚC CHA:</b>
• <b>Bước 1: Chuẩn Hóa Kịch Bản:</b> ${autoSteps.step1 ? "✅ HOÀN TẤT" : "⏸ BỎ QUA"}
• <b>Bước 2: Viết Lại Hook Giữ Chân:</b> ${autoSteps.step2 ? "✅ HOÀN TẤT" : "⏸ BỎ QUA"}
• <b>Bước 3: Chia Cảnh & Prompts:</b> ${autoSteps.step3 ? "✅ HOÀN TẤT" : "⏸ BỎ QUA"}

📊 <b>THÔNG SỐ SẢN XUẤT:</b>
- Tổng số chữ kịch bản: <code>${totalWordCount} từ</code>
- Tổng phân cảnh chính: <code>${storyboardData?.scenes?.length || 0} cảnh</code>
- Tổng số lượng ảnh AI: <code>${totalPromptsCount} ảnh</code>
- Dự đoán thời lượng video: <code>${estDuration} giây</code>

<i>🚀 Hệ thống đã sẵn sàng cho bạn tải file dựng phim và file âm thanh! Chúc bạn bùng nổ hàng triệu lượt xem!</i>`;

        const sendOk = await sendTelegramNotification(telegramMsg);
        if (sendOk) {
          addLog("➡️ Đã bắn tin báo cáo Telegram thành công mỹ mịt!");
        } else {
          addLog("❌ Gửi tin Telegram thất bại. Vui lòng kiểm tra kỹ Bot Token & Chat ID.");
        }
      }

      if (!twoStage) {
        // Wait until every optional completion action is done, then close only
        // Chrome instances launched and owned by this tool before notifying.
        await fetch("/api/pipeline/close-tool-chrome", { method: "POST" }).catch(() => null);
        setPipelineSuccessModal({
          elapsedMs: Date.now() - pipelineStartedAt,
          projectPath: projectDir,
          videoName: outputName,
        });
      }
      pipelineCompletedSuccessfully = true;
      let outputVideoPath = "";
      try {
        const summaryResponse = await fetch("/api/project-output-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectDir }) });
        const summary = await summaryResponse.json();
        outputVideoPath = String(summary?.finalVideo?.path || "");
      } catch {}
      await updateScheduledJob("completed", 100, `Video đã hoàn thành: ${outputName}`, {
        outputVideoPath,
        publishMetadata: {
          title: String(completedSeo.seoTitle || outputName),
          description: String(completedSeo.seoDescription || completedSeo.description || "").trim(),
          tags: Array.from(new Set(
            (Array.isArray(completedSeo.tags)
              ? completedSeo.tags
              : [
                  completedSeo.tags?.primaryKeyword,
                  completedSeo.tags?.secondaryKeyword,
                  completedSeo.tags?.channelTag,
                  ...(Array.isArray(completedSeo.tags?.competitorTags)
                    ? completedSeo.tags.competitorTags
                    : []),
                ])
              .map((tag: unknown) => String(tag || "").replace(/^#+/, "").trim())
              .filter(Boolean),
          )).slice(0, 30),
        },
      });

    } catch (error: any) {
      pipelineFailedOrCancelled = true;
      if (error.name === "AbortError" || error.message === "Aborted" || error.message === "AbortError") {
        addLog("⏹️ ĐÃ DỪNG quy trình tự động hóa liên hoàn theo yêu cầu!");
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`⏹️ <b>Đã dừng quy trình tự động hóa liên hoàn</b> theo yêu cầu người dùng.`);
        }
        await updateScheduledJob("cancelled", Math.min(autoPipelineProgress, 99), "Người dùng đã dừng tác vụ.");
      } else {
        const message = String(error?.message || "Đã xảy ra lỗi không xác định khi chạy quy trình.").trim();
        addLog(`❌ [LỖI NGHIÊM TRỌNG] Quy trình tự động hóa bị ngắt quãng: ${message}`);
        // Auto Pipeline and Manual Pipeline share the same React state. Make
        // the partial output explicit here so the user can inspect and resume
        // from the last completed phase instead of starting the project again.
        if (!twoStage) {
          if (finalScript.trim()) setStandardizedScript(finalScript);
          if (autoStoryboard?.scenes?.length) setStoryboardData(autoStoryboard);
          setManualWorkflowStage(pipelineRecoveryStage);
          setManualTwoStageReviewReady(true);
        }
        // The run log is useful for diagnostics, but users must not have to
        // discover a failure by opening it. Both automation and manual flows
        // use this function, so one modal reliably covers every pipeline step.
        setPipelineErrorModal({
          message,
          mode: twoStage ? "manual" : "auto",
          stage: twoStage ? manualStage : undefined,
          recoveryStage: twoStage ? manualStage : pipelineRecoveryStage,
        });
        // Keep the real partial progress visible on failure. 100% is reserved
        // exclusively for a successfully rendered final video.
        const recoveryProgressFloor =
          pipelineRecoveryStage === 4 ? 94 :
          pipelineRecoveryStage === 3 ? 84 :
          pipelineRecoveryStage === 2 ? 60 : 5;
        const failureProgress = Math.min(
          99,
          Math.max(autoPipelineProgressRef.current, recoveryProgressFloor),
        );
        setAutoPipelineProgress(failureProgress);
        await updateScheduledJob("failed", failureProgress, message);
      }
    } finally {
      autoPipelineRunningRef.current = false;
      setIsPlayingAutoPipeline(false);
      // A resumed scheduled task may be reviewed in manual stages 1-3. Keep
      // its link across those successful stages so stage 4 can complete the
      // original job and preserve its automatic publishing schedule.
      if (!twoStage || manualStage === 4 || pipelineFailedOrCancelled || pipelineCompletedSuccessfully)
        scheduledJobRef.current = null;
    }
  };

  autoPipelineRunnerRef.current = handleRunAutoPipeline;

  // Hàm brainstorm ý tưởng chủ đề
  const handleBrainstormNiche = async () => {
    setBrainstormLoading(true);
    const selectedNicheObj = SUGGESTED_NICHES.find(n => n.category === nicheCategory);
    const controller = new AbortController();
    brainstormAbortController.current = controller;
    try {
      const res = await fetch("/api/brainstorm-niche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedNicheObj?.title || nicheCategory,
          keyword: customKeyword
        }),
        signal: controller.signal
      });
      const data = await res.json();
      if (res.ok) {
        setBrainstormData(data);
        
        // Phát sinh chủ đề ngách mới, xóa sạch toàn bộ kịch bản, phân cảnh và hình ảnh cũ
        setRawTranscript("");
        setStandardizedScript("");
        setRawHook("");
        setHookOptions([]);
        setHookOptionsText("");
        setChosenHookText("");
        setStoryboardData(null);
        setGeneratedImages({});
        setGeneratedAudio("");
        setSeoData(null);

        if (data.channelProfile) {
          // Gợi ý tên kênh sang cho bước SEO
          if (data.channelNameOptions && data.channelNameOptions.length > 0) {
            setChannelName(data.channelNameOptions[0].name);
          }
        }

        // Gửi báo cáo Telegram
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`🛎️ <b>[Brainstorm Ý Tưởng Hoàn Tất]</b>\n- Chủ đề ngách: <code>${selectedNicheObj?.title || nicheCategory}</code>\n- Từ khóa: <code>${customKeyword || "Trống"}</code>\n- Đề xuất: <code>${data.topicRecommended || "Thành công"}</code>`);
        }
      } else {
        alert(data.error || "Gặp lỗi khi phân tích chủ đề.");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Brainstorm cancelled");
        return;
      }
      alert("Đã xảy ra lỗi hệ thống: " + err.message);
    } finally {
      setBrainstormLoading(false);
    }
  };

  // Hàm tải tệp tin Video/Audio lên và tự động bóc tách kịch bản bằng Gemini
  const handleMediaUploadAndTranscribe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn kích thước tệp tải lên (30MB)
    if (file.size > 30 * 1024 * 1024) {
      alert("⚠️ Tập tin quá lớn! Vui lòng tải lên video hoặc âm thanh dưới 30MB để AI xử lý tối ưu và không bị gián đoạn.");
      playSound("error");
      return;
    }

    setUploadedFileName(file.name);
    setTranscribeLoading(true);
    playSound("click");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string;
          if (!result) {
            throw new Error("Không thể đọc được nội dung tệp tin.");
          }
          const base64Data = result.split(",")[1];
          const mimeType = file.type || "video/mp4";

          const res = await fetch("/api/transcribe-video", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              base64Data,
              mimeType,
              fileName: file.name
            })
          });

          const data = await res.json();
          if (res.ok && data.transcript) {
            setRawTranscript(data.transcript);
            playSound("success");
            
            // Tự động kích hoạt luôn chuẩn hóa kịch bản bằng AI để hoàn tất quy trình 1-click
            setProcessScriptLoading(true);
            setIsProgrammatic(false);
            const processRes = await fetch("/api/process-script", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                transcript: data.transcript,
                language: scriptLang,
                rewriteScript,
                newScriptLength,
                modifyIntroOnly
              })
            });
            const processData = await processRes.json();
            if (processRes.ok) {
              setStandardizedScript(processData.processedScript);
              setIsProgrammatic(!!processData.isProgrammaticFallback);
              const firstLines = processData.processedScript.split("\n").slice(0, 3).join("\n");
              setRawHook(firstLines);
              getAutoScriptPath();
              
              // Reset downstream states
              setHookOptions([]);
              setHookOptionsText("");
              setChosenHookText("");
              setStoryboardData(null);
              setGeneratedImages({});
              setGeneratedAudio("");
              setSeoData(null);
            }
          } else {
            alert(data.error || "Có lỗi xảy ra khi bóc tách kịch bản từ tập tin.");
            playSound("error");
          }
        } catch (innerErr: any) {
          alert("Lỗi tải lên: " + innerErr.message);
          playSound("error");
        } finally {
          setTranscribeLoading(false);
          setProcessScriptLoading(false);
        }
      };

      reader.onerror = () => {
        alert("Đã xảy ra lỗi khi đọc tập tin.");
        playSound("error");
        setTranscribeLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      alert("Đã xảy ra lỗi: " + err.message);
      playSound("error");
      setTranscribeLoading(false);
    }
  };

  // Hàm tải và tự động bóc tách kịch bản từ liên kết mạng xã hội (TikTok, FB, IG, YouTube)
  const handleSocialTranscribe = async (urlParam?: string) => {
    const targetUrl = urlParam || socialUrl;
    if (!targetUrl.trim()) {
      alert("Vui lòng nhập đường dẫn video/âm thanh từ TikTok, Facebook hoặc YouTube!");
      return;
    }

    setSocialTranscribeLoading(true);
    playSound("click");

    try {
      const res = await fetch("/api/transcribe-social-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: targetUrl.trim() })
      });

      const data = await res.json();
      if (res.ok && data.transcript) {
        setRawTranscript(data.transcript);
        playSound("success");

        // Tự động kích hoạt luôn chuẩn hóa kịch bản bằng AI để hoàn tất quy trình 1-click
        setProcessScriptLoading(true);
        setIsProgrammatic(false);
        const processRes = await fetch("/api/process-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            transcript: data.transcript,
            language: scriptLang,
            rewriteScript,
            newScriptLength,
            modifyIntroOnly
          })
        });
        const processData = await processRes.json();
        if (processRes.ok) {
          setStandardizedScript(processData.processedScript);
          setIsProgrammatic(!!processData.isProgrammaticFallback);
          const firstLines = processData.processedScript.split("\n").slice(0, 3).join("\n");
          setRawHook(firstLines);
          getAutoScriptPath();
          
          // Reset downstream states
          setHookOptions([]);
          setHookOptionsText("");
          setChosenHookText("");
          setStoryboardData(null);
          setGeneratedImages({});
          setGeneratedAudio("");
          setSeoData(null);
        }
      } else {
        alert(data.error || "Có lỗi xảy ra khi bóc tách kịch bản từ liên kết.");
        playSound("error");
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi: " + err.message);
      playSound("error");
    } finally {
      setSocialTranscribeLoading(false);
      setProcessScriptLoading(false);
    }
  };

  // Hàm chuẩn hóa kịch bản ở Bước 1
  const handleProcessScript = async (isEditRequest = false) => {
    const textToProcess = isEditRequest ? (standardizedScript || rawTranscript) : rawTranscript;
    if (!textToProcess.trim()) {
      alert("Vui lòng dán transcript hoặc kịch bản gốc để tiếp tục!");
      return;
    }
    
    // Nếu làm mới kịch bản hoàn toàn mới -> Xử lý xóa ngay toàn bộ dữ liệu phụ thuộc cũ tránh dính data cũ
    if (!isEditRequest) {
      setStandardizedScript("");
      setHookOptions([]);
      setHookOptionsText("");
      setChosenHookText("");
      setStoryboardData(null);
      setGeneratedImages({});
      setGeneratedAudio("");
      setSeoData(null);
    }

    // Exact-original mode never reaches the API. This prevents translation,
    // punctuation cleanup or any other accidental wording change.
    if (!isEditRequest && preserveOriginalScript) {
      setStandardizedScript(textToProcess);
      setRawHook(textToProcess.split("\n").slice(0, 3).join("\n"));
      setIsProgrammatic(true);
      getAutoScriptPath();
      return;
    }

    setProcessScriptLoading(true);
    setIsProgrammatic(false);
    const controller = new AbortController();
    processScriptAbortController.current = controller;
    try {
      const res = await fetch("/api/process-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript: textToProcess,
          language: scriptLang,
          editRequest: isEditRequest ? scriptEditRequest : undefined,
          rewriteScript,
          newScriptLength,
          modifyIntroOnly
        }),
        signal: controller.signal
      });
      const data = await res.json();
      if (res.ok) {
        setStandardizedScript(data.processedScript);
        setIsProgrammatic(!!data.isProgrammaticFallback);
        // Tự động phân đoạn tìm hook đầu tiên
        const firstLines = data.processedScript.split("\n").slice(0, 3).join("\n");
        setRawHook(firstLines);
        getAutoScriptPath();
        
        if (isEditRequest) {
          // Xoá nội dung yêu cầu chỉnh sửa sau khi thực hiện thành công
          setScriptEditRequest("");
          // Vì kịch bản vừa bị chỉnh sửa/cải biến, phân cảnh và âm thanh cũ sẽ bị lệch nhịp, cần phải reset để người dùng sinh lại khớp với kịch bản mới
          setStoryboardData(null);
          setGeneratedImages({});
          setGeneratedAudio("");
        } else {
          // Làm mới kịch bản hoàn toàn mới -> Xoá sạch toàn bộ dữ liệu phụ thuộc cũ của các bước sau
          setHookOptions([]);
          setHookOptionsText("");
          setChosenHookText("");
          setStoryboardData(null);
          setGeneratedImages({});
          setGeneratedAudio("");
          setSeoData(null);
        }

        // Gửi báo cáo Telegram
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`🛎️ <b>[Chuẩn Hóa Kịch Bản Hoàn Tất]</b>\n- Loại yêu cầu: <code>${isEditRequest ? "Nâng cấp/Chỉnh sửa" : "Tạo mới nguyên bản"}</code>\n- Độ dài kịch bản: <code>${data.processedScript.length} ký tự</code>\n- Trạng thái: <code>Thành Công</code>`);
        }
      } else {
        alert(data.error || "Có lỗi xảy ra khi chuẩn hóa kịch bản.");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Process script cancelled");
        return;
      }
      alert("Đã xảy ra lỗi: " + err.message);
    } finally {
      setProcessScriptLoading(false);
    }
  };

  const resetForNewRawInput = (nextInput: string) => {
    setRawTranscript(nextInput);
    setStandardizedScript("");
    setRawHook("");
    setHookOptions([]);
    setHookOptionsText("");
    setChosenHookText("");
    setStoryboardData(null);
    setGeneratedImages({});
    setGeneratedAudio("");
    setSeoData(null);
    // The previous project is already backed up. New source content starts a
    // new project and must not overwrite or reuse the old destination.
    blockedProjectSnapshotRef.current = null;
    activeProjectDirRef.current = "";
    setProjectDir("");
    setViewingProjectDir("");
    setThumbnailPreviewUrl("");
    setManualTwoStageReviewReady(false);
    setManualWorkflowStage(1);
    setShowResetConfirmModal(false);
    setPendingPastedText("");
  };

  const handlePasteRawTranscript = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    if (rawTranscript.trim() || standardizedScript.trim() || storyboardData || Object.keys(generatedImages).length || generatedAudio || seoData) {
      e.preventDefault();
      resetForNewRawInput(pastedText);
    }
  };

  const requestRawInputReplacement = (nextInput: string) => {
    if (nextInput === rawTranscript) return;
    // In the manual review workflow, editing the script means rerunning the
    // current project. Keep its explicitly selected destination while clearing
    // only derived outputs. The former generic reset silently blanked the
    // folder field on textarea blur and made the next Run click fail.
    const hasExplicitScenePlan = (nextInput.match(/\[\s*C(?:ảnh|anh)\s+\d+\b/giu) || []).length >= 2;
    if (activeStep === "manualpipeline" && hasExplicitScenePlan) {
      setRawTranscript(nextInput);
      setStandardizedScript("");
      setRawHook("");
      setHookOptions([]);
      setHookOptionsText("");
      setChosenHookText("");
      setStoryboardData(null);
      setGeneratedImages({});
      setGeneratedAudio("");
      setSeoData(null);
      setThumbnailPreviewUrl("");
      setManualTwoStageReviewReady(false);
      setManualWorkflowStage(1);
      return;
    }
    if (rawTranscript.trim() || standardizedScript.trim() || storyboardData || Object.keys(generatedImages).length || generatedAudio || seoData) {
      resetForNewRawInput(nextInput);
      return;
    }
    setRawTranscript(nextInput);
  };

  const handleConfirmResetAndPaste = () => {
    resetForNewRawInput(pendingPastedText);
  };

  const handleCancelResetAndPaste = () => {
    setShowResetConfirmModal(false);
    setPendingPastedText("");
  };

  const handleWriteScriptFromIdea = async () => {
    if (!scriptIdea.trim() || ideaWriting) return;
    setIdeaWriting(true);
    try {
      const response = await fetch("/api/write-script-from-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: scriptIdea.trim(),
          language: scriptLang,
          lengthMode: ideaLengthMode,
          targetCharacters: ideaTargetCharacters,
          targetSeconds: Math.max(0.25, ideaTargetMinutes) * 60,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể viết kịch bản từ mô tả.");
      const script = String(data.script || "").trim();
      setRawTranscript(script);
      setStandardizedScript(script);
      setRawHook(script.split("\n").slice(0, 3).join("\n"));
      setStoryboardData(null);
      setGeneratedImages({});
      setGeneratedAudio("");
      setSeoData(null);
    } catch (error: any) {
      alert(error.message || "Không thể viết kịch bản từ mô tả.");
    } finally {
      setIdeaWriting(false);
    }
  };

  // Hàm viết lại Hook Bước 2
  const handleGenerateHook = async () => {
    if (!rawHook.trim()) {
      alert("Vui lòng cung cấp nội dung đoạn hook muốn cải thiện!");
      return;
    }
    setHookLoading(true);
    setIsHookProgrammatic(false);
    const controller = new AbortController();
    hookAbortController.current = controller;
    try {
      const res = await fetch("/api/generate-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldHook: rawHook,
          context: standardizedScript,
          language: hookLang,
          rewriteStyle: hookRewriteStyle
        }),
        signal: controller.signal
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data.hookOptions)) {
          setHookOptions(data.hookOptions);
          setHookOptionsText(JSON.stringify(data.hookOptions));
        } else {
          setHookOptions([]);
          setHookOptionsText("");
        }
        setIsHookProgrammatic(!!data.isProgrammaticFallback);

        // Gửi báo cáo Telegram
        if (telegramToken.trim() && telegramChatId.trim() && Array.isArray(data.hookOptions) && data.hookOptions.length > 0) {
          await sendTelegramNotification(`🛎️ <b>[Cải Tiến Hook Hoàn Tất]</b>\n- Số phương án đề xuất: <code>3 phong cách</code>\n- Trạng thái: <code>Thành Công</code>`);
        }
      } else {
        alert(data.error || "Có lỗi xảy ra khi cải tiến Hook.");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Hook generation cancelled");
        return;
      }
      alert("Đã xảy ra lỗi: " + err.message);
    } finally {
      setHookLoading(false);
    }
  };

  // Tự động thế hook được chọn vào kịch bản hoàn chỉnh
  const handleSelectHook = (selectedHook: string) => {
    setChosenHookText(selectedHook);
    if (!selectedHook) return;
    
    if (standardizedScript.trim()) {
      if (rawHook.trim() && standardizedScript.includes(rawHook.trim())) {
        const newScript = standardizedScript.replace(rawHook.trim(), selectedHook);
        setStandardizedScript(newScript);
        setRawHook(selectedHook);
      } else {
        const paragraphs = standardizedScript.split("\n\n");
        if (paragraphs.length > 0) {
          paragraphs[0] = selectedHook;
          setStandardizedScript(paragraphs.join("\n\n"));
          setRawHook(selectedHook);
        }
      }
    } else {
      setStandardizedScript(selectedHook);
      setRawHook(selectedHook);
    }
  };

  // Hàm tự động viết dài / ngắn lại kịch bản
  const handleAdjustScriptLength = async (action: "longer" | "shorter") => {
    if (!standardizedScript.trim()) {
      alert("Vui lòng đảm bảo bạn có kịch bản hoàn chỉnh ở Bước 1 trước khi viết lại độ dài!");
      return;
    }
    setAdjustLoading(true);
    const controller = new AbortController();
    adjustAbortController.current = controller;
    try {
      const res = await fetch("/api/adjust-script-length", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: standardizedScript,
          action,
          targetWords: targetWordsAdjust || undefined,
          targetDuration: targetDurationAdjust || undefined
        }),
        signal: controller.signal
      });
      const data = await res.json();
      if (res.ok && data.adjustedScript) {
        setStandardizedScript(data.adjustedScript);
        // also extract first paragraph for rawHook/chosenHook if needed
        const paragraphs = data.adjustedScript.split("\n\n");
        if (paragraphs.length > 0) {
          setRawHook(paragraphs[0]);
          setChosenHookText(paragraphs[0]);
        }

        // Gửi báo cáo Telegram
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`🛎️ <b>[Điều Chỉnh Độ Dài Hoàn Tất]</b>\n- Thao tác: <code>${action === "longer" ? "Viết dài thêm" : "Viết ngắn đi"}</code>\n- Độ dài kịch bản mới: <code>${data.adjustedScript.length} ký tự</code>\n- Trạng thái: <code>Thành Công</code>`);
        }
      } else {
        alert(data.error || "Gặp lỗi khi điều chỉnh độ dài kịch bản.");
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log("Adjust length cancelled");
        return;
      }
      alert("Lỗi: " + e.message);
    } finally {
      setAdjustLoading(false);
    }
  };

  // Các hàm xử lý trích xuất phong cách từ ảnh mẫu
  const processImageFiles = (files: FileList | File[]) => {
    setStyleAnalysisError("");
    const maxFiles = 5;
    const currentCount = sampleImages.length;
    if (currentCount >= maxFiles) {
      setStyleAnalysisError("Bạn chỉ được tải lên tối đa 5 ảnh mẫu.");
      return;
    }

    const filesArray = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (filesArray.length === 0) {
      setStyleAnalysisError("Vui lòng tải lên tệp tin định dạng hình ảnh (PNG, JPG, WEBP, etc.).");
      return;
    }

    const limit = maxFiles - currentCount;
    const filesToProcess = filesArray.slice(0, limit);

    filesToProcess.forEach(file => {
      if (file.size > 4 * 1024 * 1024) {
        setStyleAnalysisError(`Ảnh "${file.name}" quá lớn (> 4MB). Vui lòng chọn ảnh nhẹ hơn.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === "string") {
          setSampleImages(prev => {
            if (prev.length >= maxFiles) return prev;
            return [...prev, e.target!.result as string];
          });
        }
      };
      reader.onerror = () => {
        setStyleAnalysisError("Lỗi đọc tệp tin hình ảnh mẫu.");
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePasteImage = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      processImageFiles(files);
      e.preventDefault();
    }
  };

  const handleAnalyzeStyle = async () => {
    if (sampleImages.length === 0) {
      setStyleAnalysisError("Vui lòng chuẩn bị ít nhất một hình ảnh mẫu để phân tích.");
      return;
    }

    setAnalyzingStyle(true);
    setStyleAnalysisError("");
    const controller = new AbortController();
    analyzeStyleAbortController.current = controller;

    try {
      const res = await fetch("/api/analyze-style", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ images: sampleImages }),
        signal: controller.signal
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố không mong muốn khi phân tích với Gemini.");
      }

      if (data.style) {
        setImageStyle(data.style);
        setStyleAnalysisError("");
        
        // Gửi báo cáo Telegram
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`🛎️ <b>[Phân Tích Phong Cách Thành Công]</b>\n- Mô tả style trích xuất: <code>${data.style.slice(0, 150)}...</code>\n- Trạng thái: <code>Lưu làm phong cách mẫu</code>`);
        }
      } else {
        throw new Error("Không lấy được kết quả phong cách từ AI.");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Analyze style cancelled");
        return;
      }
      console.error("Lỗi trích xuất style:", error);
      setStyleAnalysisError(error.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setAnalyzingStyle(false);
    }
  };

  // Hàm chia phân cảnh và tạo prompt Bước 3
  const handleGenerateStoryboard = async () => {
    const textToProcess = standardizedScript || rawTranscript;
    if (!textToProcess.trim()) {
      alert("Cần có kịch bản đã chuẩn hóa hoặc kịch bản nháp ở Bước 1 để chia phân cảnh!");
      return;
    }
    if (regeneratePromptsOnly && (!storyboardData || !storyboardData.scenes || storyboardData.scenes.length === 0)) {
      alert("Chưa có kịch bản phân cảnh nào để tái tạo! Vui lòng bỏ chọn 'Chỉ tái tạo prompt' để tạo kịch bản phân cảnh mới lần đầu.");
      return;
    }
    setStoryboardLoading(true);
    setIsStoryboardProgrammatic(false);
    const controller = new AbortController();
    storyboardAbortController.current = controller;
    try {
      const res = await fetch("/api/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: textToProcess,
          style: imageStyle,
          scenesCount,
          promptsPerScene,
          useDialogueSplit,
          dialogueGroupSize,
          promptsFocus,
          editRequest: storyboardEditRequest,
          isHighDensity,
          targetPromptsCount,
          characterDescription,
          regeneratePromptsOnly,
          currentScenes: storyboardData?.scenes || []
        }),
        signal: controller.signal
      });
      const data = await res.json();
      if (res.ok) {
        let overviewConfig: any = {};
        try { overviewConfig = JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}"); } catch {}
        const overviewEnabled = overviewConfig.overviewZoomEnabled === true;
        const overviewBoards = await planOverviewBoardsFromScript(textToProcess, data.scenes || [], overviewEnabled);
        const overviewManifest = applyScriptOverviewZoomPlan(data, overviewEnabled, overviewBoards, imageStyle, String(overviewConfig.aspectRatio || "16:9"));
        await saveOverviewZoomManifest(projectDir, overviewManifest);
        setStoryboardData(data);
        setIsStoryboardProgrammatic(!!data.isProgrammaticFallback);
        // Khi tạo phân cảnh mới, các hình ảnh đã tạo của phân cảnh cũ bắt buộc phải xóa sạch để không dính lắp ghép lộn xộn
        setGeneratedImages({});
        getAutoScriptPath();

        // Gửi báo cáo Telegram
        const totalPrompts = data.scenes?.reduce((acc: number, s: any) => acc + (s.imagePrompts?.length || 0), 0) || 0;
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`🛎️ <b>[Chia Phân Cảnh Hoàn Tất]</b>\n- Tổng số phân cảnh: <code>${data.scenes?.length || 0} cảnh</code>\n- Tổng mã hình ảnh: <code>${totalPrompts} ảnh</code>\n- Trạng thái: <code>Thành Công</code>`);
        }
      } else {
        alert(data.error || "Gặp lỗi khi sinh kịch bản phân cảnh.");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Storyboard cancelled");
        return;
      }
      alert("Có lỗi: " + err.message);
    } finally {
      setStoryboardLoading(false);
    }
  };

  // Hàm dịch chuyển ngôn ngữ nhanh đồng bộ (VI ⇄ EN)
  const handleTranslateStoryboard = async (targetLang: "vi" | "en") => {
    if (!storyboardData || !storyboardData.scenes || storyboardData.scenes.length === 0) {
      alert("Chưa có dữ liệu phân cảnh để chuyển đổi ngôn ngữ!");
      return;
    }

    setTranslatingLanguage(true);
    playSound("click");
    try {
      const res = await fetch("/api/translate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: standardizedScript,
          storyboardData,
          targetLang
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStandardizedScript(data.translatedScript);
        setStoryboardData(data.storyboardData);
        setStoryboardViewLang(targetLang); // Chuyển đổi hiển thị sang ngôn ngữ vừa dịch xong
        getAutoScriptPath();
        playSound("success");
      } else {
        alert(data.error || "Gặp lỗi khi dịch thuật kịch bản.");
      }
    } catch (err: any) {
      alert("Lỗi dịch: " + err.message);
    } finally {
      setTranslatingLanguage(false);
    }
  };

  // Cập nhật thủ công lời thoại phân cảnh (manual inline edit)
  const handleUpdateSceneText = (sceneIndex: number, newText: string, lang: "vi" | "en" | "default" = "default") => {
    if (!storyboardData) return;
    const updatedScenes = [...storyboardData.scenes];
    const targetLang = lang === "default" ? (storyboardViewLang === "both" ? "vi" : storyboardViewLang) : lang;
    
    if (targetLang === "vi") {
      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        text_vi: newText,
        text: storyboardViewLang === "vi" ? newText : updatedScenes[sceneIndex].text
      };
    } else {
      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        text_en: newText,
        text: storyboardViewLang === "en" ? newText : updatedScenes[sceneIndex].text
      };
    }
    setStoryboardData({
      ...storyboardData,
      scenes: updatedScenes
    });
  };

  // Cập nhật thủ công mô tả ảnh tiếng Việt hoặc prompt tiếng Anh (manual inline edit)
  const handleUpdatePromptValue = (sceneIndex: number, promptIndex: number, key: "vietnameseLabel" | "englishPrompt" | "subText_vi" | "subText_en", value: string) => {
    if (!storyboardData) return;
    const updatedScenes = [...storyboardData.scenes];
    const updatedPrompts = [...updatedScenes[sceneIndex].imagePrompts];
    
    if (key === "subText_vi") {
      updatedPrompts[promptIndex] = {
        ...updatedPrompts[promptIndex],
        subText_vi: value,
        subText: storyboardViewLang === "vi" ? value : updatedPrompts[promptIndex].subText
      };
    } else if (key === "subText_en") {
      updatedPrompts[promptIndex] = {
        ...updatedPrompts[promptIndex],
        subText_en: value,
        subText: storyboardViewLang === "en" ? value : updatedPrompts[promptIndex].subText
      };
    } else {
      updatedPrompts[promptIndex] = {
        ...updatedPrompts[promptIndex],
        [key]: value
      } as any;
    }

    updatedScenes[sceneIndex] = {
      ...updatedScenes[sceneIndex],
      imagePrompts: updatedPrompts
    };
    setStoryboardData({
      ...storyboardData,
      scenes: updatedScenes
    });
  };

  // Hàm AI sửa đổi hoặc tái tạo các prompt chỉ định theo mã số cụ thể
  // Recreate one reviewed scene with the currently configured image/video
  // platform. It is intentionally separate from the full media batch.
  const handleRegenerateManualMedia = async (sceneIndex: number, promptIndex: number) => {
    const scene = storyboardData?.scenes?.[sceneIndex];
    const prompt = scene?.imagePrompts?.[promptIndex];
    if (!projectDir || !scene || !prompt) {
      alert("Hãy chọn thư mục dự án và một prompt hợp lệ trước khi tạo lại.");
      return;
    }
    const mediaKey = String(prompt.code || "scene-" + (scene.sceneNumber || sceneIndex + 1) + "-" + (promptIndex + 1));
    setManualMediaRegenerating(mediaKey);
    try {
      let visualConfig: any = {};
      try { visualConfig = JSON.parse(localStorage.getItem("cc_visualConfig_v2") || "{}"); } catch {}
      const savedAspectRatio = String(visualConfig.aspectRatio || "16:9");
      const aspectRatio = savedAspectRatio.includes("9:16") ? "9:16" : savedAspectRatio.includes("1:1") ? "1:1" : "16:9";
      const isVideo = String(visualConfig.generateType || "image").toLowerCase() === "video";
      const response = await fetch("/api/pipeline/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.englishPrompt || prompt.prompt || "",
          style: imageStyle,
          bypassCache: true,
          visualConfig: { ...visualConfig, aspectRatio, noText: visualConfig.noText !== false, noBlackBorder: visualConfig.noBlackBorder !== false, noWallPicture: visualConfig.noWallPicture !== false },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || result.warning || "Không thể tạo lại media.");
      const mediaUrl = result.base64 ? (isVideo ? "data:video/mp4;base64," + result.base64 : "data:image/jpeg;base64," + result.base64) : result.fallbackUrl;
      if (!mediaUrl) throw new Error("Nền tảng không trả về file media.");
      const localPath = projectDir + (isVideo ? "\\vid\\scene-" : "\\img\\scene-") + mediaKey.replace(/[^a-z0-9_-]/gi, "_") + (isVideo ? ".mp4" : ".jpg");
      const saved = await fetch("/api/download-audio", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.base64 ? { path: localPath, audioData: result.base64 } : { path: localPath, url: mediaUrl }),
      });
      const savedData = await saved.json().catch(() => ({}));
      if (saved.ok && savedData?.success && visualConfig.removeAiWatermark === true) {
        const cleanResponse = await fetch("/api/clean-ai-watermark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: localPath,
            mediaType: isVideo ? "video" : "image",
            backend: visualConfig.watermarkBackend === "cv2" ? "cv2" : "migan",
          }),
        });
        const cleanResult = await cleanResponse.json().catch(() => ({}));
        setAutoPipelineLogs(previous => [...previous,
          cleanResponse.ok && cleanResult?.success
            ? (cleanResult.cleaned ? `✓ Đã xóa watermark cho ${mediaKey}.` : `✓ ${mediaKey} không có watermark nhận diện được.`)
            : `⚠️ Chưa xóa được watermark ${mediaKey}: ${cleanResult?.error || "lỗi không xác định"}`,
        ]);
      }
      // A generated provider URL/base64 is still a valid result. Keep it on
      // screen if the optional project save fails so the retry action remains
      // available instead of turning the preview into a broken local URL.
      const previewUrl = saved.ok && savedData?.success
        ? "/api/serve-local-file?path=" + encodeURIComponent(localPath) + "&t=" + Date.now()
        : mediaUrl;
      setGeneratedImages(previous => ({ ...previous, [mediaKey]: previewUrl }));
      setAutoPipelineLogs(previous => [...previous, "Đã tạo lại " + (isVideo ? "video " : "ảnh ") + mediaKey + " theo prompt đã chỉnh sửa."]);
    } catch (error: any) {
      alert(error?.message || "Không thể tạo lại media.");
    } finally {
      setManualMediaRegenerating(null);
    }
  };

  // Reconcile review cards with files already created in the project. This
  // does not trigger AI generation; it only refreshes image/video previews.
  const handleReloadProjectMedia = async (directoryOverride?: string) => {
    const targetProjectDir = String(directoryOverride || projectDir).trim();
    if (!targetProjectDir) {
      alert("Hãy chọn thư mục dự án trước khi tải lại media.");
      return;
    }
    // When loading another folder, always derive the prompt plan from that
    // folder instead of accidentally matching files against the previous
    // project's React state.
    let activeScenes = directoryOverride ? [] : (storyboardData?.scenes || []);
    if (!activeScenes.length) {
      try {
        const response = await fetch("/api/project-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: targetProjectDir }),
        });
        const projectState = await response.json();
        const backupScript = String(projectState?.backupScript || "");
        const restored = response.ok && backupScript.includes("YT CREATOR PIPELINE 2026 BACKUP")
          ? restoreBackupContent(backupScript, false)
          : null;
        activeScenes = restored?.scenes || [];
      } catch {
        activeScenes = [];
      }
    }
    if (!activeScenes.length) {
      alert("Không tìm thấy dữ liệu phân cảnh/prompt trong script.txt của dự án. Hãy tạo Bước 2 trước khi tải lại media.");
      return;
    }
    const normalizeMediaKey = (value: string) => String(value)
      .replace(/^scene[-_]?/i, "")
      .replace(/^\d{1,4}[_-]+/, "")
      .replace(/\.(?:jpe?g|png|webp|mp4|mov)$/i, "")
      .replace(/[._-]+/g, "_")
      .replace(/[^a-z0-9_]/gi, "")
      .toLowerCase();
    const promptKeys = activeScenes.flatMap((scene: any) =>
      (scene.imagePrompts || []).map((prompt: any, promptIndex: number) =>
        String(prompt.code || `scene-${scene.sceneNumber || 1}-${promptIndex + 1}`),
      ),
    );
    const directories = [`${targetProjectDir}\\img`, `${targetProjectDir}\\vid`];
    const responses = await Promise.all(directories.map(async (directory) => {
      const response = await fetch("/api/list-project-media", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ directory }),
      });
      const data = response.ok ? await response.json() : { files: [] };
      return { directory, files: Array.isArray(data?.files) ? data.files : [] };
    }));
    const files = responses.flatMap(({ directory, files }) => files.map((file: string) => ({ directory, file })));
    setGeneratedImages(previous => {
      const next = { ...previous };
      promptKeys.forEach((key) => {
        const match = files.find(item => normalizeMediaKey(item.file) === normalizeMediaKey(key));
        if (match) next[key] = `/api/serve-local-file?path=${encodeURIComponent(`${match.directory}\\${match.file}`)}&t=${Date.now()}`;
      });
      return next;
    });
    setAutoPipelineLogs(previous => [...previous, `Đã tải lại ${files.length} file media từ thư mục dự án.`]);
  };

  const handleRewriteSpecificPrompts = async () => {
    if (!storyboardData || !storyboardData.scenes) {
      alert("Chưa có kịch bản phân cảnh nào để chỉnh sửa!");
      playSound("error");
      return;
    }
    if (!selectedPromptCodesForEdit.trim()) {
      alert("Vui lòng điền mã số prompt cần sửa! Ví dụ: P12.1 hoặc P12.1, P12.2");
      playSound("error");
      return;
    }
    if (!specificEditInstructions.trim()) {
      alert("Vui lòng điền yêu cầu chỉnh sửa cụ thể cho các prompt này!");
      playSound("error");
      return;
    }

    // Tách mã số prompt thành mảng các chuỗi viết hoa, loại bỏ khoảng trắng dư thừa
    const codesToEdit = selectedPromptCodesForEdit
      .split(/[\s,;\-+]+/)
      .map(code => code.trim().toUpperCase())
      .filter(Boolean);

    if (codesToEdit.length === 0) {
      alert("Mã số prompt không hợp lệ. Vui lòng nhập đúng định dạng (Ví dụ: P1.1, P1.2 hoặc P12.1)");
      playSound("error");
      return;
    }

    setRewriteSpecificPromptsLoading(true);
    playSound("launch");

    try {
      const res = await fetch("/api/rewrite-specific-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: storyboardData.scenes,
          promptCodes: codesToEdit,
          editInstructions: specificEditInstructions,
          style: imageStyle,
          characterDescription
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi máy chủ khi cập nhật prompt.");
      }

      const data = await res.json();
      if (data.scenes) {
        setStoryboardData({
          ...storyboardData,
          scenes: data.scenes
        });
        alert(`Đã dùng AI cập nhật thành công ${codesToEdit.length} prompt chỉ định (${codesToEdit.join(", ")}). Bạn có thể tiến hành tạo lại media ngay tại Bước 2!`);
        playSound("success");
      }
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi chỉnh sửa prompt bằng AI: " + err.message);
      playSound("error");
    } finally {
      setRewriteSpecificPromptsLoading(false);
    }
  };

  // Hàm copy toàn bộ prompt vẽ của tất cả các phân cảnh cùng lúc
  const handleCopyAllPrompts = () => {
    if (!storyboardData || !storyboardData.scenes) {
      alert("Chưa có kịch bản phân cảnh nào được tạo lọc!");
      return;
    }
    const rawPrompts = storyboardData.scenes
      .flatMap(scene => scene.imagePrompts?.map(p => p.englishPrompt) || [])
      .filter(Boolean);
    
    if (rawPrompts.length === 0) {
      alert("Không tìm thấy các prompt ảnh nào để sao chép!");
      return;
    }

    const allPrompts = rawPrompts.map((p, index) => `${index + 1}. ${p}`).join("\n\n");

    navigator.clipboard.writeText(allPrompts).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }).catch(err => {
      alert("Không thể sao chép: " + err.message);
    });
  };

  // Hàm copy toàn bộ prompt kèm chia phân cảnh có cấu trúc chỉn chu
  const handleCopyAllPromptsFormatted = () => {
    if (!storyboardData || !storyboardData.scenes) {
      alert("Chưa có kịch bản phân cảnh nào được tạo lọc!");
      return;
    }

    let textStr = "=== DANH SÁCH PHÂN CẢNH & PROMPTS: ===\n\n";
    storyboardData.scenes.forEach((scene, index) => {
      const sceneNum = scene.sceneNumber || (index + 1).toString();
      const timeRange = scene.timeSegment || "00:00 - 00:10";
      textStr += `--- Phân cảnh ${sceneNum} (${timeRange}) ---\n`;
      textStr += `[Đoạn thoại]: ${scene.text || ""}\n`;
      textStr += `[Mô tả visual]: ${scene.visualDescription || ""}\n`;
      
      if (scene.imagePrompts && scene.imagePrompts.length > 0) {
        scene.imagePrompts.forEach((p) => {
          textStr += `  + [${p.code}] (Ý tưởng: ${p.vietnameseLabel || `Phân ảnh ${sceneNum}`})\n`;
          textStr += `    Prompt AI: ${p.englishPrompt || ""}\n`;
        });
      }
      textStr += "\n";
    });

    navigator.clipboard.writeText(textStr.trim() + "\n").then(() => {
      setCopiedFormatted(true);
      setTimeout(() => setCopiedFormatted(false), 2000);
    }).catch(err => {
      alert("Không thể sao chép: " + err.message);
    });
  };

  // Hàm sao chép prompt theo số lượng hoặc khoảng chỉ định
  const handleCopyPromptsByQty = () => {
    if (!storyboardData || !storyboardData.scenes) {
      alert("Chưa có kịch bản phân cảnh nào!");
      return;
    }

    const allPrompts = storyboardData.scenes
      .flatMap(scene => scene.imagePrompts?.map(p => p.englishPrompt) || [])
      .filter(Boolean);

    if (allPrompts.length === 0) {
      alert("Không tìm thấy prompt ảnh nào!");
      return;
    }

    let selectedPrompts: string[] = [];
    let message = "";

    if (copyQtyMode === "count") {
      const count = Math.min(copyQtyCount, allPrompts.length);
      selectedPrompts = allPrompts.slice(0, count).map((p, index) => `${index + 1}. ${p}`);
      message = `Đã sao chép thành công ${count} prompt đầu tiên!`;
    } else {
      const startIdx = Math.max(1, copyQtyStart) - 1;
      const endIdx = Math.min(copyQtyEnd, allPrompts.length);
      if (startIdx > endIdx) {
        alert("Thứ tự bắt đầu phải nhỏ hơn hoặc bằng kết thúc!");
        return null;
      }
      selectedPrompts = allPrompts.slice(startIdx, endIdx).map((p, index) => `${copyQtyStart + index}. ${p}`);
      message = `Đã sao chép thành công ${selectedPrompts.length} prompt (Từ #${copyQtyStart} đến #${endIdx})!`;
    }

    const textToCopy = selectedPrompts.join("\n\n");
    navigator.clipboard.writeText(textToCopy).then(() => {
      triggerCopy("qtyPromptCopy", textToCopy);
    }).catch(err => {
      alert("Không thể sao chép: " + err.message);
    });
  };

  const resolveThumbnailStyle = () => {
    let savedStyle = "from-step3";
    try {
      savedStyle = String(JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}")?.thumbnailStyle || "from-step3");
    } catch {}
    const styleMap: Record<string, string> = {
      "high-ctr": "High-contrast YouTube thumbnail, bold focal subject, clean composition, strong visual hierarchy, high click-through-rate design",
      minimal: "Minimalist thumbnail, uncluttered composition, one clear focal subject, generous negative space, premium clean design",
      cinematic: "Cinematic thumbnail, dramatic lighting, filmic color grading, strong depth, premium movie-poster composition",
    };
    if (savedStyle === "from-step3" || savedStyle === "from-step2") {
      return imageStyle.trim() || thumbStyleAnalysis.trim();
    }
    return styleMap[savedStyle] || imageStyle.trim() || thumbStyleAnalysis.trim();
  };

  // Tạo lại SEO và Thumbnail ở Bước 3 của quy trình 4 bước.
  const handleGenerateSEO = async () => {
    const scriptText = standardizedScript || rawTranscript;
    if (!scriptText.trim()) {
      alert("Hãy cung cấp kịch bản đầy đủ để tối ưu SEO tốt nhất!");
      return;
    }
    setSeoLoading(true);
    setSeoRegenerateProgress(8);
    setIsSeoProgrammatic(false);
    const controller = new AbortController();
    seoAbortController.current = controller;

    // Bước 2 là nguồn phong cách chính; lựa chọn Thumbnail có thể ghi đè rõ ràng.
    const activeStyle = resolveThumbnailStyle();
    setThumbStyleAnalysis(activeStyle);

    try {
      const res = await fetch("/api/generate-seo-seeding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: scriptText,
          channelName: channelName || "Kênh Của Tôi",
          targetKeywords: targetKeywords.trim(),
          thumbnailStyle: activeStyle,
          thumbnailHasText: thumbHasText,
          thumbnailCustomText: thumbCustomText,
          characterDescription,
          includeChapters: seoIncludeChapters,
          includeTracklist: false
        }),
        signal: controller.signal
      });
      const data = await res.json();
      setSeoRegenerateProgress(78);
      if (res.ok) {
        const completedSeo = {
          ...data,
          titleOptions: Array.isArray(data.titleOptions) ? data.titleOptions.filter(Boolean) : [],
          seoDescription: String(data.seoDescription || "")
            .replace(/\\n/g, "\n")
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
        };
        setSeoData(completedSeo);
        setIsSeoProgrammatic(!!data.isProgrammaticFallback);

        // Persist the regenerated SEO so project reload/review uses the new result.
        if (projectDir.trim()) {
          const saveResponse = await fetch("/api/save-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: projectDir + "\\seo.txt",
              content: `TIÊU ĐỀ\n${completedSeo.seoTitle || completedSeo.titleOptions?.[0] || ""}\n\nMÔ TẢ\n${completedSeo.seoDescription || ""}\n\nPROMPT THUMBNAIL\n${completedSeo.thumbnailConcept?.imagePrompt || ""}`
            })
          });
          const saveResult = await saveResponse.json().catch(() => ({}));
          if (!saveResponse.ok || saveResult?.success === false) {
            throw new Error(saveResult?.error || "Không thể lưu SEO vào thư mục dự án.");
          }
        }
        setSeoRegenerateProgress(100);

        // Gửi báo cáo Telegram
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`🛎️ <b>[Tạo SEO & Seeding Hoàn Tất]</b>\n- Tên Kênh: <code>${channelName || "Chưa đặt"}</code>\n- Số câu hỏi Seeding ảo: <code>${data.seeding?.length || 0} câu</code>\n- Trạng thái: <code>Thành Công</code>`);
        }
        alert("Đã tạo lại SEO và lưu kết quả mới vào dự án.");
      } else {
        alert(data.error || "Có lỗi khi phân tích SEO kịch bản này.");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("SEO aborted");
        return;
      }
      alert("Lỗi: " + err.message);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 350));
      setSeoLoading(false);
      setSeoRegenerateProgress(0);
    }
  };

  const handleRegenerateThumbnail = async () => {
    const thumbnailPrompt = String(
      seoData?.thumbnailConcept?.imagePrompt ||
      `High-impact YouTube thumbnail illustrating this video: ${(standardizedScript || rawTranscript).replace(/\s+/g, " ").trim().slice(0, 500)}. Show one concrete focal subject and action, clean composition and strong contrast.`,
    ).trim();
    if (!projectDir.trim()) {
      alert("Hãy chọn thư mục dự án trước khi tạo lại thumbnail.");
      return;
    }

    setThumbnailRegenerating(true);
    setThumbnailRegenerateProgress(8);
    try {
      const activeStyle = resolveThumbnailStyle();
      let thumbnailVisualConfig: any = {};
      try {
        thumbnailVisualConfig = JSON.parse(localStorage.getItem("cc_visualConfig_v2") || "{}");
      } catch {}
      const savedAspectRatio = String(thumbnailVisualConfig.aspectRatio || "16:9");
      const thumbnailAspectRatio = savedAspectRatio.includes("9:16")
        ? "9:16"
        : savedAspectRatio.includes("1:1")
          ? "1:1"
          : "16:9";
      const thumbnailText = String(
        seoData?.thumbnailConcept?.thumbnailText || seoData?.seoTitle || "",
      ).trim().split(/\s+/).slice(0, 5).join(" ");
      const requiredThumbnailText = thumbCustomText.trim() || thumbnailText;
      const thumbnailOverlay = thumbHasText
        ? `. MANDATORY IN-IMAGE TYPOGRAPHY: Render this exact Vietnamese title as visible typography inside the generated thumbnail: "${requiredThumbnailText}". Place it prominently, large, bold, high-contrast, fully legible, with clean spelling. This text must be part of the generated image itself; do not leave the image text-free.`
        : ". Do not include any text, letters, captions, logos, or typography.";
      const thumbnailCharacterLock = characterDescription.trim()
        ? ` CHARACTER IDENTITY LOCK: ${characterDescription.trim()}. Keep the same gender, age range, face, body proportions, hairstyle, skin tone and wardrobe as the video scenes; never gender-swap, age-shift or redesign the recurring character.`
        : "";

      setThumbnailRegenerateProgress(20);
      const response = await fetch("/api/pipeline/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${thumbnailPrompt}${thumbnailCharacterLock}${thumbnailOverlay} --ar ${thumbnailAspectRatio}`,
          style: activeStyle,
          bypassCache: true,
          visualConfig: {
            ...thumbnailVisualConfig,
            generateType: "image",
            aspectRatio: thumbnailAspectRatio,
            noText: false,
            thumbnailTextRequired: thumbHasText,
            thumbnailText: requiredThumbnailText,
            characterBible: characterDescription.trim(),
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || (!result.base64 && !result.fallbackUrl)) {
        throw new Error(result.error || "Không tạo được ảnh thumbnail.");
      }

      setThumbnailRegenerateProgress(78);
      const thumbnailPath = projectDir + "\\thumbnail_latest.jpg";
      const saveResponse = await fetch("/api/download-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          result.base64
            ? { path: thumbnailPath, audioData: result.base64 }
            : { path: thumbnailPath, url: result.fallbackUrl },
        ),
      });
      const saveResult = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok || saveResult?.success === false) {
        throw new Error(saveResult?.error || "Không thể lưu ảnh thumbnail vào dự án.");
      }
      // Text is generated natively by the image model; no FFmpeg overlay is used.

      setThumbnailPreviewUrl(
        `/api/serve-local-file?path=${encodeURIComponent(thumbnailPath)}&t=${Date.now()}`,
      );
      setThumbnailRevision((previous) => previous + 1);
      setThumbnailRegenerateProgress(100);
      setAutoPipelineLogs((previous) => [...previous, "✓ Đã tạo lại và lưu thumbnail mới vào thư mục dự án."]);
    } catch (error: any) {
      alert("Không thể tạo lại thumbnail: " + (error?.message || "Lỗi không xác định"));
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setThumbnailRegenerating(false);
      setThumbnailRegenerateProgress(0);
    }
  };

  const runVoiceGeneration = async (forceRegenerate: boolean) => {
    const textToSpeak = (standardizedScript || rawTranscript)
      .replace(/\[\s*Cảnh[^\]]*\]\s*/gi, " ")
      .replace(/(?:^|\s)Lời\s*thoại\s*:\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!textToSpeak.trim()) {
      alert("Vui lòng chuẩn bị kịch bản hoàn chỉnh trước khi tạo giọng đọc.");
      return;
    }

    const voicePath = projectDir.trim() ? projectDir + "\\voice_original.mp3" : "";
    if (!forceRegenerate && voicePath) {
      const existingVoice = await fetch("/api/check-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: voicePath }),
      }).then(response => response.json()).catch(() => ({ exists: false }));
      if (existingVoice?.exists) {
        setGeneratedAudio(`/api/serve-local-file?path=${encodeURIComponent(voicePath)}&t=${Date.now()}`);
        setVoiceRegenerateProgress(96);
        const timelineResponse = await fetch("/api/timeline/run-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "slice",
            params: {
              script: projectDir + "\\step3_dialogues.txt",
              audio: voicePath,
              outdir: projectDir + "\\vocie",
              imgdir: projectDir + "\\vid",
            },
          }),
        });
        const timelineResult = await timelineResponse.text();
        if (!timelineResponse.ok || /"type"\s*:\s*"error"/i.test(timelineResult) || /"success"\s*:\s*false/i.test(timelineResult)) {
          throw new Error("Đã tạo voice nhưng Whisper không thể cắt lại timeline.");
        }
        setStep5Done(true);
        return;
      }
    }

    setVoiceGenerating(true);
    setVoiceRegenerateProgress(8);
    const controller = new AbortController();
    voiceAbortController.current = controller;
    try {
      let voiceConfig: any = {};
      try { voiceConfig = JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}"); } catch {}
      if (voiceConfig.voiceProvider === "external") {
        throw new Error("Bạn đang chọn voice tải từ bên ngoài. Hãy tải file voice mới lên để thay thế.");
      }

      let audioUrl = "";
      let audioData = "";
      if (voiceConfig.voiceProvider === "vieneu") {
        const response = await fetch("/api/vieneu/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ text: textToSpeak, voice: voiceConfig.voiceModel, speed: Number(voiceConfig.voiceSpeed) || 1, emotion: voiceConfig.voiceEmotion || "natural", referenceAudioPath: voiceConfig.voiceReferencePath || undefined }),
        });
        const result = await response.json();
        setVoiceRegenerateProgress(82);
        if (!response.ok || !result.success) throw new Error(result.error || "Không thể tạo giọng VieNeu Local.");
        audioUrl = result.audioUrl || "";
      } else if (voiceConfig.voiceProvider === "premium" && voiceConfig.voiceId) {
        const startResponse = await fetch("/api/ai33/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ text: textToSpeak, voice_id: voiceConfig.voiceId, speed: Number(voiceConfig.voiceSpeed) || 1 })
        });
        const started = await startResponse.json();
        if (!startResponse.ok || !started.success || !started.task_id) throw new Error(started.error || "Không thể khởi tạo tác vụ Voice Premium.");
        for (let attempt = 0; attempt < 120; attempt += 1) {
          await new Promise(resolve => setTimeout(resolve, 2500));
          if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
          const taskResponse = await fetch(`/api/ai33/task/${started.task_id}`, { signal: controller.signal });
          const task = await taskResponse.json();
          const remoteProgress = Number(task.progress ?? task.metadata?.progress);
          setVoiceRegenerateProgress(Number.isFinite(remoteProgress)
            ? Math.max(12, Math.min(90, Math.round(remoteProgress)))
            : Math.min(90, 12 + Math.round(((attempt + 1) / 120) * 78)));
          if (String(task.status).toLowerCase() === "done") { audioUrl = task.metadata?.audio_url || task.audio_url || ""; break; }
          if (String(task.status).toLowerCase() === "error") throw new Error(task.error_message || "Tạo Voice Premium thất bại.");
        }
      } else {
        const response = await fetch("/api/generate-tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ text: textToSpeak, voiceName: voiceConfig.voiceModel || selectedVoice })
        });
        const result = await response.json();
        setVoiceRegenerateProgress(82);
        if (!response.ok) throw new Error(result.error || "Không thể tạo giọng đọc.");
        audioUrl = result.audioUrl || "";
        audioData = result.base64 || "";
      }
      if (!audioUrl && !audioData) throw new Error("Dịch vụ Voice chưa trả về file âm thanh.");

      if (voicePath) {
        setVoiceRegenerateProgress(92);
        const saveResponse = await fetch("/api/download-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(audioData ? { path: voicePath, audioData } : { path: voicePath, url: audioUrl })
        });
        const saveResult = await saveResponse.json().catch(() => ({}));
        if (!saveResponse.ok || saveResult?.success === false) throw new Error(saveResult?.error || "Không thể lưu voice vào thư mục dự án.");
        setGeneratedAudio(`/api/serve-local-file?path=${encodeURIComponent(voicePath)}&t=${Date.now()}`);
        setVoiceRegenerateProgress(96);
        const timelineResponse = await fetch("/api/timeline/run-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "slice",
            params: {
              script: projectDir + "\\step3_dialogues.txt",
              audio: voicePath,
              outdir: projectDir + "\\vocie",
              imgdir: projectDir + "\\vid",
            },
          }),
        });
        const timelineResult = await timelineResponse.text();
        if (!timelineResponse.ok || /"type"\s*:\s*"error"/i.test(timelineResult) || /"success"\s*:\s*false/i.test(timelineResult)) {
          throw new Error("Đã tạo voice nhưng Whisper không thể cắt lại timeline.");
        }
      } else {
        setGeneratedAudio(audioUrl || `data:audio/wav;base64,${audioData}`);
      }
      setStep5Done(true);
      setVoiceRegenerateProgress(100);
      alert(forceRegenerate ? "Đã tạo lại Voice và lưu file mới vào dự án." : "Đã tạo Voice thành công.");
    } catch (err: any) {
      if (err.name !== "AbortError") alert(`Không thể tạo Voice: ${err.message}`);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 350));
      setVoiceGenerating(false);
      setVoiceRegenerateProgress(0);
    }
  };


  // Hàm sinh giọng đọc bằng Google AI ở Bước 5
  const handleGenerateVoiceLegacy = async () => {
    const textToSpeak = (standardizedScript || rawTranscript)
      .replace(/\[\s*Cảnh[^\]]*\]\s*/gi, " ")
      .replace(/(?:^|\s)Lời\s*thoại\s*:\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!textToSpeak.trim()) {
      alert("Vui lòng dán/chuẩn bị kịch bản hoàn chỉnh ở Bước 1 trước khi tạo giọng đọc!");
      return;
    }

    // Re-running a later project part must reuse its saved voice rather than
    // silently creating a duplicate and consuming Voice Premium credits.
    if (projectDir.trim()) {
      const voicePath = projectDir + "\\voice_original.mp3";
      const existingVoice = await fetch("/api/check-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: voicePath }),
      }).then(response => response.json()).catch(() => ({ exists: false }));
      if (existingVoice?.exists) {
        const localUrl = `/api/serve-local-file?path=${encodeURIComponent(voicePath)}&t=${Date.now()}`;
        setGeneratedAudio(localUrl);
        setStep5Done(true);
        alert("Đang dùng lại voice đã tạo của dự án. Không gọi tạo voice mới và không trừ điểm.");
        return;
      }
    }

    setVoiceGenerating(true);
    const controller = new AbortController();
    voiceAbortController.current = controller;
    try {
      const res = await fetch("/api/generate-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          voiceName: selectedVoice
        }),
        signal: controller.signal
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedAudio(data.audioUrl);

        // Gửi báo cáo Telegram
        if (telegramToken.trim() && telegramChatId.trim()) {
          await sendTelegramNotification(`🛎️ <b>[Tạo Thuyết Minh Hoàn Tất]</b>\n- Tên giọng đọc: <code>${selectedVoice}</code>\n- Độ dài văn bản đọc: <code>${textToSpeak.length} ký tự</code>\n- Trạng thái: <code>Thành Công</code>`);
        }
      } else {
        alert(data.error || "Gặp lỗi khi tạo giọng nói từ Google AI");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Voice generation canceled");
        return;
      }
      alert(`Đã xảy ra lỗi khi tạo giọng đọc: ${err.message}`);
    } finally {
      setVoiceGenerating(false);
    }
  };

  const handleGenerateVoice = () => runVoiceGeneration(false);
  const handleRegenerateVoice = () => runVoiceGeneration(true);

  // Dùng khi khách đã tạo voice ở bên ngoài: lưu trực tiếp vào project để
  // timeline/render vẫn dùng chính xác cùng một audio thay vì một URL tạm.
  const handleManualExternalVoiceUpload = async (file?: File) => {
    if (!file) return;
    if (!projectDir) {
      alert("Vui lòng chọn thư mục dự án trước khi tải voice.");
      return;
    }
    try {
      const query = new URLSearchParams({ projectDir, fileName: file.name });
      const response = await fetch(`/api/upload-external-voice?${query.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Không thể lưu voice vào dự án.");
      setGeneratedAudio(payload.url);
      setStep5Done(true);
    } catch (error: any) {
      alert(error?.message || "Tải voice thất bại.");
    }
  };

  // Toàn bộ trạng thái kịch bản hoàn chỉnh để tải về
  const generateBackupContent = (lang: "vi" | "en" = "vi") => {
    let content = `============== YT CREATOR PIPELINE 2026 BACKUP ==============\n`;
    content += `=== NGÔN NGỮ XUẤT BẢN: ${lang === "vi" ? "TIẾNG VIỆT 🇻🇳" : "TIẾNG ANH 🇺🇸"} ===\n\n`;
    content += `=== CHỦ ĐỀ CHỌN LỰA: ${nicheCategory} ===\n\n`;
    if (brainstormData) {
      content += `[Mô tả kênh gợi ý]:\n${brainstormData.channelProfile?.description || ""}\n\n`;
    }

    // Script section
    const selectedScript = lang === "vi"
      ? (standardizedScript || storyboardData?.script_vi)
      : (storyboardData?.script_en || standardizedScript);
    if (selectedScript) content += `=== KỊCH BẢN ĐÃ CHUẨN HÓA LÀM GIỌNG ĐỌC: ===\n${selectedScript}\n\n`;

    if (chosenHookText) {
      content += `=== HOOK MỚI ĐẦU CUỐN HÚT: ===\n${chosenHookText}\n\n`;
    }

    if (storyboardData) {
      content += `=== DANH SÁCH PHÂN CẢNH & PROMPTS: ===\n`;
      storyboardData.scenes.forEach(s => {
        content += `\n--- Phân cảnh ${s.sceneNumber} (${s.timeSegment}) ---\n`;
        
        if (lang === "vi") {
          content += `[Đoạn thoại]: ${s.text_vi || s.text}\n`;
        } else {
          content += `[Đoạn thoại]: ${s.text_en || s.text}\n`;
        }

        content += `[Mô tả visual]: ${s.visualDescription}\n`;
        s.imagePrompts.forEach(p => {
          content += `  + [${p.code}] (Ý tưởng: ${p.vietnameseLabel})\n`;
          content += `    Prompt AI: ${p.englishPrompt}\n`;
          
          if (lang === "vi") {
            content += `    [Câu thoại băm voice]: ${p.subText_vi || p.subText || ""}\n`;
          } else {
            content += `    [Câu thoại băm voice]: ${p.subText_en || p.subText || ""}\n`;
          }
        });
      });
      content += `\n`;
    }

    if (seoData) {
      content += `=== THÔNG TIN SEO VIDEO ===\n`;
      content += `Tiêu đề: ${seoData.seoTitle}\n\n`;
      content += `Mô tả:\n${seoData.seoDescription}\n\n`;
      content += `Thẻ tag:\n - Keyword chính: ${seoData.tags?.primaryKeyword}\n - Keyword phụ: ${seoData.tags?.secondaryKeyword}\n - Thẻ kênh: ${seoData.tags?.channelTag}\n - Thẻ đối thủ: ${seoData.tags?.competitorTags?.join(", ")}\n\n`;
      content += `Bình luận seeding đề xuất:\n`;
      seoData.seedingComments?.forEach(c => {
        content += ` [${c.accountType}]: "${c.commentText}"\n`;
      });
    }
    return content;
  };

  const downloadBackup = async (lang: "vi" | "en" = backupLanguage) => {
    const content = generateBackupContent(lang);
    
    // Auto-save to project directory if set
    if (projectDir) {
      try {
        await fetch("/api/save-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: projectDir + "\\script.txt", content })
        });
        console.log("Auto-saved script to project directory: script.txt");
      } catch (e) {
        console.error("Failed to auto-save script to project directory", e);
      }
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const langSuffix = lang === "vi" ? "TiengViet" : "TiengAnh";
    link.href = url;
    link.download = `YouTube_Workflow_Backup_${langSuffix}_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getAutoScriptPath = async () => {
    if (!projectDir) return null;
    const content = generateBackupContent(backupLanguage);
    const scriptPath = projectDir + "\\script.txt";
    try {
      await fetch("/api/save-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: scriptPath, content })
      });
      return scriptPath;
    } catch(e) {
      return null;
    }
  };

  const getRawScriptPath = async () => {
    if (!projectDir) return null;
    // raw_script.txt is the complete narration used by voice/render. The hook
    // is already merged into standardizedScript and must never replace the
    // entire project script on disk.
    const content = standardizedScript || rawTranscript || chosenHookText || "";
    if (!content) return null;
    
    // Clean empty lines to match exactly what voice generator used
    const cleanContent = content.split('\n').filter(line => line.trim() !== '').join('\n');
    const scriptPath = projectDir + "\\raw_script.txt";
    try {
      await fetch("/api/save-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: scriptPath, content: cleanContent })
      });
      return scriptPath;
    } catch(e) {
      return null;
    }
  };

  const restoreBackupContent = (text: string, notify = true) => {
      if (!text.includes("YT CREATOR PIPELINE 2026 BACKUP")) {
        if (notify) alert("Định dạng tệp tin backup không hợp lệ. Vui lòng tải lên tệp tin .txt do hệ thống này xuất ra!");
        return;
      }

      // A backup now represents exactly one language. Restore that selection
      // before restoring the script and storyboard content.
      const exportLanguage = text.match(/NGÔN NGỮ XUẤT BẢN:\s*(TIẾNG VIỆT|TIẾNG ANH)/i)?.[1];
      const restoredLanguage: "vi" | "en" = exportLanguage && /ANH/i.test(exportLanguage) ? "en" : "vi";
      if (exportLanguage) {
        setBackupLanguage(restoredLanguage);
        setScriptLang(restoredLanguage);
      }

      // Parse Niche
      const nicheMatch = text.match(/=== CHỦ ĐỀ CHỌN LỰA:\s*([^\n=]+?)\s*===/);
      if (nicheMatch) {
        setNicheCategory(nicheMatch[1].trim());
      }

      // Parse Standardized Script
      const scriptMatch = text.match(/=== KỊCH BẢN ĐÃ CHUẨN HÓA LÀM GIỌNG ĐỌC: ===\r?\n([\s\S]*?)(?=\r?\n=== HOOK MỚI ĐẦU CUỐN HÚT: ===|\r?\n=== DANH SÁCH PHÂN CẢNH & PROMPTS: ===|\r?\n=== THÔNG TIN SEO VIDEO ===|$)/);
      let restoredScript = scriptMatch?.[1]?.trim() || "";
      if (scriptMatch) {
        setRawTranscript(restoredScript);
        setStandardizedScript(restoredScript);
      }

      // Parse Chosen Hook
      const hookMatch = text.match(/=== HOOK MỚI ĐẦU CUỐN HÚT: ===\r?\n([\s\S]*?)(?=\r?\n=== DANH SÁCH PHÂN CẢNH & PROMPTS: ===|\r?\n=== THÔNG TIN SEO VIDEO ===|$)/);
      if (hookMatch) {
        setChosenHookText(hookMatch[1].trim());
      }

      // Parse Storyboard & Scenes
      const scenes: any[] = [];
      const sceneBlocks = text.split(/--- Phân cảnh /g);
      for (let i = 1; i < sceneBlocks.length; i++) {
        const block = sceneBlocks[i];
        const lines = block.split(/\r?\n/);
        if (lines.length === 0) continue;

        const headerMatch = lines[0].match(/^([^\s]+)\s*\(([^)]+)\)\s*---/);
        if (!headerMatch) continue;

        const sceneNumber = headerMatch[1].trim();
        const timeSegment = headerMatch[2].trim();

        let textVal = "";
        let visualDescriptionVal = "";
        const imagePrompts: any[] = [];

        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (line.startsWith("[Đoạn thoại]:")) {
            textVal = line.replace("[Đoạn thoại]:", "").trim();
          } else if (line.startsWith("[Mô tả visual]:")) {
            visualDescriptionVal = line.replace("[Mô tả visual]:", "").trim();
          } else {
            const promptHeaderMatch = line.match(/^\s*\+\s*\[([^\]]+)\]\s*\(Ý tưởng:\s*([^)]+)\)/);
            if (promptHeaderMatch) {
              const code = promptHeaderMatch[1].trim();
              const vietnameseLabel = promptHeaderMatch[2].trim();

              let englishPrompt = "";
              let subText = "";
              if (j + 1 < lines.length) {
                const nextLine = lines[j + 1];
                const englishMatch = nextLine.match(/Prompt AI:\s*(.*)/);
                if (englishMatch) {
                  englishPrompt = englishMatch[1].trim();
                  j++; // skip the prompt line
                }
              }
              if (j + 1 < lines.length) {
                const voiceMatch = lines[j + 1].match(/\[Câu thoại băm voice\]:\s*(.*)/);
                if (voiceMatch) {
                  subText = voiceMatch[1].trim();
                  j++;
                }
              }

              imagePrompts.push({
                code,
                vietnameseLabel,
                englishPrompt,
                subText,
                ...(restoredLanguage === "vi" ? { subText_vi: subText } : { subText_en: subText }),
              });
            }
          }
        }

        scenes.push({
          sceneNumber,
          timeSegment,
          text: textVal,
          ...(restoredLanguage === "vi" ? { text_vi: textVal } : { text_en: textVal }),
          visualDescription: visualDescriptionVal,
          imagePrompts
        });
      }

      // Older/partial backups may contain the complete storyboard without the
      // standalone standardized-script section. Rebuild the narration from
      // scene dialogue so reopening that project never shows "0 ký tự".
      if (!restoredScript && scenes.length > 0) {
        restoredScript = scenes
          .map((scene) => String(scene.text || "").trim())
          .filter(Boolean)
          .join("\n");
        if (restoredScript) {
          setRawTranscript(restoredScript);
          setStandardizedScript(restoredScript);
        }
      }

      if (scenes.length > 0) {
        setStoryboardData({
          scenes,
          ...(restoredLanguage === "vi" ? { script_vi: restoredScript } : { script_en: restoredScript }),
        });
      }

      // Parse SEO Data
      let restoredSeoData: any = null;
      const seoMatch = text.match(/=== THÔNG TIN SEO VIDEO ===\r?\n([\s\S]*)/);
      if (seoMatch) {
        const seoText = seoMatch[1];

        let seoTitle = "";
        const titleM = seoText.match(/Tiêu đề:\s*([^\r\n]+)/);
        if (titleM) seoTitle = titleM[1].trim();

        let seoDescription = "";
        const descM = seoText.match(/Mô tả:\r?\n([\s\S]*?)(?=\r?\nThẻ tag:|$)/);
        if (descM) seoDescription = descM[1].trim();

        let primaryKeyword = "";
        const primM = seoText.match(/-\s*Keyword chính:\s*([^\r\n]+)/);
        if (primM) primaryKeyword = primM[1].trim();

        let secondaryKeyword = "";
        const secM = seoText.match(/-\s*Keyword phụ:\s*([^\r\n]+)/);
        if (secM) secondaryKeyword = secM[1].trim();

        let channelTag = "";
        const chanM = seoText.match(/-\s*Thẻ kênh:\s*([^\r\n]+)/);
        if (chanM) channelTag = chanM[1].trim();

        let competitorTags: string[] = [];
        const compM = seoText.match(/-\s*Thẻ đối thủ:\s*([^\r\n]+)/);
        if (compM) {
          competitorTags = compM[1].split(",").map(t => t.trim()).filter(Boolean);
        }

        const seedingComments: Array<{ accountType: string; commentText: string }> = [];
        const commentLines = seoText.split(/\r?\n/);
        commentLines.forEach(line => {
          const commentM = line.match(/^\s*\[([^\]]+)\]:\s*"(.*)"\s*$/);
          if (commentM) {
            seedingComments.push({
              accountType: commentM[1].trim(),
              commentText: commentM[2].trim()
            });
          }
        });

        restoredSeoData = {
          seoTitle,
          seoDescription,
          tags: {
            primaryKeyword,
            secondaryKeyword,
            channelTag,
            competitorTags
          },
          thumbnailConcept: {
            visualIdea: "Ý tưởng thumbnail tự động",
            thumbnailText: "Text thumbnail",
            imagePrompt: "Prompt vẽ thumbnail"
          },
          seedingComments
        };
        setSeoData(restoredSeoData);
      }

      if (notify) alert("🎉 Đã nhập lại thông tin kịch bản, phân cảnh và SEO từ file backup thành công!");
      return { scenes, restoredScript, seoData: restoredSeoData };
  };

  // Hàm nhập lại toàn bộ thông tin từ file backup .txt
  const handleUploadBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      restoreBackupContent(text, true);
    };
    reader.readAsText(file);
  };

  // Xác định % tiến trình
  const calculateProgressPercent = () => {
    let completed = 0;
    if (brainstormData) completed++;
    if (standardizedScript) completed++;
    if (chosenHookText || hookOptionsText) completed++;
    if (storyboardData) completed++;
    if (seoData) completed++;
    return Math.round((completed / 5) * 100);
  };

  const formatPipelineDuration = (elapsedMs: number) => {
    const totalSeconds = Math.max(1, Math.round(elapsedMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours ? `${hours} giờ` : "", minutes ? `${minutes} phút` : "", `${seconds} giây`]
      .filter(Boolean)
      .join(" ");
  };

  const applyAutomationPreset = async (preset: AutomationPreset) => {
    let current: Record<string, unknown> = {};
    try { current = JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}"); } catch {}
    // Every preset is a complete end-to-end technical setup. Only values that
    // are actual customer inputs are carried over from the current project.
    const fullTechnicalSetup: Record<string, unknown> = {
      preserveOriginalScript: false,
      genre: "storytelling",
      audience: "general",
      writingStyle: "engaging",
      rewriteLevel: "balanced",
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
      videoDuration: "8s",
      fallbackFailedVideosToImages: false,
      dialogueVideoMode: false,
      keepVideoAudio: false,
      useReferenceImages: false,
      clipTransition: "cut",
      chromeHeadless: false,
      chromeThreads: 7,
      tabsPerChrome: 1,
      noText: true,
      noBlackBorder: true,
      noWallPicture: true,
      voiceProvider: "premium",
      voiceModel: "Zephyr",
      voiceSpeed: "1.0",
      voicePitch: "0",
      voiceEmotion: "natural",
      seoTone: "curiosity",
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
      backgroundMusicFolder: "",
      backgroundMusicVolume: 18,
      watermarkType: "none",
      watermarkPosition: "bottom-right",
    };
    const customerInputKeys = [
      "inputType", "customGenre", "scriptInstructions", "characterBible",
      "characterProfileId", "dialogueVoiceGuide", "targetKeywords",
      "backgroundMusicMode", "backgroundMusicPath", "backgroundMusicFolder", "watermarkPath", "watermarkText", "voiceId",
      "generationMode", "imageEngine", "videoEngine", "voiceProvider", "voiceModel",
    ];
    const customerInputs = Object.fromEntries(
      customerInputKeys
        .filter((key) => current[key] !== undefined)
        .map((key) => [key, current[key]]),
    );
    const config = { ...fullTechnicalSetup, ...preset.config, ...customerInputs };
    localStorage.setItem("automation_full_config_v1", JSON.stringify(config));
    localStorage.setItem("imageStyle", preset.imageStyle);
    setImageStyle(preset.imageStyle);
    setScriptLang(preset.language);
    setRewriteScript(config.rewriteLengthMode !== "source" || config.preserveOriginalScript === false);
    setAutoRewriteLengthMode((config.rewriteLengthMode as "source" | "words" | "minutes") || "source");
    if (typeof config.rewriteTargetWords === "number") setAutoRewriteTargetWords(config.rewriteTargetWords);
    if (typeof config.rewriteTargetMinutes === "number") setAutoRewriteTargetMinutes(config.rewriteTargetMinutes);
    if (typeof config.sceneCount === "number") setScenesCount(config.sceneCount);
    if (typeof config.promptsPerScene === "number") setPromptsPerScene(config.promptsPerScene);
    if (typeof config.dialogueGroupSize === "number") setDialogueGroupSize(config.dialogueGroupSize);
    setUseDialogueSplit(config.sceneMode === "dialogue");
    setPromptsFocus(config.promptFocus === "video" ? "video" : "image");
    setIsHighDensity(Boolean(config.highDensity));
    if (typeof config.hookStyle === "string") setAutoHookStyle(config.hookStyle);
    setSeoIncludeChapters(config.includeChapters === true);
    await fetch("/api/config/automation-default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    }).catch(() => {});
    setAutomationConfigRevision((value) => value + 1);
  };

  return (
    <LicenseGate>
    <div className={`vidiflow-shell flex h-screen w-full bg-[#f5f7fb] text-slate-800 font-sans overflow-hidden ${themeMode === "dark" ? "theme-dark" : ""}`}>
      
      {/* SIDEBAR BÊN TRÁI: QUY TRÌNH SẢN XUẤT */}
      <aside className="vidiflow-sidebar w-80 border-r border-slate-900/70 bg-[#090f29] text-slate-100 flex flex-col flex-shrink-0 shadow-2xl z-10">
        
        {/* LOGO & BRAND */}
        <div className="h-[108px] p-5 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(108,92,231,.65),_transparent_48%),linear-gradient(110deg,#212a57,#101a3f_58%,#080d23)] flex items-center gap-3">
          <img src="/brand/vidiflow-logo.png" alt="VidiFlow OneClick" className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_10px_18px_rgba(12,8,48,.45)]" />
          <div>
            <span className="font-extrabold tracking-tight text-xs text-rose-300 uppercase block">VidiFlow OneClick</span>
            <span className="font-semibold text-white text-sm tracking-tight">CONTENT STUDIO</span>
            <span className="mt-1 block text-[10px] font-bold tracking-wide text-indigo-200">{appVersion ? `Phiên bản v${appVersion}` : "Đang đọc phiên bản..."}</span>
          </div>
        </div>

        {/* THƯ MỤC DỰ ÁN */}
        <div className="px-4 py-5 border-b border-white/10 space-y-2">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4" /> Thư Mục Dự Án
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={projectDir}
              onChange={(e) => setProjectDir(e.target.value)}
              onBlur={() => handleProjectDirChange(projectDir)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              placeholder="Chọn thư mục..."
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-400 truncate"
            />
            <button 
              onClick={async () => {
                try {
                  const res = await fetch("/api/dialog/pick?mode=dir&title=Ch%E1%BB%8Dn%20Th%C6%B0%20M%E1%BB%A5c%20D%E1%BB%B1%20%C3%81n");
                  const data = await res.json();
                  if (data.success && data.path) {
                    handleProjectDirChange(data.path);
                  } else if (data.error) {
                    window.alert(data.error);
                  }
                } catch(e) {
                  window.alert("Không thể mở hộp chọn thư mục Windows. Vui lòng thử lại.");
                }
              }}
              className="px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap shadow-lg shadow-indigo-950/30"
            >
              Chọn
            </button>
          </div>
        </div>

        {/* TIẾN TRÌNH TỔNG QUAN */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
            <span>Tiến độ sản xuất</span>
            <span className="text-rose-300 font-extrabold">{calculateProgressPercent()}%</span>
          </div>
          <div className="w-full bg-white/15 rounded-full h-2 shadow-inner">
            <div 
              className="bg-gradient-to-r from-rose-500 to-fuchsia-500 h-2 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${Math.max(5, calculateProgressPercent())}%` }}
            ></div>
          </div>
          
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <span className={`w-2 h-2 rounded-full ${apiKeyOk ? "bg-green-500 animate-pulse" : "bg-red-500 animate-pulse"}`}></span>
              <span>Gemini API: {checkingKey ? "Đang kiểm tra..." : geminiStatusLabel}</span>
            </div>
            
            {apiKeyOk === false && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium animate-bounce">
                Cấu hình ngay
              </span>
            )}
          </div>
        </div>

        {/* DANH SÁCH BƯỚC (PHASE DESIGN) */}
        <nav className="vidiflow-nav flex-1 overflow-y-auto py-5 space-y-4">
          
          {/* Phase 1: Automation */}
          <div>
            <div className="px-5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">⚙️ HỆ THỐNG LIÊN HOÀN</div>
            <div className="mt-1 space-y-0.5">
              <button onClick={() => { setActiveStep("home"); playSound("click"); }} className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${activeStep === "home" ? "font-extrabold text-white bg-gradient-to-r from-sky-600 to-indigo-600 shadow-lg shadow-indigo-950/30" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}>
                <Sparkles className={`h-4 w-4 ${activeStep === "home" ? "text-white" : "text-sky-300"}`} /><span>Bắt đầu tạo video</span>
              </button>
              <button
                onClick={() => {
                  if (licensePlan === "starter") {
                    window.alert("Gói Khởi đầu chỉ dùng Tạo video từng bước. Hãy nâng cấp Gói Pro để mở Tạo video tự động.");
                    setActiveStep("manualpipeline");
                    return;
                  }
                  setActiveStep("autopipeline");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "autopipeline"
                    ? "font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-950/30"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Sliders className={`w-4 h-4 ${activeStep === "autopipeline" ? "text-white" : "text-slate-400"}`} />
                <span>Tạo Video Tự Động</span>
                <span className="ml-auto bg-indigo-100 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">VIP</span>
              </button>

              <button
                onClick={() => {
                  if (licensePlan === "starter") {
                    window.alert("Gói Khởi đầu chỉ dùng Tạo video từng bước. Hãy nâng cấp Gói Pro để mở Tự động theo Preset.");
                    setActiveStep("manualpipeline");
                    return;
                  }
                  setActiveStep("presetpipeline");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "presetpipeline"
                    ? "font-extrabold text-white bg-gradient-to-r from-fuchsia-600 to-rose-500 shadow-lg shadow-indigo-950/30"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Sparkles className={`w-4 h-4 ${activeStep === "presetpipeline" ? "text-white" : "text-fuchsia-300"}`} />
                <span>Tự động theo Preset</span>
                <span className="ml-auto rounded-full bg-fuchsia-100 px-1.5 py-0.5 text-[8px] font-black text-fuchsia-800">MỚI</span>
              </button>

              <button
                onClick={() => { setActiveStep("manualpipeline"); playSound("click"); }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "manualpipeline"
                    ? "font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-950/30"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <CheckSquare className={`w-4 h-4 ${activeStep === "manualpipeline" ? "text-violet-600" : "text-slate-400"}`} />
                <span>Tạo Video Từng Bước</span>
                <span className="ml-auto bg-violet-100 text-violet-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">CHỦ ĐỘNG</span>
              </button>

              <button
                onClick={() => { setActiveStep("results"); playSound("click"); }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${activeStep === "results" ? "font-extrabold text-emerald-700 bg-emerald-50 border-r-4 border-emerald-500" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Eye className={`w-4 h-4 ${activeStep === "results" ? "text-emerald-600" : "text-slate-400"}`} />
                <span>Kết quả & Theo dõi</span>
              </button>

              <button onClick={() => { setActiveStep("seo"); playSound("click"); }} className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${activeStep === "seo" ? "font-extrabold text-amber-700 bg-amber-50 border-r-4 border-amber-500" : "text-slate-600 hover:bg-slate-50"}`}>
                <Search className={`w-4 h-4 ${activeStep === "seo" ? "text-amber-600" : "text-slate-400"}`} />
                <span>SEO & Xuất bản video</span>
              </button>

              <button
                onClick={() => { setActiveStep("social-publisher"); playSound("click"); }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${activeStep === "social-publisher" ? "font-extrabold text-fuchsia-700 bg-fuchsia-50 border-r-4 border-fuchsia-500" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <MessageSquare className={`w-4 h-4 ${activeStep === "social-publisher" ? "text-fuchsia-600" : "text-slate-400"}`} />
                <span>Lên lịch đăng từ Telegram</span>
                <span className="ml-auto rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-1.5 py-0.5 text-[8px] font-black text-white">BETA</span>
              </button>

              <button
                onClick={() => { setActiveStep("projects"); playSound("click"); }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${activeStep === "projects" ? "font-extrabold text-violet-700 bg-violet-50 border-r-4 border-violet-500" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <FolderOpen className={`w-4 h-4 ${activeStep === "projects" ? "text-violet-600" : "text-slate-400"}`} />
                <span>Dự án đã chạy</span>
                {projectHistory.length > 0 && <span className="ml-auto rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-800">{projectHistory.length}</span>}
              </button>

              <button
                onClick={() => { setActiveStep("guide"); playSound("click"); }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${activeStep === "guide" ? "font-extrabold text-sky-700 bg-sky-50 border-r-4 border-sky-500" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <BookOpen className={`w-4 h-4 ${activeStep === "guide" ? "text-sky-600" : "text-slate-400"}`} />
                <span>Hướng dẫn sử dụng</span>
              </button>

              <button onClick={() => setShowUpdateCenter(true)} className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer text-slate-600 hover:bg-slate-50">
                <Download className="w-4 h-4 text-slate-400" /><span>Kiểm tra cập nhật</span>
              </button>

              <button 
                onClick={() => {
                  setActiveStep("setup");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "setup" 
                    ? "font-extrabold text-indigo-600 bg-indigo-50 border-r-4 border-indigo-500" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Settings className={`w-4 h-4 ${activeStep === "setup" ? "text-indigo-600 animate-spin-slow" : "text-slate-400"}`} />
                <span>Cài đặt</span>
                <span className="ml-auto bg-indigo-100 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">SETUP</span>
              </button>
            </div>
          </div>

          {/* The older content-editor navigation remains available through the
              guided flows, but is deliberately not exposed in the sidebar. */}
          <div className="hidden">
            <div className="px-5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">📝 BIÊN TẬP NỘI DUNG</div>
            <div className="mt-1 space-y-0.5">
              <button 
                onClick={() => {
                  setActiveStep("01");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "01" 
                    ? "font-bold text-red-600 bg-red-50 border-r-4 border-red-500" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-mono ${
                  activeStep === "01" ? "border-red-400 bg-red-100 text-red-700" : "border-slate-200 text-slate-400"
                }`}>01</span>
                <span>Bước 1: Chuẩn Hóa Kịch Bản</span>
                {standardizedScript && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>

              <button 
                onClick={() => {
                          setActiveStep("03");
                  playSound("click");
                }}
                className={`hidden w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "02" 
                    ? "font-bold text-red-600 bg-red-50 border-r-4 border-red-500" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-mono ${
                  activeStep === "02" ? "border-red-400 bg-red-100 text-red-700" : "border-slate-200 text-slate-400"
                }`}>02</span>
                <span>Bước 2: Viết Lại Hook Giữ Chân</span>
                {chosenHookText && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>

              <button 
                onClick={() => {
                  setActiveStep("03");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "03" 
                    ? "font-bold text-red-600 bg-red-50 border-r-4 border-red-500" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-mono ${
                  activeStep === "03" ? "border-red-400 bg-red-100 text-red-700" : "border-slate-200 text-slate-400"
                }`}>02</span>
                <span>Bước 2: Chia Cảnh & Prompts</span>
                {storyboardData && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>

              <button 
                onClick={() => {
                  setActiveStep("04_image");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "04_image" 
                    ? "font-bold text-red-600 bg-red-50 border-r-4 border-red-500" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-mono ${
                  activeStep === "04_image" ? "border-red-400 bg-red-100 text-red-700" : "border-slate-200 text-slate-400"
                }`}>03</span>
                <span>Bước 3: Tạo Ảnh / Video Bằng AI</span>
                {(step4Done || (generatedImages && Object.keys(generatedImages).length > 0)) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>

              <button 
                onClick={() => {
                  setActiveStep("04_voice");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "04_voice" 
                    ? "font-bold text-red-600 bg-red-50 border-r-4 border-red-500" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-mono ${
                  activeStep === "04_voice" ? "border-red-400 bg-red-100 text-red-700" : "border-slate-200 text-slate-400"
                }`}>04</span>
                <span>Bước 4: Tạo Voice AI33</span>
                {(step5Done || !!generatedAudio) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>

              <button
                onClick={() => {
                  setActiveStep("07");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "07"
                    ? "font-bold text-red-600 bg-red-50 border-r-4 border-red-500"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-mono ${
                  activeStep === "07" ? "border-red-400 bg-red-100 text-red-700" : "border-slate-200 text-slate-400"
                }`}>05</span>
                <span>Bước 5: Viết SEO & đặt tên video xuất</span>
                {seoData && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>

              <button 
                onClick={() => {
                  setActiveStep("05_audio");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "05_audio" 
                    ? "font-bold text-red-600 bg-red-50 border-r-4 border-red-500" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-mono ${
                  activeStep === "05_audio" ? "border-red-400 bg-red-100 text-red-700" : "border-slate-200 text-slate-400"
                }`}>06</span>
                <span>Bước 6: Cắt Ghép Âm Thanh/Video</span>
                {step6Done && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>


            </div>
          </div>

          {/* SEO is shown before Step 6 above so its title can name the export. */}
          <div className="hidden">
            <div className="px-5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">🚀 TỐI ƯU & QUẢNG BÁ</div>
            <div className="mt-1 space-y-0.5">
              <button 
                onClick={() => {
                  setActiveStep("07");
                  playSound("click");
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                  activeStep === "07" 
                    ? "font-bold text-red-600 bg-red-50 border-r-4 border-red-500" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-mono ${
                  activeStep === "07" ? "border-red-400 bg-red-100 text-red-700" : "border-slate-200 text-slate-400"
                }`}>07</span>
                <span>Bước 7: Viết SEO Video</span>
                {seoData && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>
            </div>
          </div>

          {/* Removed: Prompt library and full workflow links */}
          <div className="hidden">
            <button
              onClick={() => {
                setActiveStep("templates");
                playSound("click");
              }}
              className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                activeStep === "templates"
                  ? "font-bold text-teal-600 bg-teal-50 border-r-4 border-teal-500"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Thư Viện Prompt Mẫu</span>
              <span className="ml-auto bg-teal-100 text-teal-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">2026</span>
            </button>

            <button
              onClick={() => {
                setActiveStep("workflow");
                playSound("click");
              }}
              className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-xs transition-all cursor-pointer ${
                activeStep === "workflow"
                  ? "font-bold text-red-600 bg-red-50 border-r-4 border-red-500"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Quy Trình Hoàn Chỉnh</span>
              <span className="ml-auto bg-red-100 text-red-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">VIP</span>
            </button>
          </div>
        </nav>

        {/* RESET TIẾN TRÌNH & BACKUP */}
        <div className="hidden p-4 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="flex flex-col gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 block">Tải kịch bản sao lưu:</span>
              <div className="flex gap-1">
                <select
                  id="download-lang-select"
                  value={backupLanguage}
                  onChange={(e) => setBackupLanguage(e.target.value as "vi" | "en")}
                  className="bg-white text-slate-700 border border-slate-300 rounded-xl px-2 py-2 text-[11px] font-bold cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-red-500 focus:outline-none flex-1"
                >
                  <option value="vi">Tiếng Việt 🇻🇳</option>
                  <option value="en">Tiếng Anh 🇺🇸</option>
                </select>
                <button 
                  onClick={() => {
                    downloadBackup(backupLanguage);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 tracking-tight active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
                  title="Tải toàn bộ kịch bản và prompt vẽ theo ngôn ngữ đã chọn"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải Về
                </button>
              </div>
            </div>
            <label className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 tracking-tight active:scale-95 cursor-pointer transition-all shadow-xs text-center">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              Nạp Lại Kịch Bản Backup
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleUploadBackupFile}
              />
            </label>
            <button 
              onClick={handleClearSavedData}
              className="w-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 tracking-tight active:scale-95 transition-all shadow-xs cursor-pointer"
              title="Xóa bộ nhớ tạm của lần làm việc gần nhất"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Dữ Liệu Gần Nhất
            </button>
          </div>
        </div>
      </aside>

      {/* CHÂN KHÔNG GIAN LÀM VIỆC CHÍNH (MAIN WORKSPACE) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* HEADER / BREADCRUMB */}
        <header className="h-[108px] bg-white/95 border-b border-slate-200 flex items-center px-8 justify-between flex-shrink-0 z-10 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-slate-400 font-medium">VidiFlow OneClick Studio</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">
              {activeStep === "autopipeline" ? "TẠO VIDEO" : activeStep === "results" ? "KẾT QUẢ" : activeStep === "seo" ? "NỘI DUNG ĐĂNG TẢI" : activeStep === "social-publisher" ? "ĐĂNG TẢI" : activeStep === "projects" ? "DỰ ÁN" : activeStep === "guide" ? "HƯỚNG DẪN" : activeStep === "templates" ? "PROMPTS HUB" : activeStep === "workflow" ? "PIPELINE" : activeStep === "report" ? "REPORT" : activeStep === "setup" ? "SETUP" : activeStep === "07" ? "Bước 06" : activeStep === "05_audio" ? "Bước 07" : `Bước ${activeStep}`}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-905 text-slate-900 font-bold tracking-tight">
              {activeStep === "00" && "Niche Research & Khởi tạo Kênh"}
              {activeStep === "01" && "Chuẩn Hóa Kịch Bản Gốc"}
              {activeStep === "02" && "Viết Lại Hook Siêu Giữ Chân"}
              {activeStep === "03" && "Chia Cảnh & Tạo Camera Prompt"}
              {activeStep === "04" && "Tạo Ảnh Bằng Google AI (Imagen 4.0)"}
              {activeStep === "05" && "Phòng Thâu Âm Google AI Studio Studio"}
              {activeStep === "06" && "Phòng Biên Tập Video (CapCut/Pr/FCP)"}
              {activeStep === "07" && "Tối Ưu SEO & Tỷ Lệ Click (CTR)"}
              {activeStep === "08" && "Kích Hoạt Bình Luận Seeding Đẩy Đề Xuất"}
              {activeStep === "templates" && "Bộ Siêu Prompt Mẫu Youtube 2026"}
              {activeStep === "workflow" && "Cẩm Nang Toàn Diện: Quy Trình Vận Hành Triệu View 2026"}
              {activeStep === "report" && "Hồ Sơ Vận Hành & Báo Cáo Kỹ Thuật Chi Tiết"}
              {activeStep === "setup" && "Cài Đặt Hệ Thống & Cấu Hình"}
              {activeStep === "autopipeline" && "Tạo Video Hoàn Chỉnh"}
              {activeStep === "results" && "Kết Quả & Theo Dõi"}
              {activeStep === "seo" && "Nội Dung Đăng Tải"}
              {activeStep === "social-publisher" && "Lên lịch đăng video từ Telegram"}
              {activeStep === "projects" && "Dự Án Đã Chạy"}
              {activeStep === "guide" && "Hướng Dẫn Sử Dụng"}
            </span>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-100 text-slate-700 shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
              title={themeMode === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
            >
              {themeMode === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              {themeMode === "light" ? "Giao diện tối" : "Giao diện sáng"}
            </button>
            {apiKeyOk === false ? (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1 text-xs">
                <AlertCircle className="w-4 h-4 animate-bounce" />
                <span className="font-semibold text-[11px]">Chưa cấu hình GEMINI_API_KEY ở Secrets!</span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 bg-emerald-50 text-emerald-700 text-xs py-1 rounded-lg border border-emerald-100 font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Hệ Thống Trực Tuyến
              </span>
            )}

            <button 
              onClick={() => handleClearSavedData(false)}
              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-100 text-slate-700 shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Làm Lại Từ Đầu
            </button>
          </div>
        </header>

        {/* CONTAINER CHÍNH */}
        <div className="flex-1 flex overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#f4f6fb_48%,#eef2ff_100%)]">
          
          {/* CỘT PHỤ (BÊN TRÁI WORKSPACE) - HIGHLIGHT TIÊU CHUẨN LÀM VIDEO */}
          <div className="hidden">
            
            {/* GỢI Ý CÔNG VIỆC BƯỚC HIỆN TẠI */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-red-500" />
                Mục Tiêu Bước {activeStep}
              </h3>
              
              {activeStep === "00" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Nghiên cứu thị trường ngách để kiếm tiền CPM cực cao từ người xem Mỹ / Châu Âu.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Phát hiện tên kênh lý tưởng và xây dựng hồ sơ ban đầu.</span>
                  </li>
                </ul>
              )}

              {activeStep === "01" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Tải kịch bản gốc trực tiếp qua phụ đề hoặc YouTube Transcript.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Xử lý định dạng sạch: Xóa mọi timestamp thô, sửa dấu chấm câu bừa bãi.</span>
                  </li>
                </ul>
              )}

              {activeStep === "02" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>3 Giây Đầu quyết định 80% thời lượng xem của thuật toán.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Tận dụng AI viết 3 kịch bản Hook gây sốc hoặc tò mò nhất.</span>
                  </li>
                </ul>
              )}

              {activeStep === "03" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Tải từng phân cảnh cốt truyện nối liền mạch lạc.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Sử dụng prompt tiếng Anh siêu sâu cho Midjourney/Dreamina.</span>
                  </li>
                </ul>
              )}

              {activeStep === "04" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Lấy prompt sinh ra ở phần chia cảnh của Bước 2 để nạp vào AI.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Lưu tên ảnh đúng quy tắc phân cảnh: 1.1, 1.2, 1.3... và 4.1, 4.2... đặt dễ dựng.</span>
                  </li>
                </ul>
              )}

              {activeStep === "05" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Sử dụng ElevenLabs hoặc Vbee để có giọng đọc cuốn hút không đứt quãng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Khuyến nghị cấu hình giọng đọc có cảm xúc huyền bí, trầm sâu, giật gân.</span>
                  </li>
                </ul>
              )}

              {activeStep === "06" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Sắp xếp tệp tin thoại cùng ảnh đúng số thứ tự phân cảnh.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Sinh phụ đề tự động (Auto-Caption) to rõ, căn giữa tạo động lực thị giác.</span>
                  </li>
                </ul>
              )}

              {activeStep === "07" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Mô tả video chứa từ khóa chính ít nhất 5 lần cực kỳ tự nhiên.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Sao chép toàn bộ thẻ tag chuẩn hóa bám sát đối thủ nặng ký nhất.</span>
                  </li>
                </ul>
              )}

              {activeStep === "08" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Bình luận tạo tranh cãi kịch tính kéo dài thời gian lưu trữ trong trang.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Kích thích người xem thật nhảy vào thảo luận tranh cãi cùng phe.</span>
                  </li>
                </ul>
              )}

              {activeStep === "templates" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">•</span>
                    <span>Tổng hợp các câu lệnh xương sống của cao thủ YouTube 2026.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">•</span>
                    <span>Tùy biến nhanh tham số để dán vào Grok/ChatGPT làm việc độc lập.</span>
                  </li>
                </ul>
              )}

              {activeStep === "workflow" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Nắm trọn vẹn bức tranh quy trình 8 bước sản xuất video tự động từ A-Z.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Sao chép nhanh chóng cẩm nang để lưu trữ vào dự án cá nhân hoặc chia sẻ với đội ngũ.</span>
                  </li>
                </ul>
              )}

              {activeStep === "report" && (
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Phân tích cấu trúc vi mô chi tiết từng bước hoạt động của hệ thống.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Giám sát thời gian thực các biến số, dung lượng lưu trữ đệm và nhật ký Stderr/Stdout.</span>
                  </li>
                </ul>
              )}

            </div>

          </div>

          {/* KHÔNG GIAN DỮ LIỆU TƯƠNG TÁC (WORKSPACE CONTENT) */}
          <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-6">
            
            {/* ---------------- BƯỚC 00: CHỌN KEY CHO KÊNH ---------------- */}
            {activeStep === "00" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">CHỌN NGÁCH LÀM VIDEO (NICHE RESEARCH 2026)</h3>
                      <p className="text-xs text-slate-500">Tìm kiếm chủ đề thị trường tiềm năng dễ có view ngoại, tỷ lệ CPM RPM cao.</p>
                    </div>
                  </div>

                  {/* DANH SÁCH NGÁCH NGỢI Ý */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {SUGGESTED_NICHES.map((n) => (
                      <div 
                        key={n.category} 
                        onClick={() => setNicheCategory(n.category)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          nicheCategory === n.category 
                            ? "bg-red-50/50 border-red-500 shadow-xs" 
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-800">{n.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            n.hotness === "Rất Cao" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            🔥 {n.hotness}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{n.description}</p>
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{n.viewSource}</span>
                          <span className="text-slate-300">|</span>
                          <span className="italic text-slate-500">Style gợi ý: {n.suggestedStyles.substring(0, 30)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ĐIỀN THÔNG TIN TÙY CHỈNH */}
                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        Từ khóa bổ sung / Bối cảnh đặc thù (Không bắt buộc):
                        <span className="text-slate-400 font-normal">(Hãy nhập gì đó như "phương tây cổ đại, lịch sử Việt Nam, cổ tích grimm")</span>
                      </label>
                      <input 
                        type="text" 
                        value={customKeyword}
                        onChange={(e) => setCustomKeyword(e.target.value)}
                        placeholder="Ví dụ: Truyền thuyết quái vật đầm lầy, tra tấn trung cổ..."
                        className="w-full text-xs px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-800 font-mono"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleBrainstormNiche}
                        disabled={brainstormLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md active:scale-99"
                      >
                        {brainstormLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Đang nghiên cứu thị trường bằng AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Phân Tích & Brainstorm Ý Tưởng Kênh Chi Tiết
                          </>
                        )}
                      </button>

                      {brainstormLoading && (
                        <button
                          type="button"
                          onClick={() => handleCancelStep("brainstorm")}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                          <span>⏹️</span> Dừng
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* HIỂN THỊ KẾT QUẢ BRAINSTORM */}
                {brainstormData && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        CHIẾN LƯỢC KÊNH & PROFILE ĐỀ XUẤT 2026
                      </h4>
                      <span className="text-xs text-slate-400 italic">Cung cấp bởi Gemini AI</span>
                    </div>

                    {/* Khảo sát thị trường */}
                    <div className="space-y-1.5">
                      <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">📊 Đánh Giá & Quy Luật View Ngoại:</h5>
                      <p className="text-xs text-slate-600 bg-emerald-50/40 p-4 border border-emerald-100 rounded-xl leading-relaxed">
                        {brainstormData.marketInsight}
                      </p>
                    </div>

                    {/* Giải pháp đặt tên kênh */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">🎯 Gợi Ý Tên Kênh & Triển Khai:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {brainstormData.channelNameOptions?.map((item, index) => (
                          <div key={index} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 relative">
                            <span className="absolute top-1 right-2 text-[10px] font-mono font-bold text-slate-300">#0{index+1}</span>
                            <div className="font-extrabold text-xs text-red-600 mb-1 flex items-center gap-1">
                              {item.name}
                              <button 
                                onClick={() => triggerCopy(`cn-${index}`, item.name)}
                                className="text-slate-400 hover:text-slate-700 ml-1"
                              >
                                {copiedKey === `cn-${index}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">{item.concept}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Profile Mô tả & prompt hình vẽ vẽ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Bản mô tả kênh */}
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">📝 Mô Tả Kênh (Dán vào YouTube Studio):</span>
                          <button 
                            onClick={() => triggerCopy("desc", brainstormData.channelProfile?.description || "")}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold"
                          >
                            {copiedKey === "desc" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy Mô Tả
                          </button>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 leading-relaxed font-sans max-h-48 overflow-y-auto">
                          {brainstormData.channelProfile?.description}
                        </div>
                      </div>

                      {/* Prompts vẽ ảnh thương hiệu */}
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        <span className="text-xs font-bold text-slate-700 block">🎨 Visual Prompt Avatar & Banner:</span>
                        
                        <div className="space-y-2">
                          <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prompt Vẽ Avatar (Hình Vuông):</span>
                              <button 
                                onClick={() => triggerCopy("avp", brainstormData.channelProfile?.avatarPrompt || "")}
                                className="text-[10px] text-teal-600 hover:text-teal-800 font-bold"
                              >
                                {copiedKey === "avp" ? "Đã Copy" : "Copy Prompt"}
                              </button>
                            </div>
                            <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded max-h-16 overflow-y-auto">{brainstormData.channelProfile?.avatarPrompt}</p>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prompt Vẽ Banner (Ngang):</span>
                              <button 
                                onClick={() => triggerCopy("bnp", brainstormData.channelProfile?.bannerPrompt || "")}
                                className="text-[10px] text-teal-600 hover:text-teal-800 font-bold"
                              >
                                {copiedKey === "bnp" ? "Đã Copy" : "Copy Prompt"}
                              </button>
                            </div>
                            <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded max-h-16 overflow-y-auto">{brainstormData.channelProfile?.bannerPrompt}</p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Định hướng làm nội dung */}
                    <div className="bg-red-50/30 border border-red-100 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Đề Xuất Hướng Đi Cho 5 Video Đầu Sóng:
                      </span>
                      <ul className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed font-medium">
                        {brainstormData.contentDirectives?.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={() => setActiveStep("01")}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 tracking-tight active:scale-95 transition-all"
                      >
                        Tiến Hành Tạo Kịch Bản
                        <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

            {activeStep === "results" && (
              <OutputPreviewView
                projectDir={viewingProjectDir || projectDir}
                isRunning={isPlayingAutoPipeline}
                liveProgress={autoPipelineProgress}
                logs={autoPipelineLogs}
                seoData={seoData}
              />
            )}

            {activeStep === "seo" && (
              <div className="mx-auto w-full max-w-6xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div><h3 className="text-lg font-black text-slate-800">SEO, Thumbnail & Xuất bản video</h3><p className="mt-1 text-xs text-slate-500">Nơi tập trung tiêu đề, mô tả, từ khóa, preview thumbnail và nội dung hoàn chỉnh để đăng video.</p></div>
                {!seoData ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">Chưa có nội dung đăng tải. Hãy chạy bước SEO trước.</div> : <>
                  <section className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase text-amber-800">Tiêu đề chính</p><p className="mt-1 text-base font-black text-slate-900">{seoData.seoTitle}</p></div><button onClick={() => triggerCopy("publish-title", seoData.seoTitle)} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-black text-white">{copiedKey === "publish-title" ? "Đã sao chép" : "Sao chép"}</button></div></section>
                  <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-black text-slate-800">Các phương án tiêu đề</h4><button onClick={() => triggerCopy("publish-titles", [seoData.seoTitle, ...(seoData.titleOptions || [])].join("\n"))} className="text-xs font-bold text-indigo-600">Sao chép tất cả</button></div><div className="space-y-2">{[seoData.seoTitle, ...(seoData.titleOptions || [])].filter(Boolean).map((title, index) => <div key={`${title}-${index}`} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700"><span className="min-w-0 flex-1">{title}</span><button onClick={() => triggerCopy(`publish-title-${index}`, title)} className="shrink-0 font-bold text-indigo-600">Copy</button></div>)}</div></section><section className="rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-black text-slate-800">Từ khóa và thẻ</h4><button onClick={() => triggerCopy("publish-tags", [seoData.tags?.primaryKeyword, seoData.tags?.secondaryKeyword, seoData.tags?.channelTag, ...(seoData.tags?.competitorTags || [])].filter(Boolean).join(", "))} className="text-xs font-bold text-indigo-600">Sao chép</button></div><div className="flex flex-wrap gap-2">{[seoData.tags?.primaryKeyword, seoData.tags?.secondaryKeyword, seoData.tags?.channelTag, ...(seoData.tags?.competitorTags || [])].filter(Boolean).map(tag => <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">#{tag}</span>)}</div></section></div>
                  <section className="rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-black text-slate-800">Mô tả video</h4><button onClick={() => triggerCopy("publish-description", seoData.seoDescription)} className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-600">{copiedKey === "publish-description" ? "Đã sao chép" : "Sao chép mô tả"}</button></div><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">{seoData.seoDescription}</pre></section>
                  {(thumbnailPreviewUrl || seoData.thumbnailConcept) && <section className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-100 lg:grid-cols-[240px_minmax(0,1fr)]"><div className="rounded-xl border border-slate-700 bg-slate-900 p-2"><p className="mb-2 text-[10px] font-black uppercase text-amber-400">Preview thumbnail</p>{thumbnailPreviewUrl ? <img src={thumbnailPreviewUrl} alt="Thumbnail video" className="aspect-video w-full rounded-lg object-cover" /> : <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-600 text-center text-[11px] text-slate-400">Thumbnail sẽ hiện tại đây sau khi được tạo.</div>}</div>{seoData.thumbnailConcept && <div className="grid gap-3 md:grid-cols-3"><div><p className="text-[10px] font-black uppercase text-amber-400">Ý tưởng ảnh bìa</p><p className="mt-2 text-xs leading-relaxed">{seoData.thumbnailConcept.visualIdea}</p></div><div><p className="text-[10px] font-black uppercase text-amber-400">Chữ trên ảnh</p><p className="mt-2 text-sm font-black">{seoData.thumbnailConcept.thumbnailText}</p></div><div><div className="flex justify-between gap-2"><p className="text-[10px] font-black uppercase text-amber-400">Prompt ảnh bìa</p><button onClick={() => triggerCopy("publish-thumbnail", seoData.thumbnailConcept.imagePrompt)} className="text-[10px] font-bold text-teal-300">Copy</button></div><p className="mt-2 text-[11px] leading-relaxed text-slate-300">{seoData.thumbnailConcept.imagePrompt}</p></div></div>}</section>}
                  <section className="rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-black text-slate-800">Bình luận ghim / seeding</h4><button onClick={() => triggerCopy("publish-comments", (seoData.seedingComments || []).map(item => item.commentText).join("\n\n"))} className="text-xs font-bold text-indigo-600">Sao chép tất cả</button></div><div className="grid gap-2 md:grid-cols-2">{(seoData.seedingComments || []).map((item, index) => <div key={`${item.accountType}-${index}`} className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-black text-indigo-600">{item.accountType}</p><p className="mt-1 text-xs leading-relaxed text-slate-700">{item.commentText}</p></div>)}</div></section>
                </>}
              </div>
            )}

            {activeStep === "social-publisher" && (
              <TelegramAutomationScheduler
                onRunJob={(jobId) => { void claimAndRunScheduledJob(jobId); }}
                onResumeJob={openScheduledJobForResume}
                pipelineTelemetry={{
                  jobId: scheduledJobRef.current || undefined,
                  progress: autoPipelineProgress,
                  logs: autoPipelineLogs.slice(-12),
                  mediaCompleted: Object.keys(generatedImages || {}).length,
                  mediaTotal: pipelineExpectedPromptCount,
                }}
                onViewProject={async (completedProjectDir) => {
                  await handleProjectDirChange(completedProjectDir, true);
                  setViewingProjectDir(completedProjectDir);
                  setActiveStep("results");
                }}
                isPipelineRunning={isPlayingAutoPipeline}
              />
            )}

            {false && activeStep === "social-publisher" && (
              <div className="vidiflow-social-publisher mx-auto w-full max-w-6xl space-y-5">
                <section className="relative overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top_right,_#f0abfc_0%,_#7c3aed_36%,_#111827_82%)] p-7 text-white shadow-xl">
                  <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-300/25 blur-3xl" />
                  <div className="relative max-w-3xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black tracking-[.16em]">
                      <Sparkles className="h-3.5 w-3.5" /> COMING SOON
                    </span>
                    <h3 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                      Nhập nội dung từ Telegram, tạo video theo preset và tự đăng Facebook
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                      Gửi link video, kịch bản hoặc mô tả ý tưởng vào Telegram. VidiFlow sẽ dùng preset đã chọn để tạo video, chuẩn bị nội dung đăng và tự xuất bản lên Facebook theo lịch.
                    </p>
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                  {[
                    { step: "01", title: "Nhập từ Telegram", text: "Gửi link video, kịch bản hoặc mô tả kịch bản vào bot Telegram để tạo một yêu cầu mới.", icon: MessageSquare, tone: "bg-sky-50 text-sky-700 border-sky-200" },
                    { step: "02", title: "Tạo video theo preset", text: "Bot chọn preset đã cấu hình, tạo video, SEO và thumbnail theo đúng luồng VidiFlow.", icon: Video, tone: "bg-violet-50 text-violet-700 border-violet-200" },
                    { step: "03", title: "Lên lịch & đăng Facebook", text: "Duyệt kết quả, chọn thời điểm đăng rồi tự xuất bản video lên Facebook kèm nhật ký trạng thái.", icon: ArrowRight, tone: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <article key={item.step} className={`rounded-2xl border p-5 shadow-sm ${item.tone}`}>
                        <div className="flex items-center justify-between"><Icon className="h-6 w-6" /><span className="text-lg font-black opacity-40">{item.step}</span></div>
                        <h4 className="mt-5 text-sm font-black text-slate-900">{item.title}</h4>
                        <p className="mt-2 text-xs leading-5 text-slate-600">{item.text}</p>
                      </article>
                    );
                  })}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.18em] text-fuchsia-600">Đang phát triển</p>
                      <h4 className="mt-1 text-lg font-black text-slate-900">Facebook là nền tảng tự đăng đầu tiên</h4>
                      <p className="mt-2 text-sm text-slate-500">TikTok và YouTube đã được chuẩn bị trong thiết kế, sẽ mở ở các bản cập nhật tiếp theo sau khi hoàn thiện luồng Facebook.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span aria-label="Facebook" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-sm">
                        <img src="/brand/social/facebook.svg" alt="Facebook" className="h-6 w-6" />
                      </span>
                      <span aria-label="TikTok" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#080808] shadow-sm">
                        <img src="/brand/social/tiktok.svg" alt="TikTok" className="h-6 w-6" />
                      </span>
                      <span aria-label="YouTube" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff0033] text-white shadow-sm">
                        <img src="/brand/social/youtube.svg" alt="YouTube" className="h-7 w-7" />
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 p-5 text-center">
                    <p className="text-sm font-black text-violet-800">Tính năng đang được phát triển</p>
                    <p className="mt-1 text-xs text-violet-600">Phiên bản hiện tại chưa kết nối Telegram hay tài khoản Facebook, TikTok, YouTube và sẽ chưa tự đăng video.</p>
                  </div>
                </section>
              </div>
            )}

            {activeStep === "home" && (
              <div className="mx-auto max-w-6xl space-y-6">
                <section className="overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top_right,_#c084fc_0%,_#6d28d9_38%,_#111827_85%)] p-7 text-white shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-200">Bắt đầu nhanh</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Bạn muốn tạo video theo cách nào?</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">Chọn cách phù hợp với mức độ kiểm soát bạn cần. Tất cả đều sử dụng cùng một pipeline và kết quả dự án.</p>
                </section>
                <section className="grid gap-5 lg:grid-cols-3">
                  <button type="button" onClick={() => setActiveStep("presetpipeline")} className="group rounded-3xl border-2 border-fuchsia-300 bg-white p-6 text-left shadow-lg shadow-fuchsia-100 transition hover:-translate-y-1 hover:shadow-xl"><span className="inline-flex rounded-full bg-fuchsia-100 px-3 py-1 text-[10px] font-black text-fuchsia-700">DỄ DÙNG · KHUYẾN NGHỊ</span><Sparkles className="mt-6 h-9 w-9 text-fuchsia-600" /><h3 className="mt-4 text-xl font-black text-slate-900">Tạo nhanh theo Preset</h3><p className="mt-2 text-sm leading-6 text-slate-500">Chọn mục tiêu, Voice và Style; nhập nội dung, ảnh tham chiếu rồi tạo. Các thông số còn lại được preset tự thiết lập.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-fuchsia-700">Mở chế độ dễ dùng <ArrowRight className="h-4 w-4" /></span></button>
                  <button type="button" onClick={() => setActiveStep("autopipeline")} className="group rounded-3xl border border-indigo-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-400 hover:shadow-xl"><span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-black text-indigo-700">CHUYÊN SÂU</span><Sliders className="mt-6 h-9 w-9 text-indigo-600" /><h3 className="mt-4 text-xl font-black text-slate-900">Tạo tự động tùy chỉnh</h3><p className="mt-2 text-sm leading-6 text-slate-500">Điều khiển đầy đủ nội dung, nhân vật, media, Voice, SEO, phụ đề và render trên một luồng tự động.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-indigo-700">Mở toàn bộ thiết lập <ArrowRight className="h-4 w-4" /></span></button>
                  <button type="button" onClick={() => setActiveStep("manualpipeline")} className="group rounded-3xl border border-emerald-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl"><span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">KIỂM TRA TỪNG BƯỚC</span><CheckSquare className="mt-6 h-9 w-9 text-emerald-600" /><h3 className="mt-4 text-xl font-black text-slate-900">Tạo & Review từng bước</h3><p className="mt-2 text-sm leading-6 text-slate-500">Phù hợp khi cần kiểm tra kịch bản, prompt, media, Voice và SEO trước khi chuyển sang bước tiếp theo.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-emerald-700">Mở chế độ review <ArrowRight className="h-4 w-4" /></span></button>
                </section>
              </div>
            )}

            {activeStep === "projects" && (
              <div className="mx-auto w-full max-w-5xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Dự án đã chạy</h3>
                  <p className="mt-1 text-xs text-slate-500">Chỉ hiển thị các thư mục đã có video final. Mở lại sẽ nạp kết quả đúng từ thư mục đó, không dùng dữ liệu của dự án trước.</p>
                </div>
                {projectHistoryChecking && <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">Đang kiểm tra các video đã hoàn tất...</div>}
                {projectHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">Chưa có dự án nào được mở.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {projectHistory.map(project => (
                      <div key={project.path} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-800">{project.name}</p><p className="mt-1 break-all text-[11px] text-slate-500">{project.path}</p><p className="mt-2 text-[10px] font-medium text-slate-400">Mở gần nhất: {new Date(project.lastOpened).toLocaleString("vi-VN")}</p></div><FolderOpen className="h-5 w-5 shrink-0 text-violet-500" /></div>
                        <div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={() => { setViewingProjectDir(project.path); setActiveStep("results"); }} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-700">Xem kết quả</button><button type="button" onClick={async () => { await handleProjectDirChange(project.path, true); setActiveStep("manualpipeline"); }} className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-50">Tiếp tục sửa</button><button type="button" onClick={() => removeProjectFromHistory(project.path)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/>Xóa</button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeStep === "guide" && (
              <CustomerGuideView
                onStart={() => setActiveStep("autopipeline")}
                onResults={() => setActiveStep("results")}
              />
            )}

            {activeStep === "manualpipeline" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center font-bold flex-shrink-0"><CheckSquare className="w-5 h-5" /></div>
                  <div><h3 className="text-base font-bold text-slate-800">TẠO VIDEO TỪNG BƯỚC — 4 BƯỚC</h3><p className="text-xs text-slate-500 leading-relaxed mt-0.5">Nội dung → Phong cách → Media → Voice, SEO & xuất video. Chỉ hiển thị thiết lập của bước đang chọn để dễ kiểm tra.</p></div>
                </div>
                <AutomationControlCenter
                  configRevision={automationConfigRevision}
                  projectDir={projectDir} onProjectDirChange={handleProjectDirChange}
                  rawInput={rawTranscript} finalizedScript={standardizedScript}
                  setRawInput={setRawTranscript} onRequestInputReplacement={requestRawInputReplacement} setFinalizedScript={setStandardizedScript}
                  language={scriptLang} setLanguage={setScriptLang} imageStyle={imageStyle} setImageStyle={setImageStyle}
                  selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice}
                  thumbnailHasText={thumbHasText} setThumbnailHasText={setThumbHasText} thumbnailCustomText={thumbCustomText} setThumbnailCustomText={setThumbCustomText}
                  setRewriteScript={setRewriteScript} setRewriteLengthMode={setAutoRewriteLengthMode}
                  setRewriteTargetWords={setAutoRewriteTargetWords} setRewriteTargetMinutes={setAutoRewriteTargetMinutes}
                  setScenesCount={setScenesCount} setPromptsPerScene={setPromptsPerScene}
                  setUseDialogueSplit={setUseDialogueSplit} setDialogueGroupSize={setDialogueGroupSize}
                  setPromptsFocus={setPromptsFocus} setIsHighDensity={setIsHighDensity} setAutoHookStyle={setAutoHookStyle}
                  isRunning={isPlayingAutoPipeline} progress={autoPipelineProgress} logs={autoPipelineLogs}
                  onRun={() => handleRunAutoPipeline(true)} onRunStage={(stage) => handleRunAutoPipeline(true, stage)}
                  onRunVoiceOnly={handleRegenerateVoice} onRunSeoOnly={handleGenerateSEO}
                  onRunThumbnailOnly={handleRegenerateThumbnail}
                  voiceRegenerating={voiceGenerating} voiceRegenerateProgress={voiceRegenerateProgress}
                  seoRegenerating={seoLoading} seoRegenerateProgress={seoRegenerateProgress}
                  thumbnailRegenerating={thumbnailRegenerating} thumbnailRegenerateProgress={thumbnailRegenerateProgress}
                  onStop={autoPipelineAbort}
                  twoStage reviewReady={manualTwoStageReviewReady}
                  manualStage={manualWorkflowStage}
                  onEditPhaseOne={() => setManualTwoStageReviewReady(false)}
                  reviewScenes={storyboardData?.scenes || []}
                  reviewMedia={generatedImages}
                  reviewAudioUrl={generatedAudio}
                  reviewSeo={seoData}
                  reviewThumbnailUrl={thumbnailPreviewUrl}
                  onUpdatePrompt={handleUpdatePromptValue}
                  onRegenerateMedia={handleRegenerateManualMedia}
                  onReloadMedia={handleReloadProjectMedia}
                  regeneratingMediaKey={manualMediaRegenerating}
                  onBackStage={() => {
                    setManualWorkflowStage(previous => Math.max(1, previous - 1) as 1 | 2 | 3 | 4);
                    setManualTwoStageReviewReady(true);
                  }}
                  onSelectStage={(stage) => {
                    setManualWorkflowStage(stage);
                    setManualTwoStageReviewReady(true);
                  }}
                  stats={{
                    words: (standardizedScript || rawTranscript).trim().length,
                    scenes: storyboardData?.scenes?.length || 0,
                    media: Object.keys(generatedImages || {}).length,
                    totalMedia: pipelineExpectedPromptCount,
                  }}
                />
              </div>
            )}

            {false && activeStep === "manualpipeline" && (
              <div className="mx-auto w-full max-w-6xl space-y-6 rounded-2xl border border-violet-200 bg-white p-6 shadow-2xs">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><CheckSquare className="h-5 w-5" /></div>
                  <div><h3 className="text-base font-black text-slate-800">TẠO VIDEO TỪNG BƯỚC</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">Bạn tự kiểm tra, sửa và phê duyệt đầu ra của từng công đoạn trước khi sang bước tiếp theo. Không có bước nào chạy tự động.</p></div>
                </div>
                <section className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
                  <div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wide text-violet-700">Phần 1</p><h4 className="mt-1 text-base font-black text-slate-900">Chuẩn bị nội dung</h4><p className="mt-1 text-xs text-slate-500">Kiểm tra toàn bộ kịch bản và prompt trước khi khóa nội dung để sản xuất.</p></div>{manualContentApproved && <button type="button" onClick={() => setManualContentApproved(false)} className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-700">Mở khóa để sửa</button>}</div>
                  <fieldset disabled={manualContentApproved} className="space-y-4 disabled:opacity-60"><div><label className="text-sm font-black text-slate-800">Kịch bản</label><textarea value={rawTranscript} onChange={event => setRawTranscript(event.target.value)} rows={7} placeholder="Dán kịch bản hoặc transcript vào đây..." className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 outline-none focus:border-violet-400"/><div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={!rawTranscript.trim() || processScriptLoading} onClick={() => handleProcessScript(false)} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50">{processScriptLoading ? 'Đang chuẩn hóa...' : 'Chuẩn hóa kịch bản'}</button>{standardizedScript && <span className="self-center text-[11px] font-bold text-emerald-700">{standardizedScript.trim().split(/\s+/).filter(Boolean).length} từ đã sẵn sàng để đọc voice</span>}</div>{standardizedScript && <textarea value={standardizedScript} onChange={event => setStandardizedScript(event.target.value)} rows={7} className="mt-3 w-full rounded-xl border border-emerald-200 bg-white p-3 text-xs leading-relaxed text-slate-700 outline-none"/>}</div>
                    <div className="border-t border-violet-100 pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><label className="text-sm font-black text-slate-800">Prompt ảnh / video</label><p className="mt-1 text-[11px] text-slate-500">Tạo, xem và sửa trực tiếp prompt của từng cảnh.</p></div><button type="button" disabled={!standardizedScript.trim() || storyboardLoading} onClick={handleGenerateStoryboard} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50">{storyboardLoading ? 'Đang tạo prompt...' : 'Tạo / làm mới prompt'}</button></div>{storyboardData?.scenes?.length ? <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">{storyboardData.scenes.map((scene, sceneIndex) => <div key={`${scene.sceneNumber}-${sceneIndex}`} className="rounded-xl border border-slate-200 bg-white p-3"><p className="mb-2 text-[11px] font-black text-violet-700">Cảnh {scene.sceneNumber} · {scene.text}</p>{scene.imagePrompts.map((prompt, promptIndex) => <textarea key={prompt.code} value={prompt.englishPrompt} onChange={event => handleUpdatePromptValue(sceneIndex, promptIndex, 'englishPrompt', event.target.value)} rows={3} className="mb-2 w-full rounded-lg border border-slate-200 p-2 font-mono text-[11px] leading-relaxed text-slate-700 outline-none focus:border-violet-400"/>)}</div>)}</div> : <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">Chưa có prompt. Hãy chuẩn hóa kịch bản rồi tạo prompt.</div>}</div></fieldset>
                  <button type="button" disabled={!standardizedScript.trim() || !storyboardData?.scenes?.length || manualContentApproved} onClick={() => setManualContentApproved(true)} className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{manualContentApproved ? '✓ Nội dung & prompt đã chốt' : 'Chốt nội dung & prompt'}</button>
                </section>
                <section className={`rounded-2xl border p-5 ${manualContentApproved ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50 opacity-60'}`}><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wide text-emerald-700">Phần 2</p><h4 className="mt-1 text-base font-black text-slate-900">Sản xuất video</h4><p className="mt-1 text-xs text-slate-500">Tạo/tải voice, tạo media, SEO và render trên đúng nội dung đã chốt.</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-black ${manualContentApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{manualContentApproved ? 'ĐÃ MỞ' : 'CHỜ CHỐT NỘI DUNG'}</span></div>{manualContentApproved ? <div className="space-y-6"><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-emerald-200 bg-white p-4"><h5 className="text-sm font-black text-slate-800">Voice</h5><p className="mt-1 text-[11px] text-slate-500">Tạo voice từ kịch bản đã chốt hoặc tải voice đã tạo bên ngoài trong tab Giọng đọc của Trình tự động.</p><button type="button" disabled={!standardizedScript.trim()} onClick={handleGenerateVoice} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50">Tạo voice từ nội dung đã chốt</button>{generatedAudio && <audio controls src={generatedAudio} className="mt-3 h-9 w-full"/>}</div><div className="rounded-xl border border-emerald-200 bg-white p-4"><h5 className="text-sm font-black text-slate-800">Tiêu đề & SEO</h5><p className="mt-1 text-[11px] text-slate-500">Tạo tiêu đề, mô tả và bộ nội dung đăng tải từ kịch bản đã chốt.</p><button type="button" disabled={!standardizedScript.trim()} onClick={handleGenerateSEO} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50">Tạo tiêu đề & SEO</button>{seoData && <p className="mt-3 text-xs font-bold text-emerald-700">Đã có SEO: {seoData.seoTitle}</p>}</div></div><div className="rounded-xl border border-emerald-200 bg-white p-4"><h5 className="text-sm font-black text-slate-800">Tạo ảnh / video từ prompt đã chốt</h5><PipelineStep1 projectDir={projectDir} storyboardData={storyboardData} imageStyle={imageStyle} telegramToken={telegramToken} telegramChatId={telegramChatId} generatedImages={generatedImages} setGeneratedImages={setGeneratedImages} onComplete={() => setStep4Done(true)} /></div><div className="rounded-xl border border-emerald-200 bg-white p-4"><h5 className="text-sm font-black text-slate-800">Render video</h5><AudioTimelinePro projectDir={projectDir} storyboardData={storyboardData} seoTitle={seoData?.seoTitle} getAutoScriptPath={getRawScriptPath} onComplete={() => setStep6Done(true)} /></div></div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">Hoàn thiện kịch bản và prompt ở Phần 1, sau đó bấm <b>Chốt nội dung & prompt</b> để mở phần sản xuất.</div>}</section>
              </div>
            )}

            {/* ---------------- CHUỖI TỰ ĐỘNG HÓA LIÊN HOÀN (AUTO PIPELINE SUITE) ---------------- */}
            {activeStep === "presetpipeline" && (
              <div className="mx-auto w-full max-w-7xl space-y-6">
                <>
                  <PresetAutomationHub disabled={isPlayingAutoPipeline} onApply={applyAutomationPreset} selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} imageStyle={imageStyle} setImageStyle={setImageStyle} language={scriptLang} />
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 border-b border-slate-100 pb-4">
                      <h3 className="text-base font-black text-slate-900">Dữ liệu dự án & thiết lập cần thiết</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Chỉ cần nhập kịch bản, mô tả hoặc link; chọn thư mục và ảnh tham chiếu/hồ sơ nhân vật nếu cần. Toàn bộ thiết lập kỹ thuật từ nội dung đến render đã được preset cấu hình sẵn.</p>
                    </div>
                    <AutomationControlCenter
                      presetMode
                      configRevision={automationConfigRevision}
                      projectDir={projectDir} onProjectDirChange={handleProjectDirChange}
                      rawInput={rawTranscript} finalizedScript={standardizedScript}
                      setRawInput={setRawTranscript} onRequestInputReplacement={requestRawInputReplacement} setFinalizedScript={setStandardizedScript}
                      language={scriptLang} setLanguage={setScriptLang} imageStyle={imageStyle} setImageStyle={setImageStyle}
                      selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice}
                      thumbnailHasText={thumbHasText} setThumbnailHasText={setThumbHasText} thumbnailCustomText={thumbCustomText} setThumbnailCustomText={setThumbCustomText}
                      setRewriteScript={setRewriteScript} setRewriteLengthMode={setAutoRewriteLengthMode}
                      setRewriteTargetWords={setAutoRewriteTargetWords} setRewriteTargetMinutes={setAutoRewriteTargetMinutes}
                      setScenesCount={setScenesCount} setPromptsPerScene={setPromptsPerScene}
                      setUseDialogueSplit={setUseDialogueSplit} setDialogueGroupSize={setDialogueGroupSize}
                      setPromptsFocus={setPromptsFocus} setIsHighDensity={setIsHighDensity} setAutoHookStyle={setAutoHookStyle}
                      isRunning={isPlayingAutoPipeline} progress={autoPipelineProgress} logs={autoPipelineLogs}
                      onRun={handleRunAutoPipeline} onStop={autoPipelineAbort}
                      reviewScenes={storyboardData?.scenes || []} reviewMedia={generatedImages}
                      reviewAudioUrl={generatedAudio} reviewSeo={seoData} reviewThumbnailUrl={thumbnailPreviewUrl}
                      onUpdatePrompt={handleUpdatePromptValue} onRegenerateMedia={handleRegenerateManualMedia}
                      onReloadMedia={handleReloadProjectMedia} regeneratingMediaKey={manualMediaRegenerating}
                      stats={{ words: (standardizedScript || rawTranscript).trim().length, scenes: storyboardData?.scenes?.length || 0, media: Object.keys(generatedImages || {}).length, totalMedia: pipelineExpectedPromptCount }}
                    />
                  </div>
                </>
              </div>
            )}

            {activeStep === "autopipeline" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-650 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">TRÌNH TẠO VIDEO TỰ ĐỘNG</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Thiết lập nội dung, hình ảnh, giọng đọc và video đầu ra theo nhu cầu. Sau đó bấm tạo để nhận video hoàn chỉnh.
                    </p>
                  </div>
                </div>

                {licensePlan === "starter" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <p className="text-base font-black text-amber-900">Tạo video tự động thuộc Gói Pro</p>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-800">Gói Khởi đầu vẫn dùng đầy đủ luồng Tạo video từng bước. Hãy chuyển sang tab đó để tạo và kiểm tra từng phần.</p>
                    <button type="button" onClick={() => setActiveStep("manualpipeline")} className="mt-5 rounded-xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-200">Mở Tạo video từng bước</button>
                  </div>
                ) : <AutomationControlCenter
                  configRevision={automationConfigRevision}
                  projectDir={projectDir}
                  onProjectDirChange={handleProjectDirChange}
                  rawInput={rawTranscript}
                  finalizedScript={standardizedScript}
                  setRawInput={setRawTranscript}
                  onRequestInputReplacement={requestRawInputReplacement}
                  setFinalizedScript={setStandardizedScript}
                  language={scriptLang}
                  setLanguage={setScriptLang}
                  imageStyle={imageStyle}
                  setImageStyle={setImageStyle}
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                  thumbnailHasText={thumbHasText}
                  setThumbnailHasText={setThumbHasText}
                  thumbnailCustomText={thumbCustomText}
                  setThumbnailCustomText={setThumbCustomText}
                  setRewriteScript={setRewriteScript}
                  setRewriteLengthMode={setAutoRewriteLengthMode}
                  setRewriteTargetWords={setAutoRewriteTargetWords}
                  setRewriteTargetMinutes={setAutoRewriteTargetMinutes}
                  setScenesCount={setScenesCount}
                  setPromptsPerScene={setPromptsPerScene}
                  setUseDialogueSplit={setUseDialogueSplit}
                  setDialogueGroupSize={setDialogueGroupSize}
                  setPromptsFocus={setPromptsFocus}
                  setIsHighDensity={setIsHighDensity}
                  setAutoHookStyle={setAutoHookStyle}
                  isRunning={isPlayingAutoPipeline}
                  progress={autoPipelineProgress}
                  logs={autoPipelineLogs}
                  onRun={handleRunAutoPipeline}
                  onStop={autoPipelineAbort}
                  reviewScenes={storyboardData?.scenes || []}
                  reviewMedia={generatedImages}
                  reviewAudioUrl={generatedAudio}
                  reviewSeo={seoData}
                  onUpdatePrompt={handleUpdatePromptValue}
                  onRegenerateMedia={handleRegenerateManualMedia}
                  onReloadMedia={handleReloadProjectMedia}
                  regeneratingMediaKey={manualMediaRegenerating}
                  stats={{
                    words: (standardizedScript || rawTranscript).trim().length,
                    scenes: storyboardData?.scenes?.length || 0,
                    media: Object.keys(generatedImages || {}).length,
                    totalMedia: pipelineExpectedPromptCount,
                  }}
                />}

                <div className="hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 space-y-4">
                  <div className="rounded-xl border border-indigo-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-800">NỘI DUNG ĐẦU VÀO</h4>
                        <p className="text-[11px] text-slate-500 mt-1">Dán kịch bản hoặc transcript tại đây. Các bước nội bộ sẽ tự xử lý tuần tự ở chế độ nền.</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">1 trang duy nhất</span>
                    </div>
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={projectDir}
                        onChange={(event) => setProjectDir(event.target.value)}
                        onBlur={() => handleProjectDirChange(projectDir)}
                        placeholder="Chọn thư mục dự án để lưu toàn bộ kết quả..."
                        disabled={isPlayingAutoPipeline}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        disabled={isPlayingAutoPipeline}
                        onClick={async () => {
                          const response = await fetch("/api/dialog/pick?mode=dir&title=Ch%E1%BB%8Dn%20Th%C6%B0%20M%E1%BB%A5c%20D%E1%BB%B1%20%C3%81n");
                          const data = await response.json();
                          if (data.success && data.path) await handleProjectDirChange(data.path);
                          else if (data.error) window.alert(data.error);
                        }}
                        className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Chọn thư mục
                      </button>
                    </div>
                    <textarea
                      value={rawTranscript}
                      onChange={(event) => setRawTranscript(event.target.value)}
                      placeholder="Dán kịch bản / transcript vào đây để bắt đầu..."
                      rows={6}
                      disabled={isPlayingAutoPipeline}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">BẢNG ĐIỀU KHIỂN SẢN XUẤT TỪ ĐẦU ĐẾN CUỐI</h4>
                      <p className="text-xs text-slate-500 mt-1">Theo dõi dữ liệu, mở cấu hình và xem kết quả của từng công đoạn tại một nơi.</p>
                    </div>
                    <div className="text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-xl px-3 py-2">
                      Dự án: {projectDir ? projectDir.split(/[\\/]/).filter(Boolean).pop() : "Chưa chọn"}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {([
                      ["01", "1", "Chuẩn hóa kịch bản", !!standardizedScript],
                      ["02", "2", "Viết Hook giữ chân", !!chosenHookText],
                      ["03", "3", "Chia cảnh & prompt", !!storyboardData?.scenes?.length],
                      ["04_image", "4", "Tạo ảnh / video", Object.keys(generatedImages || {}).length > 0],
                      ["04_voice", "5", "Tạo voice", !!generatedAudio],
                      ["07", "6", "SEO & tên xuất", !!seoData],
                      ["05_audio", "7", "Cắt ghép & render", !!step6Done],
                    ] as Array<[string, string, string, boolean]>).map(([stepId, number, label, done]) => (
                      <div key={stepId} className="text-left rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">{number}</span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{done ? "Đã có dữ liệu" : "Cần thiết lập"}</span>
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-700">{label}</div>
                        <div className="mt-1 text-[10px] text-indigo-600 font-semibold">Công đoạn nội bộ chạy nền</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-[10px] uppercase tracking-wider font-black text-slate-500 mb-2">Preview dữ liệu hiện tại</div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-slate-50 p-2"><strong className="block text-lg text-indigo-700">{standardizedScript ? standardizedScript.trim().split(/\s+/).length : 0}</strong><span className="text-[10px] text-slate-500">Từ kịch bản</span></div>
                        <div className="rounded-lg bg-slate-50 p-2"><strong className="block text-lg text-indigo-700">{storyboardData?.scenes?.length || 0}</strong><span className="text-[10px] text-slate-500">Phân cảnh</span></div>
                        <div className="rounded-lg bg-slate-50 p-2"><strong className="block text-lg text-indigo-700">{Object.keys(generatedImages || {}).length}</strong><span className="text-[10px] text-slate-500">Media đã tạo</span></div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-center">
                      <span className="text-[10px] uppercase tracking-wider font-black text-slate-500">Chế độ vận hành</span>
                      <span className="text-xs font-bold text-slate-700 mt-2">Khách hàng chỉ thao tác tại đây. Bảy công đoạn được theo dõi như các tiến trình nội bộ.</span>
                    </div>
                  </div>
                </div>

                <div className="hidden grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cột Trái: Cấu hình quy trình và Telegram */}
                  <div className="space-y-5">
                    {/* Panel 1: Tích chọn các bước muốn chạy */}
                    <div className="hidden bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        1. LỰA CHỌN CÁC PHÂN ĐOẠN MUỐN CHẠY LOẠT:
                      </h4>
                      <div className="space-y-3 pl-1">
                        <label className="flex items-start gap-3 text-xs font-bold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoSteps.step1}
                            onChange={(e) => setAutoSteps({ ...autoSteps, step1: e.target.checked })}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-4 h-4"
                          />
                          <div>
                            <span className="block">Bước 1: Tự Động Chuẩn Hóa Kịch Bản từ Transcript</span>
                            <span className="block text-[10px] text-slate-400 font-normal">Sắp xếp, dọn sạch mốc thời gian rườm rà, đặt dấu chấm câu mượt mà bằng AI.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 text-xs font-bold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoSteps.step2}
                            onChange={(e) => setAutoSteps({ ...autoSteps, step2: e.target.checked })}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-4 h-4"
                          />
                          <div>
                            <span className="block">Bước 2: Viết Lại Hook Giữ Chân Bằng AI</span>
                            <span className="block text-[10px] text-slate-400 font-normal">Tự động cải biến 3 câu đầu kịch bản để thu hút giữ chân người xem tối đa.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 text-xs font-bold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoSteps.step3}
                            onChange={(e) => setAutoSteps({ ...autoSteps, step3: e.target.checked })}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-4 h-4"
                          />
                          <div>
                            <span className="block">Bước 3: Tự Động Chia Phân Cảnh & Camera Prompts</span>
                            <span className="block text-[10px] text-slate-400 font-normal">Phân tích kịch bản mới, chia cảnh thông minh và sinh prompt tiếng Anh cho từng cảnh.</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Panel 2: Lựa chọn trước phong cách Hook cho viết hàng loạt */}
                    {autoSteps.step2 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          🎁 CẤU HÌNH PHONG CÁCH HOOK MONG MUỐN:
                        </h4>
                        <div className="space-y-1">
                          <select
                            value={autoHookStyle}
                            onChange={(e) => setAutoHookStyle(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="shocking">🍿 Phong cách Gây Sốc / Sổ Sàng (Tỉ lệ giữ chân cao)</option>
                            <option value="question">❓ Phong cách Đặt Câu Hỏi Nghi Vấn / Tò Mò</option>
                            <option value="warning">⚠️ Phong cách Cảnh Báo Nguy Hiểm / Chết Chóc</option>
                            <option value="benefit">💎 Phong cách Hứa Hẹn Giá Trị Thực Tế</option>
                          </select>
                          <p className="text-[10px] text-slate-400 font-medium pt-1">
                            💡 Khi quy trình tự động quét qua Bước 2, AI sẽ lọc trong các tuỳ chọn và áp dụng chuẩn xác nhất phong cách Hook bạn đã định sẵn!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Panel 3: Nhập thông tin Telegram Bot */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                        ✈️ CẤU HÌNH BẮN THÔNG BÁO VỀ TELEGRAM KHI XONG:
                      </h4>
                      <p className="text-[10px] text-slate-500 pl-0.5 leading-relaxed">
                        Hệ thống tự động gửi tin nhắn báo cáo chi tiết về Telegram (Tên dự án, trạng thái các bước, tổng số chữ kịch bản, số lượng ảnh kịch bản và thời gian dự kiến).
                      </p>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Telegram Bot Token:</label>
                          <input
                            type="text"
                            value={telegramToken}
                            onChange={(e) => setTelegramToken(e.target.value)}
                            placeholder="Ví dụ: 5391512419:AAEfD7_qD-..."
                            className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Telegram Chat ID (Cá nhân hoặc Nhóm):</label>
                          <input
                            type="text"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            placeholder="Ví dụ: 902187654 hoặc -10012345678"
                            className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Tên Tool gửi tin nhắn (Mặc định hiển thị):</label>
                          <input
                            type="text"
                            value={telegramToolName}
                            onChange={(e) => setTelegramToolName(e.target.value)}
                            placeholder="🚀 CapCut Fast Video Creator Studio VIP"
                            className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600"
                          />
                        </div>
                      </div>

                      {telegramToken && telegramChatId && (
                        <button
                          onClick={async () => {
                            const ok = await sendTelegramNotification(`🛎️ <b>[Test Connection]</b>\nĐã kết nối thành công với Telegram của bạn từ tool <b>${telegramToolName}</b>! Chúc mừng! 🎉`);
                            if (ok) {
                              alert("Kiểm tra tin nhắn ở Telegram ngay! Đã gửi thành công.");
                            } else {
                              alert("Gửi thử thất bại. Vui lòng kiểm tra lại Bot Token hoặc Chat ID!");
                            }
                          }}
                          className="w-full mt-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black py-2 rounded-xl transition-colors cursor-pointer text-center block uppercase tracking-wide"
                        >
                          🧪 Bắn tin nhắn test thử ngay lập tức
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cột Phải: Logs và Trạng thái chạy */}
                  <div className="space-y-4 flex flex-col justify-between">
                    
                    {/* Bảng điều khiển kích hoạt chạy */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md space-y-4 flex-shrink-0">
                      <div>
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-250 font-black px-2.5 py-1 rounded-full uppercase tracking-wider block w-max mb-1.5">
                          TRẠNG THÁI SẴN SÀNG
                        </span>
                        <h4 className="text-sm font-black tracking-tight uppercase">Chuỗi sản xuất tự động hàng loạt</h4>
                        <p className="text-[11px] text-slate-300 leading-normal mt-1">
                          Vui lòng kiểm tra kỹ kịch bản gốc và cấu hình các bước trước khi bấm nút kích hoạt quy trình.
                        </p>
                      </div>

                      {/* Tiến trình chạy log */}
                      {isPlayingAutoPipeline && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-indigo-200">
                            <span>Đang băm cắt sản xuất tự động...</span>
                            <span>{autoPipelineProgress}%</span>
                          </div>
                          <div className="w-full bg-indigo-950/60 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 animate-pulse"
                              style={{ width: `${autoPipelineProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-1.5 rounded-xl border border-indigo-700/70 bg-indigo-950/40 p-3 text-[11px]">
                        {([
                          ["step1", "Chuẩn hóa kịch bản"],
                          ["step2", "Viết lại Hook"],
                          ["step3", "Chia cảnh & prompts"],
                        ] as const).map(([step, label]) => {
                          const status = autoStepStatus[step];
                          const labelByStatus = { pending: "Chưa chạy", running: "Đang chạy", completed: "Hoàn thành", skipped: "Bỏ qua", failed: "Lỗi", stopped: "Đã dừng" } as const;
                          const dotByStatus = { pending: "bg-slate-500", running: "bg-amber-400 animate-pulse", completed: "bg-emerald-400", skipped: "bg-slate-500", failed: "bg-rose-400", stopped: "bg-orange-400" } as const;
                          return <div key={step} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-200"><i className={`h-2 w-2 rounded-full ${dotByStatus[status]}`} />{label}</span><span className="font-bold text-indigo-100">{labelByStatus[status]}</span></div>;
                        })}
                      </div>

                      <div className="flex gap-2 w-full">
                        <button
                          onClick={handleRunAutoPipeline}
                          disabled={isPlayingAutoPipeline}
                          className={`flex-1 py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 tracking-wide active:scale-95 transition-all text-sm shadow-md cursor-pointer ${
                            isPlayingAutoPipeline 
                              ? "bg-indigo-800 text-indigo-250 cursor-not-allowed" 
                              : "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg hover:shadow-red-500/20"
                          }`}
                        >
                          {isPlayingAutoPipeline ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              HỆ THỐNG ĐANG LIÊN HOÀN CHẠY LOẠT...
                            </>
                          ) : (
                            <>
                              <Flame className="w-5 h-5 text-yellow-300" />
                              KÍCH HOẠT QUY TRÌNH LIÊN HOÀN (RUN AUTO-PIPELINE)
                            </>
                          )}
                        </button>

                        {isPlayingAutoPipeline && (
                          <button
                            type="button"
                            onClick={() => handleCancelStep("auto")}
                            className="bg-slate-900 border border-indigo-700 text-white font-extrabold px-5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-950 active:scale-95 transition-all"
                          >
                            <span>⏹️</span> DỪNG
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Màn hình Terminal Log rực rỡ */}
                    <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-[10.5px] leading-relaxed flex flex-col justify-between min-h-[300px] shadow-sm">
                      <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                        <div className="text-slate-500 border-b border-indigo-950 pb-1 flex justify-between font-bold">
                          <span>CONSOLE LOG (VẬN HÀNH THỜI GIAN THỰC)</span>
                          <span className="text-[9px] bg-slate-900 border border-slate-800 px-1 rounded">2026 UTC</span>
                        </div>
                        {autoPipelineLogs.length === 0 ? (
                          <p className="text-slate-600 italic py-2">Chưa có bản ghi hoạt động. Nhấp kích hoạt để xem quá trình xử lý hàng loạt...</p>
                        ) : (
                          autoPipelineLogs.map((log, idx) => (
                            <p 
                              key={idx} 
                              className={
                                log.includes("❌") ? "text-rose-400 font-bold" :
                                log.includes("✅") ? "text-emerald-400 font-bold" :
                                log.includes("⚠️") ? "text-yellow-400 font-bold" :
                                log.includes("▶") ? "text-indigo-300 font-semibold" : "text-slate-300"
                              }
                            >
                              {log}
                            </p>
                          ))
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500 pt-2 border-t border-indigo-950 flex justify-between">
                        <span>Xử lý bằng Google Gemini Pro model</span>
                        <span>Trạng thái: {isPlayingAutoPipeline ? "BUSY" : "READY"}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ---------------- BƯỚC 01: CHUẨN HÓA KỊCH BẢN ---------------- */}
            {activeStep === "01" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">BƯỚC 1: CHUẨN HÓA KỊCH BẢN</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Dán transcript thô đã sao chép từ Youtube (Youtube Summary hoặc phụ đề tự động). AI sẽ giúp dọn dẹp các mốc thời gian vướng bận như (00:01), sửa từ ngắt quãng, chấm câu chuẩn chỉnh để nạp voice mượt mà nhất.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                  <p className="mb-2 text-[11px] font-black uppercase text-slate-700">Cách xử lý kịch bản</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => { setPreserveOriginalScript(true); setRewriteScript(false); }} className={`rounded-lg border px-4 py-3 text-left text-xs font-bold transition ${preserveOriginalScript ? "border-indigo-500 bg-white text-indigo-700 ring-2 ring-indigo-100" : "border-slate-200 bg-white text-slate-600"}`}>
                      Giữ nguyên 100% kịch bản gốc
                      <span className="mt-1 block text-[10px] font-medium text-slate-500">Không gọi AI, không dịch, không sửa câu chữ.</span>
                    </button>
                    <button type="button" onClick={() => { setPreserveOriginalScript(false); setRewriteScript(true); }} className={`rounded-lg border px-4 py-3 text-left text-xs font-bold transition ${!preserveOriginalScript ? "border-rose-500 bg-white text-rose-700 ring-2 ring-rose-100" : "border-slate-200 bg-white text-slate-600"}`}>
                      Viết lại bằng AI
                      <span className="mt-1 block text-[10px] font-medium text-slate-500">Cho phép AI thay đổi cách diễn đạt theo thiết lập.</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cột Trái dán Transcript */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">1. Nhập Kịch Bản Thô:</label>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setScriptImportMode("upload")}
                          className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all ${
                            scriptImportMode === "upload" 
                              ? "bg-white text-red-650 shadow-xs" 
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          📁 Tải tệp lên (Dưới 30MB)
                        </button>
                        <button
                          type="button"
                          onClick={() => setScriptImportMode("social")}
                          className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all ${
                            scriptImportMode === "social" 
                              ? "bg-white text-red-650 shadow-xs" 
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          🔗 Dán Link MXH (Tiktok/FB/IG)
                        </button>
                      </div>
                    </div>

                    {scriptImportMode === "upload" ? (
                      /* Khu vực tải Video/Audio lên để tự động bóc tách kịch bản */
                      <div className="border-2 border-dashed border-red-200 hover:border-red-400 bg-red-50/10 hover:bg-red-50/30 rounded-xl p-4 transition-all relative flex flex-col items-center justify-center text-center">
                        <input
                          type="file"
                          accept="video/*,audio/*"
                          onChange={handleMediaUploadAndTranscribe}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={transcribeLoading || processScriptLoading}
                        />
                        {transcribeLoading ? (
                          <div className="space-y-2 flex flex-col items-center justify-center">
                            <span className="w-5 h-5 border-2 border-red-650 border-t-transparent rounded-full animate-spin"></span>
                            <span className="text-[11px] font-bold text-red-650 animate-pulse">
                              Gemini AI đang lắng nghe và tự động trích xuất kịch bản...
                            </span>
                            {uploadedFileName && (
                              <span className="text-[10px] text-slate-500 font-mono">Đang xử lý: {uploadedFileName}</span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1.5 text-red-650">
                              <Upload className="w-4 h-4" />
                              <span className="text-xs font-black uppercase tracking-wide">
                                Trích xuất kịch bản từ Video hoặc Audio ngắn
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Kéo thả hoặc click để tải lên tệp tin video/âm thanh cục bộ (tối đa 30MB)
                            </p>
                            {uploadedFileName && !transcribeLoading && (
                              <p className="text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded inline-block">
                                🎉 Đã hoàn tất bóc kịch bản tệp: {uploadedFileName}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Khu vực nhập liên kết MXH để tự động tải về và bóc tách kịch bản */
                      <div className="border border-red-100 bg-red-50/10 rounded-xl p-4 transition-all space-y-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-red-650 flex items-center gap-1">
                            🚀 TRÌNH BÓC TÁCH VIDEO MẠNG XÃ HỘI SIÊU TỐC
                          </span>
                          <p className="text-[10px] text-slate-500 leading-relaxed text-left">
                            Nhập liên kết video từ TikTok, Facebook Reels hoặc YouTube Shorts. Hệ thống sẽ tự động tải luồng âm thanh siêu nhẹ, giải nén và bóc kịch bản tự động trong 1 nốt nhạc!
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={socialUrl}
                            onChange={(e) => setSocialUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && socialUrl.trim() && !socialTranscribeLoading) {
                                handleSocialTranscribe();
                              }
                            }}
                            placeholder="Dán link YouTube, TikTok hoặc Facebook..."
                            className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            disabled={socialTranscribeLoading}
                          />
                          <button
                            type="button"
                            onClick={() => handleSocialTranscribe()}
                            disabled={socialTranscribeLoading || !socialUrl.trim()}
                            className="bg-red-650 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed shrink-0"
                          >
                            {socialTranscribeLoading ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                                <span>ĐANG BÓC...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>BÓC KỊCH BẢN</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="flex bg-slate-50 border-b border-slate-200 p-1 gap-1">
                        <button type="button" onClick={() => setScriptInputKind("transcript")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${scriptInputKind === "transcript" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"}`}>Dán kịch bản / Transcript</button>
                        <button type="button" onClick={() => setScriptInputKind("idea")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${scriptInputKind === "idea" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"}`}>Mô tả để AI tự viết</button>
                      </div>
                      {scriptInputKind === "transcript" ? (
                        <textarea value={rawTranscript} onChange={(e) => setRawTranscript(e.target.value)} onPaste={handlePasteRawTranscript} placeholder="Dán bản phụ đề Youtube thô hoặc liên kết video MXH tại đây..." rows={12} className="w-full text-xs p-4 bg-slate-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono leading-relaxed" />
                      ) : (
                        <div className="p-4 space-y-3 bg-slate-50">
                          <textarea value={scriptIdea} onChange={(e) => setScriptIdea(e.target.value)} placeholder="Mô tả chủ đề, nhân vật, mạch nội dung, phong cách kể chuyện, thông điệp và đối tượng người xem..." rows={7} className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none leading-relaxed" />
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select value={ideaLengthMode} onChange={(e) => setIdeaLengthMode(e.target.value as "characters" | "duration")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                              <option value="duration">Theo thời lượng video</option><option value="characters">Theo số ký tự</option>
                            </select>
                            {ideaLengthMode === "duration" ? <div className="relative"><input type="number" min="0.25" step="0.25" value={ideaTargetMinutes} onChange={(e) => setIdeaTargetMinutes(Number(e.target.value))} placeholder="Phút" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-12 text-xs" /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-500">phút</span></div> : <input type="number" min="300" value={ideaTargetCharacters} onChange={(e) => setIdeaTargetCharacters(Number(e.target.value))} placeholder="Số ký tự" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" />}
                            <button type="button" onClick={handleWriteScriptFromIdea} disabled={ideaWriting || !scriptIdea.trim()} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white disabled:bg-slate-300">{ideaWriting ? "Đang viết..." : "AI VIẾT KỊCH BẢN"}</button>
                          </div>
                          <p className="text-[10px] text-slate-500">{ideaLengthMode === "duration" ? "Nhập số phút video mong muốn; hệ thống tự quy đổi thành độ dài lời thoại." : "Nhập số ký tự mục tiêu cho toàn bộ kịch bản."}</p>
                        </div>
                      )}
                    </div>

                    {/* Phát hiện thông minh khi người dùng dán liên kết video vào ô văn bản chính */}
                    {rawTranscript.trim().match(/^https?:\/\/[^\s]+$/) && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-pulse">
                        <div className="flex items-center gap-2 text-left">
                          <Sparkles className="w-4 h-4 text-red-650 shrink-0" />
                          <div>
                            <span className="text-[11px] font-black text-slate-800 uppercase block">Phát hiện liên kết video!</span>
                            <span className="text-[10px] text-slate-500 leading-normal block">
                              Bạn vừa dán một đường dẫn video. Bạn có muốn kích hoạt hệ thống tự động tải và bóc kịch bản ngay lập tức không?
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSocialUrl(rawTranscript.trim());
                            setScriptImportMode("social");
                            handleSocialTranscribe(rawTranscript.trim());
                          }}
                          disabled={socialTranscribeLoading}
                          className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-black px-4 py-2 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                        >
                          {socialTranscribeLoading ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                              <span>ĐANG BÓC KỊCH BẢN...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>🚀 BÓC KỊCH BẢN NGAY</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Độ dài: {rawTranscript.length} ký tự</span>
                      <button 
                        onClick={() => {
                          const sample = `Ngày xưa có một người đàn ông kì lạ (00:01). Ông ta mỗi ngày đều đi bộ vào khu rừng sâu thẳm một mình (00:15). Không ai biết lý do thật sự là gì, cho đến khi người dân nghe tiếng thét lúc nửa đêm... (00:30)`;
                          if (rawTranscript.trim() || standardizedScript.trim()) {
                            resetForNewRawInput(sample);
                          } else {
                            setRawTranscript(sample);
                          }
                        }}
                        className="text-red-500 hover:underline font-bold"
                      >
                        [Dán văn bản mẫu nhanh]
                      </button>
                    </div>
                  </div>

                  {/* Cột Phải kết quả chuẩn hóa */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Kịch Bản Đã Chuẩn Hóa Để Đọc (Voice):</label>
                      {standardizedScript && (
                        <button 
                          onClick={() => triggerCopy("stScript", standardizedScript)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                        >
                          {copiedKey === "stScript" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy Kịch Bản Sạch
                        </button>
                      )}
                    </div>
                    <textarea
                      value={standardizedScript}
                      onChange={(e) => setStandardizedScript(e.target.value)}
                      placeholder="Kịch bản sau khi dọn dẹp và chuẩn hóa..."
                      rows={10}
                      className="w-full text-xs p-4 bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl font-mono leading-relaxed h-[245px] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-inner resize-y whitespace-pre-wrap"
                    />
                    {standardizedScript && (
                      <div className="space-y-1.5 mt-2">
                        {isProgrammatic ? (
                          <div className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded p-2 font-medium flex items-center gap-1.5 leading-snug">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></span>
                            ⚡ <strong>Chuẩn hóa siêu tốc bằng thuật toán:</strong> Kịch bản đã được dọn sạch mốc thời gian và định dạng thành công sau 0.1 giây (Giải pháp dự phòng hoàn hảo khi máy chủ AI phản hồi chậm).
                          </div>
                        ) : (
                          <div className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded p-2 font-medium flex items-center gap-1.5 leading-snug">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 animate-pulse"></span>
                            ✨ <strong>Hoàn thành chuẩn hóa bằng Google AI:</strong> Đã tối ưu hóa nghĩa và định dạng ngôn từ nâng cao thành công!
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded p-2 italic leading-normal">
                          <strong>Lưu ý:</strong> Kịch bản này đã lược bỏ hoàn toàn mốc thời gian gạch nối và các ký tự rối mắt, giúp tăng độ chính xác lên 99% cho các công cụ đọc giọng như ElevenLabs.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Yêu cầu chỉnh sửa kịch bản thủ công/nâng cao */}
                {standardizedScript && (
                  <div className="bg-red-50/50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-650" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        🛠️ Yêu cầu chỉnh sửa kịch bản (Optional)
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-medium">
                      Nếu cần chỉnh sửa kịch bản đã sinh phía trên (ví dụ: đổi tên nước, đổi tên nhân vật, mô tả cụ thể cốt truyện, chỉnh tông giọng bài viết...), hãy điền yêu cầu sửa vào ô bên dưới. AI sẽ tự động biến tấu và tái cấu trúc cho bạn!
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={scriptEditRequest}
                        onChange={(e) => setScriptEditRequest(e.target.value)}
                        placeholder="Ví dụ: Đổi tên quốc gia thành Hy lạp, sửa nhân vật nam thành 'Alexander', viết theo phong cách gay cấn hơn..."
                        className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-red-500 focus:border-red-550 focus:outline-none placeholder-slate-400 text-slate-800 shadow-3xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && scriptEditRequest.trim()) {
                            handleProcessScript(true);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleProcessScript(true)}
                        disabled={processScriptLoading || !scriptEditRequest.trim()}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-3xs active:scale-95 cursor-pointer shrink-0"
                      >
                        {processScriptLoading ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Cập Nhật
                      </button>
                    </div>
                  </div>
                )}

                {/* Tùy chọn Viết lại Kịch Bản khác biệt */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      🔄 Tùy chọn Viết lại Kịch Bản khác biệt:
                    </label>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-3xs">
                      <input
                        type="checkbox"
                        id="rewriteScriptCheckbox"
                        checked={rewriteScript}
                        onChange={(e) => {
                          setRewriteScript(e.target.checked);
                          setPreserveOriginalScript(!e.target.checked);
                        }}
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                      />
                      <label htmlFor="rewriteScriptCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        Viết lại kịch bản khác đi nhưng vẫn hay và hấp dẫn như bản gốc
                      </label>
                    </div>
                  </div>

                  {rewriteScript && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Yêu cầu độ dài mới:</span>
                        <select
                          value={newScriptLength}
                          onChange={(e) => setNewScriptLength(e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold text-slate-700 cursor-pointer shadow-xs w-full"
                        >
                          <option value="equal">Độ dài bằng bản gốc (Mặc định)</option>
                          <option value="shorter">Ngắn hơn bản gốc (Súc tích)</option>
                          <option value="longer">Dài hơn bản gốc (Chi tiết hơn)</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2.5 w-full shadow-3xs">
                          <input
                            type="checkbox"
                            id="modifyIntroOnlyCheckbox"
                            checked={modifyIntroOnly}
                            onChange={(e) => setModifyIntroOnly(e.target.checked)}
                            className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                          />
                          <label htmlFor="modifyIntroOnlyCheckbox" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                            Chỉ thay đổi mỗi đoạn mở đầu (Intro)
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3"><div><h4 className="text-xs font-black text-slate-800 uppercase">Hook giữ chân (gộp trong Bước 1)</h4><p className="text-[10px] text-slate-500 mt-1">Tạo và chọn hook trước khi chuyển sang chia cảnh.</p></div><button type="button" onClick={() => { if (!rawHook && standardizedScript) { setRawHook(standardizedScript.split("\n").slice(0, 3).join("\n")); return; } handleGenerateHook(); }} disabled={hookLoading || (!rawHook && !standardizedScript)} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300">{hookLoading ? "Đang tạo..." : (!rawHook ? "Lấy Hook gốc" : "Tạo Hook")}</button></div>
                  {hookOptions.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-2">{hookOptions.map((option, index) => <button type="button" key={index} onClick={() => handleSelectHook(option.hookText)} className={`rounded-lg border p-3 text-left text-xs ${chosenHookText === option.hookText ? "border-orange-500 bg-white ring-1 ring-orange-200" : "border-orange-100 bg-white hover:border-orange-300"}`}><span className="block text-[10px] font-black text-orange-700 mb-1">{option.style}</span>{option.hookText}</button>)}</div>}
                  {chosenHookText && <p className="rounded-lg bg-white border border-orange-100 p-2 text-[11px] font-semibold text-slate-700">Đã chọn: {chosenHookText}</p>}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-50 p-4 border border-slate-100 rounded-xl gap-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Ngôn Ngữ Viết Lại:</span>
                    <select
                      value={scriptLang}
                      onChange={(e) => setScriptLang(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold text-slate-700 cursor-pointer shadow-xs min-w-[130px]"
                    >
                      <option value="original">Ngôn ngữ gốc</option>
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">Tiếng Anh (English)</option>
                      <option value="zh">Tiếng Trung (中文)</option>
                      <option value="ja">Tiếng Nhật (日本語)</option>
                      <option value="ko">Tiếng Hàn (한국어)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 font-medium">Bản thảo sẽ được dịch & trau chuốt theo ngôn ngữ chọn.</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleProcessScript}
                      disabled={processScriptLoading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      {processScriptLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Đang dọn dẹp và ngắt câu...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Chuẩn Hóa Kịch Bản
                        </>
                      )}
                    </button>

                    {processScriptLoading && (
                      <button
                        type="button"
                        onClick={() => handleCancelStep("script")}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <span>⏹️</span> Dừng
                      </button>
                    )}
                  </div>
                </div>

                {standardizedScript && (
                  <div className="flex justify-end">
                    <button 
                      onClick={() => {
                        setActiveStep("03");
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 tracking-tight active:scale-95 transition-all"
                    >
                      Tiếp Tục Chia Cảnh & Prompts
                      <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- BƯỚC 02: VIẾT LẠI HOOK HOÀN HẢO ---------------- */}
            {false && activeStep === "02" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <Flame className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">BƯỚC 2: VIẾT LẠI HOOK CHO KỊCH BẢN</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Đoạn mở đầu là phao cứu sinh của video. Lựa chọn cách giật gân, khơi mào trí tò mò để người nghe không bao giờ lướt qua.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Đoạn hook cũ cần sửa */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Đoạn Mở Đầu (Hook) Thô Hoặc Ý Tưởng Đầu Tiên:</span>
                    <textarea
                      value={rawHook}
                      onChange={(e) => setRawHook(e.target.value)}
                      placeholder="Dán đoạn mở đầu thô tầm 2 - 3 câu đầu của câu chuyện của bạn..."
                      rows={5}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono leading-relaxed"
                    />

                    {standardizedScript && !rawHook && (
                      <button 
                        onClick={() => {
                          const lines = standardizedScript.split("\n").slice(0, 3).join("\n");
                          setRawHook(lines);
                        }}
                        className="text-xs text-red-500 font-bold hover:underline block"
                      >
                        [⚡ Trích xuất tự động 3 dòng đầu của Bước 1]
                      </button>
                    )}

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-500" /> Mẹo viết Hook triệu view:
                      </span>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Đừng bắt đầu bằng cách chào hỏi vô ích dài dòng. Hãy ném thẳng người xem vào tâm bão câu hỏi độc đáo hoặc một kết luận cực kỳ nghịch lý!
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 bg-red-50/50 border border-red-100 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Ngôn Ngữ Viết Lại Hook:</span>
                        <select
                          value={hookLang}
                          onChange={(e) => setHookLang(e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold text-slate-700 cursor-pointer shadow-xs grow text-right"
                        >
                          <option value="original">Ngôn ngữ gốc</option>
                          <option value="vi">Tiếng Việt</option>
                          <option value="en">Tiếng Anh (English)</option>
                          <option value="zh">Tiếng Trung (中文)</option>
                          <option value="ja">Tiếng Nhật (日本語)</option>
                          <option value="ko">Tiếng Hàn (한국어)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Cách tiếp cận viết lại:</span>
                        <select
                          value={hookRewriteStyle}
                          onChange={(e) => setHookRewriteStyle(e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold text-slate-700 cursor-pointer shadow-xs grow text-right animate-fadeIn"
                        >
                          <option value="different">Viết khác đi hoàn toàn (Đột phá/Giật gân)</option>
                          <option value="close">Bám sát kịch bản gốc (Trau chuốt tinh tế)</option>
                        </select>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block pl-1">
                        * Các phương án hook mới sẽ giữ nguyên độ dài tương đương với bản gốc.
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateHook}
                        disabled={hookLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-99"
                      >
                        {hookLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Đang tái cấu trúc lại Hook hiểm học...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Xem 3 Đề Xuất Hook Đỉnh Cao
                          </>
                        )}
                      </button>

                      {hookLoading && (
                        <button
                          type="button"
                          onClick={() => handleCancelStep("hook")}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                          <span>⏹️</span> Dừng
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Kết quả Hook cải thiện */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">3 Phương Án Hook Triệu View Đề Xuất:</span>
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {hookOptions && hookOptions.length > 0 ? (
                        hookOptions.map((opt, idx) => {
                          const isSelected = chosenHookText === opt.hookText;
                          return (
                            <div 
                              key={idx}
                              onClick={() => handleSelectHook(opt.hookText)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-2 select-none ${
                                isSelected 
                                  ? "bg-red-50 border-red-500 shadow-xs ring-1 ring-red-500/10" 
                                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  idx === 0 
                                    ? "bg-purple-100 text-purple-700 font-bold" 
                                    : idx === 1 
                                      ? "bg-orange-100 text-orange-700 font-bold" 
                                      : "bg-teal-100 text-teal-700 font-bold"
                                }`}>
                                  ⭐ {opt.style}
                                </span>
                                <div className="flex items-center gap-1">
                                  {isSelected ? (
                                    <span className="text-[10px] sm:text-xs font-bold text-red-600 flex items-center gap-0.5">
                                      <Check className="w-3.5 h-3.5" /> Đã chọn
                                    </span>
                                  ) : (
                                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                                      Tích chọn
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] sm:text-xs text-slate-800 font-medium leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap font-mono">
                                &quot;{opt.hookText}&quot;
                              </p>
                              {opt.explanation && (
                                <p className="text-[10px] text-slate-500 leading-normal italic">
                                  💡 {opt.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-slate-500 italic h-36 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-center p-4">
                          Chưa có gợi ý Hook. Hãy nhập Hook thô bên trái và bấm &quot;Xem 3 Đề Xuất...&quot;
                        </div>
                      )}
                    </div>

                    {chosenHookText && (
                      <div className="bg-gradient-to-br from-emerald-50/65 to-teal-50/40 border border-emerald-250/80 p-4.5 rounded-xl space-y-3 mt-1.5 shadow-3xs animate-fade-in text-left">
                        <div className="flex items-center justify-between border-b border-emerald-150/50 pb-2">
                          <span className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                            So sánh Trực Quan & Thay Thế Hook Thành Công
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                            Đồng bộ 100%
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <span className="text-[9.5px] font-extrabold text-red-600 uppercase tracking-widest block">
                              ❌ HOOK CŨ / THÔ ĐÃ BỊ LOẠI BỎ:
                            </span>
                            <div className="text-[11px] p-2.5 bg-red-50/60 border border-red-150/50 rounded-lg text-red-800 line-through font-mono leading-relaxed max-h-[80px] overflow-y-auto whitespace-pre-wrap">
                              {rawHook || "3 dòng đầu tiên của kịch bản gốc"}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9.5px] font-extrabold text-emerald-700 uppercase tracking-widest block">
                              ✨ HOOK MỚI ĐÃ THAY THẾ HOÀN TOÀN:
                            </span>
                            <div className="text-[11px] p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-slate-800 font-bold font-mono leading-relaxed max-h-[100px] overflow-y-auto whitespace-pre-wrap ring-2 ring-emerald-500/10">
                              {chosenHookText}
                            </div>
                          </div>
                        </div>

                        <div className="pt-1.5 flex items-center justify-between gap-4">
                          <p className="text-[10px] text-slate-500 leading-normal font-medium">
                            💡 Kịch bản hoàn chỉnh ở <strong>Bước 1</strong> đã tự động đồng bộ thay thế nội dung mới này.
                          </p>
                          <button 
                            type="button"
                            onClick={() => triggerCopy("chHook", chosenHookText)}
                            className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10.5px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 select-none shrink-0"
                          >
                            {copiedKey === "chHook" ? "Đã sao chép ✓" : "Sao Chép Hook"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* HIỂN THỊ KỊCH BẢN HOÀN CHỈNH 100% & THỜI LƯỢNG DỰ ĐOÁN */}
                {standardizedScript && (
                  <div className="border-t border-slate-100 pt-5 mt-4 space-y-4 text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-red-50/40 p-4 rounded-xl border border-red-100/60">
                      <div>
                        <span className="text-xs font-black text-rose-800 uppercase tracking-wider block">⏱️ PHÂN TÍCH & DỰ ĐOÁN THỜI LƯỢNG VIDEO:</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tự động đếm từ và tối ưu nhịp nói trung bình cho Shorts / TikTok (~2.3 từ/giây).
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-center shadow-3xs">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Số Ký Tự</span>
                          <span className="text-xs font-black text-slate-800 font-mono">{standardizedScript.length}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-center shadow-3xs">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Số Từ</span>
                          <span className="text-xs font-black font-mono text-red-600">
                            {standardizedScript.split(/\s+/).filter(Boolean).length} từ
                          </span>
                        </div>
                        <div className="bg-rose-600 text-white rounded-lg px-4 py-1.5 text-center shadow-sm">
                          <span className="text-[10px] text-rose-200 font-bold block uppercase">Thời lượng dự đoán</span>
                          <span className="text-xs font-black font-mono">
                            {Math.ceil(standardizedScript.split(/\s+/).filter(Boolean).length / 2.3)} giây (~
                            {(standardizedScript.split(/\s+/).filter(Boolean).length / 2.3 / 60).toFixed(1)} phút)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Cột trái: Biên tập kịch bản hoàn chỉnh Thủ Công */}
                      <div className="lg:col-span-7 space-y-2">
                        <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider flex items-center gap-1.5">
                          ✍️ HIỆU CHỈNH KỊCH BẢN HOÀN CHỈNH 100% (Lựa chọn sửa lại trực tiếp):
                        </span>
                        <textarea
                          value={standardizedScript}
                          onChange={(e) => setStandardizedScript(e.target.value)}
                          rows={8}
                          className="w-full text-xs p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono leading-relaxed"
                          placeholder="Kịch bản hoàn chỉnh 100% sẽ hiển thị tại đây để bạn biên tập..."
                        />
                        <p className="text-[10px] text-slate-400 italic">
                          💡 Bạn có thể trực tiếp thêm bớt, sửa từ ngữ trong ô kịch bản trên. Mọi bước tiếp theo sẽ tự động đồng bộ theo nội dung mới.
                        </p>
                      </div>

                      {/* Cột phải: Viết lại Co Giãn theo Số Từ & Thời Gian bằng AI */}
                      <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3.5">
                        <div>
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                            ✨ CÔNG CỤ CO GIÃN ĐỘ DÀI KỊCH BẢN BẰNG AI:
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Viết dài thêm hoặc ngắn bớt kịch bản dựa vào cấu hình mong muốn.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase block">Số Từ Mục Tiêu:</label>
                            <input
                              type="number"
                              value={targetWordsAdjust === "" ? "" : targetWordsAdjust}
                              onChange={(e) => setTargetWordsAdjust(e.target.value === "" ? "" : Number(e.target.value))}
                              placeholder="Ví dụ: 300"
                              className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase block">Thời lượng (giây):</label>
                            <input
                              type="number"
                              value={targetDurationAdjust === "" ? "" : targetDurationAdjust}
                              onChange={(e) => setTargetDurationAdjust(e.target.value === "" ? "" : Number(e.target.value))}
                              placeholder="Ví dụ: 60"
                              className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustScriptLength("shorter")}
                            disabled={adjustLoading}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            {adjustLoading ? (
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : "⬇️ Viết Ngắn Đi"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustScriptLength("longer")}
                            disabled={adjustLoading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            {adjustLoading ? (
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : "⬆️ Viết Dài Thêm"}
                          </button>

                          {adjustLoading && (
                            <button
                              type="button"
                              onClick={() => handleCancelStep("adjust")}
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              ⏹️ Dừng
                            </button>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-500 bg-white p-2.5 rounded border border-slate-100 leading-normal">
                          💡 <b>Cách dùng:</b> Điền mục tiêu mong muốn và chọn <b>Viết Ngắn Đi</b> hoặc <b>Viết Dài Thêm</b>. AI sẽ tự động điều khiển nội dung phù hợp với định mức của bạn!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button 
                    onClick={() => {
                      setActiveStep("03");
                      playSound("click");
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 tracking-tight active:scale-95 transition-all cursor-pointer"
                  >
                    Bắt Đầu Chia Cảnh Tạo Ảnh AI
                    <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
                  </button>
                </div>

              </div>
            )}

            {/* ---------------- BƯỚC 03: CHIA PHÂN CẢNH & PROMPT ẢNH ---------------- */}
            {activeStep === "03" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6 text-slate-800">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <Layers className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-800">BƯỚC 3: CHIA PHÂN CẢNH & TẠO PROMPT ẢNH TIẾNG ANH</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Thuật toán phân tích kịch bản theo mạch thời gian, tự động sinh các phân cảnh và viết prompt tiếng Anh cực xịn để đưa thẳng vào Dreamina / Midjourney / Leonardo.
                    </p>
                  </div>
                </div>

                {/* STYLE HÌNH GỢI Ý */}
                <div className="space-y-4 bg-slate-50/50 p-4.5 rounded-xl border border-slate-150 shadow-3xs">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">Lựa Chọn Phong Cách Ảnh (Visual Style):</label>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">Lưu trên thiết bị</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {savedStyles.map((st, idx) => {
                      const isSelected = imageStyle === st.value;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (editingStyleIdx !== idx && styleToDelete !== idx) {
                              setImageStyle(st.value);
                              playSound("click");
                            }
                          }}
                          className={`group relative p-3 rounded-xl border text-left text-[11px] cursor-pointer font-sans transition-all flex flex-col justify-between ${
                            isSelected 
                              ? "bg-red-50/60 border-red-500 text-slate-850 font-medium shadow-3xs" 
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-350"
                          }`}
                        >
                          {styleToDelete === idx ? (
                            <div 
                              className="absolute inset-0 bg-red-50/95 flex flex-col items-center justify-center p-2 rounded-xl border border-red-200 text-center gap-1.5 z-20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-[10px] font-black text-red-800 uppercase tracking-wider">Xác nhận xóa?</p>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteStyle(idx);
                                    setStyleToDelete(null);
                                  }}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9.5px] font-bold cursor-pointer transition-all active:scale-95"
                                >
                                  Xóa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStyleToDelete(null);
                                    playSound("click");
                                  }}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9.5px] font-bold cursor-pointer transition-all active:scale-95"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : editingStyleIdx === idx ? (
                            <div className="space-y-2 w-full" onClick={(e) => e.stopPropagation()}>
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 block mb-1">TÊN PHONG CÁCH:</label>
                                <input
                                  type="text"
                                  value={editingStyleNameVal}
                                  onChange={(e) => setEditingStyleNameVal(e.target.value)}
                                  className="w-full text-xs p-1.5 border border-slate-300 rounded font-sans focus:ring-1 focus:ring-red-500 bg-white text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 block mb-1">PROMPT PHONG CÁCH:</label>
                                <textarea
                                  value={editingStyleVal}
                                  onChange={(e) => setEditingStyleVal(e.target.value)}
                                  className="w-full text-xs p-1.5 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-red-500 bg-white text-slate-800"
                                  rows={2}
                                />
                              </div>
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStyleIdx(null);
                                    setEditingStyleNameVal("");
                                    setEditingStyleVal("");
                                    playSound("click");
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[9px] font-bold cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedStyle(idx)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold cursor-pointer"
                                >
                                  Lưu
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col justify-between">
                              <div>
                                <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-tight mb-1.5 ${
                                  isSelected ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {st.name}
                                </span>
                                <p className="line-clamp-2 pr-5 font-mono text-[10px] text-slate-500 leading-relaxed">{st.value}</p>
                              </div>
                              
                              {/* Actions on hover/touch */}
                              <div 
                                className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-white/95 p-0.5 rounded border border-slate-100 shadow-2xs" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleEditStyle(idx)}
                                  title="Sửa phong cách"
                                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStyleToDelete(idx);
                                    playSound("click");
                                  }}
                                  title="Xóa"
                                  className="p-1 hover:bg-red-50 text-slate-500 hover:text-red-650 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Thêm style mới */}
                  <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2.5 shadow-3xs text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Thêm Phong Cách Mẫu Mới:</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newStyleNameInput}
                        onChange={(e) => setNewStyleNameInput(e.target.value)}
                        placeholder="Tên phong cách (ví dụ: Vintage 1980s)"
                        className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-700 font-sans"
                      />
                      <input
                        type="text"
                        value={newStyleValueInput}
                        onChange={(e) => setNewStyleValueInput(e.target.value)}
                        placeholder="Nội dung Prompt (ví dụ: vintage film grain, 80s warmth...)"
                        className="md:col-span-2 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-705 font-mono"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddStyle();
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddStyle}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm Style
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1 text-left">
                    <span className="text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">Style Đang Sử Dụng (Hoặc Gõ Tự Do):</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imageStyle}
                        onChange={(e) => setImageStyle(e.target.value)}
                        placeholder="Gõ phong cách đặc thù tự do..."
                        className="flex-1 text-xs px-3 py-2 bg-white border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-700 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = imageStyle.trim();
                          if (!trimmed) return;
                          if (savedStyles.some(s => s.value === trimmed)) {
                            alert("Phong cách này đã có trong danh sách mẫu!");
                            playSound("error");
                            return;
                          }
                          const name = `Mẫu tự lưu ${savedStyles.length + 1}`;
                          const updated = [...savedStyles, { name, value: trimmed }];
                          saveStylesToLocalStorage(updated);
                          alert("Đã lưu phong cách thành công!");
                          playSound("success");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-250 flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
                        title="Lưu phong cách hiện tại vào mẫu"
                      >
                        Lưu thành mẫu
                      </button>
                    </div>
                  </div>

                  {/* HỒ SƠ NHIỀU NHÂN VẬT (CHARACTER BIBLE) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-3xs text-left">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-150 pb-3">
                      <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-red-500" />
                      <div>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                          HỒ SƠ NHÂN VẬT — KHÓA NHẬN DẠNG
                        </span>
                        <p className="text-[10px] text-slate-450 leading-relaxed mt-0.5">
                          Tạo một hồ sơ riêng cho mỗi người. Tool sẽ dùng tên/bí danh để chỉ đưa đúng nhân vật vào từng cảnh và giữ nguyên diện mạo xuyên suốt video, thumbnail.
                        </p>
                      </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => saveCharacterProfiles([
                          ...characterProfiles,
                          createCharacterProfile(characterProfiles.length),
                        ])}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-2 text-[10px] font-black text-white transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm nhân vật
                      </button>
                    </div>

                    <div className="space-y-3">
                      {characterProfiles.map((profile, profileIndex) => (
                        <div key={profile.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-3xs">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-red-50 px-2 py-1 font-mono text-[9px] font-black text-red-600">{profile.id}</span>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Hồ sơ bất biến</span>
                            </div>
                            {characterProfiles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => saveCharacterProfiles(characterProfiles.filter((item) => item.id !== profile.id))}
                                className="inline-flex items-center gap-1 text-[9px] font-bold text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Xóa
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                            <div className="lg:col-span-3">
                              <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-500">Tên nhân vật</label>
                              <input
                                value={profile.name}
                                onChange={(event) => updateCharacterProfile(profile.id, { name: event.target.value })}
                                placeholder={`Nhân vật ${profileIndex + 1}`}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                              <label className="mb-1 mt-2 block text-[9px] font-black uppercase tracking-wider text-slate-500">Bí danh/cách gọi trong kịch bản</label>
                              <input
                                value={profile.aliases}
                                onChange={(event) => updateCharacterProfile(profile.id, { aliases: event.target.value })}
                                placeholder="Ví dụ: Nam, anh ấy, người cha"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                            </div>

                            <div className="lg:col-span-3">
                              <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-500">Ảnh mẫu riêng của {profile.name || profile.id}</label>
                              <div className="relative flex h-[104px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-250 bg-slate-50 p-3 text-center transition-all hover:border-red-500/50 hover:bg-red-50/30">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              playSound("click");
                              setCharImageLoadingId(profile.id);
                              try {
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const base64data = reader.result as string;
                                  const res = await fetch("/api/analyze-character", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ image: base64data })
                                  });
                                  const data = await res.json();
                                  if (res.ok && data.characterDescription) {
                                    updateCharacterProfile(profile.id, { description: data.characterDescription });
                                    playSound("success");
                                  } else {
                                    alert(data.error || "Không thể phân tích khuôn mặt nhân vật.");
                                    playSound("error");
                                  }
                                  setCharImageLoadingId("");
                                };
                                reader.readAsDataURL(file);
                              } catch (err) {
                                console.error(err);
                                alert("Đã xảy ra lỗi khi đọc tập tin.");
                                playSound("error");
                                setCharImageLoadingId("");
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {charImageLoadingId === profile.id ? (
                            <div className="space-y-2 flex flex-col items-center justify-center">
                              <span className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                              <span className="text-[10px] font-bold text-slate-500 animate-pulse">AI Đang Phân Tích...</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                              <p className="text-[10px] font-extrabold text-slate-500">TẢI ẢNH & PHÂN TÍCH</p>
                              <p className="text-[8px] text-slate-400 leading-normal">Kết quả chỉ cập nhật đúng hồ sơ này</p>
                            </div>
                          )}
                        </div>
                      </div>

                            <div className="lg:col-span-6">
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-500">
                            Mô tả nhận dạng cố định (English prompt)
                          </label>
                          <textarea
                            value={profile.description}
                            onChange={(event) => updateCharacterProfile(profile.id, { description: event.target.value })}
                            placeholder="Ví dụ: A 25-year-old Asian man with short messy dark hair, sharp jawline, wearing a casual leather jacket, serious expression..."
                            className="h-[104px] w-full resize-none rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                              <p className="mt-1 text-[8px] leading-relaxed text-slate-400">Nên ghi rõ tuổi, giới tính, khuôn mặt, tóc, vóc dáng, màu da, trang phục và dấu hiệu nhận diện. Không ghi hành động hay bối cảnh vào hồ sơ.</p>
                        </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] leading-relaxed text-emerald-800">
                      <strong>{characterProfiles.filter((profile) => profile.description.trim()).length} hồ sơ đã khóa.</strong> Khi một cảnh có nhiều người, tool giữ từng mã nhân vật độc lập; không trộn khuôn mặt, giới tính, tuổi hoặc trang phục giữa các hồ sơ.
                    </div>
                  </div>

                  {/* THIẾT LẬP CHẾ ĐỘ PHÂN CẢNH VÀ PROMPTS VẼ */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3 mt-2">
                    {(() => {
                      const getSentencesCount = (text: string): number => {
                        if (!text) return 0;
                        const rawParts = text.split(/\r?\n/);
                        const sentences: string[] = [];
                        for (const part of rawParts) {
                          const trimmedPart = part.trim();
                          if (!trimmedPart) continue;
                          
                          // Thay thế tạm thời dấu chấm trong số (e.g. 40.000 hoặc 3.14) bằng placeholder __NUM_DOT__
                          let masked = trimmedPart.replace(/(\d)\.(\d)/g, "$1__NUM_DOT__$2");
                          
                          // Thay thế một số từ viết tắt thông dụng có chứa dấu chấm để tránh bị chia nhầm câu
                          masked = masked.replace(/\b(T[Pp])\.(HCM|HN)\b/gi, "$1__DOT__$2");
                          masked = masked.replace(/\b(S\.)(O\.)(S)\b/gi, "$1__DOT__$2__DOT__$3");
                          masked = masked.replace(/\b(U\.)(S\.)(A)\b/gi, "$1__DOT__$2__DOT__$3");
                          masked = masked.replace(/\b(V\.)(I\.)(P)\b/gi, "$1__DOT__$2__DOT__$3");
                          masked = masked.replace(/\b(Mr|Mrs|Dr|Ms|Vs|Est|Approx)\./gi, "$1__DOT__");
                          
                          const matches = masked.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
                          if (matches) {
                            for (const m of matches) {
                              let item = m.trim();
                              if (item) {
                                item = item.replace(/__NUM_DOT__/g, ".").replace(/__DOT__/g, ".");
                                sentences.push(item);
                              }
                            }
                          } else {
                            sentences.push(trimmedPart);
                          }
                        }

                        // Với các câu thoại dài, ta tự động chia nhỏ mượt mà thành 2-3 câu thoại hợp lý
                        const finalSentences: string[] = [];
                        for (const s of sentences) {
                          const words = s.split(/\s+/).filter(Boolean);
                          const wordCount = words.length;
                          
                          if (wordCount > 15) {
                            const parts = s.split(/(?:,\s+and\s+|,\s+but\s+|;\s+|:\s+|,\s+which\s+|,\s+while\s+)/gi);
                            if (parts.length > 1) {
                              for (let i = 0; i < parts.length; i++) {
                                let chunk = parts[i].trim();
                                if (chunk) {
                                  if (i === 0) {
                                    chunk = chunk.charAt(0).toUpperCase() + chunk.slice(1);
                                  }
                                  if (i < parts.length - 1) {
                                    chunk = chunk + "...";
                                  }
                                  finalSentences.push(chunk);
                                }
                              }
                            } else {
                              const subparts = s.split(/,\s+/);
                              if (subparts.length > 1) {
                                let currentChunk = "";
                                for (let i = 0; i < subparts.length; i++) {
                                  const subVal = subparts[i].trim();
                                  if (!subVal) continue;
                                  if (!currentChunk) {
                                    currentChunk = subVal;
                                  } else {
                                    const temp = currentChunk + ", " + subVal;
                                    if (temp.split(/\s+/).filter(Boolean).length > 12) {
                                      finalSentences.push(currentChunk + "...");
                                      currentChunk = subVal.charAt(0).toUpperCase() + subVal.slice(1);
                                    } else {
                                      currentChunk = temp;
                                    }
                                  }
                                }
                                if (currentChunk) {
                                  finalSentences.push(currentChunk);
                                }
                              } else {
                                if (wordCount > 18) {
                                  const mid = Math.floor(wordCount / 2);
                                  const firstHalf = words.slice(0, mid).join(" ") + "...";
                                  let secondHalf = words.slice(mid).join(" ");
                                  secondHalf = secondHalf.charAt(0).toUpperCase() + secondHalf.slice(1);
                                  finalSentences.push(firstHalf);
                                  finalSentences.push(secondHalf);
                                } else {
                                  finalSentences.push(s);
                                }
                              }
                            }
                          } else {
                            finalSentences.push(s);
                          }
                        }

                        // Áp dụng gộp thông minh
                        const mergedSentences: string[] = [];
                        const transitionPrefixes = [
                          "bởi vì", "trong phần lớn lịch sử", "ngày nay", "tuy nhiên", "nhưng", "vì thế", "ví dụ", "hơn nữa", "do đó", "bên cạnh đó", "nói cách khác", "thật vậy", "tóm lại", "bỗng nhiên", "chính vì vậy", "trước hết", "sau đó", "cuối cùng",
                          "because", "but", "however", "today", "for most of history", "therefore", "thus", "in addition", "furthermore", "in other words", "indeed", "suddenly", "first of all", "then", "finally"
                        ];

                        for (let i = 0; i < finalSentences.length; i++) {
                          const current = finalSentences[i].trim();
                          if (!current) continue;

                          const words = current.split(/\s+/).filter(Boolean);
                          const wordCount = words.length;
                          const lowerCurrent = current.toLowerCase();

                          const isTransition = transitionPrefixes.some(pref => {
                            const cleanPref = pref.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
                            const cleanCurrent = lowerCurrent.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
                            return cleanCurrent.startsWith(cleanPref);
                          });

                          const shouldMerge = wordCount <= 4 || (isTransition && wordCount <= 7);

                          if (shouldMerge && i < finalSentences.length - 1) {
                            let next = finalSentences[i + 1].trim();
                            let separator = " ";
                            if (!current.endsWith(",") && !current.endsWith("...") && !current.endsWith("-") && !current.endsWith("—")) {
                              separator = ", ";
                            }
                            if (next) {
                              const firstChar = next.charAt(0);
                              if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
                                next = firstChar.toLowerCase() + next.slice(1);
                              }
                            }
                            finalSentences[i + 1] = current + separator + next;
                          } else if (shouldMerge && mergedSentences.length > 0) {
                            const prevIdx = mergedSentences.length - 1;
                            let prev = mergedSentences[prevIdx];
                            let separator = " ";
                            if (!prev.endsWith(",") && !prev.endsWith("...") && !prev.endsWith(".") && !prev.endsWith("!") && !prev.endsWith("?")) {
                              separator = ", ";
                            }
                            mergedSentences[prevIdx] = prev + separator + current;
                          } else {
                            mergedSentences.push(current);
                          }
                        }

                        return mergedSentences.length;
                      };

                      return (
                        <div className="bg-white border border-red-100 rounded-xl p-3.5 space-y-3 shadow-3xs">
                          <div className="flex items-start gap-2.5">
                            <input
                              id="dialogueSplitCheckbox"
                              type="checkbox"
                              checked={true}
                              disabled={true}
                              className="mt-1 w-4 h-4 rounded border-slate-300 text-red-650 focus:ring-red-550 cursor-default"
                            />
                            <div className="space-y-0.5">
                              <label htmlFor="dialogueSplitCheckbox" className="text-xs font-black text-slate-8 cursor-default flex items-center gap-1.5">
                                👑 [NÂNG CAO] Chia kịch bản phân cảnh bám khăng khít theo từng câu thoại
                              </label>
                              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                                Hệ thống tự chia nhỏ kịch bản bám sát theo ranh giới câu thoại / đoạn văn nhỏ độc lập có nghĩa tròn trịa, giúp bối cảnh thay đổi chuẩn xác theo từng câu lồng tiếng phụ đề.
                              </p>
                            </div>
                          </div>

                          <div className="pl-6.5 pt-2 border-t border-slate-200/50 space-y-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <label className="text-[11px] font-bold text-slate-700 uppercase">Cấu hình gộp câu thoại:</label>
                              <select
                                value={dialogueGroupSize}
                                onChange={(e) => setDialogueGroupSize(Number(e.target.value))}
                                className="text-xs bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold text-slate-700 cursor-pointer shadow-xs min-w-[160px]"
                              >
                                <option value={1}>1 câu thoại = 1-3 prompts (tự động theo độ dài câu)</option>
                                <option value={2}>Cứ 2 câu thoại = 1 prompt</option>
                                <option value={3}>Cứ 3 câu thoại = 1 prompt</option>
                                <option value={4}>Cứ 4 câu thoại = 1 prompt</option>
                                <option value={0}>Tự chia thông minh bằng AI</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-slate-100/70 pt-2">
                              <label className="text-[11px] font-bold text-slate-700 uppercase">Mục tiêu sử dụng prompt:</label>
                              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                                <button
                                  type="button"
                                  onClick={() => setPromptsFocus("video")}
                                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
                                    promptsFocus === "video"
                                      ? "bg-white text-slate-850 shadow-xs border border-slate-200/20"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  🎬 Tạo Video
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPromptsFocus("image")}
                                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
                                    promptsFocus === "image"
                                      ? "bg-white text-red-650 shadow-xs border border-slate-200/20"
                                      : "text-slate-500 hover:text-red-550"
                                  }`}
                                >
                                  🖼️ Tạo Ảnh
                                </button>
                              </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[10px] text-slate-600 leading-normal font-medium space-y-1.5 shadow-3xs">
                              <div className="flex justify-between items-center text-slate-700 font-bold border-b border-dashed border-slate-150 pb-1.5 mb-1">
                                <span>📊 Số câu thoại đếm được:</span>
                                <span className="text-red-650 bg-red-50 px-2 py-0.5 rounded text-[11px] font-black">
                                  {getSentencesCount(standardizedScript || rawTranscript)} câu
                                </span>
                              </div>
                              {dialogueGroupSize > 0 ? (
                                <div className="space-y-1">
                                  <p>
                                    👉 Với lựa chọn <strong>nhóm {dialogueGroupSize} câu thoại</strong>, hệ thống sẽ phát sinh tối thiểu <strong className="text-red-650 text-[11px] font-black">{Math.ceil(getSentencesCount(standardizedScript || rawTranscript) / dialogueGroupSize)} phân cảnh</strong>.
                                  </p>
                                  {promptsFocus === "image" ? (
                                    <div className="bg-red-50 text-red-700 rounded-lg p-2 border border-red-100 font-semibold text-[9.5px] leading-relaxed">
                                      🔥 <strong>Chế độ Tạo Ảnh Đơn:</strong> Phù hợp để lấy nhiều ảnh đẹp nhất! AI được chỉ thị tuyệt đối không gộp chung nghĩa mà bắt buộc phải tách các câu dài, nhiều vế thành <strong>2 đến 3 prompt vẽ chi tiết độc lập</strong>. Số lượng prompt ảnh thu được sẽ nhiều hơn số câu thoại.
                                    </div>
                                  ) : (
                                    <div className="bg-slate-50 text-slate-600 rounded-lg p-2 border border-slate-150/50 font-semibold text-[9.5px] leading-relaxed">
                                      🎬 <strong>Chế độ Tạo Video:</strong> Tối ưu hóa số lượng prompt ở mức tối giản (trung bình đúng 1 prompt ảnh cho mỗi phân cảnh/câu thoại) giúp đồng bộ khớp thời gian khớp lời đọc, hạn chế dư thừa ảnh gây loãng mạch câu chuyện.
                                    </div>
                                  )}
                                  <div className="text-[9px] text-slate-400 mt-1 italic">
                                    * Toàn bộ kịch bản vẽ sẽ được AI xử lý tuần tự theo từng cụm nhỏ nhằm bảo toàn diện mạo nhân vật & bối cảnh bền vững nhất.
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p>👉 AI sẽ tự quét nội dung kịch bản để phân nhóm từng đoạn có ý nghĩa trọn vẹn nhất để vẽ. Số lượng prompt do AI tự quyết định linh động.</p>
                                  {promptsFocus === "image" ? (
                                    <div className="bg-red-50 text-red-700 rounded-lg p-2 border border-red-100 font-semibold text-[9.5px] leading-relaxed">
                                      🔥 <strong>Chế độ Tạo Ảnh Đơn:</strong> Các phân cảnh do AI chọn sẽ được tối ưu tăng cường số lượng prompt vẽ chi tiết cho từng ý nhỏ trong phân cảnh đó.
                                    </div>
                                  ) : (
                                    <div className="bg-slate-50 text-slate-600 rounded-lg p-2 border border-slate-150/50 font-semibold text-[9.5px] leading-relaxed">
                                      🎬 <strong>Chế độ Tạo Video:</strong> Mỗi phân cảnh tự chia của AI sẽ có đúng 1 prompt ảnh để lắp ráp dòng thời gian mượt mọc.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* YÊU CẦU SỬA PROMPT THEO MONG MUỐN */}
                  <div className="bg-orange-50/25 border border-orange-200/60 rounded-xl p-3.5 space-y-2 shadow-3xs my-2.5">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-orange-600 animate-pulse" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        ✨ Yêu cầu AI điều chỉnh prompt theo ý muốn (Optional)
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-medium">
                      Điền bất kỳ yêu cầu chỉnh sửa đặc biệt nào (Ví dụ: "Đổi bối cảnh thành thành phố tương lai đầy ánh đèn neon", "Thêm hiệu ứng tuyết rơi lấp lánh", "Nhân vật nam chính mặc áo khoác đỏ"). AI sẽ đồng bộ và liên kết tất cả các prompt từ đầu đến cuối một cách nhất quán!
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={storyboardEditRequest}
                        onChange={(e) => setStoryboardEditRequest(e.target.value)}
                        placeholder="Ví dụ: Thay bối cảnh từ rừng câu sang thành phố tương lai hư ảo nghệ thuật cyberpunk..."
                        className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-red-500 focus:border-red-550 focus:outline-none placeholder-slate-400 text-slate-850 shadow-3xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleGenerateStoryboard();
                          }
                        }}
                      />
                      {storyboardEditRequest && (
                        <button
                          onClick={() => setStoryboardEditRequest("")}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-extrabold px-3 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95"
                          title="Xóa yêu cầu"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>

                  {/* TÙY CHỌN CHỈ TÁI TẠO PROMPT ẢNH */}
                  {storyboardData && storyboardData.scenes && storyboardData.scenes.length > 0 && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-indigo-50/40 border border-indigo-150 rounded-xl my-2.5 text-left transition-all hover:bg-indigo-50/60">
                      <input
                        type="checkbox"
                        id="regeneratePromptsOnly"
                        checked={regeneratePromptsOnly}
                        onChange={(e) => setRegeneratePromptsOnly(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-350 rounded focus:ring-indigo-500 cursor-pointer mt-0.5"
                      />
                      <label htmlFor="regeneratePromptsOnly" className="cursor-pointer select-none space-y-0.5 flex-1">
                        <div className="text-xs font-black text-indigo-950 uppercase tracking-tight flex items-center gap-1.5">
                          🔄 CHỈ TÁI TẠO PROMPT - GIỮ NGUYÊN PHÂN CẢNH & LỜI THOẠI
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal font-medium">
                          Tích chọn để giữ nguyên 100% cấu trúc chia cảnh, lời thoại gốc, lời thoại con và mô tả phân cảnh hiện tại. AI chỉ viết lại phần prompt tiếng Anh và nhãn tiếng Việt theo mô tả style, nhân vật hoặc yêu cầu điều chỉnh ở trên.
                        </p>
                      </label>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateStoryboard}
                      disabled={storyboardLoading}
                      className="flex-1 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 disabled:bg-slate-300 text-white font-black py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-99 shadow-3xs"
                    >
                      {storyboardLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Đang tạo tự động {isHighDensity ? `${targetPromptsCount} prompts cao mật độ` : "phân cảnh và prompts"} theo quy trình tuần tự liên kết...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          {isHighDensity ? (
                            `TẠO PROMPT CAO MẬT ĐỘ: ${targetPromptsCount} HÌNH ẢNH DỌC THEO CÂU THOẠI`
                          ) : (
                            `Tự Động Sinh Phân Cảnh & Prompts Ảnh (${scenesCount} cảnh x ${promptsPerScene} prompts)`
                          )}
                        </>
                      )}
                    </button>

                    {storyboardLoading && (
                      <button
                        type="button"
                        onClick={() => handleCancelStep("storyboard")}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <span>⏹️</span> Dừng
                      </button>
                    )}
                  </div>
                </div>

                {/* SƠ ĐỒ PHÂN CẢNH SINH RA */}
                {storyboardData && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                          📋 Sơ Đồ Storyboard Phân Phối Chi Tiết:
                        </span>
                        <span className="bg-red-100 text-red-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          {storyboardData.scenes?.length || 0} cảnh / {storyboardData.scenes?.reduce((acc, curr) => acc + (curr.imagePrompts?.length || 0), 0) || 0} prompts
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Bộ Chọn Hiển Thị Ngôn Ngữ */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300">
                          <span className="text-[9.5px] font-extrabold text-slate-400 px-1 uppercase tracking-tight">Hiển thị:</span>
                          <button
                            type="button"
                            onClick={() => setStoryboardViewLang("vi")}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              storyboardViewLang === "vi" ? "bg-red-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Việt 🇻🇳
                          </button>
                          <button
                            type="button"
                            onClick={() => setStoryboardViewLang("en")}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              storyboardViewLang === "en" ? "bg-red-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Anh 🇺🇸
                          </button>
                          <button
                            type="button"
                            onClick={() => setStoryboardViewLang("both")}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              storyboardViewLang === "both" ? "bg-red-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                            title="Hiển thị song hành cả tiếng Anh và tiếng Việt"
                          >
                            Song Ngữ 🌐
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <select
                            id="target-lang-select"
                            value={targetTranslationLang}
                            onChange={(e) => setTargetTranslationLang(e.target.value as "vi" | "en")}
                            className="bg-white text-slate-800 border border-slate-300 rounded-lg px-2 py-1.5 text-[10.5px] font-bold cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          >
                            <option value="vi">Sang Tiếng Việt 🇻🇳</option>
                            <option value="en">Sang Tiếng Anh 🇺🇸</option>
                          </select>
                          <button
                            onClick={() => handleTranslateStoryboard(targetTranslationLang)}
                            disabled={translatingLanguage}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10.5px] font-bold font-sans transition-all active:scale-95 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white shadow-xs disabled:opacity-50"
                            title="Dịch chuyển ngôn ngữ kịch bản thoại đồng bộ cực nhanh mà giữ nguyên 100% prompt vẽ tranh tiếng Anh và cấu trúc storyboard"
                          >
                            {translatingLanguage ? (
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <span>🔄 Dịch</span>
                            )}
                          </button>
                        </div>

                        <button
                          onClick={handleCopyAllPrompts}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold font-sans transition-all active:scale-95 cursor-pointer ${
                            copiedAll 
                              ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xs" 
                              : "bg-slate-600 hover:bg-slate-700 text-white shadow-xs"
                          }`}
                          title="Chỉ sao chép toàn bộ prompt văn bản tiếng Anh để dán thẳng vào các công cụ vẽ hàng loạt"
                        >
                          {copiedAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedAll ? "Đã copy!" : "Chỉ Copy Prompt Ảnh"}
                        </button>

                        <button
                          onClick={handleCopyAllPromptsFormatted}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10.5px] font-bold font-sans transition-all active:scale-95 cursor-pointer ${
                            copiedFormatted 
                              ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xs" 
                              : "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                          }`}
                          title="Sao chép toàn kịch bản phân cảnh thoại, phân bố thời gian, kèm các link prompt minh họa đầy đủ cấu trúc"
                        >
                          {copiedFormatted ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />}
                          {copiedFormatted ? "Đã Sao Chép!" : "Copy Phân Cảnh & Prompts 💎"}
                        </button>
                      </div>
                    </div>

                    {/* BỘ KHUNG SAO CHÉP PROMPT THEO SỐ LƯỢNG / PHẠM VI TÙY CHỌN */}
                    {(() => {
                      const totalPromptsAvailable = storyboardData?.scenes?.reduce((acc, curr) => acc + (curr.imagePrompts?.length || 0), 0) || 0;
                      return (
                        <div className="bg-gradient-to-br from-slate-50 to-rose-50/10 border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-3xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1 px-1.5 bg-red-100 text-red-700 rounded-lg text-[10px] font-black">
                                ⚡ BỘ CÔNG CỤ SAO CHÉP
                              </span>
                              <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight">
                                Copy Prompt Vẽ Ảnh Theo Số Lượng Linh Hoạt
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
                              Tổng có: <strong className="text-red-650">{totalPromptsAvailable} prompts</strong>
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setCopyQtyMode("count")}
                              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                copyQtyMode === "count"
                                  ? "bg-slate-800 text-white shadow-3xs"
                                  : "bg-white text-slate-600 hover:text-slate-800 border border-slate-200"
                              }`}
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              Copy N Prompt Đầu Tiên
                            </button>
                            <button
                              type="button"
                              onClick={() => setCopyQtyMode("range")}
                              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                copyQtyMode === "range"
                                  ? "bg-slate-800 text-white shadow-3xs"
                                  : "bg-white text-slate-600 hover:text-slate-800 border border-slate-200"
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Copy Khoảng Chỉ Định (Ví dụ: Từ 5 đến 15)
                            </button>
                          </div>

                          {copyQtyMode === "count" ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-bold mr-1">Chọn nhanh số lượng:</span>
                                {[5, 10, 15, 20, 30, 50, totalPromptsAvailable].filter(n => n <= totalPromptsAvailable).map((num, idx, arr) => {
                                  // Tránh trùng lặp nếu tổng số bằng đúng một mốc trước đó
                                  if (num === totalPromptsAvailable && arr.indexOf(num) !== idx) return null;
                                  return (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setCopyQtyCount(num)}
                                      className={`px-2 py-1 text-[9.5px] font-bold rounded-md transition-all cursor-pointer ${
                                        copyQtyCount === num
                                          ? "bg-red-50 text-red-700 border border-red-200 font-extrabold"
                                          : "bg-white text-slate-500 hover:text-slate-800 border border-slate-200"
                                      }`}
                                    >
                                      {num === totalPromptsAvailable ? `Tất cả (${num})` : `${num} prompt`}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-150/80">
                                <span className="text-[10px] font-black text-slate-700 shrink-0">Tài chỉnh số lượng:</span>
                                <input
                                  type="range"
                                  min="1"
                                  max={totalPromptsAvailable}
                                  value={copyQtyCount}
                                  onChange={(e) => setCopyQtyCount(Number(e.target.value))}
                                  className="flex-1 accent-red-650 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                                />
                                <span className="text-xs font-black text-red-600 min-w-[55px] text-right bg-red-50/50 px-2 py-0.5 rounded border border-red-100/40">
                                  {copyQtyCount} / {totalPromptsAvailable}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-150/80">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-slate-700">Sao chép từ Prompt số:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max={totalPromptsAvailable}
                                    value={copyQtyStart}
                                    onChange={(e) => {
                                      const val = Math.max(1, Math.min(totalPromptsAvailable, Number(e.target.value)));
                                      setCopyQtyStart(val);
                                    }}
                                    className="w-16 text-center text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-red-500"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-slate-700">đến Prompt số:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max={totalPromptsAvailable}
                                    value={copyQtyEnd}
                                    onChange={(e) => {
                                      const val = Math.max(1, Math.min(totalPromptsAvailable, Number(e.target.value)));
                                      setCopyQtyEnd(val);
                                    }}
                                    className="w-16 text-center text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-red-500"
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium ml-auto">
                                  (Phạm vi khả dụng: 1 - {totalPromptsAvailable})
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-4 border-t border-slate-200/50 pt-2.5">
                            <p className="text-[9.5px] text-slate-400 leading-tight">
                              💡 Sao chép nhanh cấu trúc prompt tiếng Anh thuần khiết giúp bạn đưa sang Midjourney, Leonardo, Dreamina sinh ảnh hàng loạt nhanh gọn mà không sợ bị quá tải bối cảnh.
                            </p>
                            <button
                              type="button"
                              onClick={handleCopyPromptsByQty}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-3xs shrink-0 ${
                                copiedKey === "qtyPromptCopy"
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-red-600 text-white hover:bg-red-700"
                              }`}
                            >
                              {copiedKey === "qtyPromptCopy" ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  ĐÃ SAO CHÉP XONG!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  {copyQtyMode === "count" 
                                    ? `SAO CHÉP ĐÚNG ${copyQtyCount} PROMPTS` 
                                    : `SAO CHÉP TỪ PROMPT ${copyQtyStart} ĐẾN ${copyQtyEnd}`}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 🔮 SỬA PROMPT CHỈ ĐỊNH BẰNG AI */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/10 border border-indigo-200 rounded-xl p-4 space-y-3.5 shadow-3xs text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            🔮 AI RE-WRITE SPECIFIC PROMPTS
                          </span>
                          <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight">
                            Sửa Prompt Theo Mã Số Chỉ Định Bằng AI
                          </span>
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
                          Giữ nguyên kịch bản cũ, chỉ sửa prompt ảnh
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Mã số Prompt cần sửa (ví dụ: P12.1 hoặc P12.1, P12.2):</label>
                          <input
                            type="text"
                            value={selectedPromptCodesForEdit}
                            onChange={(e) => setSelectedPromptCodesForEdit(e.target.value)}
                            placeholder="Nhập mã ví dụ: P12.1, P12.2"
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-700 font-mono font-bold"
                          />
                        </div>
                        <div className="md:col-span-8 space-y-1">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Yêu cầu chỉnh sửa chi tiết của bạn cho các prompt này:</label>
                          <input
                            type="text"
                            value={specificEditInstructions}
                            onChange={(e) => setSpecificEditInstructions(e.target.value)}
                            placeholder="Ví dụ: Đổi bối cảnh thành trời bão tuyết âm u, nhân vật mặc áo khoác dày, nét mặt kinh hoàng"
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleRewriteSpecificPrompts();
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-t border-indigo-100/55 pt-2.5">
                        <p className="text-[9.5px] text-slate-400 leading-tight">
                          💡 Tính năng này giúp bạn tinh chỉnh chính xác các prompt bị lỗi hoặc chưa đúng ý (ví dụ: bối cảnh, hành động nhân vật) mà không làm ảnh hưởng đến các phân cảnh khác đã được chốt từ trước.
                        </p>
                        <button
                          type="button"
                          onClick={handleRewriteSpecificPrompts}
                          disabled={rewriteSpecificPromptsLoading}
                          className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-3xs shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                        >
                          {rewriteSpecificPromptsLoading ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              ĐANG CẬP NHẬT...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              AI SỬA PROMPT CHỈ ĐỊNH
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {storyboardData.scenes?.map((scene, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3 hover:border-slate-300 transition-all">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-extrabold text-xs text-red-600">Phân cảnh #{scene.sceneNumber}</span>
                            <span className="bg-slate-100 text-slate-500 font-mono text-[9px] px-2 py-0.5 rounded font-bold">{scene.timeSegment}</span>
                          </div>

                          {/* Lời thoại phân cảnh */}
                          <div className="space-y-1.5">
                            {storyboardViewLang === "both" ? (
                              <div className="grid grid-cols-1 gap-2 border-b border-slate-100 pb-2 mb-2">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                                    <span>🇻🇳</span> Lời đọc tiếng Việt (Cho phép sửa):
                                  </span>
                                  <textarea
                                    rows={2}
                                    value={scene.text_vi || scene.text || ""}
                                    onChange={(e) => handleUpdateSceneText(i, e.target.value, "vi")}
                                    className="w-full text-xs text-slate-650 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-red-500/20 focus:border-red-500 font-sans italic leading-relaxed focus:outline-none resize-y"
                                    placeholder="Kịch bản tiếng Việt..."
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                                    <span>🇺🇸</span> Lời đọc tiếng Anh (Cho phép sửa):
                                  </span>
                                  <textarea
                                    rows={2}
                                    value={scene.text_en || scene.text || ""}
                                    onChange={(e) => handleUpdateSceneText(i, e.target.value, "en")}
                                    className="w-full text-xs text-slate-650 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-red-500/20 focus:border-red-500 font-sans italic leading-relaxed focus:outline-none resize-y"
                                    placeholder="Kịch bản tiếng Anh..."
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                  {storyboardViewLang === "vi" ? "🇻🇳 Lời đọc tiếng Việt (Cho phép sửa):" : "🇺🇸 Lời đọc tiếng Anh (Cho phép sửa):"}
                                </span>
                                <textarea
                                  rows={2}
                                  value={storyboardViewLang === "vi" ? (scene.text_vi || scene.text) : (scene.text_en || scene.text)}
                                  onChange={(e) => handleUpdateSceneText(i, e.target.value, storyboardViewLang)}
                                  className="w-full text-xs text-slate-650 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-red-500/20 focus:border-red-500 font-sans italic leading-relaxed focus:outline-none resize-y"
                                  placeholder="Kịch bản thoại phân cảnh..."
                                />
                              </div>
                            )}
                          </div>

                          {/* Mô tả hình ảnh & prompts vẽ */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mô tả hình ảnh & Prompts vẽ (Cho phép sửa):</span>
                            <div className="space-y-3">
                              {scene.imagePrompts?.map((p, pi) => (
                                <div key={pi} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs space-y-1.5 shadow-inner">
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-red-50 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-200 shrink-0">{p.code}</span>
                                    <input
                                      type="text"
                                      value={p.vietnameseLabel}
                                      onChange={(e) => handleUpdatePromptValue(i, pi, "vietnameseLabel", e.target.value)}
                                      className="flex-1 font-bold text-slate-700 text-[11px] bg-white border border-slate-200 rounded px-2 py-0.5 focus:ring-1 focus:ring-red-500/20 focus:outline-none"
                                      placeholder="Mô tả tiếng Việt..."
                                    />
                                  </div>
                                  
                                  {/* Prompt AI tiếng Anh gốc giữ nguyên không dịch */}
                                  <textarea
                                    rows={2}
                                    value={p.englishPrompt}
                                    onChange={(e) => handleUpdatePromptValue(i, pi, "englishPrompt", e.target.value)}
                                    className="w-full text-slate-500 font-mono text-[10px] leading-normal bg-white p-2 rounded border border-slate-250 focus:ring-1 focus:ring-red-500/20 focus:border-red-500 focus:outline-none resize-y"
                                    placeholder="English prompt cho Imagen/Midjourney..."
                                  />

                                  {/* Câu thoại băm voice tương ứng */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Câu thoại tương ứng băm voice:</span>
                                    {storyboardViewLang === "vi" && (
                                      <input
                                        type="text"
                                        value={p.subText_vi || p.subText || ""}
                                        onChange={(e) => handleUpdatePromptValue(i, pi, "subText_vi", e.target.value)}
                                        className="w-full text-slate-600 bg-white p-1.5 rounded border border-slate-200 text-[10.5px] focus:ring-1 focus:ring-red-500/20 focus:outline-none font-medium italic"
                                        placeholder="Câu thoại tiếng Việt tương ứng..."
                                      />
                                    )}
                                    {storyboardViewLang === "en" && (
                                      <input
                                        type="text"
                                        value={p.subText_en || p.subText || ""}
                                        onChange={(e) => handleUpdatePromptValue(i, pi, "subText_en", e.target.value)}
                                        className="w-full text-slate-600 bg-white p-1.5 rounded border border-slate-200 text-[10.5px] focus:ring-1 focus:ring-red-500/20 focus:outline-none font-medium italic"
                                        placeholder="Câu thoại tiếng Anh tương ứng..."
                                      />
                                    )}
                                    {storyboardViewLang === "both" && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        <div>
                                          <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Việt 🇻🇳:</span>
                                          <input
                                            type="text"
                                            value={p.subText_vi || p.subText || ""}
                                            onChange={(e) => handleUpdatePromptValue(i, pi, "subText_vi", e.target.value)}
                                            className="w-full text-slate-600 bg-white p-1.5 rounded border border-slate-200 text-[10px] focus:ring-1 focus:ring-red-500/20 focus:outline-none font-medium italic"
                                            placeholder="Tiếng Việt..."
                                          />
                                        </div>
                                        <div>
                                          <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Anh 🇺🇸:</span>
                                          <input
                                            type="text"
                                            value={p.subText_en || p.subText || ""}
                                            onChange={(e) => handleUpdatePromptValue(i, pi, "subText_en", e.target.value)}
                                            className="w-full text-slate-600 bg-white p-1.5 rounded border border-slate-200 text-[10px] focus:ring-1 focus:ring-red-500/20 focus:outline-none font-medium italic"
                                            placeholder="Tiếng Anh..."
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      setActiveStep("04_image");
                      playSound("click");
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 tracking-tight active:scale-95 transition-all cursor-pointer"
                  >
                    Bước Tiếp Theo: Tạo Ảnh Bằng AI
                    <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- BƯỚC 04: TẠO ẢNH STUDIO ---------------- */}
            {activeStep === "04_image" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                <PipelineStep1
                  projectDir={projectDir}
                  storyboardData={storyboardData}
                  imageStyle={imageStyle}
                  telegramToken={telegramToken}
                  telegramChatId={telegramChatId}
                  generatedImages={generatedImages}
                  setGeneratedImages={setGeneratedImages}
                  onComplete={() => setStep4Done(true)}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setActiveStep("04_voice")}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 tracking-tight active:scale-95 transition-all cursor-pointer"
                  >
                    Tiến Hành Tạo Giọng Đọc

                    <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- BƯỚC 05: TẠO GIỌNG ĐỌC BẰNG GOOGLE AI ---------------- */}
            {activeStep === "05" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6 font-sans">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <Volume2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">BƯỚC 5: TẠO GIỌNG ĐỌC (GOOGLE AI TTS STUDIO)</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Chuyển văn bản thành tệp thuyết minh audio chất lượng cao sử dụng động cơ AI <b>gemini-2.5-flash</b> hoặc <b>gemini-2.0-flash-tts-preview</b> hoàn toàn tự động.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bản kịch bản */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 block uppercase tracking-wider">KỊCH BẢN ĐÃ CHUẨN HÓA BƯỚC 1:</span>
                      {standardizedScript && (
                        <button 
                          onClick={() => triggerCopy("copySt", standardizedScript)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === "copySt" ? "Đã copy!" : "Copy Kịch Bản Sạch"}
                        </button>
                      )}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 leading-relaxed font-mono max-h-72 overflow-y-auto shadow-inner whitespace-pre-wrap">
                      {standardizedScript ? standardizedScript : "Chưa có kịch bản đã chuẩn hóa. Vui lòng quay lại Bước 1 dán kịch bản gốc."}
                    </div>
                  </div>

                  {/* Cột thiết lập giọng đọc AI Studio */}
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 space-y-4">
                      <span className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">Lựa Chọn Giọng Đọc Google:</span>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Aoede"].map((voice) => (
                          <div
                            key={voice}
                            onClick={() => setSelectedVoice(voice)}
                            className={`p-2.5 rounded-lg border text-center text-xs cursor-pointer font-bold transition-all active:scale-95 ${
                              selectedVoice === voice 
                                ? "bg-red-50 border-red-500 text-red-700 font-black shadow-3xs" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            🗣️ {voice}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleGenerateVoice}
                          disabled={voiceGenerating || (!standardizedScript && !rawTranscript)}
                          className={`flex-1 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                            voiceGenerating 
                              ? "bg-slate-300 text-slate-400 cursor-not-allowed" 
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          {voiceGenerating ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Đang kết nối Google AI TTS...
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4" />
                              Phát Thuyết Minh Giọng AI Studio
                            </>
                          )}
                        </button>

                        {voiceGenerating && (
                          <button
                            type="button"
                            onClick={() => handleCancelStep("voice")}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <span>⏹️</span> Dừng
                          </button>
                        )}
                      </div>

                      {/* Trực quan âm thanh vẽ sóng */}
                      {voiceGenerating && (
                        <div className="flex items-center justify-center gap-1.5 py-2">
                          <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="w-1.5 h-10 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="w-1.5 h-12 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          <span className="w-1.5 h-8 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "450ms" }}></span>
                          <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></span>
                        </div>
                      )}

                      {generatedAudio && (
                        <div className="pt-4 border-t border-slate-200 space-y-3">
                          <span className="text-xs font-bold text-slate-700 block">🎧 Nghe thử giọng đọc đã thâu:</span>
                          <audio
                            src={generatedAudio}
                            controls
                            className="w-full h-11 border border-slate-250 rounded-xl"
                          />
                          <a
                            href={generatedAudio}
                            download={`thuyet-minh-google-ai-${selectedVoice}.wav`}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Tải Tệp Thuyết Minh (WAV) Về Máy
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl">
                      <span className="text-xs font-bold text-red-900 block mb-1">💡 Mẹo xuất File & Đồng bộ:</span>
                      <p className="text-[11px] text-red-800 leading-relaxed font-medium">
                        Bạn có thể tải tệp âm thanh thuyết minh dạng WAV chất lượng cao để kéo thẳng vào CapCut để đối chiếu đồng bộ hoàn hảo với dòng ảnh Imagen 3 vừa thiết kế ở Bước 4!
                      </p>
                    </div>
                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3.5 text-xs text-emerald-800 font-extrabold flex items-center gap-2 shadow-2xs w-full justify-center">
                    <span>🎉</span>
                    <span>Quy trình hoàn chỉnh! Bạn đã hoàn thành tất cả các bước chuẩn hóa, tạo phân cảnh kịch bản bám sát câu thoại thành công rực rỡ!</span>
                  </div>
                </div>

              </div>
            )}

            {/* ---------------- BƯỚC 06: DỰNG BIÊN TẬP VIDEO ---------------- */}
            {activeStep === "06" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <Video className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">BƯỚC 6: DỰNG BIÊN TẬP VIDEO (CAPCUT / PREMIERE)</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Ghép nối file giọng đọc thuyết minh cùng dòng cảnh ảnh trực quan đã chuẩn hóa số để hoàn chỉnh bản thô xuất gửi người xem.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">🛠️ Check-list Biên Tập Viên YouTube Pro 2026:</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-150 space-y-2">
                        <span className="text-xs font-extrabold text-slate-800 block">1. Nhập liệu tệp ngăn nắp:</span>
                        <p className="text-[11.5px] text-slate-500 leading-normal">
                          Hãy nhét toàn bộ ảnh vẽ AI theo trật tự thư mục. Ráp đúng giọng thuyết minh thâu vào Timeline.
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-150 space-y-2">
                        <span className="text-xs font-extrabold text-slate-800 block">2. Hiệu ứng phóng to/thu nhỏ (Zoom in/out):</span>
                        <p className="text-[11.5px] text-slate-500 leading-normal">
                          Đừng để ảnh tĩnh đơ cứng. Bật chức năng <span className="font-bold text-red-600">Ken Burns</span> hoặc Keyframe chuyển động chậm rãi phóng to để kích hoạt độ sâu rạp hoạt hình.
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-150 space-y-2">
                        <span className="text-xs font-extrabold text-slate-800 block">3. Tạo phụ đề động (Auto-Captions):</span>
                        <p className="text-[11.5px] text-slate-500 leading-normal">
                          Trên CapCut có tính năng tạo phụ đề tự động tiếng Anh/tiếng Việt. Hãy phóng to kích thước chữ, sử dụng font đậm như Montserrat/Futura, rải màu vàng-trắng tương phản.
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                        <span className="text-xs font-extrabold text-slate-800 block">4. Nhạc nền (Background Music):</span>
                        <p className="text-[11.5px] text-slate-500 leading-normal">
                          Lựa chọn các bản nhạc không bản quyền trong thư viện âm nhạc Youtube hoặc nhạc không lời rùng rợn/ambient nếu làm chủ đề kỳ quan, âm mưu, bí tích.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* TRÌNH ĐỒNG BỘ HOÁ TIMELINE CAPCUT TỰ ĐỘNG */}
                  <div className="mt-4">
                    <CapCutSynchronizer storyboard={storyboardData} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3.5 text-xs text-emerald-800 font-extrabold flex items-center gap-2 shadow-2xs w-full justify-center">
                    <span>🎉</span>
                    <span>Quy trình hoàn chỉnh! Bạn đã hoàn thành tất cả các bước chuẩn hóa, tạo phân cảnh kịch bản và đồng bộ CapCut thành công rực rỡ!</span>
                  </div>
                </div>

              </div>
            )}

            {/* ---------------- BƯỚC 07: TỐI ƯU SEO & CTR ---------------- */}
            {activeStep === "07" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">BƯỚC 6: VIẾT SEO & ĐẶT TÊN VIDEO XUẤT</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Giúp thuật toán phân bổ chính xác tệp người nghe dựa vào từ khóa đích, đồng thời vẽ ý tưởng thumbnail giật gân, khơi mào kích thích click.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Cột 1: Thông tin Kênh & Từ Khóa */}
                    <div className="space-y-3">
                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                          <span>📺 Tên Kênh YouTube:</span>
                        </label>
                        <input
                          type="text"
                          value={channelName}
                          onChange={(e) => setChannelName(e.target.value)}
                          placeholder="Ví dụ: Bí Ẩn Nhân Loại"
                          className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                          <span>🔑 Từ khóa mục tiêu (SEO):</span>
                        </label>
                        <input
                          type="text"
                          value={targetKeywords}
                          onChange={(e) => setTargetKeywords(e.target.value)}
                          data-seo-keyword="true"
                          aria-label="Từ khóa mục tiêu"
                          placeholder="Cổ tích kinh dị, tra tấn trung cổ, lịch sử..."
                          className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Cột 2: Lựa chọn chữ trên Thumbnail */}
                    <div className="space-y-3">
                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-slate-700 block">💬 Chữ trên Thumbnail:</label>
                        <div className="space-y-2 pb-3 mb-3 border-b border-slate-100">
                          <span className="text-[11px] font-bold text-slate-700 block">Cấu trúc mô tả video</span>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setSeoIncludeChapters(!seoIncludeChapters)} className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-colors ${seoIncludeChapters ? "bg-red-50 border-red-300 text-red-700" : "bg-white border-slate-200 text-slate-600"}`}>
                              {seoIncludeChapters ? "✓ Có chia phần" : "Chia phần video"}
                            </button>
                            <button type="button" onClick={() => setSeoIncludeTracklist(!seoIncludeTracklist)} style={{ display: "none" }} className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-colors ${seoIncludeTracklist ? "bg-red-50 border-red-300 text-red-700" : "bg-white border-slate-200 text-slate-600"}`}>
                              {seoIncludeTracklist ? "✓ Có tracklist" : "Thêm tracklist"}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">Chỉ bật khi video thực sự có các phần hoặc danh sách bài/đoạn cần hiển thị.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setThumbHasText(true)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer h-10 ${
                              thumbHasText 
                                ? "bg-red-50 border-red-200 text-red-700 shadow-2xs font-extrabold" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span>📝 Có Chữ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbHasText(false)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer h-10 ${
                              !thumbHasText 
                                ? "bg-red-50 border-red-200 text-red-700 shadow-2xs font-extrabold" 
                                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                            }`}
                          >
                            <span>🖼️ Không Chữ</span>
                          </button>
                        </div>
                      </div>

                      {thumbHasText && (
                        <div className="space-y-1 text-xs animate-fadeIn">
                          <label className="font-semibold text-slate-600 block">Nhập chữ hiển thị cụ thể (Tùy chọn):</label>
                          <input
                            type="text"
                            value={thumbCustomText}
                            onChange={(e) => setThumbCustomText(e.target.value)}
                            placeholder="Ví dụ: KẺ SĂN ĐÊM, QUỶ KHÔNG ĐẦU..."
                            className="w-full text-[11px] px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Cột 3: Phong cách (Style) ảnh Thumbnail */}
                    <div className="space-y-3">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-700 block">🎨 Phong cách ảnh bìa (Style):</label>
                          <button
                            type="button"
                            onClick={() => {
                              setThumbStyleAnalysis(imageStyle);
                              playSound("success");
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                            title="Lấy trực tiếp từ cấu hình phong cách của Bước 2"
                          >
                            🔄 Lấy từ Bước 2
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={imageStyle}
                          readOnly
                          placeholder="Nhập style (Ví dụ: cinematic dark, hyper-detailed oil painting...)"
                          className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 shadow-2xs outline-none resize-none"
                        />
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-slate-700 block">Hoặc lấy style từ ảnh mẫu:</label>
                        {!thumbStyleImage ? (
                          <label className="border border-dashed border-slate-300 rounded-xl p-2.5 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-slate-500 h-10">
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-[11px]">Tải ảnh mẫu lên</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    const base64Str = event.target?.result as string;
                                    setThumbStyleImage(base64Str);
                                    await analyzeThumbStyle(base64Str);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl h-10">
                            <img
                              src={thumbStyleImage}
                              alt="Style sample"
                              className="w-7 h-7 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider leading-none">Ảnh Style Đang Dùng:</span>
                              <span className="text-[10px] text-slate-600 truncate block font-medium">
                                {isAnalyzingThumbStyle ? "Đang phân tích..." : "Đã trích xuất style"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setThumbStyleImage(null);
                                setThumbStyleAnalysis("");
                              }}
                              className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                              title="Xóa ảnh mẫu"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nút sinh và tóm tắt */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-400">
                      💡 Mẹo: Nhấp vào <span className="font-semibold text-slate-650">🔄 Lấy từ Bước 2</span> để đồng bộ phong cách nghệ thuật đồng nhất xuyên suốt kịch bản.
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleGenerateSEO}
                        disabled={seoLoading}
                        className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-extrabold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer h-10 active:scale-95 shadow-xs"
                      >
                        {seoLoading ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Đang sinh...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-white" />
                            Tạo Bộ SEO Chi Tiết
                          </>
                        )}
                      </button>

                      {seoLoading && (
                        <button
                          type="button"
                          onClick={() => handleCancelStep("seo")}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 h-10 transition-all cursor-pointer"
                        >
                          ⏹️ Dừng
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {seoData && (
                  <div className="space-y-5">
                    
                    {/* Tiêu đề & mô tả */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">TIÊU ĐỀ VIDEO CLICKBAIT (HỖ TRỢ CHỈNH SỬA):</span>
                          <button 
                            onClick={() => triggerCopy("seoTitle", seoData.seoTitle)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                          >
                            {copiedKey === "seoTitle" ? "Đã copy!" : "Copy Tiêu Đề"}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={seoData.seoTitle}
                          onChange={(e) => {
                            setSeoData({ ...seoData, seoTitle: e.target.value });
                          }}
                          className="w-full text-xs font-bold text-red-650 text-red-600 bg-white p-3 border border-slate-150 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                        {seoData.titleOptions && seoData.titleOptions.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Phương án tiêu đề</span>
                            {seoData.titleOptions.slice(0, 4).map((title, index) => (
                              <div key={`${title}-${index}`} className="flex gap-2 items-start bg-white border border-slate-150 rounded-lg p-2">
                                <button type="button" onClick={() => setSeoData({ ...seoData, seoTitle: title })} className="flex-1 text-left text-[11px] text-slate-700 hover:text-red-600 leading-relaxed">
                                  {title}
                                </button>
                                <button type="button" onClick={() => triggerCopy(`seoTitleOption-${index}`, title)} className="text-slate-400 hover:text-blue-600" title="Sao chép tiêu đề">
                                  {copiedKey === `seoTitleOption-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-medium">Bạn có thể nhấp trực tiếp vào ô trên để chỉnh sửa lại tiêu đề cho vừa ý.</div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">BẢN MÔ TẢ TỐI ƯU HÓA TỪ KHÓA (HỖ TRỢ CHỈNH SỬA):</span>
                          <button 
                            onClick={() => triggerCopy("seoDesc", seoData.seoDescription)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                          >
                            {copiedKey === "seoDesc" ? "Đã copy!" : "Copy Mô Tả"}
                          </button>
                        </div>
                        <textarea
                          rows={4}
                          value={seoData.seoDescription}
                          onChange={(e) => {
                            setSeoData({ ...seoData, seoDescription: e.target.value });
                          }}
                          className="w-full text-xs bg-white p-3 border border-slate-150 rounded-xl font-sans leading-relaxed text-slate-600 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-y"
                        />
                      </div>

                    </div>

                    {/* Thẻ tags */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider border-b border-slate-150 pb-2">HỆ THỐNG THẺ TAGS PHÂN LOẠI (HỖ TRỢ CHỈNH SỬA):</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">1 Tối Ưu Chính:</span>
                          <input
                            type="text"
                            value={seoData.tags?.primaryKeyword || ""}
                            onChange={(e) => {
                              setSeoData({
                                ...seoData,
                                tags: { ...seoData.tags, primaryKeyword: e.target.value }
                              });
                            }}
                            className="w-full text-xs font-bold text-red-650 text-red-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 outline-none"
                          />
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">1 Tối Ưu Phụ:</span>
                          <input
                            type="text"
                            value={seoData.tags?.secondaryKeyword || ""}
                            onChange={(e) => {
                              setSeoData({
                                ...seoData,
                                tags: { ...seoData.tags, secondaryKeyword: e.target.value }
                              });
                            }}
                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 outline-none"
                          />
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">Thẻ Kênh:</span>
                          <input
                            type="text"
                            value={seoData.tags?.channelTag || ""}
                            onChange={(e) => {
                              setSeoData({
                                ...seoData,
                                tags: { ...seoData.tags, channelTag: e.target.value }
                              });
                            }}
                            className="w-full text-xs font-mono font-bold text-emerald-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 outline-none"
                          />
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">Tag Đối Thủ (Cách nhau bởi dấu phẩy):</span>
                          <input
                            type="text"
                            value={seoData.tags?.competitorTags?.join(", ") || ""}
                            onChange={(e) => {
                              setSeoData({
                                ...seoData,
                                tags: {
                                  ...seoData.tags,
                                  competitorTags: e.target.value.split(",").map(t => t.trim())
                                }
                              });
                            }}
                            className="w-full text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ý tưởng thumbnail */}
                    <div className="flex justify-end -mt-1">
                      <button
                        type="button"
                        onClick={() => triggerCopy("seoTags", [seoData.tags?.primaryKeyword, seoData.tags?.secondaryKeyword, seoData.tags?.channelTag, ...(seoData.tags?.competitorTags || [])].filter(Boolean).join(", "))}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        {copiedKey === "seoTags" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        Sao chép toàn bộ thẻ tag
                      </button>
                    </div>

                    {seoData.thumbnailConcept && (
                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-slate-200 space-y-4">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-amber-500" />
                          PHÁC THẢO Ý TƯỞNG THUMBNAIL (HỖ TRỢ CHỈNH SỬA TRỰC TIẾP):
                        </h4>

                        <div className="flex justify-end -mt-2">
                          <button
                            type="button"
                            onClick={() => triggerCopy("thumbnailPackage", `Ý tưởng ảnh bìa:\n${seoData.thumbnailConcept.visualIdea}\n\nChữ trên ảnh:\n${seoData.thumbnailConcept.thumbnailText}\n\nPrompt vẽ:\n${seoData.thumbnailConcept.imagePrompt}`)}
                            className="text-[11px] text-teal-300 hover:text-teal-100 font-bold flex items-center gap-1"
                          >
                            {copiedKey === "thumbnailPackage" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            Sao chép toàn bộ thumbnail
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                          <div className="md:col-span-4 space-y-1 bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                            <span className="text-amber-400/80 font-bold block mb-1">Ý tưởng dàn dựng ảnh:</span>
                            <textarea
                              rows={3}
                              value={seoData.thumbnailConcept.visualIdea}
                              onChange={(e) => {
                                setSeoData({
                                  ...seoData,
                                  thumbnailConcept: { ...seoData.thumbnailConcept, visualIdea: e.target.value }
                                });
                              }}
                              className="w-full text-xs bg-slate-950 text-slate-200 p-2 rounded-lg border border-slate-700 outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                            />
                          </div>

                          <div className="md:col-span-3 space-y-1 bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                            <span className="text-amber-400/80 font-bold block mb-1">Chữ đặt trên bìa:</span>
                            <input
                              type="text"
                              value={seoData.thumbnailConcept.thumbnailText}
                              onChange={(e) => {
                                setSeoData({
                                  ...seoData,
                                  thumbnailConcept: { ...seoData.thumbnailConcept, thumbnailText: e.target.value }
                                });
                              }}
                              className="w-full text-center text-xs font-extrabold text-white bg-red-650 bg-red-600 py-2.5 px-3 rounded-lg border border-red-500 uppercase tracking-tight outline-none focus:ring-1 focus:ring-red-400"
                            />
                            <div className="text-[10px] text-slate-400 text-center mt-1">Chỉnh sửa chữ trực tiếp tại đây!</div>
                          </div>

                          <div className="md:col-span-5 space-y-2 bg-slate-800 p-3.5 rounded-xl border border-slate-700 relative">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-amber-400/80 font-bold">Prompt Vẽ Thumbnail AI (English):</span>
                              <button
                                onClick={() => triggerCopy("thumbPrompt", seoData.thumbnailConcept.imagePrompt)}
                                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold"
                              >
                                {copiedKey === "thumbPrompt" ? "Đã Copy!" : "Copy Prompt"}
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={seoData.thumbnailConcept.imagePrompt}
                              onChange={(e) => {
                                setSeoData({
                                  ...seoData,
                                  thumbnailConcept: { ...seoData.thumbnailConcept, imagePrompt: e.target.value }
                                });
                              }}
                              className="w-full text-[11px] font-mono text-teal-300 bg-slate-950 p-2.5 rounded-lg border border-slate-700 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button 
                        onClick={() => setActiveStep("08")}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 tracking-tight active:scale-95 transition-all"
                      >
                        Chuyển Sang Bước 8: Đẩy Bình Luận Seeding
                        <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* ---------------- BƯỚC 08: SEEDING ĐẨY VIEW ---------------- */}
            {activeStep === "08" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">BƯỚC 8: SEEDING – ĐỂ LẠI BÌNH LUẬN ĐẨY VIEW & GIỮ CHÂN</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Sau khi xuất bản video, hãy dùng các tài khoản phụ để comment tạo điểm nhấn tranh luận khơi mào kích thích đáp lời, đẩy video vươn tầm đề xuất.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Các Mẫu Bình Luận Seeding Độc Lạ Đánh Đúng Tâm Lý Khách Hàng:</span>
                    {seoData?.seedingComments && (
                      <button
                        onClick={() => {
                          let txt = "";
                          seoData.seedingComments.forEach(c => {
                            txt += `[${c.accountType}]: "${c.commentText}"\n\n`;
                          });
                          triggerCopy("allSeeding", txt);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        {copiedKey === "allSeeding" ? "Đã copy toàn bộ!" : "Copy Tất Cả Comment"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seoData?.seedingComments ? (
                      seoData.seedingComments.map((comment, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 hover:shadow-2xs transition-all relative">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-tight">
                              {comment.accountType}
                            </span>
                            <button
                              onClick={() => triggerCopy(`seed-${index}`, comment.commentText)}
                              className="text-slate-400 hover:text-slate-700"
                              title="Sao Chép comment này"
                            >
                              {copiedKey === `seed-${index}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-650 leading-relaxed italic bg-white p-3 border border-slate-100 rounded-lg">
                            &quot;{comment.commentText}&quot;
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 italic">
                        Cần chạy &quot;Bước 7: Tạo Bộ SEO Chi Tiết&quot; ở trên trước để tự động sinh 4 kịch bản Seeding tranh luận ăn ý.
                      </div>
                    )}
                  </div>

                  <div className="bg-red-50/40 border border-red-100 p-4.5 rounded-xl space-y-2.5">
                    <span className="text-xs font-bold text-red-900 block uppercase">🛡️ Nguyên tắc vàng Seeding 2026:</span>
                    <ul className="list-disc list-inside text-xs text-red-800 leading-relaxed font-medium space-y-1">
                      <li>Không bao giờ bình luận hời hợt kiểu: &quot;Hay quá ad&quot;, &quot;Tuyệt quá&quot; để tránh làm giảm tương tác và không khơi được cuộc hội thoại.</li>
                      <li>Luôn đặt câu hỏi mở, hoặc khẳng định chắc nịt một quan điểm sai lệch tương đối để người đi ngang ghét bỏ quay lại phản pháo.</li>
                      <li>Bình luận tóm tắt mốc thời gian (timestamp) khoảnh khắc hay nhất trong video giúp níu chân tỉ lệ kéo lại xem.</li>
                    </ul>
                  </div>

                </div>

              </div>
            )}



            {/* ---------------- BƯỚC 05: TẠO VOICE AI33 ---------------- */}
            <div style={{ display: activeStep === "04_voice" ? 'block' : 'none' }}>
              <AI33VoiceStudio 
                defaultText={chosenHookText ? chosenHookText : standardizedScript || ""} 
                projectDir={projectDir}
                onAudioGenerated={(url) => { 
                  setStep5Done(!!url); 
                  setGeneratedAudio(url || ""); 
                }} 
              />
            </div>

            {/* ---------------- BƯỚC 06: AUDIO TIMELINE PRO (FFMPEG) ---------------- */}
            {activeStep === "05_audio" && (
              <AudioTimelinePro 
                projectDir={projectDir}
                storyboardData={storyboardData}
                seoTitle={seoData?.seoTitle}
                getAutoScriptPath={getRawScriptPath}
                onComplete={() => setStep6Done(true)}
              />
            )}


            {/* ---------------- THƯ VIỆN PROMPT MẪU CHUNG ---------------- */}
            {activeStep === "templates" && (
              <PromptTemplatesHub />
            )}

            {/* ---------------- QUY TRÌNH HOÀN CHỈNH COPIABLE ---------------- */}
            {activeStep === "workflow" && (
              <WorkflowGuideView />
            )}

            {/* ---------------- BÁO CÁO CHI TIẾT TỪNG BƯỚC HOẠT ĐỘNG ---------------- */}
            {activeStep === "report" && (
              <DetailedReportView 
                rawTranscript={rawTranscript}
                standardizedScript={standardizedScript}
                chosenHookText={chosenHookText}
                storyboardData={storyboardData}
                generatedAudio={generatedAudio}
                seoData={seoData}
                isPlayingAutoPipeline={isPlayingAutoPipeline}
                autoPipelineLogs={autoPipelineLogs}
                characterDescription={characterDescription}
                dialogueGroupSize={dialogueGroupSize}
                channelName={channelName}
                targetKeywords={targetKeywords}
                nicheCategory={nicheCategory}
                customKeyword={customKeyword}
                selectedVoice={selectedVoice}
                imageStyle={imageStyle}
              />
            )}

            {/* ---------------- CÀI ĐẶT (SETUP) ---------------- */}
            {activeStep === "setup" && (
              <SetupView />
            )}

          </div>

        </div>


      </main>

      <aside aria-label="Liên hệ VidiFlow" className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 xl:flex">
        <button
          type="button"
          title="Facebook VidiFlow"
          onClick={() => window.open("https://www.facebook.com/me/", "_blank", "noopener,noreferrer")}
          className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-lg shadow-blue-100 transition hover:scale-105 hover:bg-blue-600 hover:text-white"
        >
          <FacebookMark />
          <span className="pointer-events-none absolute right-14 hidden w-max rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white shadow-lg group-hover:block">Facebook</span>
        </button>
        <button
          type="button"
          title="Zalo 0976293994"
          onClick={() => window.open("https://zalo.me/0976293994", "_blank", "noopener,noreferrer")}
          className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-600 shadow-lg shadow-sky-100 transition hover:scale-105 hover:bg-sky-600 hover:text-white"
        >
          <ZaloMark />
          <span className="pointer-events-none absolute right-14 hidden w-max rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white shadow-lg group-hover:block">Zalo: 0976293994</span>
        </button>
        <button
          type="button"
          title="Telegram @leo4309"
          onClick={() => window.open("https://t.me/leo4309", "_blank", "noopener,noreferrer")}
          className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-600 shadow-lg shadow-cyan-100 transition hover:scale-105 hover:bg-cyan-600 hover:text-white"
        >
          <TelegramMark />
          <span className="pointer-events-none absolute right-14 hidden w-max rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white shadow-lg group-hover:block">Telegram: @leo4309</span>
        </button>
      </aside>

      {pipelineSuccessModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="pipeline-success-title" className="w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.36)]">
            <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-indigo-50 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                  <Check className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Tạo video tự động thành công</p>
                  <h3 id="pipeline-success-title" className="mt-1 text-xl font-black text-slate-900">Video đã hoàn tất</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">Tổng thời gian xử lý: <span className="font-black text-indigo-700">{formatPipelineDuration(pipelineSuccessModal.elapsedMs)}</span></p>
                </div>
              </div>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Dự án đã lưu</p>
                <p className="mt-1 break-all text-sm font-bold text-slate-800">{pipelineSuccessModal.projectPath}</p>
                <p className="mt-1 text-xs text-slate-500">Video: {pipelineSuccessModal.videoName}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => { setPipelineSuccessModal(null); setActiveStep("results"); }} className="group rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-left transition hover:border-indigo-400 hover:bg-indigo-100">
                  <span className="flex items-center gap-2 text-sm font-black text-indigo-800"><Video className="h-5 w-5" /> Xem video kết quả</span>
                  <span className="mt-2 block text-xs leading-relaxed text-slate-600">Mở mục Kết quả &amp; Theo dõi để xem và phát video hoàn chỉnh.</span>
                </button>
                <button type="button" onClick={() => { setPipelineSuccessModal(null); setActiveStep("seo"); }} className="group rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left transition hover:border-violet-400 hover:bg-violet-100">
                  <span className="flex items-center gap-2 text-sm font-black text-violet-800"><Search className="h-5 w-5" /> Xem SEO &amp; đăng tải</span>
                  <span className="mt-2 block text-xs leading-relaxed text-slate-600">Mở tiêu đề, mô tả, thumbnail và thông tin xuất bản đã tạo.</span>
                </button>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setPipelineSuccessModal(null)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {pipelineErrorModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div role="alertdialog" aria-modal="true" aria-labelledby="pipeline-error-title" className="w-full max-w-lg overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)]">
            <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-600">Quy trình chưa hoàn thành</p>
                  <h3 id="pipeline-error-title" className="mt-1 text-lg font-black text-slate-900">
                    {pipelineErrorModal.mode === "manual"
                      ? ({
                          1: "Lỗi khi tạo nội dung & kịch bản",
                          2: "Lỗi khi tạo phân cảnh & media",
                          3: "Lỗi khi tạo Voice, SEO & thumbnail",
                          4: "Lỗi khi render video cuối",
                        } as Record<number, string>)[pipelineErrorModal.stage || 1]
                      : "Lỗi khi tạo video tự động"}
                  </h3>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm font-semibold leading-relaxed text-slate-700">{pipelineErrorModal.message}</p>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                Dữ liệu đã tạo trước khi lỗi vẫn được giữ lại. Bạn có thể kiểm tra cấu hình, sửa phần liên quan và chạy lại mà không cần làm lại toàn bộ dự án.
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setPipelineErrorModal(null)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                Đóng
              </button>
              {pipelineErrorModal.mode === "auto" && (
                <button type="button" autoFocus onClick={() => {
                  setManualWorkflowStage(pipelineErrorModal.recoveryStage || 1);
                  setManualTwoStageReviewReady(true);
                  setActiveStep("manualpipeline");
                  setPipelineErrorModal(null);
                }} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700">
                  Kiểm tra &amp; chạy tiếp
                </button>
              )}
              {pipelineErrorModal.mode === "manual" && (
                <button type="button" autoFocus onClick={() => setPipelineErrorModal(null)} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700">
                  Đã hiểu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showProjectDataChoiceModal && pendingProjectFolder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={() => setShowProjectDataChoiceModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="project-data-choice-title" className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.34)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700"><FolderOpen className="h-5 w-5" /></div>
              <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700">THƯ MỤC ĐÃ CÓ DỮ LIỆU</p><h3 id="project-data-choice-title" className="mt-1 text-lg font-black text-slate-900">Bạn muốn dùng thư mục này thế nào?</h3></div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-slate-700">VidiFlow đã thấy script, media hoặc voice cũ trong thư mục này. Việc chọn thư mục không tự nạp hay xóa dữ liệu hiện tại.</p>
              <p className="mt-3 break-all rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs font-semibold text-indigo-800">{pendingProjectFolder}</p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setShowProjectDataChoiceModal(false); setPendingProjectFolder(""); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-100">Hủy</button>
              <button type="button" onClick={() => { useProjectDirectoryAsDestination(pendingProjectFolder); setShowProjectDataChoiceModal(false); setPendingProjectFolder(""); }} className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-black text-indigo-700 transition hover:bg-indigo-50">Chỉ dùng làm nơi lưu</button>
              <button type="button" onClick={async () => { const folder = pendingProjectFolder; setShowProjectDataChoiceModal(false); setPendingProjectFolder(""); await handleProjectDirChange(folder, true); }} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700">Nạp dữ liệu cũ</button>
            </div>
          </div>
        </div>
      )}

      {showProjectFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700"><FolderOpen className="h-5 w-5" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700">Thiếu thư mục dự án</p><h3 className="mt-1 text-base font-black text-slate-900">Chọn nơi lưu video trước khi chạy</h3><p className="mt-2 text-xs leading-relaxed text-slate-600">Kịch bản, media, voice và video final sẽ được lưu vào thư mục bạn chọn.</p></div></div>
            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowProjectFolderModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700">Để sau</button><button type="button" onClick={async () => { const response = await fetch("/api/dialog/pick?mode=dir&title=Ch%E1%BB%8Dn%20Th%C6%B0%20M%E1%BB%A5c%20L%C6%B0u%20D%E1%BB%B1%20%C3%81n"); const data = await response.json(); if (data.success && data.path) { await handleProjectDirChange(data.path); setShowProjectFolderModal(false); } }} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700">Chọn thư mục</button></div>
          </div>
        </div>
      )}

      {showUpdateCenter && <UpdateCenter onClose={() => setShowUpdateCenter(false)} />}

      {showClearProjectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={() => setShowClearProjectModal(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="clear-project-title" className="w-full max-w-lg overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.34)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-6 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><AlertCircle className="h-5 w-5" /></div>
              <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-600">Xác nhận thao tác</p><h3 id="clear-project-title" className="mt-1 text-lg font-black text-slate-900">Làm lại dự án từ đầu?</h3></div>
            </div>
            <div className="px-6 py-5"><p className="text-sm font-semibold leading-6 text-slate-700">Kịch bản, phân cảnh, ảnh/video đã tạo, voice và SEO của dự án hiện tại sẽ được làm sạch khỏi tool.</p><p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium leading-5 text-slate-500">Thư mục dự án trên máy, cấu hình API, hồ sơ Chrome và phong cách đã lưu sẽ không bị xóa.</p></div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowClearProjectModal(false)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100">Giữ lại dự án</button><button type="button" onClick={() => { setShowClearProjectModal(false); handleClearSavedData(true); }} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-rose-700">Xóa & làm lại</button></div>
          </div>
        </div>
      )}

      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-slate-800">Bạn có muốn reset dữ liệu gần nhất không?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hệ thống phát hiện bạn đang dán hoặc thay đổi kịch bản thô mới, điều này sẽ ghi đè các kết quả phân cảnh, SEO, voice hiện tại.
                </p>
                <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded border border-red-150 leading-relaxed">
                  ⚠️ Hãy nhớ <strong>Tải về toàn bộ kịch bản</strong> trước khi reset để tránh bị mất dữ liệu!
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                onClick={() => {
                  downloadBackup(backupLanguage);
                }}
                className="hidden"
              >
                📥 Tải Kịch Bản Về (${backupLanguage === "vi" ? "Tiếng Việt" : "Tiếng Anh"})
              </button>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelResetAndPaste}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmResetAndPaste}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-rose-700"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        img[alt="Thumbnail video"] { object-fit: contain !important; background: #020617; cursor: zoom-in; }
        aside[aria-label$="VidiFlow"] { top: auto !important; right: 1rem !important; bottom: 1rem !important; transform: none !important; flex-direction: row !important; gap: .5rem !important; padding: .5rem; border: 1px solid #e2e8f0; border-radius: 1rem; background: rgba(255,255,255,.92); box-shadow: 0 12px 34px rgba(15,23,42,.18); backdrop-filter: blur(12px); }
        aside[aria-label$="VidiFlow"] > button { width: 2.5rem !important; height: 2.5rem !important; box-shadow: none !important; }
        aside[aria-label$="VidiFlow"] > button > span { display: none !important; }
        aside[aria-label$="VidiFlow"] svg { width: 1.15rem !important; height: 1.15rem !important; }
      `}</style>
      {expandedThumbnailUrl && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/85 p-5 backdrop-blur-sm" onClick={() => setExpandedThumbnailUrl("")} role="dialog" aria-modal="true" aria-label="Xem Thumbnail kích thước lớn">
          <div className="relative flex max-h-[92vh] max-w-[92vw] items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <img src={expandedThumbnailUrl} alt="Thumbnail kích thước lớn" className="max-h-[92vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" />
            <button type="button" onClick={() => setExpandedThumbnailUrl("")} className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-2 text-xs font-black text-white shadow-lg transition hover:bg-black">Đóng ✕</button>
          </div>
        </div>
      )}
    </div>
    </LicenseGate>
  );
}
