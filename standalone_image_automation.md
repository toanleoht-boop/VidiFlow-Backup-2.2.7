# Hướng dẫn A-Z: Tự động hóa tạo ảnh qua Playwright (Standalone)

Tài liệu này hướng dẫn chi tiết cách tách tính năng **Tự động hóa vẽ ảnh (Automation Image Generation)** ra một file độc lập. Bạn có thể mang file này qua bất kỳ Project, Tool hay ngôn ngữ (Node.js) nào khác và nó vẫn sẽ hoạt động trơn tru.

Nguyên lý hoạt động:
1. Khởi chạy Google Chrome thực tế của bạn có mở cổng gỡ lỗi (Remote Debugging Port).
2. Bạn tự đăng nhập tài khoản Google (chỉ cần làm 1 lần, Chrome sẽ lưu lại session).
3. Playwright kết nối vào Chrome đó, điều khiển truy cập trang Gemini, điền Prompt, bấm Generate.
4. Đợi Gemini vẽ xong, Playwright trích xuất ảnh bằng Canvas và trả về định dạng Base64.

---

## Bước 1: Cài đặt thư viện cần thiết

Trong thư mục dự án mới của bạn, hãy cài đặt Playwright:
```bash
npm init -y
npm install playwright
```

---

## Bước 2: Khởi chạy Chrome với Remote Debugging

Để Playwright có thể điều khiển trình duyệt đang có sẵn tài khoản Google của bạn (tránh việc mỗi lần chạy lại bắt đăng nhập), bạn **phải tắt toàn bộ Chrome hiện tại** và khởi chạy bằng lệnh sau trong Command Prompt (CMD) hoặc PowerShell:

**Trên Windows:**
```powershell
start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\chrome_debug_profile"
```

**Trên Mac/Linux:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome_debug_profile"
```
*(Lưu ý: Bạn có thể đổi đường dẫn `C:\chrome_debug_profile` thành bất kỳ thư mục nào bạn muốn để lưu lịch sử và session)*

---

## Bước 3: Đăng nhập (Chỉ làm 1 lần)

1. Sau khi chạy lệnh trên, một cửa sổ Chrome mới sẽ hiện lên.
2. Bạn hãy tự tay truy cập vào `https://gemini.google.com/` và tiến hành đăng nhập tài khoản Google.
3. Giữ nguyên trình duyệt này. Từ nay về sau, các đoạn code tự động hóa sẽ "bám" vào cửa sổ này để chạy.

---

## Bước 4: Code Node.js Độc Lập (Standalone Script)

Tạo một file tên là `generate-image.js` và dán toàn bộ đoạn code dưới đây vào. Đoạn code này đã được tối ưu để hoạt động độc lập (không phụ thuộc vào backend cũ):

```javascript
const { chromium } = require('playwright');
const fs = require('fs');

// Cổng mà Chrome đang mở (cấu hình ở Bước 2)
const CDP_URL = 'http://127.0.0.1:9222';
const GEMINI_URL = 'https://gemini.google.com/app';

// Các hàm tiện ích delay
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function generateImageStandalone(prompt) {
    let browser;
    try {
        console.log("🔗 Đang kết nối tới Chrome (CDP)...");
        browser = await chromium.connectOverCDP(CDP_URL);
        
        // Lấy context và page hiện tại
        const context = browser.contexts()[0];
        const page = context.pages().find(p => p.url().includes('gemini.google.com')) 
                     || await context.newPage();

        if (!page.url().includes('gemini.google.com')) {
            console.log("🌐 Đang truy cập Gemini...");
            await page.goto(GEMINI_URL, { waitUntil: 'domcontentloaded' });
        }

        console.log("✍️ Đang nhập prompt: ", prompt);
        
        // 1. Tìm thanh nhập liệu
        const inputSelector = 'div.ql-editor[contenteditable="true"]';
        const inputLoc = page.locator(inputSelector).first();
        await inputLoc.waitFor({ state: "visible", timeout: 30000 });
        
        // Xóa text cũ (nếu có) và nhập prompt mới
        await inputLoc.fill("");
        await delay(500);
        await inputLoc.fill(prompt);
        await delay(1000);

        // Đếm số lượng tin nhắn trước khi gửi (để biết khi nào có tin nhắn mới)
        const initialResponseCount = await page.locator("model-response").count();

        // 2. Tìm và bấm nút Send
        const sendBtnSelector = 'button[aria-label*="Gửi"], button[aria-label*="Send"], gem-icon-button.send-button button';
        const sendBtn = page.locator(sendBtnSelector).first();
        
        if (await sendBtn.isVisible() && !(await sendBtn.isDisabled())) {
            await sendBtn.click();
        } else {
            // Backup: Nhấn phím Enter
            await page.keyboard.press("Enter");
        }
        
        console.log("⏳ Đang chờ Gemini sinh ảnh (có thể mất 15-45 giây)...");

        // 3. Đợi Gemini render xong ảnh (đợi model-response mới xuất hiện)
        await page.waitForFunction((expectedCount) => {
            return document.querySelectorAll("model-response").length > expectedCount;
        }, initialResponseCount, { timeout: 60000 });

        // Đợi logo "Thinking" biến mất
        try {
            await page.locator("thinking-overlay").waitFor({ state: "detached", timeout: 30000 });
        } catch(e) {}

        const latestResponse = page.locator("model-response").last();
        await latestResponse.waitFor({ state: "visible", timeout: 30000 });

        // Đợi thẻ ảnh <img> xuất hiện bên trong tin nhắn mới
        const mediaLoc = latestResponse.locator("img").first();
        await mediaLoc.waitFor({ state: "visible", timeout: 30000 });

        console.log("📥 Đang tải và chuyển đổi ảnh thành Base64...");

        // 4. Trích xuất ảnh bằng Canvas (Cách hack để lấy data từ thẻ <img> có src blob)
        const base64Data = await mediaLoc.evaluate(async (imgEl) => {
            const img = imgEl;
            // Đợi ảnh load hoàn toàn
            if (!img.complete || img.naturalWidth === 0) {
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    setTimeout(reject, 15000);
                });
            }
            // Vẽ ảnh lên Canvas để lấy base64
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
        });

        console.log("✅ Hoàn thành sinh ảnh!");
        return base64Data;

    } catch (error) {
        console.error("❌ Lỗi trong quá trình Automation:", error);
        return null;
    } finally {
        if (browser) {
            // Chú ý: Disconnect thay vì close() để Chrome không bị tắt
            await browser.disconnect(); 
        }
    }
}

// Chạy thử Script
(async () => {
    const myPrompt = "Generate a hyper-realistic cinematic photo of a cyberpunk city at night with neon lights";
    const base64Image = await generateImageStandalone(myPrompt);
    
    if (base64Image) {
        // Lưu Base64 thành file jpg để xem kết quả
        fs.writeFileSync("output_image.jpg", Buffer.from(base64Image, 'base64'));
        console.log("🎉 Đã lưu ảnh thành công vào file 'output_image.jpg'");
    }
})();
```

---

## Bước 5: Cách chạy Script

Mở Terminal / CMD lên và gõ:

```bash
node generate-image.js
```

**Kết quả:**
Trình duyệt Chrome mà bạn mở ở Bước 2 sẽ tự động chuyển sang thẻ Gemini, tự động nhập text: *"Generate a hyper-realistic cinematic photo..."*, tự động chờ nó vẽ xong, và script Node.js của bạn sẽ lưu kết quả ra file `output_image.jpg` ngay trên máy bạn.

Quy trình này **hoàn toàn độc lập** và bạn có thể dễ dàng nhúng (import) hàm `generateImageStandalone` vào bất kỳ Tool backend nào khác của mình!
