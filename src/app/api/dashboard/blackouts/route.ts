import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DateTime } from "luxon";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import {
  BLACKOUT_OVERLAP_CODES,
  createBlackout,
  listBlackoutsForDashboard,
} from "@/lib/agenda/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

async function hasSession(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value);
}

export async function GET() {
  if (!(await hasSession())) return bad("No autorizado", 401);
  const blackouts = await listBlackoutsForDashboard();
  return NextResponse.json({ blackouts });
}

interface BlackoutInput {
  startDate?: string; // YYYY-MM-DD, hora del negocio
  startTime?: string; // HH:mm
  endDate?: string;
  endTime?: string;
  reason?: string;
}

export async function POST(req: NextRequest) {
  if (!(await hasSession())) return bad("No autorizado", 401);

  let body: BlackoutInput;
  try {
    body = (await req.json()) as BlackoutInput;
  } catch {
    return bad("JSON inválido");
  }

  const { startDate, startTime, endDate, endTime } = body;
  if (!startDate || !startTime || !endDate || !endTime) {
    return bad("Faltan fecha/hora de inicio y fin");
  }

  const start = DateTime.fromISO(`${startDate}T${startTime}`, { zone: BUSINESS_TIMEZONE });
  const end = DateTime.fromISO(`${endDate}T${endTime}`, { zone: BUSINESS_TIMEZONE });
  if (!start.isValid || !end.isValid) return bad("Fecha u hora inválida");
  if (end <= start) return bad("El fin debe ser después del inicio");

  const startIso = start.toUTC().toISO();
  const endIso = end.toUTC().toISO();
  if (!startIso || !endIso) return bad("Fecha u hora inválida");

  try {
    const blackout = await createBlackout({
      startsAt: startIso,
      endsAt: endIso,
      reason: body.reason?.trim().slice(0, 300) || null,
    });
    return NextResponse.json({ blackout });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code && BLACKOUT_OVERLAP_CODES.has(code)) {
      return bad("Ese rango se traslapa con otro bloqueo", 409);
    }
    console.error("[dashboard/blackouts] createBlackout", err);
    return bad("No se pudo crear el bloqueo", 500);
  }
}
