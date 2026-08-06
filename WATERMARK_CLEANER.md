# Làm sạch watermark AI

## Mục đích

Chức năng này tự động làm sạch watermark nhìn thấy trên ảnh và video được tạo trong Bước 2 của VidiFlow. Phạm vi hiện tại tập trung vào media do Gemini và Google Flow tạo.

Chức năng không chạy diffusion để xóa SynthID vô hình. Nó chỉ xử lý watermark nhìn thấy và metadata AI được thư viện hỗ trợ.

## Vị trí trên giao diện

Đi tới:

`Tạo Video Tự Động → Bước 2 → Ảnh / Video`

Trong khối thiết lập media, công tắc **Làm sạch watermark AI** nằm cạnh các tùy chọn:

- Không có text
- Không viền đen
- Không lỗi ảnh tường

Khi bật công tắc, giao diện hiển thị lựa chọn chất lượng:

- **Đẹp hơn — MI-GAN**: chất lượng khôi phục nền tốt hơn, xử lý chậm hơn.
- **Nhanh — OpenCV**: xử lý nhanh, có thể làm nhòe nền phức tạp.

Mặc định chức năng tắt và backend mặc định là MI-GAN.

## Luồng xử lý

```text
Gemini / Google Flow tạo media
        ↓
Lưu ảnh hoặc video vào thư mục dự án
        ↓
Nếu removeAiWatermark = true
        ↓
Gọi POST /api/clean-ai-watermark
        ↓
Ảnh: dò watermark đã đăng ký và inpaint vùng phát hiện
Video: khóa detector Veo và xử lý toàn bộ frame có watermark
        ↓
Giữ file gốc với hậu tố .original
        ↓
Cập nhật preview bằng file đã làm sạch
```

Pipeline chờ bước làm sạch kết thúc trước khi đánh dấu media hoàn tất. Nếu bước làm sạch thất bại, file media vừa tạo vẫn được giữ và log hiển thị cảnh báo; cảnh không bị chuyển thành lỗi tạo media.

## Cấu hình

Hai thuộc tính được lưu trong `automation_full_config_v1` và đồng bộ sang `cc_visualConfig_v2`:

```ts
removeAiWatermark: boolean;
watermarkBackend: "cv2" | "migan";
```

Giá trị mặc định:

```ts
removeAiWatermark: false;
watermarkBackend: "migan";
```

## API backend

### Endpoint

```http
POST /api/clean-ai-watermark
Content-Type: application/json
```

Payload:

```json
{
  "path": "D:\\Project\\vid\\scene-P1_1.mp4",
  "mediaType": "video",
  "backend": "migan"
}
```

Kết quả khi có watermark được xử lý:

```json
{
  "success": true,
  "cleaned": true,
  "path": "D:\\Project\\vid\\scene-P1_1.mp4",
  "backupPath": "D:\\Project\\vid\\scene-P1_1.original.mp4"
}
```

Kết quả khi ảnh không có watermark đã biết:

```json
{
  "success": true,
  "cleaned": false,
  "backupPath": null
}
```

## Quy tắc xử lý video Gemini và Flow

Video do VidiFlow tạo hiện đến từ Gemini hoặc Google Flow. Backend gọi bộ xử lý với mark cố định:

```text
video all <input> -o <temporary-output> --mark veo --backend <backend>
```

Không dùng `--mark auto` cho video trong pipeline này. Watermark Veo/Gemini và Sora có hình dạng gần giống nhau; auto-detect từng nhận nhầm Sora và chỉ xử lý 46/192 frame. Khóa `--mark veo` đã được kiểm thử trên video mẫu và xử lý 192/192 frame.

## Quy tắc bảo toàn file

- File media chuẩn của scene vẫn giữ tên ban đầu để renderer không cần thay đổi.
- Khi thực sự tạo được bản làm sạch, bản gốc được sao lưu một lần với hậu tố `.original`.
- Ảnh không có watermark không tạo bản sao lưu thừa.
- File tạm có hậu tố `.watermark-cleaning` và được xóa sau khi hoàn tất.
- Nếu xử lý lỗi, file đầu vào không bị xóa.

Ví dụ:

```text
scene-P1_1.mp4           # file sạch dùng để render
scene-P1_1.original.mp4  # file gốc từ nhà cung cấp
```

## Runtime và dependency

Backend sử dụng package:

```text
remove-ai-watermarks[video,migan]
```

Lệnh được chạy qua `uv tool run`. Thứ tự tìm `uv`:

1. Biến môi trường `UV_PATH`.
2. `~/.local/bin/uv.exe` trên Windows.
3. `uv.exe` trong `PATH`.

MI-GAN tải model ONNX ở lần sử dụng đầu. Các lần sau dùng cache cục bộ.

## Thời gian tham khảo

Với video mẫu dài khoảng 8 giây, 192 frame:

- MI-GAN lần đầu: có thể thêm thời gian tải model.
- MI-GAN xử lý đủ 192 frame: khoảng 3–5 phút tùy CPU.
- OpenCV: nhanh hơn đáng kể nhưng chất lượng nền thấp hơn.

## File mã nguồn liên quan

- `src/components/AutomationControlCenter.tsx`
  - Khai báo cấu hình.
  - Hiển thị công tắc và lựa chọn backend.
  - Đồng bộ cấu hình sang visual config dùng chung.
- `src/App.tsx`
  - Gọi API sau khi media được lưu.
  - Áp dụng cho batch và nhánh tạo từng cảnh.
  - Ghi trạng thái vào log pipeline.
- `server.ts`
  - Chạy CLI qua `uv`.
  - Khóa mark `veo` cho video.
  - Quản lý file tạm, file gốc và phản hồi API.

## Kiểm thử nhanh

### Kiểm tra giao diện

1. Mở `http://127.0.0.1:3105/`.
2. Vào `Tạo Video Tự Động → Bước 2 → Ảnh / Video`.
3. Xác nhận có công tắc **Làm sạch watermark AI**.
4. Bật công tắc và xác nhận dropdown backend xuất hiện.

### Kiểm tra API tồn tại

Gửi payload rỗng phải nhận HTTP `400`, không phải HTML SPA:

```powershell
curl.exe -X POST -H "Content-Type: application/json" -d "{}" `
  http://127.0.0.1:3105/api/clean-ai-watermark
```

### Kiểm tra video

Sau khi tạo một video Flow/Gemini:

1. Kiểm tra log có dòng đang làm sạch watermark.
2. Kiểm tra thư mục `vid` có file `.original.mp4`.
3. Kiểm tra watermark ở frame đầu, giữa và cuối.
4. Xác nhận audio và thời lượng video vẫn còn đầy đủ.

## Giới hạn

- Detector video hiện được khóa cho watermark Veo/Gemini của Google Flow và Gemini.
- Không dành cho watermark bản quyền của bên thứ ba hoặc nội dung người dùng không sở hữu.
- MI-GAN không thể khôi phục hoàn hảo chi tiết đã bị watermark che hoàn toàn.
- Watermark hoặc vị trí mới do nhà cung cấp thay đổi có thể cần cập nhật detector/mask.
- Chức năng này không chứng minh SynthID vô hình đã bị xóa.

