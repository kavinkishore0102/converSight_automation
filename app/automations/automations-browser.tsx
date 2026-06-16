"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Search, ShieldCheck, Sparkles, Workflow, Zap } from "lucide-react";
import { Automation } from "@/lib/db";

export default function AutomationsBrowser({ automations }: { automations: Automation[] }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const autoRun = filtered.filter((a) => !a.requiresApproval);
  const approval = filtered.filter((a) => a.requiresApproval);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <section className="text-center mb-10 animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs text-brand-700 mb-4">
          <Sparkles className="h-3 w-3" />
          {automations.length} automations available
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight bg-gradient-to-br from-ink-900 via-ink-700 to-brand-600 bg-clip-text text-transparent">
          IRT Automations
        </h1>
        <p className="text-ink-400 mt-4 max-w-xl mx-auto">
          Trigger production-grade automations without leaving your browser. Fill the form, hit run, watch it happen.
        </p>
      </section>

      {/* Search + collapsible filter */}
      <div className="sticky top-14 z-20 -mx-6 px-6 py-3 mb-8 bg-ink-50/80 backdrop-blur-md border-y border-ink-100/60 animate-fade-in">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              className="input pl-9 h-11"
              placeholder="Search automations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900 hover:bg-white border border-ink-100 transition"
            >
              Filters
              {activeCat !== "All" && (
                <span className="rounded-full bg-brand-500/15 text-brand-700 px-2 py-0.5 text-[10px] font-bold">
                  {activeCat}
                </span>
              )}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`grid transition-all duration-300 ease-out ${
                filtersOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveCat(c)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        activeCat === c
                          ? "bg-brand-500/15 text-brand-700 border border-brand-500/40"
                          : "bg-white text-ink-400 border border-ink-100 hover:bg-ink-50 hover:text-ink-900"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards grid grouped by Auto-run / Approval */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-ink-400 animate-fade-in">
          No automations match <span className="text-ink-700">&ldquo;{query}&rdquo;</span>.
        </div>
      ) : (
        <div className="space-y-10">
          {autoRun.length > 0 && (
            <Section
              title="Run instantly"
              subtitle="Submit and these automations execute right away."
              Icon={Zap}
              accent="brand"
              automations={autoRun}
            />
          )}
          {approval.length > 0 && (
            <Section
              title="Requires approval"
              subtitle="An admin reviews and approves before these run."
              Icon={ShieldCheck}
              accent="amber"
              automations={approval}
              offset={autoRun.length}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  Icon,
  accent,
  automations,
  offset = 0,
}: {
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: "brand" | "amber";
  automations: Automation[];
  offset?: number;
}) {
  const tint =
    accent === "brand"
      ? "bg-brand-500/10 text-brand-700 border-brand-500/25"
      : "bg-accent-amber/15 text-accent-rust border-accent-amber/40";
  return (
    <section className="animate-fade-up">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center border ${tint}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          <p className="text-xs text-ink-400">{subtitle}</p>
        </div>
        <div className="ml-auto text-[11px] text-ink-400">
          {automations.length} item{automations.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map((a, idx) => (
          <Link
            key={a.id}
            href={`/automations/${a.id}`}
            className="card p-5 smooth-card group relative overflow-hidden animate-fade-up"
            style={{ animationDelay: `${Math.min((idx + offset) * 40, 600)}ms` }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center group-hover:bg-brand-500/20 transition">
                <Workflow className="h-4 w-4 text-brand-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium leading-tight truncate text-ink-900">{a.name}</div>
                <div className="text-[11px] text-ink-400 mt-0.5">{a.category}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="mt-3 text-sm text-ink-400 line-clamp-2 min-h-[40px]">
              {a.description}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px]">
              <span className="text-ink-400">
                {a.fields.length} field{a.fields.length === 1 ? "" : "s"}
              </span>
              {a.requiresApproval ? (
                <span className="badge bg-accent-amber/15 text-accent-rust border border-accent-amber/40">
                  Approval
                </span>
              ) : (
                <span className="badge bg-brand-500/10 text-brand-700 border border-brand-500/25">
                  Auto-run
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
