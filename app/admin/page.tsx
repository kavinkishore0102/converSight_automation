import { fetchAllAsanaRequests } from "@/lib/asana";
import RequestsList from "@/components/admin/requests-list";
import PageHeader from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const requests = await fetchAllAsanaRequests();
  const pending  = requests.filter((r) => r.status === "Waiting for Approval").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <PageHeader
        title="Admin — Approval Queue"
        subtitle={
          pending > 0
            ? `${pending} request${pending > 1 ? "s" : ""} waiting for approval`
            : "No requests pending approval"
        }
      />
      <RequestsList initialRequests={requests} />
    </div>
  );
}
