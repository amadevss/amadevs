import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { sql } from "./sql";
import type { Course } from "./queries";
import { REQUIRED_WEBHOOK_EVENTS, STRIPE_MODE, syncStripePrice } from "./payments";

/**
 * Cupones y estado de Stripe para el dashboard. Stripe es la fuente de verdad:
 * aquí no se guarda nada de cupones, se leen y escriben directo en Stripe.
 */

export type PromoRow = {
  id: string;
  code: string;
  active: boolean;
  times_redeemed: number;
  max_redemptions: number | null;
  expires_at: number | null;
  first_time_only: boolean;
  coupon_id: string;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  valid: boolean;
  /** Ids de cursos a los que aplica; vacío = a todos. */
  course_ids: string[];
};

export async function listPromotions(): Promise<PromoRow[]> {
  const stripe = getStripe();
  const [codes, courses] = await Promise.all([
    stripe.promotionCodes.list({ limit: 100, expand: ["data.promotion.coupon.applies_to"] }),
    sql<{ id: string; stripe_product_id: string | null; stripe_mode: string | null }>`
      select id, stripe_product_id, stripe_mode from course where kind = 'publico'`,
  ]);
  const byProduct = new Map(
    courses.rows.filter((c) => c.stripe_mode === STRIPE_MODE && c.stripe_product_id).map((c) => [c.stripe_product_id!, c.id]),
  );
  return codes.data
    .map((p) => {
      const coupon = typeof p.promotion.coupon === "object" ? p.promotion.coupon : null;
      if (!coupon) return null;
      return {
        id: p.id,
        code: p.code,
        active: p.active,
        times_redeemed: p.times_redeemed,
        max_redemptions: p.max_redemptions,
        expires_at: p.expires_at,
        first_time_only: p.restrictions.first_time_transaction,
        coupon_id: coupon.id,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        currency: coupon.currency,
        valid: coupon.valid,
        course_ids: (coupon.applies_to?.products ?? []).map((id) => byProduct.get(id)).filter((x): x is string => !!x),
      };
    })
    .filter((x): x is PromoRow => x !== null);
}

export type PromoInput = {
  code: string;
  kind: "percent" | "amount";
  value: number; // % o monto en pesos/dólares
  currency: string;
  max_redemptions: number | null;
  expires_at: string | null; // ISO
  first_time_only: boolean;
  course_ids: string[];
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function normalizePromoInput(body: Record<string, unknown>): Result<PromoInput> {
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,40}$/.test(code)) return { ok: false, error: "El código usa de 3 a 40 letras, números o guiones" };
  const kind = body.kind === "amount" ? "amount" : "percent";
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: "Escribe el descuento" };
  if (kind === "percent" && value > 100) return { ok: false, error: "El porcentaje no puede pasar de 100" };
  const currency = String(body.currency ?? "mxn").toLowerCase();
  const max = body.max_redemptions ? Math.floor(Number(body.max_redemptions)) : null;
  if (max !== null && (!Number.isFinite(max) || max < 1)) return { ok: false, error: "Límite de usos inválido" };
  let expires_at: string | null = null;
  if (body.expires_at) {
    const d = new Date(String(body.expires_at));
    if (Number.isNaN(d.getTime()) || d.getTime() < Date.now()) return { ok: false, error: "La fecha de vencimiento ya pasó" };
    expires_at = d.toISOString();
  }
  const course_ids = Array.isArray(body.course_ids) ? body.course_ids.map(String) : [];
  return {
    ok: true,
    value: { code, kind, value, currency, max_redemptions: max, expires_at, first_time_only: body.first_time_only === true, course_ids },
  };
}

/** Crea el cupón y su código. Si se limitan cursos, se asegura que existan sus productos en Stripe. */
export async function createPromotion(input: PromoInput): Promise<void> {
  const stripe = getStripe();
  let products: string[] | undefined;
  if (input.course_ids.length > 0) {
    const { rows } = await sql<Course>`
      select * from course where id = any(${input.course_ids as unknown as string}) and kind = 'publico' and price_cents > 0`;
    if (rows.length === 0) throw new Error("Elige cursos de pago para el cupón");
    products = [];
    for (const c of rows) products.push((await syncStripePrice(c)).stripe_product_id!);
  }
  const coupon = await stripe.coupons.create({
    name: input.code,
    duration: "once",
    ...(input.kind === "percent"
      ? { percent_off: input.value }
      : { amount_off: Math.round(input.value * 100), currency: input.currency }),
    ...(products ? { applies_to: { products } } : {}),
  });
  try {
    await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code: input.code,
      ...(input.max_redemptions ? { max_redemptions: input.max_redemptions } : {}),
      ...(input.expires_at ? { expires_at: Math.floor(new Date(input.expires_at).getTime() / 1000) } : {}),
      ...(input.first_time_only ? { restrictions: { first_time_transaction: true } } : {}),
    });
  } catch (err) {
    await stripe.coupons.del(coupon.id).catch(() => {});
    const msg = (err as Stripe.errors.StripeError)?.message ?? "";
    throw new Error(/already exists|already in use/i.test(msg) ? "Ya existe un código igual" : msg || "No se pudo crear el código");
  }
}

export async function setPromotionActive(id: string, active: boolean): Promise<void> {
  await getStripe().promotionCodes.update(id, { active });
}

/** Borra el cupón (sus códigos dejan de funcionar). Las compras hechas no cambian. */
export async function deletePromotion(id: string): Promise<void> {
  const stripe = getStripe();
  const promo = await stripe.promotionCodes.retrieve(id);
  await stripe.promotionCodes.update(id, { active: false });
  const couponId = typeof promo.promotion.coupon === "string" ? promo.promotion.coupon : promo.promotion.coupon?.id;
  if (couponId) await stripe.coupons.del(couponId);
}

/* ───────────── Estado de la cuenta y del webhook ───────────── */

export type StripeStatus = {
  mode: "test" | "live";
  account: {
    name: string | null;
    email: string | null;
    country: string | null;
    default_currency: string | null;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  };
  endpoints: { id: string; url: string; status: string; missing: string[]; ours: boolean }[];
};

export async function getStripeStatus(origins: string[]): Promise<StripeStatus> {
  const stripe = getStripe();
  const [account, endpoints] = await Promise.all([stripe.accounts.retrieveCurrent(), stripe.webhookEndpoints.list({ limit: 100 })]);
  return {
    mode: STRIPE_MODE,
    account: {
      name: account.settings?.dashboard?.display_name || account.business_profile?.name || null,
      email: account.email ?? null,
      country: account.country ?? null,
      default_currency: account.default_currency ?? null,
      charges_enabled: account.charges_enabled ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
      details_submitted: account.details_submitted ?? false,
    },
    endpoints: endpoints.data.map((e) => {
      const all = e.enabled_events.includes("*");
      return {
        id: e.id,
        url: e.url,
        status: e.status,
        missing: all ? [] : REQUIRED_WEBHOOK_EVENTS.filter((ev) => !e.enabled_events.includes(ev)),
        ours: origins.some((o) => e.url.startsWith(`${o}/api/stripe/webhook`)),
      };
    }),
  };
}

/** Agrega al webhook los eventos que faltan (no quita ninguno ni cambia su secreto). */
export async function addMissingWebhookEvents(endpointId: string): Promise<number> {
  const stripe = getStripe();
  const e = await stripe.webhookEndpoints.retrieve(endpointId);
  if (e.enabled_events.includes("*")) return 0;
  const missing = REQUIRED_WEBHOOK_EVENTS.filter((ev) => !e.enabled_events.includes(ev));
  if (missing.length === 0) return 0;
  await stripe.webhookEndpoints.update(endpointId, {
    enabled_events: [...e.enabled_events, ...missing] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
  });
  return missing.length;
}
