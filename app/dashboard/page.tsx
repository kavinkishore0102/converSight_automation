import Link from "next/link";
import { ArrowRight, ListChecks, Workflow, Activity } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listAutomations, listRequestsByUser } from "@/lib/db";
import PageHeader from "@/components/page-header";
import StatusBadge from "@/components/status-badge";
import { timeAgo } from "@/lib/utils";

export default async function UserDashboard() {
  const session = (await getSession())!;
  const automations = listAutomations().filter((a) => a.enabled);
  const requests = listRequestsByUser(session.userId);

  const stats = [
    { label: "Available Automations", value: automations.length, Icon: Workflow, color: "text-brand-300" },
    { label: "My Requests", value: requests.length, Icon: ListChecks, color: "text-sky-300" },
    {
      label: "Pending",
      value: requests.filter((r) => r.status === "Waiting for Approval").length,
      Icon: Activity,
      color: "text-amber-300",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title={`Welcome back, ${session.name.split(" ")[0]}`}
        subtitle="Run ConverSight automations and track your requests."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Popular automations</h2>
          <Link href="/dashboard/automations" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.slice(0, 6).map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/automations/${a.id}`}
              className="card p-5 hover:border-brand-500/40 hover:shadow-glow transition group"
            >
              <div className="flex items-start justify-between">
                <span className="badge bg-slate-800 text-slate-300 border border-slate-700">
                  {a.category}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-brand-400 transition" />
              </div>
              <div className="mt-3 font-medium">{a.name}</div>
              <div className="mt-1 text-sm text-slate-400 line-clamp-2">{a.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent requests</h2>
          <Link href="/dashboard/requests" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="card overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              You haven't submitted any requests yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Automation</th>
                  <th className="text-left px-5 py-3">Environment</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                    <td className="px-5 py-3 font-medium">{r.automationName}</td>
                    <td className="px-5 py-3 text-slate-300">{r.environment}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 text-slate-400">{timeAgo(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
