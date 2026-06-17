import { NextResponse } from "next/server";
import { getAutomation } from "@/lib/db";
import { buildDetails, executeAutomation } from "@/lib/automation-engine";
import { getAsanaRequest, moveAsanaTask, updateAsanaRequestMeta } from "@/lib/asana";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.admin.requests");

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const taskGid = params.id;
  const body    = await req.json();
  const { action, adminNote } = body as { action: "approve" | "reject"; adminNote?: string };

  const request = await getAsanaRequest(taskGid);
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.status !== "Waiting for Approval") {
    return NextResponse.json(
      { error: `Request is already "${request.status}" and cannot be actioned` },
      { status: 400 },
    );
  }

  // ── REJECT ────────────────────────────────────────────────────────────────
  if (action === "reject") {
    await moveAsanaTask(taskGid, "rejected");
    await updateAsanaRequestMeta(taskGid, {
      status:     "Rejected",
      admin_note: adminNote || "Rejected by admin",
    });
    log.info("request.admin.rejected", { taskGid });
    return NextResponse.json({ request: { ...request, status: "Rejected", adminNote: adminNote || "Rejected by admin" } });
  }

  // ── APPROVE ───────────────────────────────────────────────────────────────
  if (action === "approve") {
    const automation = getAutomation(request.automationId);
    if (!automation) return NextResponse.json({ error: "Automation config not found" }, { status: 404 });

    // Move to IN PROGRESS immediately so admin sees live state
    await moveAsanaTask(taskGid, "inprogress");
    await updateAsanaRequestMeta(taskGid, { status: "In Progress" });

    try {
      const details = buildDetails(automation, request.data);
      const result  = await executeAutomation(automation.backendCategory!, details, {
        requestId:   taskGid,
        triggeredBy: "admin",
      });

      await moveAsanaTask(taskGid, "done");
      await updateAsanaRequestMeta(taskGid, {
        status:       "Completed",
        completed_at: new Date().toISOString(),
        admin_note:   adminNote ?? "",
        result:       Buffer.from(JSON.stringify(result, null, 2)).toString("base64"),
      });

      log.info("request.admin.approved_completed", { taskGid });
      return NextResponse.json({ request: { ...request, status: "Completed" }, result });
    } catch (err: any) {
      await moveAsanaTask(taskGid, "rejected");
      await updateAsanaRequestMeta(taskGid, {
        status:     "Rejected",
        admin_note: err.message,
      });
      log.error("request.admin.approved_failed", { taskGid, error: err.message });
      return NextResponse.json(
        { request: { ...request, status: "Rejected", adminNote: err.message }, error: err.message },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
}
