import Link from "next/link";
import { Plus, Workflow } from "lucide-react";
import { listAutomations } from "@/lib/db";
import PageHeader from "@/components/page-header";
import AutomationActions from "./actions";

export default function AdminAutomations() {
  const automations = listAutomations();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Automations"
        subtitle="Create, edit and manage automation templates available to users."
        actions={
          <Link href="/admin/automations/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New automation
          </Link>
        }
      />

      <div className="card overflow-hidden">
        {automations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-slate-300 font-medium">No automations yet</div>
            <p className="text-sm text-slate-400 mt-1">Create your first automation template.</p>
            <Link href="/admin/automations/new" className="btn-primary inline-flex mt-4">
              <Plus className="h-4 w-4" /> New automation
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Fields</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {automations.map((a) => (
                <tr key={a.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <Workflow className="h-3.5 w-3.5 text-brand-300" />
                      </div>
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-md">{a.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-300">{a.category}</td>
                  <td className="px-5 py-3 text-slate-300">{a.fields.length}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${a.enabled ? "badge-completed" : "badge-rejected"}`}>
                      {a.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <AutomationActions id={a.id} enabled={a.enabled} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
