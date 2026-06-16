"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search, Sparkles, Workflow } from "lucide-react";
import { Automation } from "@/lib/db";

export default function AutomationsBrowser({ automations }: { automations: Automation[] }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");

  const categories = useMemo(() => {
    const s = new Set<string>();
    automations.forEach((a) => s.add(a.category));
    return ["All", ...Array.from(s).sort()];
  }, [automations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return automations.filter((a) => {
      if (activeCat !== "All" && a.category !== activeCat) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [automations, query, activeCat]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <section className="text-center mb-12 animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs text-brand-300 mb-4">
          <Sparkles className="h-3 w-3" />
          {automations.length} automations available
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          ConverSight Automations
        </h1>
        <p className="text-slate-400 mt-4 max-w-xl mx-auto">
          Trigger production-grade automations without leaving your browser. Fill the form, hit run, watch it happen.
        </p>
      </section>

      {/* Search + filters */}
      <div className="sticky top-14 z-20 -mx-6 px-6 py-3 mb-8 bg-slate-950/70 backdrop-blur-md border-y border-slate-800/60 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              className="input pl-9 h-10"
              placeholder="Search automations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeCat === c
                    ? "bg-brand-500/20 text-brand-200 border border-brand-500/40"
                    : "bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500 animate-fade-in">
          No automations match <span className="text-slate-300">&ldquo;{query}&rdquo;</span>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a, idx) => (
            <Link
              key={a.id}
              href={`/dashboard/automations/${a.id}`}
              className="card p-5 smooth-card group relative overflow-hidden animate-fade-up"
              style={{ animationDelay: `${Math.min(idx * 40, 600)}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center group-hover:bg-brand-500/20 transition">
                  <Workflow className="h-4 w-4 text-brand-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium leading-tight truncate">{a.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{a.category}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-brand-300 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="mt-3 text-sm text-slate-400 line-clamp-2 min-h-[40px]">
                {a.description}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px]">
                <span className="text-slate-500">
                  {a.fields.length} field{a.fields.length === 1 ? "" : "s"}
                </span>
                {a.requiresApproval ? (
                  <span className="badge bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Approval
                  </span>
                ) : (
                  <span className="badge bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Auto-run
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
