import React, { useState } from "react";
import { 
  FileText, 
  Activity, 
  Cpu, 
  Database, 
  Server, 
  Settings, 
  Sliders, 
  CheckCircle, 
  Play, 
  Terminal, 
  TrendingUp, 
  Check, 
  Copy, 
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Printer,
  Image,
  Download,
  Eye
} from "lucide-react";
import { Storyboard, SEOResults } from "../types";

interface DetailedReportViewProps {
  rawTranscript: string;
  standardizedScript: string;
  chosenHookText: string;
  storyboardData: Storyboard | null;
  generatedAudio: string;
  seoData: SEOResults | null;
  isPlayingAutoPipeline: boolean;
  autoPipelineLogs: string[];
  characterDescription: string;
  dialogueGroupSize: number;
  channelName: string;
  targetKeywords: string;
  nicheCategory: string;
  customKeyword: string;
  selectedVoice: string;
  imageStyle: string;
}

export default function DetailedReportView({
  rawTranscript,
  standardizedScript,
  chosenHookText,
  storyboardData,
  generatedAudio,
  seoData,
  isPlayingAutoPipeline,
  autoPipelineLogs,
  characterDescription,
  dialogueGroupSize,
  channelName,
  targetKeywords,
  nicheCategory,
  customKeyword,
  selectedVoice,
  imageStyle
}: DetailedReportViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"pipeline" | "micro" | "session" | "export">("pipeline");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Helper function to wrap text on canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  };

  // Export each step as a beautiful, professional widescreen card image (PNG)
  const downloadFrameAsImage = (frameId: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Futuristic gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#090d16"); // dark background
    bgGrad.addColorStop(1, "#111827"); // deep gray
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Neon accents and grid watermark
    ctx.strokeStyle = "rgba(220, 38, 38, 0.25)"; // crimson glowing border
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

    ctx.strokeStyle = "rgba(99, 102, 241, 0.15)"; // subtle indigo inner border
    ctx.lineWidth = 1;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

    // Decorative grid pattern
    ctx.strokeStyle = "rgba(148, 163, 184, 0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 40; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 40);
      ctx.lineTo(i, canvas.height - 40);
      ctx.stroke();
    }
    for (let j = 40; j < canvas.height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(40, j);
      ctx.lineTo(canvas.width - 40, j);
      ctx.stroke();
    }

    // 3. Top Header Bar (Branding)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("🚀 YOUTUBE WORKSPACE 2026 - PRODUCTION FRAME EXPORTER v2.5.0", 45, 55);

    const nowStr = new Date().toLocaleString("vi-VN");
    ctx.textAlign = "right";
    ctx.fillText(`MÃ PHIÊN: #YWS-${nowStr.replace(/[\s,:/]/g, "")}`, canvas.width - 45, 55);
    ctx.textAlign = "left";

    // Divider line
    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(45, 68);
    ctx.lineTo(canvas.width - 45, 68);
    ctx.stroke();

    // 4. Extract Step Data
    let stepNum = "";
    let stepTitle = "";
    let statsHeader = "";
    let contentLines: string[] = [];

    if (frameId === "00") {
      stepNum = "FRAME #00";
      stepTitle = "NICHE RESEARCH & KHỞI TẠO KÊNH";
      statsHeader = `Ngách định hướng: ${nicheCategory?.toUpperCase() || "LỊCH SỬ"} | Thương hiệu: ${channelName || "Chưa đặt"}`;
      contentLines = [
        "1. THÔNG TIN NGÁCH & CHỦ ĐỀ PHÁT TRIỂN KÊNH YOUTUBE:",
        `   - Lĩnh vực: ${nicheCategory === "historical-mysteries" ? "Bí ẩn lịch sử & Dã sử" : nicheCategory === "military-tactics" ? "Chiến thuật quân sự" : nicheCategory === "ancient-myths" ? "Thần thoại cổ đại" : nicheCategory === "vietnamese-legends" ? "Truyền thuyết Việt Nam" : "Chủ đề tự chọn"}`,
        `   - Từ khóa/Chủ đề tiêu biểu: ${customKeyword || "Bí sử, thần thoại thế giới"}`,
        "",
        "2. THIẾT LẬP THƯƠNG HIỆU KÊNH (BRANDING):",
        `   - Tên kênh chính thức: ${channelName || "Chưa thiết lập"}`,
        `   - Từ khóa SEO chủ đạo của kênh: ${targetKeywords || "Chưa thiết lập"}`,
        "",
        "3. CHIẾN LƯỢC MẬT ĐỘ TƯƠNG TÁC (ENGAGEMENT VELOCITY 2026):",
        "   - Tối ưu giữ chân người xem bằng dải kịch bản kịch tính mở đầu dạng Hook nghi vấn.",
        "   - Sử dụng giọng thuyết minh truyền cảm trầm ấm cùng hiệu ứng âm thanh chuyển động (Woosh, Swoosh).",
        "   - Ghim bình luận seeding định hướng thảo luận ngay giây đầu tiên công chiếu để kéo đề xuất."
      ];
    } else if (frameId === "01") {
      stepNum = "FRAME #01";
      stepTitle = "SƠ CHẾ & CHUẨN HÓA KỊCH BẢN";
      statsHeader = `Gốc: ${rawTranscript?.length || 0} ký tự | Kịch bản sạch: ${standardizedScript?.length || 0} ký tự (~${countWords(standardizedScript)} từ)`;
      contentLines = [
        "NỘI DUNG KỊCH BẢN SẠCH ĐÃ CHUẨN HÓA (STANDARD SCRIPT):",
        ""
      ];
      const cleanedLines = (standardizedScript || rawTranscript || "Chưa có kịch bản nạp vào hệ thống.").split("\n").filter(l => l.trim());
      cleanedLines.slice(0, 14).forEach(line => {
        contentLines.push(`  ${line}`);
      });
      if (cleanedLines.length > 14) {
        contentLines.push(`  ... và ${cleanedLines.length - 14} câu thoại kịch bản chi tiết khác được lưu trữ ngầm.`);
      }
    } else if (frameId === "02") {
      stepNum = "FRAME #02";
      stepTitle = "CHẾ TÁC HOOK THU HÚT GIỮ CHÂN";
      statsHeader = `Tỷ lệ giữ chân mục tiêu (Target Retention): > 75% trong 3-5 giây đầu`;
      contentLines = [
        "CÂU HOOK MỞ ĐẦU ĐÃ CHỌN (CHOSEN RETENTION HOOK):",
        "",
        `  "${chosenHookText || "Chưa có Hook được thiết lập. Hãy chọn hoặc viết Hook ở Bước 2."}"`,
        "",
        "HƯỚNG DẪN KỸ THUẬT DỰNG HOOK TRONG CAPCUT:",
        "- Hình ảnh: Phân cảnh 1 tương ứng với Hook phải là hình ảnh cực kỳ tò mò hoặc có tính shock thị giác.",
        "- Âm thanh: Sử dụng tiếng trống dồn dập (cinematic riser) bùng nổ ngay mốc giây thứ 3.",
        "- Hiệu ứng: Chữ phụ đề (Subtitle) của câu Hook phải được tạo hiệu ứng lướt từng từ, cỡ chữ siêu lớn, màu vàng rực viền đen nổi bật."
      ];
    } else if (frameId === "03") {
      stepNum = "FRAME #03";
      stepTitle = "PHÂN CẢNH CHI TIẾT & CAMERA PROMPT";
      const scenesCount = storyboardData?.scenes?.length || 0;
      statsHeader = `Tổng số phân cảnh: ${scenesCount} cảnh | Đồng nhất khuôn mặt nhân vật: ${characterDescription ? "Bật" : "Tắt"}`;
      contentLines = [
        `MÔ TẢ ĐỒNG NHẤT NHÂN VẬT CHỦ ĐẠO: ${characterDescription || "Chưa thiết lập mô tả nhân vật đồng nhất."}`,
        ""
      ];
      if (storyboardData && storyboardData.scenes && storyboardData.scenes.length > 0) {
        storyboardData.scenes.slice(0, 3).forEach((scene, sIdx) => {
          contentLines.push(`👉 CẢNH ${sIdx + 1}:`);
          contentLines.push(`   - Lời thoại: "${scene.text || ""}"`);
          contentLines.push(`   - Camera / Góc máy: ${scene.visualDescription || ""}`);
          if (scene.imagePrompts && scene.imagePrompts.length > 0) {
            contentLines.push(`   - English Prompt vẽ AI: "${scene.imagePrompts[0]?.englishPrompt || ""}"`);
          }
          contentLines.push("");
        });
        if (scenesCount > 3) {
          contentLines.push(`... Và còn ${scenesCount - 3} phân cảnh chi tiết khác bám sát nhịp đọc.`);
        }
      } else {
        contentLines.push("Chưa thực hiện chia cảnh kịch bản ở Bước 3.");
      }
    } else if (frameId === "04") {
      stepNum = "FRAME #04";
      stepTitle = "VẼ ẢNH MINH HỌA (GOOGLE IMAGEN 4.0)";
      const imgCount = storyboardData?.scenes?.length || 0;
      statsHeader = `Model kết xuất: Google Imagen 4.0 Studio | Định dạng: Widescreen 16:9 HD`;
      contentLines = [
        "PHONG CÁCH HỘI HỌA & MỸ THUẬT CHỦ ĐẠO (ART STYLE CONTEXT):",
        `  "${imageStyle}"`,
        "",
        "TIÊU CHUẨN VẬN HÀNH THỦ CÔNG & TỰ ĐỘNG:",
        "- Lọc prompt an toàn: Toàn bộ từ khóa được lọc bớt cụm từ nhạy cảm trước khi gửi API.",
        "- Kỹ thuật Style Matching: Trích xuất màu sắc, nét vẽ từ hình mẫu để giữ tính nhất quán.",
        "- Đóng gói tệp: Toàn bộ ảnh trả về dạng chuỗi nhị phân Base64 độ phân giải cao sẵn sàng lồng ghép.",
        "",
        `Trạng thái: Đã kết xuất danh sách ${imgCount} tác phẩm tương ứng với các phân cảnh.`
      ];
    } else if (frameId === "05") {
      stepNum = "FRAME #05";
      stepTitle = "THÂU ÂM LỒNG TIẾNG GOOGLE AI STUDIO";
      statsHeader = `Giọng đọc: ${selectedVoice} (Premium Studio) | Định dạng: WAV Lossless 48kHz`;
      contentLines = [
        `CẤU HÌNH GIỌNG ĐỌC: Giọng ${selectedVoice} - Trầm ấm, dồn dập, ngân vang lịch sử đầy lôi cuốn.`,
        "",
        "CHỈ DẪN KỸ THUẬT LỒNG TIẾNG:",
        "- Nhịp thở tự nhiên: Hệ thống tự động phân tích dấu chấm phẩy, chấm lửng để nghỉ ngơi 0.4s - 0.7s.",
        "- Tốc độ truyền tải: 1.0x chuẩn, mang âm điệu tự nhiên như người thuyết minh thực thụ.",
        "- Tải tệp lồng tiếng: Dễ dàng ghép nối vào Timeline CapCut/Premiere mà không bị lệch giọng.",
        "",
        `Trạng thái: ${generatedAudio ? "Đã lồng tiếng hoàn thành và lưu trữ tệp lồng tiếng" : "Chưa thực hiện thâu âm thuyết minh"}`
      ];
    } else if (frameId === "06") {
      stepNum = "FRAME #06";
      stepTitle = "ĐỒNG BỘ TIMELINE BIÊN TẬP CAPCUT";
      statsHeader = `Công nghệ: Timing Sheet tự động chia tỷ lệ từ trên giây | Nhịp đọc chuẩn: 2.5 từ/giây`;
      contentLines = [
        "SƠ ĐỒ BIÊN TẬP VÀ KHỚP CẢNH TIMELINE (TIMING GUIDE SHEET):",
        ""
      ];
      if (storyboardData && storyboardData.scenes && storyboardData.scenes.length > 0) {
        let cumulativeTime = 0;
        storyboardData.scenes.forEach((scene, index) => {
          const wCount = scene.text ? scene.text.split(/\s+/).length : 6;
          const dur = Math.max(3, parseFloat((wCount / 2.5).toFixed(1)));
          const nextTime = cumulativeTime + dur;
          contentLines.push(`  Cảnh ${index + 1}: Phân bổ [${cumulativeTime.toFixed(1)}s -> ${nextTime.toFixed(1)}s] | Thời lượng: ${dur} giây | Lời thoại khớp`);
          cumulativeTime = nextTime;
        });
      } else {
        contentLines.push("Chưa chia cảnh. Timing sheet trống.");
      }
    } else if (frameId === "07") {
      stepNum = "FRAME #07";
      stepTitle = "TỐI ƯU HÓA METADATA SEO & CTR VIDEO";
      statsHeader = `Mật độ từ khóa vàng: 1.5% - 2.5% | Kích hoạt thuật toán đề xuất YouTube`;
      contentLines = [
        "TIÊU ĐỀ VIDEO THU HÚT CLICK CHUẨN SEO:",
        `  "${seoData?.seoTitle || "Chưa tạo tiêu đề SEO"}"`,
        "",
        "TAGS NỔI BẬT ĐƯỢC CHÈN DƯỚI ĐUÔI MÔ TẢ:",
        `  - Từ khóa chính: ${seoData?.tags?.primaryKeyword || "Chưa có"}`,
        `  - Từ khóa phụ: ${seoData?.tags?.secondaryKeyword || "Chưa có"}`,
        `  - Thẻ kênh: ${seoData?.tags?.channelTag || "Chưa có"}`,
        `  - Thẻ đối thủ: ${seoData?.tags?.competitorTags?.join(", ") || "Chưa có"}`,
        "",
        "MÔ TẢ SEO CHI TIẾT (SEO DESCRIPTION):",
        `  ${(seoData?.seoDescription || "Chưa tạo mô tả SEO").slice(0, 150)}...`
      ];
    } else if (frameId === "08") {
      stepNum = "FRAME #08";
      stepTitle = "KỊCH BẢN SEEDING MỒI TƯƠNG TÁC";
      statsHeader = `Kỹ thuật châm ngòi thảo luận lành mạnh | Thúc đẩy CTR và thời lượng xem trung bình`;
      
      const supporterText = seoData?.seedingComments?.find(c => c.accountType.includes("Đồng tình") || c.accountType.includes("supporter") || c.accountType.includes("Fan"))?.commentText || seoData?.seedingComments?.[0]?.commentText || "Thật hào hùng! Tự hào dòng máu sử Việt oai hùng!";
      const skepticText = seoData?.seedingComments?.find(c => c.accountType.includes("Tranh luận") || c.accountType.includes("skeptic") || c.accountType.includes("Phản biện"))?.commentText || seoData?.seedingComments?.[1]?.commentText || "Thực ra dã sử đoạn này vẫn còn nhiều tranh cãi lắm, nhưng video làm đỉnh thật.";
      const questionerText = seoData?.seedingComments?.find(c => c.accountType.includes("Hỏi") || c.accountType.includes("questioner") || c.accountType.includes("Nghi vấn"))?.commentText || seoData?.seedingComments?.[2]?.commentText || "Cho mình hỏi chi tiết đoạn 01:10 là sử sách nào chép vậy ạ?";
      const summarizerText = seoData?.seedingComments?.find(c => c.accountType.includes("Tóm tắt") || c.accountType.includes("summarizer") || c.accountType.includes("Mốc giờ"))?.commentText || seoData?.seedingComments?.[3]?.commentText || "00:00 - Hook lôi cuốn, 00:25 - Nguồn gốc dã sử, 01:15 - Kết luận hào hùng!";

      contentLines = [
        "4 NHÂN CÁCH BÌNH LUẬN ĐỒNG BỘ GHIM ĐẦU TRANG VIDEO:",
        "",
        "  1. ĐỒNG TÌNH SÂU SẮC (Fan trung thành):",
        `     - "${supporterText}"`,
        "  2. TRANH LUẬN ĐA CHIỀU (Tạo bão tương tác):",
        `     - "${skepticText}"`,
        "  3. TRẢ LỜI NGHI VẤN (Tìm hiểu kiến thức):",
        `     - "${questionerText}"`,
        "  4. TỐM TẮT DÒNG THỜI GIAN (Hỗ trợ người xem):",
        `     - "${summarizerText}"`
      ];
    } else if (frameId === "workflow") {
      stepNum = "FRAME #WF";
      stepTitle = "CẨM NANG VẬN HÀNH QUY TRÌNH";
      statsHeader = `Hành trình chế tác video Shorts/Long chuyên nghiệp 2026`;
      contentLines = [
        "CÁC BƯỚC THỰC CHIẾN ĐỂ ĐẠT TRIỆU VIEW NHANH CHÓNG:",
        "- Lịch đăng bài: Định kỳ hàng ngày lúc 11:30 hoặc 19:30.",
        "- Hướng dẫn dựng siêu tốc bằng CapCut:",
        "  1. Nhập âm thanh thuyết minh lồng tiếng vào CapCut.",
        "  2. Sắp xếp dải ảnh minh họa AI tương ứng từng mốc giây trong Timing Sheet.",
        "  3. Dùng tính năng Auto Captions (Phụ đề tự động) của CapCut, chọn phông chữ dày nổi bật.",
        "  4. Áp dụng hiệu ứng Ken Burns (Chuyển động zoom nhẹ từng ảnh tĩnh).",
        "  5. Thêm tiếng hiệu ứng (Sound Effect) chuyển phân cảnh khớp với hình ảnh.",
        "  6. Đắp nhạc nền dã sử lịch sử hào hùng, dồn dập (Giảm âm lượng xuống -15dB).",
        "- Seeding: Copy & dán 4 bình luận mồi, ghim bình luận mồi lên đầu ngay sau khi đăng công khai."
      ];
    }

    // 5. Draw Header Step Tags
    ctx.fillStyle = "#dc2626"; // Crimson
    ctx.beginPath();
    ctx.roundRect(45, 85, 115, 26, 4);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillText(stepNum, 60, 102);

    // Step Title text
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 23px 'Inter', sans-serif";
    ctx.fillText(stepTitle, 175, 105);

    // Draw parameters sub-bar
    ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
    ctx.beginPath();
    ctx.roundRect(45, 125, canvas.width - 90, 32, 6);
    ctx.fill();

    ctx.fillStyle = "#38bdf8"; // Sky blue
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.fillText(`📊 CHỈ SỐ VẬN HÀNH THỜI GIAN THỰC: ${statsHeader}`, 60, 145);

    // 6. Draw Main Content Frame Box
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)"; // transparent slate-900
    ctx.strokeStyle = "rgba(51, 65, 85, 0.45)"; // slate-700 border
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(45, 175, canvas.width - 90, 525, 10);
    ctx.fill();
    ctx.stroke();

    // 7. Write Content Lines in Box
    let currentY = 210;
    const paddingLeft = 70;
    const maxTextWidth = canvas.width - 140;
    const lineHeight = 24;

    contentLines.forEach(line => {
      // Styling logic for lines inside canvas
      if (line.endsWith(":") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("👉") || line.startsWith("CÁC BƯỚC")) {
        ctx.fillStyle = "#facc15"; // gold headings
        ctx.font = "bold 14px 'Inter', sans-serif";
        currentY += 8;
      } else if (line.startsWith("   -") || line.startsWith("     -") || line.startsWith("  ")) {
        ctx.fillStyle = "#cbd5e1"; // lighter gray for lists
        ctx.font = "500 13px 'Inter', sans-serif";
      } else if (line.trim().startsWith("\"") && line.trim().endsWith("\"")) {
        ctx.fillStyle = "#38bdf8"; // highlighted quotes
        ctx.font = "italic 500 14px 'Inter', sans-serif";
        currentY += 4;
      } else {
        ctx.fillStyle = "#cbd5e1"; // normal text
        ctx.font = "500 13.5px 'Inter', sans-serif";
      }

      currentY = wrapText(ctx, line, paddingLeft, currentY, maxTextWidth, lineHeight);
      currentY += 2;
    });

    // 8. Footer credits
    ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
    ctx.font = "bold 9.5px 'Inter', sans-serif";
    ctx.fillText("BẢN QUYỀN HỆ THỐNG THUỘC VỀ YOUTUBE WORKSPACE 2026 AI CO-OP ENGINE • HOÀN TOÀN TỰ ĐỘNG", 45, 735);
    ctx.fillText("HỒ SƠ KHUNG HÌNH VẬN HÀNH - ĐẴNG CẤP KỸ THUẬT TRIỆU VIEW YOUTUBE SHORTS", 45, 752);

    // Crimson horizontal line at bottom
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(45, 770, canvas.width - 90, 3);

    // 9. Download PNG
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `youtube_workspace_frame_${frameId}_report.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error drawing frame image", err);
    }
  };

  // Export all frames in a clean sequence
  const downloadAllFramesAsImages = () => {
    const frames = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "workflow"];
    frames.forEach((fid, index) => {
      setTimeout(() => {
        downloadFrameAsImage(fid);
      }, index * 400); // 400ms interval between downloads to satisfy browser download gates safely
    });
  };

  // Tính toán số liệu trực quan thực tế từ phiên làm việc
  const countWords = (text: string) => text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const countSentences = (text: string) => {
    if (!text) return 0;
    const rawParts = text.split(/\r?\n/);
    const sentences: string[] = [];
    for (const part of rawParts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;
      
      // Thay thế tạm thời dấu chấm trong số (e.g. 40.000 hoặc 3.14) bằng placeholder __NUM_DOT__
      let masked = trimmedPart.replace(/(\d)\.(\d)/g, "$1__NUM_DOT__$2");
      
      // Thay thế một số từ viết tắt thông dụng có chứa dấu chấm để tránh bị chia nhầm câu
      masked = masked.replace(/\b(T[Pp])\.(HCM|HN)\b/gi, "$1__DOT__$2");
      masked = masked.replace(/\b(S\.)(O\.)(S)\b/gi, "$1__DOT__$2__DOT__$3");
      masked = masked.replace(/\b(U\.)(S\.)(A)\b/gi, "$1__DOT__$2__DOT__$3");
      masked = masked.replace(/\b(V\.)(I\.)(P)\b/gi, "$1__DOT__$2__DOT__$3");
      masked = masked.replace(/\b(Mr|Mrs|Dr|Ms|Vs|Est|Approx)\./gi, "$1__DOT__");
      
      const matches = masked.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
      if (matches) {
        for (const m of matches) {
          let item = m.trim();
          if (item) {
            item = item.replace(/__NUM_DOT__/g, ".").replace(/__DOT__/g, ".");
            sentences.push(item);
          }
        }
      } else {
        sentences.push(trimmedPart);
      }
    }

    // Với các câu thoại dài, ta tự động chia nhỏ mượt mà thành 2-3 câu thoại hợp lý
    const finalSentences: string[] = [];
    for (const s of sentences) {
      const words = s.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      
      if (wordCount > 15) {
        const parts = s.split(/(?:,\s+and\s+|,\s+but\s+|;\s+|:\s+|,\s+which\s+|,\s+while\s+)/gi);
        if (parts.length > 1) {
          for (let i = 0; i < parts.length; i++) {
            let chunk = parts[i].trim();
            if (chunk) {
              if (i === 0) {
                chunk = chunk.charAt(0).toUpperCase() + chunk.slice(1);
              }
              if (i < parts.length - 1) {
                chunk = chunk + "...";
              }
              finalSentences.push(chunk);
            }
          }
        } else {
          const subparts = s.split(/,\s+/);
          if (subparts.length > 1) {
            let currentChunk = "";
            for (let i = 0; i < subparts.length; i++) {
              const subVal = subparts[i].trim();
              if (!subVal) continue;
              if (!currentChunk) {
                currentChunk = subVal;
              } else {
                const temp = currentChunk + ", " + subVal;
                if (temp.split(/\s+/).filter(Boolean).length > 12) {
                  finalSentences.push(currentChunk + "...");
                  currentChunk = subVal.charAt(0).toUpperCase() + subVal.slice(1);
                } else {
                  currentChunk = temp;
                }
              }
            }
            if (currentChunk) {
              finalSentences.push(currentChunk);
            }
          } else {
            if (wordCount > 18) {
              const mid = Math.floor(wordCount / 2);
              const firstHalf = words.slice(0, mid).join(" ") + "...";
              let secondHalf = words.slice(mid).join(" ");
              secondHalf = secondHalf.charAt(0).toUpperCase() + secondHalf.slice(1);
              finalSentences.push(firstHalf);
              finalSentences.push(secondHalf);
            } else {
              finalSentences.push(s);
            }
          }
        }
      } else {
        finalSentences.push(s);
      }
    }

    // Áp dụng gộp thông minh
    const mergedSentences: string[] = [];
    const transitionPrefixes = [
      "bởi vì", "trong phần lớn lịch sử", "ngày nay", "tuy nhiên", "nhưng", "vì thế", "ví dụ", "hơn nữa", "do đó", "bên cạnh đó", "nói cách khác", "thật vậy", "tóm lại", "bỗng nhiên", "chính vì vậy", "trước hết", "sau đó", "cuối cùng",
      "because", "but", "however", "today", "for most of history", "therefore", "thus", "in addition", "furthermore", "in other words", "indeed", "suddenly", "first of all", "then", "finally"
    ];

    for (let i = 0; i < finalSentences.length; i++) {
      const current = finalSentences[i].trim();
      if (!current) continue;

      const words = current.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const lowerCurrent = current.toLowerCase();

      const isTransition = transitionPrefixes.some(pref => {
        const cleanPref = pref.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
        const cleanCurrent = lowerCurrent.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
        return cleanCurrent.startsWith(cleanPref);
      });

      const shouldMerge = wordCount <= 4 || (isTransition && wordCount <= 7);

      if (shouldMerge && i < finalSentences.length - 1) {
        let next = finalSentences[i + 1].trim();
        let separator = " ";
        if (!current.endsWith(",") && !current.endsWith("...") && !current.endsWith("-") && !current.endsWith("—")) {
          separator = ", ";
        }
        if (next) {
          const firstChar = next.charAt(0);
          if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
            next = firstChar.toLowerCase() + next.slice(1);
          }
        }
        finalSentences[i + 1] = current + separator + next;
      } else if (shouldMerge && mergedSentences.length > 0) {
        const prevIdx = mergedSentences.length - 1;
        let prev = mergedSentences[prevIdx];
        let separator = " ";
        if (!prev.endsWith(",") && !prev.endsWith("...") && !prev.endsWith(".") && !prev.endsWith("!") && !prev.endsWith("?")) {
          separator = ", ";
        }
        mergedSentences[prevIdx] = prev + separator + current;
      } else {
        mergedSentences.push(current);
      }
    }

    return mergedSentences.length;
  };

  const stats = {
    transcriptChars: rawTranscript.length,
    transcriptWords: countWords(rawTranscript),
    standardizedChars: standardizedScript.length,
    standardizedWords: countWords(standardizedScript),
    sentencesCount: countSentences(standardizedScript || rawTranscript),
    hasHook: !!chosenHookText,
    sceneCount: storyboardData?.scenes?.length || 0,
    promptCount: storyboardData?.scenes?.reduce((acc, scene) => acc + (scene.imagePrompts?.length || 0), 0) || 0,
    hasVoice: !!generatedAudio,
    hasSeo: !!seoData,
    characterConfigured: !!characterDescription,
  };

  const stepsDetails = [
    {
      id: "01",
      name: "Chuẩn Hóa Kịch Bản Gốc (Script Processing)",
      technicalObjective: "Lọc bỏ tạp âm dữ liệu thô (metadata, timestamps, tiếng thở, khẩu hình lặp) từ YouTube Transcript, chuyển hóa thành văn bản tiếng Việt chuẩn, mạch lạc, chính xác ngữ pháp 2026.",
      microOperations: [
        "Nhận dạng định dạng tệp thô: Kiểm tra xem văn bản đầu vào là dạng chuỗi thời gian SRT, TXT thô hay JSON lồng tiếng phụ đề.",
        "Xử lý chuỗi (String Sanity check): Sử dụng Regex loại bỏ các dòng có cấu trúc thời gian (như '00:12', '-->') và các nhãn tiếng động phụ như '[Laughter]', '[Music]', '(tiếng cười)'.",
        "Bộ đếm từ và tách từ (Tokenization & Word Count): Đo lường độ dài ký tự và số từ để ước tính thời lượng video (trung bình 150-180 từ/phút cho tiếng Việt).",
        "Gửi lệnh API Gemini (Zero-shot Restructuring): Yêu cầu AI sắp xếp lại bố cục, bổ sung dấu chấm câu hợp lý, ngắt dòng khoa học mà không làm thay đổi nội dung thông điệp chính.",
        "Kiểm lỗi chính tả tự động: AI kiểm tra các lỗi gõ Telex/VNI phổ biến hoặc lỗi viết tắt vùng miền để đảm bảo bộ TTS (Text-to-Speech) phát âm tròn vành rõ chữ.",
        "Đồng bộ hóa cache cục bộ: Ghi đè trạng thái 'standardizedScript' lên bộ nhớ tạm LocalStorage để tránh mất dữ liệu khi trình duyệt tải lại đột ngột."
      ],
      underTheHood: "Dữ liệu được làm sạch thông qua thuật toán Regex quét 3 tầng. Sau đó, một Prompt định dạng cấu trúc JSON nghiêm ngặt được gửi đến mô hình Gemini 1.5 Flash / Pro, yêu cầu bảo toàn tuyệt đối danh từ riêng, thuật ngữ chuyên ngành và tái cấu trúc ngắt câu thông minh bằng cặp dấu xuống dòng kép (\\n\\n).",
      input: "Văn bản phụ đề dính liền, không dấu câu, lẫn lộn mốc thời gian (ví dụ: 'chào các bạn 00:03 hôm nay chúng ta sẽ nói về tần thủy hoàng')",
      output: "Đoạn văn hoàn chỉnh có chấm phẩy, phân đoạn rõ ràng: 'Chào các bạn. Hôm nay, chúng ta sẽ cùng khám phá cuộc đời đầy bí ẩn của Tần Thủy Hoàng.'",
      status: stats.standardizedChars > 0 ? "Completed" : "Idle"
    },
    {
      id: "02",
      name: "Viết Lại Hook Siêu Giữ Chân (Retention Engineering)",
      technicalObjective: "Phân tích nội dung cốt lõi của kịch bản đã chuẩn hóa, chế tác câu mở đầu (3-5 giây đầu) cực kỳ giật gân, khơi gợi tò mò tột độ nhằm tăng chỉ số Retention Rate của YouTube.",
      microOperations: [
        "Phân tích từ khóa (Semantic Keyword Extraction): AI trích xuất các thực thể chính (nhân vật lịch sử, mốc sự kiện, yếu tố thần kỳ) để làm chất liệu giật tít.",
        "Tạo biến thể Hook theo 4 nhóm tâm lý học hành vi khán giả: Shocking (Gây sốc), Question (Câu hỏi tu từ), Statistical-Driven (Dựa trên số liệu lạ lùng), Storytelling (Mở đầu bằng nghịch cảnh).",
        "Đánh giá điểm hiệu năng giữ chân: AI giả lập điểm CTR dựa trên tập hợp từ khóa cấm kỵ (những từ bị YouTube bóp reach) để tối ưu tính an toàn.",
        "Tích hợp Hook vào thân bài: Cắt bỏ 1-2 câu mở đầu cũ của kịch bản gốc và ghép nối mềm mại biến thể Hook mới được chọn vào, đảm bảo nhịp đọc liền mạch.",
        "Cập nhật cấu trúc giọng đọc: Đánh dấu điểm nhấn giọng (nhấn âm lượng, tốc độ chậm hơn ở câu Hook) để báo hiệu cho phần mềm thâu âm AI."
      ],
      underTheHood: "Hệ thống áp dụng thư viện mẫu gồm hơn 100 cấu trúc câu giật gân thành công nhất năm 2026. Mô hình Gemini sẽ thực thi phân tích đối chiếu ngữ nghĩa (Semantic Matching) để sinh ra 4 tùy chọn có tỷ lệ chuyển đổi cao nhất, sau đó hiển thị dạng lưới trực quan cho người dùng chọn lựa hoặc tự động áp dụng tùy chọn xuất sắc nhất.",
      input: "Nội dung chuẩn hóa đầu tiên: 'Tần Thủy Hoàng là hoàng đế đầu tiên của Trung Hoa cổ đại. Ông sinh năm...'",
      output: "Hook bùng nổ: 'Bí mật kinh hoàng nằm sâu bên trong lăng mộ Tần Thủy Hoàng đã bị che giấu suốt 2,000 năm qua. Điều gì khiến cả thế giới run sợ khi khai quật?'",
      status: stats.hasHook ? "Completed" : "Idle"
    },
    {
      id: "03",
      name: "Chia Phân Cảnh & Camera Prompt (Storyboard Segmentation)",
      technicalObjective: "Tự động phân tách kịch bản lớn thành các phân đoạn nhỏ độc lập, bám sát ranh giới câu thoại và tự động biên dịch sang tiếng Anh chuyên sâu cho AI vẽ ảnh.",
      microOperations: [
        "Xử lý phân tách kịch bản nâng cao: Quét toàn bộ kịch bản và chia tách theo từng câu thoại hoặc nhóm câu (Dialogue Split Engine) dựa trên cấu hình 'dialogueGroupSize'.",
        "Trích xuất bối cảnh (Entity Recognition): Xác định nhân vật chính, thời kỳ, địa danh, vật thể xuất hiện trong từng câu thoại cụ thể.",
        "Biên dịch & Tối ưu hóa ngôn ngữ vẽ (Camera Prompting): Dịch ngữ nghĩa câu thoại sang prompt tiếng Anh kết hợp các yếu tố điện ảnh như góc máy, ánh sáng, phong cách nghệ thuật.",
        "Bơm mô tả nhân vật đồng nhất (Character Reference Injection): Nếu người dùng cấu hình 'characterDescription', hệ thống sẽ tự động ghép mô tả này vào đầu tất cả các prompt vẽ để giữ nguyên diện mạo nhân vật từ đầu đến cuối.",
        "Hợp nhất bộ phân cảnh (Storyboard Compiling): Trả về cấu trúc mảng JSON hoàn chỉnh chứa: số thứ tự cảnh, câu thoại tiếng Việt tương ứng, prompt tiếng Anh và gợi ý góc máy điện ảnh."
      ],
      underTheHood: "Thuật toán Sequential Chunking chia văn bản dựa trên điểm kết thúc câu. Để tránh tràn token và lỗi định dạng JSON, hệ thống sử dụng cơ chế đúc kịch bản có lề (Strict Padding Parsing). Prompt vẽ ảnh được thiết kế theo chuẩn: [Subject Detail] + [Environment/Background] + [Shot type: e.g. Close-up, Wide shot] + [Camera lens: e.g. Anamorphic 35mm] + [Lighting: e.g. volumetric, rim lighting] + [Art style: e.g. cinematic concept art, dark historical realism].",
      input: "Câu thoại tiếng Việt: 'Vị vua trẻ đứng lặng người trước biển lửa đỏ rực gào thét.'",
      output: "Prompt vẽ tiếng Anh: 'A young ancient king standing in shock, facing a roaring massive sea of red fire, dramatic volumetric smoke, backlighting, extreme close-up shot, cinematic style, 8k resolution, photorealistic --ar 16:9'",
      status: stats.sceneCount > 0 ? "Completed" : "Idle"
    }
  ];

  const generateFullReportMarkdown = () => {
    let md = `# BÁO CÁO VẬN HÀNH CHI TIẾT - QUY TRÌNH 3 BƯỚC TRIỆU VIEW 2026\n\n`;
    md += `*Ngày báo cáo: ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN")}*\n`;
    md += `*Hệ thống: YouTube Workspace 2026 AI Engine*\n\n`;
    md += `=======================================================\n\n`;

    md += `## BƯỚC 1: SƠ CHẾ & CHUẨN HÓA KỊCH BẢN PHỤ ĐỀ\n`;
    md += `### 1. Phân Tích Thống Kê\n`;
    md += `- Ký tự Transcript gốc: ${stats.transcriptChars} ký tự (~${stats.transcriptWords} từ)\n`;
    md += `- Ký tự Kịch bản sạch: ${stats.standardizedChars} ký tự (~${stats.standardizedWords} từ)\n\n`;
    md += `### 2. Kịch Bản Thô (Raw Transcript)\n`;
    md += `${rawTranscript || "Chưa có dữ liệu thô."}\n\n`;
    md += `### 3. Kịch Bản Sạch Sau Chuẩn Hóa (Standardized Script)\n`;
    md += `${standardizedScript || "Chưa thực hiện chuẩn hóa."}\n\n`;
    md += `=======================================================\n\n`;

    md += `## BƯỚC 2: CHẾ TÁC HOOK GIỮ CHÂN KHÁNG GIẢ\n`;
    md += `### 1. Mục Tiêu Kỹ Thuật\n`;
    md += `Gia tăng tối đa Retention Rate trong 3-5 giây đầu tiên bằng cách giật tít, khơi gợi tò mò.\n\n`;
    md += `### 2. Hook Đã Chọn\n`;
    md += `${chosenHookText || "Chưa chọn/thiết lập Hook."}\n\n`;
    md += `=======================================================\n\n`;

    md += `## BƯỚC 3: PHÂN CẢNH CHI TIẾT & CAMERA PROMPT\n`;
    md += `### 1. Cấu Hình Đồng Nhất Nhân Vật\n`;
    md += `Mô tả nhân vật: ${characterDescription || "Chưa thiết lập mô tả đồng nhất."}\n\n`;
    md += `### 2. Chi Tiết Từng Phân Cảnh (Storyboard)\n`;
    
    if (storyboardData && storyboardData.scenes && storyboardData.scenes.length > 0) {
      storyboardData.scenes.forEach((scene, index) => {
        md += `#### CẢNH ${index + 1}\n`;
        md += `- **Lời thoại (VI):** ${scene.text || ""}\n`;
        md += `- **Góc máy & Mô tả (EN):** ${scene.visualDescription || ""}\n`;
        if (scene.imagePrompts && scene.imagePrompts.length > 0) {
          md += `- **Image Prompts cho AI:**\n`;
          scene.imagePrompts.forEach((p, pIdx) => {
            md += `  * Prompt ${pIdx + 1} (${p.vietnameseLabel}): \`${p.englishPrompt}\`\n`;
          });
        }
        md += `\n`;
      });
    } else {
      md += `Chưa có dữ liệu phân cảnh.\n`;
    }
    
    md += `\n=======================================================\n`;
    md += `*Báo cáo được xuất tự động từ YouTube Workspace 2026 v2.5.0-Release*`;
    return md;
  };

  return (
    <div id="detailed-report-container" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* HEADER BÁO CÁO */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 text-red-650 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                Hồ Sơ Vận Hành & Báo Cáo Kỹ Thuật Chi Tiết
                <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">VIP SYSTEM REPORT</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Bóc tách toàn diện quy trình xử lý, thuật toán chạy ngầm và dữ liệu vận hành thực tế của hệ thống.</p>
            </div>
          </div>
        </div>

        {/* SUB TABS */}
        <div className="flex p-0.5 bg-slate-200/80 rounded-xl self-start sm:self-center">
          <button
            onClick={() => {
              setActiveSubTab("pipeline");
              if (typeof window !== "undefined" && (window as any).playSound) (window as any).playSound("click");
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "pipeline" ? "bg-white text-indigo-700 shadow-3xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Sơ Đồ Luồng (Visual Flow)
          </button>
          <button
            onClick={() => {
              setActiveSubTab("micro");
              if (typeof window !== "undefined" && (window as any).playSound) (window as any).playSound("click");
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "micro" ? "bg-white text-red-600 shadow-3xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Quy Trình 3 Bước (Micro)
          </button>
          <button
            onClick={() => {
              setActiveSubTab("session");
              if (typeof window !== "undefined" && (window as any).playSound) (window as any).playSound("click");
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "session" ? "bg-white text-emerald-700 shadow-3xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Giám Sát Phiên (Live Monitor)
          </button>
          <button
            onClick={() => {
              setActiveSubTab("export");
              if (typeof window !== "undefined" && (window as any).playSound) (window as any).playSound("click");
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "export" ? "bg-white text-red-600 shadow-3xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            Xuất Bản Khung Hình (PDF/Ảnh)
          </button>
        </div>
      </div>

      {/* QUICK COPY BANNER */}
      <div id="quick-copy-banner" className="px-5 py-3.5 bg-red-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <span className="text-xs text-red-800 font-bold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-red-600 animate-pulse" />
          Nhận ngay bản sao đầy đủ kịch bản, Hook và phân cảnh chi tiết định dạng Markdown của bạn.
        </span>
        <button
          onClick={() => handleCopy(generateFullReportMarkdown(), "full-report")}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          {copiedText === "full-report" ? (
            <>
              <Check className="w-4 h-4 text-white" />
              ĐÃ SAO CHÉP THÀNH CÔNG!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              SAO CHÉP NHANH FULL REPORT
            </>
          )}
        </button>
      </div>

      {/* VIEWPORT NỘI DUNG CHÍNH */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* ================= TAB 1: SƠ ĐỒ LUỒNG VẬN HÀNH ================= */}
        {activeSubTab === "pipeline" && (
          <div className="space-y-6 animate-fade-in">
            {/* GIỚI THIỆU TỔNG QUAN VỀ HỆ THỐNG */}
            <div className="bg-gradient-to-br from-indigo-50/40 to-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4 items-start">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-3xs">
                <Cpu className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Cơ Chế Vận Hành Tuyến Tính - Song Song Hợp Nhất</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Hệ thống được thiết kế theo mô hình <b>Pipeline tuyến tính kết hợp đa luồng song song</b>. 
                  Khi chạy tự động hóa hoặc thực hiện thủ công, dữ liệu thô (Raw Data) được biến đổi liên tục qua 3 trạm xử lý trung gian thiết yếu. 
                  Mỗi bước đều có chốt kiểm định chất lượng (Gate Quality) trước khi truyền trạng thái sang bước tiếp theo, đảm bảo tính đồng nhất tối đa về nội dung, cấu trúc và phân cảnh.
                </p>
              </div>
            </div>

            {/* PIPELINE SƠ ĐỒ ĐỒ HỌA TRỰC QUAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
              
              {/* LINE KẾT NỐI NGẦM (CHỈ TRÊN DESKTOP) */}
              <div className="absolute top-[55px] left-[15%] right-[15%] h-0.5 bg-dashed border-t-2 border-slate-200 hidden md:block z-0"></div>

              {/* BƯỚC 1 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3.5 shadow-3xs relative z-10 hover:border-indigo-400 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">BƯỚC 1</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${stats.standardizedChars > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {stats.standardizedChars > 0 ? "HOÀN THÀNH" : "CHỜ SƠ CHẾ"}
                  </span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase">SƠ CHẾ & CHUẨN HÓA SCRIPT</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">Nhận dạng Transcript gốc, bóc tách mốc thời gian, loại bỏ tiếng thở/nhiễu thô, chuẩn hóa chính tả bằng AI.</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-[9px] font-mono text-slate-500 space-y-0.5">
                  <div>INPUT: Phụ đề thô dính liền</div>
                  <div>OUTPUT: Kịch bản sạch chuẩn tiếng Việt</div>
                </div>
              </div>

              {/* BƯỚC 2 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3.5 shadow-3xs relative z-10 hover:border-red-400 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">BƯỚC 2</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${stats.hasHook ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {stats.hasHook ? "HOÀN THÀNH" : "CHỜ CHỌN HOOK"}
                  </span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase">HOOK GIỮ CHÂN RETENTION</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">Sáng chế 4 nhóm Hook gây tò mò tột bực cho 3 giây đầu tiên của video để giữ chân khán giả không vuốt qua.</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-[9px] font-mono text-slate-500 space-y-0.5">
                  <div>INPUT: Thân kịch bản sạch</div>
                  <div>OUTPUT: Tiêu điểm mở đầu lôi cuốn</div>
                </div>
              </div>

              {/* BƯỚC 3 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3.5 shadow-3xs relative z-10 hover:border-amber-400 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">BƯỚC 3</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${stats.sceneCount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {stats.sceneCount > 0 ? "HOÀN THÀNH" : "CHỜ PHÂN CẢNH"}
                  </span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase">PHÂN CẢNH & ENGLISH PROMPTS</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">Băm kịch bản theo câu lồng tiếng, đồng nhất nhân vật lịch sử và biên dịch camera prompts điện ảnh sang tiếng Anh.</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-[9px] font-mono text-slate-500 space-y-0.5">
                  <div>INPUT: Kịch bản hoàn thiện</div>
                  <div>OUTPUT: Storyboard & Prompts vẽ ảnh AI</div>
                </div>
              </div>

            </div>

            {/* BẢN ĐỒ KIẾN TRÚC MÁY CHỦ BẢO MẬT */}
            <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Server className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Cơ Chế Bảo Mật & Quản Lý Khóa Bí Mật Server-Side Proxy</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Đảm bảo an toàn tuyệt đối tài nguyên của nhà phát triển và người dùng.</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                Toàn bộ các yêu cầu liên quan đến trí tuệ nhân tạo (Imagen 4.0, mô hình hội thoại Gemini 1.5 Flash/Pro, TTS thâu âm) 
                đều được thực hiện thông qua <b>kiến trúc Server-Side Proxy bảo mật</b>. 
                Khóa bí mật <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10.5px]">GEMINI_API_KEY</code> 
                và các mã token tuyệt mật không bao giờ bị phơi bày ra phía trình duyệt Client. 
                Mọi gói tin truyền qua mạng đều được mã hóa SSL/TLS tiêu chuẩn cao để chống đánh cắp dữ liệu.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1.5">
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Client Web Browser</span>
                  <p className="text-[10.5px] text-slate-400 font-medium leading-normal">Chỉ nhận kết quả an toàn (Text sạch, link ảnh Base64, Audio thô). Không lưu trữ khóa API.</p>
                </div>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-indigo-400 block uppercase font-bold">Secure Server Controller</span>
                  <p className="text-[10.5px] text-slate-400 font-medium leading-normal">Tiếp nhận lệnh, xác thực, tiêm API Key từ biến môi trường của Cloud và gửi đi an toàn.</p>
                </div>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">Google AI Endpoint</span>
                  <p className="text-[10.5px] text-slate-400 font-medium leading-normal">Xử lý các tác vụ học máy mô hình lớn có bản quyền, trả về luồng dữ liệu thô nhị phân an toàn.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: TÁC VỤ VI MÔ CHI TIẾT ================= */}
        {activeSubTab === "micro" && (
          <div className="space-y-6 animate-fade-in">
            {stepsDetails.map((step, index) => (
              <div key={step.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs hover:shadow-2xs transition-all">
                {/* TIÊU ĐỀ BƯỚC */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-red-600 text-white font-mono font-black text-xs flex items-center justify-center">
                      {step.id}
                    </span>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      {step.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 font-mono">STEP_GATEWAY_V1</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      step.status === "Completed" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${step.status === "Completed" ? "bg-emerald-500 animate-pulse" : "bg-slate-450 bg-slate-400"}`}></span>
                      {step.status === "Completed" ? "HOÀN TẤT THỰC TẾ" : "CHỜ TRẠM"}
                    </span>
                  </div>
                </div>

                {/* THÔNG TIN CHI TIẾT */}
                <div className="p-4.5 space-y-4 text-xs leading-relaxed">
                  
                  {/* MỤC TIÊU KỸ THUẬT */}
                  <div className="space-y-1">
                    <h4 className="text-[10.5px] font-black text-slate-500 uppercase tracking-widest">🎯 Mục tiêu kỹ thuật cốt lõi:</h4>
                    <p className="text-slate-700 font-semibold">{step.technicalObjective}</p>
                  </div>

                  {/* CÁC TÁC VỤ VI MÔ */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10.5px] font-black text-slate-500 uppercase tracking-widest">⚙️ Quy trình xử lý vi mô (Micro-tasks chi tiết nhất):</h4>
                    <ul className="space-y-2 pl-4">
                      {step.microOperations.map((task, tidx) => (
                        <li key={tidx} className="list-decimal text-slate-650 font-medium">
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* THUẬT TOÁN CHẠY NGẦM */}
                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1.5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-slate-500" />
                      Mã hóa thuật toán / Cách thức vận hành ngầm:
                    </h4>
                    <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                      {step.underTheHood}
                    </p>
                  </div>

                  {/* BẢNG ĐẦU VÀO ĐẦU RA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5 border-t border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block">📥 Đầu vào dự kiến (Input standard):</span>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-[10.5px] text-slate-600 select-all overflow-x-auto whitespace-pre-wrap max-h-24">
                        {step.input}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center justify-between">
                        <span>📤 Đầu ra tiêu chuẩn (Output standard):</span>
                        <button 
                          onClick={() => handleCopy(step.output, `step-${step.id}`)}
                          className="text-[9.5px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                        >
                          {copiedText === `step-${step.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              Đã sao chép
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Sao chép mẫu
                            </>
                          )}
                        </button>
                      </span>
                      <div className="bg-emerald-50/40 border border-emerald-150 rounded-lg p-2.5 font-mono text-[10.5px] text-emerald-800 select-all overflow-x-auto whitespace-pre-wrap max-h-24">
                        {step.output}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= TAB 3: GIÁM SÁT REAL-TIME ================= */}
        {activeSubTab === "session" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* THÔNG SỐ BIẾN CẤU HÌNH PHIÊN */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-3xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Đầu Vào Transcript</span>
                <span className="text-xl font-black text-slate-800">{stats.transcriptChars.toLocaleString()} <span className="text-xs text-slate-400">Ký tự</span></span>
                <span className="text-[10px] text-slate-500 font-semibold block">Ước tính ~{stats.transcriptWords.toLocaleString()} từ sạch</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-3xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Kịch Bản Chuẩn Hóa</span>
                <span className="text-xl font-black text-slate-800">{stats.standardizedChars.toLocaleString()} <span className="text-xs text-slate-400">Ký tự</span></span>
                <span className="text-[10px] text-slate-500 font-semibold block">Tỉ lệ biến đổi: {stats.transcriptChars > 0 ? Math.round((stats.standardizedChars / stats.transcriptChars) * 100) : 0}%</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-3xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Phân Cảnh Storyboard</span>
                <span className="text-xl font-black text-slate-800">{stats.sceneCount} <span className="text-xs text-slate-400">Cụm cảnh</span></span>
                <span className="text-[10px] text-slate-500 font-semibold block">Tổng số prompts: {stats.promptCount} ảnh</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-3xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Phân Nhóm Câu Thoại</span>
                <span className="text-xl font-black text-slate-800">{dialogueGroupSize === 0 ? "AI Tự Chia" : `${dialogueGroupSize} Câu`}</span>
                <span className="text-[10px] text-slate-500 font-semibold block">Mật độ: {stats.sentencesCount} câu thoại</span>
              </div>

            </div>

            {/* LIVE SYSTEM HEALTH (HIỆU NĂNG GIẢ LẬP) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* PHIÊN BẢN ENGINE */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  Cấu Hình Máy Chủ & Engine
                </h4>
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span>Phiên bản API Gateway:</span>
                    <span className="font-mono text-slate-800">v2.5.0-Release</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span>Mô Hình Phân Cảnh:</span>
                    <span className="font-mono text-slate-800">Gemini 1.5 Flash (Default)</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span>Engine Tạo Ảnh:</span>
                    <span className="font-mono text-slate-800">Google Imagen 4.0 Studio</span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span>Kiến trúc lưu trữ:</span>
                    <span className="font-mono text-slate-800">LocalStorage Cache Buffer</span>
                  </div>
                </div>
              </div>

              {/* TRẠNG THÁI CACHE VÀ TÀI NGUYÊN KHỞI TẠO */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  Dung Lượng Bộ Nhớ Đệm
                </h4>
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span>Đồng nhất nhân vật:</span>
                    <span className={`font-mono ${stats.characterConfigured ? "text-emerald-600" : "text-slate-400"}`}>
                      {stats.characterConfigured ? "Đã ghim cấu hình" : "Trống"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span>Kích thước Script Cache:</span>
                    <span className="font-mono text-slate-800">
                      {Math.round((stats.standardizedChars * 2) / 1024 * 100) / 100} KB
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span>Tệp âm thanh WAV thuyết minh:</span>
                    <span className={`font-mono ${stats.hasVoice ? "text-emerald-600" : "text-slate-400"}`}>
                      {stats.hasVoice ? "Đã lưu đệm thuyết minh" : "Trống"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span>Trạng thái kết nối bot Telegram:</span>
                    <span className="font-mono text-slate-500">Chờ lệnh báo cáo</span>
                  </div>
                </div>
              </div>

              {/* THỜI GIAN THỰC TẾ & MONITOR */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Mốc Thời Gian & Hệ Thống
                </h4>
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span>Thời gian hệ thống:</span>
                    <span className="font-mono text-slate-800">{new Date().toLocaleTimeString("vi-VN")}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span>Luồng Tự Động Hóa:</span>
                    <span className={`font-bold font-mono ${isPlayingAutoPipeline ? "text-indigo-600 animate-pulse" : "text-slate-500"}`}>
                      {isPlayingAutoPipeline ? "ĐANG CHẠY..." : "DỪNG / CHỜ LỆNH"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span>Báo cáo Telegram:</span>
                    <span className="font-mono text-slate-800">Bật thông báo tự động</span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span>Trình giám sát CPU/GPU:</span>
                    <span className="font-mono text-emerald-600">Hoạt động bình thường</span>
                  </div>
                </div>
              </div>

            </div>

            {/* NHẬT KÝ HOẠT ĐỘNG THỰC TẾ TRONG PHIÊN */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-red-500" />
                    Bảng Giám Sát Nhật Ký Hoạt Động (Live Activity Logging Console)
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 font-mono">STDOUT_STREAM</span>
              </div>
              <div className="bg-black/95 text-slate-300 font-mono text-[10.5px] p-4.5 space-y-1.5 max-h-80 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-black">
                {autoPipelineLogs.length === 0 ? (
                  <div className="text-slate-500 italic">
                    [SYSTEM_INFO] Trình theo dõi đang ở chế độ chờ. Hãy kích hoạt "Chuỗi Tự Động Hóa" hoặc thao tác chỉnh sửa kịch bản để ghi nhận nhật ký vận hành thực tế tại đây.
                  </div>
                ) : (
                  autoPipelineLogs.map((log, idx) => {
                    let colorClass = "text-slate-300";
                    if (log.includes("✅")) colorClass = "text-emerald-400";
                    else if (log.includes("❌") || log.includes("[LỖI")) colorClass = "text-rose-400 font-bold";
                    else if (log.includes("🚀") || log.includes("🎉")) colorClass = "text-yellow-400 font-bold";
                    else if (log.includes("▶") || log.includes("Đang")) colorClass = "text-cyan-300";
                    else if (log.includes("⚠️")) colorClass = "text-amber-400";

                    return (
                      <div key={idx} className={`${colorClass} whitespace-pre-wrap`}>
                        {log}
                      </div>
                    );
                  })
                )}
                {isPlayingAutoPipeline && (
                  <div className="text-cyan-300 animate-pulse flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    [SYSTEM_INFO] Đang truyền luồng tác vụ...
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 4: TRÌNH KẾT XUẤT KHUNG HÌNH CHUYÊN NGHIỆP ================= */}
        {activeSubTab === "export" && (
          <div className="space-y-6 animate-fade-in print:hidden">
            
            {/* GIỚI THIỆU CHỨC NĂNG VÀ CÁC THAO TÁC CHÍNH */}
            <div className="bg-gradient-to-r from-red-600 to-indigo-700 text-white border border-slate-200 rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6">
                <Printer className="w-64 h-64" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                    <span className="text-[10px] font-mono font-black text-red-100 bg-red-800/60 px-2 py-0.5 rounded tracking-widest">MULTI-FORMAT EXPORTER v2.5</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight">TRUNG TÂM KẾT XUẤT KHUNG HÌNH & BÁO CÁO</h3>
                  <p className="text-xs text-red-100 leading-relaxed max-w-2xl font-medium">
                    Hệ thống tự động đồng bộ hóa và đóng gói tất cả các bước vận hành thành định dạng tài liệu bản vẽ khung hình (Frame Cards) sắc nét cao hoặc xuất file PDF trực tiếp để phục vụ lưu trữ và làm việc offline.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.print();
                      }
                    }}
                    className="px-5 py-3 bg-white text-red-700 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-red-600" />
                    XUẤT FILE PDF TOÀN BỘ
                  </button>
                  <button
                    onClick={downloadAllFramesAsImages}
                    className="px-5 py-3 bg-slate-900/40 hover:bg-slate-900/60 text-white font-extrabold text-xs rounded-xl shadow-md transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    TẢI LOẠT 10 ẢNH KHUNG HÌNH (PNG)
                  </button>
                </div>
              </div>
            </div>

            {/* BENTO-GRID PHÂN CẢNH KHUNG HÌNH TRỰC QUAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* CARD 0: NICHE */}
              <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">KHUNG #00</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">NICHE RESEARCH</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">00. Nghiên Cứu Ngách & Kênh</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Định hướng chủ đề, định vị kênh thương hiệu và thiết kế thẻ từ khóa SEO cốt lõi.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div className="truncate">Ngách: {nicheCategory === "historical-mysteries" ? "Bí ẩn lịch sử" : "Tùy chọn"}</div>
                    <div className="truncate">Tên kênh: {channelName || "Chưa đặt"}</div>
                    <div className="truncate">Keywords: {targetKeywords || "Chưa có"}</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("00")}
                  className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

              {/* CARD 1: SCRIPT */}
              <div className="bg-white border border-slate-200 hover:border-red-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-md">KHUNG #01</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">SCRIPT STANDARD</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">01. Sơ Chế & Kịch Bản Sạch</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Chuẩn hóa chính tả kịch bản chữ Việt, loại bỏ từ rác, mốc thời gian thừa dính transcript.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div>Gốc: {stats.transcriptChars.toLocaleString()} ký tự</div>
                    <div>Sạch: {stats.standardizedChars.toLocaleString()} ký tự</div>
                    <div className="truncate">Cận cảnh: {(standardizedScript || rawTranscript || "Trống").slice(0, 30)}...</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("01")}
                  className="mt-4 w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

              {/* CARD 2: HOOK */}
              <div className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-md">KHUNG #02</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">RETENTION HOOK</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">02. Chế Tác Hook Giữ Chân</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Sáng tạo câu tiêu đề giữ chân 3 giây đầu vàng để kìm chân khán giả kéo CTR đề xuất.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div className="truncate italic">"{chosenHookText || "Chưa thiết lập"}"</div>
                    <div>Trạng thái: {chosenHookText ? "Đã ghim chọn" : "Trống"}</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("02")}
                  className="mt-4 w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

              {/* CARD 3: STORYBOARD */}
              <div className="bg-white border border-slate-200 hover:border-violet-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-md">KHUNG #03</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">STORYBOARD JSON</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">03. Phân Cảnh & Camera Prompts</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Băm kịch bản theo câu lồng tiếng, đồng nhất nhân vật lịch sử và camera prompts tiếng Anh.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div>Tổng phân cảnh: {stats.sceneCount} cảnh</div>
                    <div className="truncate">Nhân vật: {characterDescription || "Chưa mô tả"}</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("03")}
                  className="mt-4 w-full py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

              {/* CARD 4: IMAGEN */}
              <div className="bg-white border border-slate-200 hover:border-teal-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-md">KHUNG #04</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">IMAGEN 4.0 STUDIO</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">04. Vẽ Ảnh Minh Họa Google AI</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Tự động gọi API vẽ ảnh minh họa HD 16:9 hoành tráng theo phân cảnh điện ảnh.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div className="truncate">Style: {imageStyle}</div>
                    <div>Độ phân giải: 16:9 Cinematic HD</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("04")}
                  className="mt-4 w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

              {/* CARD 5: TTS */}
              <div className="bg-white border border-slate-200 hover:border-cyan-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-cyan-700 bg-cyan-50 border border-cyan-100 px-2.5 py-0.5 rounded-md">KHUNG #05</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">AI TTS STUDIO</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">05. Thâu Âm Giọng Thuyết Minh</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Chuyển hóa kịch bản chữ sạch thành tiếng đọc hifi trầm ấm tự nhiên ngắt câu chuẩn.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div>Giọng: {selectedVoice}</div>
                    <div>Audio Cache: {generatedAudio ? "Có sẵn (WAV)" : "Trống"}</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("05")}
                  className="mt-4 w-full py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

              {/* CARD 6: TIMELINE */}
              <div className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-md">KHUNG #06</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">CAPCUT TIMELINE</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">06. Đồng Bộ Căn Giờ Timeline</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Xuất bảng phân bổ thời lượng (Timing Sheet) chi tiết từng mốc giây của video.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div>Nhịp đọc: ~2.5 từ/giây</div>
                    <div>Dạng timing: Tự động tính toán mốc thoại</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("06")}
                  className="mt-4 w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

              {/* CARD 7: SEO */}
              <div className="bg-white border border-slate-200 hover:border-rose-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-md">KHUNG #07</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">SEO METADATA</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">07. Tối Ưu SEO & Tỷ Lệ Click</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Sáng tác tiêu đề bùng nổ, tối ưu hóa thẻ tag vàng thịnh hành.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div className="truncate">Title: "{seoData?.seoTitle || "Chưa tạo"}"</div>
                    <div className="truncate">Tag chính: {seoData?.tags?.primaryKeyword || "Chưa có"}</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("07")}
                  className="mt-4 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

              {/* CARD 8: SEEDING */}
              <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">KHUNG #08</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">SEEDING ENGINE</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">08. Seeding Ghim Bình Luận</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Tự động thiết kế 4 nhân cách ghim mồi kích nổ bão tranh luận đẩy đề xuất tương tác.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div className="truncate">Fan: "{seoData?.seedingComments?.[0]?.commentText || "Trống"}"</div>
                    <div className="truncate">Skeptic: "{seoData?.seedingComments?.[1]?.commentText || "Trống"}"</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("08")}
                  className="mt-4 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

              {/* CARD 9: OPERATING WORKFLOW */}
              <div className="bg-white border border-slate-200 hover:border-fuchsia-300 rounded-xl p-5 shadow-3xs flex flex-col justify-between transition-all group">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-2.5 py-0.5 rounded-md">CẨM NANG</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">OPERATING WF</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Quy Trình Vận Hành Triệu View</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">Cẩm nang thực chiến kéo thả CapCut thần tốc và lập lịch đăng tải giữ chân người xem.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1 text-slate-600 font-semibold font-mono">
                    <div>Tần suất: Định kỳ 1 Shorts/ngày</div>
                    <div>Khung giờ vàng: 11:30 & 19:30</div>
                  </div>
                </div>
                <button
                  onClick={() => downloadFrameAsImage("workflow")}
                  className="mt-4 w-full py-2 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  Tải Ảnh Khung Hình (.PNG)
                </button>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= PORTAL IN ẤN (CHỈ KÍCH HOẠT KHI IN / LƯU PDF QUA BROWSER) ================= */}
      <div id="print-area" className="hidden print:block bg-white text-black p-10 font-sans leading-relaxed">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: block !important;
              background: white !important;
              color: black !important;
            }
            .print-page-break {
              page-break-after: always;
              break-after: page;
            }
            .print-card {
              border: 1px solid #cbd5e1;
              padding: 24px;
              margin-bottom: 24px;
              border-radius: 8px;
              background: white !important;
            }
            .print-title {
              font-size: 20px;
              font-weight: 800;
              color: #dc2626 !important;
              border-bottom: 2px solid #dc2626;
              padding-bottom: 8px;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: -0.025em;
            }
            .print-subtitle {
              font-size: 13px;
              font-weight: 700;
              color: #475569 !important;
              margin-bottom: 12px;
            }
            .print-text {
              font-size: 11.5px;
              color: #1e293b !important;
              white-space: pre-wrap;
              line-height: 1.6;
            }
          }
        `}</style>

        {/* Title page */}
        <div className="text-center space-y-6 py-28 print-page-break">
          <h1 className="text-4xl font-black text-red-650 tracking-tight uppercase">BÁO CÁO TOÀN DIỆN & HỒ SƠ THIẾT KẾ VIDEO</h1>
          <p className="text-lg text-slate-600 font-bold">Kênh: {channelName || "Chưa đặt tên"} | Ngách định vị: {nicheCategory === "historical-mysteries" ? "Bí ẩn lịch sử" : nicheCategory === "military-tactics" ? "Chiến thuật quân sự" : "Chủ đề tự chọn"}</p>
          <div className="w-24 h-1 bg-red-650 mx-auto my-6"></div>
          <p className="text-xs text-slate-400 font-mono tracking-wider">HỆ THỐNG ĐÓNG GÓI TỰ ĐỘNG - YOUTUBE WORKSPACE 2026 STUDIO</p>
          <p className="text-xs text-slate-400">Xuất báo cáo lúc: {new Date().toLocaleString("vi-VN")}</p>
        </div>

        {/* Frame 0 */}
        <div className="print-card print-page-break">
          <h2 className="print-title">BƯỚC 0: NGHIÊN CỨU NGÁCH & KHỞI TẠO</h2>
          <div className="space-y-4 text-sm">
            <p><strong>Lĩnh vực định vị:</strong> {nicheCategory === "historical-mysteries" ? "Bí ẩn lịch sử & Dã sử" : nicheCategory === "military-tactics" ? "Chiến thuật quân sự" : "Chủ đề tự chọn"}</p>
            <p><strong>Chủ đề tìm kiếm chi tiết:</strong> {customKeyword || "Chưa nhập từ khóa chi tiết"}</p>
            <p><strong>Tên kênh chính thức:</strong> {channelName || "Chưa đặt tên"}</p>
            <p><strong>Từ khóa SEO cốt lõi của kênh:</strong> {targetKeywords || "Chưa nhập"}</p>
          </div>
        </div>

        {/* Frame 1 */}
        <div className="print-card print-page-break">
          <h2 className="print-title">BƯỚC 1: KỊCH BẢN CHUẨN HÓA SẠCH (STANDARD SCRIPT)</h2>
          <div className="print-subtitle">Quy cách: {standardizedScript.length} ký tự (~{countWords(standardizedScript)} từ)</div>
          <div className="print-text bg-slate-50 p-5 border border-slate-200 rounded-md text-xs font-mono leading-relaxed">
            {standardizedScript || rawTranscript || "Hồ sơ chưa có kịch bản."}
          </div>
        </div>

        {/* Frame 2 */}
        <div className="print-card print-page-break">
          <h2 className="print-title">BƯỚC 2: CHẾ TÁC RETENTION HOOK</h2>
          <p className="font-extrabold text-xl text-red-650 my-6 text-center italic">"{chosenHookText || "Chưa thiết lập hook."}"</p>
          <p className="text-xs text-slate-500 font-medium">Hook đóng vai trò thu hút tuyệt đối trong 3 giây vàng đầu tiên của video ngắn. Tuyệt đối không chào hỏi dài dòng, hãy đi thẳng vào nghi vấn này.</p>
        </div>

        {/* Frame 3 */}
        <div className="print-card print-page-break">
          <h2 className="print-title">BƯỚC 3: PHÂN CẢNH STORYBOARD & PROMPTS vẽ AI</h2>
          <p className="mb-4 text-xs"><strong>Mô tả nhân vật đồng nhất:</strong> {characterDescription || "Chưa ghim"}</p>
          <div className="space-y-4">
            {storyboardData?.scenes?.map((scene, index) => (
              <div key={index} className="border-b border-slate-200 pb-3 space-y-1">
                <p className="font-extrabold text-xs text-red-600">PHÂN CẢNH {index + 1}</p>
                <p className="text-xs"><strong>Lời thoại:</strong> "{scene.text}"</p>
                <p className="text-xs text-slate-600"><strong>Góc máy & Mô tả:</strong> {scene.visualDescription}</p>
                {scene.imagePrompts && scene.imagePrompts.length > 0 && (
                  <p className="text-[11px] text-indigo-700 font-mono"><strong>AI Prompt:</strong> {scene.imagePrompts[0]?.englishPrompt}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Frame 4 */}
        <div className="print-card print-page-break">
          <h2 className="print-title">BƯỚC 4: THÔNG SỐ VẼ ẢNH GOOGLE IMAGEN 4.0</h2>
          <p className="text-xs font-bold">Phong cách mỹ thuật chủ đạo:</p>
          <p className="italic bg-slate-50 p-4 rounded-md border border-slate-200 text-xs my-4">"{imageStyle}"</p>
          <p className="text-xs text-slate-500">Cơ chế tự động trích xuất màu sắc và phong cách từ ảnh mẫu để duy trì tính nhất quán xuyên suốt.</p>
        </div>

        {/* Frame 5 */}
        <div className="print-card print-page-break">
          <h2 className="print-title">BƯỚC 5: PHÒNG THÂU ÂM GIỌNG THUYẾT MINH AI</h2>
          <p className="text-xs"><strong>Cấu hình giọng đọc thuyết minh:</strong> Giọng {selectedVoice} (Premium Studio)</p>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">Sử dụng tệp thuyết minh định dạng WAV lossless hifi chất lượng cao. Thuật toán tự ngắt nghỉ hơi thở tự nhiên 0.4s - 0.7s bám theo dấu câu tiếng Việt.</p>
        </div>

        {/* Frame 6 */}
        <div className="print-card print-page-break">
          <h2 className="print-title">BƯỚC 6: ĐỒNG BỘ TIMELINE BIÊN TẬP CAPCUT</h2>
          <div className="space-y-3">
            {storyboardData?.scenes?.map((scene, index) => {
              const wCount = scene.text ? scene.text.split(/\s+/).length : 6;
              const dur = Math.max(3, parseFloat((wCount / 2.5).toFixed(1)));
              return (
                <div key={index} className="text-xs border-b border-slate-100 pb-2">
                  <p className="font-bold">Cảnh {index + 1}: Thời lượng {dur} giây</p>
                  <p className="text-slate-600 italic">Lời thoại: "{scene.text}"</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frame 7 */}
        <div className="print-card print-page-break">
          <h2 className="print-title">BƯỚC 7: TỐI ƯU HÓA METADATA SEO</h2>
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-bold text-red-600">TIÊU ĐỀ THU HÚT CLICK CHUẨN SEO:</p>
              <p className="pl-4 py-1 italic font-semibold text-sm">"{seoData?.seoTitle || "Chưa thiết lập"}"</p>
            </div>
            <div>
              <p className="font-bold text-red-600">MÔ TẢ CHI TIẾT VIDEO (DESCRIPTION):</p>
              <p className="pl-4 py-1 whitespace-pre-wrap leading-relaxed">{seoData?.seoDescription || "Chưa thiết lập"}</p>
            </div>
            <div>
              <p className="font-bold text-red-600">THẺ TỪ KHÓA TỐI ƯU ĐỀ XUẤT (TAGS):</p>
              <p className="pl-4 py-0.5"><strong>- Keyword chính:</strong> {seoData?.tags?.primaryKeyword || "Trống"}</p>
              <p className="pl-4 py-0.5"><strong>- Keyword phụ:</strong> {seoData?.tags?.secondaryKeyword || "Trống"}</p>
              <p className="pl-4 py-0.5"><strong>- Thẻ kênh:</strong> {seoData?.tags?.channelTag || "Trống"}</p>
              <p className="pl-4 py-0.5"><strong>- Thẻ đối thủ:</strong> {seoData?.tags?.competitorTags?.join(", ") || "Trống"}</p>
            </div>
          </div>
        </div>

        {/* Frame 8 */}
        <div className="print-card print-page-break">
          <h2 className="print-title">BƯỚC 8: KỊCH BẢN BÌNH LUẬN SEEDING MỒI</h2>
          <div className="space-y-4 text-xs leading-relaxed">
            <p><strong>1. Đồng tình tranh luận:</strong> "{seoData?.seedingComments?.[0]?.commentText || "Thật hào hùng! Tự hào dòng máu sử Việt oai hùng!"}"</p>
            <p><strong>2. Nghi vấn tương tác:</strong> "{seoData?.seedingComments?.[1]?.commentText || "Cho mình hỏi chi tiết đoạn 01:10 là sử sách nào chép vậy ạ?"}"</p>
            <p><strong>3. Phản biện thúc đẩy:</strong> "{seoData?.seedingComments?.[2]?.commentText || "Thực ra dã sử đoạn này vẫn còn nhiều tranh cãi lắm, nhưng video làm đỉnh thật."}"</p>
            <p><strong>4. Tổng kết mốc giờ:</strong> "{seoData?.seedingComments?.[3]?.commentText || "00:00 - Hook lôi cuốn, 00:25 - Nguồn gốc dã sử, 01:15 - Kết luận hào hùng!"}"</p>
          </div>
        </div>

        {/* Frame 9 */}
        <div className="print-card">
          <h2 className="print-title">CẨM NANG VẬN HÀNH QUY TRÌNH TRIỆU VIEW</h2>
          <div className="text-xs space-y-2.5 leading-relaxed font-medium">
            <p>1. Thiết lập lịch đăng ổn định: 1 Shorts/ngày và 2 video dài/tuần vào mốc 11:30 hoặc 19:30.</p>
            <p>2. Áp dụng chuyển động zoom ảnh nhẹ (Ken Burns effect) để biến ảnh tĩnh thành ảnh động mượt mà.</p>
            <p>3. Phụ đề lướt từng từ tự động đặt chính giữa khung hình, viền đen dày để thu hút tối đa thị giác người xem.</p>
            <p>4. Seeding ghim bình luận mồi ngay giây đầu tiên công chiếu để tăng mật độ tương tác trong 1 giờ vàng đầu tiên.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
