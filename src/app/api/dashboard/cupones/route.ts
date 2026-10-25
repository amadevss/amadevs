import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { createPromotion, normalizePromoInput } from "@/lib/cursos/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req: NextRequest) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const parsed = normalizePromoInput((await req.json().catch(() => ({}))) ?? {});
  if (!parsed.ok) return bad(parsed.error);
  try {
    await createPromotion(parsed.value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[dashboard/cupones]", err);
    return bad((err as Error).message || "No se pudo crear el cupón", 502);
  }
}
