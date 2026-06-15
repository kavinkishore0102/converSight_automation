"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AutomationRequest, RequestStatus } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import StatusBadge from "@/components/status-badge";

const STATUSES: RequestStatus[] = [
  "Waiting for Approval",
  "Approved",
  "In Progress",
  "Completed",
  "Rejected",
];

export default function RequestRow({ request }: { request: AutomationRequest }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<RequestStatus>(request.status);
  const [note, setNote] = useState(request.adminNote ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: note }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <>
      <tr className="border-t border-slate-800 hover:bg-slate-900/40">
        <td className="px-5 py-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 font-medium hover:text-brand-300"
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {request.automationName}
          </button>
        </td>
        <td className="px-5 py-3">
          <div className="text-slate-200">{request.requesterName}</div>
          <div className="text-xs text-slate-500">{request.requesterEmail}</div>
        </td>
        <td className="px-5 py-3 text-slate-300">{request.environment}</td>
        <td className="px-5 py-3"><StatusBadge status={request.status} /></td>
        <td className="px-5 py-3 text-slate-400">{timeAgo(request.createdAt)}</td>
        <td className="px-5 py-3 text-right">
          <div className="inline-flex items-center gap-2">
            <select
              className="input h-8 py-1 text-xs w-44"
              value={status}
              onChange={(e) => setStatus(e.target.value as RequestStatus)}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={save} disabled={saving} className="btn-primary py-1 px-3 text-xs">
              Update
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-900/40">
          <td colSpan={6} className="px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Summary</div>
                <div className="text-slate-200">{request.summary || <span className="text-slate-500">—</span>}</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mt-3 mb-1">Details</div>
                <div className="text-slate-300 whitespace-pre-wrap">{request.details || <span className="text-slate-500">—</span>}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Inputs</div>
                <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3 font-mono text-xs whitespace-pre-wrap">
                  {JSON.stringify(request.data, null, 2)}
                </div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mt-3 mb-1">Admin note</div>
                <textarea
                  className="input min-h-[80px] text-sm"
                  placeholder="Note visible to the user"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
