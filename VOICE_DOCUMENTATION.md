# Hướng Dẫn Tích Hợp Chức Năng Voice (Text-to-Speech)

Tài liệu này cung cấp đầy đủ thông tin về các API, Payload, và cách để tích hợp màn hình chọn giọng đọc cũng như chức năng Text-To-Speech (TTS) vào dự án. 

Chỉ cần làm theo các bước dưới đây, bạn có thể dễ dàng copy tính năng sang một nơi khác.

## 1. Môi trường yêu cầu (Environment)
- Phải có API Key của nhà cung cấp AI33: `AI33_API_KEY` (ví dụ: `sk-...`)
- Bạn có thể đặt biến này trong file `.env` hoặc truyền thẳng qua request header.

## 2. API: Lấy danh sách giọng đọc (GET Voices)

API này giúp hiển thị danh sách các giọng đọc hiện có, dùng để đổ dữ liệu vào UI.

- **Endpoint:** `https://api.ai33.pro/v1/voices` *(Tham khảo `EXTERNAL_URLS.AI33_VOICES`)*
- **Method:** `GET`
- **Headers:**
  - `xi-api-key`: `[YOUR_AI33_API_KEY]`
- **Query Parameters (Tuỳ chọn):**
  - `page`: Số trang (mặc định: 1)
  - `page_size`: Kích thước trang (mặc định: 30)
  - `language`: Mã ngôn ngữ (ví dụ: `vi`, `en`)
  - `gender`: Giới tính (`male`, `female`)
  - `age`: Độ tuổi (`youth`, `middle_aged`)
  - `search`: Từ khóa tìm kiếm

**Cách gọi cơ bản:**
```typescript
const fetchVoices = async (page = 1, search = "", gender = "") => {
  const params = new URLSearchParams({ page: String(page), page_size: "30" });
  if (search) params.append("search", search);
  if (gender) params.append("gender", gender);

  const res = await fetch(`https://api.ai33.pro/v1/voices?${params.toString()}`, {
    headers: { "xi-api-key": process.env.AI33_API_KEY }
  });
  const data = await res.json();
  return data; // { success: true, data: Voice[], pagination: {...} }
};
```

## 3. API: Text-to-Speech (Gen Audio)

Việc chuyển đổi văn bản sang giọng đọc tốn thời gian nên API hoạt động theo cơ chế **Bất đồng bộ (Async Polling)**:
1. Gửi văn bản & ID giọng đọc để tạo Task.
2. Liên tục kiểm tra Task xem đã xong chưa.
3. Nếu xong, lấy URL file âm thanh.

### Bước 3.1: Tạo Task TTS
- **Endpoint:** `https://api.ai33.pro/v3/text-to-speech` *(Tham khảo `EXTERNAL_URLS.AI33_TTS`)*
- **Method:** `POST`
- **Headers:**
  - `xi-api-key`: `[YOUR_AI33_API_KEY]`
- **Body (`FormData`):**
  - `text` (String): Nội dung kịch bản cần đọc.
  - `voice_id` (String): ID của giọng đọc đã chọn (Lấy từ kết quả API danh sách giọng).
  - `speed` (Number): Tốc độ đọc (ví dụ: 1).
  - `with_transcript` (String): `"false"` hoặc `"true"`.

**Kết quả trả về:** Nhận lại một `task_id`.

### Bước 3.2: Polling lấy kết quả âm thanh
- **Endpoint:** `https://api.ai33.pro/v3/task/{task_id}` *(Tham khảo `EXTERNAL_URLS.AI33_TASK`)*
- **Method:** `GET`
- **Headers:**
  - `xi-api-key`: `[YOUR_AI33_API_KEY]`
  - `Content-Type`: `application/json`

**Logic lấy audio mẫu:**
```typescript
const generateAudio = async (text: string, voiceId: string, apiKey: string) => {
  // 1. Gửi request tạo Task
  const formData = new FormData();
  formData.append("text", text);
  formData.append("voice_id", voiceId);
  formData.append("speed", "1");
  formData.append("with_transcript", "false");

  const ttsRes = await fetch("https://api.ai33.pro/v3/text-to-speech", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: formData,
  });
  
  const ttsData = await ttsRes.json();
  if (!ttsData.success || !ttsData.task_id) throw new Error("Tạo task thất bại!");
  
  const taskId = ttsData.task_id;
  
  // 2. Polling liên tục kiểm tra trạng thái Task
  let audioUrl = null;
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Chờ 3 giây trước khi kiểm tra lại
    
    const pollRes = await fetch(`https://api.ai33.pro/v3/task/${taskId}`, {
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" }
    });
    
    const pollData = await pollRes.json();
    
    if (pollData.status === "DONE") {
      audioUrl = pollData.metadata.audio_url;
      break;
    } else if (pollData.status === "ERROR") {
      throw new Error(pollData.error_message);
    }
    // Trạng thái PENDING / PROCESSING -> Vòng lặp tiếp tục chạy
  }
  
  return audioUrl; // Trả về link file mp3/wav
};
```

## 4. Tái sử dụng Frontend (UI Component)

Dự án đã có sẵn Popup Dialog rất đẹp hỗ trợ xem danh sách, lọc, tìm kiếm và nghe thử.
Để mang giao diện này vào màn hình khác:

**Bước 1:** Sao chép nguyên file `src/components/VoiceSelectionDialog.tsx` sang dự án mới.

**Bước 2:** Gọi Component vào giao diện:
```tsx
import { useState } from 'react';
import { VoiceSelectionDialog } from './VoiceSelectionDialog';

export const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Chọn Giọng Đọc</button>
      
      {selectedVoice && <p>Giọng đã chọn: {selectedVoice.name}</p>}

      <VoiceSelectionDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentLang="vi"
        onSelectVoice={(voice) => {
          setSelectedVoice(voice); // Nhận cục object chứa voice_id, tên giọng,...
          setIsOpen(false);
        }}
        favoriteVoices={[]} 
        onToggleFavoriteVoice={(id, name) => {
           console.log("Xử lý thêm/xoá yêu thích", id, name)
        }}
      />
    </div>
  )
}
```

## 5. Tổng Kết
Để có thể chạy hoàn chỉnh:
1. Mang `VoiceSelectionDialog.tsx` sang hiển thị.
2. Sử dụng Logic API **Tạo Task + Polling** phía backend hoặc frontend (nếu bạn không quan tâm tính bảo mật của API Key).
3. Sau khi người dùng chọn xong, truyền `voice_id` được chọn qua Hàm `generateAudio` là xong.
