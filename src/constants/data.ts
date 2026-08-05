import { SplitStrategy } from "./enums";

export interface PipelineNode {
  id: string;
  nameVi: string;
  nameEn: string;
  stageGroup: number;
  descVi: string;
  descEn: string;
}

export const pipelineNodes = [
  { id: "In", nameVi: "Đầu Vào", nameEn: "Input Source", stageGroup: 0, descVi: "Thu thập kịch bản thô hoặc ý tưởng ban đầu.", descEn: "Captures raw Original Script or short Story Idea." },
  { id: "HKG", nameVi: "Tạo lời dẫn", nameEn: "Hook Generator", stageGroup: 1, descVi: "Thiết kế câu mở đầu, câu giữ chân và kêu gọi hành động.", descEn: "Calculates high click-rate Opening, Retention and CTA hooks." },
  { id: "SRW", nameVi: "Viết Lại Kịch Bản", nameEn: "Script Rewriter", stageGroup: 2, descVi: "Viết lại và điều chỉnh độ độc bản của câu chuyện.", descEn: "Rewrites original words to bypass redundant phrases." },
  { id: "SEH", nameVi: "Nâng Cấp Văn Phong", nameEn: "Script Enhancer", stageGroup: 2, descVi: "Tối ưu độ trôi chảy và kịch tính hóa hội thoại.", descEn: "Injects flow dramatic triggers and flow patterns." },
  { id: "LFE", nameVi: "Mở Rộng Thời Lượng", nameEn: "Long Form Expander", stageGroup: 2, descVi: "Mở rộng cốt truyện lên tới 60 phút bằng cách thêm bối cảnh.", descEn: "Expands script lengths dynamically by adding contextual side stories." },
  { id: "FCK", nameVi: "Kiểm Chứng Thực Tế", nameEn: "Fact Checker", stageGroup: 2, descVi: "Rà soát tên riêng, năm, địa danh lịch sử chuẩn xác.", descEn: "Validates factual events, metrics and chronologies." },
  { id: "CGT", nameVi: "Thiết lập chương truyện", nameEn: "Chapter Generator", stageGroup: 2, descVi: "Trực quan hóa cấu trúc câu chuyện thành chương mục.", descEn: "Breaks large scripts into core semantic chapters." },
  { id: "SGE", nameVi: "Dựng phân cảnh", nameEn: "Storyboard Generator", stageGroup: 3, descVi: "Lập sơ độ phân cảnh chi tiết đồng bộ mốc thời gian.", descEn: "Forms coordinates linking timing, narration, and screen actions." },
  { id: "SSP", nameVi: "Phân dòng cảnh", nameEn: "Scene Splitter", stageGroup: 3, descVi: "Cắt nhỏ kịch bản bám sát diễn biến bối cảnh.", descEn: "Splits chapter narratives into granular scenes." },
  { id: "TGE", nameVi: "Thiết Kế Sơ Đồ Thời Gian", nameEn: "Timeline Generator", stageGroup: 3, descVi: "Ước lượng thời gian và thời lượng cho từng khung hình.", descEn: "Calculates start-end frames based on reading speeds." },
  { id: "VPL", nameVi: "Kế Hoạch Hình Ảnh", nameEn: "Visual Planner", stageGroup: 4, descVi: "Định lượng số lượng ảnh cần thiết cho đoạn phim.", descEn: "Optimizes assets count, preventing duplicate images." },
  { id: "ASM", nameVi: "Tài nguyên hình ảnh", nameEn: "Asset Manager", stageGroup: 4, descVi: "Nhập dữ liệu hình ảnh tải lên hoặc tự động khởi tạo.", descEn: "Mixes imported CSV elements and system default textures." },
  { id: "PGE", nameVi: "Mô tả hình ảnh", nameEn: "Prompt Generator", stageGroup: 4, descVi: "Dựng từ khóa vẽ tranh chi tiết cho công cụ.", descEn: "Enhances descriptive painting formulas for high quality." },
  { id: "CCM", nameVi: "Duy Trì Nhân Vật", nameEn: "Character Consistency", stageGroup: 4, descVi: "Khóa diện mạo, trang phục và tỷ lệ cơ thể nhân vật.", descEn: "Locks key faces, clothing features and colors." },
  { id: "IMG", nameVi: "Tạo Ảnh Thần Tốc", nameEn: "Image Generator", stageGroup: 4, descVi: "Thực thi quy trình lập hình ảnh tự động.", descEn: "Runs the latent diffusion rendering pipeline." },
  { id: "VGE", nameVi: "Tạo giọng nói", nameEn: "Voice Generator", stageGroup: 5, descVi: "Chuyển đổi văn bản thành tệp thu âm diễn cảm.", descEn: "Transforms text strings into full wave audio files." },
  { id: "SGE_sub", nameVi: "Hệ Thống Phụ Đề", nameEn: "Subtitle Generator", stageGroup: 5, descVi: "Tạo tệp phụ đề định dạng chuẩn bám sát giọng đọc.", descEn: "Drafts exact SRT subtitle alignments." },
  { id: "FAL", nameVi: "Căn Khớp Giọng Nói", nameEn: "Forced Alignment", stageGroup: 5, descVi: "Áp dụng thuật toán khớp âm thanh thực tế với chữ.", descEn: "Aligns speech phonemes directly to text stamps." },
  { id: "TNG", nameVi: "Thiết kế ảnh bìa", nameEn: "Thumbnail Generator", stageGroup: 4, descVi: "Khởi sinh các mẫu ảnh bìa tăng tỷ lệ nhấn xem.", descEn: "Generates high engagement MrBeast or History layouts." },
  { id: "TTG", nameVi: "Dựng Tiêu Đề", nameEn: "Title Generator", stageGroup: 6, descVi: "Tối ưu tiêu đề dễ tìm kiếm và thu hút đám đông.", descEn: "Creates clickbait and standard search terms." },
  { id: "DSG", nameVi: "Tạo phần mô tả", nameEn: "Description Generator", stageGroup: 6, descVi: "Soạn nội dung giới thiệu tối ưu tìm kiếm.", descEn: "Writes descriptive templates fitted for algorithm reach." },
  { id: "HSG", nameVi: "Đề xuât chủ đề", nameEn: "Hashtag Generator", stageGroup: 6, descVi: "Gợi ý các thẻ nổi bật thịnh hành.", descEn: "Finds trending tags." },
  { id: "TAG", nameVi: "Từ Khóa Tìm Kiếm", nameEn: "Tag Generator", stageGroup: 6, descVi: "Tổng hợp bộ nhãn tìm kiếm phim siêu tốc.", descEn: "Compiles search key phrases." },
  { id: "VDA", nameVi: "Hệ thống điều phối", nameEn: "Video Director AI", stageGroup: 7, descVi: "Tổng hợp điều khiển góc quay máy ảnh chuyển tiếp.", descEn: "Ensures scene flow, camera transitions and visuals fit." },
  { id: "AVE", nameVi: "Trình Biên Tập Tự Động", nameEn: "Auto Video Editor", stageGroup: 7, descVi: "Tổng hòa các dải âm thanh, phụ đề và dữ liệu thành phim hoàn chỉnh.", descEn: "Fuses visuals, subtitle layers and music track." },
  { id: "QCH", nameVi: "Kiểm Soát Chất Lượng", nameEn: "Quality Checker", stageGroup: 7, descVi: "Đánh giá tỷ lệ nén tệp tin, chuẩn khung hình và độ trong âm thanh.", descEn: "Verifies file compressions and safely scales." },
  { id: "EXP", nameVi: "Xuất bản phim", nameEn: "Exporter Engine", stageGroup: 7, descVi: "Hỗ trợ tải tệp phim độ tương thích cao cực nhanh.", descEn: "Allows professional raw file export in XML format." },
] as const;

export const genreLabels = {
  Storytelling: "Kể chuyện",
  History: "Lịch sử",
  Documentary: "Phim tài liệu",
  Explanation: "Giải thích",
  Review: "Đánh giá / Review",
  Education: "Giáo dục",
  News: "Tin tức",
  "Top List": "Bảng xếp hạng / Top list",
  "True Crime": "Trinh thám / Thám án",
  Science: "Khoa học",
  Psychology: "Tâm lý học",
  Philosophy: "Triết học",
} as const;

export const audLabels = {
  "General Audience": "Khán giả đại chúng",
  Kids: "Trẻ em",
  Teenagers: "Thanh thiếu niên",
  Adults: "Người lớn",
  Seniors: "Người cao tuổi",
} as const;

export const styleLabels = {
  Professional: "Chuyên nghiệp",
  Documentary: "Tài liệu chân thực",
  Viral: "Lan truyền / Đề xuất",
  Mystery: "Bí ẩn / Kịch tính",
  Drama: "Kịch tính / Gây cấn",
  Educational: "Mang tính giáo dục",
  Scientific: "Khoa học thực tiễn",
} as const;

export const motionLabels = {
  "Zoom In": "Phóng to",
  "Zoom Out": "Thu nhỏ",
  "Pan Left": "Góc trái",
  "Pan Right": "Góc phải",
  Static: "Tĩnh",
} as const;

export const emotionMap = {
  Normal: "Bình thường",
  Excited: "Hào hứng",
  Serious: "Trang nghiêm",
  Dramatic: "Kịch tính",
  Mysterious: "Bí ẩn",
} as const;

export const stylePresetsKeywords = {
  Realistic: "hyperrealistic, 8k resolution, highly detailed photographic style, natural lighting, realistic textures",
  Historical: "historical accuracy, period-accurate costume design, aged sepia tone, archival epic style, ancient realism, vintage atmosphere",
  Watercolor: "watercolor wash, soft paint strokes, artistic ink bleed, traditional texture, delicate hand-painted illustration",
  "Oil Painting": "classic oil on canvas, textured brush strokes, impasto technique, Rembrandt lighting, fine art masterpiece",
  Stickman: "minimalist stick figure drawing, simple hand-drawn sketch, clean line art, humorous whiteboard presentation style",
  Anime: "modern anime style, vibrant cel shading, beautiful hand-drawn key frames, Kyoto Animation style aesthetic, colorful studio lighting",
  Comic: "comic book illustration, bold ink outlines, halftone dot textures, dramatic marvel action panel style, colored graphic novel",
  "Black & White": "monochrome photography, high contrast black and white film grain, classic noir shading, deep dramatic shadows",
  Cinematic: "cinematic film still, anamorphic lens flare, dramatic volumetric lighting, Panavision 35mm look, shallow depth of field, blockbuster color grading",
  Documentary: "raw documentary photography, photojournalism style, unposed authentic moment, natural ambient light, candid coverage",
  "Low Poly": "3d low-poly geometric artwork, stylized faceted polygons, clean retro rendering, pastel vector gaming assets",
  "Pixel Art": "8-bit retro pixel art, detailed vintage sprite design, limited color palette, clean grid pixels, nostalgic 90s arcade game look",
} as const;

export const GEMINI_UNSUPPORTED_ERROR_KEYWORDS = ["not found", "404", "unsupported"] as const;
export const GEMINI_RETRYABLE_ERROR_KEYWORDS = ["429", "quota", "Quota exceeded", "503", "500", "550", "fetch failed", "Timeout", "undici"] as const;
export const STICKMAN_KEYWORDS = ["người que", "hình que", "nét que", "stickman", "stick figure", "hoạt hình", "stick"] as const;

export const LOG_SUCCESS_KEYWORDS = ["thành công", "success", "hoàn thành"] as const;
export const LOG_PENDING_KEYWORDS = ["bắt đầu thực thi", "pending", "đang xử lý", "trigger"] as const;
export const LOG_WARN_KEYWORDS = ["cảnh báo", "warning", "warn"] as const;
export const LOG_ERROR_KEYWORDS = ["lỗi", "error", "fail"] as const;

export const LOG_ERROR_SYMBOLS = ["❌", "💀"] as const;
export const LOG_WARN_SYMBOLS = ["⚠️", "⏳"] as const;

export const GEMINI_RETRYABLE_STATUSES = ["RESOURCE_EXHAUSTED", "UNAVAILABLE", 429, "429"] as const;
export const GEMINI_QUOTA_STATUSES = ["RESOURCE_EXHAUSTED", 429, "429"] as const;

export const GEMINI_RETRY_REGEX = /retry in ([\d\.]+)s/i;

export const GENRE_OPTIONS = ["Storytelling", "History", "Documentary", "Explanation", "Review", "Education", "News", "Top List", "True Crime", "Science", "Psychology", "Philosophy"] as const;

export const AUDIENCE_OPTIONS = ["General Audience", "Kids", "Teenagers", "Adults", "Seniors"] as const;

export const WRITING_STYLE_OPTIONS = ["Professional", "Documentary", "Viral", "Mystery", "Drama", "Educational", "Scientific"] as const;

export const HOOK_STRATEGY_OPTIONS = [
  { value: "Auto", label: "Tự động" },
  { value: "Mystery", label: "Kỳ bí, tò mò" },
  { value: "Shock", label: "Gây sốc" },
  { value: "Drama", label: "Kịch tính" },
  { value: "Curiosity", label: "Hiếu kỳ" },
  { value: "Emotional", label: "Cảm xúc" },
  { value: "Historical", label: "Lịch sử" },
  { value: "Statistical", label: "Thống kê" },
  { value: "Question", label: "Đặt câu hỏi" },
  { value: "Story", label: "Câu chuyện" },
] as const;

export const HOOK_POSITION_OPTIONS = [
  { value: "start", label: "Chỉ mở đầu" },
  { value: "mid", label: "Mở đầu & Giữa" },
  { value: "all", label: "Đầu, Giữa & Cuối" },
] as const;

export const DURATION_OPTIONS = [
  { val: "2m", label: "300 từ (~2 phút)" },
  { val: "5m", label: "750 từ (~5 phút)" },
  { val: "10m", label: "1500 từ (~10 phút)" },
  { val: "15m", label: "2250 từ (~15 phút)" },
] as const;

export const DEFAULT_IMAGE_KEYWORDS = "cinematic,landscape";

export const ABBREVIATIONS = ["tp", "ts", "ths", "gs", "pgs", "ks", "nxb", "sđt", "vv", "dr", "mr", "mrs", "ms", "st", "vol", "pm", "am", "vs", "eg", "ie", "co", "inc", "approx", "vn"] as const;

export const CONJUNCTIONS = ["và", "nhưng", "hoặc", "vì", "nên", "để", "khi", "mà", "thì", "nếu", "tuy", "bởi", "sau", "trong", "cho", "and", "but", "or", "because", "so", "then", "to", "when", "while", "if", "although", "that", "which", "who", "for", "with"] as const;

export const SCENE_SPLIT_MOTIONS = ["Zoom In", "Zoom Out", "Pan Left", "Pan Right", "Static"] as const;

export const CAMERA_MOTION_EFFECTS: Record<string, (progress: number) => { scale: number; dx: number; dy: number }> = {
  "Zoom In": (progress) => ({ scale: 1.0 + 0.12 * progress, dx: 0, dy: 0 }),
  "Zoom Out": (progress) => ({ scale: 1.12 - 0.12 * progress, dx: 0, dy: 0 }),
  "Pan Left": (progress) => ({ scale: 1.0, dx: -60 * progress, dy: 0 }),
  "Pan Right": (progress) => ({ scale: 1.0, dx: 60 * progress, dy: 0 }),
  Static: () => ({ scale: 1.0, dx: 0, dy: 0 }),
};

export const SCENE_SPLIT_TRANSITIONS = ["Cross Dissolve", "Fade out to black", "Cut", "Wipe", "Zoom transition"] as const;

export const AVAILABLE_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-2.5-flash"] as const;

export const PROMPT_FILLER_WORDS = ["beautiful", "detailed", "artistic", "image", "generation", "prompt", "describing", "characters", "clothes", "historical", "accuracy", "weather", "camera", "angle", "lighting", "based", "style", "with", "what", "where", "photo", "shot", "highly", "ultra", "dramatic", "gorgeous", "scene", "rendering"] as const;

export const STICKMAN_STYLE_MODIFIERS = "stickman cartoon style, simple black-outline stickman body with oversized head and face, extremely detailed exaggerated facial expressions, big eyes with black pupils, hand-drawn thick black outlines, flat solid colors, no gradients, no shading, simple rustic color palette, minimalist sketch art background";

export const DEFAULT_PROJECT_ID = "cbcf7518-13d7-4eab-b59d-952d5814de53";
export const DEFAULT_SESSION_ID = ";1781857807598";

export const VOICE_PROVIDER_OPTIONS = [
  { value: "edge", labelKey: "Edge_Microsoft" },
  { value: "elevenlabs", labelKey: "ElevenLabs" },
  { value: "minimax", labelKey: "Minimax" },
  { value: "kokoro", labelKey: "Kokoro" },
  { value: "clone", labelKey: "Clone" },
  { value: "vbee", labelKey: "Vbee" },
] as const;

export const VOICE_LANGUAGE_OPTIONS = [
  { value: "", labelKey: "All" },
  { value: "en", labelKey: "English_3" },
  { value: "vi", labelKey: "Vietnamese_4" },
  { value: "fr", labelKey: "French" },
  { value: "de", labelKey: "German" },
  { value: "es", labelKey: "Spanish" },
  { value: "ja", labelKey: "Japanese" },
  { value: "ko", labelKey: "Korean" },
  { value: "zh", labelKey: "Chinese" },
] as const;

export const VOICE_AGE_OPTIONS = [
  { value: "", labelKey: "All" },
  { value: "young", labelKey: "Young" },
  { value: "middle_aged", labelKey: "Middle_aged" },
  { value: "old", labelKey: "Elderly" },
] as const;

export const GEMINI_CHAT_SPEED_OPTIONS = [
  { value: "1", labelKey: "GeminiSpeed_1", fallbackLabel: "1" },
  { value: "3", labelKey: "GeminiSpeed_3", fallbackLabel: "3" },
  { value: "5", labelKey: "GeminiSpeed_5", fallbackLabel: "5" },
  { value: "7", labelKey: "GeminiSpeed_7", fallbackLabel: "7" },
  { value: "10", labelKey: "GeminiSpeed_10", fallbackLabel: "10" },
] as const;

export const BATCH_DELAY_OPTIONS = [
  { value: "default", labelKey: "Batch_Delay_Default" },
  { value: "1s", labelKey: "Batch_Delay_1s" },
  { value: "2s", labelKey: "Batch_Delay_2s" },
  { value: "3s", labelKey: "Batch_Delay_3s" },
  { value: "random123", labelKey: "Batch_Delay_Random_123" },
] as const;

export const PROJECT_LANGUAGE_OPTIONS = [
  { value: "vi", labelKey: "Ti_ng_Vi_t" },
  { value: "en", labelKey: "Ti_ng_Anh" },
] as const;

export const VOICE_PRESET_MAP: Record<string, string> = {
  "preset-vi-bac-female": "edge_vi-VN-HoaiMyNeural",
  "preset-vi-bac-male": "edge_vi-VN-NamMinhNeural",
  "preset-vi-trung-female": "edge_vi-VN-HoaiMyNeural",
  "preset-vi-trung-male": "edge_vi-VN-NamMinhNeural",
  "preset-vi-nam-female": "edge_vi-VN-HoaiMyNeural",
  "preset-vi-nam-male": "edge_vi-VN-NamMinhNeural",
  "preset-vi-kid": "edge_vi-VN-HoaiMyNeural",
  "gcp-vi-female": "edge_vi-VN-HoaiMyNeural",
  "gcp-vi-male": "edge_vi-VN-NamMinhNeural",
  "gcp-en-female": "edge_en-US-AriaNeural",
  "fpt-vi-female": "edge_vi-VN-HoaiMyNeural",
  "fpt-vi-male": "edge_vi-VN-NamMinhNeural",
  "zalo-vi-female": "edge_vi-VN-HoaiMyNeural",
  "viettel-vi-male": "edge_vi-VN-NamMinhNeural",
  "gemini-cloud-vi-female": "edge_vi-VN-HoaiMyNeural",
  "gemini-cloud-vi-male": "edge_vi-VN-NamMinhNeural",
  "gemini-cloud-vi": "edge_vi-VN-HoaiMyNeural",
};

export const getDummyThumbs = (isVi: boolean, isFallback: boolean = false) => [
  {
    id: isFallback ? "th_fallback_1" : "th_1",
    prompt: "A close up split-screen image, with half side depicting an ancient parchment with glow and key, other half dark space. At the bottom, a bold red text overlay reading 'BÍ MẬT!' with a thick black border. MrBeast high-contrast style. (Resilient Fallback)",
    style: "MrBeast",
    hasText: true,
    textText: isVi ? "BÍ MẬT!" : "SECRET!",
    layout: "Bold red text on left-side overlay",
    typography: "Impact Bold Sans",
    colorSuggestion: "Electric red and yellow glowing effect",
    subjectFocus: "Ancient golden locked book",
  },
  {
    id: isFallback ? "th_fallback_2" : "th_2",
    prompt: "An archaeological dig site uncovered at dusk, golden ray light beams shooting out of the ground. At the bottom, a giant bold white text overlay reading 'BÍ ẨN!' with a thick black drop shadow. History channel look, dramatic angle, high details.",
    style: "History Channel",
    hasText: true,
    textText: isVi ? "BÍ ẨN!" : "MYSTERY!",
    layout: "Bottom center text",
    typography: "Impact Bold Sans",
    colorSuggestion: "Bright white text with thick black drop shadow",
    subjectFocus: isVi ? "Những tia sáng rực rỡ chiếu ra từ một ngôi mộ cổ" : "Luminous light beams out of an ancient tomb",
  },
];

export const getDummyHooks = (isVi: boolean, isFallback: boolean = false, hookType?: string) => [
  {
    id: "hk_fallback_1",
    content: isVi ? `[Mở đầu Thần bí - ${isFallback ? "Dự phòng" : "Thử nghiệm"}] Bí mật kinh ngạc làm đảo lộn dòng lịch sử mà không ai kể bạn nghe...` : `[Mystery Hook - ${isFallback ? "Fallback" : "Preview"}] The shocking secret that changed the records of history forever...`,
    type: hookType || "Mystery",
    selected: true,
  },
  {
    id: "hk_fallback_2",
    content: isVi ? `[Gây Shock - ${isFallback ? "Dự phòng" : "Thử nghiệm"}] Dừng lại ngay! Đây chính là lý do video của bạn liên tục bị bỏ lỡ.` : `[Shock Hook - ${isFallback ? "Fallback" : "Preview"}] Stop scrolling! This is the exact reason you are missing out.`,
    type: hookType || "Shock",
    selected: false,
  },
];

export const DEFAULT_AI33_TOKEN =
  "eyJhbGciOiJIUzI1NiIsImtpZCI6ImZ0UTF2dE1kNHArNG41SUYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3hwa2NhcHFxYnJraHNwcmJxb2NiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxYTFlZjhjOC1hN2Q4LTRkYzMtYmRjMy1kYmZjODI1MGMzZmMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgyOTc1MDQyLCJpYXQiOjE3ODIzNzAyNDIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJUb8OgbiBMZW8iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiVG_DoG4gTGVvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIiwic3ViIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NjQ5OTMyNzB9XSwic2Vzc2lvbl9pZCI6IjY0ZjhjZDllLTMzNTItNDI5Zi1hYTYyLWZhMjg5OWNhNWUzNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.Rsut9S1qJEUqimObZXDTd4a7QLwMVhHTBvfxWy9FjY0";

export const getDummyScript = (isVi: boolean, fallbackHook: string, config: any, isApiError: boolean = false) => {
  const defaultHookVi = "Có một câu chuyện kỳ bí.";
  const defaultHookEn = "There is a mysterious story.";

  const scriptVi = isApiError
    ? `${fallbackHook || defaultHookVi} \n\nTrong dòng lịch sử bao la, những nhà nghiên cứu luôn tìm kiếm mảnh ghép bị lãng quên của thời đại. Các di chỉ khảo cổ gần đây đã mang lại bằng chứng đáng tin cậy hỗ trợ lý thuyết này. Nó chứng minh mối liên kết sâu xa giữa các hiện tượng trước đó. (Dự phòng tự động do lỗi API)`
    : `${fallbackHook || defaultHookVi} \n\nTrong dòng lịch sử bao la, chúng ta không thể phủ nhận tầm quan trọng của bối cảnh và sự kiện liên quan. Các nhà nghiên cứu tin rằng mọi việc xảy ra đều chứa đựng ý nghĩa ẩn sau. Hãy phân tích ví dụ tiêu biểu mà chúng xuất hiện.\n\nKết luận lại, câu chuyện này mở ra góc nhìn mới đầy chiều sâu cho độc giả.`;

  const scriptEn = isApiError
    ? `${fallbackHook || defaultHookEn} \n\nThroughout the pages of history, researchers search for the forgotten fragments of the age. Modern archaeological findings have contributed compelling evidence supporting this system, revealing deep connections to past events. (Auto-fallback preview)`
    : `${fallbackHook || defaultHookEn} \n\nThroughout the pages of history, background details and historical analysis paint a clear scene. Modern research suggests these variables correlate directly. Let us dive deeper into the core mechanics of this story.\n\nIn conclusion, this opens an entirely new perspective.`;

  const factCheckVi = isApiError ? "✓ [Dự phòng] Đã xác minh: Các sự kiện cơ bản phù hợp với dữ kiện lịch sử tiêu chuẩn." : "✓ Đã kiểm chứng: Các dòng mốc lịch sử tương thích và dữ kiện nhất quán trong kịch bản.";

  const factCheckEn = isApiError ? "✓ [Fallback] Verified: The core plot parameters align with standard historical data." : "✓ Verified: Historical timelines and database coordinates are fully consistent.";

  return {
    rewrittenScript: isVi ? scriptVi : scriptEn,
    factCheckNotes: config?.factCheck ? (isVi ? factCheckVi : factCheckEn) : "Fact Check disabled",
    chapters: [
      {
        id: "ch_1",
        title: isVi ? "Chương I: Sự khởi đầu" : "Chapter I: The Arrival",
        scriptSegment: isVi ? "Giới thiệu về nhân vật chính và bối cảnh xảy ra sự kiện đầu tiên." : "Introduction to the main characters and initial settings of the event.",
      },
      {
        id: "ch_2",
        title: isVi ? "Chương II: Phân tích sâu" : "Chapter II: Deep Exploration",
        scriptSegment: isVi ? "Cung cấp những dữ kiện và diễn biến kịch tính để mở rộng nội dung." : "Providing critical events and dramatic facts to expand the content duration.",
      },
      {
        id: "ch_3",
        title: isVi ? "Chương III: Bài học & Đúc kết" : "Chapter III: Synthesis",
        scriptSegment: isVi ? "Tóm lược kết quả và truyền tải thông điệp cuối cùng." : "Synthesizing the lessons and conveying the core takeaway.",
      },
    ],
  };
};

export const getDummyHookTitle = (isVi: boolean, type: string = "Auto", isApiError: boolean = false) => {
  if (isApiError) {
    return isVi ? `[Mở đầu ${type}] Bạn có biết bí mật lớn nhất đằng sau câu chuyện này?` : `[${type} Hook] Did you know the biggest secret behind this story?`;
  }
  return isVi ? `[Mở đầu ${type}] Bạn đã từng nghe về câu chuyện kỳ lạ này chưa?` : `[${type} Hook] Have you ever heard about this strange story?`;
};

export const getDurationText = (isVi: boolean, durStr: string) => {
  if (durStr === "30s") {
    return {
      targetWordCount: 80,
      durationText: isVi ? "30 giây (30 seconds)" : "30 seconds",
    };
  }
  const match = durStr.match(/(\d+)/);
  if (match) {
    const mins = parseInt(match[1], 10);
    const targetWordCount = mins * 150;
    const paragraphs = mins * 3;
    const durationText = isVi ? `${mins} phút (${mins} minutes). You MUST write at least ${paragraphs} deeply detailed paragraphs/sections to fill this time.` : `${mins} minutes. You MUST write at least ${paragraphs} deeply detailed paragraphs/sections to fill this time.`;
    return { targetWordCount, durationText, targetWordCountMin: Math.floor(targetWordCount * 0.95) };
  }
  return {
    targetWordCount: 300,
    durationText: isVi ? "2 phút (2 minutes)" : "2 minutes",
    targetWordCountMin: Math.floor(300 * 0.95),
  };
};

export const getDummySeoData = (isVi: boolean, isApiError: boolean = false) => {
  return {
    titles: [
      {
        text: isVi ? `Bí Ẩn Lịch Sử Bị Lãng Quên Có Thể Bạn Chưa Biết${isApiError ? " (Dự Phòng)" : ""}` : `The Untold Secret of History - Documentary Special${isApiError ? " (Fallback Preview)" : ""}`,
        searchScore: 92,
        ctrScore: 89,
        compScore: 35,
        seoScore: 93,
      },
      {
        text: isVi ? `Phân cảnh kinh hoàng chưa kể về lịch sử dòng chảy` : `The Untold Secrets & Historical Truths Special`,
        searchScore: 88,
        ctrScore: 95,
        compScore: 40,
        seoScore: 90,
      },
    ],
    descriptions: [
      {
        text: isVi ? `Khám phá câu chuyện đằng sau những dữ kiện ít người biết đến, thông tin được xâu chuỗi một cách logic theo phong cách phim tài liệu khoa học chân thật nhất.` : `Explore the captivating narrative behind hidden historical logs meticulously gathered for high click rates.`,
        searchScore: 90,
        ctrScore: 85,
        compScore: 20,
        seoScore: 89,
      },
    ],
    hashtags: ["xuhuong", "learning", "lichsu", "biandocla", "aivideos"],
    tags: ["ai story rewriter", "tao video tu dong", "tin tuc lich su", "documentary creation"],
  };
};

export const SPLIT_STRATEGY_OPTIONS = [
  { value: SplitStrategy.WORD, labelKey: "By_word", titleKey: "Word_aligned_Maximizes_im", className: "text-slate-300" },
  { value: SplitStrategy.SHORT_SENTENCE, labelKey: "Short_sentence", titleKey: "Fast_paced_vibrant_short_", className: "text-slate-300" },
  { value: SplitStrategy.LONG_SENTENCE, labelKey: "Long_sentence", titleKey: "Default_balanced_standard", className: "text-slate-300" },
  { value: SplitStrategy.MIXED_SENTENCES, labelKey: "Mixed_sentences", titleKey: "Mixed_sentences_desc", className: "text-emerald-450 font-bold" },
  { value: SplitStrategy.PARAGRAPH, labelKey: "Paragraph_density", titleKey: "Logical_paragraph_aligned", className: "text-slate-300" },
] as const;

export const VOICE_OWNERSHIP_KEY = "voice_ownership";
export const VOICE_OWNERSHIP_COMMUNITY = "community";
export const VBEE_PROVIDER_ID = "vbee";
export const VBEE_VOICE_PREFIXES = ["vbee-", "vbee"];

export const VOICE_PROVIDER_MAPPINGS = [
  { prefixes: ["gemini-cloud", "preset-"], provider: "Gemini Speech" },
  { prefixes: ["elevenlabs"], provider: "ElevenLabs" },
  { prefixes: ["azure-cloud"], provider: "Azure AI" },
  { prefixes: ["openai-tts"], provider: "OpenAI TTS" },
  { prefixes: ["google-cloud"], provider: "Google Cloud" },
  { prefixes: ["fpt-"], provider: "FPT.AI" },
  { prefixes: ["zalo-"], provider: "Zalo AI" },
  { prefixes: ["viettel-"], provider: "Viettel AI" },
  { prefixes: ["vbee-"], provider: "Vbee" },
];

export const VOICE_DESCRIPTION_KEYS: Record<string, string> = {
  "preset-vi-bac-female": "Northern_female",
  "preset-vi-bac-male": "Northern_male",
  "preset-vi-trung-female": "Central_female",
  "preset-vi-trung-male": "Central_male",
  "preset-vi-nam-female": "Southern_female",
  "preset-vi-nam-male": "Southern_male",
  "preset-vi-kid": "Playful_kids_voiceover",
  "gcp-vi-female": "Google_free_female",
  "gcp-vi-male": "Google_free_male",
  "gcp-en-female": "Google_free_English_femal",
  "fpt-vi-female": "FPT_female_monthly",
  "fpt-vi-male": "FPT_male_monthly",
  "zalo-vi-female": "Zalo_female_daily",
  "viettel-vi-male": "Viettel_male_yearly",
  "gemini-cloud-vi-female": "Hifidelity_female_cloud_A",
  "gemini-cloud-vi-male": "Hifidelity_male_cloud_AI",
  "gemini-cloud-vi": "Muff_free_cloud_AI_defaul",
};

export const VOICE_PAGE_SIZE = "30";
export const GENDER_OPTIONS = ["", "male", "female"] as const;
export const AUDIO_PLAYBACK_FAILED_ERR = "AUDIO_PLAYBACK_FAILED";

export const APP_LOCALES = {
  VI: "vi-VN",
  EN: "en-US",
  VI_SHORT: "vi",
  EN_SHORT: "en",
} as const;

export const DEFAULT_PROVIDER = "edge";
