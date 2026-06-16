import { listAutomations } from "@/lib/db";
import AutomationsBrowser from "./automations-browser";

export default function AutomationsPage() {
  const automations = listAutomations().filter((a) => a.enabled);
  return <AutomationsBrowser automations={automations} />;
}
