import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { isUuid } from "@/lib/cursos/sql";
import { normalizeSaleInput, saveCourseSale } from "@/lib/cursos/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };

/** Precio y opciones de pago del curso; sincroniza el producto y el precio en Stripe. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  if (!isUuid(id)) return bad("Curso no encontrado", 404);
  const parsed = normalizeSaleInput((await req.json().catch(() => ({}))) ?? {});
  if (!parsed.ok) return bad(parsed.error);
  try {
    const course = await saveCourseSale(id, parsed.value);
    if (!course) return bad("Solo los cursos públicos se pueden vender", 404);
    return NextResponse.json({ course });
  } catch (err) {
    console.error("[dashboard/cursos] venta", err);
    const msg = (err as { message?: string })?.message;
    return bad(`Se guardó el precio, pero Stripe respondió con un error${msg ? `: ${msg}` : ""}`, 502);
  }
}
