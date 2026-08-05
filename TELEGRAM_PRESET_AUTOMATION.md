# Telegram + preset tự động hóa

## Preset là gì?

Preset lưu toàn bộ thiết lập sản xuất đang dùng ở tab Tạo tự động hoặc Tạo từng bước: cách xử lý nội dung, chia cảnh, phong cách, nhân vật, tỷ lệ, nền tảng/model tạo media, số luồng, voice, SEO, watermark và cấu hình render. Preset không lưu nội dung, thư mục dự án, API key hay hồ sơ Chrome.

## Cách thiết lập

1. Mở `Tạo Video Tự Động` hoặc `Tạo Video Từng Bước` và cấu hình hoàn chỉnh theo kênh/chủ đề.
2. Mở `Lên lịch đăng từ Telegram`.
3. Đặt tên rồi chọn `Lưu setup hiện tại`.
4. Tạo bot bằng `@BotFather`, lấy Bot Token và Chat ID.
5. Chọn preset mặc định, bật nhận lệnh, lưu kết nối và bấm gửi thử.

## Lên lịch trực tiếp trong tool

1. Chọn loại đầu vào: link, mô tả/ý tưởng hoặc kịch bản.
2. Chọn preset đã lưu.
3. Chọn ngày giờ bắt đầu tạo video (để trống nếu chạy ngay).
4. Chọn riêng ngày giờ đăng và một hoặc nhiều nền tảng.
5. Bấm `Lưu lịch sản xuất`.

## Gửi yêu cầu qua Telegram Bot

- Gửi `/new` để mở quy trình có hướng dẫn.
- Bot hỏi lần lượt: loại nội dung → nội dung → preset → giờ tạo → nền tảng → giờ đăng.
- Có thể chọn chỉ tạo video mà không tự đăng.
- Lệnh cũ `/schedule YYYY-MM-DD HH:mm` vẫn được hỗ trợ để tạo nhanh.

Desktop VidiFlow phải đang mở khi đến giờ chạy. Nếu đóng tool, job vẫn được lưu và sẽ được nhận khi mở lại.

## Kết nối tự đăng video

Mở phần `Kết nối tự đăng video` và nhập thông tin do ứng dụng chính thức của từng nền tảng cấp:

- YouTube: OAuth Client ID, Client Secret và Refresh Token có scope tải video.
- Facebook: Page ID và Page Access Token có quyền đăng video lên Trang.
- TikTok: Access Token của ứng dụng đã được duyệt quyền `video.publish`.

Sau khi render xong, VidiFlow lưu đường dẫn MP4 vào job. Worker đăng video sẽ chờ đúng giờ đăng, đăng lần lượt lên các nền tảng đã chọn, lưu ID/URL hoặc lỗi của từng nền tảng và gửi kết quả về Telegram. Khi chưa có quyền API hợp lệ, tác vụ tạo video vẫn hoàn tất nhưng phần đăng sẽ báo lỗi rõ ràng.

Lưu ý: YouTube/TikTok có thể giới hạn video ở chế độ riêng tư khi ứng dụng OAuth chưa được kiểm duyệt. Facebook chỉ đăng lên Page đã cấp quyền; không dùng tự động hóa trình duyệt để lách quyền nền tảng.
