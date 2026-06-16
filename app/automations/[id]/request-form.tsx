"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { Automation } from "@/lib/db";
import ProgressModal, { ProgressState } from "@/components/progress-modal";

const ENVIRONMENTS = ["GCP Production", "AWS Production", "Staging", "Pre-prod", "Dev"];

export default function RequestForm({ automation }: { automation: Automation }) {
  const router = useRouter();
  const [requesterEmail, setRequesterEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [environment, setEnvironment] = useState(ENVIRONMENTS[0]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressState, setProgressState] = useState<ProgressState>("idle");
  const [progressMessage, setProgressMessage] = useState<string | undefined>();
  const [progressResult, setProgressResult] = useState<string | undefined>();
  const stepTimers = useRef<NodeJS.Timeout[]>([]);

  function setField(id: string, value: any) {
    setValues((v) => ({ ...v, [id]: value }));
  }

  function clearStepTimers() {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
  }

  function resetForm() {
    setSummary("");
    setDetails("");
    setValues({});
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    // Open modal and walk through visual progress while the request flies.
    setProgressState("running");
    setProgressStep(0);
    setProgressMessage(`Sending ${automation.name} request…`);
    setProgressResult(undefined);
    setModalOpen(true);

    clearStepTimers();
    stepTimers.current.push(setTimeout(() => setProgressStep((s) => Math.max(s, 1)), 450));
    stepTimers.current.push(setTimeout(() => setProgressStep((s) => Math.max(s, 2)), 1100));

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automationId: automation.id,
          requesterEmail,
          summary,
          details,
          environment,
          data: values,
        }),
      });
      const data = await res.json();
      clearStepTimers();

      if (!res.ok) {
        setProgressStep((s) => Math.max(s, 2));
        setProgressState("error");
        setProgressMessage(data.error || "The automation engine rejected the request.");
        setProgressResult(JSON.stringify(data, null, 2));
        return;
      }

      // Walk visually to "finished".
      setProgressStep(3);
      await new Promise((r) => setTimeout(r, 300));

      if (data.warning) {
        setProgressState("warning");
        setProgressMessage(data.warning);
      } else {
        setProgressState("success");
        setProgressMessage(`Request ${data.id} completed.`);
      }
      setProgressResult(JSON.stringify(data.result ?? data, null, 2));
    } catch (err: any) {
      clearStepTimers();
      setProgressState("error");
      setProgressMessage(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="label">Your email <span className="text-rose-400">*</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="email"
              required
              className="input pl-9"
              placeholder="you@conversight.ai"
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
            />
          </div>
          <div className="mt-1 text-xs text-ink-400">
            We&apos;ll attach this to the request so the team can follow up.
          </div>
        </div>

        <div>
          <label className="label">Summary <span className="text-rose-400">*</span></label>
          <input
            required
            className="input"
            placeholder="Brief one-line description"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Environment</label>
          <select
            className="input"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          >
            {ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>{env}</option>
            ))}
          </select>
        </div>

        {automation.fields.length > 0 && (
          <div className="space-y-4 rounded-lg border border-ink-100 bg-white/40 p-4 animate-fade-up">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Automation inputs
            </div>
            {automation.fields.map((f, i) => (
              <div key={f.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <label className="label">
                  {f.label} {f.required && <span className="text-rose-400">*</span>}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    required={f.required}
                    className="input min-h-[80px]"
                    placeholder={f.placeholder}
                    value={values[f.id] ?? ""}
                    onChange={(e) => setField(f.id, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <select
                    required={f.required}
                    className="input"
                    value={values[f.id] ?? ""}
                    onChange={(e) => setField(f.id, e.target.value)}
                  >
                    <option value="">Select an option</option>
                    {f.options?.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-ink-200 bg-white text-brand-500 focus:ring-brand-500"
                      checked={!!values[f.id]}
                      onChange={(e) => setField(f.id, e.target.checked)}
                    />
                    Yes
                  </label>
                ) : (
                  <input
                    type={f.type}
                    required={f.required}
                    className="input"
                    placeholder={f.placeholder}
                    value={values[f.id] ?? ""}
                    onChange={(e) =>
                      setField(f.id, f.type === "number" ? Number(e.target.value) : e.target.value)
                    }
                  />
                )}
                {f.helpText && <div className="mt-1 text-xs text-ink-400">{f.helpText}</div>}
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="label">Additional details</label>
          <textarea
            className="input min-h-[100px]"
            placeholder="Anything else the operator should know…"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 animate-slide-down">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Run automation
          </button>
        </div>
      </form>

      <ProgressModal
        open={modalOpen}
        state={progressState}
        current={progressStep}
        message={progressMessage}
        result={progressResult}
        onClose={() => {
          setModalOpen(false);
          clearStepTimers();
        }}
        primaryAction={{
          label: progressState === "success" ? "Run another" : "Back to form",
          onClick: () => {
            setModalOpen(false);
            clearStepTimers();
            if (progressState === "success") {
              resetForm();
              router.push("/automations");
            }
          },
        }}
        secondaryAction={{
          label: "Close",
          onClick: () => {
            setModalOpen(false);
            clearStepTimers();
          },
        }}
      />
    </>
  );
}
