"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles, SlidersHorizontal, Workflow, X, ClipboardList } from "lucide-react";
import { Automation } from "@/lib/db";
import MyRequestsList from "@/components/requests/my-requests-list";

type Tab = "automations" | "my-requests";

export default function AutomationsBrowser({ automations }: { automations: Automation[] }) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [tab, setTab] = useState<Tab>(
    searchParams.get("tab") === "my-requests" ? "my-requests" : "automations"
  );

  function switchTab(t: Tab) {
    setTab(t);
    const url = t === "my-requests" ? "/irt-automations?tab=my-requests" : "/irt-automations";
    router.replace(url, { scroll: false });
  }
  const [query, setQuery]       = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [filterOpen, setFilterOpen] = useState(false);

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

  const hasActiveFilter = activeCat !== "All";

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-10 border-b border-ink-100">
        {([
          { id: "automations",  label: "Automations",  Icon: Workflow },
          { id: "my-requests",  label: "My Requests",  Icon: ClipboardList },
        ] as { id: Tab; label: string; Icon: any }[]).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === id
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-ink-400 hover:text-ink-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Automations tab ─────────────────────────────────────── */}
      {tab === "automations" && (
        <>
          {/* Hero */}
          <section className="text-center mb-12 animate-fade-up">
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

          {/* Search + filter toggle */}
          <div className="sticky top-14 z-20 -mx-6 px-6 py-3 mb-8 bg-white/70 backdrop-blur-md border-y border-ink-100/60 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  className="input pl-9 h-10"
                  placeholder="Search automations…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-900 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className={`btn h-10 px-4 gap-2 border ${
                  hasActiveFilter
                    ? "bg-brand-500/10 border-brand-500/40 text-brand-700 hover:bg-brand-500/15"
                    : "bg-white border-ink-100 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {hasActiveFilter ? activeCat : "Filter"}
                </span>
                {hasActiveFilter && (
                  <span
                    onClick={(e) => { e.stopPropagation(); setActiveCat("All"); }}
                    className="ml-1 text-brand-500 hover:text-brand-700"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </button>
            </div>

            {filterOpen && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-3 animate-slide-down">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setActiveCat(c); setFilterOpen(false); }}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      activeCat === c
                        ? "bg-brand-500/20 text-brand-700 border border-brand-500/40"
                        : "bg-white/60 text-ink-500 border border-ink-100 hover:bg-white hover:text-ink-900"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-ink-400 animate-fade-in">
              No automations match <span className="text-ink-700">&ldquo;{query}&rdquo;</span>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((a, idx) => (
                <Link
                  key={a.id}
                  href={`/irt-automations/${a.id}`}
                  className="card p-5 smooth-card group relative overflow-hidden animate-fade-up"
                  style={{ animationDelay: `${Math.min(idx * 40, 600)}ms` }}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center group-hover:bg-brand-500/20 transition">
                      <Workflow className="h-4 w-4 text-brand-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight truncate">{a.name}</div>
                      <div className="text-[11px] text-ink-400 mt-0.5">{a.category}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div className="mt-3 text-sm text-ink-400 line-clamp-2 min-h-[40px]">
                    {a.description}
                  </div>
                  <div className="mt-4 flex flex-col gap-1.5 text-[11px]">
                    <span className="text-ink-400">
                      {a.fields.length} field{a.fields.length === 1 ? "" : "s"}
                    </span>
                    <div>
                      {a.requiresApproval ? (
                        <span className="badge bg-accent-amber/15 text-accent-rust border border-accent-amber/40">
                          Requires Approval
                        </span>
                      ) : (
                        <span className="badge bg-brand-500/10 text-brand-700 border border-brand-500/25">
                          Auto-run
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── My Requests tab ─────────────────────────────────────── */}
      {tab === "my-requests" && (
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-ink-900">My Requests</h2>
            <p className="text-sm text-ink-400 mt-1">Track the status of your submitted automation requests.</p>
          </div>
          <MyRequestsList />
        </div>
      )}

    </div>
  );
}
