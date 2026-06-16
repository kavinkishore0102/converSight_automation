import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAutomation, getRequest, updateRequest } from "@/lib/db";
import { buildDetails, executeAutomation } from "@/lib/automation-engine";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.requests.execute");

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const request = getRequest(params.id);
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const automation = getAutomation(request.automationId);
  if (!automation?.backendCategory) {
    return NextResponse.json(
      { error: "This automation is not wired to the automation engine yet." },
      { status: 400 }
    );
  }

  log.info("execute.invoked", {
    requestId: request.id,
    automation: automation.name,
    backendCategory: automation.backendCategory,
    adminEmail: session.email,
    previousStatus: request.status,
  });

  updateRequest(params.id, { status: "In Progress" });

  try {
    const details = buildDetails(automation, request.data);
    const result = await executeAutomation(automation.backendCategory, details, {
      requestId: request.id,
      triggeredBy: session.email,
    });

    if ((result as any)?.simulated) {
      const note =
        "Engine is not configured (UE_BASE_URL / UE_STEP_FLOW_CRN / UE_BEARER_TOKEN missing). " +
        "No real call was made — ArangoDB was NOT updated.";
      const updated = updateRequest(params.id, {
        status: "Waiting for Approval",
        adminNote: note,
        result: JSON.stringify(result, null, 2),
      });
      log.warn("execute.simulated", {
        requestId: request.id,
        reason: "engine_not_configured",
      });
      return NextResponse.json({ request: updated, result, warning: note }, { status: 200 });
    }

    const updated = updateRequest(params.id, {
      status: "Completed",
      result: JSON.stringify(result, null, 2),
    });
    log.info("execute.completed", {
      requestId: request.id,
      resultStatus: (result as any)?.status,
    });
    return NextResponse.json({ request: updated, result });
  } catch (err: any) {
    const updated = updateRequest(params.id, {
      status: "Rejected",
      adminNote: err.message,
    });
    log.error("execute.failed", {
      requestId: request.id,
      error: err.message,
    });
    return NextResponse.json({ request: updated, error: err.message }, { status: 502 });
  }
}
