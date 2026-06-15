import Link from "next/link";
import { ArrowRight, Workflow, ListChecks, CheckCircle2, Clock } from "lucide-react";
import { listAutomations, listRequests } from "@/lib/db";
import PageHeader from "@/components/page-header";
import StatusBadge from "@/components/status-badge";
import { timeAgo } from "@/lib/utils";

export default function AdminOverview() {
  const automations = listAutomations();
  const requests = listRequests();

  const stats = [
    { label: "Automations", value: automations.length, Icon: Workflow, color: "text-brand-300" },
    { label: "Total Requests", value: requests.length, Icon: ListChecks, color: "text-sky-300" },
    {
      label: "Pending Approval",
      value: requests.filter((r) => r.status === "Waiting for Approval").length,
      Icon: Clock,
      color: "text-amber-300",
    },
    {
      label: "Completed",
      value: requests.filter((r) => r.status === "Completed").length,
      Icon: CheckCircle2,
      color: "text-emerald-300",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Admin Overview"
        subtitle="Monitor automation usage and incoming requests."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <div key={s.label} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">{s.label}</div>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</div>
            </div>
          );
        })}
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-medium">Recent requests</h2>
            <Link href="/admin/requests" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {requests.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No requests yet.</div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {requests.slice(0, 6).map((r) => (
                <li key={r.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.automationName}</div>
                    <div className="text-xs text-slate-500">
                      {r.requesterName} · {timeAgo(r.createdAt)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-medium">Automations</h2>
            <Link href="/admin/automations" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-slate-800">
            {automations.slice(0, 6).map((a) => (
              <li key={a.id} className="px-5 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Workflow className="h-3.5 w-3.5 text-brand-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs text-slate-500">{a.category}</div>
                </div>
                <span className={`badge ${a.enabled ? "badge-completed" : "badge-rejected"}`}>
                  {a.enabled ? "Enabled" : "Disabled"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
