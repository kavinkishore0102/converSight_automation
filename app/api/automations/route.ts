import { NextResponse } from "next/server";
import { listAutomations } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ automations: listAutomations() });
}
