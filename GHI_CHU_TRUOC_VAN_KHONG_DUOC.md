# Mốc yêu cầu trước “Vẫn không được là sao”

Tài liệu này ghi lại phạm vi đã thống nhất và triển khai trước thời điểm yêu cầu: **“Vẫn không được là sao”**. Dùng làm mốc để khôi phục và phát triển tiếp, không bao gồm các thử nghiệm sau mốc đó về Python/PowerShell, nhập đường dẫn thủ công, landing page hay khởi động lại server.

## Mục tiêu sản phẩm

- Tool VidiFlow OneClick Content Studio tạo video AI theo luồng tự động hoặc từng bước.
- Giao diện cần lớn, rõ, hiện đại; chữ, thẻ và nút không quá nhỏ.
- Cấu trúc ưu tiên: sidebar tối, header thẳng hàng, khu vực nội dung sáng và các card có khoảng thở.
- Ẩn phần điều hướng **BIÊN TẬP NỘI DUNG** không cần thiết.

## Giao diện đã chốt

- Header và sidebar được căn cùng một chiều cao; không còn dải trống/lệch hàng giữa hai phần.
- Dark mode được chỉnh lại để tránh lỗi hiển thị.
- Bố cục **Tạo Video Tự Động** gồm các tab:
  1. Nội dung
  2. Phong cách & nhân vật
  3. Ảnh / Video
  4. Giọng đọc
  5. Tiêu đề & Đăng tải
  6. Video đầu ra
- Khu vực Tiêu đề & Đăng tải được bố trí lại thành hàng thẳng, rõ nhãn và không còn Tracklist ở phần đăng tải.
- Phần mốc chương/tracklist được bỏ khỏi giao diện đăng tải.
- Khối Giọng Premium và Voice tạo sẵn được trình bày lớn, dễ thao tác.

## API, liên hệ và tên hiển thị

- Nền tảng tạo có lựa chọn **API Flow — Liên hệ Admin để mua key**.
- Tên hiển thị trong Cài đặt:
  - `AI_33_API_KEY` → **API Voice Premium**
  - `VIETTHEO_API_KEY` → **API Flow**
- Có khối liên hệ chung trong Cài đặt: **Liên hệ Admin để mua API Flow**.
  - Facebook: https://www.facebook.com/me/
  - Zalo: 0976293994 / https://zalo.me/0976293994
  - Telegram: @leo4309 / https://t.me/leo4309
- Giữ ghi chú liên hệ riêng ở phần Giọng Premium, có nút liên hệ Zalo và Telegram.

## Hướng dẫn sử dụng

- Có mục **Hướng dẫn sử dụng** trong sidebar.
- Hướng dẫn dùng 5 ảnh thực tế, có thể bấm để xem phóng to:
  1. `public/guide/01-create-video.png` — Tạo video tự động
  2. `public/guide/02-settings.png` — Cài đặt và liên hệ hỗ trợ
  3. `public/guide/03-media.png` — Tab Ảnh / Video
  4. `public/guide/04-voice.png` — Tab Giọng đọc
  5. `public/guide/05-publishing.png` — Tab Tiêu đề & Đăng tải
- Nội dung hướng dẫn phải bám sát giao diện hiện tại, không dùng ảnh trắng hoặc ảnh minh họa sai trạng thái.

## Quy trình tạo và Chrome

- Khi tạo video hoàn tất, đóng Chrome/Playwright do tool mở, áp dụng cho cả chạy ẩn và không chạy ẩn.
- Chỉ đóng Chrome do tool quản lý theo cổng/profile; không tác động Chrome cá nhân không liên quan.

## Thư mục dự án — trạng thái trước mốc

- Khi chạy mà chưa chọn thư mục dự án, hiển thị popup nhắc chọn nơi lưu.
- Nút chọn thư mục xuất hiện ở popup, sidebar và khu vực Trình tạo video tự động.
- Các thay đổi thử nghiệm sau đó nhằm sửa việc mở hộp thoại thư mục không thuộc mốc này.

## Mốc mã nguồn phục hồi

- Snapshot trước mốc có giao diện Automation/Guide/API Flow đã được tìm thấy trong Git object:
  `1aee36feb16ffc58288ef0982027fc4c2dd71653`
- Snapshot này là mốc tham chiếu cho `src/App.tsx` trước các thay đổi sau yêu cầu “Vẫn không được là sao”.
