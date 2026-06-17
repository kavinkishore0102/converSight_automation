import { NextResponse } from "next/server";
import { getAutomation } from "@/lib/db";
import { buildDetails, executeAutomation } from "@/lib/automation-engine";
import { createAsanaRequest, moveAsanaTask, updateAsanaRequestMeta } from "@/lib/asana";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.requests");

export async function POST(req: Request) {
  const body = await req.json();
  const automation = getAutomation(body.automationId);
  if (!automation) return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  if (!automation.enabled) return NextResponse.json({ error: "Automation is disabled" }, { status: 400 });
  if (!body.summary)       return NextResponse.json({ error: "Summary required" }, { status: 400 });

  const requesterEmail = String(body.requesterEmail ?? "").trim();
  if (!requesterEmail) return NextResponse.json({ error: "Your email is required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail))
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });

  const autoRun     = !!automation.backendCategory && !automation.requiresApproval;
  const initialStatus = autoRun ? "In Progress" : "Waiting for Approval";
  const section       = autoRun ? "inprogress" : "todo";

  const request = await createAsanaRequest(automation, {
    automationId:   automation.id,
    automationName: automation.name,
    requesterEmail,
    requesterName:  requesterEmail.split("@")[0],
    summary:        body.summary,
    details:        body.details ?? "",
    environment:    body.environment ?? "GCP Production",
    data:           body.data ?? {},
    status:         initialStatus,
  }, section as any);

  if (!request) {
    return NextResponse.json({ error: "Failed to create request. Check Asana configuration." }, { status: 500 });
  }

  log.info("request.created", {
    taskGid: request.id, automation: automation.name, autoRun, requesterEmail,
  });

  if (!autoRun) {
    return NextResponse.json({ id: request.id, request });
  }

  // ── Auto-run: call engine immediately ────────────────────────────────────
  try {
    const details = buildDetails(automation, request.data);
    const result  = await executeAutomation(automation.backendCategory!, details, {
      requestId:   request.id,
      triggeredBy: requesterEmail,
    });

    await moveAsanaTask(request.id, "done");
    await updateAsanaRequestMeta(request.id, {
      status:       "Completed",
      completed_at: new Date().toISOString(),
    });

    log.info("request.auto_run.completed", { taskGid: request.id });
    return NextResponse.json({ id: request.id, request: { ...request, status: "Completed" }, result });
  } catch (err: any) {
    await moveAsanaTask(request.id, "rejected");
    await updateAsanaRequestMeta(request.id, {
      status:     "Rejected",
      admin_note: err.message,
    });

    log.error("request.auto_run.failed", { taskGid: request.id, error: err.message });
    return NextResponse.json(
      { id: request.id, request: { ...request, status: "Rejected" }, error: err.message },
      { status: 502 },
    );
  }
}
