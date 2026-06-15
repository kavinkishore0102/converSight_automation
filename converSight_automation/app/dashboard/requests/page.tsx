import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listRequestsByUser } from "@/lib/db";
import PageHeader from "@/components/page-header";
import StatusBadge from "@/components/status-badge";
import { timeAgo } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function UserRequests() {
  const session = (await getSession())!;
  const requests = listRequestsByUser(session.userId);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="My Requests"
        subtitle="Track the status of your submitted automation requests."
        actions={
          <Link href="/dashboard/automations" className="btn-primary">
            <Plus className="h-4 w-4" /> New request
          </Link>
        }
      />

      <div className="card overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-slate-300 font-medium">No requests yet</div>
            <p className="text-sm text-slate-400 mt-1">
              Submit your first automation request to see it here.
            </p>
            <Link href="/dashboard/automations" className="btn-primary mt-4 inline-flex">
              Browse automations
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">ID</th>
                <th className="text-left px-5 py-3">Automation</th>
                <th className="text-left px-5 py-3">Summary</th>
                <th className="text-left px-5 py-3">Environment</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{r.id}</td>
                  <td className="px-5 py-3 font-medium">{r.automationName}</td>
                  <td className="px-5 py-3 text-slate-300 max-w-xs truncate">{r.summary}</td>
                  <td className="px-5 py-3 text-slate-300">{r.environment}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-slate-400">{timeAgo(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
