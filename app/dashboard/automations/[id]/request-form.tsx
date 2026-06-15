"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Automation } from "@/lib/db";

const ENVIRONMENTS = ["GCP Production", "AWS Production", "Staging", "Pre-prod", "Dev"];

export default function RequestForm({ automation }: { automation: Automation }) {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [environment, setEnvironment] = useState(ENVIRONMENTS[0]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(id: string, value: any) {
    setValues((v) => ({ ...v, [id]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automationId: automation.id,
          summary,
          details,
          environment,
          data: values,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setDone(data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto h-14 w-14 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-7 w-7 text-brand-400" />
        </div>
        <h3 className="text-lg font-semibold">Request submitted</h3>
        <p className="text-sm text-slate-400 mt-1">
          Your request <span className="text-slate-200 font-mono text-xs">{done}</span> is waiting for approval.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={() => router.push("/dashboard/requests")} className="btn-primary">
            View my requests
          </button>
          <button
            onClick={() => {
              setDone(null);
              setSummary("");
              setDetails("");
              setValues({});
            }}
            className="btn-secondary"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="label">Summary <span className="text-rose-400">*</span></label>
        <input
          required
          className="input"
          placeholder="Brief one-line description of your request"
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
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Automation Inputs
          </div>
          {automation.fields.map((f) => (
            <div key={f.id}>
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
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-500 focus:ring-brand-500"
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
              {f.helpText && <div className="mt-1 text-xs text-slate-500">{f.helpText}</div>}
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
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit request
        </button>
      </div>
    </form>
  );
}
