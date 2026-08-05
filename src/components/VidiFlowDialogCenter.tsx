import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Info,
  ShieldAlert,
  X,
} from "lucide-react";

export type VidiFlowDialogTone =
  | "info"
  | "success"
  | "warning"
  | "error";

export type VidiFlowDialogOptions = {
  title?: string;
  message: string;
  tone?: VidiFlowDialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  inputValue?: string;
  copyable?: boolean;
};

type DialogRequest = VidiFlowDialogOptions & {
  resolve: (value: string | boolean | null) => void;
};

const EVENT_NAME = "vf:dialog";

export const showVidiFlowDialog = (
  options: VidiFlowDialogOptions,
): Promise<string | boolean | null> =>
  new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<DialogRequest>(EVENT_NAME, {
        detail: { ...options, resolve },
      }),
    );
  });

export const vidiflowAlert = (
  message: string,
  options: Omit<VidiFlowDialogOptions, "message"> = {},
) => showVidiFlowDialog({ message, ...options, showCancel: false });

export const vidiflowConfirm = (
  message: string,
  options: Omit<VidiFlowDialogOptions, "message"> = {},
) =>
  showVidiFlowDialog({
    message,
    tone: "warning",
    confirmLabel: "Xác nhận",
    cancelLabel: "Quay lại",
    ...options,
    showCancel: true,
  }).then((value) => value === true);

export const vidiflowPrompt = (
  message: string,
  inputValue = "",
  options: Omit<VidiFlowDialogOptions, "message" | "inputValue"> = {},
) =>
  showVidiFlowDialog({
    message,
    inputValue,
    copyable: true,
    confirmLabel: "Đã sao chép",
    ...options,
  });

const toneStyles = {
  info: {
    icon: Info,
    iconBox: "bg-indigo-100 text-indigo-700",
    eyebrow: "text-indigo-600",
    button:
      "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200",
  },
  success: {
    icon: CheckCircle2,
    iconBox: "bg-emerald-100 text-emerald-700",
    eyebrow: "text-emerald-600",
    button:
      "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-200",
  },
  warning: {
    icon: AlertTriangle,
    iconBox: "bg-amber-100 text-amber-700",
    eyebrow: "text-amber-600",
    button: "bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-200",
  },
  error: {
    icon: ShieldAlert,
    iconBox: "bg-rose-100 text-rose-700",
    eyebrow: "text-rose-600",
    button: "bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-200",
  },
} as const;

export default function VidiFlowDialogCenter() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const active = queue[0];

  useEffect(() => {
    const receive = (event: Event) => {
      const request = (event as CustomEvent<DialogRequest>).detail;
      if (!request?.message || typeof request.resolve !== "function") return;
      setQueue((current) => [...current, request]);
    };
    window.addEventListener(EVENT_NAME, receive);
    const nativeAlert = window.alert;
    const customAlert = (message?: unknown) => {
      void vidiflowAlert(String(message ?? ""));
    };
    window.alert = customAlert;
    return () => {
      window.removeEventListener(EVENT_NAME, receive);
      if (window.alert === customAlert) window.alert = nativeAlert;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    setCopied(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(active.showCancel ? false : null);
      if (event.key === "Enter" && !event.shiftKey) close(true);
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  const close = (value: string | boolean | null) => {
    if (!active) return;
    active.resolve(value);
    setQueue((current) => current.slice(1));
  };

  if (!active) return null;
  const tone = active.tone || "info";
  const style = toneStyles[tone];
  const Icon = style.icon;
  const title =
    active.title ||
    (tone === "error"
      ? "Không thể hoàn tất"
      : tone === "success"
        ? "Hoàn tất"
        : tone === "warning"
          ? "Xác nhận thao tác"
          : "Thông báo từ VidiFlow");

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget)
          close(active.showCancel ? false : null);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,.35)] outline-none"
      >
        <div className="relative overflow-hidden border-b border-slate-100 px-6 pb-5 pt-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-violet-100/70 blur-3xl" />
          <button
            type="button"
            onClick={() => close(active.showCancel ? false : null)}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative flex items-start gap-4 pr-9">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.iconBox}`}
            >
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p
                className={`text-[10px] font-black uppercase tracking-[.2em] ${style.eyebrow}`}
              >
                VidiFlow OneClick
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900">
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600">
            {active.message}
          </p>
          {typeof active.inputValue === "string" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <textarea
                readOnly
                value={active.inputValue}
                rows={7}
                onFocus={(event) => event.currentTarget.select()}
                className="w-full resize-none bg-transparent font-mono text-xs leading-5 text-slate-700 outline-none"
              />
              {active.copyable && (
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(active.inputValue || "");
                    setCopied(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Đã sao chép" : "Sao chép nội dung"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
          {active.showCancel && (
            <button
              type="button"
              onClick={() => close(false)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            >
              {active.cancelLabel || "Hủy"}
            </button>
          )}
          <button
            type="button"
            onClick={() => close(true)}
            className={`rounded-xl px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 ${style.button}`}
          >
            {active.confirmLabel || "Đã hiểu"}
          </button>
        </div>
      </div>
    </div>
  );
}
