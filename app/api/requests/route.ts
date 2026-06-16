import { NextResponse } from "next/server";
import { createRequest, getAutomation, updateRequest } from "@/lib/db";
import { buildDetails, executeAutomation } from "@/lib/automation-engine";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.requests");

export async function POST(req: Request) {
  const body = await req.json();
  const automation = getAutomation(body.automationId);
  if (!automation) return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  if (!automation.enabled) {
    return NextResponse.json({ error: "Automation is disabled" }, { status: 400 });
  }
  if (!body.summary) {
    return NextResponse.json({ error: "Summary required" }, { status: 400 });
  }

  const requesterEmail = String(body.requesterEmail ?? "").trim();
  if (!requesterEmail) {
    return NextResponse.json({ error: "Your email is required" }, { status: 400 });
  }
  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail);
  if (!emailLike) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  const requesterName = requesterEmail.split("@")[0];

  const autoRun = !!automation.backendCategory;
  const initialStatus = autoRun ? "In Progress" : "Waiting for Approval";

  const request = createRequest({
    automationId: automation.id,
    automationName: automation.name,
    requesterId: requesterEmail,
    requesterName,
    requesterEmail,
    environment: body.environment ?? "GCP Production",
    summary: body.summary,
    details: body.details ?? "",
    data: body.data ?? {},
    status: initialStatus,
  });

  log.info("request.created", {
    requestId: request.id,
    automation: automation.name,
    backendCategory: automation.backendCategory,
    autoRun,
    requesterEmail,
    environment: request.environment,
  });

  if (autoRun) {
    try {
      const details = buildDetails(automation, request.data);
      const result = await executeAutomation(automation.backendCategory!, details, {
        requestId: request.id,
        triggeredBy: requesterEmail,
      });

      if ((result as any)?.simulated) {
        const note =
          "Engine is not configured (UE_BASE_URL / UE_STEP_FLOW_CRN / UE_BEARER_TOKEN missing). " +
          "No real call was made — ArangoDB was NOT updated.";
        const updated = updateRequest(request.id, {
          status: "Waiting for Approval",
          adminNote: note,
          result: JSON.stringify(result, null, 2),
        });
        log.warn("request.auto_run.simulated", { requestId: request.id });
        return NextResponse.json({ id: request.id, request: updated, result, warning: note });
      }

      const updated = updateRequest(request.id, {
        status: "Completed",
        result: JSON.stringify(result, null, 2),
      });
      log.info("request.auto_run.completed", {
        requestId: request.id,
        resultStatus: (result as any)?.status,
      });
      return NextResponse.json({ id: request.id, request: updated, result });
    } catch (err: any) {
      const updated = updateRequest(request.id, {
        status: "Rejected",
        adminNote: err.message,
      });
      log.error("request.auto_run.failed", { requestId: request.id, error: err.message });
      return NextResponse.json(
        { id: request.id, request: updated, error: err.message },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ id: request.id, request });
}
