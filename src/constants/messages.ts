export const BACKEND_MESSAGES_LOCALIZED = {
  vi: {
    TEMPLATE_RENAME_REQUIRED: "Tên mới là bắt buộc.",
    TEMPLATE_RENAME_NOT_FOUND: "Không tìm thấy mẫu hoặc lỗi đổi tên.",
    TEMPLATE_RENAME_FAILED: "Lỗi đổi tên mẫu",
    PLAYWRIGHT_CONFIG_NEW: "[Playwright] Đang áp dụng cấu hình mới...",
    PLAYWRIGHT_CONFIG_SUCCESS: "[Playwright] Cấu hình thành công!",
    PLAYWRIGHT_CONFIG_SKIP: "[Playwright] Bỏ qua cấu hình tự động:",
    PLAYWRIGHT_INPUT_NOT_FOUND: "Không tìm thấy ô nhập Prompt",
    PLAYWRIGHT_BASE64_SUCCESS: "📸 Đã lấy được hình ảnh từ trình duyệt!",
    PLAYWRIGHT_REQUIRED: "Yêu cầu kích hoạt Playwright.",
    PLAYWRIGHT_SANDBOX_ERR: "Lỗi kết nối Sandbox.",
    PLAYWRIGHT_RECAPTCHA: "Yêu cầu xác minh reCAPTCHA.",
    PLAYWRIGHT_REASON: "Chi tiết: ",
    LABS_VIDEO: "Video",
    LABS_IMAGE: "Hình ảnh",
    LABS_IMAGEN: "Imagen 3",
    LABS_VEO: "Nano Banana 2",
    PLAYWRIGHT_PASTE_LOG: "[Playwright] Đang điền prompt...",
    PLAYWRIGHT_TYPE_LOG: "[Playwright] Đang nhập prompt...",
    PLAYWRIGHT_SUBMIT_LOG: "👆 Đang gửi yêu cầu tạo ảnh...",
    PLAYWRIGHT_SUBMIT_NOT_FOUND: "Không tìm thấy nút Tạo ảnh",
    PLAYWRIGHT_WAITING_GEN: "⏱️ Đang chờ trình duyệt sinh ảnh...",
    PLAYWRIGHT_DECODE_ERR: "Lỗi giải mã hình ảnh.",
    PLAYWRIGHT_REDIRECT_LOG: "🌐 Đang mở Project Flow: ",
    PLAYWRIGHT_INPUT_LOG: "[Playwright] Prompt: ",
    CHARACTER_ANALYZE_FAIL: "Lỗi phân tích nhân vật",
    SCRIPT_REQUIRED: "Kịch bản trống",
    IMAGES_REQUIRED: "Thiếu hình ảnh",
    CHARACTER_EXTRACT_FAIL: "Lỗi trích xuất nhân vật",
    STORYBOARD_INVALID: "Phân cảnh không hợp lệ",
    CHARACTER_PROMPT_REQUIRED: "Thiếu prompt nhân vật",
    GEMINI_NOT_INIT: "Gemini SDK chưa khởi tạo.",
    STYLE_EXTRACTION_ERR: "Lỗi trích xuất phong cách",
    STORYBOARD_REQUIRED: "Thiếu kịch bản phân cảnh",
    NEW_STYLE_REQUIRED: "Thiếu phong cách mới",
    THUMBNAILS_REQUIRED: "Thiếu ảnh thu nhỏ",
    CHAR_DESC_REQUIRED: "Thiếu mô tả nhân vật",
    BODY_FIELDS_REQUIRED: "Thiếu text hoặc voiceId",
    AUDIO_CHUNKS_REQUIRED: "Thiếu đoạn âm thanh",
    AUDIO_DATA_NOT_FOUND: "Không tìm thấy dữ liệu âm thanh",
    TTS_START: "[TTS] Bắt đầu tạo giọng nói: ",
    TTS_TASK_ID: "[TTS] Task ID: ",
    TTS_POLLING: ". Đang đồng bộ...",
    TTS_COMPLETE: "[TTS] Hoàn thành. Tải tệp từ: ",
    IMAGE_RENDER_ATTEMPT: "[Tạo ảnh] Lần thử ",
    IMAGE_RENDER_STARTING: " bắt đầu...",
    IMAGE_RENDER_RELOAD: "[Tạo ảnh] Tải lại trang để thử lại...",
    PROJECT_NOT_FOUND: "Không tìm thấy dự án",
    PROJECT_READ_ERR: "Lỗi đọc file projects.json:",
    PROJECT_WRITE_ERR: "Lỗi ghi file projects.json:",
    SQLITE_MIGRATION_START: "[Hệ thống - SQLite] 🔄 Phát hiện tệp dữ liệu JSON cũ. Bắt đầu di chuyển sang SQLite...",
    SQLITE_MIGRATION_EMPTY: "[Hệ thống - SQLite] ℹ️ Danh sách dự án cũ trống. Bỏ qua bước di chuyển.",
    SQLITE_MIGRATION_SUCCESS: "[Hệ thống - SQLite] ✅ Di chuyển thành công toàn bộ dữ liệu sang SQLite. Các file JSON cũ đã lưu tại projects_backup_json/.",
    SQLITE_INIT_ERR: "Không thể kết nối hoặc khởi tạo cơ sở dữ liệu SQLite",
    SQLITE_LIST_ERR: "Lỗi đọc danh sách dự án từ SQLite",
    SQLITE_DETAIL_ERR: "Lỗi đọc chi tiết dự án từ SQLite",
    SQLITE_WRITE_ERR: "Lỗi ghi chi tiết dự án vào SQLite",
    SQLITE_DELETE_ERR: "Lỗi xóa dự án khỏi SQLite",
    SQLITE_MIGRATE_CRITICAL: "[Hệ thống - SQLite] Gặp lỗi nghiêm trọng khi di chuyển dữ liệu cũ",
    SQLITE_MIGRATE_PARSE_ERR: "[Hệ thống - SQLite] Lỗi phân tích cú pháp file chi tiết dự án",
    SQLITE_MIGRATE_BACKUP_ERR: "[Hệ thống - SQLite] Lỗi backup tệp metadata projects.json",
    FETCH_VOICES_ERR: "Lỗi tải danh sách giọng đọc:",
    PLAYWRIGHT_CONNECTING: "🔗 Đang kết nối tới cửa sổ Chrome thật qua cổng 9222...",
    PLAYWRIGHT_ACCESSING_LABS: "🌐 Đang truy cập Google Labs...",
    PLAYWRIGHT_LOGIN_PROMPT: "\n⚠️  [CHÚ Ý] Vui lòng đăng nhập tài khoản Google trên trình duyệt...",
    PLAYWRIGHT_TOKEN_CAPTURED: "✅ Đã bắt được Bearer Token!",
    PLAYWRIGHT_TOKEN_TIMEOUT: "⏳ Hết thời gian chờ đăng nhập.",
    PLAYWRIGHT_CONNECT_ERR: "❌ Lỗi kết nối tới Chrome:",
    PLAYWRIGHT_CHROME_MANDATE: "⚠️  BẠN CẦN MỞ CHROME TRƯỚC BẰNG LỆNH SAU RỒI MỚI CHẠY SERVER:",
    PLAYWRIGHT_CHROME_COMMAND: '👉 start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\chrome_debug_profile"',
    MISSING_SCENE_SCRIPT: "Thiếu kịch bản phân cảnh",
    TTS_TASK_ERROR: "Lỗi Task TTS: ",
    NO_AUDIO_CHUNKS: "Không có đoạn âm thanh nào được cung cấp",
    NO_VALID_AUDIO_BASE64: "Không tìm thấy dữ liệu âm thanh base64 hợp lệ trong các đoạn",
    FAILED_READ_MERGED_AUDIO: "Không thể đọc file âm thanh đã ghép",
    FFMPEG_PROCESSING_ERROR: "Lỗi xử lý FFmpeg: ",
    INTERNAL_SERVER_ERROR: "Lỗi máy chủ nội bộ: ",
    HTTP_STATUS_ERROR: "Lỗi trạng thái HTTP! trạng thái: ",
    GOOGLE_TTS_FAILED: "Chuyển đổi Google TTS thất bại cho phân đoạn: {0}",
    PLAYWRIGHT_BORDER: "\n=======================================================",
    PLAYWRIGHT_BORDER_BOTTOM: "=======================================================\n",
    PLAYWRIGHT_PAGE_CLOSED_REINIT: "[Playwright] Trình duyệt sinh ảnh đã bị đóng hoặc chưa khởi tạo. Đang kết nối lại...",
    PLAYWRIGHT_PAGE_CLOSED_PREV_ATTEMPT: "[Playwright] Trình duyệt đã bị đóng ở lần thử trước. Đang kết nối lại...",
    PLAYWRIGHT_CLOSED_DETECTED_RESET: "[Playwright] Phát hiện trình duyệt bị đóng. Đang giải phóng và reset kết nối...",
    GEMINI_CHAT_START_ROOM: "[Gemini Chat] Bắt đầu phòng chat mới (Lần thử {0}/{1})...",
    GEMINI_CHAT_INIT_FAILED: "[Gemini Chat] Không thể khởi tạo trang mới: {0}",
    GEMINI_CHAT_RELOAD: "[Gemini Chat] Gặp sự cố, reload trang lần {0}...",
    GEMINI_CHAT_RELOAD_FAILED: "[Gemini Chat] Reload trang lỗi: {0}",
    GEMINI_CHAT_ATTEMPT_FAILED: "[Gemini Chat] Lỗi tại lần thử {0} của room {1}: {2}",
    GEMINI_CHAT_FAILED_COMPLETELY: "[Gemini Chat] Thất bại hoàn toàn: {0}",
    GEMINI_CHAT_FALLBACK_WARNING: "Tạo ảnh qua Gemini Chat Room thất bại hoàn toàn. Sử dụng ảnh dự phòng.",
    GEMINI_CHAT_CONFIG_MODEL: "[Gemini Chat] Cấu hình model: Mục tiêu là {0}",
    GEMINI_CHAT_CURRENT_MODEL: "[Gemini Chat] Model hiện tại: {0}",
    GEMINI_CHAT_MODEL_CORRECT: "[Gemini Chat] Model hiện tại khớp với cấu hình, không cần đổi.",
    GEMINI_CHAT_MODEL_SUCCESS: "[Gemini Chat] Đã đổi model sang: {0}",
    GEMINI_CHAT_MODEL_NOT_FOUND: "[Gemini Chat] Không tìm thấy nút chọn model {0}",
    GEMINI_CHAT_MODEL_PICKER_NOT_FOUND: "[Gemini Chat] Không tìm thấy nút chọn model.",
    GEMINI_CHAT_CONFIG_GEN_TYPE: "[Gemini Chat] Cấu hình loại tạo: {0}",
    GEMINI_CHAT_GEN_TYPE_SUCCESS: "[Gemini Chat] Đã chọn chế độ: {0}",
    GEMINI_CHAT_GEN_TYPE_FALLBACK: "[Gemini Chat] Đã chọn chế độ (dự phòng): {0}",
    GEMINI_CHAT_GEN_TYPE_NOT_FOUND: '[Gemini Chat] Không tìm thấy option "{0}" trong menu.',
    GEMINI_CHAT_PLUS_NOT_FOUND: "[Gemini Chat] Không tìm thấy nút '+' cấu hình.",
    GEMINI_CHAT_TYPING_PROMPT: "[Gemini Chat] Đang gõ prompt...",
    GEMINI_CHAT_PASTING_PROMPT: "[Gemini Chat] Đang dán prompt...",
    GEMINI_CHAT_WAITING_RESPONSE: "[Gemini Chat] Chờ phản hồi từ Gemini...",
    GEMINI_CHAT_THINKING_DETACHED: "[Gemini Chat] Không thấy thinking-overlay hoặc đã biến mất trước.",
    GEMINI_CHAT_DOWNLOAD_ERROR: "Không thấy nút Tải xuống trong phản hồi của Gemini.",
    GEMINI_CHAT_ROOM_REUSE: "[Gemini Chat] Tiếp tục sử dụng room chat hiện tại để sinh ảnh...",
    GEMINI_CHAT_ROOM_FORCED: "[Gemini Chat] Phát hiện lỗi liên tiếp >= 2 lần, buộc tạo room mới.",
    GEMINI_CHAT_NO_RESPONSE: "[Gemini Chat] Không tìm thấy phản hồi model-response cuối cùng.",
    GEMINI_CHAT_BUSY_WAIT: "[Gemini Chat] Phát hiện phản hồi đang bận (aria-busy=true), chờ cho đến khi hoàn thành...",
    GEMINI_CHAT_BUSY_TIMEOUT: "[Gemini Chat] Lỗi hoặc hết thời gian chờ phản hồi hết bận (aria-busy=false).",
    GEMINI_CHAT_NO_CONTAINER: "[Gemini Chat] Không tìm thấy vật chứa ảnh đã hoàn thành, tiếp tục kiểm tra.",
    GEMINI_CHAT_NO_SRC: "[Gemini Chat] Không tìm thấy thuộc tính src hợp lệ trên media element.",
    GEMINI_CHAT_EXTRACTING_MEDIA: "[Gemini Chat] Phát hiện nguồn đa phương tiện ({0}): {1}. Đang trích xuất dữ liệu trực tiếp...",
    GEMINI_CHAT_EXTRACT_FAILED: "[Gemini Chat] Trích xuất trực tiếp thất bại: {0}",
    GEMINI_CHAT_EXTRACT_ERROR: "[Gemini Chat] Lỗi khi trích xuất dữ liệu: {0}",
    GEMINI_CHAT_EXTRACT_SUCCESS: "[Gemini Chat] Lấy đa phương tiện thành công trực tiếp từ nguồn URL trình duyệt!",
    GEMINI_CHAT_EXTRACT_ERR_THROW: "Không thể trích xuất dữ liệu ảnh/video từ URL trình duyệt.",
    GEMINI_CHAT_MODEL_MOCK_CHECK: "[Gemini Chat] Giả lập click kiểm tra Model Picker...",
    GEMINI_CHAT_PLUS_MOCK_CHECK: "[Gemini Chat] Giả lập click kiểm tra menu Plus...",
    GEMINI_CHAT_BATCH_START: "[Batch Gemini] Mở {0} tab song song để tạo ảnh...",
    GEMINI_CHAT_BATCH_TAB_INIT: "[Batch Gemini] Tab {0}/{1} đã mở thành công.",
    GEMINI_CHAT_BATCH_TAB_START: '[Batch Gemini] Tab {0}: Bắt đầu tạo ảnh cho scene "{1}"...',
    GEMINI_CHAT_BATCH_TAB_SUCCESS: '[Batch Gemini] Tab {0}: ✅ Tạo ảnh thành công cho scene "{1}".',
    GEMINI_CHAT_BATCH_TAB_ERROR: '[Batch Gemini] Tab {0}: ❌ Lỗi scene "{1}": {2}',
    GEMINI_CHAT_BATCH_TAB_RECOVERY: "[Batch Gemini] Tab {0}: Tự động reload tab gặp lỗi để phục hồi...",
    GEMINI_CHAT_BATCH_TAB_REDIRECT: "[Batch Gemini] Tab {0}: Chuyển hướng về trang chủ Gemini để khởi tạo phiên chat mới...",
    GEMINI_CHAT_BATCH_COMPLETE: "[Batch Gemini] Hoàn thành batch: {0}/{1} thành công.",
    GEMINI_CHAT_BATCH_INIT_ERROR: "[Batch Gemini] Lỗi khởi tạo batch: {0}",
    GEMINI_CHAT_BATCH_CLOSE_TABS: "[Batch Gemini] Đóng tất cả {0} tab phụ đang chạy...",
    GEMINI_CHAT_PAGE_CLOSED: "Trình duyệt đã bị đóng hoặc chưa khởi tạo.",
    GEMINI_CHAT_BATCH_FORCED_NEW_ROOM: "[Batch Gemini] Tab {0}: Bắt buộc tạo room mới do lỗi liên tục ({1} lần)",
    GEMINI_CHAT_BATCH_REDIRECT_ATTEMPT: "[Batch Gemini] Tab {0}: Đang chuyển hướng về trang chủ để tạo room mới (Lần thử {1}/{2})...",
    GEMINI_CHAT_BATCH_REDIRECT_FAILED: "[Batch Gemini] Tab {0}: Chuyển hướng thất bại: {1}",
    GEMINI_CHAT_BATCH_ROOM_REUSE: "[Batch Gemini] Tab {0}: Tái sử dụng room chat hiện tại",
    GEMINI_CHAT_BATCH_RELOAD_ATTEMPT: "[Batch Gemini] Tab {0}: Reload lại room (Lần reload: {1})...",
    GEMINI_CHAT_BATCH_RELOAD_FAILED: "[Batch Gemini] Tab {0}: Reload thất bại: {1}",
    GEMINI_CHAT_BATCH_RENDER_ERROR: "[Batch Gemini] Tab {0}: Lỗi tạo ảnh (Lần thử {1} trong room): {2}",
    GEMINI_CHAT_BATCH_FAILED_COMPLETELY: "[Batch Gemini] Tab {0}: Thất bại hoàn toàn sau các lượt thử room: {1}",
    UNKNOWN_ERROR: "Lỗi không xác định.",
    BATCH_GEN_NO_ITEMS: "Không có items để tạo ảnh",
    BATCH_GEN_SYSTEM_ERROR: "Có lỗi hệ thống xảy ra: {0}",
    STREAM_NOT_SUPPORTED: "Luồng dữ liệu không được hỗ trợ bởi trình duyệt này.",
    VOICE_ALIGN_NO_AUDIO: "Không tìm thấy dữ liệu âm thanh.",
    VOICE_ALIGN_NO_SCENES: "Không tìm thấy danh sách phân cảnh.",
    VOICE_ALIGN_MISSING_OUTPUT: "Không nhận được file kết quả từ script Python.",
    VOICE_ALIGN_INSTALL_ERR: "Môi trường Python thiếu thư viện 'openai-whisper' và không thể tự động cài đặt. Vui lòng tự chạy lệnh 'pip install openai-whisper' trên Terminal. Lỗi: {0}",
    VOICE_ALIGN_PARSE_ERR: "Lỗi đọc kết quả đồng bộ: {0}",
    GEMINI_CHAT_WAIT_NEW_RESPONSE_TIMEOUT: "Đợi phản hồi mới từ Gemini Chat bị timeout hoặc không có phản hồi mới.",
    GEMINI_CHAT_NO_NEW_RESPONSE: "Không thấy phản hồi mới từ Gemini sau khi gửi prompt. Vui lòng thử lại.",
    GEMINI_CHAT_PREVENT_OLD_IMAGE: "Không có phản hồi mới nào được tạo ra từ Gemini Chat. Đã ngăn chặn lấy nhầm ảnh cũ.",
    GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM: "[Batch] Chuẩn bị Tab {0}: Chuyển hướng về phòng chat mới sạch sẽ.",
    GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM_ERR: "[Batch] Lỗi chuẩn bị Tab {0}: {1}",
    GEMINI_CHAT_CLICKED_SEND: "[Gemini Chat] Đã click nút Gửi tin nhắn.",
    GEMINI_CHAT_CLICK_SEND_FAILED: "[Gemini Chat] Không thể click nút Gửi, chuyển sang nhấn Enter: {0}",
    GEMINI_CHAT_PRESSED_ENTER: "[Gemini Chat] Đã nhấn Enter.",
    PLAYWRIGHT_MUTEX_DELAY: "[Playwright] Chờ {0}ms trước khi giải phóng mutex sinh ảnh...",
    GEMINI_CHAT_MUTEX_DELAY: "[Gemini Chat] Chờ {0}ms trước khi giải phóng mutex sinh ảnh...",
    GEMINI_CHAT_BATCH_NEXT_DELAY: "[Batch Gemini] Tab {0}: Chờ {1}ms trước khi xử lý phân cảnh tiếp theo...",
    SPAM_PREVENTION_DELAY: "[Spam Prevention] Đang chờ {0}ms trước khi thực hiện yêu cầu tạo ảnh tiếp theo...",
    API_RATE_LIMITS_TRIGGERED: "Giới hạn tỷ lệ API đã được kích hoạt",
    TTS_DEFAULT_TEST: "Xin chào, đây là giọng đọc thử nghiệm.",
    ULTRA_FILE_REQUIRED: "Đường dẫn file dự án draft_content.json là bắt buộc!",
    ULTRA_FILE_NOT_FOUND: "Không tìm thấy file dự án draft_content.json!",
    ULTRA_SUCCESS: "Xử lý Biên tập CapCut hoàn tất thành công!",
    SELECT_FILE_FAILED: "Lỗi mở hộp thoại chọn file!",
    SELECT_FOLDER_FAILED: "Lỗi mở hộp thoại chọn thư mục!",
    ULTRA_SPAWN_LOG: "[Hệ thống] 🚀 Khởi chạy công cụ tối ưu hóa CapCut...",
    ULTRA_CLEANED_LOCK: "[Hệ thống] 🗑️ Đã xóa file khóa dự án .locked để giải phóng hoàn toàn dự án.",
    ULTRA_UPDATED_META: "[Hệ thống] 📝 Đã cập nhật thời gian sửa đổi trong draft_meta_info.json thành hiện tại.",
    ULTRA_EXIT_ERROR: "Quy trình Biên tập CapCut thất bại với mã thoát: {0}",
    ULTRA_UNEXPECTED_ERR: "Lỗi không xác định khi chạy Biên tập CapCut: {0}",
    ULTRA_RUN_SELECT_FILE: "Đang chạy lệnh chọn file: {0}",
    ULTRA_SELECT_FILE_FAIL: "Hộp thoại chọn file thất bại: {0}",
    ULTRA_RUN_SELECT_FOLDER: "Đang chạy lệnh chọn thư mục: {0}",
    ULTRA_SELECT_FOLDER_FAIL: "Hộp thoại chọn thư mục thất bại: {0}",
    TTS_FETCH_POLLING_ERROR: "Lỗi kết nối khi đồng bộ giọng nói: {0}",
    TTS_POLLING_FAILED_RETRYING: "Lỗi đồng bộ, đang thử lại... {0}",
    TEMPLATE_LIST_FAILED: "Lỗi lấy danh sách mẫu (template)",
    TEMPLATE_SAVE_FAILED: "Lỗi lưu mẫu dự án (template)",
    TEMPLATE_NAME_REQUIRED: "Tên và nội dung của mẫu là bắt buộc",
    TEMPLATE_NOT_FOUND: "Không tìm thấy mẫu dự án yêu cầu",
    TEMPLATE_DELETE_FAILED: "Lỗi khi xoá mẫu dự án",
    ULTRA_EXPORT_STARTING: "🎬 [Xuất Video] Bắt đầu kết xuất video từ dự án CapCut...",
    ULTRA_EXPORT_NO_MEDIA: "⚠️ [Xuất Video] Không tìm thấy file ảnh hoặc audio trong dự án để kết xuất!",
    ULTRA_EXPORT_NO_OUTPUT_DIR: "❌ [Xuất Video] Chưa chỉ định thư mục lưu video!",
    ULTRA_EXPORT_NO_DRAFT: "❌ [Xuất Video] Không tìm thấy file draft_content.json để đọc media!",
    ULTRA_EXPORT_RENDERING: "⏳ [Xuất Video] Đang kết xuất video bằng ffmpeg ({0} ảnh, {1} audio)...",
    ULTRA_EXPORT_SUCCESS: "✅ [Xuất Video] Kết xuất video thành công! File lưu tại: {0}",
    ULTRA_EXPORT_FAILED: "❌ [Xuất Video] Kết xuất thất bại: {0}",
    ULTRA_EXPORT_WARN_NO_AUDIO: "⚠️ [Xuất Video] Không có audio, sẽ kết xuất video im lặng.",
  },
  en: {
    TEMPLATE_RENAME_REQUIRED: "New name is required.",
    TEMPLATE_RENAME_NOT_FOUND: "Template not found or rename failed.",
    TEMPLATE_RENAME_FAILED: "Error renaming template",
    PLAYWRIGHT_CONFIG_NEW: "[Playwright] Applying new configuration...",
    PLAYWRIGHT_CONFIG_SUCCESS: "[Playwright] Configuration successful!",
    PLAYWRIGHT_CONFIG_SKIP: "[Playwright] Skipping automatic configuration:",
    PLAYWRIGHT_INPUT_NOT_FOUND: "Prompt input field not found",
    PLAYWRIGHT_BASE64_SUCCESS: "📸 Image successfully captured from browser!",
    PLAYWRIGHT_REQUIRED: "Playwright activation required.",
    PLAYWRIGHT_SANDBOX_ERR: "Sandbox connection error.",
    PLAYWRIGHT_RECAPTCHA: "reCAPTCHA verification required.",
    PLAYWRIGHT_REASON: "Details: ",
    LABS_VIDEO: "Video",
    LABS_IMAGE: "Image",
    LABS_IMAGEN: "Imagen 3",
    LABS_VEO: "Nano Banana 2",
    PLAYWRIGHT_PASTE_LOG: "[Playwright] Pasting prompt...",
    PLAYWRIGHT_TYPE_LOG: "[Playwright] Typing prompt...",
    PLAYWRIGHT_SUBMIT_LOG: "👆 Submitting image generation request...",
    PLAYWRIGHT_SUBMIT_NOT_FOUND: "Generate button not found",
    PLAYWRIGHT_WAITING_GEN: "⏱️ Waiting for browser to generate image...",
    PLAYWRIGHT_DECODE_ERR: "Image decoding error.",
    PLAYWRIGHT_REDIRECT_LOG: "🌐 Opening Project Flow: ",
    PLAYWRIGHT_INPUT_LOG: "[Playwright] Prompt: ",
    CHARACTER_ANALYZE_FAIL: "Character analysis failed",
    SCRIPT_REQUIRED: "Script is required",
    IMAGES_REQUIRED: "Missing images",
    CHARACTER_EXTRACT_FAIL: "Character extraction failed",
    STORYBOARD_INVALID: "Invalid storyboard structure",
    CHARACTER_PROMPT_REQUIRED: "Missing character prompt",
    GEMINI_NOT_INIT: "Gemini SDK not initialized.",
    STYLE_EXTRACTION_ERR: "Style extraction failed",
    STORYBOARD_REQUIRED: "Storyboard script is required",
    NEW_STYLE_REQUIRED: "New style description is required",
    THUMBNAILS_REQUIRED: "Missing thumbnails",
    CHAR_DESC_REQUIRED: "Missing character description",
    BODY_FIELDS_REQUIRED: "Missing text or voiceId",
    AUDIO_CHUNKS_REQUIRED: "Missing audio chunks",
    AUDIO_DATA_NOT_FOUND: "Audio data not found",
    TTS_START: "[TTS] Starting speech generation: ",
    TTS_TASK_ID: "[TTS] Task ID: ",
    TTS_POLLING: ". Polling and synchronizing...",
    TTS_COMPLETE: "[TTS] Completed. Downloaded file from: ",
    IMAGE_RENDER_ATTEMPT: "[Render Image] Attempt ",
    IMAGE_RENDER_STARTING: " starting...",
    IMAGE_RENDER_RELOAD: "[Render Image] Reloading page to retry...",
    PROJECT_NOT_FOUND: "Project not found",
    PROJECT_READ_ERR: "Error reading projects.json file:",
    PROJECT_WRITE_ERR: "Error writing projects.json file:",
    SQLITE_MIGRATION_START: "[System - SQLite] 🔄 Old JSON data files detected. Starting migration to SQLite...",
    SQLITE_MIGRATION_EMPTY: "[System - SQLite] ℹ️ Old project list is empty. Skipping migration.",
    SQLITE_MIGRATION_SUCCESS: "[System - SQLite] ✅ Successfully migrated all data to SQLite. Old JSON files backed up in projects_backup_json/.",
    SQLITE_INIT_ERR: "Could not connect to or initialize SQLite database",
    SQLITE_LIST_ERR: "Error reading project list from SQLite",
    SQLITE_DETAIL_ERR: "Error reading project detail from SQLite",
    SQLITE_WRITE_ERR: "Error writing project detail to SQLite",
    SQLITE_DELETE_ERR: "Error deleting project from SQLite",
    SQLITE_MIGRATE_CRITICAL: "[System - SQLite] Critical error during old data migration",
    SQLITE_MIGRATE_PARSE_ERR: "[System - SQLite] Error parsing project detail file",
    SQLITE_MIGRATE_BACKUP_ERR: "[System - SQLite] Error backing up metadata file projects.json",
    FETCH_VOICES_ERR: "Error fetching voice list:",
    PLAYWRIGHT_CONNECTING: "🔗 Connecting to real Chrome browser via port 9222...",
    PLAYWRIGHT_ACCESSING_LABS: "🌐 Accessing Google Labs...",
    PLAYWRIGHT_LOGIN_PROMPT: "\n⚠️  [ATTENTION] Please log in to your Google account in the browser...",
    PLAYWRIGHT_TOKEN_CAPTURED: "✅ Bearer Token captured successfully!",
    PLAYWRIGHT_TOKEN_TIMEOUT: "⏳ Login timeout.",
    PLAYWRIGHT_CONNECT_ERR: "❌ Error connecting to Chrome:",
    PLAYWRIGHT_CHROME_MANDATE: "⚠️  YOU NEED TO OPEN CHROME FIRST USING THIS COMMAND BEFORE RUNNING SERVER:",
    PLAYWRIGHT_CHROME_COMMAND: '👉 start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\chrome_debug_profile"',
    MISSING_SCENE_SCRIPT: "Missing scene script",
    TTS_TASK_ERROR: "TTS Task Error: ",
    NO_AUDIO_CHUNKS: "No audio chunks provided",
    NO_VALID_AUDIO_BASE64: "No valid base64 audio data found in chunks",
    FAILED_READ_MERGED_AUDIO: "Failed to read merged audio file",
    FFMPEG_PROCESSING_ERROR: "FFmpeg processing error: ",
    INTERNAL_SERVER_ERROR: "Internal server error: ",
    HTTP_STATUS_ERROR: "HTTP error! status: ",
    GOOGLE_TTS_FAILED: "Google TTS failed for chunk: {0}",
    TTS_FETCH_POLLING_ERROR: "Fetch polling error: {0}",
    TTS_POLLING_FAILED_RETRYING: "Polling task failed, retrying... {0}",
    PLAYWRIGHT_BORDER: "\n=======================================================",
    PLAYWRIGHT_BORDER_BOTTOM: "=======================================================\n",
    PLAYWRIGHT_PAGE_CLOSED_REINIT: "[Playwright] Browser page is closed or not initialized. Re-initializing...",
    PLAYWRIGHT_PAGE_CLOSED_PREV_ATTEMPT: "[Playwright] Page was closed in previous attempt. Re-initializing...",
    PLAYWRIGHT_CLOSED_DETECTED_RESET: "[Playwright] Detect closed page/context. Resetting Playwright instance...",
    GEMINI_CHAT_START_ROOM: "[Gemini Chat] Starting new chat room (Attempt {0}/{1})...",
    GEMINI_CHAT_INIT_FAILED: "[Gemini Chat] Failed to initialize new page: {0}",
    GEMINI_CHAT_RELOAD: "[Gemini Chat] Encountered issue, reloading page attempt {0}...",
    GEMINI_CHAT_RELOAD_FAILED: "[Gemini Chat] Page reload failed: {0}",
    GEMINI_CHAT_ATTEMPT_FAILED: "[Gemini Chat] Error on attempt {0} in room {1}: {2}",
    GEMINI_CHAT_FAILED_COMPLETELY: "[Gemini Chat] Failed completely: {0}",
    GEMINI_CHAT_FALLBACK_WARNING: "Image generation via Gemini Chat Room failed completely. Using fallback image.",
    GEMINI_CHAT_CONFIG_MODEL: "[Gemini Chat] Configuring model: Target is {0}",
    GEMINI_CHAT_CURRENT_MODEL: "[Gemini Chat] Current model: {0}",
    GEMINI_CHAT_MODEL_CORRECT: "[Gemini Chat] Current model matches config, skipping.",
    GEMINI_CHAT_MODEL_SUCCESS: "[Gemini Chat] Changed model to: {0}",
    GEMINI_CHAT_MODEL_NOT_FOUND: "[Gemini Chat] Model option button {0} not found",
    GEMINI_CHAT_MODEL_PICKER_NOT_FOUND: "[Gemini Chat] Model picker button not found.",
    GEMINI_CHAT_CONFIG_GEN_TYPE: "[Gemini Chat] Configuring generate type: {0}",
    GEMINI_CHAT_GEN_TYPE_SUCCESS: "[Gemini Chat] Generate type set to: {0}",
    GEMINI_CHAT_GEN_TYPE_FALLBACK: "[Gemini Chat] Generate type set to (fallback): {0}",
    GEMINI_CHAT_GEN_TYPE_NOT_FOUND: '[Gemini Chat] Generate type option "{0}" not found in menu.',
    GEMINI_CHAT_PLUS_NOT_FOUND: "[Gemini Chat] Plus configuration button not found.",
    GEMINI_CHAT_TYPING_PROMPT: "[Gemini Chat] Typing prompt...",
    GEMINI_CHAT_PASTING_PROMPT: "[Gemini Chat] Pasting prompt...",
    GEMINI_CHAT_WAITING_RESPONSE: "[Gemini Chat] Waiting for Gemini response...",
    GEMINI_CHAT_THINKING_DETACHED: "[Gemini Chat] Thinking-overlay not found or detached early.",
    GEMINI_CHAT_DOWNLOAD_ERROR: "Download button not found in Gemini response.",
    GEMINI_CHAT_ROOM_REUSE: "[Gemini Chat] Continuing using the current chat room for generation...",
    GEMINI_CHAT_ROOM_FORCED: "[Gemini Chat] Detected consecutive errors >= 2, forcing a new room.",
    GEMINI_CHAT_NO_RESPONSE: "[Gemini Chat] Last model-response not found.",
    GEMINI_CHAT_BUSY_WAIT: "[Gemini Chat] Detected busy response (aria-busy=true), waiting for completion...",
    GEMINI_CHAT_BUSY_TIMEOUT: "[Gemini Chat] Error or timeout waiting for response to be ready (aria-busy=false).",
    GEMINI_CHAT_NO_CONTAINER: "[Gemini Chat] Completed image container not found, continuing checking.",
    GEMINI_CHAT_NO_SRC: "[Gemini Chat] Valid src attribute not found on media element.",
    GEMINI_CHAT_EXTRACTING_MEDIA: "[Gemini Chat] Detected media source ({0}): {1}. Extracting data directly...",
    GEMINI_CHAT_EXTRACT_FAILED: "[Gemini Chat] Direct extraction failed: {0}",
    GEMINI_CHAT_EXTRACT_ERROR: "[Gemini Chat] Error extracting data: {0}",
    GEMINI_CHAT_EXTRACT_SUCCESS: "[Gemini Chat] Successfully retrieved media directly from browser URL!",
    GEMINI_CHAT_EXTRACT_ERR_THROW: "Could not extract image/video data from browser URL.",
    GEMINI_CHAT_MODEL_MOCK_CHECK: "[Gemini Chat] Simulating click to check Model Picker...",
    GEMINI_CHAT_PLUS_MOCK_CHECK: "[Gemini Chat] Simulating click to check menu Plus...",
    GEMINI_CHAT_BATCH_START: "[Batch Gemini] Opening {0} parallel tabs to generate images...",
    GEMINI_CHAT_BATCH_TAB_INIT: "[Batch Gemini] Tab {0}/{1} opened successfully.",
    GEMINI_CHAT_BATCH_TAB_START: '[Batch Gemini] Tab {0}: Starting image generation for scene "{1}"...',
    GEMINI_CHAT_BATCH_TAB_SUCCESS: '[Batch Gemini] Tab {0}: ✅ Successfully generated image for scene "{1}".',
    GEMINI_CHAT_BATCH_TAB_ERROR: '[Batch Gemini] Tab {0}: ❌ Error for scene "{1}": {2}',
    GEMINI_CHAT_BATCH_TAB_RECOVERY: "[Batch Gemini] Tab {0}: Automatically reloading tab due to error to recover...",
    GEMINI_CHAT_BATCH_TAB_REDIRECT: "[Batch Gemini] Tab {0}: Redirecting to Gemini homepage to initialize a new chat session...",
    GEMINI_CHAT_BATCH_COMPLETE: "[Batch Gemini] Completed batch: {0}/{1} successful.",
    GEMINI_CHAT_BATCH_INIT_ERROR: "[Batch Gemini] Batch initialization error: {0}",
    GEMINI_CHAT_BATCH_CLOSE_TABS: "[Batch Gemini] Closing all {0} active batch tabs...",
    GEMINI_CHAT_PAGE_CLOSED: "Browser page is closed or not initialized.",
    GEMINI_CHAT_BATCH_FORCED_NEW_ROOM: "[Batch Gemini] Tab {0}: Forced to create a new room due to consecutive errors ({1} times)",
    GEMINI_CHAT_BATCH_REDIRECT_ATTEMPT: "[Batch Gemini] Tab {0}: Redirecting to homepage to create a new room (Attempt {1}/{2})...",
    GEMINI_CHAT_BATCH_REDIRECT_FAILED: "[Batch Gemini] Tab {0}: Redirect failed: {1}",
    GEMINI_CHAT_BATCH_ROOM_REUSE: "[Batch Gemini] Tab {0}: Reusing the current chat room",
    GEMINI_CHAT_BATCH_RELOAD_ATTEMPT: "[Batch Gemini] Tab {0}: Reloading room (Reload: {1})...",
    GEMINI_CHAT_BATCH_RELOAD_FAILED: "[Batch Gemini] Tab {0}: Reload failed: {1}",
    GEMINI_CHAT_BATCH_RENDER_ERROR: "[Batch Gemini] Tab {0}: Error rendering image (Attempt {1} in room): {2}",
    GEMINI_CHAT_BATCH_FAILED_COMPLETELY: "[Batch Gemini] Tab {0}: Failed completely after room attempts: {1}",
    UNKNOWN_ERROR: "Unknown error.",
    BATCH_GEN_NO_ITEMS: "No items to generate images.",
    BATCH_GEN_SYSTEM_ERROR: "A system error occurred: {0}",
    STREAM_NOT_SUPPORTED: "Data stream is not supported by this browser.",
    VOICE_ALIGN_NO_AUDIO: "No audio data found.",
    VOICE_ALIGN_NO_SCENES: "No scenes found.",
    VOICE_ALIGN_MISSING_OUTPUT: "No output file received from Python script.",
    VOICE_ALIGN_INSTALL_ERR: "Python environment lacks 'openai-whisper' library and automatic installation failed. Please run 'pip install openai-whisper' manually on Terminal. Error: {0}",
    VOICE_ALIGN_PARSE_ERR: "Error reading synchronization results: {0}",
    GEMINI_CHAT_WAIT_NEW_RESPONSE_TIMEOUT: "Timeout waiting for new response from Gemini Chat or no new response found.",
    GEMINI_CHAT_NO_NEW_RESPONSE: "No new response from Gemini after sending prompt. Please try again.",
    GEMINI_CHAT_PREVENT_OLD_IMAGE: "No new response created from Gemini Chat. Prevented extracting old image.",
    GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM: "[Batch] Preparing Tab {0}: Redirecting to a clean new chat room.",
    GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM_ERR: "[Batch] Error preparing Tab {0}: {1}",
    GEMINI_CHAT_CLICKED_SEND: "[Gemini Chat] Clicked Send Button.",
    GEMINI_CHAT_CLICK_SEND_FAILED: "[Gemini Chat] Failed to click Send Button, falling back to Enter: {0}",
    GEMINI_CHAT_PRESSED_ENTER: "[Gemini Chat] Pressed Enter.",
    PLAYWRIGHT_MUTEX_DELAY: "[Playwright] Waiting {0}ms before releasing image generation mutex...",
    GEMINI_CHAT_MUTEX_DELAY: "[Gemini Chat] Waiting {0}ms before releasing image generation mutex...",
    GEMINI_CHAT_BATCH_NEXT_DELAY: "[Batch Gemini] Tab {0}: Waiting {1}ms before processing next scene...",
    SPAM_PREVENTION_DELAY: "[Spam Prevention] Waiting for {0}ms before next image generation request...",
    API_RATE_LIMITS_TRIGGERED: "API rate limits triggered",
    TTS_DEFAULT_TEST: "Hello, this is a test voice.",
    ULTRA_FILE_REQUIRED: "draft_content.json file path is required!",
    ULTRA_FILE_NOT_FOUND: "draft_content.json file not found!",
    ULTRA_SUCCESS: "CapCut Editor processed successfully!",
    SELECT_FILE_FAILED: "Error opening file selector!",
    SELECT_FOLDER_FAILED: "Error opening folder selector!",
    ULTRA_SPAWN_LOG: "[System] 🚀 Spawning CapCut optimization tool...",
    ULTRA_CLEANED_LOCK: "[System] 🗑️ Removed project lock file .locked to fully release the project.",
    ULTRA_UPDATED_META: "[System] 📝 Updated modification time in draft_meta_info.json to present.",
    ULTRA_EXIT_ERROR: "CapCut Editor process failed with exit code: {0}",
    ULTRA_UNEXPECTED_ERR: "Unexpected error running CapCut Editor: {0}",
    ULTRA_RUN_SELECT_FILE: "Running select-file command: {0}",
    ULTRA_SELECT_FILE_FAIL: "Select file dialog failed: {0}",
    ULTRA_RUN_SELECT_FOLDER: "Running select-folder command: {0}",
    ULTRA_SELECT_FOLDER_FAIL: "Select folder dialog failed: {0}",
    TEMPLATE_LIST_FAILED: "Failed to list templates",
    TEMPLATE_SAVE_FAILED: "Failed to save template",
    TEMPLATE_NAME_REQUIRED: "Name and content are required",
    TEMPLATE_NOT_FOUND: "Template not found",
    TEMPLATE_DELETE_FAILED: "Failed to delete template",
    ULTRA_EXPORT_STARTING: "🎬 [Export Video] Starting video render from CapCut project...",
    ULTRA_EXPORT_NO_MEDIA: "⚠️ [Export Video] No image or audio files found in project to render!",
    ULTRA_EXPORT_NO_OUTPUT_DIR: "❌ [Export Video] No output directory specified!",
    ULTRA_EXPORT_NO_DRAFT: "❌ [Export Video] Could not find draft_content.json to read media!",
    ULTRA_EXPORT_RENDERING: "⏳ [Export Video] Rendering video with ffmpeg ({0} images, {1} audio tracks)...",
    ULTRA_EXPORT_SUCCESS: "✅ [Export Video] Video exported successfully! Saved to: {0}",
    ULTRA_EXPORT_FAILED: "❌ [Export Video] Export failed: {0}",
    ULTRA_EXPORT_WARN_NO_AUDIO: "⚠️ [Export Video] No audio found, rendering silent video.",
  },
};

export const PIPELINE_LOGS_LOCALIZED = {
  vi: {
    HOOK_STEP1: "[Hook] B1: Phân tích chủ đề & đối tượng...",
    HOOK_AUTO_GENERATE: "🤖 Tự động biên soạn Câu dẫn dắt (Hook) theo cấu hình...",
    HOOK_EMBEDDED: "✨ Đã nhúng Hook: ",
    HOOK_STEP1_DONE: "[Hook] Đã xác định khán giả:",
    HOOK_STEP2: "[Hook] B2: Tạo nháp hook...",
    HOOK_STEP2_DONE: "[Hook] Đã tạo thành công",
    HOOK_STEP3: "[Hook] B3: Tối ưu nhịp điệu & CTR...",
    HOOK_STEP3_DONE: "[Hook] Hoàn thành tối ưu hook.",
    SCRIPT_STEP1: "[Script] B1: Xây dựng bảng thuật ngữ...",
    SCRIPT_STEP1_DONE: "[Script] Bảng thuật ngữ ưu tiên:",
    SCRIPT_STEP2A: "[Script] B2a: Lập dàn ý chương...",
    SCRIPT_STEP2A_DONE: "[Script] Đã tạo dàn ý nháp",
    SCRIPT_STEP2B: "[Script] B2b: Phản biện & tối ưu cốt truyện...",
    SCRIPT_STEP2B_DONE: "[Script] Đã tối ưu dàn ý. Số chương:",
    SCRIPT_STEP3: "[Script] B3: Viết chi tiết chương...",
    SCRIPT_STEP3_PROGRESS: "[Script] Đang viết chương",
    SCRIPT_STEP4: "[Script] B4: Chuẩn hóa văn bản cho TTS...",
    SCRIPT_STEP4_DONE: "[Script] Hoàn thành biên kịch.",
    STORY_STEP1: "[Storyboard] B1: Thiết lập Visual Bible...",
    STORY_STEP1_DONE: "[Storyboard] Đã tạo Visual Bible. Bảng màu:",
    STORY_STEP2: "[Storyboard] B2: Phân chia phân cảnh...",
    STORY_STEP3: "[Storyboard] B3: Đồng bộ prompt theo Visual Bible...",
    STORY_REFINE_SUCCESS: "[Storyboard] Đã tinh chỉnh prompt",
    STORY_REFINE_ERROR: "[Storyboard] Lỗi đồng bộ prompt:",
    STORY_DONE_ALL: "[Storyboard] Hoàn thành phân cảnh.",
    SEO_STEP1: "[SEO] B1: Trích xuất từ khóa...",
    SEO_STEP1_DONE: "[SEO] Từ khóa chính:",
    SEO_STEP2: "[SEO] B2: Tạo nháp tiêu đề & mô tả...",
    SEO_STEP2_DONE: "[SEO] Đã tạo nháp.",
    SEO_STEP3: "[SEO] B3: Tối ưu CTR tiêu đề...",
    SEO_DONE_ALL: "[SEO] Hoàn thành tối ưu SEO.",
    THUMB_STEP1: "[Thumbnail] B1: Phân tích bố cục CTR cao...",
    THUMB_STEP1_DONE: "[Thumbnail] Bố cục đề xuất:",
    THUMB_STEP2: "[Thumbnail] B2: Tạo nháp layout...",
    THUMB_STEP2_DONE: "[Thumbnail] Đã tạo nháp",
    THUMB_STEP3: "[Thumbnail] B3: Tối ưu prompt & hiệu ứng...",
    THUMB_DONE_ALL: "[Thumbnail] Hoàn thành tạo thumbnail.",
    VOICE_ALIGN_START: "Đang đồng bộ AI Voice (Python)...",
  },
  en: {
    HOOK_STEP1: "[Hook] Step 1: Topic & audience analysis...",
    HOOK_AUTO_GENERATE: "🤖 Auto-generating Hook from config...",
    HOOK_EMBEDDED: "✨ Hook embedded: ",
    HOOK_STEP1_DONE: "[Hook] Audience identified:",
    HOOK_STEP2: "[Hook] Step 2: Drafting hook...",
    HOOK_STEP2_DONE: "[Hook] Drafted successfully",
    HOOK_STEP3: "[Hook] Step 3: Optimizing rhythm & CTR...",
    HOOK_STEP3_DONE: "[Hook] Completed hook optimization.",
    SCRIPT_STEP1: "[Script] Step 1: Building terms glossary...",
    SCRIPT_STEP1_DONE: "[Script] Preferred terms glossary:",
    SCRIPT_STEP2A: "[Script] Step 2a: Drafting chapter outlines...",
    SCRIPT_STEP2A_DONE: "[Script] Draft outline created",
    SCRIPT_STEP2B: "[Script] Step 2b: Critiquing & optimizing storyline...",
    SCRIPT_STEP2B_DONE: "[Script] Optimized outline. Number of chapters:",
    SCRIPT_STEP3: "[Script] Step 3: Writing detailed chapters...",
    SCRIPT_STEP3_PROGRESS: "[Script] Writing chapter",
    SCRIPT_STEP4: "[Script] Step 4: Normalizing text for TTS...",
    SCRIPT_STEP4_DONE: "[Script] Completed script writing.",
    STORY_STEP1: "[Storyboard] Step 1: Setting up Visual Bible...",
    STORY_STEP1_DONE: "[Storyboard] Visual Bible created. Color palette:",
    STORY_STEP2: "[Storyboard] Step 2: Splitting scenes...",
    STORY_STEP3: "[Storyboard] Step 3: Syncing prompts with Visual Bible...",
    STORY_REFINE_SUCCESS: "[Storyboard] Refined prompts",
    STORY_REFINE_ERROR: "[Storyboard] Error syncing prompts:",
    STORY_DONE_ALL: "[Storyboard] Completed storyboarding.",
    SEO_STEP1: "[SEO] Step 1: Extracting keywords...",
    SEO_STEP1_DONE: "[SEO] Core keywords:",
    SEO_STEP2: "[SEO] Step 2: Drafting titles & descriptions...",
    SEO_STEP2_DONE: "[SEO] Draft completed.",
    SEO_STEP3: "[SEO] Step 3: Optimizing title CTR...",
    SEO_DONE_ALL: "[SEO] Completed SEO optimization.",
    THUMB_STEP1: "[Thumbnail] Step 1: Analyzing high-CTR layouts...",
    THUMB_STEP1_DONE: "[Thumbnail] Proposed layouts:",
    THUMB_STEP2: "[Thumbnail] Step 2: Drafting layouts...",
    THUMB_STEP2_DONE: "[Thumbnail] Drafted successfully",
    THUMB_STEP3: "[Thumbnail] Step 3: Optimizing prompts & effects...",
    THUMB_DONE_ALL: "[Thumbnail] Completed thumbnail generation.",
    VOICE_ALIGN_START: "Syncing AI Voice (Python)...",
  },
};

export type BackendMessageKey = keyof typeof BACKEND_MESSAGES_LOCALIZED.en;
export type PipelineLogKey = keyof typeof PIPELINE_LOGS_LOCALIZED.en;

export const getBackendMsg = (key: BackendMessageKey, isVi: boolean = true): string => {
  return isVi ? BACKEND_MESSAGES_LOCALIZED.vi[key] : BACKEND_MESSAGES_LOCALIZED.en[key];
};

export const getPipelineLog = (key: PipelineLogKey, isVi: boolean = true): string => {
  return isVi ? PIPELINE_LOGS_LOCALIZED.vi[key] : PIPELINE_LOGS_LOCALIZED.en[key];
};

export const BACKEND_MESSAGES = new Proxy({} as Record<BackendMessageKey, string>, {
  get(_, prop: string) {
    const key = prop as BackendMessageKey;
    return BACKEND_MESSAGES_LOCALIZED.vi[key] || BACKEND_MESSAGES_LOCALIZED.en[key] || "";
  },
});

export const PIPELINE_LOGS = new Proxy({} as Record<PipelineLogKey, string>, {
  get(_, prop: string) {
    const key = prop as PipelineLogKey;
    return PIPELINE_LOGS_LOCALIZED.vi[key] || PIPELINE_LOGS_LOCALIZED.en[key] || "";
  },
});

export type LogLang = "en" | "vi";

export const getFriendlyActionName = (actionName: string, lang: "vi" | "en" = "vi"): string => {
  const dictionary: Record<string, { vi: string; en: string }> = {
    handleCloseVoiceModal: {
      vi: "Đóng cửa sổ chọn giọng đọc",
      en: "Close voice selection dialog",
    },
    handleProcessInputAndConfig: {
      vi: "Bắt đầu phân tích kịch bản gốc và chuẩn bị biên kịch...",
      en: "Starting script analysis and preparing rewrite...",
    },
    handleTriggerStoryboardSplit: {
      vi: "Bắt đầu phân chia kịch bản thành các phân cảnh chi tiết...",
      en: "Starting scene splitting and storyboarding...",
    },
    handleRenderSceneImage: {
      vi: "Bắt đầu gửi yêu cầu tạo hình ảnh cho phân cảnh...",
      en: "Submitting request to generate scene image...",
    },
    handleUploadSceneImage: {
      vi: "Tải lên hình ảnh tùy chỉnh cho phân cảnh",
      en: "Uploading custom image for scene",
    },
    handleCopyPrompt: {
      vi: "Sao chép mô tả hình ảnh (prompt) thành công",
      en: "Copied scene visual prompt to clipboard",
    },
    handleCopyHook: {
      vi: "Sao chép nội dung mở đầu (hook) thành công",
      en: "Copied hook content to clipboard",
    },
    handleCopyAllPrompts: {
      vi: "Sao chép toàn bộ mô tả hình ảnh của kịch bản phân cảnh",
      en: "Copied all storyboard scene prompts",
    },
    handleReferenceImagesUpload: {
      vi: "Tải lên hình ảnh mẫu tham chiếu phong cách",
      en: "Uploading style reference images",
    },
    handleExtractStyle: {
      vi: "Bắt đầu trích xuất phong cách thiết kế từ hình ảnh tham chiếu...",
      en: "Starting style extraction from reference images...",
    },
    handleApplyStyleToScenes: {
      vi: "Đang áp dụng phong cách thiết kế mẫu lên toàn bộ phân cảnh...",
      en: "Applying visual style to all storyboard scenes...",
    },
    handleOptimizeAllPrompts: {
      vi: "Đang tự động cải thiện và tối ưu hóa mô tả hình ảnh cho toàn bộ phân cảnh...",
      en: "Optimizing and improving image descriptions for all scenes...",
    },
    handleAnalyzeCharacter: {
      vi: "Bắt đầu phân tích các đặc điểm nhân vật...",
      en: "Starting character analysis...",
    },
    handleCharacterImagesUpload: {
      vi: "Tải lên ảnh mẫu của nhân vật",
      en: "Uploading character sample images",
    },
    handleApplyCharacterToScenes: {
      vi: "Đang áp dụng đặc điểm nhân vật lên toàn bộ phân cảnh liên quan...",
      en: "Applying character prompt to all relevant scenes...",
    },
    handleBulkUploadImages: {
      vi: "Đang tải lên hàng loạt hình ảnh cho các phân cảnh...",
      en: "Uploading bulk images for scenes...",
    },
    handlePrevSlide: {
      vi: "Chuyển về khung hình trước đó",
      en: "Navigated to previous frame",
    },
    handleThumbnailReferenceImagesUpload: {
      vi: "Tải lên ảnh mẫu tham chiếu cho ảnh thu nhỏ (thumbnail)",
      en: "Uploading thumbnail style reference images",
    },
    handleExtractThumbnailStyle: {
      vi: "Bắt đầu trích xuất phong cách thiết kế cho ảnh thu nhỏ...",
      en: "Starting style extraction for thumbnail...",
    },
    handleNextSlide: {
      vi: "Chuyển sang khung hình tiếp theo",
      en: "Navigated to next frame",
    },
    handleDeleteSceneImage: {
      vi: "Xóa hình ảnh đã chọn của phân cảnh",
      en: "Deleting selected scene image",
    },
    handleDeleteAllSceneImages: {
      vi: "Xóa toàn bộ hình ảnh phân cảnh đã tạo",
      en: "Deleting all generated scene images",
    },
    handleBatchGenerateAllImages: {
      vi: "Bắt đầu tiến trình tạo hàng loạt hình ảnh cho tất cả phân cảnh...",
      en: "Starting batch image generation for all scenes...",
    },
    handleGenerateDetailedPrompt: {
      vi: "Đang mở rộng mô tả hình ảnh chi tiết cho phân cảnh...",
      en: "Generating detailed visual prompt for scene...",
    },
    handleSaveSceneEdits: {
      vi: "Đang lưu các thay đổi chỉnh sửa của phân cảnh...",
      en: "Saving custom scene edits...",
    },
    handleTriggerAssetAndThumbnail: {
      vi: "Bắt đầu thiết lập nội dung và ảnh thu nhỏ...",
      en: "Initializing assets and thumbnail configuration...",
    },
    handleRenderThumbnailImage: {
      vi: "Bắt đầu gửi yêu cầu tạo ảnh thu nhỏ (thumbnail)...",
      en: "Submitting request to generate thumbnail...",
    },
    handleDownloadVoice: {
      vi: "Tải tệp âm thanh giọng đọc thành công",
      en: "Downloaded speech audio successfully",
    },
    handleRegenerateUnifiedVoice: {
      vi: "Yêu cầu tạo lại toàn bộ tệp giọng đọc hợp nhất...",
      en: "Re-generating unified project voiceover...",
    },
    handleTriggerVoiceGenerate: {
      vi: "Bắt đầu chuyển kịch bản phân đoạn thành giọng nói AI...",
      en: "Starting voiceover synthesis for script segment...",
    },
    handleTriggerAllSceneVoices: {
      vi: "Bắt đầu tạo giọng đọc AI hàng loạt cho tất cả các phân cảnh...",
      en: "Starting batch voiceover synthesis for all scenes...",
    },
    handleTriggerStoryboardAndVoices: {
      vi: "Bắt đầu đồng bộ kịch bản phân cảnh và giọng đọc AI...",
      en: "Starting synchronization of storyboard scenes and voice...",
    },
    handleTriggerSEOBoost: {
      vi: "Bắt đầu tiến trình tối ưu hóa SEO (Tiêu đề, Mô tả, Từ khóa)...",
      en: "Starting SEO optimization (Titles, Descriptions, Keywords)...",
    },
    handleOpenExportCenter: {
      vi: "Mở trung tâm xuất dữ liệu (Export Center)",
      en: "Opened project Export Center",
    },
    handleOfflineRenderWebM: {
      vi: "Bắt đầu kết xuất (render) video ngoại tuyến định dạng WebM...",
      en: "Starting offline WebM video rendering...",
    },
    handleDownloadJSONProject: {
      vi: "Đang chuẩn bị xuất tệp tin dự án định dạng JSON...",
      en: "Preparing to export project JSON file...",
    },
    handleDownloadSRT: {
      vi: "Đang chuẩn bị xuất tệp tin phụ đề định dạng SRT...",
      en: "Preparing to export subtitles SRT file...",
    },
    handleDownloadCapcutLink: {
      vi: "Đang chuẩn bị xuất định dạng liên kết CapCut...",
      en: "Preparing to export CapCut project link...",
    },
    handleDownloadPremiereXML: {
      vi: "Đang chuẩn bị xuất tệp tin dòng thời gian XML cho Premiere...",
      en: "Preparing to export Premiere XML timeline file...",
    },
    handleApplyCharacterToThumbnails: {
      vi: "Đang áp dụng đặc điểm nhân vật chính vào toàn bộ ảnh bìa...",
      en: "Applying main character traits to all cover thumbnails...",
    },
    handleProcessExternalAudio: {
      vi: "Bắt đầu xử lý và đồng bộ tệp âm thanh bên ngoài...",
      en: "Starting processing and aligning external audio file...",
    },
  };

  if (!actionName) return "";

  if (actionName.startsWith("handleExtractCharacter")) {
    return lang === "vi" ? "Bắt đầu trích xuất đặc điểm nhân vật..." : "Extracting character traits from script...";
  }

  const match = dictionary[actionName];
  if (match) {
    return match[lang];
  }

  const cleanName = actionName
    .replace(/^handle/, "")
    .replace(/([A-Z])/g, " $1")
    .trim();
  return lang === "vi" ? `Yêu cầu thực thi: ${cleanName}` : `Requested execution: ${cleanName}`;
};

export const LOG_DICTIONARY = {
  STORYBOARD_SPLITTING_GEMINI: {
    en: "[Storyboard] Calling Gemini to split script sentences...",
    vi: "[Storyboard] Đang gọi Gemini thực hiện phân chia câu thoại kịch bản...",
  },
  STORYBOARD_GENERATING_DETAILS_BATCH: {
    en: "[Storyboard] Generating scene details in batches (total {0} scenes)...",
    vi: "[Storyboard] Đang tạo chi tiết phân cảnh theo từng lô (tổng cộng {0} phân cảnh)...",
  },
  STORYBOARD_PROCESSING_BATCH: {
    en: "[Storyboard] Processing scene batch {0}/{1}...",
    vi: "[Storyboard] Đang xử lý lô phân cảnh {0}/{1}...",
  },
  STORYBOARD_BATCH_GEN_ERROR: {
    en: "Error generating details for batch {0}: {1}",
    vi: "Lỗi khi tạo chi tiết phân cảnh cho lô {0}: {1}",
  },
  STORYBOARD_GEMINI_SPLIT_FALLBACK: {
    en: "[Storyboard] ⚠️ Gemini split returned empty or malformed scenes. Falling back to programmatic splitter.",
    vi: "[Storyboard] ⚠️ Phân chia câu thoại bằng Gemini bị trống hoặc lỗi. Tự động chuyển sang chia câu lập trình dự phòng.",
  },
  THUMBNAIL_CHAR_SUCCESS: {
    en: "[AI Service] ✅ Successfully applied character consistency to thumbnails!",
    vi: "[Trí tuệ nhân tạo] ✅ Đồng nhất nhân vật chính cho ảnh bìa thành công!",
  },
  STORYBOARD_CHAR_SUCCESS: {
    en: "[AI Service] ✅ Successfully applied character consistency to storyboard!",
    vi: "[Trí tuệ nhân tạo] ✅ Đồng nhất nhân vật chính cho kịch bản phân cảnh thành công!",
  },
  PROJECT_READ_ERR: {
    en: "Unable to read project list database (projects.json):",
    vi: "Không thể đọc dữ liệu danh sách dự án (projects.json):",
  },
  PROJECT_WRITE_ERR: {
    en: "Unable to write project list database (projects.json):",
    vi: "Không thể lưu dữ liệu danh sách dự án (projects.json):",
  },
  FETCH_VOICES_ERR: {
    en: "Error loading the available voices list from server:",
    vi: "Không thể tải danh sách giọng đọc từ máy chủ:",
  },

  TTS_API_ERROR_MSG: {
    en: "Speech service warning: {0}",
    vi: "Dịch vụ chuyển giọng nói cảnh báo: {0}",
  },
  TTS_NO_TASK_ID: {
    en: "Speech service could not create a process identifier (task_id): {0}",
    vi: "Dịch vụ giọng nói không tạo được mã tiến trình (task_id): {0}",
  },
  TTS_POLL_FAILED: {
    en: "Speech creation process was interrupted: {0}",
    vi: "Tiến trình tạo giọng nói bị gián đoạn: {0}",
  },
  TTS_TASK_ERROR_MSG: {
    en: "AI Voice Generation encountered an issue: {0}",
    vi: "Gặp lỗi trong quá trình tạo giọng nói AI: {0}",
  },
  TTS_TASK_TIMED_OUT: {
    en: "AI voice generation timed out. Please try again.",
    vi: "Hết thời gian chờ tạo giọng nói AI. Vui lòng thử lại.",
  },
  FAILED_DOWNLOAD_AUDIO: {
    en: "Unable to download the generated voice audio file.",
    vi: "Không thể tải về tệp âm thanh đã được tạo.",
  },

  GEMINI_START_ROTATION: {
    en: "[AI Service] Connecting to AI service. Rotating through {0} models, starting from index {1}.",
    vi: "[Trí tuệ nhân tạo] Bắt đầu kết nối dịch vụ AI. Hệ thống hỗ trợ xoay vòng qua {0} mô hình, bắt đầu từ mô hình {1}.",
  },
  GEMINI_CALLING_MODEL: {
    en: "[AI Service] Activating AI model {0}/{1}: {2} (Index: {3})",
    vi: "[Trí tuệ nhân tạo] Đang gọi mô hình AI vòng {0}/{1}: {2} (Vị trí: {3})",
  },
  GEMINI_SUCCESS: {
    en: "[AI Service] ✅ Successfully completed via model: {0} after {1} attempts.",
    vi: "[Trí tuệ nhân tạo] ✅ Gửi yêu cầu thành công tới mô hình AI: {0} (sau {1} lần thử).",
  },
  GEMINI_ERROR: {
    en: "[AI Service] ❌ Failed with model {0} (Attempt {1}): {2}",
    vi: "[Trí tuệ nhân tạo] ❌ Lỗi khi gửi yêu cầu tới mô hình AI {0} (Lần thử {1}): {2}",
  },
  GEMINI_UNSUPPORTED_FALLBACK: {
    en: "[AI Service] ⚠️ Model {0} is currently unavailable or exhausted. Auto-switching to next model...",
    vi: "[Trí tuệ nhân tạo] ⚠️ Mô hình AI {0} không phản hồi hoặc hết lượt dùng thử. Đang tự động chuyển sang mô hình tiếp theo...",
  },
  GEMINI_RETRYABLE_ERROR: {
    en: "[AI Service] ⏳ Connection issue. Retrying model {0} in {1}ms...",
    vi: "[Trí tuệ nhân tạo] ⏳ Gặp sự cố kết nối tạm thời. Đang thử lại mô hình {0} sau {1} mili-giây...",
  },
  GEMINI_MODEL_FAILED: {
    en: "[AI Service] 💀 Model {0} could not fulfill request. Skipping to next model...",
    vi: "[Trí tuệ nhân tạo] 💀 Mô hình AI {0} không thể hoàn thành yêu cầu. Đang bỏ qua và chuyển sang mô hình tiếp theo...",
  },
  GEMINI_COOLDOWN: {
    en: "[AI Service] ⏳ Cooldown active (2 seconds) before switching to next model...",
    vi: "[Trí tuệ nhân tạo] ⏳ Đang chờ 2 giây trước khi kết nối mô hình tiếp theo để tránh quá tải...",
  },
  GEMINI_ALL_FAILED: {
    en: "[AI Service] 🚨 Tested all {0} models but all connections timed out. Process halted.",
    vi: "[Trí tuệ nhân tạo] 🚨 Đã thử kết nối tất cả {0} mô hình AI nhưng đều không phản hồi! Tiến trình bị tạm dừng.",
  },
  GEMINI_SDK_NOT_INIT: {
    en: "GoogleGenAI Service has not been initialized properly.",
    vi: "Dịch vụ GoogleGenAI chưa được khởi tạo đúng cách.",
  },
  GEMINI_GENERATION_FAILED_ALL: {
    en: "AI generation failed across all fallback models.",
    vi: "Yêu cầu tạo nội dung thất bại trên tất cả mô hình AI dự phòng.",
  },

  GOOGLE_TTS_FALLBACK_SYNTHESIZING: {
    en: "[Speech Fallback] Synthesizing segment {0}/{1} ({2} characters)",
    vi: "[Hệ thống giọng nói dự phòng] Đang chuyển đổi đoạn hội thoại {0}/{1} (độ dài: {2} ký tự) thành giọng đọc...",
  },
  GOOGLE_TTS_FALLBACK_FETCH_FAILED: {
    en: "[Speech Fallback Warning] Failed to load segment {0}: {1}",
    vi: "[Hệ thống giọng nói dự phòng] Không thể tải đoạn hội thoại {0}: {1}",
  },
  GOOGLE_TTS_FALLBACK_CRITICAL: {
    en: "[Speech Fallback Critical] Permanent error on segment {0}",
    vi: "[Hệ thống giọng nói dự phòng] Gặp sự cố nghiêm trọng không thể khắc phục ở đoạn hội thoại {0}",
  },

  STYLE_EXTRACTION_ERROR: {
    en: "Error analyzing image style: {0}",
    vi: "Gặp lỗi khi phân tích phong cách hình ảnh: {0}",
  },
  BATCH_STYLE_REWRITE_FAILED_CHUNK: {
    en: "Bulk style sync failed for segment: {0}",
    vi: "Ghi đè phong cách hàng loạt thất bại cho phân đoạn: {0}",
  },
  REWRITE_PROMPTS_ERROR: {
    en: "Unable to rewrite visual prompts: {0}",
    vi: "Lỗi ghi đè mô tả hình ảnh (prompt): {0}",
  },
  BATCH_STYLE_REWRITE_FAILED_THUMBNAILS: {
    en: "Bulk style rewrite failed for thumbnails: {0}",
    vi: "Ghi đè phong cách hàng loạt thất bại cho ảnh thu nhỏ: {0}",
  },
  REWRITE_THUMBNAILS_ERROR: {
    en: "Thumbnail rewrite failed: {0}",
    vi: "Lỗi ghi đè ảnh thu nhỏ: {0}",
  },
  CHARACTER_ANALYSIS_ERROR: {
    en: "Character analysis error: {0}",
    vi: "Gặp lỗi khi phân tích đặc điểm nhân vật: {0}",
  },
  CHARACTER_EXTRACTION_ERROR: {
    en: "Failed to extract character attributes from description: {0}",
    vi: "Không thể nhận diện đặc điểm nhân vật từ mô tả: {0}",
  },
  BATCH_CHARACTER_REWRITE_FAILED_CHUNK: {
    en: "Bulk character update failed for segment: {0}",
    vi: "Ghi đè nhân vật hàng loạt thất bại cho phân đoạn: {0}",
  },
  REWRITE_PROMPTS_CHARACTER_ERROR: {
    en: "Failed to apply character attributes to visual prompts: {0}",
    vi: "Không thể áp dụng đặc điểm nhân vật vào các mô tả hình ảnh: {0}",
  },
  ERROR_GENERATING_HOOKS: {
    en: "Error in Hook multi-step flow: {0}",
    vi: "Gặp sự cố trong tiến trình tạo nội dung thu hút (Hook): {0}",
  },
  ERROR_REWRITING_SCRIPT: {
    en: "Unable to rewrite script: {0}",
    vi: "Không thể biên tập lại kịch bản: {0}",
  },
  DETAILED_PROMPT_ERROR: {
    en: "Error expanding visual prompt: {0}",
    vi: "Gặp lỗi khi mở rộng mô tả hình ảnh chi tiết: {0}",
  },
  ERROR_GENERATING_STORYBOARD_CHUNKING: {
    en: "Error partitioning script during storyboarding: {0}",
    vi: "Gặp sự cố khi xử lý chia nhỏ để dàn cảnh kịch bản: {0}",
  },
  ERROR_GENERATING_STORYBOARD_GEMINI: {
    en: "AI storyboard generation failed: {0}",
    vi: "Trí tuệ nhân tạo gặp sự cố khi dàn dựng phân cảnh kịch bản: {0}",
  },
  ERROR_GENERATING_SEO: {
    en: "Failed to generate SEO optimization package: {0}",
    vi: "Không thể tối ưu bộ thông tin SEO (Tiêu đề, Mô tả): {0}",
  },
  ERROR_GENERATING_THUMBNAILS_PROMPTS: {
    en: "Error creating thumbnail visual prompts: {0}",
    vi: "Gặp lỗi khi tạo mô tả ảnh thu nhỏ: {0}",
  },
  TTS_PIPELINE_ERROR: {
    en: "Speech pipeline issue: {0}",
    vi: "Đường ống xử lý giọng đọc gặp sự cố: {0}",
  },
  FAILED_RELOAD_PAGE_RETRY: {
    en: "Failed to reload page on retry: {0}",
    vi: "Tải lại trang thất bại khi thử lại: {0}",
  },
  LABS_SANDBOX_API_ERROR: {
    en: "[Labs Sandbox API Error] Connection issue: {0}",
    vi: "[Kết nối Google Labs] Gặp sự cố kết nối: {0}",
  },
  ERROR_READ_MERGED_AUDIO: {
    en: "Unable to read merged audio file: {0}",
    vi: "Không thể đọc dữ liệu âm thanh đã ghép: {0}",
  },
  ERROR_FFMPEG_MERGE: {
    en: "Audio merging error: {0}",
    vi: "Quá trình ghép trộn âm thanh gặp sự cố: {0}",
  },
  UNEXPECTED_ERROR_MERGE_AUDIO: {
    en: "Unexpected error during audio merging: {0}",
    vi: "Lỗi phát sinh ngoài dự kiến khi ghép âm thanh: {0}",
  },

  PLAYWRIGHT_TOKEN_CAPTURED: {
    en: "✅ Image creation account authenticated successfully!",
    vi: "✅ Đã kết nối và xác thực tài khoản sinh ảnh thành công!",
  },
  PLAYWRIGHT_CONNECT_ERR: {
    en: "❌ Connection error to visual generator:",
    vi: "❌ Lỗi kết nối đến công cụ hỗ trợ sinh ảnh:",
  },
  PLAYWRIGHT_CHROME_MANDATE: {
    en: "⚠️ PLEASE ENSURE THE BROWSER COMPONENT IS INITIATED BEFORE LAUNCHING SERVER:",
    vi: "⚠️ VUI LÒNG ĐẢM BẢO KHỞI ĐỘNG TRÌNH DUYỆT TRƯỚC KHI VẬN HÀNH HỆ THỐNG:",
  },
  PLAYWRIGHT_CHROME_COMMAND: {
    en: '👉 start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\chrome_debug_profile"',
    vi: '👉 start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\chrome_debug_profile"',
  },
  PLAYWRIGHT_CONNECTING: {
    en: "🔗 Connecting to browser visual generator...",
    vi: "🔗 Đang kết nối tới trình duyệt sinh ảnh...",
  },
  PLAYWRIGHT_ACCESSING_LABS: {
    en: "🌐 Accessing Google Labs library...",
    vi: "🌐 Đang truy cập thư viện tạo ảnh của Google Labs...",
  },
  PLAYWRIGHT_LOGIN_PROMPT: {
    en: "\n⚠️ [ATTENTION] Please log in to your Google account in the browser...",
    vi: "\n⚠️ [CHÚ Ý] Vui lòng đăng nhập tài khoản Google trên trình duyệt...",
  },
  PLAYWRIGHT_TOKEN_TIMEOUT: {
    en: "⏳ Authentication timed out.",
    vi: "⏳ Hết thời gian chờ đăng nhập tài khoản.",
  },
  PLAYWRIGHT_CONFIG_NEW: {
    en: "Applying visual synchronization profile...",
    vi: "Đang áp dụng cấu hình đồng bộ sinh ảnh mới...",
  },
  PLAYWRIGHT_CONFIG_SUCCESS: {
    en: "Visual profile sync successful!",
    vi: "Áp dụng cấu hình sinh ảnh thành công!",
  },
  PLAYWRIGHT_CONFIG_SKIP: {
    en: "Skipping automated configuration:",
    vi: "Bỏ qua cấu hình tự động:",
  },
  PLAYWRIGHT_INPUT_NOT_FOUND: {
    en: "Visual prompt input field could not be located.",
    vi: "Không tìm thấy vùng nhập dữ liệu mô tả hình ảnh",
  },
  PLAYWRIGHT_SUBMIT_NOT_FOUND: {
    en: "Image submission button could not be located.",
    vi: "Không tìm thấy nút Tạo ảnh",
  },
  PLAYWRIGHT_WAITING_GEN: {
    en: "⏱️ System is rendering and completing your image...",
    vi: "⏱️ Trình duyệt đang tiến hành vẽ và hoàn thiện hình ảnh...",
  },
  PLAYWRIGHT_DECODE_ERR: {
    en: "Error processing the retrieved image structure.",
    vi: "Gặp lỗi khi xử lý định dạng hình ảnh nhận được.",
  },
  PLAYWRIGHT_REDIRECT_LOG: {
    en: "🌐 Launching Project Flow: ",
    vi: "🌐 Đang mở tiến trình luồng dự án: ",
  },
  PLAYWRIGHT_INPUT_LOG: {
    en: "Visual Prompt: ",
    vi: "Mô tả hình ảnh: ",
  },
  PLAYWRIGHT_PASTE_LOG: {
    en: "Filling visual prompt into engine...",
    vi: "Đang điền mô tả hình ảnh vào hệ thống...",
  },
  PLAYWRIGHT_TYPE_LOG: {
    en: "Typing visual prompt into engine...",
    vi: "Đang điền mô tả hình ảnh vào hệ thống...",
  },
  PLAYWRIGHT_SUBMIT_LOG: {
    en: "👆 Submitting request to Google creative library...",
    vi: "👆 Đang gửi yêu cầu sinh ảnh đến hệ thống tạo ảnh của Google...",
  },
  PLAYWRIGHT_BASE64_SUCCESS: {
    en: "📸 Image synchronized and stored successfully!",
    vi: "📸 Đã lưu trữ và đồng bộ hình ảnh thành công!",
  },
  PLAYWRIGHT_REQUIRED: {
    en: "Visual engine activation required.",
    vi: "Yêu cầu kích hoạt trình duyệt sinh ảnh Playwright.",
  },
  PLAYWRIGHT_SANDBOX_ERR: {
    en: "Visual sandbox connection error.",
    vi: "Lỗi kết nối Sandbox.",
  },
  PLAYWRIGHT_RECAPTCHA: {
    en: "reCAPTCHA verification required on screen.",
    vi: "Yêu cầu xác minh reCAPTCHA trên màn hình trình duyệt.",
  },
  PLAYWRIGHT_REASON: {
    en: "Reason: ",
    vi: "Chi tiết: ",
  },

  CACHE_BYPASS: {
    en: "[Temporary Memory] Bypassing cached response for {0}",
    vi: "[Bộ nhớ tạm] Bỏ qua dữ liệu lưu trữ tạm thời theo yêu cầu cho {0}",
  },
  CACHE_HIT: {
    en: "[Temporary Memory] Restored previously processed data for {0}",
    vi: "[Bộ nhớ tạm] Đã khôi phục dữ liệu đã xử lý trước đó nhanh chóng cho {0}",
  },
  CACHE_EVICT: {
    en: "[Temporary Memory] Cleared expired storage for {0}",
    vi: "[Bộ nhớ tạm] Đang dọn dẹp dữ liệu lưu trữ đã hết hạn cho {0}",
  },
  CACHE_NEW: {
    en: "[Temporary Memory] Saved new results to speed up future sessions for {0}",
    vi: "[Bộ nhớ tạm] Đã lưu kết quả mới vào bộ nhớ tạm thời để tái sử dụng cho {0}",
  },
  CACHE_ERROR: {
    en: "[Temporary Memory Error] Failed to store result:",
    vi: "[Bộ nhớ tạm] Gặp lỗi khi lưu kết quả vào bộ nhớ tạm:",
  },

  JSON_PARSE_WARNING: {
    en: "Data structure parse failed. Activating automated recovery fallback: {0}",
    vi: "Không thể phân tích cấu hình dữ liệu nhận được. Hệ thống đang tự động khôi phục: {0}",
  },

  ERROR_LOADING_SANDBOX: {
    en: "Error loading local configuration:",
    vi: "Lỗi khi tải cấu hình môi trường:",
  },
  ERROR_SYNCING_SANDBOX: {
    en: "Error syncing local configuration:",
    vi: "Lỗi khi đồng bộ cấu hình môi trường:",
  },

  PREVIEW_PLAYBACK_FAILED: {
    en: "Unable to play audio preview:",
    vi: "Không thể phát thử bản ghi âm thanh này:",
  },
  PREVIEW_DSP_FAILED: {
    en: "Audio enhancement module issue. Activating raw audio fallback:",
    vi: "Bộ xử lý tối ưu âm thanh gặp sự cố, hệ thống tự động phát âm thanh gốc:",
  },
  CLOUD_PREVIEW_FAILED: {
    en: "Cloud rendering preview issue. Activating browser-side fallback:",
    vi: "Lấy bản thử từ máy chủ thất bại, đang chuyển sang xử lý trực tiếp trên trình duyệt:",
  },
  FAILED_LOAD_VOICES: {
    en: "Failed to load voices list from database",
    vi: "Không thể tải danh sách giọng đọc từ máy chủ",
  },
  FAILED_RESTORE_BLOB: {
    en: "Failed to restore audio structure",
    vi: "Không thể phục hồi tệp dữ liệu âm thanh",
  },
  FAILED_COPY_PROMPTS: {
    en: "Failed to copy visual prompts list:",
    vi: "Không thể sao chép danh sách mô tả hình ảnh:",
  },
  ERROR_READING_REF_IMAGES: {
    en: "Error reading visual style references",
    vi: "Không thể đọc các hình ảnh tham chiếu phong cách",
  },
  ERROR_READING_CHAR_IMAGES: {
    en: "Error reading character references",
    vi: "Không thể đọc hình ảnh đặc trưng nhân vật",
  },
  ERROR_READ_MATCHED_FILE: {
    en: "Error reading aligned metadata file: {0}",
    vi: "Không thể đọc tệp dữ liệu tương thích: {0}",
  },
  ERROR_READ_SEQ_FILE: {
    en: "Error reading sequential file structure: {0}",
    vi: "Không thể đọc tệp tin tuần tự: {0}",
  },
  ERROR_READ_THUMB_REF_IMAGES: {
    en: "Error reading thumbnail style references",
    vi: "Không thể đọc hình ảnh mẫu của ảnh thu nhỏ",
  },
  ERROR_RENDERING_SCENE_BATCH: {
    en: "Error during batch image creation for Scene {0}:",
    vi: "Gặp lỗi khi tạo hình ảnh cho phân cảnh {0} trong tiến trình hàng loạt:",
  },
  BATCH_GEN_FAILURE: {
    en: "Batch image creation was interrupted:",
    vi: "Tiến trình tạo ảnh hàng loạt gặp sự cố:",
  },
  ERROR_GEN_DETAILED_PROMPT: {
    en: "Error generating detailed visual description:",
    vi: "Gặp lỗi khi tạo mô tả hình ảnh chi tiết:",
  },
  SYNTHESIZE_ON_THE_FLY_FAILED: {
    en: "Real-time speech creation was interrupted:",
    vi: "Chuyển đổi giọng đọc tức thời gặp sự cố:",
  },
  UNIFIED_SCENE_VOICE_GEN_FAILED: {
    en: "Unified scene voice generation failed:",
    vi: "Tạo giọng đọc hợp nhất cho phân cảnh thất bại:",
  },
  UNIFIED_SEGMENT_VOICE_GEN_FAILED: {
    en: "Unified segment voice generation failed:",
    vi: "Tạo giọng đọc hợp nhất cho phân đoạn thất bại:",
  },
  OFFLINE_RENDERING_ERROR: {
    en: "Video export process was interrupted:",
    vi: "Quá trình xuất video (render) ngoại tuyến gặp lỗi:",
  },
  COVER_IMAGE_CANVAS_CAPTURE_FAILED: {
    en: "Thumbnail canvas capture failed. Applying automated graphic placeholder...",
    vi: "Chụp ảnh bìa từ trình duyệt gặp sự cố, hệ thống sử dụng ảnh thay thế",
  },
  FAILED_FETCH_SCENE_IMAGE: {
    en: "Failed to download image for Scene {0}:",
    vi: "Không thể tải hình ảnh cho phân cảnh {0}:",
  },
  IMAGE_UPLOAD_SUCCESS: {
    en: "Image uploaded and synced for Scene {0}!",
    vi: "Đã tải lên và áp dụng hình ảnh thành công cho phân cảnh {0}!",
  },
  CHUNK_RETRY_WARNING: {
    en: "[Segment {0}] Recoverable error (Attempt {1}/{2}). Retrying automatically...",
    vi: "[Phân đoạn {0}] Xử lý gặp lỗi nhẹ (Lần thử {1}/{2}). Đang tiến hành thử lại tự động...",
  },
  STYLE_EXTRACTION_ERR: {
    en: "Failed to analyze reference image style:",
    vi: "Không thể trích xuất phong cách hình ảnh mẫu:",
  },
  APPLY_STYLE_ERROR: {
    en: "Failed to apply visual style preset:",
    vi: "Không thể áp dụng phong cách hình ảnh mẫu:",
  },
  PROMPT_GEN_ERROR: {
    en: "Failed to create visual descriptions:",
    vi: "Không thể tạo mô tả hình ảnh:",
  },
  THUMBNAIL_PIPELINE_ERROR: {
    en: "Thumbnail design pipeline encountered an issue:",
    vi: "Quá trình thiết kế ảnh thu nhỏ gặp sự cố:",
  },
  VOICE_SYNTH_ERROR: {
    en: "AI voice creation encountered an issue:",
    vi: "Tiến trình tạo giọng nói AI gặp sự cố:",
  },
  ERROR_GENERATING_VOICEOVER: {
    en: "Voiceover script synthesis encountered an issue:",
    vi: "Quá trình lồng tiếng thuyết minh gặp sự cố:",
  },
  SEO_PIPELINE_ERROR: {
    en: "Search engine optimization pipeline issue:",
    vi: "Không thể tối ưu hóa SEO:",
  },
  STORYBOARD_PIPELINE_ERROR: {
    en: "Storyboard alignment pipeline issue:",
    vi: "Gặp sự cố khi xử lý phân cảnh:",
  },
  SCRIPT_PIPELINE_ERROR: {
    en: "Script rewriting pipeline issue:",
    vi: "Gặp sự cố khi biên tập kịch bản:",
  },

  ERROR_PARSING_SANDBOX_HEADER: {
    en: "Failed to parse system configurations in header bar:",
    vi: "Gặp lỗi khi phân tích cấu hình môi trường ở thanh tiêu đề:",
  },

  FAILED_FETCH_VOICES_REGISTRY: {
    en: "Failed to load voices library:",
    vi: "Không thể tải danh sách giọng nói từ thư viện:",
  },
  AUDIO_PLAYBACK_FAILED: {
    en: "Unable to play selected audio sample",
    vi: "Không thể phát thử tệp âm thanh này",
  },

  FAILED_RESUME_AUDIO_CONTEXT: {
    en: "Failed to resume audio drivers:",
    vi: "Không thể kích hoạt lại hệ thống âm thanh trình duyệt:",
  },
  AUDIO_CONTEXT_INIT_FAILED: {
    en: "Audio drivers not ready. Activating video-only recording:",
    vi: "Hệ thống âm thanh của trình duyệt chưa sẵn sàng, đang chuyển sang lưu trữ dạng chỉ có hình ảnh:",
  },

  SYSTEM_FLOW_ERROR: {
    en: "[System Issue] {0}:",
    vi: "[Hệ thống gặp sự cố] {0}:",
  },
  SYSTEM_ACTION_START: {
    en: "[System Action] {0}",
    vi: "[Hệ thống] {0}",
  },

  LOAD_CUSTOM_MODEL_ERR: {
    en: "Failed to retrieve the specialized AI models list:",
    vi: "Lỗi tải danh sách mô hình tùy chỉnh:",
  },

  ERROR_PARSING_PROJECTS: {
    en: "Failed to load existing projects structure:",
    vi: "Lỗi phân tích dữ liệu danh sách dự án:",
  },
  ERROR_FETCHING_PROJECTS: {
    en: "Failed to fetch project files from storage:",
    vi: "Lỗi khi lấy danh sách dự án từ cơ sở dữ liệu:",
  },
  ERROR_CREATING_PROJECT: {
    en: "Failed to write new project file to storage:",
    vi: "Lỗi khi tạo dự án mới trong cơ sở dữ liệu:",
  },
  ERROR_AUTO_SAVING_PROJECT: {
    en: "Automated project backup failed:",
    vi: "Lỗi khi tự động lưu dự án:",
  },
  ERROR_DELETING_PROJECT: {
    en: "Failed to remove project file:",
    vi: "Lỗi khi xóa dự án:",
  },
  ERROR_UPDATING_PROJECT: {
    en: "Failed to sync changes to project file:",
    vi: "Lỗi khi cập nhật dự án:",
  },

  SERVER_RUNNING: {
    en: "Server running at http://localhost:{0}",
    vi: "Hệ thống đã khởi động thành công và sẵn sàng tại http://localhost:{0}",
  },
  SERVER_START_ERROR: {
    en: "Server failed to initiate:",
    vi: "Khởi động hệ thống thất bại:",
  },
  PLAYWRIGHT_CLEANING: {
    en: "Closing visual creator processes...",
    vi: "Đang dọn dẹp các tiến trình trình duyệt sinh ảnh...",
  },

  GENERAL_ERROR: {
    en: "Error: {0}",
    vi: "Gặp sự cố: {0}",
  },
  GENERAL_SUCCESS: {
    en: "Success: {0}",
    vi: "Thành công: {0}",
  },
  GOOGLE_TTS_FAILED: {
    en: "Google TTS failed for chunk: {0}",
    vi: "Chuyển đổi Google TTS thất bại cho phân đoạn: {0}",
  },
  PLAYWRIGHT_BORDER: {
    en: "\n=======================================================",
    vi: "\n=======================================================",
  },
  PLAYWRIGHT_BORDER_BOTTOM: {
    en: "=======================================================\n",
    vi: "=======================================================\n",
  },
};

export type LogKey = keyof typeof LOG_DICTIONARY;

export const VOICE_ALIGN_LOGS = {
  ALIGN_SUCCESS: "[Whisper Alignment] ✅ Đồng bộ thành công:",
  ALIGN_FAILED: "[Whisper Alignment] ❌ Đồng bộ thất bại:",
  CHECK_WHISPER: "Checking if openai-whisper is installed...",
  WHISPER_NOT_INSTALLED: "openai-whisper is not installed. Attempting to install automatically via pip...",
  WHISPER_INSTALL_SUCCESS: "Successfully installed openai-whisper. Running voice aligner...",
  WHISPER_ALREADY_INSTALLED: "openai-whisper is already installed. Running voice aligner...",
  ERR_DELETE_TEMP_FILES: "Error deleting temp files",
  ERR_UNEXPECTED_ALIGN: "UNEXPECTED_ERROR_ALIGN_VOICE",
  ERR_RUNNING_SCRIPT: "Error running python_scripts/voice_aligner.py: ",
  FFMPEG_REQUIRED: "ffmpeg is required for alignment.",
  PYTHON_STDOUT: "Python script stdout: ",
  PYTHON_STDERR: "Python script stderr: ",
};
