# VidiFlow OneClick Studio

VidiFlow là ứng dụng desktop Windows hỗ trợ xây dựng video AI theo một quy trình thống nhất: chuẩn hóa kịch bản, chia cảnh, tạo media, tạo voice, SEO/thumbnail, render và chuẩn bị đăng lên mạng xã hội.

Phiên bản hiện tại: **2.3.0**

## Tính năng chính

- Hai luồng sản xuất: tự động hoàn chỉnh và kiểm tra từng bước.
- Tạo ảnh/video qua Gemini, Google Labs/Flow và API Flow.
- Ảnh tham chiếu, hồ sơ nhân vật và khóa nhận diện xuyên cảnh.
- Tạo voice, cắt lời thoại, phụ đề, nhạc nền, chuyển cảnh và render FFmpeg.
- Tạo tiêu đề, mô tả, thẻ SEO và thumbnail.
- Preset sản xuất, lịch trong tool, Telegram Bot và hàng đợi tác vụ.
- Hồ sơ Chrome riêng cho Facebook, YouTube và TikTok.
- Khôi phục dự án, chạy tiếp tác vụ dừng và tạo lại media thiếu/lỗi.
- Xuất CapCut/Premiere và các công cụ đồng bộ timeline.

## Yêu cầu phát triển

- Windows 10/11 x64.
- Node.js 22 LTS trở lên.
- FFmpeg và các runtime bổ sung nếu chạy trực tiếp từ source.
- API key/dịch vụ AI hợp lệ cho chức năng được chọn.

Bản desktop phát hành cho khách hàng đóng gói runtime cần thiết; người dùng cuối không cần cài môi trường phát triển.

## Chạy source

1. Cài dependency:

   ```powershell
   npm install
   ```

2. Sao chép `.env.example` thành `.env` và điền cấu hình riêng.

3. Khởi động:

   ```powershell
   npm run dev
   ```

4. Mở `http://127.0.0.1:3105`.

Không commit `.env`, API key, token Telegram, cookie hoặc dữ liệu đăng nhập Chrome.

## Kiểm tra chất lượng

```powershell
npm run lint
npm test
npm run qa:presets
npm run build
npm run release:preflight
```

`release:preflight` kiểm tra đồng bộ phiên bản, TypeScript, test bảo mật, QA preset, dependency audit và production build.

## Đóng gói Windows

Electron là định dạng phát hành chính:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File packaging/build_electron_desktop.ps1
```

Mỗi release phải có:

- Bộ cài/portable đúng phiên bản.
- File SHA-256.
- Release manifest.
- Changelog tương ứng.
- Chữ ký Authenticode khi phát hành chính thức cho khách hàng.

Nuitka chỉ được giữ làm launcher legacy và có hậu tố `-legacy-nuitka`; không được ghi đè artifact Electron.

## An toàn dữ liệu

- API chỉ chấp nhận yêu cầu hợp lệ từ giao diện local.
- Endpoint preview chỉ phục vụ media cho phép.
- Ảnh tham chiếu được kiểm tra loại file, chữ ký và giới hạn dung lượng.
- Preset, project và hồ sơ trình duyệt của khách hàng không được đưa vào Git.
- Luôn backup branch/tag trước thay đổi lớn và kiểm tra khả năng khôi phục.

## Nhánh phát triển

- `main`: bản ổn định đã duyệt.
- `codex/backup-*`: snapshot chỉ dùng để khôi phục.
- `codex/professional-upgrade-*`: nhánh nâng cấp đang kiểm thử.

Xem lịch sử thay đổi tại [CHANGELOG.md](CHANGELOG.md).
