import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAutomation } from "@/lib/db";
import RequestForm from "./request-form";

export default function AutomationRequestPage({ params }: { params: { id: string } }) {
  const automation = getAutomation(params.id);
  if (!automation || !automation.enabled) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href="/automations"
        className="text-sm text-ink-400 hover:text-ink-900 inline-flex items-center gap-1 mb-6 transition group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition" />
        Back to automations
      </Link>

      <div className="animate-fade-up">
        <div className="flex items-center gap-2 text-xs">
          <span className="badge bg-white text-ink-700 border border-ink-100">
            {automation.category}
          </span>
          {automation.requiresApproval ? (
            <span className="badge bg-accent-amber/15 text-accent-rust border border-accent-amber/40">
              Admin approval required
            </span>
          ) : (
            <span className="badge bg-brand-500/10 text-brand-700 border border-brand-500/25">
              Runs automatically
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mt-3">{automation.name}</h1>
        <p className="text-ink-400 mt-2 max-w-2xl">{automation.description}</p>
      </div>

      <div className="card p-6 mt-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <RequestForm automation={automation} />
      </div>
    </div>
  );
}
