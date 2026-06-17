"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

export type ProgressState = "idle" | "running" | "success" | "warning" | "pending" | "error";
export type ProgressStep = { id: string; label: string };

type Props = {
  open: boolean;
  state: ProgressState;
  message?: string;
  result?: string;
  steps?: ProgressStep[];
  current?: number;
  onClose: () => void;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
};

const STAGES = [
  { label: "Submitting request",     sub: "Validating your inputs…" },
  { label: "Establishing connection", sub: "Initialising secure connection…" },
  { label: "Processing",             sub: "Running the automation workflow…" },
  { label: "Executing changes",      sub: "Applying changes to the system…" },
  { label: "Finalising",             sub: "Almost done, hang tight…" },
];

function AILoader() {
  const [stageIdx, setStageIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setStageIdx(0);
    setVisible(true);
  }, []);

  useEffect(() => {
    const fade = setTimeout(() => setVisible(false), 2200);
    const next = setTimeout(() => {
      setStageIdx((i) => (i < STAGES.length - 1 ? i + 1 : i));
      setVisible(true);
    }, 2600);
    return () => { clearTimeout(fade); clearTimeout(next); };
  }, [stageIdx]);

  const stage = STAGES[stageIdx];

  return (
    <div className="w-full flex flex-col items-center gap-5">

      {/* Stage pills — track progress */}
      <div className="flex items-center gap-1.5">
        {STAGES.map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === stageIdx ? "24px" : "6px",
              background: i <= stageIdx
                ? "var(--color-brand-500, #00c246)"
                : "#e5e7e0",
              opacity: i < stageIdx ? 0.4 : 1,
            }}
          />
        ))}
      </div>

      {/* Animated label */}
      <div
        className="text-center transition-all duration-300"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-6px)" }}
      >
        <p className="text-sm font-semibold text-ink-800 tracking-wide">
          {stage.label}
          <span className="inline-flex gap-0.5 ml-1 translate-y-px">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-[3px] w-[3px] rounded-full bg-brand-500"
                style={{ animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </span>
        </p>
        <p className="text-xs text-ink-400 mt-1">{stage.sub}</p>
      </div>

      {/* Thin animated progress bar */}
      <div className="w-full h-[3px] rounded-full bg-ink-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
          style={{ animation: "bar-sweep 2.4s ease-in-out infinite" }}
        />
      </div>

      <style>{`
        @keyframes dot-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scaleY(1); }
          40%            { opacity: 1;   transform: scaleY(1.6); }
        }
        @keyframes bar-sweep {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 70%;  margin-left: 15%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function ProgressModal({
  open,
  state,
  message,
  onClose,
  primaryAction,
  secondaryAction,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const isRunning = state === "running" || state === "idle";
  const isTerminal = state === "success" || state === "error" || state === "warning" || state === "pending";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm"
        onClick={isTerminal ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm card overflow-hidden animate-scale-in">

        <div className="flex flex-col items-center text-center gap-6 px-8 pt-8 pb-8">

          {isTerminal && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-900 transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Running — AI generation style */}
          {isRunning && <AILoader />}

          {/* Success */}
          {state === "success" && (
            <>
              <div className="h-14 w-14 rounded-full bg-brand-500/10 border border-brand-500/25 flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="h-6 w-6 text-brand-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-ink-900">Completed successfully</h3>
                {message && <p className="text-sm text-ink-400 leading-relaxed">{message}</p>}
              </div>
            </>
          )}

          {/* Warning */}
          {state === "warning" && (
            <>
              <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center animate-scale-in">
                <CircleAlert className="h-6 w-6 text-amber-500" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-ink-900">Submitted</h3>
                {message && <p className="text-sm text-ink-400 leading-relaxed">{message}</p>}
              </div>
            </>
          )}

          {/* Pending approval */}
          {state === "pending" && (
            <>
              <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center animate-scale-in">
                <svg className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-ink-900">Submitted — Pending Approval</h3>
                {message && <p className="text-sm text-ink-400 leading-relaxed">{message}</p>}
                <a
                  href="/irt-automations?tab=my-requests"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline mt-1"
                >
                  Track status on My Requests →
                </a>
              </div>
            </>
          )}

          {/* Error */}
          {state === "error" && (
            <>
              <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center animate-scale-in">
                <CircleAlert className="h-6 w-6 text-rose-500" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-rose-700">Automation failed</h3>
                {message && (
                  <p className="text-sm text-ink-500 leading-relaxed bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    {message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          {(primaryAction || secondaryAction) && isTerminal && (
            <div className="flex justify-center gap-3 w-full">
              {secondaryAction && (
                <button onClick={secondaryAction.onClick} className="btn-secondary">
                  {secondaryAction.label}
                </button>
              )}
              {primaryAction && (
                <button onClick={primaryAction.onClick} className="btn-primary">
                  {primaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
