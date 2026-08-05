import React, { useState, useRef } from 'react';
import { 
  ImageIcon, 
  Info, 
  ChevronDown, 
  Monitor, 
  Smartphone, 
  Square,
  RectangleHorizontal,
  RectangleVertical,
  ImagePlus,
  Upload,
  Download,
  Trash2
} from 'lucide-react';
import { Storyboard } from '../types';

interface ImageGenerationStudioProps {
  projectDir: string;
  storyboardData: Storyboard | null;
  imageStyle: string;
  telegramToken: string;
  telegramChatId: string;
  generatedImages: Record<string, string>;
  setGeneratedImages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onComplete?: () => void;
}

export default function ImageGenerationStudio({
  projectDir,
  storyboardData,
  imageStyle,
  telegramToken,
  telegramChatId,
  generatedImages,
  setGeneratedImages,
  onComplete
}: ImageGenerationStudioProps) {
  const [selectedModel, setSelectedModel] = useState('Nano Banana Pro');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [quantity, setQuantity] = useState('x2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [generateType, setGenerateType] = useState<'image' | 'video'>('image');
  
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [resultMedia, setResultMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = ['Nano Banana Pro', 'Nano Banana 2', 'Nano Banana 2 Lite', 'Veo 3.1', 'Omni Flash'];
  const aspectRatios = [
    { value: '16:9', icon: <RectangleHorizontal className="w-5 h-5" /> },
    { value: '4:3', icon: <Monitor className="w-4 h-4" /> },
    { value: '1:1', icon: <Square className="w-4 h-4" /> },
    { value: '3:4', icon: <RectangleVertical className="w-4 h-4" /> },
    { value: '9:16', icon: <Smartphone className="w-4 h-4" /> },
  ];
  const quantities = ['1x', 'x2', 'x3', 'x4'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Vui lòng nhập prompt!");
      return;
    }
    
    setIsGenerating(true);
    setResultMedia(null);
    try {
      const payload = {
        prompt,
        referenceImage,
        visualConfig: {
          generateType: generateType === 'video' ? 'Video' : 'Image',
          aspectRatio,
          imageGeneratorEngine: selectedModel,
          generateCount: parseInt(quantity.replace('x', '')) || 1,
          generationMode: selectedModel.toLowerCase().includes('veo') ? 'google_labs' : 'gemini-chat'
        }
      };

      const res = await fetch("/api/pipeline/generate-single-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success && data.result) {
        let mediaUrl = data.result.fallbackUrl;
        if (data.result.base64) {
           const mime = generateType === 'video' ? 'video/mp4' : 'image/jpeg';
           mediaUrl = `data:${mime};base64,${data.result.base64}`;
        }
        setResultMedia({ type: generateType, url: mediaUrl });
        
        // Auto Download
        if (projectDir && mediaUrl) {
           try {
             await fetch("/api/download-audio", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                 url: mediaUrl,
                 path: `${projectDir}\\${generateType}s\\result_${Date.now()}.${generateType === 'video' ? 'mp4' : 'jpg'}`
               })
             });
           } catch (e) {
             console.error("Lỗi auto-save:", e);
           }
        }
        if (onComplete) onComplete();
      } else {
        alert("Lỗi: " + (data.warning || data.result?.warning || data.error || "Không thể tạo media."));
      }
    } catch (e: any) {
      alert("Lỗi kết nối: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadResultLocally = () => {
    if (!resultMedia) return;
    const a = document.createElement('a');
    a.href = resultMedia.url;
    a.download = `AI_Media_${Date.now()}.${resultMedia.type === 'video' ? 'mp4' : 'jpg'}`;
    a.click();
  };

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden mb-6 transition-all">
      <div className="p-5 md:p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-red-50 to-white relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">BƯỚC 4: TẠO ẢNH/VIDEO STUDIO</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
              Phát triển kịch bản thành ảnh nghệ thuật chất lượng cao với AI.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 bg-slate-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
          
          {/* Cột trái: Control Panel (Giao Diện Tương Tự UI Mẫu) */}
          <div className="w-full md:w-[400px] shrink-0 bg-[#171717] rounded-3xl p-6 text-white shadow-2xl relative">
            
            {/* Header tabs giả lập */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center bg-[#262626] rounded-full p-1 border border-white/5">
                <button 
                  onClick={() => setGenerateType('image')}
                  className={`px-6 py-2 rounded-full font-semibold text-sm flex items-center gap-2 transition-all ${generateType === 'image' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
                >
                  <ImageIcon className="w-4 h-4" /> Hình ảnh
                </button>
                <button 
                  onClick={() => setGenerateType('video')}
                  className={`px-6 py-2 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${generateType === 'video' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
                >
                  <ImagePlus className="w-4 h-4" /> Video
                </button>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* Box nhập Prompt & Reference Image */}
              <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-3">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Bạn muốn tạo gì? (Nhập mô tả tiếng Anh)"
                  className="w-full bg-transparent text-sm text-white placeholder-white/40 border-none outline-none resize-none min-h-[80px]"
                />
                
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                   <input 
                     type="file" 
                     accept="image/*" 
                     ref={fileInputRef}
                     onChange={handleFileUpload}
                     className="hidden" 
                   />
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="flex items-center gap-2 text-xs font-bold bg-[#333333] hover:bg-[#404040] text-white py-2 px-3 rounded-xl transition-all"
                   >
                     <Upload className="w-3.5 h-3.5" /> 
                     {referenceImage ? 'Đổi ảnh tham chiếu' : 'Thêm ảnh tham chiếu'}
                   </button>
                   {referenceImage && (
                     <div className="flex items-center gap-2 ml-auto">
                        <img src={referenceImage} alt="ref" className="w-8 h-8 rounded-md object-cover border border-white/20" />
                        <button onClick={() => setReferenceImage(null)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   )}
                </div>
              </div>

              {/* Box chọn Tỷ lệ và Số lượng */}
              <div className="bg-[#262626] rounded-2xl p-2 flex flex-col gap-2">
                {/* Aspect Ratio Row */}
                <div className="flex justify-between items-center bg-[#333333] rounded-xl p-1 gap-1">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all ${
                        aspectRatio === ratio.value 
                          ? 'bg-[#525252] text-white shadow-sm' 
                          : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      {ratio.icon}
                      <span className="text-[11px] font-bold mt-1.5">{ratio.value}</span>
                    </button>
                  ))}
                </div>

                {/* Quantity Row */}
                {generateType === 'image' && (
                  <div className="flex justify-between items-center rounded-xl p-1 gap-1">
                    {quantities.map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuantity(q)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                          quantity === q 
                            ? 'bg-[#404040] text-white shadow-sm' 
                            : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Model Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="w-full bg-[#262626] hover:bg-[#333333] rounded-2xl p-4.5 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🍌</span>
                    <span className="font-bold text-[15px]">{selectedModel}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showModelDropdown && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#262626] border border-white/5 rounded-2xl shadow-2xl overflow-hidden z-50">
                    {models.map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelDropdown(false);
                        }}
                        className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors flex items-center gap-3"
                      >
                        <span className="text-xl">🍌</span>
                        <span className="font-bold text-[15px]">{model}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cost Info */}
              <div className="text-center pt-2">
                <p className="text-white/40 text-[13px] font-medium">
                  Quá trình tạo sẽ tốn <span className="text-white/80 underline decoration-white/30 underline-offset-4">24 tín dụng</span>
                </p>
              </div>
            </div>
            
            {/* Action Bottom Bar */}
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt}
                  className="bg-[#262626] hover:bg-[#333333] text-white px-5 py-3 rounded-full font-bold text-sm flex items-center gap-3 transition-all shadow-lg disabled:opacity-70 border border-white/5"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang sinh...
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-2 text-white/90">
                        🍌 {selectedModel}
                      </span>
                      <span className="w-1 h-1 bg-white/20 rounded-full" />
                      <span className="flex items-center gap-1.5 text-white/60">
                        {generateType === 'video' ? <ImagePlus className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        {generateType === 'image' ? quantity : 'Video'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: Preview Kết Quả */}
          <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col">
             <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-800 text-sm">Xem trước kết quả</h4>
                {resultMedia && (
                  <button 
                    onClick={downloadResultLocally}
                    className="flex items-center gap-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 px-3 rounded-xl transition-all"
                  >
                    <Download className="w-4 h-4" /> Tải Xuống
                  </button>
                )}
             </div>

             <div className="flex-1 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative min-h-[300px]">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm font-bold text-slate-500 animate-pulse">Trí tuệ nhân tạo đang làm việc...</span>
                  </div>
                ) : resultMedia ? (
                  resultMedia.type === 'video' ? (
                    <video src={resultMedia.url} controls className="w-full h-full object-contain" autoPlay loop />
                  ) : (
                    <img src={resultMedia.url} alt="Result" className="w-full h-full object-contain" />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <Monitor className="w-12 h-12 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-500">Kết quả sẽ hiển thị ở đây</span>
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
