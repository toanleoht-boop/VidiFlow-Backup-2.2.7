import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  FolderOpen,
  KeyRound,
  Loader2,
  Monitor,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { vidiflowConfirm } from "./VidiFlowDialogCenter";

type Platform = "youtube" | "facebook" | "tiktok";
type YouTubePublishMode = "schedule" | "immediate";
type Preset = {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>;
  updatedAt: string;
};
type Job = {
  id: string;
  source: "tool" | "telegram";
  inputType: "script" | "idea" | "link";
  input: string;
  presetId: string;
  presetName: string;
  scheduledAt: string;
  projectDir: string;
  projectBaseDir?: string;
  status: "scheduled" | "running" | "interrupted" | "completed" | "failed" | "cancelled";
  progress: number;
  publishPlatforms: Platform[];
  publishAt?: string;
  publishMethod?: PublishMethod;
  youtubePublishMode?: YouTubePublishMode;
  youtubeLeadMinutes?: number;
  chromeProfilePort?: number;
  youtubeChannelId?: string;
  youtubeChannelName?: string;
  facebookPageName?: string;
  facebookPageUrl?: string;
  publishStatus:
    | "not_requested"
    | "waiting"
    | "publishing"
    | "published"
    | "partial"
    | "failed";
  publishResults: Array<{
    platform: Platform;
    state: string;
    url?: string;
    error?: string;
  }>;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
};
type Props = {
  onRunJob: (jobId: string) => void;
  onResumeJob: (jobId: string) => Promise<void>;
  pipelineTelemetry?: {
    jobId?: string;
    progress: number;
    logs: string[];
    mediaCompleted: number;
    mediaTotal: number;
  };
  onViewProject: (projectDir: string) => Promise<void>;
  isPipelineRunning: boolean;
};
type PublishSummary = {
  youtube?: { connected: boolean };
  facebook?: { connected: boolean; pageId?: string };
  tiktok?: { connected: boolean };
};
type PublishMethod = "api" | "chrome";
type FacebookPageOption = {
  id: string;
  name: string;
  url: string;
  chromePort: number;
};
type YouTubeChannelOption = {
  id: string;
  name: string;
  studioUrl: string;
  channelId: string;
  chromePort: number;
};
type PublisherChromeProfile = {
  id: string;
  name: string;
  description?: string;
  port: number;
};

const facebookPagesStorageKey = "vidiflow_facebook_pages_v1";
const youtubeChannelsStorageKey = "vidiflow_youtube_channels_v1";
const legacyYoutubeChannelStorageKey = "vidiflow_youtube_channel_id_v1";
const publisherChromeProfilesStorageKey =
  "vidiflow_publisher_chrome_profiles_v1";
const selectedPublisherChromeProfileStorageKey =
  "vidiflow_selected_publisher_chrome_profile_v1";
const facebookPublisherChromePort = 9334;
const defaultPublisherChromeProfile: PublisherChromeProfile = {
  id: "publisher-9334",
  name: "Chrome Publisher 1",
  description: "Hồ sơ đăng bài mặc định",
  port: facebookPublisherChromePort,
};
const normalizeFacebookPageUrl = (raw: string) => {
  const value = raw.trim();
  if (!value) return "";
  try {
    const url = new URL(
      /^https?:\/\//i.test(value)
        ? value
        : `https://${value.replace(/^\/+/, "")}`,
    );
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      (host !== "facebook.com" &&
        host !== "www.facebook.com" &&
        !host.endsWith(".facebook.com"))
    )
      return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
};
const normalizeYouTubeChannelId = (raw: string) => {
  const value = raw.trim();
  const match = value.match(/(?:studio\.youtube\.com\/channel\/|youtube\.com\/channel\/)?([A-Za-z0-9_-]{12,})/i);
  return match?.[1] || "";
};
const normalizeYouTubeStudioUrl = (raw: string) => {
  const channelId = normalizeYouTubeChannelId(raw);
  return channelId ? `https://studio.youtube.com/channel/${channelId}` : "";
};

const setupKeys = [
  "automation_full_config_v1",
  "cc_visualConfig_v2",
  "automation_last_voice_v1",
  "ai33_selected_voice",
  "cc_selectedStyle_v2",
  "cc_savedStyles_v2",
  "cc_characterDescription",
  "selectedVoice",
  "imageStyle",
  "scenesCount",
  "promptsPerScene",
  "useDialogueSplit",
  "dialogueGroupSize",
  "promptsFocus",
  "isHighDensity",
  "targetPromptsCount",
  "channelName",
  "targetKeywords",
  "autoSteps",
  "autoHookStyle",
];
const parseStored = (key: string) => {
  const value = localStorage.getItem(key);
  if (value == null) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
const platformLabel: Record<Platform, string> = {
  youtube: "YouTube",
  facebook: "Facebook",
  tiktok: "TikTok",
};
const Youtube = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-flex h-5 w-7 items-center justify-center rounded bg-red-600 text-[10px] text-white ${className}`}
  >
    ▶
  </span>
);
const Facebook = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-xs font-black text-white ${className}`}
  >
    f
  </span>
);
const statusLabel: Record<Job["status"], string> = {
  scheduled: "Chờ tạo",
  running: "Đang tạo",
  interrupted: "Bị gián đoạn",
  completed: "Đã tạo xong",
  failed: "Tạo lỗi",
  cancelled: "Đã hủy",
};
const publishLabel: Record<Job["publishStatus"], string> = {
  not_requested: "Không tự đăng",
  waiting: "Chờ đăng",
  publishing: "Đang đăng",
  published: "Đã đăng",
  partial: "Đăng một phần",
  failed: "Đăng lỗi",
};

export default function TelegramAutomationScheduler({
  onRunJob,
  onResumeJob,
  pipelineTelemetry,
  onViewProject,
  isPipelineRunning,
}: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [editingPresetId, setEditingPresetId] = useState("");
  const [previewPreset, setPreviewPreset] = useState<Preset | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [inputType, setInputType] = useState<Job["inputType"]>("idea");
  const [input, setInput] = useState("");
  const [createAt, setCreateAt] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [youtubePublishMode, setYoutubePublishMode] =
    useState<YouTubePublishMode>("schedule");
  const [youtubeLeadMinutes, setYoutubeLeadMinutes] = useState(15);
  const [projectBaseDir, setProjectBaseDir] = useState(() =>
    localStorage.getItem("vidiflow_schedule_project_base_dir") || "",
  );
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [botToken, setBotToken] = useState("");
  const [allowedChatId, setAllowedChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [publishing, setPublishing] = useState<PublishSummary>({});
  const [credentials, setCredentials] = useState({
    youtube: { clientId: "", clientSecret: "", refreshToken: "" },
    facebook: { pageId: "", accessToken: "", graphVersion: "v23.0" },
    tiktok: { accessToken: "", privacyLevel: "SELF_ONLY" },
  });
  // Prefer the dedicated signed-in Publisher Chrome for every platform.
  // API remains available as an explicit fallback.
  const [publishMethod, setPublishMethod] = useState<PublishMethod>("chrome");
  const [publisherChromeProfiles, setPublisherChromeProfiles] = useState<
    PublisherChromeProfile[]
  >([defaultPublisherChromeProfile]);
  const [selectedChromeProfileId, setSelectedChromeProfileId] = useState(
    defaultPublisherChromeProfile.id,
  );
  const [newChromeProfileName, setNewChromeProfileName] = useState("");
  const [newChromeProfileDescription, setNewChromeProfileDescription] =
    useState("");
  const [newChromeProfilePort, setNewChromeProfilePort] = useState("9335");
  const [editingChromeProfileName, setEditingChromeProfileName] = useState("");
  const [editingChromeProfileDescription, setEditingChromeProfileDescription] =
    useState("");
  const [youtubeChannels, setYoutubeChannels] = useState<YouTubeChannelOption[]>([]);
  const [selectedYoutubeChannelOptionId, setSelectedYoutubeChannelOptionId] = useState("");
  const [newYoutubeChannelName, setNewYoutubeChannelName] = useState("");
  const [newYoutubeStudioUrl, setNewYoutubeStudioUrl] = useState("");
  const [facebookPages, setFacebookPages] = useState<FacebookPageOption[]>([]);
  const [selectedFacebookPageId, setSelectedFacebookPageId] = useState("");
  const [newFacebookPageName, setNewFacebookPageName] = useState("");
  const [newFacebookPageUrl, setNewFacebookPageUrl] = useState("");
  const [editingJobId, setEditingJobId] = useState("");
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const selectedChromeProfile = useMemo(
    () =>
      publisherChromeProfiles.find(
        (profile) => profile.id === selectedChromeProfileId,
      ) || publisherChromeProfiles[0] || defaultPublisherChromeProfile,
    [publisherChromeProfiles, selectedChromeProfileId],
  );
  const selectedChromePort = selectedChromeProfile.port;
  useEffect(() => {
    setEditingChromeProfileName(selectedChromeProfile.name);
    setEditingChromeProfileDescription(selectedChromeProfile.description || "");
  }, [selectedChromeProfile]);

  const load = useCallback(async () => {
    const responses = await Promise.all([
      fetch("/api/automation/presets"),
      fetch("/api/automation/jobs"),
      fetch("/api/automation/telegram"),
      fetch("/api/automation/publishing"),
    ]);
    const [presetPayload, jobPayload, telegram, publishPayload] =
      await Promise.all(responses.map((item) => item.json()));
    const nextPresets = presetPayload.presets || [];
    setPresets(nextPresets);
    setJobs(jobPayload.jobs || []);
    setPublishing(publishPayload || {});
    setHasToken(telegram.hasToken === true);
    setTelegramEnabled(telegram.enabled === true);
    setAllowedChatId(telegram.allowedChatId || "");
    setSelectedPreset(
      (current) =>
        current || telegram.defaultPresetId || nextPresets[0]?.id || "",
    );
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);
  useEffect(() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(publisherChromeProfilesStorageKey) || "[]",
      );
      const seenPorts = new Set<number>();
      const profiles = (Array.isArray(parsed) ? parsed : []).filter(
        (item: PublisherChromeProfile) => {
          const port = Number(item?.port);
          if (
            !item?.id ||
            !String(item?.name || "").trim() ||
            !Number.isInteger(port) ||
            port < 1024 ||
            port > 65535 ||
            seenPorts.has(port)
          )
            return false;
          seenPorts.add(port);
          return true;
        },
      ) as PublisherChromeProfile[];
      const nextProfiles = profiles.length
        ? profiles
        : [defaultPublisherChromeProfile];
      const storedSelectedId =
        localStorage.getItem(selectedPublisherChromeProfileStorageKey) || "";
      const nextSelectedId = nextProfiles.some(
        (profile) => profile.id === storedSelectedId,
      )
        ? storedSelectedId
        : nextProfiles[0].id;
      let suggestedPort = facebookPublisherChromePort + 1;
      while (nextProfiles.some((profile) => profile.port === suggestedPort))
        suggestedPort += 1;
      setPublisherChromeProfiles(nextProfiles);
      setSelectedChromeProfileId(nextSelectedId);
      setNewChromeProfilePort(String(suggestedPort));
      localStorage.setItem(
        publisherChromeProfilesStorageKey,
        JSON.stringify(nextProfiles),
      );
      localStorage.setItem(
        selectedPublisherChromeProfileStorageKey,
        nextSelectedId,
      );
    } catch {
      setPublisherChromeProfiles([defaultPublisherChromeProfile]);
      setSelectedChromeProfileId(defaultPublisherChromeProfile.id);
    }
  }, []);
  useEffect(() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(facebookPagesStorageKey) || "[]",
      );
      const pages = (Array.isArray(parsed) ? parsed : []).filter(
        (item: FacebookPageOption) =>
          item?.id &&
          item?.name &&
          normalizeFacebookPageUrl(item?.url) &&
          Number(item?.chromePort) > 0,
      );
      setFacebookPages(pages);
    } catch {
      setFacebookPages([]);
    }
  }, []);
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(youtubeChannelsStorageKey) || "[]");
      let channels = (Array.isArray(parsed) ? parsed : []).filter(
        (item: YouTubeChannelOption) =>
          item?.id && item?.name && normalizeYouTubeStudioUrl(item?.studioUrl) && Number(item?.chromePort) > 0,
      );
      const legacyUrl = localStorage.getItem(legacyYoutubeChannelStorageKey) || "";
      const legacyChannelId = normalizeYouTubeChannelId(legacyUrl);
      if (!channels.length && legacyChannelId) {
        channels = [{
          id: `${selectedChromePort}-${Date.now().toString(36)}`,
          name: localStorage.getItem(`${legacyYoutubeChannelStorageKey}_name`) || "Kênh YouTube",
          studioUrl: normalizeYouTubeStudioUrl(legacyUrl),
          channelId: legacyChannelId,
          chromePort: selectedChromePort,
        }];
        localStorage.setItem(youtubeChannelsStorageKey, JSON.stringify(channels));
      }
      setYoutubeChannels(channels);
    } catch {
      setYoutubeChannels([]);
    }
  }, [selectedChromePort]);
  const youtubeChannelsForSelectedProfile = useMemo(
    () => youtubeChannels.filter((channel) => channel.chromePort === selectedChromePort),
    [youtubeChannels, selectedChromePort],
  );
  const selectedYoutubeChannel = useMemo(
    () => youtubeChannelsForSelectedProfile.find((channel) => channel.id === selectedYoutubeChannelOptionId),
    [youtubeChannelsForSelectedProfile, selectedYoutubeChannelOptionId],
  );
  useEffect(() => {
    setSelectedYoutubeChannelOptionId((current) =>
      youtubeChannelsForSelectedProfile.some((channel) => channel.id === current)
        ? current
        : youtubeChannelsForSelectedProfile[0]?.id || "",
    );
  }, [youtubeChannelsForSelectedProfile]);
  const pagesForSelectedProfile = useMemo(
    () =>
      facebookPages.filter((page) => page.chromePort === selectedChromePort),
    [facebookPages, selectedChromePort],
  );
  const selectedFacebookPage = useMemo(
    () =>
      pagesForSelectedProfile.find(
        (page) => page.id === selectedFacebookPageId,
      ),
    [pagesForSelectedProfile, selectedFacebookPageId],
  );
  useEffect(() => {
    setSelectedFacebookPageId((current) =>
      pagesForSelectedProfile.some((page) => page.id === current)
        ? current
        : pagesForSelectedProfile[0]?.id || "",
    );
  }, [pagesForSelectedProfile]);
  const selected = useMemo(
    () => presets.find((item) => item.id === selectedPreset),
    [presets, selectedPreset],
  );
  const canPublishWithoutTime =
    publishMethod === "chrome" &&
    platforms.length === 1 &&
    platforms[0] === "youtube" &&
    youtubePublishMode === "immediate";
  const canSaveJob = Boolean(
    selectedPreset &&
      input.trim() &&
      (!platforms.length || publishAt || canPublishWithoutTime) &&
      !(
        publishMethod === "chrome" &&
        platforms.includes("facebook") &&
        !selectedFacebookPage
      ) &&
      !(
        publishMethod === "chrome" &&
        platforms.includes("youtube") &&
        !selectedYoutubeChannel
      ),
  );
  const canSaveTelegram = Boolean(
    !telegramEnabled ||
      ((hasToken || botToken.trim()) &&
        allowedChatId.trim() &&
        selectedPreset),
  );
  const canTestTelegram = Boolean(
    telegramEnabled && hasToken && allowedChatId.trim(),
  );

  const toLocalDateTimeInput = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  };
  const fillJobForm = (job: Job, editing: boolean) => {
    setEditingJobId(editing ? job.id : "");
    setSelectedPreset(job.presetId);
    setInputType(job.inputType);
    setInput(job.input);
    setCreateAt(editing ? toLocalDateTimeInput(job.scheduledAt) : "");
    setPublishAt(editing ? toLocalDateTimeInput(job.publishAt) : "");
    setPlatforms(job.publishPlatforms || []);
    setPublishMethod(job.publishMethod === "chrome" ? "chrome" : "api");
    setYoutubePublishMode(
      job.youtubePublishMode === "immediate" ? "immediate" : "schedule",
    );
    setYoutubeLeadMinutes(
      Number.isFinite(Number(job.youtubeLeadMinutes))
        ? Math.min(180, Math.max(5, Number(job.youtubeLeadMinutes)))
        : 15,
    );
    const jobChromePort = job.chromeProfilePort || selectedChromePort;
    const matchedProfile = publisherChromeProfiles.find(
      (profile) => profile.port === jobChromePort,
    );
    if (matchedProfile) selectPublisherChromeProfile(matchedProfile.id);
    if (job.youtubeChannelId) {
      const matchedChannel = youtubeChannels.find(
        (channel) =>
          channel.channelId === job.youtubeChannelId &&
          channel.chromePort === jobChromePort,
      );
      if (matchedChannel) setSelectedYoutubeChannelOptionId(matchedChannel.id);
    }
    if (job.facebookPageUrl) {
      const matchedPage = facebookPages.find(
        (page) =>
          page.url === job.facebookPageUrl &&
          page.chromePort === jobChromePort,
      );
      if (matchedPage) setSelectedFacebookPageId(matchedPage.id);
    }
    setNotice({
      ok: true,
      text: editing
        ? `Đang chỉnh sửa lịch ${job.id}. Thay đổi thông tin rồi bấm “Cập nhật lịch”.`
        : `Đã sao chép cấu hình từ lịch ${job.id}. Hãy thay link/kịch bản và chọn thời gian mới.`,
    });
    window.setTimeout(
      () =>
        document
          .getElementById("vidiflow-schedule-form")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
  };
  const cancelEditing = () => {
    setEditingJobId("");
    setNotice({
      ok: true,
      text: "Đã thoát chế độ chỉnh sửa. Nội dung hiện tại vẫn được giữ để bạn có thể tạo lịch mới.",
    });
  };

  const persistPublisherChromeProfiles = (
    profiles: PublisherChromeProfile[],
  ) => {
    setPublisherChromeProfiles(profiles);
    localStorage.setItem(
      publisherChromeProfilesStorageKey,
      JSON.stringify(profiles),
    );
  };
  const selectPublisherChromeProfile = (profileId: string) => {
    if (!publisherChromeProfiles.some((profile) => profile.id === profileId))
      return;
    setSelectedChromeProfileId(profileId);
    localStorage.setItem(
      selectedPublisherChromeProfileStorageKey,
      profileId,
    );
  };
  const addPublisherChromeProfile = () => {
    const name = newChromeProfileName.trim();
    const description = newChromeProfileDescription.trim();
    const port = Number(newChromeProfilePort);
    if (!name)
      return setNotice({ ok: false, text: "Hãy đặt tên cho hồ sơ Chrome." });
    if (!Number.isInteger(port) || port < 1024 || port > 65535)
      return setNotice({
        ok: false,
        text: "Cổng Chrome phải là số nguyên từ 1024 đến 65535.",
      });
    if (publisherChromeProfiles.some((profile) => profile.port === port))
      return setNotice({
        ok: false,
        text: `Cổng ${port} đã thuộc một hồ sơ Chrome khác.`,
      });
    if (
      publisherChromeProfiles.some(
        (profile) => profile.name.trim().toLowerCase() === name.toLowerCase(),
      )
    )
      return setNotice({
        ok: false,
        text: `Tên hồ sơ “${name}” đã tồn tại.`,
      });
    const profile: PublisherChromeProfile = {
      id: `publisher-${port}-${Date.now().toString(36)}`,
      name,
      description,
      port,
    };
    const nextProfiles = [...publisherChromeProfiles, profile];
    persistPublisherChromeProfiles(nextProfiles);
    setSelectedChromeProfileId(profile.id);
    localStorage.setItem(
      selectedPublisherChromeProfileStorageKey,
      profile.id,
    );
    setNewChromeProfileName("");
    setNewChromeProfileDescription("");
    let suggestedPort = port + 1;
    while (nextProfiles.some((item) => item.port === suggestedPort))
      suggestedPort += 1;
    setNewChromeProfilePort(String(suggestedPort));
    setNotice({
      ok: true,
      text: `Đã tạo hồ sơ “${name}”. Hãy mở Chrome và đăng nhập đúng tài khoản/kênh cho hồ sơ này.`,
    });
  };
  const updateSelectedPublisherChromeProfile = () => {
    const name = editingChromeProfileName.trim();
    const description = editingChromeProfileDescription.trim();
    if (!name)
      return setNotice({
        ok: false,
        text: "Tên hồ sơ Chrome không được để trống.",
      });
    if (
      publisherChromeProfiles.some(
        (profile) =>
          profile.id !== selectedChromeProfile.id &&
          profile.name.trim().toLowerCase() === name.toLowerCase(),
      )
    )
      return setNotice({
        ok: false,
        text: `Tên hồ sơ “${name}” đã tồn tại.`,
      });
    const nextProfiles = publisherChromeProfiles.map((profile) =>
      profile.id === selectedChromeProfile.id
        ? { ...profile, name, description }
        : profile,
    );
    persistPublisherChromeProfiles(nextProfiles);
    setNotice({
      ok: true,
      text: `Đã cập nhật tên và mô tả cho hồ sơ “${name}”.`,
    });
  };
  const deletePublisherChromeProfile = async (
    profile: PublisherChromeProfile,
  ) => {
    if (publisherChromeProfiles.length <= 1)
      return setNotice({
        ok: false,
        text: "Cần giữ lại ít nhất một hồ sơ Chrome Publisher.",
      });
    const confirmed = await vidiflowConfirm(
      `Xóa hồ sơ “${profile.name}” khỏi danh sách? Phiên Chrome và tài khoản đã đăng nhập trên máy không bị xóa.`,
      {
        title: "Xóa hồ sơ Chrome đã lưu?",
        confirmLabel: "Xóa",
        cancelLabel: "Hủy",
        tone: "error",
      },
    );
    if (!confirmed) return;
    const nextProfiles = publisherChromeProfiles.filter(
      (item) => item.id !== profile.id,
    );
    persistPublisherChromeProfiles(nextProfiles);
    if (selectedChromeProfileId === profile.id)
      selectPublisherChromeProfile(nextProfiles[0].id);
  };

  const persistYoutubeChannels = (channels: YouTubeChannelOption[]) => {
    setYoutubeChannels(channels);
    localStorage.setItem(youtubeChannelsStorageKey, JSON.stringify(channels));
  };
  const addYoutubeChannel = () => {
    const name = newYoutubeChannelName.trim();
    const studioUrl = normalizeYouTubeStudioUrl(newYoutubeStudioUrl);
    const channelId = normalizeYouTubeChannelId(newYoutubeStudioUrl);
    if (!name || !studioUrl || !channelId)
      return setNotice({
        ok: false,
        text: "Hãy nhập tên kênh và link Studio chính hợp lệ (https://studio.youtube.com/channel/UC...).",
      });
    const existing = youtubeChannels.find(
      (channel) => channel.chromePort === selectedChromePort && channel.channelId === channelId,
    );
    const channel: YouTubeChannelOption = existing
      ? { ...existing, name, studioUrl }
      : {
          id: `${selectedChromePort}-yt-${Date.now().toString(36)}`,
          name,
          studioUrl,
          channelId,
          chromePort: selectedChromePort,
        };
    const next = existing
      ? youtubeChannels.map((item) => (item.id === existing.id ? channel : item))
      : [...youtubeChannels, channel];
    persistYoutubeChannels(next);
    setSelectedYoutubeChannelOptionId(channel.id);
    setNewYoutubeChannelName("");
    setNewYoutubeStudioUrl("");
    setNotice({ ok: true, text: `Đã lưu kênh YouTube “${name}” cho Chrome Publisher.` });
  };
  const deleteYoutubeChannel = async (channel: YouTubeChannelOption) => {
    const confirmed = await vidiflowConfirm(
      `Xóa kênh “${channel.name}” khỏi danh sách? Kênh thật trên YouTube không bị ảnh hưởng.`,
      {
        title: "Xóa kênh YouTube đã lưu?",
        confirmLabel: "Xóa",
        cancelLabel: "Hủy",
        tone: "error",
      },
    );
    if (!confirmed) return;
    persistYoutubeChannels(youtubeChannels.filter((item) => item.id !== channel.id));
  };

  const persistFacebookPages = (pages: FacebookPageOption[]) => {
    setFacebookPages(pages);
    localStorage.setItem(facebookPagesStorageKey, JSON.stringify(pages));
  };
  const addFacebookPage = () => {
    const name = newFacebookPageName.trim();
    const url = normalizeFacebookPageUrl(newFacebookPageUrl);
    if (!name || !url)
      return setNotice({
        ok: false,
        text: "Hãy nhập tên Page và URL Facebook hợp lệ (https://facebook.com/...).",
      });
    const existing = facebookPages.find(
      (page) => page.chromePort === selectedChromePort && page.url === url,
    );
    const page: FacebookPageOption = existing
      ? { ...existing, name }
      : {
          id: `${selectedChromePort}-${Date.now().toString(36)}`,
          name,
          url,
          chromePort: selectedChromePort,
        };
    const next = existing
      ? facebookPages.map((item) => (item.id === existing.id ? page : item))
      : [...facebookPages, page];
    persistFacebookPages(next);
    setSelectedFacebookPageId(page.id);
    setNewFacebookPageName("");
    setNewFacebookPageUrl("");
    setNotice({
      ok: true,
      text: `Đã lưu Page “${name}” cho hồ sơ Chrome cổng ${selectedChromePort}.`,
    });
  };
  const deleteFacebookPage = async (page: FacebookPageOption) => {
    const confirmed = await vidiflowConfirm(
      `Xóa Page “${page.name}” khỏi hồ sơ Chrome này? Chỉ cấu hình trong tool bị xóa, Facebook Page không bị ảnh hưởng.`,
      {
        title: "Xóa Page đã lưu?",
        confirmLabel: "Xóa",
        cancelLabel: "Hủy",
        tone: "error",
      },
    );
    if (!confirmed) return;
    persistFacebookPages(facebookPages.filter((item) => item.id !== page.id));
  };

  const beginEditPreset = (preset: Preset) => {
    setEditingPresetId(preset.id);
    setPresetName(preset.name);
    setPresetDescription(preset.description || "");
    setNotice({
      ok: true,
      text: `Đang chỉnh sửa preset “${preset.name}”.`,
    });
  };
  const cancelEditPreset = () => {
    setEditingPresetId("");
    setPresetName("");
    setPresetDescription("");
  };
  const savePreset = async (replaceSetup: boolean) => {
    if (!presetName.trim())
      return setNotice({ ok: false, text: "Hãy đặt tên cho preset." });
    const editingPreset = presets.find(item => item.id === editingPresetId);
    let config = editingPreset?.config;
    if (!editingPreset || replaceSetup) {
      const settings = Object.fromEntries(
        setupKeys
          .map((key) => [key, parseStored(key)])
          .filter(([, value]) => value !== undefined),
      );
      const autoConfig = settings.automation_full_config_v1 || {};
      if (!Object.keys(autoConfig).length)
        return setNotice({
          ok: false,
          text: "Hãy hoàn tất setup ở tab Tạo tự động hoặc Tạo từng bước trước khi lưu preset.",
        });
      config = { version: 2, autoConfig, settings };
    }
    if (!config)
      return setNotice({ ok: false, text: "Không tìm thấy cấu hình preset để cập nhật." });
    setSaving("preset");
    try {
      const response = await fetch("/api/automation/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPresetId || undefined,
          name: presetName.trim(),
          description: presetDescription,
          config,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Không lưu được preset");
      setPresetName("");
      setPresetDescription("");
      setEditingPresetId("");
      setSelectedPreset(payload.preset.id);
      setNotice({
        ok: true,
        text: editingPreset
          ? replaceSetup
            ? "Đã cập nhật tên, mô tả và toàn bộ setup của preset."
            : "Đã cập nhật tên và mô tả; toàn bộ setup cũ được giữ nguyên."
          : "Đã lưu trọn bộ setup tạo video, media, voice, SEO, watermark và render.",
      });
      await load();
    } catch (error: any) {
      setNotice({ ok: false, text: error.message });
    } finally {
      setSaving("");
    }
  };
  const deletePreset = async (id: string) => {
    if (!(await vidiflowConfirm("Xóa preset này? Dữ liệu dự án đã tạo sẽ được giữ nguyên.", {
      title: "Xóa preset?",
      confirmLabel: "Xóa preset",
      cancelLabel: "Giữ lại",
    }))) return;
    await fetch(`/api/automation/presets/${id}`, { method: "DELETE" });
    if (selectedPreset === id) setSelectedPreset("");
    if (editingPresetId === id) cancelEditPreset();
    await load();
  };
  const togglePlatform = (platform: Platform) =>
    setPlatforms((value) =>
      value.includes(platform)
        ? value.filter((item) => item !== platform)
        : [...value, platform],
    );
  const chooseProjectBaseDir = async () => {
    setSaving("project-folder");
    try {
      const response = await fetch(
        "/api/dialog/pick?mode=dir&title=" +
          encodeURIComponent("Chọn thư mục lưu video lên lịch"),
      );
      const payload = await response.json();
      if (!response.ok || payload.success !== true)
        throw new Error(payload.error || "Không thể chọn thư mục lưu.");
      if (payload.path) {
        setProjectBaseDir(payload.path);
        localStorage.setItem("vidiflow_schedule_project_base_dir", payload.path);
      }
    } catch (error: any) {
      setNotice({ ok: false, text: error?.message || "Không thể chọn thư mục lưu." });
    } finally {
      setSaving("");
    }
  };
  const createJob = async () => {
    if (!selectedPreset || !input.trim())
      return setNotice({
        ok: false,
        text: "Hãy chọn preset và nhập nội dung.",
      });
    if (platforms.length && !publishAt && !canPublishWithoutTime)
      return setNotice({
        ok: false,
        text: "Đã chọn nền tảng đăng, hãy chọn ngày giờ đăng. Nếu chỉ đăng YouTube, bạn có thể chọn “Đăng ngay” để đăng sau khi render xong.",
      });
    if (
      publishMethod === "chrome" &&
      platforms.includes("facebook") &&
      !selectedFacebookPage
    )
      return setNotice({
        ok: false,
        text: "Hãy chọn Facebook Page đích cho lịch đăng này.",
      });
    if (publishMethod === "chrome" && platforms.includes("youtube") && !selectedYoutubeChannel)
      return setNotice({
        ok: false,
        text: "Hãy chọn kênh YouTube đích trong danh sách đã lưu.",
      });
    setSaving("job");
    try {
      const response = await fetch(
        editingJobId
          ? `/api/automation/jobs/${editingJobId}/config`
          : "/api/automation/jobs",
        {
          method: editingJobId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presetId: selectedPreset,
            inputType,
            input,
            projectBaseDir: projectBaseDir || undefined,
            scheduledAt: createAt
              ? new Date(createAt).toISOString()
              : undefined,
            publishPlatforms: platforms,
            publishAt: publishAt
              ? new Date(publishAt).toISOString()
              : undefined,
            publishMethod,
            youtubePublishMode:
              publishMethod === "chrome" && platforms.includes("youtube")
                ? youtubePublishMode
                : undefined,
            youtubeLeadMinutes:
              publishMethod === "chrome" &&
              platforms.includes("youtube") &&
              youtubePublishMode === "schedule"
                ? Math.min(180, Math.max(5, Number(youtubeLeadMinutes) || 15))
                : undefined,
            chromeProfilePort:
              publishMethod === "chrome" ? selectedChromePort : undefined,
            youtubeChannelId:
              publishMethod === "chrome" ? selectedYoutubeChannel?.channelId : undefined,
            youtubeChannelName:
              publishMethod === "chrome" ? selectedYoutubeChannel?.name : undefined,
            facebookPageName:
              publishMethod === "chrome"
                ? selectedFacebookPage?.name
                : undefined,
            facebookPageUrl:
              publishMethod === "chrome"
                ? selectedFacebookPage?.url
                : undefined,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error === "JOB_ALREADY_STARTED"
            ? "Lịch này đã bắt đầu chạy nên không thể chỉnh sửa."
            : payload.error || "Không lưu được lịch",
        );
      const savedId = payload.job?.id || editingJobId;
      const wasEditing = Boolean(editingJobId);
      setEditingJobId("");
      setInput("");
      setCreateAt("");
      setPublishAt("");
      setNotice({
        ok: true,
        text: wasEditing
          ? `Đã cập nhật lịch ${savedId}.`
          : `Đã lên lịch ${savedId}: tạo video và đăng theo mốc giờ riêng.`,
      });
      await load();
    } catch (error: any) {
      setNotice({ ok: false, text: error.message });
    } finally {
      setSaving("");
    }
  };
  const saveTelegram = async () => {
    setSaving("telegram");
    try {
      const response = await fetch("/api/automation/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: telegramEnabled,
          botToken,
          allowedChatId,
          defaultPresetId: selectedPreset,
          // Telegram jobs run without the web form being open, so persist the
          // exact publisher destination together with the bot configuration.
          publishMethod,
          chromeProfilePort:
            publishMethod === "chrome" ? selectedChromePort : undefined,
          youtubeChannelId:
            publishMethod === "chrome"
              ? selectedYoutubeChannel?.channelId
              : undefined,
          youtubeChannelName:
            publishMethod === "chrome"
              ? selectedYoutubeChannel?.name
              : undefined,
          facebookPageName:
            publishMethod === "chrome"
              ? selectedFacebookPage?.name
              : undefined,
          facebookPageUrl:
            publishMethod === "chrome"
              ? selectedFacebookPage?.url
              : undefined,
          youtubePublishMode,
          youtubeLeadMinutes:
            youtubePublishMode === "schedule"
              ? Math.min(180, Math.max(5, Number(youtubeLeadMinutes) || 15))
              : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error === "TELEGRAM_CONFIG_INCOMPLETE"
            ? "Cần đủ Bot Token, Chat ID và preset mặc định."
            : payload.error,
        );
      setBotToken("");
      setHasToken(payload.hasToken === true);
      setNotice({
        ok: true,
        text:
          publishMethod === "chrome"
            ? `Đã lưu Telegram Bot cùng Chrome ${selectedChromePort}${selectedFacebookPage ? ` · Facebook: ${selectedFacebookPage.name}` : ""}${selectedYoutubeChannel ? ` · YouTube: ${selectedYoutubeChannel.name}` : ""}.`
            : "Đã lưu Telegram Bot cùng cấu hình đăng qua API.",
      });
      await load();
    } catch (error: any) {
      setNotice({ ok: false, text: error.message });
    } finally {
      setSaving("");
    }
  };
  const testTelegram = async () => {
    setSaving("test");
    try {
      const response = await fetch("/api/automation/telegram/test", {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Gửi thử thất bại");
      setNotice({ ok: true, text: "Bot đã gửi tin thử thành công." });
    } catch (error: any) {
      setNotice({ ok: false, text: error.message });
    } finally {
      setSaving("");
    }
  };
  const savePublishing = async () => {
    setSaving("publishing");
    try {
      const response = await fetch("/api/automation/publishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Không lưu được kết nối");
      setCredentials((value) => ({
        ...value,
        youtube: { ...value.youtube, clientSecret: "", refreshToken: "" },
        facebook: { ...value.facebook, accessToken: "" },
        tiktok: { ...value.tiktok, accessToken: "" },
      }));
      setNotice({ ok: true, text: "Đã lưu kết nối xuất bản trên máy này." });
      await load();
    } catch (error: any) {
      setNotice({ ok: false, text: error.message });
    } finally {
      setSaving("");
    }
  };
  const testPlatform = async (platform: Platform) => {
    setSaving(`test-${platform}`);
    try {
      const response = await fetch(
        `/api/automation/publishing/test/${platform}`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Kết nối thất bại");
      setNotice({
        ok: true,
        text: `${platformLabel[platform]} đã kết nối hợp lệ.`,
      });
    } catch (error: any) {
      setNotice({
        ok: false,
        text: `${platformLabel[platform]}: ${error.message}`,
      });
    } finally {
      setSaving("");
    }
  };
  const openChromePublisher = async () => {
    const publisherLoginPlatforms: Platform[] = [
      "youtube",
      "facebook",
      "tiktok",
    ];
    setSaving("open-publisher");
    try {
      const response = await fetch("/api/pipeline/open-chrome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "publisher",
          port: selectedChromePort,
          headless: false,
          publishingPlatforms: publisherLoginPlatforms,
          youtubeStudioUrl: selectedYoutubeChannel?.studioUrl,
          facebookPageUrl: selectedFacebookPage?.url,
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true)
        throw new Error(payload.error || "Không thể mở Chrome.");
      setNotice({
        ok: true,
        text: `Đã mở hồ sơ “${selectedChromeProfile.name}” và 3 trang đăng nhập: YouTube Studio, Facebook, TikTok Studio.`,
      });
    } catch (error: any) {
      setNotice({
        ok: false,
        text: error?.message || "Không thể mở Chrome để đăng video.",
      });
    } finally {
      setSaving("");
    }
  };
  const retryPublish = async (jobId: string) => {
    setSaving(`retry-${jobId}`);
    try {
      const response = await fetch(
        `/api/automation/jobs/${jobId}/retry-publish`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Không thể đăng lại");
      setNotice({ ok: true, text: "Đã xếp lại các nền tảng đăng bị lỗi." });
      await load();
    } catch (error: any) {
      setNotice({ ok: false, text: error.message });
    } finally {
      setSaving("");
    }
  };
  const resumeInterruptedJob = async (job: Job) => {
    setSaving(`resume-${job.id}`);
    try {
      await onResumeJob(job.id);
    } catch (error: any) {
      setNotice({
        ok: false,
        text: error?.message || "Không thể mở task để tiếp tục.",
      });
    } finally {
      setSaving("");
    }
  };
  const restartJob = async (job: Job) => {
    const confirmed = await vidiflowConfirm(
      `Chạy lại “${job.presetName}” từ đầu trong một thư mục dự án mới? Dữ liệu dự án cũ vẫn được giữ nguyên.`,
      {
        title: "Chạy lại task từ đầu?",
        confirmLabel: "Chạy lại",
        cancelLabel: "Hủy",
      },
    );
    if (!confirmed) return;
    setSaving(`restart-${job.id}`);
    try {
      const response = await fetch(`/api/automation/jobs/${job.id}/restart`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.job?.id)
        throw new Error(
          payload.error === "JOB_IS_RUNNING"
            ? "Task vẫn đang chạy; hãy chờ trạng thái Bị gián đoạn hoặc dừng task trước."
            : payload.error || "Không thể chạy lại task.",
        );
      await load();
      onRunJob(payload.job.id);
    } catch (error: any) {
      setNotice({ ok: false, text: error?.message || "Không thể chạy lại task." });
    } finally {
      setSaving("");
    }
  };
  const prepareChromePublish = async (job: Job) => {
    const confirmed = await vidiflowConfirm(
      `Tool sẽ mở Chrome Publisher, tải video và điền nội dung cho ${job.publishPlatforms.join(", ")}. Bạn sẽ kiểm tra rồi xác nhận đăng.`,
      {
        title: "Chuẩn bị bài đăng bằng Chrome?",
        confirmLabel: "Mở Chrome & chuẩn bị",
        cancelLabel: "Hủy",
        tone: "info",
      },
    );
    if (!confirmed) return;
    setSaving(`chrome-${job.id}`);
    try {
      const response = await fetch(
        `/api/automation/jobs/${job.id}/prepare-chrome-publish`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error || "Không thể chuẩn bị bài đăng trên Chrome.",
        );
      setNotice({
        ok: true,
        text: "Video và nội dung đã được đưa vào Chrome. Hãy kiểm tra đúng nền tảng, quyền riêng tư rồi xác nhận đăng.",
      });
      await load();
    } catch (error: any) {
      const message = String(error?.message || "Không thể kết nối Chrome.");
      setNotice({
        ok: false,
        text:
          message === "CHROME_PROFILE_NOT_CONNECTED"
            ? "Không kết nối được hồ sơ Chrome. Hãy bấm “Mở Chrome & đăng nhập 3 nền tảng” trước rồi thử lại."
            : message,
      });
    } finally {
      setSaving("");
    }
  };
  const viewCompletedProject = async (job: Job) => {
    if (!job.projectDir)
      return setNotice({
        ok: false,
        text: "Tác vụ này chưa có thư mục dự án để xem.",
      });
    setSaving(`view-${job.id}`);
    try {
      await onViewProject(job.projectDir);
    } catch (error: any) {
      setNotice({
        ok: false,
        text: error?.message || "Không thể nạp kết quả dự án.",
      });
    } finally {
      setSaving("");
    }
  };
  const deleteJob = async (job: Job) => {
    const confirmed = await vidiflowConfirm(
      job.status === "scheduled"
        ? "Tác vụ này sẽ bị hủy khỏi lịch và xóa khỏi danh sách. Các file trong thư mục dự án vẫn được giữ nguyên."
        : "Chỉ xóa bản ghi này khỏi danh sách. Thư mục dự án và video đã tạo vẫn được giữ nguyên.",
      {
        title: `Xóa tác vụ "${job.presetName}"?`,
        confirmLabel: "Xóa tác vụ",
        cancelLabel: "Hủy",
        tone: "error",
      },
    );
    if (!confirmed) return;
    setSaving(`delete-${job.id}`);
    try {
      const response = await fetch(`/api/automation/jobs/${job.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error === "JOB_IS_RUNNING"
            ? "Tác vụ đang chạy, hãy dừng tác vụ trước khi xóa."
            : payload.error || "Không thể xóa tác vụ.",
        );
      setJobs((current) => current.filter((item) => item.id !== job.id));
      setNotice({
        ok: true,
        text: "Đã xóa tác vụ khỏi danh sách. File dự án vẫn được giữ nguyên.",
      });
    } catch (error: any) {
      setNotice({ ok: false, text: error?.message || "Không thể xóa tác vụ." });
    } finally {
      setSaving("");
    }
  };

  const previewConfig = previewPreset
    ? previewPreset.config?.autoConfig || previewPreset.config || {}
    : {};
  const presetValue = (value: unknown) => {
    if (typeof value === "boolean") return value ? "Bật" : "Tắt";
    if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "—";
    if (value === undefined || value === null || value === "") return "—";
    return String(value);
  };
  const previewGroups: Array<{
    title: string;
    tone: string;
    items: Array<[string, unknown]>;
  }> = previewPreset
    ? [
        {
          title: "Nội dung & Hook",
          tone: "border-violet-200 bg-violet-50",
          items: [
            ["Loại đầu vào", previewConfig.inputType],
            ["Thể loại", previewConfig.customGenre || previewConfig.genre],
            ["Đối tượng", previewConfig.audience],
            ["Phong cách viết", previewConfig.writingStyle],
            ["Mức viết lại", previewConfig.rewriteLevel],
            ["Giữ kịch bản gốc", previewConfig.preserveOriginalScript],
            ["Hook", previewConfig.hookEnabled ? `${previewConfig.hookCount || 1} · ${previewConfig.hookStyle || "mặc định"}` : "Tắt"],
          ],
        },
        {
          title: "Phân cảnh & Prompt",
          tone: "border-sky-200 bg-sky-50",
          items: [
            ["Cách chia cảnh", previewConfig.sceneMode],
            ["Số cảnh dự kiến", previewConfig.sceneCount],
            ["Prompt mỗi cảnh", previewConfig.promptsPerScene],
            ["Trọng tâm prompt", previewConfig.promptFocus],
            ["Mật độ cao", previewConfig.highDensity],
            ["Nhóm câu thoại", previewConfig.dialogueGroupSize],
          ],
        },
        {
          title: "Media & Tham chiếu",
          tone: "border-fuchsia-200 bg-fuchsia-50",
          items: [
            ["Loại media", previewConfig.generateType === "video" ? "Video" : "Ảnh"],
            ["Chế độ tạo", previewConfig.generationMode],
            ["Tỷ lệ", previewConfig.aspectRatio],
            ["Model ảnh", previewConfig.imageEngine],
            ["Model video", previewConfig.videoEngine],
            ["Chất lượng video", previewConfig.viettheoVideoQuality],
            ["Thời lượng clip", previewConfig.videoDuration],
            ["Ảnh tham chiếu", previewConfig.useReferenceImages],
            ["Số luồng", previewConfig.chromeThreads],
            ["Video lỗi đổi sang ảnh", previewConfig.fallbackFailedVideosToImages],
          ],
        },
        {
          title: "Voice",
          tone: "border-emerald-200 bg-emerald-50",
          items: [
            ["Nhà cung cấp", previewConfig.voiceProvider],
            ["Giọng đọc", previewConfig.voiceModel || previewConfig.voiceId],
            ["Tốc độ", previewConfig.voiceSpeed],
            ["Cao độ", previewConfig.voicePitch],
            ["Cảm xúc", previewConfig.voiceEmotion],
            ["Giữ âm thanh video", previewConfig.keepVideoAudio],
          ],
        },
        {
          title: "SEO & Thumbnail",
          tone: "border-amber-200 bg-amber-50",
          items: [
            ["Giọng SEO", previewConfig.seoTone],
            ["Từ khóa", previewConfig.targetKeywords],
            ["Tracklist", previewConfig.includeTracklist],
            ["Chapters", previewConfig.includeChapters],
            ["Thumbnail", previewConfig.thumbnailStyle],
          ],
        },
        {
          title: "Render & Nhận diện",
          tone: "border-slate-200 bg-slate-50",
          items: [
            ["Nguồn render", previewConfig.renderSource],
            ["Độ phân giải", previewConfig.resolution],
            ["Chuyển động", previewConfig.motionEnabled ? previewConfig.motionStyle || "Bật" : "Tắt"],
            ["Cường độ", previewConfig.motionIntensity],
            ["Phụ đề", previewConfig.subtitleEnabled ? `${previewConfig.subtitleStyle || "mặc định"} · ${previewConfig.subtitlePosition || "bottom"}` : "Tắt"],
            ["Nhạc nền", previewConfig.backgroundMusicEnabled
              ? `${previewConfig.backgroundMusicMode === "folder" ? "Random từ thư mục" : "Một file"} · ${previewConfig.backgroundMusicVolume || 18}%`
              : "Tắt"],
            ["Watermark", previewConfig.watermarkType === "none" ? "Tắt" : previewConfig.watermarkType],
            ["Vị trí watermark", previewConfig.watermarkPosition],
          ],
        },
      ]
    : [];
  const pipelineStepLabels = [
    "Chuẩn hóa kịch bản",
    "Hook giữ chân",
    "Phân cảnh & Prompt",
    "Tạo Media",
    "Tạo Voice",
    "SEO & Thumbnail",
    "Render video",
  ];
  const formatElapsed = (startedAt?: string) => {
    if (!startedAt) return "—";
    const elapsedSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(startedAt).getTime()) / 1000),
    );
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return hours
      ? `${hours} giờ ${minutes} phút`
      : minutes
        ? `${minutes} phút ${seconds} giây`
        : `${seconds} giây`;
  };
  const getJobTelemetry = (job: Job) => {
    const isLive = pipelineTelemetry?.jobId === job.id;
    const logs = isLive
      ? (pipelineTelemetry?.logs || []).filter(Boolean)
      : job.message
        ? [job.message]
        : [];
    const progress = isLive
      ? Math.max(0, Math.min(100, Math.round(pipelineTelemetry?.progress || 0)))
      : Math.max(0, Math.min(100, Math.round(job.progress || 0)));
    let stage = 0;
    for (const line of [...logs].reverse()) {
      const match = String(line).match(/\[(\d+)\s*\/\s*7\]/);
      if (match) {
        stage = Math.min(7, Math.max(1, Number(match[1])));
        break;
      }
    }
    if (!stage) {
      const latest = String(logs[logs.length - 1] || "");
      if (/render|ffmpeg/i.test(latest)) stage = 7;
      else if (/seo|thumbnail/i.test(latest)) stage = 6;
      else if (/voice|giọng|thuyết minh/i.test(latest)) stage = 5;
      else if (/media|ảnh|video|viettheo/i.test(latest)) stage = 4;
      else if (/phân cảnh|prompt|storyboard/i.test(latest)) stage = 3;
      else if (/hook/i.test(latest)) stage = 2;
    }
    if (!stage)
      stage = progress < 20 ? 1 : progress < 35 ? 2 : progress < 74 ? 3 : progress < 85 ? 4 : progress < 90 ? 5 : progress < 95 ? 6 : 7;
    return {
      isLive,
      logs,
      progress,
      stage,
      mediaCompleted: isLive ? pipelineTelemetry?.mediaCompleted || 0 : 0,
      mediaTotal: isLive ? pipelineTelemetry?.mediaTotal || 0 : 0,
    };
  };

  return (
    <div className="vidiflow-social-publisher mx-auto w-full max-w-[1500px] space-y-5">
      {previewPreset && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setPreviewPreset(null)}
          role="presentation"
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Tổng quan preset ${previewPreset.name}`}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-violet-700 to-fuchsia-600 px-6 py-5 text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-100">Tổng quan Preset</p>
                <h3 className="mt-1 text-xl font-black">{previewPreset.name}</h3>
                <p className="mt-1 text-xs text-violet-100">{previewPreset.description || "Preset sản xuất video"}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPreset(null)}
                className="rounded-xl border border-white/30 bg-white/10 p-2 text-white hover:bg-white/20"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="max-h-[calc(92vh-104px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {previewGroups.map((group) => (
                  <section key={group.title} className={`rounded-2xl border p-4 ${group.tone}`}>
                    <h4 className="text-sm font-black text-slate-900">{group.title}</h4>
                    <dl className="mt-3 space-y-2">
                      {group.items.map(([label, value]) => (
                        <div key={label} className="flex items-start justify-between gap-3 border-b border-slate-200/70 pb-2 last:border-0 last:pb-0">
                          <dt className="text-[11px] font-semibold text-slate-500">{label}</dt>
                          <dd className="max-w-[58%] break-words text-right text-[11px] font-black text-slate-800">{presetValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
              {previewConfig.characterBible && (
                <section className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <h4 className="text-sm font-black text-indigo-950">Style prompt / Hồ sơ hình ảnh</h4>
                  <p className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-indigo-900">
                    {String(previewConfig.characterBible)}
                  </p>
                </section>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    beginEditPreset(previewPreset);
                    setPreviewPreset(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-600"
                >
                  <Pencil className="h-4 w-4" />
                  Chỉnh sửa preset
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPreset(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-600"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <section className="rounded-3xl bg-[radial-gradient(circle_at_top_right,_#38bdf8_0%,_#7c3aed_38%,_#111827_86%)] p-7 text-white shadow-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black tracking-[.16em]">
          <Bot className="h-3.5 w-3.5" /> PRODUCTION SCHEDULER
        </span>
        <h3 className="mt-4 text-3xl font-black">
          Preset sản xuất · Lịch trong tool · Telegram Bot · Tự đăng video
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-violet-100">
          Một preset lưu đúng toàn bộ setup như khi làm video hoàn chỉnh. Bạn có
          thể lên lịch ngay trong tool hoặc gửi yêu cầu qua bot; video hoàn tất
          sẽ được đăng vào giờ đã chọn.
        </p>
      </section>
      {notice && (
        <div
          className={`flex justify-between rounded-2xl border px-4 py-3 text-sm font-bold ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)}>×</button>
        </div>
      )}
      {jobs.some(
        (job) =>
          job.publishStatus === "failed" || job.publishStatus === "partial",
      ) && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-xs font-bold text-rose-700">
            Có tác vụ đăng lỗi. Hãy sửa token/quyền nền tảng rồi đăng lại; hệ
            thống không tự request vô hạn.
          </p>
          <div className="flex flex-wrap gap-2">
            {jobs
              .filter(
                (job) =>
                  job.publishStatus === "failed" ||
                  job.publishStatus === "partial",
              )
              .map((job) => (
                <button
                  key={job.id}
                  onClick={() => retryPublish(job.id)}
                  disabled={saving === `retry-${job.id}`}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white"
                >
                  <RefreshCw
                    className={`mr-1 inline h-3.5 w-3.5 ${saving === `retry-${job.id}` ? "animate-spin" : ""}`}
                  />
                  Đăng lại {job.id}
                </button>
              ))}
          </div>
        </section>
      )}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center gap-3">
            <Save className="text-violet-600" />
            <div>
              <h4 className="font-black">1. Preset đầy đủ</h4>
              <p className="text-xs text-slate-500">
                Lưu setup của Tạo tự động/Từng bước; không lưu kịch bản hay file
                dự án.
              </p>
            </div>
          </header>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Tên preset"
              className="rounded-xl border px-3 py-2.5 text-sm"
            />
            <input
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              placeholder="Kênh/chủ đề sử dụng"
              className="rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          {editingPresetId ? (
            <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <button
                type="button"
                onClick={() => void savePreset(false)}
                disabled={saving === "preset"}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
              >
                {saving === "preset" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu tên & mô tả
              </button>
              <button
                type="button"
                onClick={() => void savePreset(true)}
                disabled={saving === "preset"}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${saving === "preset" ? "animate-spin" : ""}`} />
                Cập nhật toàn bộ setup hiện tại
              </button>
              <button
                type="button"
                onClick={cancelEditPreset}
                disabled={saving === "preset"}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-600"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              onClick={() => void savePreset(true)}
              disabled={saving === "preset"}
              className="mt-3 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white"
            >
              {saving === "preset" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}{" "}
              Lưu setup hiện tại
            </button>
          )}
          <div className="mt-4 space-y-2">
            {presets.map((preset) => {
              const cfg = preset.config?.autoConfig || preset.config || {};
              return (
                <div
                  key={preset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setPreviewPreset(preset)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setPreviewPreset(preset);
                    }
                  }}
                  className={`cursor-pointer rounded-xl border p-3 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md ${editingPresetId === preset.id ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-slate-50"}`}
                >
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1">
                      <b className="text-sm">{preset.name}</b>
                      <p className="text-[11px] text-slate-500">
                        {preset.description || "Preset sản xuất video"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1 text-[9px] font-bold text-violet-700">
                        <span className="rounded-full bg-violet-100 px-2 py-1">
                          {cfg.aspectRatio || "Tỷ lệ đã lưu"}
                        </span>
                        <span className="rounded-full bg-violet-100 px-2 py-1">
                          {cfg.mediaType === "video" ? "Video AI" : "Ảnh AI"}
                        </span>
                        <span className="rounded-full bg-violet-100 px-2 py-1">
                          Voice · SEO · Render
                        </span>
                      </div>
                      <p className="mt-2 text-[10px] font-bold text-slate-400">Bấm để xem toàn bộ setup</p>
                    </div>
                    <div className="flex items-start gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          beginEditPreset(preset);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-100 hover:text-amber-700"
                        title="Chỉnh sửa preset"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void deletePreset(preset.id);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                        title="Xóa preset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section
          id="vidiflow-schedule-form"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <header className="flex items-center gap-3">
            <CalendarClock className="text-fuchsia-600" />
            <div>
              <h4 className="font-black">2. Lên lịch ngay trong tool</h4>
              <p className="text-xs text-slate-500">
                Giờ tạo và giờ đăng là hai lịch độc lập.
              </p>
            </div>
          </header>
          {editingJobId && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              <span>Đang chỉnh sửa lịch {editingJobId}</span>
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5"
              >
                <X className="h-3.5 w-3.5" /> Hủy chỉnh sửa
              </button>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["link", "idea", "script"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setInputType(type)}
                className={`rounded-xl border py-2 text-xs font-black ${inputType === type ? "border-violet-500 bg-violet-600 text-white" : "border-slate-200"}`}
              >
                {type === "link"
                  ? "Link"
                  : type === "idea"
                    ? "Mô tả/ý tưởng"
                    : "Kịch bản"}
              </button>
            ))}
          </div>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="mt-3 w-full rounded-xl border px-3 py-2.5 text-sm font-bold"
          >
            <option value="">Chọn preset</option>
            {presets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="Nhập link, mô tả hoặc kịch bản..."
            className="mt-3 w-full rounded-xl border p-3 text-sm"
          />
          <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-3">
            <label className="text-xs font-black text-slate-700">
              Thư mục lưu dự án lên lịch
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={projectBaseDir}
                onChange={(event) => setProjectBaseDir(event.target.value)}
                placeholder="Mặc định: Documents\\VidiFlow Projects"
                className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={() => void chooseProjectBaseDir()}
                disabled={saving === "project-folder"}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60"
              >
                {saving === "project-folder" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
                Chọn thư mục
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Mỗi lịch sẽ tạo một thư mục con riêng tại đây để không ghi đè dự án khác.
            </p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold">
              Ngày giờ bắt đầu tạo
              <input
                type="datetime-local"
                value={createAt}
                onChange={(e) => setCreateAt(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
            <label className="text-xs font-bold">
              Ngày giờ đăng video
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          <p className="mt-3 text-xs font-bold">Nền tảng đăng</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["youtube", "facebook", "tiktok"] as Platform[]).map(
              (platform) => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`rounded-xl border px-2 py-2 text-xs font-black ${platforms.includes(platform) ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700" : "border-slate-200"}`}
                >
                  {platformLabel[platform]}
                </button>
              ),
            )}
          </div>
          {publishMethod === "chrome" && platforms.includes("youtube") && (
            <div className="mt-3 rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-white p-3">
              <p className="text-xs font-black text-red-800">
                Cách xuất bản trên YouTube
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setYoutubePublishMode("schedule")}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs font-black ${youtubePublishMode === "schedule" ? "border-red-500 bg-red-600 text-white" : "border-red-200 bg-white text-slate-700"}`}
                >
                  Lên lịch trên YouTube
                  <span className="mt-1 block text-[10px] font-medium opacity-80">
                    Tải trước rồi đặt đúng giờ công khai
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setYoutubePublishMode("immediate")}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs font-black ${youtubePublishMode === "immediate" ? "border-emerald-500 bg-emerald-600 text-white" : "border-red-200 bg-white text-slate-700"}`}
                >
                  Đăng ngay
                  <span className="mt-1 block text-[10px] font-medium opacity-80">
                    Không tạo lịch trong YouTube Studio
                  </span>
                </button>
              </div>
              {youtubePublishMode === "schedule" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
                  <span>Tải video lên trước giờ đăng</span>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={youtubeLeadMinutes}
                    onChange={(event) =>
                      setYoutubeLeadMinutes(
                        Math.min(180, Math.max(5, Number(event.target.value) || 15)),
                      )
                    }
                    className="w-24 rounded-lg border border-red-200 bg-white px-3 py-2 text-center font-black"
                  />
                  <span>phút</span>
                  <span className="text-[10px] font-medium text-slate-500">
                    Khuyến nghị 15–30 phút để YouTube xử lý HD.
                  </span>
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">
                  {publishAt
                    ? "Tool sẽ chờ đến giờ đăng đã chọn, sau đó tải và đăng công khai ngay."
                    : platforms.length === 1
                      ? "Không cần chọn giờ đăng: video sẽ được đăng công khai ngay sau khi render hoàn tất."
                      : "Facebook/TikTok vẫn cần ngày giờ đăng; YouTube sẽ đăng công khai tại mốc đó."}
                </p>
              )}
            </div>
          )}
          {publishMethod === "chrome" && platforms.includes("youtube") && (
            <label className="mt-3 block text-xs font-black text-slate-700">
              Kênh YouTube sẽ đăng
              <select
                value={selectedYoutubeChannelOptionId}
                onChange={(e) => setSelectedYoutubeChannelOptionId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-bold"
              >
                <option value="">Chọn kênh YouTube đã lưu</option>
                {youtubeChannelsForSelectedProfile.map((channel) => (
                  <option key={channel.id} value={channel.id}>{channel.name}</option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] font-medium text-slate-500">
                Quản lý danh sách kênh trong phần Chrome Publisher bên dưới.
              </span>
            </label>
          )}
          {publishMethod === "chrome" && platforms.includes("facebook") && (
            <label className="mt-3 block text-xs font-black text-slate-700">
              Facebook Page sẽ đăng
              <select
                value={selectedFacebookPageId}
                onChange={(e) => setSelectedFacebookPageId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm font-bold"
              >
                <option value="">Chọn Page của hồ sơ Chrome</option>
                {pagesForSelectedProfile.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            onClick={createJob}
            disabled={saving === "job" || !canSaveJob}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving === "job" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarClock className="h-4 w-4" />
            )}{" "}
            {editingJobId ? "Cập nhật lịch" : "Lưu lịch sản xuất"}
          </button>
          {selected && (
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Đang dùng preset: <b>{selected.name}</b>
            </p>
          )}
        </section>
      </div>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bot className="text-sky-600" />
            <div>
              <h4 className="font-black">3. Telegram Bot có hướng dẫn</h4>
              <p className="text-xs text-slate-500">
                Gửi <b>/new</b>; bot hỏi loại đầu vào → preset → giờ tạo → nền
                tảng → giờ đăng.
              </p>
            </div>
          </div>
          <label className="text-sm font-black">
            <input
              type="checkbox"
              checked={telegramEnabled}
              onChange={(e) => setTelegramEnabled(e.target.checked)}
              className="mr-2 accent-violet-600"
            />
            Bật bot
          </label>
        </header>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder={
              hasToken
                ? "Token đã lưu — nhập để đổi"
                : "Bot Token từ @BotFather"
            }
            className="rounded-xl border px-3 py-2.5 text-sm"
          />
          <input
            value={allowedChatId}
            onChange={(e) => setAllowedChatId(e.target.value)}
            placeholder="Chat ID quản trị"
            className="rounded-xl border px-3 py-2.5 text-sm"
          />
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="rounded-xl border px-3 py-2.5 text-sm font-bold"
          >
            <option value="">Preset mặc định</option>
            {presets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={saveTelegram}
            disabled={saving === "telegram" || !canSaveTelegram}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Settings2 className="mr-2 inline h-4 w-4" />
            Lưu bot
          </button>
          <button
            onClick={testTelegram}
            disabled={saving === "test" || !canTestTelegram}
            className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-black text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="mr-2 inline h-4 w-4" />
            Gửi thử
          </button>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center gap-3">
          <UploadCloud className="text-emerald-600" />
          <div>
            <h4 className="font-black">4. Chọn cách đăng video</h4>
            <p className="text-xs text-slate-500">
              Mặc định ưu tiên Chrome đã đăng nhập cho YouTube, Facebook và TikTok.
            </p>
          </div>
        </header>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => setPublishMethod("api")}
            className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${publishMethod === "api" ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 hover:border-emerald-200"}`}
          >
            <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <KeyRound className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-sm">Đăng tự động qua API</b>
              <span className="text-xs text-slate-500">
                YouTube, Facebook và TikTok qua OAuth/Access Token.
              </span>
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${publishMethod === "api" ? "rotate-180 text-emerald-600" : "text-slate-400"}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setPublishMethod("chrome")}
            className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${publishMethod === "chrome" ? "border-violet-500 bg-violet-50 shadow-sm" : "border-slate-200 hover:border-violet-200"}`}
          >
            <span className="rounded-xl bg-violet-100 p-2 text-violet-700">
              <Monitor className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-sm">Đăng bằng Chrome ẩn</b>
              <span className="text-xs text-slate-500">
                Dùng hồ sơ đã đăng nhập, tự đăng ẩn và đóng Chrome khi thành công.
              </span>
              <span className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700">
                Ưu tiên mặc định · 3 nền tảng
              </span>
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${publishMethod === "chrome" ? "rotate-180 text-violet-600" : "text-slate-400"}`}
            />
          </button>
        </div>
        {publishMethod === "api" && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4">
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border bg-white p-4">
                <h5 className="flex items-center gap-2 font-black">
                  <Youtube className="text-red-600" />
                  YouTube{" "}
                  {publishing.youtube?.connected && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </h5>
                <input
                  value={credentials.youtube.clientId}
                  onChange={(e) =>
                    setCredentials((v) => ({
                      ...v,
                      youtube: { ...v.youtube, clientId: e.target.value },
                    }))
                  }
                  placeholder="OAuth Client ID"
                  className="mt-3 w-full rounded-lg border p-2 text-xs"
                />
                <input
                  type="password"
                  value={credentials.youtube.clientSecret}
                  onChange={(e) =>
                    setCredentials((v) => ({
                      ...v,
                      youtube: { ...v.youtube, clientSecret: e.target.value },
                    }))
                  }
                  placeholder="Client Secret"
                  className="mt-2 w-full rounded-lg border p-2 text-xs"
                />
                <input
                  type="password"
                  value={credentials.youtube.refreshToken}
                  onChange={(e) =>
                    setCredentials((v) => ({
                      ...v,
                      youtube: { ...v.youtube, refreshToken: e.target.value },
                    }))
                  }
                  placeholder="Refresh Token"
                  className="mt-2 w-full rounded-lg border p-2 text-xs"
                />
                <button
                  onClick={() => testPlatform("youtube")}
                  className="mt-2 text-xs font-black text-violet-600"
                >
                  Kiểm tra kết nối
                </button>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <h5 className="flex items-center gap-2 font-black">
                  <Facebook className="text-blue-600" />
                  Facebook Page{" "}
                  {publishing.facebook?.connected && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </h5>
                <input
                  value={credentials.facebook.pageId}
                  onChange={(e) =>
                    setCredentials((v) => ({
                      ...v,
                      facebook: { ...v.facebook, pageId: e.target.value },
                    }))
                  }
                  placeholder="Page ID"
                  className="mt-3 w-full rounded-lg border p-2 text-xs"
                />
                <input
                  type="password"
                  value={credentials.facebook.accessToken}
                  onChange={(e) =>
                    setCredentials((v) => ({
                      ...v,
                      facebook: { ...v.facebook, accessToken: e.target.value },
                    }))
                  }
                  placeholder="Page Access Token"
                  className="mt-2 w-full rounded-lg border p-2 text-xs"
                />
                <button
                  onClick={() => testPlatform("facebook")}
                  className="mt-2 text-xs font-black text-violet-600"
                >
                  Kiểm tra kết nối
                </button>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <h5 className="flex items-center gap-2 font-black">
                  <span className="rounded bg-black px-1.5 py-1 text-xs text-white">
                    TikTok
                  </span>
                  Content Posting{" "}
                  {publishing.tiktok?.connected && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </h5>
                <input
                  type="password"
                  value={credentials.tiktok.accessToken}
                  onChange={(e) =>
                    setCredentials((v) => ({
                      ...v,
                      tiktok: { ...v.tiktok, accessToken: e.target.value },
                    }))
                  }
                  placeholder="Access Token (video.publish)"
                  className="mt-3 w-full rounded-lg border p-2 text-xs"
                />
                <select
                  value={credentials.tiktok.privacyLevel}
                  onChange={(e) =>
                    setCredentials((v) => ({
                      ...v,
                      tiktok: { ...v.tiktok, privacyLevel: e.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-lg border p-2 text-xs"
                >
                  <option value="SELF_ONLY">Chỉ mình tôi (an toàn)</option>
                  <option value="PUBLIC_TO_EVERYONE">Công khai</option>
                </select>
                <button
                  onClick={() => testPlatform("tiktok")}
                  className="mt-2 text-xs font-black text-violet-600"
                >
                  Kiểm tra kết nối
                </button>
              </div>
            </div>
            <button
              onClick={savePublishing}
              disabled={saving === "publishing"}
              className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white"
            >
              <KeyRound className="mr-2 inline h-4 w-4" />
              Lưu kết nối xuất bản
            </button>
          </div>
        )}
        {publishMethod === "chrome" && (
          <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
            <div className="mb-4 rounded-2xl border-2 border-violet-300 bg-gradient-to-r from-violet-100 via-white to-fuchsia-50 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h5 className="text-sm font-black text-violet-950">
                    Hồ sơ Chrome Publisher
                  </h5>
                  <p className="mt-1 text-xs text-slate-600">
                    Mỗi hồ sơ giữ riêng phiên đăng nhập, kênh YouTube và Facebook Page.
                  </p>
                </div>
                <select
                  value={selectedChromeProfileId}
                  onChange={(event) =>
                    selectPublisherChromeProfile(event.target.value)
                  }
                  className="min-w-64 rounded-xl border-2 border-violet-400 bg-white px-4 py-2.5 text-sm font-black text-violet-950 shadow-sm outline-none focus:ring-2 focus:ring-violet-300"
                >
                  {publisherChromeProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} · Port {profile.port}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 grid gap-2 lg:grid-cols-[0.8fr_1.2fr_130px_auto]">
                <input
                  value={newChromeProfileName}
                  onChange={(event) =>
                    setNewChromeProfileName(event.target.value)
                  }
                  placeholder="Tên hồ sơ, ví dụ: Kênh Review"
                  className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
                />
                <input
                  value={newChromeProfileDescription}
                  onChange={(event) =>
                    setNewChromeProfileDescription(event.target.value)
                  }
                  placeholder="Mô tả, ví dụ: Gmail A · Kênh Review"
                  className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
                />
                <input
                  type="number"
                  min={1024}
                  max={65535}
                  value={newChromeProfilePort}
                  onChange={(event) =>
                    setNewChromeProfilePort(event.target.value)
                  }
                  placeholder="Port"
                  className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={addPublisherChromeProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-800"
                >
                  <Plus className="h-4 w-4" />
                  Tạo hồ sơ
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {publisherChromeProfiles.map((profile) => {
                  const active = profile.id === selectedChromeProfileId;
                  return (
                    <span
                      key={profile.id}
                      title={profile.description || "Chưa có mô tả"}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${active ? "border-violet-700 bg-violet-700 text-white" : "border-violet-200 bg-white text-slate-700"}`}
                    >
                      <button
                        type="button"
                        onClick={() => selectPublisherChromeProfile(profile.id)}
                      >
                        {profile.name} · {profile.port}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deletePublisherChromeProfile(profile)}
                        className={active ? "text-white/80 hover:text-white" : "text-rose-500"}
                        title="Xóa hồ sơ khỏi danh sách"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
              <div className="mt-4 rounded-xl border border-violet-200 bg-white/90 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-black text-violet-900">
                  <Pencil className="h-3.5 w-3.5" />
                  Chỉnh hồ sơ đang chọn
                </div>
                <div className="grid gap-2 md:grid-cols-[0.8fr_1.2fr_auto]">
                  <input
                    value={editingChromeProfileName}
                    onChange={(event) =>
                      setEditingChromeProfileName(event.target.value)
                    }
                    placeholder="Tên hiển thị của Chrome"
                    className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
                  />
                  <input
                    value={editingChromeProfileDescription}
                    onChange={(event) =>
                      setEditingChromeProfileDescription(event.target.value)
                    }
                    placeholder="Mô tả tài khoản, kênh hoặc mục đích sử dụng"
                    className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={updateSelectedPublisherChromeProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-4 py-2.5 text-sm font-black text-violet-900 hover:bg-violet-200"
                  >
                    <Save className="h-4 w-4" />
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <label className="text-xs font-black text-slate-700">
                  Chrome đăng bài riêng của VidiFlow
                </label>
                <div className="mt-2 rounded-xl border border-violet-200 bg-white px-4 py-3">
                  <p className="text-sm font-black text-slate-900">
                    {selectedChromeProfile.name} · Port {selectedChromePort}
                  </p>
                  {selectedChromeProfile.description && (
                    <p className="mt-1 text-xs font-semibold text-violet-700">
                      {selectedChromeProfile.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Mở Chrome này trước để đăng nhập YouTube, Facebook và TikTok. Tool sẽ lưu phiên riêng
                    và dùng lại ở chế độ ẩn cho các lịch đăng sau. Chrome setup có thể đóng sau khi đăng nhập.
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Một tài khoản Google/Facebook có thể quản lý nhiều kênh hoặc Page. Mỗi lịch lưu riêng đúng đích đã chọn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void openChromePublisher()}
                disabled={saving === "open-publisher"}
                className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
              >
                {saving === "open-publisher" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                {saving === "open-publisher"
                  ? "Đang mở Chrome..."
                  : "Mở Chrome & đăng nhập 3 nền tảng"}
              </button>
            </div>
            {platforms.includes("youtube") && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-black text-slate-900">Kênh YouTube trong hồ sơ này</h5>
                    <p className="text-xs text-slate-500">
                      Lưu nhiều kênh của cùng tài khoản Google, sau đó chọn kênh đích cho từng lịch.
                    </p>
                  </div>
                  {youtubeChannelsForSelectedProfile.length > 0 && (
                    <select
                      value={selectedYoutubeChannelOptionId}
                      onChange={(e) => setSelectedYoutubeChannelOptionId(e.target.value)}
                      className="min-w-56 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-bold"
                    >
                      {youtubeChannelsForSelectedProfile.map((channel) => (
                        <option key={channel.id} value={channel.id}>{channel.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-[0.7fr_1.5fr_auto]">
                  <input
                    value={newYoutubeChannelName}
                    onChange={(e) => setNewYoutubeChannelName(e.target.value)}
                    placeholder="Tên kênh, ví dụ: Kênh Shorts"
                    className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm"
                  />
                  <input
                    value={newYoutubeStudioUrl}
                    onChange={(e) => setNewYoutubeStudioUrl(e.target.value)}
                    placeholder="https://studio.youtube.com/channel/UC..."
                    className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addYoutubeChannel}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white"
                  >
                    + Lưu kênh
                  </button>
                </div>
                {youtubeChannelsForSelectedProfile.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {youtubeChannelsForSelectedProfile.map((channel) => (
                      <span
                        key={channel.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${channel.id === selectedYoutubeChannelOptionId ? "border-red-500 bg-red-600 text-white" : "border-red-200 bg-white text-slate-700"}`}
                      >
                        <button type="button" onClick={() => setSelectedYoutubeChannelOptionId(channel.id)}>
                          {channel.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteYoutubeChannel(channel)}
                          className={channel.id === selectedYoutubeChannelOptionId ? "text-white/80 hover:text-white" : "text-rose-500"}
                          title="Xóa kênh"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {platforms.includes("facebook") && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-black text-slate-900">
                      Facebook Pages trong hồ sơ này
                    </h5>
                    <p className="text-xs text-slate-500">
                      Lưu nhiều Page cho cùng một tài khoản Facebook, sau đó
                      chọn Page cho từng lịch đăng.
                    </p>
                  </div>
                  {pagesForSelectedProfile.length > 0 && (
                    <select
                      value={selectedFacebookPageId}
                      onChange={(e) =>
                        setSelectedFacebookPageId(e.target.value)
                      }
                      className="min-w-56 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold"
                    >
                      {pagesForSelectedProfile.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-[0.7fr_1.5fr_auto]">
                  <input
                    value={newFacebookPageName}
                    onChange={(e) => setNewFacebookPageName(e.target.value)}
                    placeholder="Tên Page, ví dụ: VidiFlow Việt Nam"
                    className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm"
                  />
                  <input
                    value={newFacebookPageUrl}
                    onChange={(e) => setNewFacebookPageUrl(e.target.value)}
                    placeholder="https://www.facebook.com/ten-page"
                    className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addFacebookPage}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white"
                  >
                    + Lưu Page
                  </button>
                </div>
                {pagesForSelectedProfile.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pagesForSelectedProfile.map((page) => (
                      <span
                        key={page.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${page.id === selectedFacebookPageId ? "border-blue-500 bg-blue-600 text-white" : "border-blue-200 bg-white text-slate-700"}`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedFacebookPageId(page.id)}
                        >
                          {page.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteFacebookPage(page)}
                          className={
                            page.id === selectedFacebookPageId
                              ? "text-white/80 hover:text-white"
                              : "text-rose-500"
                          }
                          title="Xóa Page"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black">Tiến độ tạo và đăng</h4>
            <p className="text-xs text-slate-500">
              Tool tự nhận job đến hạn; worker đăng video chạy sau khi file MP4
              hoàn tất.
            </p>
          </div>
          <button onClick={() => void load()} className="rounded-xl border p-2">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {jobs.map((job) => {
            const telemetry = getJobTelemetry(job);
            const completedCompact = job.status === "completed";
            const detailsExpanded =
              job.status === "running" ||
              job.publishStatus === "publishing" ||
              expandedJobIds.has(job.id);
            const showJobDetails = !completedCompact || detailsExpanded;
            return (
            <article key={job.id} className={`rounded-2xl border ${showJobDetails ? "p-4" : "px-4 py-3"}`}>
              <div className="flex flex-wrap gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{job.presetName}</b>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black ${job.status === "interrupted" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-700"}`}>
                      {statusLabel[job.status]}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
                      {publishLabel[job.publishStatus || "not_requested"]}
                    </span>
                    <code className="text-[10px] text-slate-400">{job.id}</code>
                  </div>
                  {showJobDetails ? (
                  <>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{job.input}</p>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Tạo: {new Date(job.scheduledAt).toLocaleString("vi-VN")}
                    {job.publishAt
                      ? ` · Đăng: ${new Date(job.publishAt).toLocaleString("vi-VN")}`
                      : ""}{" "}
                    ·{" "}
                    {(job.publishPlatforms || [])
                      .map((item) => platformLabel[item])
                      .join(", ") || "Không tự đăng"}
                    {(job.publishPlatforms || []).includes("youtube") &&
                      job.publishMethod === "chrome"
                      ? job.youtubePublishMode === "immediate"
                        ? " · YouTube: đăng ngay"
                        : ` · YouTube: tải trước ${job.youtubeLeadMinutes || 15} phút`
                      : ""}
                  </p>
                  {job.publishResults?.map((result, i) => (
                    <p
                      key={`${result.platform}-${i}`}
                      className={`text-[10px] ${["scheduled", "published"].includes(result.state) ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {platformLabel[result.platform]}:{" "}
                      {result.state === "scheduled"
                        ? result.url || "Đã lên lịch trên YouTube"
                        : result.state === "published"
                        ? result.url || "Đã đăng"
                      : result.error}
                    </p>
                  ))}
                  </>
                  ) : (
                    <p className="mt-1 truncate text-[10px] text-slate-400">
                      Hoàn tất {job.updatedAt ? new Date(job.updatedAt).toLocaleString("vi-VN") : ""}
                      {job.publishPlatforms?.length
                        ? ` · ${job.publishPlatforms.map((item) => platformLabel[item]).join(", ")}`
                        : " · Không tự đăng"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  {completedCompact && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedJobIds((previous) => {
                          const next = new Set(previous);
                          if (next.has(job.id)) next.delete(job.id);
                          else next.add(job.id);
                          return next;
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                      title={detailsExpanded ? "Thu gọn task" : "Xem tiến độ và log chi tiết"}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${detailsExpanded ? "rotate-180" : ""}`} />
                      <span className="hidden sm:inline">{detailsExpanded ? "Thu gọn" : "Chi tiết"}</span>
                    </button>
                  )}
                  {job.status === "completed" && job.projectDir && (
                    <button
                      type="button"
                      onClick={() => void viewCompletedProject(job)}
                      disabled={saving === `view-${job.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                    >
                      {saving === `view-${job.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {saving === `view-${job.id}`
                        ? "Đang nạp..."
                        : "Xem kết quả"}
                    </button>
                  )}
                  {job.status === "scheduled" && (
                    <button
                      type="button"
                      onClick={() => fillJobForm(job, true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100"
                      title="Chỉnh sửa lịch chưa chạy"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Chỉnh sửa</span>
                    </button>
                  )}
                  {["interrupted", "failed", "cancelled"].includes(job.status) && (
                    <>
                      <button
                        type="button"
                        onClick={() => void resumeInterruptedJob(job)}
                        disabled={isPipelineRunning || saving === `resume-${job.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Giữ dữ liệu đã có, mở dự án để sửa và chạy tiếp từ bước cần thiết"
                      >
                        {saving === `resume-${job.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        Chạy tiếp
                      </button>
                      <button
                        type="button"
                        onClick={() => void restartJob(job)}
                        disabled={isPipelineRunning || saving === `restart-${job.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Tạo task và thư mục mới, chạy lại toàn bộ quy trình"
                      >
                        {saving === `restart-${job.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Chạy lại
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => fillJobForm(job, false)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700 transition hover:bg-sky-100"
                    title="Sao chép cấu hình để tạo video tương tự"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sao chép</span>
                  </button>
                  {job.status === "scheduled" &&
                    new Date(job.scheduledAt).getTime() <= Date.now() && (
                      <button
                        onClick={() => onRunJob(job.id)}
                        disabled={isPipelineRunning}
                        className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white"
                      >
                        <Play className="mr-1 inline h-3.5 w-3.5" />
                        Chạy
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => void deleteJob(job)}
                    disabled={
                      job.status === "running" || saving === `delete-${job.id}`
                    }
                    title={
                      job.status === "running"
                        ? "Hãy dừng tác vụ trước khi xóa"
                        : "Xóa tác vụ"
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving === `delete-${job.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">Xóa</span>
                  </button>
                </div>
              </div>
              {showJobDetails && (job.status !== "scheduled" || telemetry.progress > 0) && (
                <div className="mt-4 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.14em] text-sky-600">Đang thực hiện</p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        Bước {telemetry.stage}/7 · {pipelineStepLabels[telemetry.stage - 1]}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                      {telemetry.mediaTotal > 0 && (
                        <span className="rounded-full bg-fuchsia-100 px-3 py-1.5 text-fuchsia-700">
                          Media {telemetry.mediaCompleted}/{telemetry.mediaTotal}
                        </span>
                      )}
                      <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-700">
                        {telemetry.progress}%
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                        Đã chạy {formatElapsed(job.createdAt || job.scheduledAt)}
                      </span>
                      <span className="text-slate-400">
                        Cập nhật {job.updatedAt ? new Date(job.updatedAt).toLocaleTimeString("vi-VN") : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${job.status === "interrupted" ? "bg-amber-500" : job.status === "failed" ? "bg-rose-500" : "bg-gradient-to-r from-sky-500 to-violet-600"}`}
                      style={{ width: `${Math.max(2, telemetry.progress)}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
                    {pipelineStepLabels.map((label, index) => {
                      const stepNumber = index + 1;
                      const completed = stepNumber < telemetry.stage || telemetry.progress === 100;
                      const current = stepNumber === telemetry.stage && telemetry.progress < 100;
                      return (
                        <div
                          key={label}
                          className={`rounded-lg border px-2 py-2 text-[9px] font-black ${completed ? "border-emerald-200 bg-emerald-100 text-emerald-700" : current ? "border-sky-300 bg-sky-100 text-sky-800" : "border-slate-200 bg-white text-slate-400"}`}
                        >
                          <span className="mr-1">{completed ? "✓" : current ? "●" : "○"}</span>
                          {stepNumber}. {label}
                        </div>
                      );
                    })}
                  </div>
                  {telemetry.logs.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-950 px-3 py-2.5 font-mono text-[10px] leading-5 text-slate-200">
                      {telemetry.logs.slice(-4).map((line, index) => (
                        <p key={`${line}-${index}`} className={index === telemetry.logs.slice(-4).length - 1 ? "text-emerald-300" : "text-slate-400"}>
                          {index === telemetry.logs.slice(-4).length - 1 ? "› " : "  "}{line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
            );
          })}
        </div>
      </section>
      {jobs.some(
        (job) =>
          job.status === "completed" &&
          job.publishMethod === "chrome" &&
          job.publishPlatforms.length > 0,
      ) && (
        <section className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <UploadCloud className="text-blue-600" />
            <div>
              <h4 className="font-black text-slate-900">
                Chuẩn bị đăng bằng Chrome
              </h4>
              <p className="text-xs text-slate-600">
                Tool tải MP4 và điền nội dung vào đúng trang YouTube, Facebook hoặc TikTok.
                Bạn kiểm tra lần cuối rồi xác nhận đăng.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {jobs
              .filter(
                (job) =>
                  job.status === "completed" &&
                  job.publishMethod === "chrome" &&
                  job.publishPlatforms.length > 0,
              )
              .map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => void prepareChromePublish(job)}
                  disabled={saving === `chrome-${job.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                >
                  {saving === `chrome-${job.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  {saving === `chrome-${job.id}`
                    ? "Đang đưa vào Chrome..."
                    : `Chuẩn bị đăng: ${job.presetName}`}
                </button>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
