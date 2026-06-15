import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAutomation } from "@/lib/db";
import PageHeader from "@/components/page-header";
import RequestForm from "./request-form";

export default function AutomationRequestPage({ params }: { params: { id: string } }) {
  const automation = getAutomation(params.id);
  if (!automation || !automation.enabled) notFound();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/automations" className="text-sm text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to automations
      </Link>

      <PageHeader
        title={automation.name}
        subtitle={automation.description}
      />

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="badge bg-slate-800 text-slate-300 border border-slate-700">
            {automation.category}
          </span>
          <span className="text-xs text-slate-500">
            {automation.fields.length} input field{automation.fields.length === 1 ? "" : "s"}
          </span>
        </div>

        <RequestForm automation={automation} />
      </div>
    </div>
  );
}
