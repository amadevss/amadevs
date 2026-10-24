import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { addMissingWebhookEvents } from "@/lib/cursos/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

/** Agrega a un webhook de Stripe los eventos que la plataforma necesita. */
export async function POST(req: NextRequest) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const body = await req.json().catch(() => ({}));
  const id = String(body?.endpointId ?? "");
  if (!/^we_[A-Za-z0-9]+$/.test(id)) return bad("Webhook inválido");
  try {
    return NextResponse.json({ added: await addMissingWebhookEvents(id) });
  } catch (err) {
    console.error("[dashboard/stripe] webhook", err);
    return bad("Stripe no permitió actualizar el webhook", 502);
  }
}
