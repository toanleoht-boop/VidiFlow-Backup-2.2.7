import React, { useState } from "react";
import { Copy, Check, Terminal, ExternalLink, Sparkles, BookOpen } from "lucide-react";

interface PromptTemplate {
  id: string;
  category: "kịch bản" | "hook" | "phân cảnh" | "seo" | "kênh";
  title: string;
  description: string;
  template: string;
  variables: Array<{ key: string; label: string; placeholder: string }>;
}

export default function PromptTemplatesHub() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  const templates: PromptTemplate[] = [
    {
      id: "channels-brand",
      category: "kênh",
      title: "Phân Tích Đối Thủ & Tạo Tên Kênh",
      description: "Dùng cho Grok hoặc ChatGPT để đặt tên và mô tả tương đương kênh hình mẫu.",
      template: "Đặt tên, mô tả cho kênh youtube tương tự như kênh này. Phân tích một chút về kênh này:\n[Mô tả bối cảnh kênh học theo hoặc dán ảnh chụp màn hình kênh đối thủ]",
      variables: []
    },
    {
      id: "channel-profile",
      category: "kênh",
      title: "Tạo Profile Kênh (Avatar & Banner)",
      description: "Tạo mô tả kênh hoàn thiện kèm prompt vẽ hình thu hút.",
      template: "Viết lại mô tả cho kênh này, kèm prompt tạo ảnh avatar và banner: {ten_kenh}",
      variables: [
        { key: "ten_kenh", label: "Tên kênh đã chốt", placeholder: "Ví dụ: Lịch Sử Kỳ Bí" }
      ]
    },
    {
      id: "script-standardize",
      category: "kịch bản",
      title: "Chuẩn Hóa Kịch Bản (Bỏ Timestamp)",
      description: "Gợi ý định dạng, xóa mốc thời gian, sửa ngắt câu chuẩn chỉnh.",
      template: "Viết lại nội dung sau, giữ nguyên 100% nội dung gốc. Sửa lại đúng theo cấu trúc Viết hoa, ngắt, chấm câu. Tên nhân vật, bối cảnh đúng với câu chuyện. Xóa mộc thời gian ở đầu đoạn như (00:01). Không cần dấu gạch ngang các từ. Ngắt lại dòng giữa các phân đoạn lớn:\n{transcript}",
      variables: [
        { key: "transcript", label: "Dán Transcript đã copy", placeholder: "[Transcript đã copy từ YouTube Summary...]" }
      ]
    },
    {
      id: "hook-upgrade",
      category: "hook",
      title: "Viết Lại Đoạn Hook Thu Hút",
      description: "Viết lại lời dẫn đầu hấp dẫn, giật gân tăng tỉ lệ giữ chân (Retention Rate).",
      template: "Viết lại đoạn hook, mở đầu này hay hơn, hấp dẫn và cuốn hút hơn:\n{hook_cu}",
      variables: [
        { key: "hook_cu", label: "Đoạn Hook cũ", placeholder: "Ngày xưa có một người đàn ông sống ở..." }
      ]
    },
    {
      id: "scenes-prompt",
      category: "phân cảnh",
      title: "Chia Cảnh & Tạo Prompt Ảnh",
      description: "Tự động phân bổ kịch bản và xuất ít nhất 6 prompt tạo ảnh tiếng Anh kèm style riêng.",
      template: "Dựa vào kịch bản câu chuyện trên hãy chia câu chuyện thành nhiều phần khác nhau kết nối mạch lạc, liên tục. Trong mỗi phần sẽ có đoạn bắt đầu và kết thúc (bám sát 100% vào kịch bản).\n\nYÊU CẦU ĐẶC BIỆT KHI TẠO PROMPT HÌNH ẢNH (Bằng Tiếng Anh, mỗi phần tối thiểu 6 hình ảnh):\n1. ĐỒNG BỘ NHÂN VẬT (CHARACTER CONSISTENCY): Hãy định nghĩa diện mạo cố định cho các nhân vật chính xuất hiện xuyên suốt (tuổi, giới tính, chủng tộc, tóc, mắt, trang phục, màu sắc đặc trưng, biểu cảm). Lặp lại chính xác bộ mô tả diện mạo này trong tất cả các prompt có nhân vật xuất hiện để đảm bảo sự đồng bộ gương mặt và trang phục.\n2. ĐÚNG BỐI CẢNH & KHÔNG GIAN: Mô tả rõ ràng địa điểm, kiến trúc môi trường, thời tiết (mưa, sương mù, nắng gắt), bầu không khí và mốc thời gian cụ thể trong ngày (bình minh, hoàng hôn, ban đêm) để đảm bảo không gian nhất quán.\n3. BÁM SÁT STYLE: Tích hợp sâu sắc phong cách '{image_style}' vào từng prompt. Sử dụng các thuật ngữ chuyên môn về ánh sáng (volumetric light beams, chiaroscuro contrast, warm rim lighting), góc quay, loại máy ảnh và ống kính (anamorphic lens, shot on 35mm, portrait lens, dramatic camera angles, low-angle shot, macro detail, soft bokeh background).\n4. PROMPT CHI TIẾT & SỐNG ĐỘNG: Mỗi prompt tiếng Anh phải cực kỳ chi tiết, dài (120-180 từ), mô tả rõ ràng hành động, cử chỉ, biểu cảm gương mặt sâu sắc (eyes glistening with tears, clenched jaw of determination) và kết cấu bề mặt siêu thực (pore-level skin, realistic fabric textures, particles floating in light). Tuyệt đối không viết câu cụt, sáo rỗng hay rút gọn.\n\nHãy xuất ra kết quả với tiêu đề tiếng Việt giải thích nội dung, còn phần prompt vẽ tranh bằng tiếng Anh chất lượng cao.",
      variables: [
        { key: "image_style", label: "Style ảnh mong muốn", placeholder: "Ví dụ: Cinematic dark storytelling, vintage fantasy art..." }
      ]
    },
    {
      id: "prompt-only",
      category: "phân cảnh",
      title: "Tách Riêng Prompt Tạo Ảnh",
      description: "Nhận danh sách mã hóa tinh gọn P1.1, P1.2 để dán nhanh vào AI vẽ ảnh.",
      template: "Tách riêng chỉ lấy phần prompt, không tách phần, Đánh dấu vào đầu prompt: P1.1, P1.2,... P4.1, P4.2..",
      variables: []
    },
    {
      id: "seo-thumbnail",
      category: "seo",
      title: "Dựng Tiêu Đề, SEO & Ý Tưởng Thumb",
      description: "Tạo trọn bộ SEO siêu tốc kết hợp mô tả kịch bản mẫu.",
      template: "Viết tiêu đề + mô tả video + thẻ tag + hashtag + prompt ảnh thumb có text trong thumb cho video: {ten_video}. Bám sát kịch bản sau:\n{kich_ban}",
      variables: [
        { key: "ten_video", label: "Tên kịch bản/video", placeholder: "Ví dụ: Kẻ thách thức tử thần" },
        { key: "kich_ban", label: "Kịch bản hoàn chỉnh", placeholder: "[Dán kịch bản đã chuẩn hóa...]" }
      ]
    }
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFilledTemplate = (tmpl: PromptTemplate) => {
    let result = tmpl.template;
    tmpl.variables.forEach(v => {
      const value = userInputs[`${tmpl.id}_${v.key}`] || "";
      result = result.replace(`{${v.key}}`, value || `[${v.label}]`);
    });
    return result;
  };

  const handleInputChange = (tmplId: string, varKey: string, val: string) => {
    setUserInputs(prev => ({
      ...prev,
      [`${tmplId}_${varKey}`]: val
    }));
  };

  return (
    <div id="prompt-templates-hub" className="space-y-6">
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-5 shadow-xs flex items-start gap-4">
        <div className="bg-teal-600 rounded-xl p-3 text-white shadow-md">
          <BookOpen className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Thư Viện Prompt Mẫu YouTube 2026</h2>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">
            Tổng hợp đầy đủ cấu trúc câu lệnh vàng giúp tối ưu hóa việc giao tiếp với LLM (Grok/ChatGPT/Gemini) hoặc các AI vẽ ảnh (Dreamina/Midjourney) theo quy trình chuẩn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {templates.map((tmpl) => {
          const filled = getFilledTemplate(tmpl);
          const hasVars = tmpl.variables.length > 0;

          return (
            <div key={tmpl.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-sm hover:border-slate-200 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-50 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {tmpl.category}
                    </span>
                    <h3 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                      {tmpl.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>
                </div>
                
                <button
                  onClick={() => handleCopy(tmpl.id, filled)}
                  className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                    copiedId === tmpl.id
                      ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {copiedId === tmpl.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Đã Sao Chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Sao Chép Prompt
                    </>
                  )}
                </button>
              </div>

              {/* Input variables */}
              {hasVars && (
                <div className="bg-slate-50/50 rounded-xl p-4 mb-4 border border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Điền thông tin tùy chỉnh:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tmpl.variables.map((v) => (
                      <div key={v.key} className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">{v.label}</label>
                        <input
                          type="text"
                          placeholder={v.placeholder}
                          value={userInputs[`${tmpl.id}_${v.key}`] || ""}
                          onChange={(e) => handleInputChange(tmpl.id, v.key, e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-sans text-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code block area */}
              <div className="relative group rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner max-h-[160px] overflow-y-auto">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/80 px-2 py-1 rounded">Quick Preview</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase pb-1 tracking-wider flex items-center gap-1.5 border-b border-slate-800 mb-2">
                  <Terminal className="w-3 h-3 text-slate-500" />
                  Grok / AI Prompt
                </div>
                {filled}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
