# Changelog

Các thay đổi đáng chú ý của VidiFlow được ghi theo phiên bản phát hành.

## 2.3.1 — 2026-08-30

### Thương mại hóa và hỗ trợ

- Thêm phân quyền tính năng theo gói Starter, Pro, Agency và Lifetime.
- Thêm Trung tâm hỗ trợ, backup/restore cấu hình theo allowlist và hàng đợi chẩn đoán cục bộ.
- Thêm giao diện khôi phục lỗi React, mã sự cố và thao tác gửi báo cáo do người dùng chủ động.
- Tách các route hỗ trợ nội bộ khỏi server chính; không đưa credential hoặc truyền dữ liệu từ xa vào router này.
- Thêm `X-Request-ID` và xử lý lỗi API tập trung, không trả chi tiết nội bộ nhạy cảm cho giao diện.

### Phát hành

- Bổ sung EULA, Privacy Notice, thông báo thành phần bên thứ ba và kiểm tra chữ ký cập nhật.
- Mở rộng unit test, preset QA và smoke QA cho luồng hỗ trợ/backup.
## 2.3.0 — 2026-08-22

### Hiệu năng và giao diện

- Tách tải các màn hình lớn theo nhu cầu; giảm bundle khởi động chính hơn 50%.
- Thêm trạng thái tải an toàn khi mở module chuyên sâu.
- Thống nhất tiến độ trang kết quả với các mốc của Auto Pipeline.
- Phân biệt preset đang áp dụng với preset chỉ xem trước.
- Tự nhận dạng link, ý tưởng hoặc kịch bản trong lịch sản xuất.
- Giải thích rõ điều kiện mở khóa Bước 2–4.
- Thu gọn cụm hỗ trợ nổi thành dock ở góc dưới.

### Bảo mật

- Chỉ cho API local nhận Host/Origin/Sec-Fetch-Site hợp lệ.
- Chặn preview file không phải media.
- Giới hạn ảnh tham chiếu 25 MB và kiểm tra chữ ký PNG/JPEG/WebP.
- Chuẩn hóa lỗi upload quá lớn thành JSON HTTP 413.
- Vá dependency và đưa npm audit về 0 lỗ hổng đã biết.

### Độ ổn định và phát hành

- Đồng bộ mặc định API Flow ở 7 luồng.
- Thêm test tự động cho lớp bảo vệ API local.
- Thêm quality gate: TypeScript, test, QA preset, audit và production build.
- Thêm GitHub Actions cho main và codex/**.
- Chuẩn hóa Electron thành artifact phát hành chính.
- Sinh SHA-256 và release manifest; hỗ trợ bắt buộc Authenticode.
- Tách tên launcher Nuitka legacy để không ghi đè bộ cài chính.

## 2.2.7

- Hoàn thiện workflow watermark, thumbnail có text và lưu project.
- Bổ sung preset Telegram, tự đăng và hồ sơ Chrome Publisher.
- Cải thiện resume task, retry media và đồng bộ kịch bản/prompt.

## 2.2.1

- Cải thiện retry Flow/Gemini/API và tính ổn định khi tạo media.
- Đồng bộ ảnh tham chiếu theo đúng nhân vật.
- Sửa voice dung lượng lớn, đường dẫn tiếng Việt và khớp media.
- Cải thiện lưu/tải dự án và bản desktop đầy đủ runtime.
