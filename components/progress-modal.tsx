"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Loader2, X } from "lucide-react";

export type ProgressState = "idle" | "running" | "success" | "warning" | "error";

export type ProgressStep = {
  id: string;
  label: string;
};

const DEFAULT_STEPS: ProgressStep[] = [
  { id: "submitted", label: "Form submitted" },
  { id: "calling", label: "Calling Universe Engine" },
  { id: "stepflow", label: "Step Flow in progress" },
  { id: "finished", label: "Finished" },
];

type Props = {
  open: boolean;
  state: ProgressState;
  message?: string;
  result?: string;
  /** Override the step list if you need different states. */
  steps?: ProgressStep[];
  /** Index of the current step being worked on (drives the spinner). */
  current: number;
  onClose: () => void;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
};

export default function ProgressModal({
  open,
  state,
  message,
  result,
  steps = DEFAULT_STEPS,
  current,
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
      <div className="relative w-full max-w-md card p-6 animate-scale-in">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink-400">
              {state === "running" ? "Working on it" : state === "success" ? "All done" : state === "warning" ? "Action needed" : state === "error" ? "Something went wrong" : ""}
            </div>
            <h3 className="text-lg font-semibold mt-1">
              {state === "running" && "Running your automation"}
              {state === "success" && "Automation completed"}
              {state === "warning" && "Submitted, but not executed"}
              {state === "error" && "Automation failed"}
              {state === "idle" && "Preparing"}
            </h3>
          </div>
          {isTerminal && (
            <button
              onClick={onClose}
              className="text-ink-400 hover:text-ink-900 transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {message && (
          <p className="text-sm text-ink-400 mt-1 mb-4">{message}</p>
        )}

        <ol className="space-y-3 mt-5">
          {steps.map((s, i) => {
            const done = i < current || (state === "success" && i <= steps.length - 1);
            const active = i === current && state === "running";
            const failed = state === "error" && i === current;
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                    failed
                      ? "bg-rose-50 border-rose-300 text-rose-600"
                      : done
                      ? "bg-brand-500/10 border-brand-500/40 text-brand-700"
                      : active
                      ? "bg-brand-500/15 border-brand-500/50 text-brand-700 animate-glow-pulse"
                      : "bg-ink-50 border-ink-100 text-ink-400"
                  }`}
                >
                  {failed ? (
                    <CircleAlert className="h-3.5 w-3.5" />
                  ) : done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : active ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-semibold">{i + 1}</span>
                  )}
                </span>
                <span
                  className={`text-sm ${
                    failed
                      ? "text-rose-700 font-medium"
                      : done
                      ? "text-ink-900"
                      : active
                      ? "text-ink-900 font-semibold"
                      : "text-ink-400"
                  }`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>

        {result && isTerminal && (
          <details className="mt-5 group">
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
          <div className="mt-6 flex justify-end gap-3">
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
