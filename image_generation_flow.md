# Tài liệu Trích xuất Luồng Tạo Ảnh / Video Tự Động

Tài liệu này phân tích chi tiết quy trình tạo ảnh/video (còn gọi là quá trình render ở "node_2") sử dụng **Playwright** để điều khiển trình duyệt truy cập vào **Google Labs** và **Gemini Chat**. Mục đích của tài liệu là giúp bạn có thể nắm bắt luồng, các biến cấu hình, và cách mang đoạn code này ra chạy độc lập ở bất kỳ dự án Node.js nào khác.

---

## 1. Yêu Cầu Để Chạy Độc Lập

Để chạy được quy trình này bên ngoài dự án gốc, bạn cần:
1. **Môi trường:** Node.js (khuyến nghị phiên bản 18+).
2. **Thư viện NPM:**
   - `playwright` và `playwright-extra`
   - `puppeteer-extra-plugin-stealth` (để tránh bị Google phát hiện là bot).
   - `lodash` (cho một số hàm tiện ích).
3. **Trình duyệt Google Chrome:** 
   - Hệ thống không dùng trình duyệt ẩn danh hoàn toàn (headless chromium mặc định) mà sẽ **kết nối vào một Chrome thực** đang chạy ở chế độ gỡ lỗi (Debugging mode).
   - Câu lệnh khởi chạy Chrome (trên Windows):
     ```cmd
     start chrome.exe --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="C:\chrome_debug_profile"
     ```
   - **Quan trọng:** Bạn phải đăng nhập sẵn tài khoản Google trên cửa sổ Chrome này.

---

## 2. Các Biến Cấu Hình (Khai Biến & Config)

Trong hệ thống gốc, các URL và regex được định nghĩa ở thư mục `constants`. Nếu tách ra, bạn cần cấu hình các giá trị sau:

### Biến Môi Trường / URL
```javascript
const EXTERNAL_URLS = {
  GEMINI_CHAT: "https://gemini.google.com/app",
  GOOGLE_LABS: "https://labs.google",
  GOOGLE_LABS_FLOW: "https://labs.google/workspace/image",
  PLAYWRIGHT_CDP: "http://127.0.0.1:9222", // Port gỡ lỗi của Chrome
};
```

### Các Selector và Regex
Hệ thống nhận diện giao diện dựa vào văn bản hiển thị trên nút bấm (chạy đa ngôn ngữ nhưng ưu tiên tiếng Anh/Việt tuỳ cài đặt).

```javascript
// Cho Google Labs
const SELECTOR_INPUT = '[contenteditable="true"]';
const PLAYWRIGHT_SUBMIT_ICON_REGEX = /creation/i;
const PLAYWRIGHT_SUBMIT_TEXT_REGEX = /Generate/i;

// Regex cho cấu hình Labs (Hình ảnh / Video)
const IMAGE_GEN_VIDEO_SECTION_REGEX = /Video/i;
const IMAGE_GEN_IMAGE_SECTION_REGEX = /Image/i;
const IMAGE_GEN_SAVE_BTN_REGEX = /Save/i;

// Engine Regex
const IMAGE_GEN_IMAGEN_EXACT_REGEX = /Imagen/i;
const IMAGE_GEN_VEO_EXACT_REGEX = /Veo/i;
const IMAGE_GEN_LABS_EXACT_REGEX = /Labs Sandbox/i;

// Cho Gemini Chat
const GeminiChatSelector = {
  Input: "div[contenteditable='true']",
  InputTextarea: "div[contenteditable='true']",
  SendButton: "button[aria-label='Send message']",
  ModelPickerButton: "button[aria-label*='model']", // Cần thay đổi theo UI của Gemini hiện tại
  MenuOptions: "[role='menuitem']",
  PlusButton: "button[aria-label='Create']"
};
```

---

## 3. Luồng Khởi Tạo Playwright (`initPlaywright`)

Trước khi tạo ảnh, tool sẽ kết nối vào trình duyệt Chrome.

1. **Kết nối qua CDP (Chrome DevTools Protocol):**
   ```javascript
   const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
   const ctx = browser.contexts()[0];
   const page = ctx.pages()[0] || (await ctx.newPage());
   ```
2. **Bơm Script (`__getImgId`):**
   - Để chặn và bắt lấy ID hoặc URL của hình ảnh trả về (nhằm so sánh xem đó là ảnh cũ hay ảnh mới vừa được tạo ra), tool sử dụng `page.addInitScript`.
   - Hàm này chặn thuộc tính `src` để lấy ID gốc bỏ qua tham số xác thực (`token`, `sig`).
3. **Đánh cắp Bearer Token:**
   - Tool giám sát các network requests (qua `page.on("request")`) khi truy cập `labs.google`.
   - Nếu phát hiện header `authorization` gọi đến `aisandbox-pa.googleapis.com`, nó sẽ lưu lại Bearer Token.

---

## 4. Luồng Tạo Ảnh Bằng Google Labs (`generateImageWithPlaywright`)

Luồng này thường dùng cho **Image** thông thường bằng Imagen hoặc Veo trên Labs.

### Bước 1: Điều hướng & Gõ Text
- Tool truy cập vào `https://labs.google/workspace/image/{projectId}`.
- Nó kiểm tra ô nhập prompt `[contenteditable="true"]`.
- Thay vì dán (paste) trực tiếp có thể bị chặn, tool sử dụng hàm `humanType` (gõ từng chữ cái kèm theo độ trễ ngẫu nhiên) và `smoothMouseMove` (di chuột zic-zắc) để mô phỏng người dùng thật.

### Bước 2: Cấu hình Khung Hình (Aspect Ratio) & Engine
- Tool ấn vào biểu tượng bánh răng (`tune`).
- Bấm chọn tab `Image` hoặc `Video`.
- Tìm và bấm vào tỉ lệ khung hình (VD: `16:9`, `1:1`).
- Tìm dropdown chọn Engine và so sánh với `IMAGE_GEN_VEO_EXACT_REGEX` hoặc `IMAGE_GEN_IMAGEN_EXACT_REGEX` để chuyển đổi mô hình (Veo3 hoặc Imagen). Sau đó ấn `Save`.

### Bước 3: Thu thập Danh sách Ảnh cũ
- Trước khi nhấn nút "Generate", tool chạy script `document.querySelectorAll("img")` để ghi lại mảng các `ID` của những bức ảnh hiện đang có trên màn hình. (Giúp phân biệt với ảnh sắp được sinh ra).

### Bước 4: Nhấn Generate & Trích xuất Base64
- Tool tìm nút bấm có chữ "Generate" và biểu tượng "creation". Đợi nút sáng lên rồi ấn click.
- Dùng `waitForFunction` để lặp lại việc kiểm tra ảnh trên trang (`DOM polling`):
  - Nó tìm một thẻ `<img>` mới có `src` bắt đầu bằng `getMediaUrlRedirect`.
  - ID của ảnh mới này phải **không nằm trong mảng ID ảnh cũ**.
- Khi ảnh mới được tải xong (`naturalWidth > 0`), tool tạo một thẻ `<canvas>` ảo dưới client, vẽ bức ảnh đó vào và dùng `canvas.toDataURL("image/jpeg")` để trả về chuỗi Base64.

---

## 5. Luồng Tạo Ảnh Bằng Gemini Chat (`generateImageWithGeminiChat`)

Luồng này hỗ trợ xử lý hàng loạt (Batch) bằng cách mở nhiều tab.

### Bước 1: Điều hướng & Cấu Hình Model
- Tool vào `https://gemini.google.com/app`.
- Kiểm tra nút chọn Model (Góc trên trái) để chuyển sang `Gemini Advanced (Pro)` hoặc `Flash` / `Flash Lite`.

### Bước 2: Nhập Prompt & Gửi Lệnh
- Tìm vùng chứa text `div[contenteditable='true']`.
- Tùy chọn `visualConfig.promptInputMethod`: 
  - Nếu là `Type`: Gõ từng ký tự.
  - Nếu là `Paste`: Trình duyệt sẽ được cấp quyền `clipboard-read/write` qua `context.grantPermissions`, sau đó dùng `navigator.clipboard.writeText(text)` và giả lập ấn phím `Ctrl + V`.
- Lưu lại số lượng thẻ `<model-response>` hiện có trên màn hình trước khi gửi (`initialResponseCount`).
- Click nút Send hoặc ấn phím `Enter`.

### Bước 3: Đợi & Trích xuất Ảnh/Video từ Gemini
- Tool đợi xuất hiện một `<model-response>` mới (`currentCount > initialResponseCount`).
- Đợi hiệu ứng loading mất đi (`aria-busy="false"` và `thinking-overlay` bị detached).
- Chờ container hiển thị: `.attachment-container.generated-images` hoặc `download-generated-image-button`.
- Tìm thẻ `<img>` hoặc `<video>` bên trong kết quả trả về.
  - **Với Ảnh:** Lấy URL blob, dùng `fetch()` lấy blob data sau đó đẩy qua `FileReader` để đọc thành chuỗi Base64 `data:image/jpeg;base64,...`.
  - **Với Video:** Xử lý tương tự hoặc trả về trực tiếp fallback URL.

---

## 6. Xử lý Hàng Loạt (Batch Processing)

Hệ thống cung cấp hàm `generateBatchImagesWithGeminiChat`:
- **Concurrency (Đồng thời):** Dựa vào tốc độ (`GeminiChatSpeed.Fast` / `Slow`), nó sẽ mở từ `1` đến `5` tab (`context.newPage()`) chạy song song cùng lúc.
- **Queue (Hàng đợi):** Có một vòng lặp `while (queue.length > 0)` và các `workers` để lần lượt lấy Prompt ra khỏi hàng đợi gửi vào các tab.
- **Error Handling:** Nếu tab bị crash (liên tục 2 lần lỗi), nó sẽ ép tải lại tab mới (Force New Room) để tránh bị chặn.
- Giữa các lần gửi, có `randomDelay` (Spam prevention delay) để tránh Google rate-limit.

---

## 7. Tổng kết

Để xây dựng lại một tool tạo ảnh hoàn toàn tách biệt:
1. Bạn chỉ cần file `playwrightCtx.ts` để móc vào Chrome.
2. Thiết lập đối tượng cấu hình (`visualConfig`) gồm: `aspectRatio`, `generateType` (Image/Video), `imageGeneratorEngine` (Veo3/Imagen/Labs).
3. Truyền Prompt của bạn vào một hàm rút gọn như mô tả ở luồng 4 hoặc 5.
4. Nhận lại chuỗi **Base64** và lưu thành file `.jpg` / `.mp4` ở local của bạn.
