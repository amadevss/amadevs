import { NextRequest, NextResponse } from "next/server";
import { markExpiredHolds } from "@/lib/agenda/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Libera los "holds" vencidos (reservas en pending_payment cuyo hold_expires_at
 * ya pasó). Lo llama Vercel Cron cada 10 min con
 *   Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const released = await markExpiredHolds();
    return NextResponse.json({ ok: true, released });
  } catch (err) {
    console.error("[cron/release-holds]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
