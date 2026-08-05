# Hướng dẫn chi tiết: Dynamic Motion, Auto Transition & Fill Canvas bằng FFmpeg

Tài liệu này hướng dẫn chi tiết cách tự động hoá các kỹ xảo video cốt lõi bằng **FFmpeg**, thay thế hoàn toàn cho CapCut hoặc các phần mềm chỉnh sửa video UI khác. Cách làm này cực kỳ phù hợp khi bạn muốn code backend (NodeJS, Python) render tự động hàng loạt video.

---

## 1. Fill Canvas (Lấp Đầy Khung Hình)
Khi tỷ lệ khung hình của ảnh/video gốc không khớp với tỷ lệ video đầu ra (ví dụ: ảnh ngang `16:9` đưa vào video dọc Shorts/Tiktok `9:16`), chúng ta cần xử lý "Fill Canvas" để tránh khoảng đen (black bars).

### Cách 1: Blur Background (Nền mờ viền) - Khuyên dùng
Đây là kỹ thuật phổ biến nhất. FFmpeg sẽ phóng to và làm mờ ảnh gốc để làm phông nền, sau đó đặt ảnh gốc (giữ nguyên tỷ lệ) lên trên cùng.
```bash
ffmpeg -i input.jpg -filter_complex \
"[0:v]scale=1080:1920,boxblur=20:20[bg]; \
 [0:v]scale=1080:-1[fg]; \
 [bg][fg]overlay=(W-w)/2:(H-h)/2" \
-c:v libx264 -pix_fmt yuv420p output.mp4
```
**Giải thích:**
- `scale=1080:1920,boxblur=20:20`: Tạo 1 layer nền `[bg]` kích thước 9:16 (1080x1920), có thể bị méo nhưng được làm mờ mạnh (radius 20).
- `scale=1080:-1`: Lấy ảnh gốc thu phóng sao cho chiều ngang vừa đúng 1080, chiều cao tự động tính toán (`-1`) để tỷ lệ thật chuẩn xác không bị méo, gán là layer `[fg]`.
- `overlay=(W-w)/2:(H-h)/2`: Căn giữa layer `[fg]` lên trên layer nền `[bg]`.

### Cách 2: Crop to Fill (Cắt xén lấp đầy)
Nếu bạn không muốn viền mờ mà muốn phóng to ảnh lấp đầy toàn bộ khung hình (điều này có nghĩa là bạn chấp nhận bị mất bớt hai cạnh bên, hoặc trên dưới).
```bash
ffmpeg -i input.jpg -vf "scale='max(1080,iw*1920/ih)':'max(1920,ih*1080/iw)',crop=1080:1920" -c:v libx264 output.mp4
```
**Giải thích:** Lệnh `scale` phức tạp kia tính toán để phóng to cạnh ngắn nhất sao cho nó che kín hoàn toàn khung `1080x1920`. Sau đó `crop` sẽ cắt gọt lấy đúng hình chữ nhật ở trung tâm ảnh.

---

## 2. Dynamic Motion (Chuyển Động Động / Ken Burns)
Để biến một bức ảnh tĩnh thành video có cảm giác "sống động", chúng ta dùng hiệu ứng Ken Burns (Zoom và Pan) thông qua filter `zoompan` của FFmpeg.

> [!WARNING]
> Filter `zoompan` của FFmpeg chỉ render hình ảnh ở mặc định `25 fps`. Bạn phải cẩn thận set lại framerate nếu muốn video đầu ra chạy ở 30 fps hay 60 fps bằng tham số `d` và `framerate`.

### Zoom In (Phóng to từ từ vào tâm)
```bash
ffmpeg -i input.jpg -vf \
"zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920" \
-c:v libx264 -t 5 output.mp4
```
**Giải thích thông số `zoompan`:**
- `z='min(zoom+0.0015,1.5)'`: Mỗi frame sẽ zoom thêm `0.0015` lần. Dừng lại khi đạt độ phóng to `1.5` lần.
- `d=125`: Tổng số frame áp dụng hiệu ứng. Nếu video 25 fps, thì độ dài 5 giây = `25 * 5 = 125 frames`.
- `x` và `y`: Giữ toạ độ máy quay luôn nằm ở chính giữa bức ảnh, tạo hiệu ứng zoom từ trung tâm.
- `s=1080x1920`: Ép kích thước đầu ra đúng chuẩn 9:16.

### Zoom Out (Thu nhỏ từ từ)
```bash
ffmpeg -i input.jpg -vf \
"zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920" \
-c:v libx264 -t 5 output.mp4
```

### Pan (Lia máy quay)
Giả sử bạn có ảnh panorama rất rộng, bạn muốn quét từ trái qua phải.
```bash
ffmpeg -i input.jpg -vf \
"zoompan=z=1.2:d=125:x='x+1':y='ih/2-(ih/zoom/2)':s=1080x1920" \
-c:v libx264 -t 5 output.mp4
```
**Giải thích**: Giữ cố định độ zoom là `1.2`. Toạ độ `x` của máy quay di chuyển dần về phía dương `x+1` mỗi frame. 

---

## 3. Auto Transition (Chuyển Cảnh Tự Động)
Để nối mượt mà các đoạn clip lại với nhau, FFmpeg cung cấp filter `xfade`.

> [!IMPORTANT]
> Yêu cầu bắt buộc: Tất cả các video đầu vào phải có **cùng độ phân giải** và **cùng số khung hình/giây (fps)**. Nếu đầu vào lệch nhau, `xfade` sẽ ném ra lỗi `Resolution mismatch`. Hãy chắc chắn chuẩn hoá (scale/pad/fill canvas) tất cả video lẻ trước khi dùng xfade.

**Công thức tính toán thời gian `offset`:**
Khi nối đè 2 đoạn lên nhau, chúng sẽ trùm lên nhau trong khoảng transition.
- Giả sử: Video 1 dài `5s`, Video 2 dài `5s`. Transition dài `1s`.
- Điểm đè nhau (`offset`) bắt đầu ở giây cuối của Video 1. 
- Vậy `offset = Tổng thời gian Video 1 - Độ dài Transition = 5 - 1 = 4s`.
- Thời lượng tổng cuối cùng của video xuất ra sẽ bị co ngắn lại 1 giây: `5 + 5 - 1 = 9s`.

### Cú pháp nối 2 Video (Hiệu ứng Crossfade)
```bash
ffmpeg -i video1.mp4 -i video2.mp4 -filter_complex \
"[0:v]format=pix_fmts=yuva420p[v0]; \
 [1:v]format=pix_fmts=yuva420p[v1]; \
 [v0][v1]xfade=transition=fade:duration=1:offset=4[vout]" \
-map "[vout]" -c:v libx264 output.mp4
```
**Giải thích:**
- `format=pix_fmts=yuva420p`: Ép về cùng không gian pixel màu. Rất hay có lỗi nhấp nháy đen màn hình khi xfade nếu quên thuộc tính format này.
- `transition=fade`: Kiểu chuyển cảnh. Danh sách các kiểu FFmpeg hỗ trợ: `fade`, `wipeleft`, `wiperight`, `slideup`, `slidedown`, `circlecrop`, `rectcrop`, `distance`, `pixelize`, `hblur`...
- `duration=1`: Đổi cảnh kéo dài 1 giây.
- `offset=4`: Bắt đầu quá trình xfade ở mốc 4s.

### Ghép nhiều video với nhiều Transition (Ví dụ: 3 Videos)
Phải nối dây chuyền (chain): `[v1] + [v2] -> [tmp1]`. Xong lấy `[tmp1] + [v3] -> [vout]`.

```bash
ffmpeg -i v1.mp4 -i v2.mp4 -i v3.mp4 -filter_complex \
"[0:v]format=pix_fmts=yuva420p[v0]; \
 [1:v]format=pix_fmts=yuva420p[v1]; \
 [2:v]format=pix_fmts=yuva420p[v2]; \
 [v0][v1]xfade=transition=slideleft:duration=1:offset=4[tmp1]; \
 [tmp1][v2]xfade=transition=circlecrop:duration=1:offset=8[vout]" \
-map "[vout]" -c:v libx264 output.mp4
```
*(Lưu ý về `offset` thứ 2: Video 1(5s) + Video 2(5s) chập nhau 1s = 9s. Vậy offset cho Video số 3 sẽ là `9 - 1 = 8s`).*

---
> [!TIP]
> **Tối ưu hóa luồng code**: Thay vì xử lý nguyên 1 cục FFmpeg khổng lồ dễ dính lỗi syntax, hệ thống Backend nên làm như sau:
> 1. Chạy FFmpeg loop từng ảnh/clip thô => tạo ra các video chuẩn 9:16 (đã làm Fill Canvas và chèn Dynamic Motion). Tất cả dài đúng chuẩn giây quy định.
> 2. Gom list các video hoàn thiện đó. Gen ra 1 chuỗi script `xfade` tự động tính offset.
> 3. Nối ghép xuất file MP4 cuối cùng. Xử lý chia để trị thế này giúp debug FFmpeg dễ hơn rất nhiều!
