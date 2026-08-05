import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  FolderOpen,
  Image,
  Lightbulb,
  Mic2,
  Play,
  Sparkles,
} from "lucide-react";

const quickSteps = [
  {
    number: 1,
    title: "Nội dung & chia cảnh",
    icon: BookOpen,
    color: "indigo",
    items: [
      "Chọn một thư mục riêng cho video.",
      "Dán kịch bản, nhập ý tưởng hoặc dán đường link cần phân tích.",
      "Kiểm tra kịch bản và số phân cảnh. Câu dài nên được chia thành nhiều hình minh họa.",
      "Bấm Tiếp tục để sang phần phong cách.",
    ],
  },
  {
    number: 2,
    title: "Phong cách, nhân vật & tỷ lệ",
    icon: Sparkles,
    color: "violet",
    items: [
      "Chọn một phong cách có sẵn hoặc tải ảnh mẫu để AI lấy style.",
      "Nếu video có nhân vật xuyên suốt, tạo hoặc chọn Hồ sơ nhân vật.",
      "Chọn đúng tỷ lệ: 16:9 cho YouTube ngang, 9:16 cho Shorts/TikTok.",
      "Kiểm tra nền tảng tạo. API Flow là lựa chọn mặc định.",
    ],
  },
  {
    number: 3,
    title: "Tạo và kiểm tra ảnh/video",
    icon: Image,
    color: "emerald",
    items: [
      "Bấm chạy để tạo media cho các prompt đã duyệt.",
      "Mở Review kết quả để xem từng ảnh hoặc video theo đúng tỷ lệ.",
      "Nếu preview chưa hiện, bấm Tải lại ảnh/video.",
      "Chỉ sửa prompt và tạo lại riêng media chưa đạt; không cần chạy lại toàn bộ.",
    ],
  },
  {
    number: 4,
    title: "Voice, SEO & xuất video",
    icon: Mic2,
    color: "amber",
    items: [
      "Chọn Voice Premium hoặc tải voice đã tạo bên ngoài.",
      "Mở tab SEO & thumbnail để tạo tiêu đề, mô tả và ảnh bìa.",
      "Mở tab Xuất video, kiểm tra phụ đề, độ phân giải và hiệu ứng.",
      "Render video rồi xem kết quả tại Kết quả & Theo dõi.",
    ],
  },
] as const;

const helpSections = [
  {
    title: "Tạo video từng bước hay tự động?",
    icon: Play,
    content: [
      "Người mới nên chọn Tạo video từng bước để kiểm tra kết quả sau từng công đoạn.",
      "Tạo video tự động chạy liên tục từ nội dung đến video cuối và chỉ dành cho gói hỗ trợ tính năng này.",
      "Dữ liệu của hai chế độ đều được lưu trong thư mục dự án.",
    ],
  },
  {
    title: "Dùng thử và bộ đếm điểm",
    icon: CheckCircle2,
    content: [
      "Gói Trial được dùng API do hệ thống cung cấp trong thời gian thử.",
      "Mỗi ảnh hoặc video tạo thành công trừ 1 điểm Ảnh, không phụ thuộc nền tảng.",
      "Mỗi request Gemini thành công trừ 1 điểm Gemini.",
      "Media lỗi hoặc job chưa thành công không bị trừ điểm.",
    ],
  },
  {
    title: "Khi preview hoặc quá trình tạo bị lỗi",
    icon: CircleHelp,
    content: [
      "Không xóa thư mục dự án hoặc đổi tên file khi tool đang chạy.",
      "Bấm Tải lại ảnh/video nếu file đã có trong thư mục nhưng preview chưa xuất hiện.",
      "Nếu một media lỗi, dùng nút Tạo lại ảnh/video này thay vì chạy lại cả dự án.",
      "Nếu nền tảng hết credit, đổi tài khoản/API rồi chạy lại media bị thiếu.",
    ],
  },
  {
    title: "Kiểm tra và cài bản cập nhật",
    icon: Clapperboard,
    content: [
      "Mở Kiểm tra cập nhật ở menu bên trái.",
      "Nếu có phiên bản mới, đọc changelog rồi chọn Tải thủ công hoặc Tự động tải & cài.",
      "Cài xong hãy đóng bản cũ và mở lại VidiFlow.",
      "Nếu báo chưa cấu hình, Admin chưa phát hành đủ phiên bản, URL HTTPS và SHA-256 trên server.",
    ],
  },
];

export default function CustomerGuideView({
  onStart,
  onResults,
}: {
  onStart: () => void;
  onResults: () => void;
}) {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top_right,_#7c3aed,_#4338ca_38%,_#0f172a_82%)] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <BookOpen className="h-6 w-6" />
            </span>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-indigo-200">
              Hướng dẫn dành cho người mới
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Tạo video đầu tiên theo 4 bước
            </h2>
            <p className="mt-2 text-sm leading-6 text-indigo-100">
              Không cần hiểu thuật ngữ kỹ thuật. Làm lần lượt từ trái sang
              phải, xem lại kết quả sau mỗi bước rồi mới tiếp tục.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onStart}
              className="rounded-xl bg-white px-5 py-3 text-xs font-black text-indigo-700 shadow-lg"
            >
              Bắt đầu tạo video
            </button>
            <button
              type="button"
              onClick={onResults}
              className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-xs font-black text-white"
            >
              Xem dự án đã chạy
            </button>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-indigo-100 bg-indigo-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-indigo-600">
              Video hướng dẫn
            </p>
            <h3 className="mt-1 text-base font-black text-slate-900">
              Hướng dẫn thao tác VidiFlow Premium
            </h3>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700">
            <Play className="h-4 w-4 fill-current" /> Xem trước khi bắt đầu
          </span>
        </div>
        <div className="bg-slate-950 p-3 sm:p-5">
          <video
            className="mx-auto aspect-video w-full max-w-5xl rounded-2xl bg-black shadow-2xl"
            controls
            playsInline
            preload="metadata"
          >
            <source src="/guide/vidiflow-huong-dan-thao-tac-premium.mp4" type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ phát video hướng dẫn.
          </video>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-indigo-600">
            Làm đúng theo thứ tự này
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">
            4 công đoạn từ nội dung đến video hoàn chỉnh
          </h3>
        </div>
        <div className="grid gap-4 xl:grid-cols-4">
          {quickSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                key={step.number}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-black text-slate-100">
                    {step.number}
                  </span>
                </div>
                <h4 className="mt-4 text-sm font-black text-slate-900">
                  {step.title}
                </h4>
                <ol className="mt-3 space-y-2">
                  {step.items.map((item, index) => (
                    <li
                      key={item}
                      className="flex gap-2 text-xs leading-5 text-slate-600"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-black text-indigo-700">
                        {index + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="space-y-3">
          {helpSections.map((section, index) => {
            const Icon = section.icon;
            const expanded = open === index;
            return (
              <article
                key={section.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? -1 : index)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="rounded-xl bg-indigo-50 p-2 text-indigo-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1 text-sm font-black text-slate-800">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded && (
                  <div className="border-t border-slate-100 px-4 py-4">
                    <ul className="space-y-3">
                      {section.content.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-xs leading-5 text-slate-600"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <FolderOpen className="h-6 w-6 text-emerald-600" />
            <h3 className="mt-3 text-sm font-black text-emerald-900">
              Trước khi bấm chạy
            </h3>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-emerald-800">
              <li>• Đã chọn thư mục dự án riêng.</li>
              <li>• Đã kiểm tra tỷ lệ 16:9 hoặc 9:16.</li>
              <li>• Đã chọn đúng ảnh hay video.</li>
              <li>• Đã xem lại prompt và số phân cảnh.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Lightbulb className="h-6 w-6 text-amber-600" />
            <h3 className="mt-3 text-sm font-black text-amber-900">
              Mẹo cho lần đầu
            </h3>
            <p className="mt-2 text-xs leading-5 text-amber-800">
              Hãy thử kịch bản ngắn khoảng 5–8 phân cảnh trước. Khi đã hiểu
              Review và Tạo lại từng media, bạn mới chạy dự án dài.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
