import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { listPaymentsForDashboard } from "@/lib/agenda/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  if (!isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const payments = await listPaymentsForDashboard();
  return NextResponse.json({ payments });
}
