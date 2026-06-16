import { NextResponse } from "next/server";
import { getAutomation } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const automation = getAutomation(params.id);
  if (!automation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ automation });
}
