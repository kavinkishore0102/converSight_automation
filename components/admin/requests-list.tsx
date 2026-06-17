"use client";

import { useState, useTransition } from "react";
import { AsanaRequest } from "@/lib/asana";
import StatusBadge from "@/components/ui/status-badge";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  ClipboardList,
} from "lucide-react";

const TABS = ["All", "Waiting for Approval", "In Progress", "Completed", "Rejected"] as const;
type Tab = (typeof TABS)[number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailsPanel({ request }: { request: AsanaRequest }) {
  const fields = Object.entries(request.data ?? {});
  return (
    <div className="bg-ink-50 border-t border-ink-100 px-5 py-4 space-y-3 text-sm">
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
      {request.details && (
        <div>
          <div className="label mb-1">Additional details</div>
          <p className="text-ink-600">{request.details}</p>
        </div>
      )}
      {request.adminNote && (
        <div>
          <div className="label mb-1">Admin note</div>
          <p className="text-ink-600 whitespace-pre-wrap">{request.adminNote}</p>
        </div>
      )}
      {request.result && (
        <div>
          <div className="label mb-1">Engine result</div>
          <pre className="text-xs bg-white border border-ink-100 rounded-lg p-3 overflow-x-auto text-ink-600 max-h-48">
            {request.result}
          </pre>
        </div>
      )}
      {request.asanaTaskId && (
        <div className="text-xs text-ink-400">
          Asana task:{" "}
          <a
            href={`https://app.asana.com/0/1215194143042801/${request.asanaTaskId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline"
          >
            {request.asanaTaskId}
          </a>
        </div>
      )}
    </div>
  );
}

function RequestRow({
  request,
  onAction,
}: {
  request: AsanaRequest;
  onAction: (id: string, action: "approve" | "reject") => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const isPending = request.status === "Waiting for Approval";

  async function handle(action: "approve" | "reject") {
    setBusy(action);
    await onAction(request.id, action);
    setBusy(null);
  }

  return (
    <div className="card overflow-hidden animate-fade-up">
      {/* Row header */}
      <div
        className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-ink-50/50 transition"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink-900 text-sm">{request.automationName}</span>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-ink-600 truncate">{request.summary}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-400">
            <span>{request.requesterEmail}</span>
            <span>{request.environment}</span>
            <span>{formatDate(request.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPending && (
            <>
              <button
                className="btn-primary h-8 px-3 text-xs"
                disabled={!!busy}
                onClick={(e) => { e.stopPropagation(); handle("approve"); }}
              >
                {busy === "approve" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve
              </button>
              <button
                className="btn-danger h-8 px-3 text-xs"
                disabled={!!busy}
                onClick={(e) => { e.stopPropagation(); handle("reject"); }}
              >
                {busy === "reject" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Reject
              </button>
            </>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-ink-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-ink-400" />
          )}
        </div>
      </div>

      {/* Expandable detail panel */}
      {expanded && <DetailsPanel request={request} />}
    </div>
  );
}

export default function RequestsList({
  initialRequests,
}: {
  initialRequests: AsanaRequest[];
}) {
  const [requests, setRequests] = useState<AsanaRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<Tab>("Waiting for Approval");
  const [isPending, startTransition] = useTransition();

  const counts = TABS.reduce<Record<Tab, number>>((acc, tab) => {
    acc[tab] =
      tab === "All"
        ? requests.length
        : requests.filter((r) => r.status === tab).length;
    return acc;
  }, {} as Record<Tab, number>);

  const visible =
    activeTab === "All" ? requests : requests.filter((r) => r.status === activeTab);

  async function refresh() {
    startTransition(async () => {
      const res = await fetch("/api/admin/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    });
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    // Re-fetch fresh data from Asana after any action
    const updated = await fetch("/api/admin/requests");
    if (updated.ok) {
      const data = await updated.json();
      setRequests(data.requests ?? []);
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`chip ${activeTab === tab ? "chip-active" : ""}`}
            >
              {tab}
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                  ${activeTab === tab ? "bg-brand-500/20 text-brand-700" : "bg-ink-100 text-ink-500"}`}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={refresh}
          disabled={isPending}
          className="btn-secondary h-8 px-3 text-xs"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      </div>

      {/* Request cards */}
      {visible.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <ClipboardList className="h-10 w-10 text-ink-200" />
          <p className="text-sm text-ink-400">
            {activeTab === "Waiting for Approval"
              ? "No requests pending approval"
              : `No ${activeTab.toLowerCase()} requests`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <RequestRow key={r.id} request={r} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
