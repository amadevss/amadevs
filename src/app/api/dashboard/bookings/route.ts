import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DateTime } from "luxon";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import { generateReference } from "@/lib/agenda/reference";
import {
  createManualBooking,
  getServiceBySlug,
  listBookingsForDashboard,
  OVERLAP_CODES,
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
  const bookings = await listBookingsForDashboard();
  return NextResponse.json({ bookings });
}

interface ManualBookingInput {
  serviceSlug?: string;
  date?: string; // YYYY-MM-DD, hora del negocio
  time?: string; // HH:mm, hora del negocio
  amountCents?: number;
  customer?: { name?: string; email?: string; company?: string; note?: string };
}

export async function POST(req: NextRequest) {
  if (!(await hasSession())) return bad("No autorizado", 401);

  let body: ManualBookingInput;
  try {
    body = (await req.json()) as ManualBookingInput;
  } catch {
    return bad("JSON inválido");
  }

  const { serviceSlug, date, time, customer } = body;
  if (!serviceSlug || !date || !time || !customer?.name?.trim() || !customer?.email?.trim()) {
    return bad("Faltan datos obligatorios (servicio, fecha, hora, nombre y correo)");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email.trim())) {
    return bad("El correo no es válido");
  }

  const service = await getServiceBySlug(serviceSlug);
  if (!service) return bad("Ese servicio no existe");

  const start = DateTime.fromISO(`${date}T${time}`, { zone: BUSINESS_TIMEZONE });
  if (!start.isValid) return bad("Fecha u hora inválida");
  const end = start.plus({ minutes: service.duration_minutes });
  const startIso = start.toUTC().toISO();
  const endIso = end.toUTC().toISO();
  if (!startIso || !endIso) return bad("Fecha u hora inválida");

  const amountCents =
    typeof body.amountCents === "number" && Number.isFinite(body.amountCents) && body.amountCents >= 0
      ? Math.round(body.amountCents)
      : service.price_cents;

  try {
    const booking = await createManualBooking({
      reference: generateReference(),
      serviceId: service.id,
      startsAt: startIso,
      endsAt: endIso,
      amountCents,
      currency: service.currency,
      customer: {
        name: customer.name.trim().slice(0, 120),
        email: customer.email.trim().slice(0, 200),
        company: customer.company?.trim().slice(0, 160) || null,
        note: customer.note?.trim().slice(0, 1000) || null,
        timezone: BUSINESS_TIMEZONE,
      },
    });
    return NextResponse.json({
      booking: { ...booking, service_name: service.name, service_slug: service.slug },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code && OVERLAP_CODES.has(code)) {
      return bad("Ese horario se solapa con otra reserva", 409);
    }
    console.error("[dashboard/bookings] createManualBooking", err);
    return bad("No se pudo crear la reserva", 500);
  }
}
