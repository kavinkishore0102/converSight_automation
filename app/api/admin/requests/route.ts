import { NextResponse } from "next/server";
import { fetchAllAsanaRequests } from "@/lib/asana";

export async function GET() {
  const requests = await fetchAllAsanaRequests();
  return NextResponse.json({ requests });
}
