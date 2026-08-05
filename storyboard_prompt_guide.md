# CẨM NANG HƯỚNG DẪN CHIA CẢNH VÀ VIẾT PROMPT AI (STORYBOARD GUIDE FOR AI)

Tài liệu này được thiết kế để bạn sao chép toàn bộ hoặc từng phần làm chỉ dẫn (System Prompt / Instructions) cho các mô hình AI khác (như ChatGPT, Claude, Gemini Advanced) tham khảo, giúp họ tạo ra kịch bản phân cảnh và câu lệnh vẽ ảnh (Image Prompts) siêu chuyên nghiệp, đồng bộ và nhất quán nhất cho các nền tảng tạo ảnh (Midjourney, Leonardo AI, Dreamina, Stable Diffusion).

---

## 1. MỤC TIÊU CỦA QUY TRÌNH CHIA CẢNH
*   **Đồng bộ 1-1 với giọng đọc (Subtitles Sync)**: Lời thoại trong kịch bản và câu thoại băm (subText) của mỗi hình ảnh phải khớp nhau tuyệt đối để video hiển thị đúng ảnh khi giọng đọc cất lên.
*   **Tính tối giản và tối ưu**: Tránh thừa thãi ảnh. Ép cứng các câu thoại ngắn (<= 12-14 từ) chỉ dùng đúng 1 prompt ảnh. Chỉ những câu thoại dài kịch tính, nhiều vế hành động (>= 22-25 từ) mới tách thành 2-3 prompt ảnh kế tiếp để chuyển cảnh mượt mà.
*   **Liên kết không gian & thời gian**: Các cảnh nối liền nhau mạch lạc như một bộ phim thực thụ.

---

## 2. CẤU TRÚC JSON ĐẦU RA MẪU (BẮT BUỘC)
Mô hình AI nhận nhiệm vụ phân cảnh cần xuất ra dữ liệu định dạng JSON chuẩn mực sau:

```json
{
  "scenes": [
    {
      "sceneNumber": "1",
      "timeSegment": "00:00 - 00:05",
      "text": "Lời đọc gốc của câu thoại tương ứng trong phân cảnh này (bám sát 100% kịch bản gốc).",
      "visualDescription": "Mô tả sinh động bằng Tiếng Việt về hình ảnh phân cảnh này (chất liệu bối cảnh, chuyển động nhân vật).",
      "imagePrompts": [
        {
          "code": "P1.1",
          "vietnameseLabel": "Mô tả ngắn gọn cảnh vẽ bằng tiếng Việt",
          "englishPrompt": "Chi tiết prompt tiếng Anh mô tả bối cảnh cực chuẩn để dán trực tiếp vào AI tạo ảnh. (Đọc hướng dẫn viết chi tiết ở mục 3).",
          "subText": "Phần câu thoại tiếng Việt cụ thể tương ứng đang phát âm trong hình ảnh này để băm voice khớp 1-1."
        }
      ]
    }
  ]
}
```

---

## 3. CÔNG THỨC VIẾT PROMPT VẼ TRANH SIÊU CHI TIẾT (ENGLISH PROMPTS)
Một prompt tạo ảnh nghệ thuật đỉnh cao, bám sát phong cách điện ảnh tối tăm, kể chuyện kịch tính cần tuân thủ cấu trúc **5 thành phần cốt lõi** sau (độ dài lý tưởng: 120 - 180 từ tiếng Anh):

$$\text{Prompt} = \text{Chủ thể chính} + \text{Biểu cảm chi tiết} + \text{Bối cảnh \& Ánh sáng} + \text{Ống kính \& Góc quay} + \text{Phong cách mỹ thuật}$$

### 🌟 5 Thành phần cốt lõi chi tiết:
1.  **Chủ thể chính (Subject Consistency)**:
    *   Mô tả diện mạo nhân vật cực kỳ cụ thể, độc bản và bất biến: Tuổi tác, giới tính, chủng tộc, cấu trúc gương mặt, kiểu tóc và màu sắc, trang phục đặc trưng kèm màu sắc cụ thể.
    *   *Ví dụ*: `an ancient rugged Viking warrior with a scarred jawline, piercing cold blue eyes, a long braided silver-blonde hair, wearing a dark weathered leather tunic with brass shoulder plates`
2.  **Biểu cảm & Diễn biến tâm lý (Emotional Expressiveness)**:
    *   Tả rõ hành động cụ thể, biểu cảm gương mặt thăng hoa chứa đựng chiều sâu tâm lý thay vì từ chung chung.
    *   *Ví dụ*: `clenched jaw of determination, eyes glistening with unshed tears, a subtle, chilling smile of relief`
3.  **Bối cảnh, Không gian & Ánh sáng (Context & Cinematic Lighting)**:
    *   Xác định rõ địa điểm, kiến trúc, thời tiết (mưa, sương mù, khói), bầu không khí, mốc thời gian trong ngày.
    *   Ánh sáng là linh hồn của bức ảnh: Chiaroscuro (tương phản sáng tối), volumetric light beams (tia sáng xuyên sương mù), neon rim highlights (viền sáng neon), soft glowing dust particles floating in the air.
    *   *Ví dụ*: `inside a dark, ancient damp stone cave, dense volumetric light beams slicing through heavy dust and blue haze, dramatic chiaroscuro with deep shadows`
4.  **Ống kính & Góc máy (Camera Shot & Lens)**:
    *   Chỉ rõ góc quay và loại camera chuyên nghiệp để tạo chiều sâu ảnh trường tốt.
    *   *Ví dụ*: `shot on 35mm anamorphic lens, extreme low-angle dramatic shot, close-up portrait, shallow depth of field, soft bokeh, cinematic film grain, raw photo feel`
5.  **Phong cách mỹ thuật đồng bộ (Style Alignment)**:
    *   Đảm bảo dán phong cách cốt lõi vào cuối prompt để giữ độ thống nhất tuyệt đối về nước ảnh.
    *   *Ví dụ*: `cinematic dark storytelling, ultra-realistic 3D render, hyper-detailed oil painting style, 8k resolution`

---

## 4. VÍ DỤ PROMPT HOÀN CHỈNH ĐỂ COPPY THAM KHẢO

### Cảnh 1 (Mô tả Nhân vật nam chính u tối trong nhà giam cổ):
> **English Prompt**:
> *A close-up portrait shot on an 85mm F1.4 lens of a rugged 40-year-old medieval detective, sharp jawline, stubble beard, eyes narrowed with intense focus, inside a dimly lit ancient stone prison cell. Intense volumetric light rays cut through a small barred window, illuminating floating dust particles and creating a sharp, glowing rim highlight on his shoulder. Moody cinematic color grading with rich warm ambers in the light and cold teal shadows, dramatic chiaroscuro contrast, pore-level skin texture, hyper-detailed, cinematic dark storytelling style, 8k resolution, raw photo feel --ar 16:9*

### Cảnh 2 (Cảnh chuyển dịch chuyển động, cận cảnh tay cầm chiếc chìa khóa cổ):
> **English Prompt**:
> *An extreme close-up dramatic camera angle shot on a 35mm lens, focusing on the rough, dirt-stained hands of the medieval detective carefully holding a rusty, intricately carved brass key. The background is softly blurred with a beautiful dark bokeh of the damp stone prison cell. Volumetric warm light glints off the metallic edges of the key, casting subtle glowing highlights and long cinematic shadows. High dynamic range, realistic textures of brass metal and skin pores, matching cinematic dark storytelling style, hyper-detailed, 8k --ar 16:9*

---

## 5. CHỈ DẪN CHO AI KHÁC (SYSTEM PROMPT COPY-PASTE)
Bạn có thể copy đoạn văn dưới đây làm chỉ dẫn (System Prompt) cho AI khác khi muốn họ chia kịch bản:

```text
Bạn là một trợ lý AI chuyên nghiệp về viết kịch bản phim và tạo Prompt vẽ tranh (Midjourney/Leonardo/Dreamina).
Hãy nhận vào đoạn kịch bản thoại dưới đây và chia nó thành các phân cảnh JSON tối ưu:
1. Với mỗi câu thoại ngắn (<= 12 từ tiếng Anh hoặc <= 14 từ tiếng Việt): BẮT BUỘC chỉ tạo đúng 1 Prompt ảnh duy nhất để tối ưu dung lượng.
2. Với mỗi câu thoại dài (>= 22 từ tiếng Anh hoặc >= 25 từ tiếng Việt): Tự động tách vế câu và tạo đúng 2-3 Prompt ảnh nối tiếp nhau để biểu đạt chuyển động điện ảnh mượt mà.
3. Trong mỗi prompt tiếng Anh ("englishPrompt"), hãy viết cực kỳ dài và chi tiết (từ 120-180 từ) tả rõ: Ngoại hình cụ thể bất biến của nhân vật (màu tóc, trang phục, gương mặt), bối cảnh, ánh sáng điện ảnh (volumetric beams, chiaroscuro), góc quay camera (35mm, portrait lens) và phong cách nghệ thuật đồng bộ. Không bao giờ viết ngắn hoặc dùng các từ thay thế sáo rỗng.
```
