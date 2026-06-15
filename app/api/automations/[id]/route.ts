import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteAutomation, getAutomation, updateAutomation } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const automation = getAutomation(params.id);
  if (!automation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ automation });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const automation = updateAutomation(params.id, body);
  if (!automation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ automation });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  deleteAutomation(params.id);
  return NextResponse.json({ ok: true });
}
