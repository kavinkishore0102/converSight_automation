import Link from "next/link";
import { ArrowRight, Workflow } from "lucide-react";
import { listAutomations } from "@/lib/db";
import PageHeader from "@/components/page-header";

export default function UserAutomations() {
  const automations = listAutomations().filter((a) => a.enabled);

  const grouped = automations.reduce<Record<string, typeof automations>>((acc, a) => {
    (acc[a.category] ||= []).push(a);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Automations"
        subtitle="Browse and trigger ConverSight automations."
      />

      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="mb-8">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            {cat}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/automations/${a.id}`}
                className="card p-5 hover:border-brand-500/40 hover:shadow-glow transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                    <Workflow className="h-4 w-4 text-brand-300" />
                  </div>
                  <div className="font-medium flex-1">{a.name}</div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-brand-400 transition" />
                </div>
                <div className="mt-3 text-sm text-slate-400 line-clamp-2">{a.description}</div>
                <div className="mt-3 text-xs text-slate-500">
                  {a.fields.length} field{a.fields.length === 1 ? "" : "s"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
