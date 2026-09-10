import Stripe from "stripe";

/**
 * Cliente de Stripe.
 *
 * El `.env` tiene claves separadas de test y live:
 *   STRIPE_SECRET_KEY_TEST / STRIPE_SECRET_KEY_LIVE
 *
 * Regla de selección:
 *   - STRIPE_MODE=live         → live
 *   - STRIPE_MODE=test         → test
 *   - sin STRIPE_MODE          → live solo si VERCEL_ENV=production, si no test
 *
 * Así en local y en los "preview" de Vercel siempre se usa test.
 */
export const STRIPE_LIVE =
  process.env.STRIPE_MODE === "live" ||
  (process.env.STRIPE_MODE !== "test" &&
    process.env.VERCEL_ENV === "production");

// Versión de API fijada a la que trae el SDK (stripe@22). Fijarla evita que una
// actualización del paquete cambie el comportamiento sin avisar.
const API_VERSION = "2026-08-26.dahlia" as const;

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = STRIPE_LIVE
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;

  if (!key) {
    throw new Error(
      `Falta ${
        STRIPE_LIVE ? "STRIPE_SECRET_KEY_LIVE" : "STRIPE_SECRET_KEY_TEST"
      } en el entorno`,
    );
  }

  _stripe = new Stripe(key, {
    apiVersion: API_VERSION,
    appInfo: { name: "amadevs-agenda" },
  });
  return _stripe;
}
