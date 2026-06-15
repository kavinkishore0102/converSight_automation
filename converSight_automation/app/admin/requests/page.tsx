import { listAutomations, listRequests } from "@/lib/db";
import PageHeader from "@/components/page-header";
import StatusBadge from "@/components/status-badge";
import { timeAgo } from "@/lib/utils";
import RequestRow from "./request-row";

export default function AdminRequests() {
  const requests = listRequests();
  const automations = listAutomations();
  const runnableAutomationIds = new Set(
    automations.filter((a) => !!a.backendCategory).map((a) => a.id)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Requests"
        subtitle="Review and update the status of automation requests."
      />

      <div className="card overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No requests have been submitted yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Automation</th>
                <th className="text-left px-5 py-3">Requester</th>
                <th className="text-left px-5 py-3">Environment</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Submitted</th>
                <th className="text-right px-5 py-3">Update</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <RequestRow
                  key={r.id}
                  request={r}
                  runnable={runnableAutomationIds.has(r.automationId)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
