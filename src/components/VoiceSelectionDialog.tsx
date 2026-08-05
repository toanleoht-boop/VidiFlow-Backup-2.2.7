import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Play, Square, Check, X, Filter, SlidersHorizontal, Mic, Globe2, User, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Voice {
  voice_id: string;
  name: string;
  description: string;
  language: string;
  locale: string;
  gender: string;
  age: string;
  accent: string;
  category: string;
  use_cases: string[];
  descriptives: string[];
  tags: string[];
  preview_url: string;
}

interface VoiceSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoice: (voice: Voice) => void;
  currentLang: 'vi' | 'en';
  selectedVoiceId?: string;
}

export const VoiceSelectionDialog: React.FC<VoiceSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectVoice,
  currentLang,
  selectedVoiceId,
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [provider, setProvider] = useState('minimax');
  
  // Filters
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  
  // Audio playback
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);
  const fetchIdRef = useRef(0);
  const voiceCacheRef = useRef(new Map<string, { voices: Voice[]; hasMore: boolean }>());

  const cacheKey = () => [provider, language, gender, age, search.trim().toLowerCase()].join("|");

  const fetchVoices = async (pageNumber: number, overrideVoices = false) => {
    // Không block nếu là request mới (tìm kiếm / đổi tab)
    if (loading && !overrideVoices) return;
    
    const currentFetchId = ++fetchIdRef.current;
    const currentCacheKey = cacheKey();

    if (overrideVoices && pageNumber === 1) {
      const cached = voiceCacheRef.current.get(currentCacheKey);
      if (cached) {
        setVoices(cached.voices);
        setHasMore(cached.hasMore);
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    setLoadError('');
    if (overrideVoices) {
      // Do not clear voices here to prevent UI flickering/jumping
      setHasMore(true);
    }
    
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const params = new URLSearchParams({
        provider: provider,
        page: pageNumber.toString(),
        page_size: '30',
      });
      
      if (provider === 'vbee') params.append('voice_ownership', 'community');
      if (provider === 'fishaudio') params.append('sort', 'score');
      
      if (language) params.append('language', language);
      if (gender) params.append('gender', gender);
      if (age) params.append('age', age);
      if (search) params.append('search', search);

      const res = await fetch(`/api/ai33/voices?${params.toString()}`, { signal: controller.signal });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Không thể tải thư viện giọng đọc.');
      
      // Bỏ qua kết quả cũ nếu người dùng đã thao tác tìm kiếm/đổi tab mới
      if (fetchIdRef.current !== currentFetchId) return;
      
      if (json.success && json.data) {
        if (overrideVoices) {
          setVoices(json.data);
          voiceCacheRef.current.set(currentCacheKey, { voices: json.data, hasMore: json.pagination?.has_more ?? false });
        } else {
          setVoices(prev => {
            // Prevent duplicates
            const existingIds = new Set(prev.map(v => v.voice_id));
            const newVoices = json.data.filter((v: Voice) => !existingIds.has(v.voice_id));
            const merged = [...prev, ...newVoices];
            voiceCacheRef.current.set(currentCacheKey, { voices: merged, hasMore: json.pagination?.has_more ?? false });
            return merged;
          });
        }
        setHasMore(json.pagination?.has_more ?? false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      if (fetchIdRef.current !== currentFetchId) return;
      console.error('Failed to fetch voices:', error);
      const detail = error instanceof Error ? error.message : 'Không thể tải thư viện giọng đọc.';
      setLoadError(detail === 'Unauthorized'
        ? 'AI33 từ chối API key. Hãy kiểm tra lại key AI33 trong Cài đặt, rồi bấm Lưu cấu hình và mở lại thư viện.'
        : detail);
      setHasMore(false);
    } finally {
      window.clearTimeout(timeout);
      if (fetchIdRef.current === currentFetchId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isOpen) {
      // Hủy ngay kết quả cũ khi người dùng vừa đổi nền tảng hoặc bộ lọc.
      fetchIdRef.current += 1;
      setPage(1);
      // Debounce 400ms để tránh call API liên tục khi gõ phím
      timer = setTimeout(() => {
        fetchVoices(1, true);
      }, search ? 220 : 90);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, language, gender, age, search, provider]);

  useEffect(() => {
    if (page > 1) {
      fetchVoices(page, false);
    }
  }, [page]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const handlePlay = (voice: Voice) => {
    if (playingId === voice.voice_id) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(voice.preview_url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(e => console.error("Audio playback failed", e));
    audioRef.current = audio;
    setPlayingId(voice.voice_id);
  };

  const filteredVoices = voices; // We now rely on API search instead of local filtering to support infinite scroll

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6" style={{ pointerEvents: 'auto' }}>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <Mic className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  {currentLang === 'vi' ? 'Thư viện Giọng đọc' : 'Voice Library'}
                </h2>
                <p className="text-sm text-slate-400">
                  {currentLang === 'vi' ? 'Chọn giọng đọc AI chất lượng cao' : 'Choose high-quality AI voices'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-slate-800/80 rounded-full transition-colors text-slate-400 hover:text-slate-200 z-10 bg-slate-900 shadow-sm border border-transparent hover:border-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'elevenlabs', label: 'ElevenLabs', icon: '/elevenlabs-icon.png', defaultIcon: '🎙️' },
              { id: 'minimax', label: 'Minimax', icon: '/minimax.png', defaultIcon: '✨' },
              { id: 'vbee', label: 'Vbee', icon: '/vbee.png', defaultIcon: '🐝' },
              { id: 'fishaudio', label: 'Fish', icon: '/fishaudio.png', defaultIcon: '🐟' },
              { id: 'clone', label: 'Giọng nhân bản', icon: null, defaultIcon: '👤' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === provider) return;
                  if (audioRef.current) audioRef.current.pause();
                  setPlayingId(null);
                  setProvider(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${provider === tab.id ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-slate-900/50 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                {tab.icon ? (
                  <img src={tab.icon} alt={tab.label} className="w-4 h-4 rounded-sm object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                ) : null}
                <span className={tab.icon ? 'hidden' : ''}>{tab.defaultIcon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row min-h-0">
          
          {/* Sidebar Filters */}
          <div className="w-full md:w-72 bg-slate-950/40 border-r border-slate-800/80 p-5 flex flex-col gap-6 overflow-y-auto shrink-0">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> 
                {currentLang === 'vi' ? 'Tìm kiếm' : 'Search'}
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={currentLang === 'vi' ? 'Tên, mô tả...' : 'Name, description...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all shadow-sm"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5" /> 
                {currentLang === 'vi' ? 'Ngôn ngữ' : 'Language'}
              </label>
              <div className="relative">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-200 outline-none appearance-none transition-all shadow-sm"
                >
                  <option value="">{currentLang === 'vi' ? 'Tất cả' : 'All'}</option>
                  <option value="en">English</option>
                  <option value="vi">Vietnamese</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> 
                {currentLang === 'vi' ? 'Giới tính' : 'Gender'}
              </label>
              <div className="flex gap-2">
                {['', 'male', 'female'].map(g => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${gender === g ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-sm' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300 shadow-sm'}`}
                  >
                    {g === '' ? (currentLang === 'vi' ? 'Tất cả' : 'All') : g === 'male' ? (currentLang === 'vi' ? 'Nam' : 'Male') : (currentLang === 'vi' ? 'Nữ' : 'Female')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> 
                {currentLang === 'vi' ? 'Độ tuổi' : 'Age'}
              </label>
              <div className="relative">
                <select 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-200 outline-none appearance-none transition-all shadow-sm"
                >
                  <option value="">{currentLang === 'vi' ? 'Tất cả' : 'All'}</option>
                  <option value="young">{currentLang === 'vi' ? 'Trẻ' : 'Young'}</option>
                  <option value="middle_aged">{currentLang === 'vi' ? 'Trung niên' : 'Middle-aged'}</option>
                  <option value="old">{currentLang === 'vi' ? 'Người già' : 'Elderly'}</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main List */}
          <div className="flex-1 overflow-y-auto bg-slate-900/20 relative min-h-[500px]">
            <div className="p-5">
              <div className="mb-3 flex min-h-6 items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>{voices.length ? `${voices.length} giọng đang hiển thị` : "Đang chuẩn bị thư viện giọng"}</span>
                {loading && <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-rose-400"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-400"/>Đang tải nền tảng...</span>}
              </div>
              {loadError && (
                <div className="mb-4 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  <p className="font-bold">Không thể tải model Voice</p>
                  <p className="mt-1 text-xs leading-relaxed text-rose-200/85">{loadError}</p>
                </div>
              )}
              {filteredVoices.length === 0 && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Mic className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">{currentLang === 'vi' ? 'Không tìm thấy giọng đọc phù hợp.' : 'No voices found.'}</p>
                  <p className="text-sm mt-1 opacity-70">{currentLang === 'vi' ? 'Hãy thử thay đổi bộ lọc tìm kiếm' : 'Try changing your search filters'}</p>
                </div>
              )}
              
              {filteredVoices.length === 0 && loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-rose-500 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-slate-400 animate-pulse">{currentLang === 'vi' ? 'Đang tải danh sách giọng đọc...' : 'Loading voices...'}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredVoices.map(voice => {
                  const isSelected = selectedVoiceId === voice.voice_id;
                  const isPlaying = playingId === voice.voice_id;
                  
                  return (
                    <div 
                      key={voice.voice_id}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-rose-500/5 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.08)] ring-1 ring-rose-500/20' : 'bg-slate-900 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/50 shadow-sm hover:shadow-md'}`}
                      onClick={() => onSelectVoice(voice)}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlay(voice); }}
                        className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105'}`}
                      >
                        {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                      </button>
                      
                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h3 className="font-bold text-base text-slate-100 truncate">{voice.name}</h3>
                          {isSelected && (
                            <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                              <Check className="w-3 h-3" />
                              {currentLang === 'vi' ? 'Đã chọn' : 'Selected'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {voice.accent && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 capitalize">{voice.accent}</span>
                          )}
                          {voice.gender && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 capitalize">{voice.gender}</span>
                          )}
                          {voice.age && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 capitalize">{voice.age}</span>
                          )}
                          {voice.descriptives?.slice(0, 2).map((desc, idx) => (
                            <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/50 text-slate-400 capitalize">{desc}</span>
                          ))}
                        </div>
                        
                        {voice.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed italic">
                            {voice.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Infinite Scroll Observer Target */}
              <div ref={observerTarget} className="h-4 w-full mt-4" />
              
              {loading && (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-slate-700 border-t-rose-500 rounded-full animate-spin" />
                  <span className="text-sm text-slate-400 animate-pulse">{currentLang === 'vi' ? 'Đang tải thêm...' : 'Loading more...'}</span>
                </div>
              )}
              
              {!loading && !hasMore && filteredVoices.length > 0 && (
                <div className="py-8 flex justify-center text-sm text-slate-500">
                  {currentLang === 'vi' ? 'Đã hiển thị tất cả giọng đọc' : 'All voices loaded'}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
