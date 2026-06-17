import { NextResponse } from "next/server";
import { fetchAsanaRequestsByEmail } from "@/lib/asana";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const requests = await fetchAsanaRequestsByEmail(email);
  return NextResponse.json({ requests });
}
