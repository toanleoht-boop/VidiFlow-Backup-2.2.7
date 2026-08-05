export const STORAGE_KEYS = {
  FAVORITE_VOICES: "favorite_voices",
  FAVORITE_STYLES: "favorite_styles",
  API_SANDBOX_CONFIG: "api_sandbox_config",
  SELECTED_PROJECT_ID: "selected_project_id",
  APP_THEME: "app_theme",
  GEMINI_API_KEY: "GEMINI_API_KEY",
  AI33_API_KEY: "AI33_API_KEY",
  CAPCUT_ULTRA_CONFIG: "capcut_ultra_config",
  CHROME_PROFILES: "capcut_ultra_chrome_profiles",
} as const;

export type StorageKeyType = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
