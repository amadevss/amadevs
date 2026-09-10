import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  claimWebhookEvent,
  confirmBookingBySession,
  expireBookingBySession,
  recordPayment,
  refundBookingByPaymentIntent,
  unclaimWebhookEvent,
} from "@/lib/agenda/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Falta firma o STRIPE_WEBHOOK_SECRET" }, { status: 400 });
  }

  const raw = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Firma inválida: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  // Idempotencia: si ya procesamos este evento, salir.
  if (!(await claimWebhookEvent(event.id, event.type))) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break;

        const piId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        let receiptUrl: string | null = null;
        let chargeId: string | null = null;
        let amountCents = session.amount_total ?? 0;
        let currency = session.currency ?? "mxn";

        if (piId) {
          const pi = await stripe.paymentIntents.retrieve(piId, {
            expand: ["latest_charge"],
          });
          const charge = pi.latest_charge as Stripe.Charge | null;
          receiptUrl = charge?.receipt_url ?? null;
          chargeId = charge?.id ?? null;
          amountCents = pi.amount ?? amountCents;
          currency = pi.currency ?? currency;
        }

        const booking = await confirmBookingBySession({
          sessionId: session.id,
          paymentIntentId: piId ?? "",
          receiptUrl,
        });

        if (booking) {
          await recordPayment({
            bookingId: booking.id,
            paymentIntentId: piId,
            chargeId,
            amountCents,
            currency,
            status: "succeeded",
            receiptUrl,
            raw: event,
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await expireBookingBySession(session.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id ?? null;
        if (piId) await refundBookingByPaymentIntent(piId);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook]", event.type, err);
    // Soltar el registro para que Stripe reintente el mismo evento.
    await unclaimWebhookEvent(event.id).catch(() => {});
    return NextResponse.json({ error: "Fallo al procesar" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
