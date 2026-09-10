import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { getStripe } from "@/lib/stripe";
import { HOLD_MINUTES, BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import { slotsForService } from "@/lib/agenda/availability";
import { generateReference } from "@/lib/agenda/reference";
import { siteUrl } from "@/lib/site";
import {
  attachCheckoutSession,
  createHold,
  getServiceBySlug,
  OVERLAP_CODES,
} from "@/lib/agenda/queries";
import type { CreateBookingInput } from "@/lib/agenda/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) =>
  NextResponse.json({ error: msg }, { status });

export async function POST(req: NextRequest) {
  let body: CreateBookingInput;
  try {
    body = (await req.json()) as CreateBookingInput;
  } catch {
    return bad("JSON inválido");
  }

  const { serviceSlug, startsAt, customer } = body ?? {};
  if (!serviceSlug || !startsAt || !customer?.name?.trim() || !customer?.email?.trim()) {
    return bad("Faltan datos obligatorios (servicio, horario, nombre y correo)");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email.trim())) {
    return bad("El correo no es válido");
  }

  const service = await getServiceBySlug(serviceSlug);
  if (!service) return bad("Ese servicio no está disponible");

  const start = DateTime.fromISO(startsAt, { zone: "utc" });
  if (!start.isValid) return bad("Fecha u hora inválida");
  const end = start.plus({ minutes: service.duration_minutes });
  const startIso = start.toISO();
  const endIso = end.toISO();
  if (!startIso || !endIso) return bad("Fecha u hora inválida");

  // Revalidar contra la disponibilidad real (el cliente pudo mandar cualquier hora).
  const dateStr = start.setZone(BUSINESS_TIMEZONE).toISODate();
  const valid =
    !!dateStr &&
    (await slotsForService(dateStr, service)).some((s) => s.startsAt === startIso);
  if (!valid) {
    return bad("Ese horario ya no está disponible", 409);
  }

  const reference = generateReference();
  const freeConfirm = service.price_cents === 0;
  const timezone = customer.timezone || BUSINESS_TIMEZONE;

  let booking;
  try {
    booking = await createHold({
      reference,
      serviceId: service.id,
      startsAt: startIso,
      endsAt: endIso,
      amountCents: service.price_cents,
      currency: service.currency,
      holdMs: HOLD_MINUTES * 60_000,
      freeConfirm,
      customer: {
        name: customer.name.trim().slice(0, 120),
        email: customer.email.trim().slice(0, 200),
        company: customer.company?.trim().slice(0, 160) || null,
        note: customer.note?.trim().slice(0, 1000) || null,
        timezone,
      },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code && OVERLAP_CODES.has(code)) {
      return bad("Ese horario ya no está disponible", 409);
    }
    console.error("[agenda/bookings] createHold", err);
    return bad("No se pudo crear la reserva", 500);
  }

  if (freeConfirm) {
    return NextResponse.json({ reference, redirectUrl: `/recibo/${reference}` });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "es",
      customer_email: customer.email.trim(),
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: service.currency,
            unit_amount: service.price_cents,
            product_data: {
              name: service.name,
              description: service.description ?? undefined,
            },
          },
        },
      ],
      metadata: { booking_id: booking.id, reference },
      payment_intent_data: {
        receipt_email: customer.email.trim(),
        metadata: { booking_id: booking.id, reference },
      },
      success_url: siteUrl(`/recibo/${reference}?s={CHECKOUT_SESSION_ID}`),
      cancel_url: siteUrl(`/agenda?cancelado=${reference}`),
      expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60,
    });

    await attachCheckoutSession(booking.id, session.id);
    return NextResponse.json({ reference, checkoutUrl: session.url });
  } catch (err) {
    console.error("[agenda/bookings] stripe", err);
    return bad("No se pudo iniciar el pago. Intenta de nuevo.", 502);
  }
}
