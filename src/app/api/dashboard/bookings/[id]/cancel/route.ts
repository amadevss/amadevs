import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { cancelBookingById } from "@/lib/agenda/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  if (!isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await cancelBookingById(id);
  if (!booking) {
    return NextResponse.json({ error: "No se pudo cancelar (ya no está activa)" }, { status: 409 });
  }
  return NextResponse.json({ booking });
}
