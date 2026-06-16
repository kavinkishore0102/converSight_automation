"use client";

import { useEffect } from "react";
import { CheckCircle2, CircleAlert, Loader2, X } from "lucide-react";

export type ProgressState = "idle" | "running" | "success" | "warning" | "error";

type Props = {
  open: boolean;
  state: ProgressState;
  message?: string;
  result?: string;
  onClose: () => void;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
};

export default function ProgressModal({
  open,
  state,
  message,
  result,
  onClose,
  primaryAction,
  secondaryAction,
}: Props) {
  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const isTerminal = state === "success" || state === "error" || state === "warning";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-ink-900/25 backdrop-blur-sm"
        onClick={isTerminal ? onClose : undefined}
      />
      <div className="relative w-full max-w-md card p-8 animate-scale-in">
        {isTerminal && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-ink-400 hover:text-ink-900 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          {/* Indicator */}
          <div className="relative h-20 w-20 mb-5 flex items-center justify-center">
            {state === "running" && <SmoothSpinner />}
            {state === "success" && (
              <div className="h-16 w-16 rounded-full bg-brand-500/10 border-2 border-brand-500/40 flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="h-8 w-8 text-brand-600" />
              </div>
            )}
            {state === "warning" && (
              <div className="h-16 w-16 rounded-full bg-accent-amber/15 border-2 border-accent-amber/40 flex items-center justify-center animate-scale-in">
                <CircleAlert className="h-8 w-8 text-accent-rust" />
              </div>
            )}
            {state === "error" && (
              <div className="h-16 w-16 rounded-full bg-rose-50 border-2 border-rose-300 flex items-center justify-center animate-scale-in">
                <CircleAlert className="h-8 w-8 text-rose-600" />
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-ink-900">
            {state === "running" && "Automation still in progress"}
            {state === "success" && "Automation completed"}
            {state === "warning" && "Submitted, but not executed"}
            {state === "error" && "Automation failed"}
            {state === "idle" && "Preparing"}
          </h3>

          {/* Subtitle / message */}
          <p className="text-sm text-ink-400 mt-2 max-w-sm whitespace-pre-line">
            {state === "running"
              ? message || "Please wait…"
              : message || ""}
          </p>

          {/* Loading-bar shimmer under the message while running */}
          {state === "running" && (
            <div className="mt-6 w-full max-w-xs h-1 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full animate-loading-bar" />
            </div>
          )}
        </div>

        {/* Engine response expander on terminal states */}
        {result && isTerminal && (
          <details className="mt-6 group">
            <summary className="cursor-pointer text-xs text-ink-400 hover:text-ink-900 transition list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition inline-block">▶</span>
              Engine response
            </summary>
            <pre className="mt-2 rounded-md border border-ink-100 bg-ink-50 p-3 text-[11px] text-ink-700 max-h-48 overflow-auto font-mono whitespace-pre-wrap">
              {result}
            </pre>
          </details>
        )}

        {(primaryAction || secondaryAction) && isTerminal && (
          <div className="mt-6 flex justify-center gap-3">
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
  );
}

function SmoothSpinner() {
  return (
    <div className="relative h-20 w-20">
      {/* outer ring with brand gradient */}
      <div className="absolute inset-0 rounded-full border-2 border-ink-100" />
      <Loader2
        className="absolute inset-0 m-auto h-12 w-12 text-brand-500 animate-spin"
        style={{ animationDuration: "1.4s" }}
      />
      {/* glow halo */}
      <div className="absolute inset-2 rounded-full bg-brand-500/5 animate-glow-pulse" />
    </div>
  );
}
