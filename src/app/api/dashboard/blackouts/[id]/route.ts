import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { deleteBlackout } from "@/lib/agenda/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  if (!isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteBlackout(id);
  if (!ok) return NextResponse.json({ error: "No se encontró el bloqueo" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
