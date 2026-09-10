/**
 * Simula un webhook de Stripe contra el endpoint local, firmándolo con
 * STRIPE_WEBHOOK_SECRET. Útil para probar la confirmación de reservas sin
 * tener el Stripe CLI instalado.
 *
 * Uso:
 *   node --env-file=.env scripts/agenda-sim-webhook.mjs <checkout_session_id> [tipo]
 *   tipo por defecto: checkout.session.completed
 *   otros: checkout.session.expired
 */
import Stripe from "stripe";

const sessionId = process.argv[2];
const type = process.argv[3] || "checkout.session.completed";
if (!sessionId) {
  console.error("Uso: node --env-file=.env scripts/agenda-sim-webhook.mjs <cs_...> [tipo]");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);
const secret = process.env.STRIPE_WEBHOOK_SECRET;
const url = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/api/stripe/webhook";

const session = await stripe.checkout.sessions.retrieve(sessionId);
console.log("session:", session.id, "| payment_status:", session.payment_status, "| pi:", session.payment_intent);

const event = {
  id: "evt_sim_" + Date.now(),
  object: "event",
  api_version: "2026-08-26.dahlia",
  created: Math.floor(Date.now() / 1000),
  type,
  livemode: false,
  data: { object: session },
};

const payload = JSON.stringify(event);
const header = stripe.webhooks.generateTestHeaderString({ payload, secret });

const res = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": header },
  body: payload,
});
console.log(`${type} -> HTTP ${res.status}:`, await res.text());
