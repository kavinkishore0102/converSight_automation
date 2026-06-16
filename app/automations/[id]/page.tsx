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
        className="text-sm text-ink-300 hover:text-ink-100 inline-flex items-center gap-1 mb-6 transition group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition" />
        Back to automations
      </Link>

      <div className="animate-fade-up">
        <div className="flex items-center gap-2 text-xs">
          <span className="badge bg-ink-800 text-ink-200 border border-ink-700">
            {automation.category}
          </span>
          {automation.requiresApproval ? (
            <span className="badge bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Admin approval required
            </span>
          ) : (
            <span className="badge bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Runs automatically
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mt-3">{automation.name}</h1>
        <p className="text-ink-300 mt-2 max-w-2xl">{automation.description}</p>
      </div>

      <div className="card p-6 mt-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <RequestForm automation={automation} />
      </div>
    </div>
  );
}
