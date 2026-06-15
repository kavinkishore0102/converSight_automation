import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createRequest,
  getAutomation,
  listRequests,
  listRequestsByUser,
  updateRequest,
} from "@/lib/db";
import { buildDetails, executeAutomation } from "@/lib/automation-engine";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.requests");

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requests = session.role === "admin" ? listRequests() : listRequestsByUser(session.userId);
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const automation = getAutomation(body.automationId);
  if (!automation) return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  if (!automation.enabled) {
    return NextResponse.json({ error: "Automation is disabled" }, { status: 400 });
  }
  if (!body.summary) {
    return NextResponse.json({ error: "Summary required" }, { status: 400 });
  }

  // Decide initial status based on approval requirement.
  const autoRun = !automation.requiresApproval && !!automation.backendCategory;
  const initialStatus = autoRun ? "In Progress" : "Waiting for Approval";

  const request = createRequest({
    automationId: automation.id,
    automationName: automation.name,
    requesterId: session.userId,
    requesterName: session.name,
    requesterEmail: session.email,
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
    requiresApproval: !!automation.requiresApproval,
    autoRun,
    requesterEmail: session.email,
    environment: request.environment,
  });

  // Auto-run path: invoke the engine immediately, update status with the result.
  if (autoRun) {
    try {
      const details = buildDetails(automation, request.data);
      const result = await executeAutomation(automation.backendCategory!, details, {
        requestId: request.id,
        triggeredBy: session.email,
      });
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
      log.error("request.auto_run.failed", {
        requestId: request.id,
        error: err.message,
      });
      return NextResponse.json(
        { id: request.id, request: updated, error: err.message },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ id: request.id, request });
}
