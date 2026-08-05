import React, { useCallback, useEffect, useState } from "react";
import { Check, Clock3, Copy, Crown, KeyRound, ShieldCheck, Sparkles } from "lucide-react";

type Plan = "none" | "trial" | "starter" | "monthly" | "agency" | "lifetime";
type LicenseStatus = {
  active: boolean;
  plan: Plan;
  deviceId: string;
  expiresAt?: string | null;
  daysRemaining?: number | null;
  quotas?: { voice: number; image: number; gemini: number };
  error?: string;
};

const plans = [
  { id: "trial", name: "Dùng thử 1 ngày", price: "Miễn phí", badge: "TRẢI NGHIỆM", icon: Clock3, items: ["Sử dụng trong 24 giờ", "2.000 tác vụ AI nội dung", "100 lượt Media ảnh/video", "5.000 ký tự Voice Premium", "Có thể dùng Google Pro/Ultra riêng"] },
  { id: "starter", name: "Gói Starter", price: "299.000đ / tháng", badge: "DỄ BẮT ĐẦU", icon: Sparkles, items: ["5.000 tác vụ AI nội dung", "1.500 lượt Media ảnh/video", "200.000 ký tự Voice Premium", "Từng bước + Tự động theo Preset", "1 máy sử dụng", "Có thể dùng Google Pro/Ultra hoặc API riêng"] },
  { id: "monthly", name: "Gói Pro", price: "699.000đ / tháng", badge: "PHỔ BIẾN", icon: Sparkles, items: ["20.000 tác vụ AI nội dung", "3.500 lượt Media ảnh/video", "500.000 ký tự Voice Premium", "Toàn bộ chức năng tự động", "Telegram & hàng đợi ưu tiên", "1 máy sử dụng", "Có thể dùng Google Pro/Ultra hoặc API riêng"] },
  { id: "agency", name: "Gói Agency", price: "1.299.000đ / tháng", badge: "SẢN XUẤT LỚN", icon: Crown, items: ["50.000 tác vụ AI nội dung", "7.000 lượt Media ảnh/video", "1 triệu ký tự Voice Premium", "2 máy sử dụng", "Nhiều dự án & hàng đợi ưu tiên", "Có thể dùng Google Pro/Ultra hoặc API riêng"] },
  { id: "lifetime", name: "Gói Lifetime", price: "2.490.000đ", badge: "VĨNH VIỄN", icon: Crown, items: ["Phần mềm đầy đủ vĩnh viễn", "20.000 tác vụ AI một lần", "5.000 lượt Media một lần", "1 triệu ký tự Voice một lần", "Hết hạn mức có thể mua thêm", "Luôn được dùng Google Pro/Ultra hoặc API riêng"] },
] as const;

const checkoutUrl = (plan?: string) => `https://vidiflow.site/checkout.html${plan ? `?plan=${encodeURIComponent(plan)}` : ""}`;
const trialRemainingLabel = (expiresAt?: string | null) => {
  const remainingMs = Math.max(0, (expiresAt ? new Date(expiresAt).getTime() : 0) - Date.now());
  if (remainingMs <= 0) return "0 phút";
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours <= 0 ? `${minutes} phút` : minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
};
const planLabel = (plan: Plan, days?: number | null, expiresAt?: string | null) =>
  plan === "trial" ? `Dùng thử · còn ${trialRemainingLabel(expiresAt)}`
    : plan === "starter" ? `Gói Starter · còn ${days ?? 0} ngày`
      : plan === "monthly" ? `Gói Pro · còn ${days ?? 0} ngày`
        : plan === "agency" ? `Gói Agency · còn ${days ?? 0} ngày`
          : plan === "lifetime" ? "Gói Lifetime" : "Chưa kích hoạt";

export default function LicenseGate({ children }: { children: React.ReactNode }) {
  const pricingPreview = new URLSearchParams(window.location.search).get("pricing") === "1";
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { const response = await fetch("/api/license/status"); setStatus(await response.json()); }
    catch { setError("Không thể kết nối dịch vụ kích hoạt trên máy này."); }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    const originalFetch = window.fetch.bind(window);
    let refreshTimer: number | undefined;
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const request = originalFetch(input, init);
      if (method === "POST" && requestUrl.startsWith("/api/") && !requestUrl.startsWith("/api/license/")) {
        void request.finally(() => { window.clearTimeout(refreshTimer); refreshTimer = window.setTimeout(() => void load(), 250); });
      }
      return request;
    }) as typeof window.fetch;
    return () => { window.clearInterval(timer); window.clearTimeout(refreshTimer); window.fetch = originalFetch; };
  }, [load]);

  const submit = async (mode: "trial" | "activate") => {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/license/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mode === "activate" ? { key: key.trim() } : {}) });
      const data = await response.json();
      if (!response.ok || !data.active) throw new Error(data.error || data.message || "Kích hoạt không thành công.");
      setStatus(data);
    } catch (reason: any) { setError(reason?.message || "Kích hoạt không thành công."); }
    finally { setBusy(false); }
  };

  if (!status) return <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_center,_#312e81,_#0f172a_45%,_#020617)] text-white"><div className="text-center"><img src="/brand/vidiflow-logo.png" alt="VidiFlow đang tải" className="mx-auto h-20 w-20 animate-pulse rounded-2xl" /><p className="mt-4 text-sm font-black">Đang khởi động VidiFlow</p><p className="mt-1 text-xs text-violet-200">Đang kiểm tra dữ liệu và bản quyền...</p></div></div>;

  if (status.active && !pricingPreview) return <>
    <button type="button" aria-label={`Bản quyền: ${planLabel(status.plan, status.daysRemaining, status.expiresAt)}`} title="Xem bản quyền, hạn mức và bảng giá" onClick={() => { window.location.href = "/?pricing=1"; }} className="group fixed bottom-5 right-5 z-[100] h-14 w-14 overflow-hidden rounded-full border border-violet-300 bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 px-2.5 py-2.5 text-left text-white shadow-[0_12px_35px_rgba(79,70,229,.36)] transition-all duration-200 hover:w-[330px] hover:rounded-2xl focus:w-[330px] focus:rounded-2xl focus:outline-none">
      <span className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15"><Crown className="h-5 w-5" /></span><span className="min-w-[265px] opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"><span className="block text-[10px] font-black uppercase tracking-[.14em] text-violet-100">Bản quyền đang hoạt động</span><span className="mt-0.5 block text-sm font-black">{planLabel(status.plan, status.daysRemaining, status.expiresAt)}</span><span className="mt-1 block text-[10px] font-semibold text-violet-100">Voice {status.quotas?.voice ?? 0} · Media {status.quotas?.image ?? 0} · AI {status.quotas?.gemini ?? 0}</span><span className="mt-1.5 block text-[10px] font-black text-amber-200">Xem bảng giá & nâng cấp →</span></span></span>
    </button>{children}
  </>;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#312e81,_#0f172a_42%,_#020617)] px-5 py-10 text-slate-900"><div className="mx-auto max-w-7xl">
    <header className="mb-7 text-center text-white"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl"><ShieldCheck className="h-8 w-8" /></div><p className="text-xs font-black uppercase tracking-[.25em] text-violet-300">VidiFlow OneClick Content Studio</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Chọn gói phù hợp để bắt đầu</h1><p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-300">API AI, Voice và Media được tích hợp sẵn theo hạn mức. Khách hàng vẫn có thể dùng tài khoản Google Pro/Ultra hoặc API riêng bất cứ lúc nào.</p>{status.active && pricingPreview && <button onClick={() => { window.location.href = "/"; }} className="mt-5 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-black text-white">Quay lại tool</button>}</header>
    <div className="mb-6 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-5 py-4 text-center text-xs font-semibold leading-5 text-emerald-900"><b>API tích hợp đã sẵn sàng:</b> AI nội dung, Voice và Media được cấp theo đúng hạn mức của từng gói và đồng bộ trực tiếp với dashboard vidiflow.site.</div>
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">{plans.map((plan) => { const Icon = plan.icon; const current = status.active && status.plan === plan.id; return <article key={plan.id} className={`relative flex flex-col rounded-3xl border bg-white p-5 shadow-2xl ${current ? "border-emerald-400 ring-4 ring-emerald-400/30" : plan.id === "monthly" ? "border-violet-400 ring-4 ring-violet-500/20" : "border-white/20"}`}><span className={`absolute right-4 top-4 rounded-full px-2 py-1 text-[9px] font-black ${current ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}>{current ? "ĐANG DÙNG" : plan.badge}</span><Icon className={`h-8 w-8 ${current ? "text-emerald-600" : "text-violet-600"}`} /><h2 className="mt-5 text-lg font-black">{plan.name}</h2><p className="mt-2 text-xl font-black text-violet-700">{plan.price}</p><div className="mt-5 flex-1 space-y-3">{plan.items.map((item) => <p key={item} className="flex gap-2 text-xs font-semibold leading-5 text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{item}</p>)}</div>{current ? <div className="mt-6 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white">Đang sử dụng</div> : plan.id === "trial" ? <button disabled={busy || status.active} onClick={() => void submit("trial")} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Bắt đầu dùng thử</button> : <a href={checkoutUrl(plan.id)} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-violet-600 px-4 py-3 text-center text-sm font-black text-white">Mua & nhận key</a>}</article>; })}</section>
    <p className="mx-auto mt-5 max-w-5xl rounded-2xl border border-violet-200/60 bg-white/90 px-5 py-3 text-center text-xs font-semibold leading-5 text-slate-600">Hạn mức API tích hợp được trừ theo lượt sử dụng thành công. Khi hết hạn mức, khách có thể mua thêm hoặc tiếp tục bằng <b>Google Pro/Ultra, Chrome hay API riêng</b>.</p>
    <section className="mx-auto mt-7 max-w-3xl rounded-3xl border border-white/20 bg-white p-6 shadow-2xl"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-100 p-3 text-violet-700"><KeyRound className="h-5 w-5" /></div><div><h2 className="font-black">Đã có key kích hoạt?</h2><p className="text-xs text-slate-500">Nhập key được cấp sau khi thanh toán thành công.</p></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={key} onChange={(event) => setKey(event.target.value.toUpperCase())} placeholder="VIDIFLOW-XXXX-XXXX-XXXX" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-violet-500" /><button disabled={busy || !key.trim()} onClick={() => void submit("activate")} className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Đang kiểm tra..." : "Kích hoạt key"}</button></div>{error && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}<div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3"><span className="text-xs font-bold text-slate-500">Mã thiết bị: <code className="text-slate-700">{status.deviceId}</code></span><button onClick={() => void navigator.clipboard.writeText(status.deviceId)} className="flex items-center gap-1 text-xs font-black text-violet-700"><Copy className="h-3.5 w-3.5" /> Sao chép</button></div></section>
  </div></main>;
}
