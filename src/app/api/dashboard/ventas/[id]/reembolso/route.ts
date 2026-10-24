import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { getPurchase, refundPurchase } from "@/lib/cursos/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };

/** Reembolso total (sin monto) o parcial (`amount` en pesos/dólares). */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const purchase = await getPurchase((await params).id);
  if (!purchase) return bad("Compra no encontrada", 404);
  if (!["paid", "partially_refunded"].includes(purchase.status)) return bad("Esta compra no se puede reembolsar");
  const body = await req.json().catch(() => ({}));
  const amount = body?.amount ? Math.round(Number(body.amount) * 100) : undefined;
  if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) return bad("Monto inválido");
  try {
    await refundPurchase(purchase, amount);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[dashboard/ventas] reembolso", err);
    return bad((err as Error).message || "No se pudo reembolsar", 502);
  }
}
