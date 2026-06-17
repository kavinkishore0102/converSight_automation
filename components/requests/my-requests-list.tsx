"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/status-badge";
import {
  Search, RefreshCw, Loader2, ClipboardList,
  ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";

type DisplayRequest = {
  id: string;
  automationName: string;
  category?: string;
  requesterEmail: string;
  summary: string;
  environment?: string;
  status: string;
  asanaTaskId?: string;
  createdAt: string;
  completedAt?: string | null;
  data?: Record<string, any>;
  adminNote?: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function RequestRow({ request }: { request: DisplayRequest }) {
  const [expanded, setExpanded] = useState(false);
  const fields = Object.entries(request.data ?? {});

  return (
    <div className="card overflow-hidden animate-fade-up">
      <div
        className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-ink-50/50 transition"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-ink-900">{request.automationName}</span>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-ink-500 truncate">{request.summary}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-400">
            {request.environment && <span>{request.environment}</span>}
            {request.category && <><span className="text-ink-300">·</span><span>{request.category}</span></>}
            <span>Submitted {formatDate(request.createdAt)}</span>
            {request.completedAt && <span>Completed {formatDate(request.completedAt)}</span>}
          </div>
        </div>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-ink-400 shrink-0 mt-1" />
          : <ChevronDown className="h-4 w-4 text-ink-400 shrink-0 mt-1" />}
      </div>

      {expanded && (
        <div className="bg-ink-50 border-t border-ink-100 px-5 py-4 space-y-3 text-sm animate-fade-in">
          {fields.length > 0 && (
            <div>
              <div className="label mb-2">Parameters</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                {fields.map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-ink-400 shrink-0">{k}:</span>
                    <span className="text-ink-700 font-medium break-all">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {request.status === "Waiting for Approval" && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
              Your request is pending admin approval. You will see the status update here once actioned.
            </div>
          )}
          {request.status === "Completed" && (
            <div className="rounded-lg bg-brand-500/8 border border-brand-500/20 px-3 py-2.5 text-xs text-brand-700">
              Automation completed successfully. Changes have been applied.
            </div>
          )}
          {request.status === "Rejected" && request.adminNote && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700">
              <span className="font-semibold">Reason: </span>{request.adminNote}
            </div>
          )}

          {request.asanaTaskId && (
            <a
              href={`https://app.asana.com/0/1215194143042801/${request.asanaTaskId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View in Asana
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyRequestsList() {
  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState<DisplayRequest[]>([]);
  const [loading, setLoading]   = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cs_requester_email");
    if (stored) setEmail(stored);
  }, []);

  async function fetchRequests(addr: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/my-requests?email=${encodeURIComponent(addr)}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
        setLastRefreshed(new Date());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    localStorage.setItem("cs_requester_email", email.trim());
    setSubmitted(true);
    await fetchRequests(email.trim());
  }

  const pending   = requests.filter((r) => r.status === "Waiting for Approval").length;
  const completed = requests.filter((r) => r.status === "Completed").length;
  const rejected  = requests.filter((r) => r.status === "Rejected").length;

  return (
    <div className="space-y-5">
      {/* Email search */}
      <form onSubmit={handleSearch} className="card p-5">
        <div className="label mb-2">Your email address</div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="email"
              required
              className="input pl-9"
              placeholder="you@conversight.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary px-5" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Track
          </button>
        </div>
      </form>

      {submitted && (
        <>
          {/* Stats row */}
          {requests.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Pending",   count: pending,   cls: "text-amber-600 bg-amber-50 border-amber-200" },
                { label: "Completed", count: completed, cls: "text-brand-700 bg-brand-500/8 border-brand-500/20" },
                { label: "Rejected",  count: rejected,  cls: "text-rose-600 bg-rose-50 border-rose-200" },
              ].map((s) => (
                <div key={s.label} className={`card px-4 py-3 border text-center ${s.cls}`}>
                  <div className="text-2xl font-bold">{s.count}</div>
                  <div className="text-xs font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-500">
              {requests.length} request{requests.length !== 1 ? "s" : ""}
              {lastRefreshed && (
                <span className="ml-2 text-ink-400">· refreshed {lastRefreshed.toLocaleTimeString()}</span>
              )}
            </p>
            <button
              onClick={() => fetchRequests(email)}
              disabled={loading}
              className="btn-secondary h-8 px-3 text-xs"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </button>
          </div>

          {/* Request list */}
          {requests.length === 0 ? (
            <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ClipboardList className="h-10 w-10 text-ink-200" />
              <p className="text-sm text-ink-400">No requests found for this email.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <RequestRow key={r.id} request={r} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
