import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/page-header";
import AutomationEditor from "@/components/automation-editor";

export default function NewAutomation() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/admin/automations"
        className="text-sm text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to automations
      </Link>
      <PageHeader
        title="New Automation"
        subtitle="Define a new automation template for users to request."
      />
      <AutomationEditor />
    </div>
  );
}
