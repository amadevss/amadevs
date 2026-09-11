import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { HOLD_MINUTES } from "@/lib/agenda/config";
import { siteUrl } from "@/lib/site";
import {
  getBookingByReference,
  getServiceBySlug,
  resumeCheckoutSession,
} from "@/lib/agenda/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

/** Retoma el pago de una reserva que sigue "pendiente": abre una sesión de Stripe nueva. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  const booking = await getBookingByReference(reference.toUpperCase());
  if (!booking) return bad("No se encontró la reserva", 404);
  if (booking.status !== "pending_payment") {
    return bad("Esta reserva ya no está pendiente de pago", 409);
  }

  const service = await getServiceBySlug(booking.service_slug);
  if (!service) return bad("Ese servicio ya no está disponible", 409);

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "es",
      customer_email: booking.customer_email,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: booking.currency,
            unit_amount: booking.amount_cents,
            product_data: {
              name: service.name,
              description: service.description ?? undefined,
            },
          },
        },
      ],
      metadata: { booking_id: booking.id, reference: booking.reference },
      payment_intent_data: {
        receipt_email: booking.customer_email,
        metadata: { booking_id: booking.id, reference: booking.reference },
      },
      success_url: siteUrl(`/recibo/${booking.reference}?s={CHECKOUT_SESSION_ID}`),
      cancel_url: siteUrl(`/recibo/${booking.reference}`),
      expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60,
    });

    await resumeCheckoutSession(
      booking.id,
      session.id,
      new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString(),
    );
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("[agenda/bookings/pay]", err);
    return bad("No se pudo iniciar el pago. Intenta de nuevo.", 502);
  }
}
