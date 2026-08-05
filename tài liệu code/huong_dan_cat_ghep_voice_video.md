# Hướng Dẫn Chi Tiết: Tự Động Cắt Băm Âm Thanh và Cắt Ghép Video

Tài liệu này được viết nhằm mục đích giúp bạn hiểu rõ quá trình phần mềm tự động cắt băm giọng nói (voice) và tự động cắt ghép video (tạo video hoàn chỉnh). Các bước được giải thích một cách dễ hiểu nhất, kèm theo đoạn mã nguồn (code) tương ứng để bạn có thể tham khảo hoặc đưa cho kỹ thuật viên.

---

## 1. Quá Trình Cắt Băm Giọng Nói (Voice Slicing)

### Ý tưởng cơ bản
Bạn có một đoạn ghi âm rất dài và một kịch bản chữ (text). Phần mềm sẽ dùng trí tuệ nhân tạo (Whisper AI của OpenAI) để "nghe" đoạn ghi âm đó, nhận diện xem từng từ được nói ở giây thứ mấy. Sau đó, nó đối chiếu với kịch bản chữ của bạn để biết chính xác một câu hoặc một phân cảnh bắt đầu từ đâu và kết thúc ở đâu, rồi tiến hành "cắt băm" (slice) đoạn ghi âm dài thành nhiều file âm thanh nhỏ tương ứng với từng phân cảnh.

### Các bước hoạt động (dành cho người không biết code)

1. **Chuẩn bị Kịch bản và Audio**: Tool sẽ đọc kịch bản chữ của bạn và file audio gốc.
2. **Khởi chạy AI Whisper**: Tool nhờ Whisper AI phân tích toàn bộ audio, trả về một danh sách các từ và thời gian (ví dụ: từ "Xin" ở giây 0.5 đến 0.8, từ "chào" ở giây 0.8 đến 1.2).
3. **Đối chiếu và Khớp (Matching)**: Tool so sánh các từ AI nghe được với các từ trong kịch bản chữ để tìm ra sự trùng khớp. Từ đó, xác định được thời gian bắt đầu và kết thúc của từng phân cảnh.
4. **Nội suy (Điền vào chỗ trống)**: Nếu có đoạn nào AI nghe không rõ hoặc kịch bản không khớp hoàn toàn, tool sẽ tự động tính toán bù trừ thời gian theo tỷ lệ chữ để đảm bảo không bị mất đoạn nào.
5. **Cắt và Xuất file**: Dựa vào mốc thời gian đã tính toán, tool dùng thư viện cắt âm thanh (AudioSegment) để cắt đoạn ghi âm gốc ra thành nhiều file nhỏ (ví dụ: `1_PhanCanh_1_Part1.wav`, `2_PhanCanh_2_Part1.wav`,...) rồi lưu vào thư mục.

### Mã nguồn (Code tham khảo)
Đây là đoạn code cốt lõi thực hiện việc cắt băm audio:

```python
# Gọi Whisper AI để lấy từng chữ và thời gian
# ... (Phần gọi thư viện Whisper) ...
ai_words = []
for segment in result.get('segments', []):
    for word_info in segment.get('words', []):
        norm_word = self.normalize_text(word_info['word'])
        if norm_word: ai_words.append({'word': norm_word, 'start': word_info['start'], 'end': word_info['end']})

# Đối chiếu chữ của kịch bản với chữ AI nghe được bằng SequenceMatcher
sm = difflib.SequenceMatcher(None, script_words, whisper_text_list)
matches = sm.get_matching_blocks()

# Ghi nhận thời gian bắt đầu/kết thúc cho từng phân cảnh
scene_core_times = [{'start': None, 'end': None} for _ in range(len(scenes))]
for match in matches:
    # ... logic lưu thời gian vào scene_core_times ...

# Tính toán các điểm cắt (Cuts) chia hoàn toàn các đoạn trống
scene_cuts = []
for i in range(len(scenes)):
    # ... logic nội suy, xác định cut_start và cut_end dựa trên tỷ lệ độ dài câu ...
    scene_cuts.append({'start': cut_start, 'end': cut_end})

# Tiến hành cắt audio và lưu thành các file riêng lẻ
audio = AudioSegment.from_file(audio_path)
for i, scene in enumerate(scenes):
    cut_start = scene_cuts[i]['start']
    cut_end = scene_cuts[i]['end']
    
    # Cắt từ millisecond này đến millisecond kia
    sliced_audio = audio[int(cut_start * 1000) : int(cut_end * 1000)]
    
    # Xuất ra file
    file_name = f"{file_counter}_PhanCanh_{scene['id']}_Part1.wav"
    output_path = os.path.join(out_voice_dir, file_name)
    sliced_audio.export(output_path, format="wav")
    file_counter += 1
```

> [!TIP]
> **Giải thích kỹ thuật**: Tool sử dụng `difflib.SequenceMatcher` để tìm sự tương đồng giữa văn bản gốc và văn bản nhận diện được, đây là một thuật toán cực kỳ thông minh giúp giải quyết tình trạng AI nhận diện sai vài chữ nhưng vẫn tìm ra đoạn cần cắt.

---

## 2. Quá Trình Cắt Ghép Video (Auto-Mix & Sync Timeline)

### Ý tưởng cơ bản
Sau khi đã có các file âm thanh nhỏ (đã cắt ở bước 1) và một thư mục chứa các hình ảnh/video nhỏ (để minh họa). Làm sao để ghép chúng lại? 
Thay vì phải tự kéo thả thủ công, tool sẽ sao chép (clone) một dự án (Template) CapCut mẫu của bạn. Sau đó, nó can thiệp trực tiếp vào mã nguồn của dự án CapCut đó (file `draft_content.json`) để "tráo đổi" ruột: thay các file ảnh/nhạc mẫu bằng các file ảnh/nhạc mới của bạn. Cuối cùng, nó giãn/co độ dài của hình ảnh sao cho vừa khít với độ dài của file âm thanh tương ứng.

### Các bước hoạt động (dành cho người không biết code)

1. **Nhân bản dự án mẫu**: Tool tạo một bản sao của thư mục dự án CapCut gốc.
2. **Nạp dữ liệu**: Đọc toàn bộ danh sách Hình ảnh/Video và file Âm thanh đã cắt ở bước 1, sắp xếp theo thứ tự (1, 2, 3...).
3. **Thay thế (Auto-Replace)**: Tool mở "hồ sơ" dự án CapCut, tìm những chỗ đang lưu ảnh cũ, nhạc cũ và thay thế đường dẫn của chúng bằng đường dẫn ảnh mới, nhạc mới.
4. **Đồng bộ thời gian (Sync Timeline)**: Đây là bước quan trọng nhất. 
   - Tool ghép các cặp Ảnh - Âm thanh theo thứ tự (Ảnh 1 đi với Âm thanh 1, Ảnh 2 đi với Âm thanh 2).
   - Đọc độ dài thật của file âm thanh mới.
   - Cài đặt thời gian hiển thị (duration) của Bức ảnh bằng đúng độ dài của đoạn Âm thanh đó.
   - Kéo bức ảnh và âm thanh tiếp theo nối liền ngay sau bức ảnh trước đó (loại bỏ khoảng trống).

### Mã nguồn (Code tham khảo)

Đây là đoạn code thực hiện việc đồng bộ độ dài của Ảnh và Nhạc:

```python
# Sắp xếp các đoạn ảnh và nhạc từ trái sang phải trên Timeline
photo_segments.sort(key=lambda x: x['segment'].get('target_timerange', {}).get('start', 0))
audio_segments.sort(key=lambda x: x['segment'].get('target_timerange', {}).get('start', 0))

target_count = min(len(photo_segments), len(audio_segments))
current_time = 0 

for i in range(target_count):
    p_item = photo_segments[i]  # Đoạn Ảnh
    a_item = audio_segments[i]  # Đoạn Nhạc
    p_seg = p_item['segment']
    a_seg = a_item['segment']

    # 1. Lấy độ dài thật của đoạn nhạc mới
    real_audio = AudioSegment.from_file(a_item['material']['path'])
    audio_duration = len(real_audio) * 1000  # Tính theo micro-giây của CapCut

    # 2. Xếp file nhạc nối tiếp nhau trên dòng thời gian
    a_seg['target_timerange']['start'] = current_time
    a_seg['target_timerange']['duration'] = audio_duration
    
    # 3. Kéo giãn bức ảnh sao cho thời gian bắt đầu và kết thúc khớp y chang file nhạc
    p_seg['target_timerange']['start'] = current_time
    p_seg['target_timerange']['duration'] = audio_duration

    # Cập nhật giới hạn độ dài của bức ảnh trong kho (Material)
    if p_item['material'].get('type') == 'photo':
        p_item['material']['duration'] = audio_duration

    # Cộng dồn thời gian để điểm bắt đầu của cặp (Ảnh - Nhạc) tiếp theo nối liền đuôi cặp hiện tại
    current_time += audio_duration

# Lưu lại toàn bộ thay đổi vào dự án CapCut
with open(json_file, 'w', encoding='utf-8') as f: 
    json.dump(data, f, ensure_ascii=False)
```

> [!IMPORTANT]
> **Điểm mấu chốt**: Việc thay đổi trực tiếp file `draft_content.json` của CapCut giúp ứng dụng thực hiện công việc tính toán và ghép nối chỉ trong tích tắc, thay vì phải điều khiển chuột để kéo thả, mang lại hiệu suất cực cao và độ chính xác tuyệt đối.

## Tổng Kết
- Việc **Cắt Băm** sử dụng Trí Tuệ Nhân Tạo (Whisper) để căn chỉnh thời gian dựa trên việc nhận diện giọng nói thực tế.
- Việc **Cắt Ghép** áp dụng phương pháp can thiệp trực tiếp mã nguồn dự án của CapCut, tự động xếp cặp và kéo giãn hình ảnh bằng với thời gian của giọng nói, giúp tiết kiệm hàng giờ đồng hồ thao tác tay.
