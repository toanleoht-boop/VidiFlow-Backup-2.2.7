import { translations } from "../lib/lang.js";
import { VideoGenre } from "./enums.js";

export const APP_TEXTS = {
  VN: {
    APP_TITLE: translations.vi.appTitle,
    SAVE: translations.vi.save,
    CANCEL: translations.vi.cancel,
    DELETE: translations.vi.delete,
    EDIT: translations.vi.editProject,
    CLOSE: translations.vi.Close,
    LOADING: translations.vi.Loading,
    SCENE_DETAIL: translations.vi.sceneEditor,
    CONFIRM_DELETE: translations.vi.confirmDelete,
    NEXT_PAGE: translations.vi.Next,
    PREV_PAGE: translations.vi.Previous,
    DRAW_IMAGE: translations.vi.generateImage,
    UPLOAD_IMAGE: translations.vi.uploadSceneAssets,
    NO_IMAGE: translations.vi.charNoImages,
    APPLY: translations.vi.charApplyBtn,
    ERROR_OCCURRED: "Đã có lỗi xảy ra",
    SUCCESS: translations.vi.Success,
    BATCH_DELAY: translations.vi.Batch_Delay,
    BATCH_DELAY_DEFAULT: translations.vi.Batch_Delay_Default,
    BATCH_DELAY_1S: translations.vi.Batch_Delay_1s,
    BATCH_DELAY_2S: translations.vi.Batch_Delay_2s,
    BATCH_DELAY_3S: translations.vi.Batch_Delay_3s,
    BATCH_DELAY_RANDOM_123: translations.vi.Batch_Delay_Random_123,
    WAITING_MSG: (secs: string) => `Đang chờ ${secs} giây trước khi vẽ phân cảnh tiếp theo...`,
    NO_SCENES_TO_OPTIMIZE: "Không tìm thấy phân cảnh nào để cải thiện.",
    OPTIMIZING_PROMPTS_FALLBACK: "Đang tối ưu...",
    OPTIMIZE_PROMPTS_SUCCESS_FALLBACK: "Cải thiện mô tả hình ảnh thành công!",
    OPTIMIZE_PROMPTS_FAILED_FALLBACK: "Gặp sự cố khi tối ưu mô tả ảnh: ",
    OPTIMIZATION_FAILED: "Không thể tối ưu hóa mô tả hình ảnh",
  },
  EN: {
    APP_TITLE: translations.en.appTitle,
    SAVE: translations.en.save,
    CANCEL: translations.en.cancel,
    DELETE: translations.en.delete,
    EDIT: translations.en.editProject,
    CLOSE: translations.en.Close,
    LOADING: translations.en.Loading,
    SCENE_DETAIL: translations.en.sceneEditor,
    CONFIRM_DELETE: translations.en.confirmDelete,
    NEXT_PAGE: translations.en.Next,
    PREV_PAGE: translations.en.Previous,
    DRAW_IMAGE: translations.en.generateImage,
    UPLOAD_IMAGE: translations.en.uploadSceneAssets,
    NO_IMAGE: translations.en.charNoImages,
    APPLY: translations.en.charApplyBtn,
    ERROR_OCCURRED: "An error occurred",
    SUCCESS: translations.en.Success,
    BATCH_DELAY: translations.en.Batch_Delay,
    BATCH_DELAY_DEFAULT: translations.en.Batch_Delay_Default,
    BATCH_DELAY_1S: translations.en.Batch_Delay_1s,
    BATCH_DELAY_2S: translations.en.Batch_Delay_2s,
    BATCH_DELAY_3S: translations.en.Batch_Delay_3s,
    BATCH_DELAY_RANDOM_123: translations.en.Batch_Delay_Random_123,
    WAITING_MSG: (secs: string) => `Waiting ${secs}s before next scene...`,
    NO_SCENES_TO_OPTIMIZE: "No scenes found to improve.",
    OPTIMIZING_PROMPTS_FALLBACK: "Optimizing...",
    OPTIMIZE_PROMPTS_SUCCESS_FALLBACK: "Successfully improved image descriptions!",
    OPTIMIZE_PROMPTS_FAILED_FALLBACK: "Error optimizing image descriptions: ",
    OPTIMIZATION_FAILED: "Could not optimize image descriptions",
  },
};

export const SCENE_SPLIT_PROMPTS = {
  VN: {
    DEFAULT_SCRIPT: (idx: number) => `Chi tiết cốt truyện hấp dẫn phần ${idx} tiếp nối mạch truyện đầy lôi cuốn.`,
    EFFECTS: (style: string) => `Phủ hiệu ứng ánh sáng dịu nhẹ phong cách ${style}`,
    PROMPT: (context: string, style: string, aspectRatio: string) => `Stunning high-quality design depicting: ${context}. Adhering to ${style} style, rich colors, custom cinematic camera composition, dramatic storytelling lighting, detailed award-winning masterpiece. --ar ${aspectRatio}`,
  },
  EN: {
    DEFAULT_SCRIPT: (idx: number) => `Interesting plot detail part ${idx} continuing the engaging narrative.`,
    EFFECTS: (style: string) => `Soft light leaks overlays adhering to ${style} feel`,
    PROMPT: (context: string, style: string, aspectRatio: string) => `Stunning high-quality design depicting: ${context}. Adhering to ${style} style, rich colors, custom cinematic camera composition, dramatic storytelling lighting, detailed award-winning masterpiece. --ar ${aspectRatio}`,
  },
};

export const HTTP_METHODS = {
  PUT: "PUT",
  POST: "POST",
  GET: "GET",
  DELETE: "DELETE",
};

export const CONTENT_TYPES = {
  JSON: "application/json",
  NDJSON: "application/x-ndjson",
};

export const HTTP_HEADERS = {
  CONTENT_TYPE: "Content-Type",
  TRANSFER_ENCODING: "Transfer-Encoding",
  XI_API_KEY: "xi-api-key",
};

export const TRANSFER_ENCODINGS = {
  CHUNKED: "chunked",
};

export const HTTP_STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const TEMPLATE_CONFIG = {
  PAYLOAD_LIMIT: "50mb",
  DIR_NAME: "templates/capcut",
  JSON_EXT: ".json",
  SORT_FIELD_CREATED_AT: "createdAt",
  SORT_ORDER_DESC: "desc" as "desc" | "asc",
  UTF8: "utf8" as BufferEncoding,
  JSON_SPACE: 2,
  REGEX_NFD: /[\u0300-\u036f]/g,
  REGEX_SAFE_NAME: /[^a-zA-Z0-9 -]/g,
  REGEX_SPACE: /\s+/g,
  ID_LENGTH: 8,
};

export const AUDIO_MIME_TYPE = "audio/wav";
export const SIMULATED_SPEECH_VAL = "simulated_speech";
export const BLOB_PREFIX = "blob:";
export const RESTORE_SCENE_BLOB_ERR = "FAILED_RESTORE_SCENE_BLOB";
export const RESTORE_BLOB_ERR = "FAILED_RESTORE_BLOB";

export const CONTENT_TYPE_HEADER = HTTP_HEADERS.CONTENT_TYPE;

export const THEME_VALUES = {
  DARK: "dark",
  LIGHT: "light",
} as const;

export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
} as const;

export const TTS_POLLING_CONFIG = {
  MAX_ATTEMPTS: 60,
  INTERVAL_MS: 5000,
  STATUS_DONE: "done",
  STATUS_ERROR: "error",
} as const;

export const COMMON_STRINGS = {
  UNDEFINED: "undefined",
  NULL: "null",
  PROJECT_PREFIX: "proj_",
  SIMULATED: "simulated",
  EN: "en",
  VI: "vi",
  BASE64_IMAGE_PREFIX: "data:image/",
  PROJECT_DEFAULT_NAME: "PROJECT",
  JPEG_EXT: "jpeg",
  JPG_EXT: "jpg",
  UNIFIED_WAV: "unified.wav",
  SLASH_ASSETS_SLASH: "/assets/",
  SCENE_PREFIX: "sc_",
  DEFAULT_GENRE: "Story",
  HTTP_PREFIX: "http",
  HTTPS_PREFIX: "https",
  SLASH_PREFIX: "/",
  BASE64_AUDIO_LENGTH_THRESHOLD: 100,
  CUSTOM: "Custom",
  NA: "N/A",
  SUCCESS_MARK: "✓",
  SUCCESS_KEYWORD_VI: "thành công",
  NORMALIZATION_FORM: "NFD",
  BASE64: "base64",
  WAV_EXT: ".wav",
  THUMB_PREFIX: "thumb_",
  LOREM_FLICKR_SIZE: "800/450",
  IMAGE_DIFF_THRESHOLD: 1,
  REGEX_REPLACE_GROUP_1: "$1",
} as const;

export const ERROR_MESSAGES = {
  HTTP_ERROR_PREFIX: "HTTP Error ",
  AUTO_SAVE_ERR: "ERROR_AUTO_SAVING_PROJECT",
  PARSING_PROJECTS: "ERROR_PARSING_PROJECTS",
  FETCHING_PROJECTS: "ERROR_FETCHING_PROJECTS",
  CREATING_PROJECT: "ERROR_CREATING_PROJECT",
  DELETING_PROJECT: "ERROR_DELETING_PROJECT",
  UPDATING_PROJECT: "ERROR_UPDATING_PROJECT",
  FLUSH_SAVE_ON_UNMOUNT: "ERROR_FLUSH_SAVE_ON_UNMOUNT",
  PROJECT_READ_ERR: "PROJECT_READ_ERR",
  PROJECT_WRITE_ERR: "PROJECT_WRITE_ERR",
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  WRITE_SCENE_IMAGE_ERR: "Lỗi ghi file ảnh scene: ",
  WRITE_SCENE_AUDIO_ERR: "Lỗi ghi file âm thanh scene: ",
  WRITE_THUMB_IMAGE_ERR: "Lỗi ghi file ảnh thumbnail: ",
  WRITE_UNIFIED_AUDIO_ERR: "Lỗi ghi file âm thanh hợp nhất dự án ",
  RENAME_ASSETS_DIR_ERR: "Lỗi đổi tên folder assets",
  DELETE_SCENE_IMAGE_DISK_ERR: "Lỗi khi xóa file ảnh phân cảnh trên đĩa: ",
  READ_IMAGES_DIR_CLEAN_ERR: "Lỗi đọc thư mục ảnh để dọn dẹp: ",
  DELETE_PROJECT_ASSETS_ERR: "Lỗi xóa thư mục assets của dự án",
  DELETE_SCENE_AUDIO_DISK_ERR: "[Dọn dẹp Audio] Không thể xóa file voice phân cảnh cũ: ",
  READ_AUDIO_DIR_CLEAN_ERR: "[Dọn dẹp Audio] Không thể đọc thư mục audio để dọn dẹp: ",
  DELETE_UNIFIED_AUDIO_DISK_ERR: "[Dọn dẹp Audio] Không thể xóa file voice tổng hợp cũ: ",
  BULK_DELETE_PROJECT_DIR_ERR: "Lỗi dọn dẹp toàn bộ thư mục dự án cũ khi tạo lại phân cảnh: ",
  LLM_EXECUTION_FAILED: "Unable to execute LLM request.",
  FETCH_AUDIO_URL_FOR_ALIGN_ERR: "FETCH_AUDIO_URL_FOR_ALIGN_ERR",
  RENAME_ASSETS_DIR_ERR_FALLBACK: "(Đang thử copy đệ quy...)",
  COPY_ASSETS_DIR_ERR: "Lỗi không thể copy thư mục mới",
} as const;

export const LOG_MESSAGES = {
  DELETE_SCENE_IMAGE_DISK_SUCCESS: "Đã xóa file ảnh phân cảnh trên đĩa (dọn dẹp prefix): ",
  DELETE_SCENE_AUDIO_DISK_SUCCESS: "[Dọn dẹp Audio] Đã xóa file voice phân cảnh cũ: ",
  DELETE_UNIFIED_AUDIO_DISK_SUCCESS: "[Dọn dẹp Audio] Đã xóa file voice tổng hợp cũ: ",
  BULK_DELETE_PROJECT_DIR_SUCCESS: "Đã dọn dẹp sạch toàn bộ thư mục dự án cũ khi tạo lại phân cảnh: ",
  DELETE_OLD_LOCKED_DIR_WARN: "Không thể xóa hoàn toàn thư mục cũ do file bị lock: ",
} as const;

export const DEFAULT_PROJECT_CONFIGS = {
  GENRE: "Storytelling",
  DURATION: "2m",
  AUDIENCE: "General Audience",
  WRITING_STYLE: "Professional",
  HOOK_TYPE: "Auto",
  VOICE_PROVIDER: "Gemini Speech",
  VOICE_EMOTION: "Normal",
  VOICE_URI: "preset-vi-bac",
  VISUAL_SOURCE: "AI Auto",
  VISUAL_STYLE: "Realistic",
  VISUAL_QUALITY: "Standard",
} as const;

export const EXPORT_LOADING_TEXTS = {
  vi: {
    VIDEO_TITLE: "Đang kết xuất Video...",
    VIDEO_DESC: "Vui lòng chờ trong giây lát, tiến trình này có thể mất chút thời gian...",
    CAPCUT_TITLE: "Đang xuất CapCut...",
    XML_TITLE: "Đang xuất cấu trúc XML...",
    ZIP_TITLE: "Đang đóng gói ZIP...",
    SRT_TITLE: "Đang xuất SRT...",
  },
  en: {
    VIDEO_TITLE: "Rendering Video...",
    VIDEO_DESC: "Please wait a moment, this process may take some time...",
    CAPCUT_TITLE: "Exporting CapCut...",
    XML_TITLE: "Exporting XML structure...",
    ZIP_TITLE: "Packaging ZIP...",
    SRT_TITLE: "Exporting SRT...",
  },
} as const;

export const EXPORT_URLS = {
  DEFAULT_S3_BUCKET: "https://s3.amazonaws.com/your-bucket",
} as const;

export const EXTERNAL_AUDIO_TEXTS = {
  LOG_ACTION: "handleProcessExternalAudio",
  LOG_ERROR_KEY: "EXTERNAL_AUDIO_ALIGN_FAILED",
  vi: {
    NO_SCENES: "Không có phân cảnh nào để đồng bộ.",
    ALIGNING: "Đang đồng bộ giọng nói bằng Whisper...",
    SCENE_NOT_FOUND: "Không tìm thấy thông tin đồng bộ cho phân cảnh {sceneId}.",
    ALIGN_SUCCESS: "Đồng bộ giọng nói thành công.",
    NO_VALID_RESULT: "Không có kết quả đồng bộ hợp lệ.",
    SYNC_COMPLETE: "Đồng bộ kịch bản và giọng nói hoàn tất (Tổng thời lượng: {totalDuration}s)\n",
    SYNC_ITEM: "👉 Phân cảnh #{index} [{startTime} -> {endTime}] ({duration}s): {script}...\n",
    ALIGN_ERROR: "Lỗi đồng bộ giọng nói: {error}",
    SERVER_ALIGN_ERROR: "Lỗi đồng bộ giọng đọc từ server.",
  },
  en: {
    NO_SCENES: "No scenes to synchronize.",
    ALIGNING: "Synchronizing voice with Whisper AI...",
    SCENE_NOT_FOUND: "Sync info not found for scene {sceneId}.",
    ALIGN_SUCCESS: "Voice synchronization successful.",
    NO_VALID_RESULT: "No valid synchronization result.",
    SYNC_COMPLETE: "Storyboard and voice sync completed (Total duration: {totalDuration}s)\n",
    SYNC_ITEM: "👉 Scene #{index} [{startTime} -> {endTime}] ({duration}s): {script}...\n",
    ALIGN_ERROR: "Voice synchronization error: {error}",
    SERVER_ALIGN_ERROR: "Failed to align voice from server.",
  },
} as const;

export const GENRE_VISUAL_GUIDELINES: Record<string, string> = {
  [VideoGenre.HISTORY]: `CRITICAL VISUAL DIRECTIVE - HISTORY GENRE:
- Strict Historical Accuracy: Image prompts must precisely reflect the historical period mentioned in the scene text. Describe historically accurate clothing (e.g., armor, robes, wool tunics), architecture (e.g., wooden huts, stone castles, roman pillars), and technology of the era.
- Historical Context Enrichment: For every scene under a historical theme, the prompt must explicitly specify the historical context, such as the name of the battle or war, the specific era or year (if available), the country, the participating factions/sides, the military units/armies, and the types of soldiers or historical figures involved. This ensures the AI accurately generates period-specific clothing, weapons, flags/banners, insignia, vehicles, and distinct characteristics of the era, preventing confusion between different wars or military forces.
- Character Pinning/Consistency: If specific historical figures, rulers, or classes of people (e.g., Roman legionaries, Victorian ladies, ancient farmers) are mentioned, describe their iconic features and clothing consistently across scenes.
- Settings: Ensure settings match the historical timeline. No modern objects, modern light sources, or modern tools should appear.`,
  [VideoGenre.TRUE_CRIME]: `CRITICAL VISUAL DIRECTIVE - TRUE CRIME GENRE:
- Suspenseful & Moody Atmosphere: Use dark, cinematic, high-contrast chiaroscuro lighting. Focus on shadows, dim streetlights, rainy nights, foggy alleys, and mysterious figures.
- Forensic & Crime Elements: Depict details like police tape, old case files on a wooden desk, flickering projector lights, micro-lens shots of clues, or dramatic silhouettes. Do not include gore, but focus on the atmospheric tension.`,
  [VideoGenre.SCIENCE]: `CRITICAL VISUAL DIRECTIVE - SCIENCE GENRE:
- Clean, Accurate & Futuristic: Depict accurate molecular structures, space visuals, clean futuristic laboratories, holographic interfaces, and detailed scientific diagrams.
- Use vibrant lighting like neon glowing accents, blue laser grids, or high-tech clean white backgrounds.`,
  [VideoGenre.PSYCHOLOGY]: `CRITICAL VISUAL DIRECTIVE - PSYCHOLOGY/PHILOSOPHY GENRE:
- Symbolic & Conceptual Visuals: Use surreal or highly symbolic visual representations to depict thoughts, mental states, dualities of mind, or philosophical concepts (e.g., a person looking into a mirror reflecting a maze, or contrasting dark and light halves of a face).
- Keep a clean, artistic, thought-provoking focus.`,
  [VideoGenre.PHILOSOPHY]: `CRITICAL VISUAL DIRECTIVE - PSYCHOLOGY/PHILOSOPHY GENRE:
- Symbolic & Conceptual Visuals: Use surreal or highly symbolic visual representations to depict thoughts, mental states, dualities of mind, or philosophical concepts (e.g., a person looking into a mirror reflecting a maze, or contrasting dark and light halves of a face).
- Keep a clean, artistic, thought-provoking focus.`,
};

export const VOICE_OPTIMIZATION_TEXTS = {
  vi: {
    LAZY_ALIGN_START: "[Lazy Alignment] Đã đồng bộ ước lượng theo từ khóa (Thời lượng: {totalDuration}s)\n",
    LAZY_ALIGN_ITEM: "- Cảnh {index}: [{startTime} -> {endTime}] ({duration}s) | {script}...\n",
    ALIGN_ERROR: "Lỗi lấy dữ liệu align từ Whisper",
    SYNC_WHISPER_WAIT: "Đang đồng bộ Whisper và phân đoạn voice... Vui lòng đợi trong giây lát.",
    SYNC_WHISPER_ERROR: "Lỗi đồng bộ giọng nói với Whisper",
    PREPARE_ZIP: "Đang chuẩn bị gói dự án...",
    ZIP_GEN_ERROR: "Lỗi đóng gói file ZIP.",
  },
  en: {
    LAZY_ALIGN_START: "[Lazy Alignment] Synchronized estimated word-proportion duration (Duration: {totalDuration}s)\n",
    LAZY_ALIGN_ITEM: "- Scene {index}: [{startTime} -> {endTime}] ({duration}s) | {script}...\n",
    ALIGN_ERROR: "Failed to retrieve alignment data from Whisper",
    SYNC_WHISPER_WAIT: "Aligning voice with Whisper and segmenting... Please wait a moment.",
    SYNC_WHISPER_ERROR: "Failed to align voice with Whisper",
    PREPARE_ZIP: "Preparing project bundle...",
    ZIP_GEN_ERROR: "Failed to generate ZIP project bundle.",
  },
} as const;

export const LLM_CONFIG = {
  DEFAULT_MAX_RETRIES: 2,
  RETRY_DELAY_BASE: 1000,
  BATCH_WAIT_DELAY: 1500,
  DEFAULT_MAX_CHUNK_SIZE: 1300,
  DEFAULT_MIN_CHUNK_SIZE: 900,
} as const;

export const VITE_HMR_LOGS = {
  vi: {
    SERVER_CONNECTION_LOST: "[Vite] Mất kết nối tới máy chủ dịch vụ. Đang tự động kết nối lại...",
    FAILED_RELOAD_WITH_FILE: "[Hệ thống] Không thể tự động cập nhật giao diện thành phần ({filePath}) do có lỗi cú pháp hoặc thiếu tệp tin. Vui lòng tải lại trang (F5) hoặc kiểm tra lại code.",
    FAILED_RELOAD_GENERIC: "[Hệ thống] Cập nhật giao diện thất bại do lỗi cú pháp hoặc thiếu tệp tin. Vui lòng tải lại trang (F5) hoặc kiểm tra lại code.",
    CONNECTED: "[Vite] Đã kết nối lại thành công với máy chủ dịch vụ.",
    HOT_UPDATED: "[Vite] Giao diện đã tự động cập nhật thay đổi mới thành công.",
  },
  en: {
    SERVER_CONNECTION_LOST: "[Vite] Server connection lost. Reconnecting...",
    FAILED_RELOAD_WITH_FILE: "[System] Failed to auto-reload component ({filePath}) due to syntax errors or missing files. Please reload page (F5) or check your code.",
    FAILED_RELOAD_GENERIC: "[System] Interface update failed due to syntax errors or missing files. Please reload page (F5) or check your code.",
    CONNECTED: "Successfully reconnected to development server.",
    HOT_UPDATED: "Interface hot updated successfully.",
  },
} as const;

export const DEFAULT_AUDIO_ORDER_LIST = "intro, voice, outro";

export const LOG_LEVEL_SYMBOLS = {
  INFO: "ℹ️",
  SUCCESS: "✅",
  WARN: "⚠️",
  ERROR: "❌",
};

export const PIPELINE_STEP5_TEXTS = {
  PROMPT_SAMPLE: `1. A group of 2D hand-drawn stickman cartoon hunters with intense, focused expressions, holding primitive stone spears, crouching behind massive, photorealistic granite boulders. In the distance, a colossal prehistoric beast moves through a foggy, ancient valley.\n2. A group of 2D hand-drawn stickman cartoon hunters with intense, focused expressions, holding primitive stone spears, crouching behind massive, photorealistic granite boulders. In the distance, a colossal prehistoric beast moves through a foggy, ancient valley.`,
  vi: {
    VIDEO_ZIP_NAME: "danh_sach_video_doc_lap.zip",
    IMAGE_ZIP_NAME: "danh_sach_anh_doc_lap.zip",
  },
  en: {
    VIDEO_ZIP_NAME: "independent_video_list.zip",
    IMAGE_ZIP_NAME: "independent_image_list.zip",
  }
} as const;

export const PIPELINE_STEP6_TEXTS = {
  STDOUT_STDERR: "STDOUT / STDERR",
} as const;

export const LOG_KEYWORDS = {
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
} as const;

export const SETTINGS_TEXTS = {
  vi: {
    TITLE: "Cài đặt chung",
    DESC: "Cấu hình API Keys và thông số kết nối Cổng Vẽ AI tại đây",
    SANDBOX_TITLE: "Cổng Vẽ AI (Sandbox)",
  },
  en: {
    TITLE: "General Settings",
    DESC: "Manage API keys and AI Drawing Port Sandbox configuration",
    SANDBOX_TITLE: "AI Drawing Port (Sandbox)",
  }
} as const;

export const CURL_KEYWORDS = {
  STREAM_AGENT: "flowCreationAgent:streamChat",
  STREAM: "streamChat",
  NARWHAL: "NARWHAL",
} as const;

export const SIDEBAR_TEXTS = {
  vi: {
    DASHBOARD: "Tổng quan",
    CONTENT: "Nội dung",
    AI_STUDIO: "Phòng sáng tạo AI",
    SETTINGS: "Cài đặt",
    AI_CREATOR: "Nhà Sáng Tạo AI",
    ACTIVE_PROJECT: "Dự án đang mở",
    NO_PROJECT_ACTIVE: "Chưa mở dự án",
  },
  en: {
    DASHBOARD: "Dashboard",
    CONTENT: "Content",
    AI_STUDIO: "AI Studio",
    SETTINGS: "Settings",
    AI_CREATOR: "AI Creator",
    ACTIVE_PROJECT: "Active Project",
    NO_PROJECT_ACTIVE: "No project active",
  },
} as const;

export const PLAYER_SIMULATION_CONFIG = {
  ZOOM_IN_MOTIONS: ["Zoom In"] as string[],
  ZOOM_OUT_MOTIONS: ["Zoom Out"] as string[],
  MIN_PROGRESS: 0,
  MAX_PROGRESS_PERCENT: 100,
  PROGRESS_STEP: 0.5,
  PROGRESS_INTERVAL_MS: 100,
} as const;

export const BUTTON_TOOLTIP_PREFIX = {
  VI: "Chức năng: ",
  EN: "Function: ",
} as const;

export const SEO_DEFAULT_CONFIGS = {
  NUM_TITLES: 3,
  NUM_DESCRIPTIONS: 1,
  NUM_HASHTAGS: 5,
  NUM_TAGS: 10,
  MIN_TITLES_OPTION: 1,
  MAX_TITLES_OPTION: 10,
} as const;



export const PROJECT_LIST_TEXTS = {
  vi: {
    desc: "Quản lý và biên tập tất cả các dự án sản xuất video AI của bạn",
    allLangs: "Tất cả ngôn ngữ",
    viBtn: "🇻🇳 Tiếng Việt",
    enBtn: "🇺🇸 English",
    allGenres: "TẤT CẢ THỂ LOẠI",
    searchPlaceholder: "Tìm kiếm dự án...",
    noProjectsMatch: "Không tìm thấy dự án phù hợp với bộ lọc.",
    colVideoProject: "Dự án video",
    colCredits: "Tiêu hao",
    colUpdatedAt: "Cập nhật lần cuối",
    colActions: "Hành động",
    showing: "Hiển thị",
    genreLabels: {
      Documentary: "Tài Liệu",
      Explanation: "Giải Thích",
      Review: "Đánh Giá",
      History: "Lịch Sử",
      Science: "Khoa Học",
      Story: "Kể Chuyện",
      News: "Tin Tức",
    } as Record<string, string>,
  },
  en: {
    desc: "Synthesize stories, design video structures with AI...",
    allLangs: "All Languages",
    viBtn: "🇻🇳 Tiếng Việt",
    enBtn: "🇺🇸 English",
    allGenres: "ALL GENRES",
    searchPlaceholder: "Search projects...",
    noProjectsMatch: "No projects matched your criteria.",
    colVideoProject: "Video Project",
    colCredits: "Credits",
    colUpdatedAt: "Updated At",
    colActions: "Actions",
    showing: "Showing",
    genreLabels: {
      Documentary: "Documentary",
      Explanation: "Explanation",
      Review: "Review",
      History: "History",
      Science: "Science",
      Story: "Story",
      News: "News",
    } as Record<string, string>,
  },
} as const;

export const PROJECT_LIST_CONSTANTS = {
  FILTER_ALL: "all",
  LANG_VI: "vi",
  LANG_EN: "en",
  SLEEP_DURATION_MS: 1000,
  SKELETON_ITEMS: [1, 2, 3],
  ITEMS_PER_PAGE: 5,
  PAGE_ONE: 1,
  PAGINATION_DELIMITER: "/",
  DASH_DELIMITER: "-",
} as const;

export const INPUT_MODES = {
  ZIP: "zip",
  SPLIT: "split",
} as const;

export const FOLDER_TYPES = {
  PARENT: "parent",
  SFX: "sfx",
  IMAGES: "images",
  VOICES: "voices",
  VIDEO_OUTPUT: "video_output",
} as const;

export const PIPELINE_STEP6_UI_TEXTS = {
  TITLE_TEMPLATE: "Dự Án Mẫu",
  TOOLTIP_TEMPLATE: "Chọn một dự án CapCut mẫu để áp dụng cấu trúc",
  NO_TEMPLATE: "Chưa có mẫu nào. Hãy tải lên!",
  BTN_UPLOAD: "Tải mẫu",
  TITLE_MEDIA: "Nguồn Media",
  TOOLTIP_MEDIA: "Nguồn chứa hình ảnh và âm thanh",
  BTN_MODE_ZIP: "Chung (ZIP)",
  BTN_MODE_ZIP_TOOLTIP: "Dùng chung 1 thư mục chứa ảnh và audio, hoặc 1 file ZIP",
  BTN_MODE_SPLIT: "Tách riêng",
  BTN_MODE_SPLIT_TOOLTIP: "Chọn riêng biệt đường dẫn Hình ảnh và Âm thanh",
  PLACEHOLDER_ZIP: "Đường dẫn thư mục hoặc File ZIP...",
  PLACEHOLDER_IMAGES: "Thư mục Hình ảnh...",
  PLACEHOLDER_VOICES: "Thư mục Âm thanh...",
  TITLE_MOTION: "Hiệu ứng",
  TOOLTIP_MOTION: "Hiệu ứng chuyển động của camera và hình ảnh",
  TITLE_TRANSITION: "Chuyển tiếp",
  TOOLTIP_TRANSITION: "Hiệu ứng chuyển tiếp giữa các phân cảnh",
  BTN_AUTO: "Auto Mode (Tự Tạo Mới)",
  BTN_MANUAL: "Manual (Sửa File Cũ)",
  BTN_RUN_AUTO: "TỰ ĐỘNG TẠO DỰ ÁN & TỐI ƯU",
  ERR_SELECT_TEMPLATE: "Vui lòng chọn Dự án Mẫu (Template)!",
  ERR_SELECT_ZIP: "Vui lòng chọn Thư mục Cha chứa ảnh/audio hoặc File ZIP!",
  ERR_SELECT_SPLIT: "Vui lòng chọn đủ Thư mục Ảnh và Thư mục Âm Thanh!",
  LOG_UPLOADING: "Đang tải lên mẫu: ",
  LOG_UPLOAD_SUCCESS: "Tải lên mẫu thành công!",
  LOG_UPLOAD_ERROR: "Lỗi tải lên mẫu: ",
  LOG_SELECT_PARENT: "Đã chọn thư mục cha: ",
  LOG_SELECT_IMAGES: "Đã chọn thư mục ảnh: ",
  LOG_SELECT_VOICES: "Đã chọn thư mục audio: ",
  LOG_ERR_TEMPLATE: "Lỗi tải lên mẫu.",
  MODAL_TITLE_DELETE: "Xóa mẫu",
  MODAL_MSG_DELETE: "Bạn có chắc chắn muốn xoá mẫu này không?",
  MODAL_TITLE_RENAME: "Đổi tên mẫu",
  MODAL_MSG_RENAME: "Nhập tên mới cho mẫu này:",
  MODAL_TITLE_UPLOAD: "Tải Mẫu Lên",
  MODAL_MSG_UPLOAD: "Nhập tên cho mẫu dự án này:",
  LOG_DELETE_SUCCESS: "Đã xoá mẫu thành công.",
  LOG_DELETE_ERROR: "Xoá mẫu thất bại.",
  LOG_RENAME_SUCCESS: "Đã đổi tên mẫu thành công.",
  LOG_RENAME_ERROR: "Đổi tên mẫu thất bại.",
  BTN_CONFIRM: "Xác nhận",
  BTN_CANCEL: "Hủy",
  TITLE_PROJECT_NAME: "TÊN DỰ ÁN CAPCUT",
  TOOLTIP_PROJECT_NAME: "Tên dự án CapCut sẽ được sinh ra",
  PLACEHOLDER_PROJECT_NAME: "Để trống hệ thống sẽ lấy tên ngẫu nhiên: AI_CAPCUT_hhmmDDMMYY",
  NO_TEMPLATE_FOUND: "Chưa có mẫu nào",
  SELECT_TEMPLATE: "Chọn mẫu...",
  TITLE_EXPORT_VIDEO: "XUẤT VIDEO CAPCUT",
  TOOLTIP_EXPORT_VIDEO: "Tự động xuất video sau khi tạo dự án CapCut thành công",
  LABEL_EXPORT_VIDEO: "Tự động xuất video sau khi tạo xong",
  TITLE_VIDEO_OUTPUT_DIR: "Thư mục lưu video",
  TOOLTIP_VIDEO_OUTPUT_DIR: "Chọn thư mục để lưu file video xuất ra",
  PLACEHOLDER_VIDEO_OUTPUT_DIR: "Đường dẫn thư mục lưu video...",
  LOG_SELECT_VIDEO_OUTPUT: "Đã chọn thư mục xuất video: ",
  ERR_SELECT_VIDEO_OUTPUT: "Vui lòng chọn thư mục lưu video!",
  LOG_ERROR_PREFIX: "Lỗi: ",
} as const;

export const MOTION_OPTIONS = [
  { value: "default", label: "Tự động (Mặc định)" },
  { value: "tiktok", label: "Tiktok/Reels (Nhanh, thu hút)" },
  { value: "podcast", label: "Podcast (Tĩnh, nhẹ nhàng)" },
  { value: "review", label: "Bán hàng (Zoom cận, focus)" },
  { value: "vlog", label: "Vlog/Du lịch (Đa dạng, lướt nhanh)" },
  { value: "story", label: "Kể chuyện (Chậm rãi, huyền bí)" },
  { value: "news", label: "Tin tức (Trang trọng, đều đặn)" },
] as const;

export const TRANSITION_OPTIONS = [
  { value: "default", label: "Tự động (Mặc định)" },
  { value: "tiktok", label: "Tiktok/Reels (Chớp nháy, cuộn)" },
  { value: "podcast", label: "Podcast (Làm mờ mềm mại)" },
  { value: "review", label: "Bán hàng (Trượt ngang, lật)" },
  { value: "vlog", label: "Vlog/Du lịch (Xoay lốc, mờ ảo)" },
  { value: "story", label: "Kể chuyện (Tan biến, bóng đen)" },
  { value: "news", label: "Tin tức (Đẩy cảnh cơ bản)" },
  { value: "none", label: "Không sử dụng", customClass: "text-rose-400" },
] as const;
