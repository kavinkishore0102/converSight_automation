import { Suspense } from "react";
import { listAutomations } from "@/lib/db";
import AutomationsBrowser from "@/components/automations/automations-browser";

export default function AutomationsPage() {
  const automations = listAutomations().filter((a) => a.enabled);
  return (
    <Suspense>
      <AutomationsBrowser automations={automations} />
    </Suspense>
  );
}
