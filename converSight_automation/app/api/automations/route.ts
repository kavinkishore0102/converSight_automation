import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAutomation, listAutomations } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ automations: listAutomations() });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.name || !body.category) {
    return NextResponse.json({ error: "Name and category required" }, { status: 400 });
  }
  const automation = createAutomation({
    name: body.name,
    category: body.category,
    description: body.description ?? "",
    enabled: body.enabled ?? true,
    fields: Array.isArray(body.fields) ? body.fields : [],
    icon: body.icon,
  });
  return NextResponse.json({ automation });
}
