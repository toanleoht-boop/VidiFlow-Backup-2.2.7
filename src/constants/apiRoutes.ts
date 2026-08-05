export const API_ROUTES = {
  BASE_API: "/api",
  PIPELINE: "/api/pipeline",
  VOICES: "/api/voices",
  PROJECTS: "/api/projects",
  PIPELINE_EXTRACT_STYLE: "/api/pipeline/extract-style",
  PIPELINE_REWRITE_PROMPTS: "/api/pipeline/rewrite-prompts",
  PIPELINE_OPTIMIZE_PROMPTS: "/api/pipeline/optimize-prompts",
  PIPELINE_REWRITE_THUMBNAILS: "/api/pipeline/rewrite-thumbnails",
  PIPELINE_REWRITE_THUMBNAILS_CHARACTER: "/api/pipeline/rewrite-thumbnails-character",
  PIPELINE_HOOKS: "/api/pipeline/hooks",
  PIPELINE_SCRIPT: "/api/pipeline/script",
  PIPELINE_STORYBOARD: "/api/pipeline/storyboard",
  PIPELINE_SEO: "/api/pipeline/seo",
  PIPELINE_THUMBNAILS: "/api/pipeline/thumbnails",
  PIPELINE_GENERATE_IMAGE: "/api/pipeline/generate-image",
  PIPELINE_GENERATE_BATCH_IMAGES: "/api/pipeline/generate-batch-images",
  PIPELINE_CLEAN_BATCH_IMAGES: "/api/pipeline/clean-batch-images",
  PIPELINE_DETAILED_PROMPT: "/api/pipeline/detailed-prompt",
  PIPELINE_VOICE: "/api/pipeline/voice",
  PIPELINE_ALIGN_VOICE: "/api/pipeline/align-voice",
  PIPELINE_RUN_ULTRA: "/api/pipeline/run-ultra",
  PIPELINE_TEMPLATES: "/api/pipeline/templates",
  PIPELINE_SELECT_FILE: "/api/pipeline/select-file",
  PIPELINE_SELECT_FOLDER: "/api/pipeline/select-folder",
};

export const EXTERNAL_URLS = {
  FFMPEG_URL: "https://www.gyan.dev/ffmpeg/builds/ffmpeg-git-full.7z",
  GOOGLE_TRANSLATE_API: "https://translate.googleapis.com/translate_tts",
  GOOGLE_TRANSLATE_WEB_1: "https://translate.google.com/translate_tts",
  GOOGLE_TRANSLATE_WEB_2: "https://translate.google.com.vn/translate_tts",
  GOOGLE_TRANSLATE_REFERER: "https://translate.google.com/",
  PLAYWRIGHT_CDP: "http://127.0.0.1:9222",
  GOOGLE_LABS: "https://labs.google/",
  // Keep Flow on the language-neutral route. The /vi/ landing page does not
  // expose the project composer reliably to the automation.
  GOOGLE_LABS_FLOW: "https://labs.google/fx/tools/flow",
  GEMINI_CHAT: "https://gemini.google.com/app",
  GEMINI_CHAT_BASE: "https://gemini.google.com",
  AI33_VOICES: "https://api.ai33.pro/v3/voices",
  AI33_TTS: "https://api.ai33.pro/v3/text-to-speech",
  AI33_TASK: "https://api.ai33.pro/v1/task",
  LOREM_FLICKR: "https://loremflickr.com",
  PLACEHOLD_CO: "https://placehold.co",
};

export const ALIGN_CONFIG = {
  TEMP_DIR: "temp_align",
  SCRIPT_FILE: "python_scripts/voice_aligner.py",
  CHECK_FASTER_WHISPER_CMD: '"{0}" -c "import faster_whisper"',
  INSTALL_FASTER_WHISPER_CMD: '"{0}" -m pip install faster-whisper',
  VOICES_DIR: "voices",
  AUDIO_PREFIX: "audio_",
  SCENES_PREFIX: "scenes_",
  OUTPUT_PREFIX: "output_",
  WAV_EXT: ".wav",
  JSON_EXT: ".json",
};

export const EXPORT_ZIP_CONFIG = {
  ERR_MISSING_PROJECT: "Missing projectId",
  ERR_PROJECT_NOT_FOUND: "Project not found",
  VOICES_DIR: "voices",
  SCENE_PREFIX: "scene_",
  WAV_EXT: ".wav",
  EXPORT_FILE: "export.zip",
};

export const ENCODING_UTF8 = "utf-8";
export const PROJECTS_FILE_NAME = "projects.json";
export const SQLITE_DB_NAME = "database.db";
export const PROJECTS_BACKUP_DIR_NAME = "projects_backup_json";
export const PROJECTS_DIR_NAME = "projects";
export const ASSETS_DIR_NAME = "assets";
export const IMAGES_DIR_NAME = "images";
export const VOICES_DIR_NAME = "voices";
export const UNSPLASH_IMAGE_REGEX = /https:\/\/images\.unsplash\.com\/featured\/800x450\/\?([a-zA-Z0-9%_,\-\+]+)/g;

export const DEFAULT_AI33_API_KEY =
  "eyJhbGciOiJIUzI1NiIsImtpZCI6ImZ0UTF2dE1kNHArNG41SUYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3hwa2NhcHFxYnJraHNwcmJxb2NiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxYTFlZjhjOC1hN2Q4LTRkYzMtYmRjMy1kYmZjODI1MGMzZmMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgyOTc1MDQyLCJpYXQiOjE3ODIzNzAyNDIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJUb8OgbiBMZW8iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiVG_DoG4gTGVvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIiwic3ViIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NjQ5OTMyNzB9XSwic2Vzc2lvbl9pZCI6IjY0ZjhjZDllLTMzNTItNDI5Zi1hYTYyLWZhMjg5OWNhNWUzNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.Rsut9S1qJEUqimObZXDTd4a7QLwMVhHTBvfxWy9FjY0";

export const FALLBACK_VOICES_PREVIEWS = {
  HOAI_MY: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Chào+bạn,+đây+là+giọng+nữ+miền+Nam+Hoài+My+ấm+áp.",
  NAM_MINH: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Kính+chào+quý+vị,+đây+là+bản+tin+thử+nghiệm+từ+Nam+Minh.",
  THUY_VY: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Chào+mừng+bạn+đến+với+trình+tạo+video+tự+động+Thùy+Vy.",
  DUY_LINH: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Khám+phá+những+câu+chuyện+lịch+sử+kỳ+bí+cùng+giọng+đọc+Duy+Linh.",
  KHANH_CHI: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Em+xin+gửi+lời+chào+thân+thương+nhất+tới+mọi+người+từ+Khánh+Chi.",
  BE_MAI: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Con+chào+ông+bà,+chào+các+bạn!+Con+là+Bé+Mai+đây+ạ.",
  ARIA: "https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=Hello!+This+is+Aria,+your+conversational+narrator.",
  GUY: "https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=Welcome+to+the+automated+news+and+media+studio.+I+am+Guy.",
  SONIA: "https://translate.google.com/translate_tts?ie=UTF-8&tl=en-gb&client=tw-ob&q=Good+day.+This+is+Sonia,+providing+an+elegant+British+narration.",
  RYAN: "https://translate.google.com/translate_tts?ie=UTF-8&tl=en-gb&client=tw-ob&q=Hello.+My+name+is+Ryan,+a+warm+and+authoritative+voice+from+the+UK.",
} as const;

export const API_HEADERS = {
  AI33_API_KEY: "x-ai33-api-key",
  GEMINI_API_KEY: "x-gemini-api-key",
} as const;

export const API_QUERY_PARAMS = {
  PROVIDER: "provider",
  PAGE: "page",
  PAGE_SIZE: "page_size",
  LANGUAGE: "language",
  GENDER: "gender",
  AGE: "age",
  SEARCH: "search",
} as const;
