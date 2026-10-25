import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { deletePromotion, setPromotionActive } from "@/lib/cursos/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };
const validId = (id: string) => /^promo_[A-Za-z0-9]+$/.test(id);

/** Pausar o reactivar un código. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  if (!validId(id)) return bad("Cupón no encontrado", 404);
  const body = await req.json().catch(() => ({}));
  try {
    await setPromotionActive(id, body?.active === true);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[dashboard/cupones] activar", err);
    return bad("No se pudo actualizar el cupón", 502);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  if (!validId(id)) return bad("Cupón no encontrado", 404);
  try {
    await deletePromotion(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[dashboard/cupones] borrar", err);
    return bad("No se pudo borrar el cupón", 502);
  }
}
