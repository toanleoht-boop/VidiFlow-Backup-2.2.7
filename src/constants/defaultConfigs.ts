import { VoicePresetId, SceneDensity } from "./enums";

export const SCENE_DENSITY_MAP = {
  [SceneDensity.THEO_TU]: { maxChars: 65, label: "Word-based (Ultra-dense)" },
  [SceneDensity.CAU_NGAN]: { maxChars: 90, label: "Short sentence (Hyper-dense)" },
  [SceneDensity.CAU_KET_HOP]: { maxChars: 135, label: "Mixed Sentences (Combined)" },
  [SceneDensity.CAU_DAI]: { maxChars: 180, label: "Long sentence (Standard)" },
  [SceneDensity.THEO_DOAN]: { maxChars: 350, label: "Paragraph-based (Slow-paced)" },
} as const;

export const boundaries = [".", "!", "?", "\n"];

export const pauseChars = [" ", ",", "."];
export const closedKeywords = ["closed", "close", "context"];

export const FALLBACK_VOICES = [
  {
    id: "elevenlabs-cloud-vi",
    name: "AI Cao Cấp",
    voiceId: "cgSgspJ2msm6clMCkdW9",
    provider: "elevenlabs",
    gender: "female",
    previewUrl: "https://elevenlabs.io/api/v1/projects",
    language: "vi",
  },
  { id: VoicePresetId.PRESET_VI_BAC_FEMALE, name: "Hoài My (Nữ Bắc)", provider: "ttsfree", gender: "female", voiceId: "vi-VN-Standard-A", language: "vi" },
  { id: VoicePresetId.PRESET_VI_BAC_MALE, name: "Nam Minh (Nam Bắc)", provider: "ttsfree", gender: "male", voiceId: "vi-VN-Standard-B", language: "vi" },
  { id: VoicePresetId.PRESET_VI_TRUNG_FEMALE, name: "Thùy Vy (Nữ Trung)", provider: "ttsfree", gender: "female", voiceId: "vi-VN-Standard-C", language: "vi" },
  { id: VoicePresetId.PRESET_VI_TRUNG_MALE, name: "Gia Bảo (Nam Trung)", provider: "ttsfree", gender: "male", voiceId: "vi-VN-Standard-D", language: "vi" },
  { id: VoicePresetId.PRESET_VI_NAM_FEMALE, name: "Lan Trinh (Nữ Nam)", provider: "ttsfree", gender: "female", voiceId: "vi-VN-Standard-E", language: "vi" },
  { id: VoicePresetId.PRESET_VI_NAM_MALE, name: "Minh Quang (Nam Nam)", provider: "ttsfree", gender: "male", voiceId: "vi-VN-Standard-F", language: "vi" },
];

export const supportedTypes = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

export const SYSTEM_STATUS = {
  READY: "ready",
  PROCESSING: "processing",
  COMPLETED: "completed",
  ERROR: "error",
};

export const defaultVoiceConfig = {
  voiceURI: VoicePresetId.PRESET_VI_BAC_FEMALE,
  speed: 1.0,
  pitch: 1.0,
  emotion: "neutral",
  volume: 1.0,
};

export const defaultProjectInput = {
  topic: "",
  genre: "Storytelling",
  duration: 60,
  writingStyle: "Documentary",
};

export const defaultProjectConfig = {
  aspectRatio: "16:9",
  visualStyle: "Photorealistic",
  complexity: "medium",
  fps: 30,
};

export const defaultHookConfig = {
  type: "Auto",
  duration: 10,
  positions: "start",
};

export const defaultVisualConfig = {
  referenceImages: [],
  globalStyleReference: null,
  colorPalette: "",
};

export const VOICE_MODIFIERS: Record<string, { speed: number; pitch: number }> = {
  [VoicePresetId.PRESET_VI_BAC_FEMALE]: { speed: 1.0, pitch: 1.04 },
  [VoicePresetId.PRESET_VI_BAC_MALE]: { speed: 0.95, pitch: 0.9 },
  [VoicePresetId.PRESET_VI_TRUNG_FEMALE]: { speed: 1.02, pitch: 1.05 },
  [VoicePresetId.PRESET_VI_TRUNG_MALE]: { speed: 0.95, pitch: 0.92 },
  [VoicePresetId.PRESET_VI_NAM_FEMALE]: { speed: 1.05, pitch: 1.05 },
  [VoicePresetId.PRESET_VI_NAM_MALE]: { speed: 0.98, pitch: 0.95 },
  [VoicePresetId.PRESET_VI_KID]: { speed: 1.05, pitch: 1.22 },
  [VoicePresetId.ELEVENLABS_CLOUD_VI]: { speed: 0.95, pitch: 0.98 },
  [VoicePresetId.AZURE_CLOUD_VI_HOAIMY]: { speed: 1.05, pitch: 1.1 },
  [VoicePresetId.AZURE_CLOUD_VI_NAMMINH]: { speed: 0.98, pitch: 0.9 },
  [VoicePresetId.GOOGLE_CLOUD_VI_A]: { speed: 1.0, pitch: 1.03 },
  [VoicePresetId.GOOGLE_CLOUD_VI_B]: { speed: 1.02, pitch: 0.95 },
  [VoicePresetId.OPENAI_TTS_ALLOY]: { speed: 1.0, pitch: 1.0 },
  [VoicePresetId.OPENAI_TTS_NOVA]: { speed: 1.05, pitch: 1.15 },
};

export const DEFAULT_SCENE_CAMERA_MOTION = "Zoom In";
export const DEFAULT_SCENE_EFFECTS = "Soft natural lighting";
export const DEFAULT_SCENE_TRANSITION = "None";
export const DEFAULT_SCENE_PROMPT_PREFIX = "A clean cinematic visual illustrating: ";

export const TEXT_PROCESSOR_CONFIGS = {
  MAX_CHUNK_SIZE: 2500,
  MIN_CHUNK_SIZE: 2000,
  DEFAULT_MAX_WORDS_SAFE: 12,
  SENTENCE_SPLIT_MIN_RATIO: 0.3,
  SENTENCE_SPLIT_MAX_RATIO: 0.7,
  MAX_SCENES_LIMIT: 250,
  DEFAULT_FALLBACK_SCENES_COUNT: 8,
  DEFAULT_SCENE_DURATION: 5,
  MIN_SCENE_DURATION: 5,
  MAX_SCENE_DURATION: 20,
  MIN_LAST_SCENE_DURATION: 3,
  WORDS_PER_SECOND_RATIO: 2.2,
  MIN_PARAGRAPH_LENGTH: 10,
} as const;

export const STRATEGY_WORDS_LIMITS = {
  mixed_sentences: 18,
  ultradense: 12,
  word: 12,
  hyperdense: 12,
  short_sentence: 12,
  highpaced: 15,
} as const;

export const STRATEGY_SENTENCE_CHUNKS = {
  dramatic: 2,
  paragraph: 3,
  epic: 4,
  cinematic: 5,
  artistic: 6,
  slowpaced: 7,
  super_slow: 10,
} as const;

export const DEFAULT_STYLE = "Realistic";
export const DEFAULT_CHAPTER = {
  id: "ch_1",
  titleEn: "Chapter 1",
  titleVi: "Chương 1",
} as const;
export const MIN_PARAGRAPHS_COUNT = 3;
export const NEWLINE_CHAR = "\n";
export const SPACE_CHAR = " ";
export const SINGLE_WHITESPACE_REGEX = /\s/;
export const MULTIPLE_NEWLINES_REGEX = /\n+/;



