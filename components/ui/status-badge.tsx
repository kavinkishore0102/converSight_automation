import { RequestStatus } from "@/lib/db";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Loader2, XCircle, ThumbsUp } from "lucide-react";

const map: Record<RequestStatus, { cls: string; Icon: any }> = {
  "Waiting for Approval": { cls: "badge-pending", Icon: Clock },
  Approved: { cls: "badge-approved", Icon: ThumbsUp },
  "In Progress": { cls: "badge-in-progress", Icon: Loader2 },
  Completed: { cls: "badge-completed", Icon: CheckCircle2 },
  Rejected: { cls: "badge-rejected", Icon: XCircle },
};

export default function StatusBadge({ status }: { status: string }) {
  const m = map[status as RequestStatus] ?? { cls: "badge-pending", Icon: Clock };
  const Icon = m.Icon;
  return (
    <span className={cn(m.cls)}>
      <Icon className={cn("h-3 w-3", status === "In Progress" && "animate-spin")} />
      {status}
    </span>
  );
}
