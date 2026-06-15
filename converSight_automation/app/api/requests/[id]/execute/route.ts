import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAutomation, getRequest, updateRequest } from "@/lib/db";
import { buildDetails, executeAutomation } from "@/lib/automation-engine";

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

  updateRequest(params.id, { status: "In Progress" });

  try {
    const details = buildDetails(automation, request.data);
    const result = await executeAutomation(automation.backendCategory, details);
    const updated = updateRequest(params.id, {
      status: "Completed",
      result: JSON.stringify(result, null, 2),
    });
    return NextResponse.json({ request: updated, result });
  } catch (err: any) {
    const updated = updateRequest(params.id, {
      status: "Rejected",
      adminNote: err.message,
    });
    return NextResponse.json({ request: updated, error: err.message }, { status: 502 });
  }
}
