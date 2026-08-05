import React, { Component, ErrorInfo, ReactNode, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import VidiFlowDialogCenter from './components/VidiFlowDialogCenter.tsx';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  info: ErrorInfo | null;
}

type Notice = { id: number; message: string; type: 'error' | 'success' | 'info' };

/** Replaces blocking browser alerts with an in-app notification surface. */
function NotificationCenter() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const addNotice = (event: Event) => {
      const message = String((event as CustomEvent<{ message?: unknown }>).detail?.message || '').trim();
      if (!message) return;
      const lowered = message.toLowerCase();
      const type: Notice['type'] = /lỗi|không thể|thất bại|hết credit|hết lượt|quota|error|failed/.test(lowered)
        ? 'error'
        : /thành công|đã lưu|hoàn tất|success/.test(lowered) ? 'success' : 'info';
      const notice = { id: Date.now() + Math.floor(Math.random() * 1000), message, type };
      setNotices(current => [...current.slice(-3), notice]);
      window.setTimeout(() => setNotices(current => current.filter(item => item.id !== notice.id)), type === 'error' ? 12000 : 6500);
    };

    const nativeAlert = window.alert;
    const customAlert = (message?: unknown) => window.dispatchEvent(new CustomEvent('vf:notice', { detail: { message } }));
    window.addEventListener('vf:notice', addNotice);
    window.alert = customAlert;
    return () => {
      window.removeEventListener('vf:notice', addNotice);
      if (window.alert === customAlert) window.alert = nativeAlert;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-5 z-[9999] flex flex-col items-end gap-3 sm:left-auto sm:w-[430px]" aria-live="polite">
      {notices.map(notice => (
        <div key={notice.id} className={`pointer-events-auto w-full rounded-2xl border p-4 shadow-2xl backdrop-blur ${notice.type === 'error' ? 'border-rose-200 bg-white/95 text-rose-950' : notice.type === 'success' ? 'border-emerald-200 bg-white/95 text-emerald-950' : 'border-indigo-200 bg-white/95 text-slate-900'}`}>
          <div className="flex gap-3">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base ${notice.type === 'error' ? 'bg-rose-100' : notice.type === 'success' ? 'bg-emerald-100' : 'bg-indigo-100'}`}>{notice.type === 'error' ? '!' : notice.type === 'success' ? '✓' : 'i'}</span>
            <div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-wide opacity-60">{notice.type === 'error' ? 'Cần xử lý' : notice.type === 'success' ? 'Hoàn tất' : 'Thông báo'}</p><p className="mt-1 text-sm font-semibold leading-6">{notice.message}</p></div>
            <button type="button" onClick={() => setNotices(current => current.filter(item => item.id !== notice.id))} className="h-7 w-7 rounded-lg text-lg leading-none opacity-50 transition hover:bg-black/5 hover:opacity-100" aria-label="Đóng thông báo">×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

class ErrorBoundary extends Component<Props, State> {
  // This project intentionally uses React's bundled runtime without a separate
  // @types/react package. Declare the inherited instance members so tsc can
  // validate this boundary while preserving the normal React runtime behavior.
  declare state: State;
  declare props: Readonly<Props>;
  declare setState: (state: Partial<State>) => void;
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, info: null };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 font-sans text-slate-900">
          <section className="w-full max-w-xl rounded-3xl border border-rose-200 bg-white p-8 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-xl font-black text-rose-600">!</div>
            <h2 className="mt-5 text-2xl font-black">Không thể hiển thị màn hình này</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Dữ liệu đang được giữ nguyên. Hãy tải lại trang; nếu lỗi lặp lại, gửi nội dung bên dưới cho bộ phận hỗ trợ.</p>
            <details className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
              <summary className="cursor-pointer font-bold">Xem chi tiết kỹ thuật</summary>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap">{this.state.error?.toString()}\n{this.state.info?.componentStack}</pre>
            </details>
            <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200">Tải lại trang</button>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <VidiFlowDialogCenter />
    </ErrorBoundary>
  </StrictMode>,
);
