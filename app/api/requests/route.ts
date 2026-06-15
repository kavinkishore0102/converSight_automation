import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createRequest, getAutomation, listRequests, listRequestsByUser } from "@/lib/db";

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
  });
  return NextResponse.json({ id: request.id, request });
}
