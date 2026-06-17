import PageHeader from "@/components/ui/page-header";
import MyRequestsList from "@/components/requests/my-requests-list";
import { ClipboardList } from "lucide-react";

export default function MyRequestsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <PageHeader
        title="My Requests"
        subtitle="Track the status of your submitted automation requests."
      />
      <MyRequestsList />
    </div>
  );
}
