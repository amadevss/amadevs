import type Stripe from "stripe";
import { getStripe, STRIPE_LIVE } from "@/lib/stripe";
import { isUuid, sql } from "./sql";
import type { Course } from "./queries";
import { enroll } from "./students";

/**
 * Venta de cursos públicos con Stripe Checkout.
 *
 * - El precio se configura en el dashboard; aquí se crea/actualiza el
 *   producto y el precio en Stripe (los precios de Stripe no se editan: si
 *   cambia el monto se crea uno nuevo y se archiva el anterior).
 * - Las compras se registran en course_purchase. La inscripción ocurre solo
 *   cuando Stripe confirma el pago (webhook o al volver del checkout).
 * - Reembolso total o disputa → se quita el acceso. Reembolso parcial → se conserva.
 */

export const STRIPE_MODE = STRIPE_LIVE ? "live" : "test";

export const PAYMENT_METHOD_OPTIONS = [
  { value: "card", label: "Tarjeta de crédito o débito" },
  { value: "oxxo", label: "Efectivo en OXXO (solo MXN)" },
] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_OPTIONS)[number]["value"];

export const CURRENCIES = ["mxn", "usd"] as const;

/** Eventos de Stripe que necesita la plataforma (Agenda y cursos). */
export const REQUIRED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
] as const;

/* ───────────── Configuración de venta del curso ───────────── */

export type SaleInput = {
  price_cents: number;
  currency: string;
  payment_methods: PaymentMethod[];
  allow_promotion_codes: boolean;
  installments: boolean;
  collect_tax_id: boolean;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Valida lo que llega del formulario. `price` viene en pesos/dólares ("499.00"). */
export function normalizeSaleInput(body: Record<string, unknown>): Result<SaleInput> {
  const price = Number(String(body.price ?? "0").replace(/[,\s$]/g, ""));
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: "Precio inválido" };
  const price_cents = Math.round(price * 100);
  const currency = String(body.currency ?? "mxn").toLowerCase();
  if (!(CURRENCIES as readonly string[]).includes(currency)) return { ok: false, error: "Moneda no soportada" };
  if (price_cents > 0 && price_cents < (currency === "mxn" ? 1000 : 50)) {
    return { ok: false, error: currency === "mxn" ? "El precio mínimo es $10 MXN" : "El precio mínimo es $0.50 USD" };
  }
  const allowed = PAYMENT_METHOD_OPTIONS.map((o) => o.value) as string[];
  const raw = Array.isArray(body.payment_methods) ? body.payment_methods.map(String) : ["card"];
  const payment_methods = [...new Set(raw.filter((m) => allowed.includes(m)))] as PaymentMethod[];
  if (payment_methods.length === 0) return { ok: false, error: "Elige al menos una forma de pago" };
  if (payment_methods.includes("oxxo")) {
    if (currency !== "mxn") return { ok: false, error: "OXXO solo acepta pesos mexicanos" };
    if (price_cents > 1_000_000) return { ok: false, error: "OXXO acepta pagos de hasta $10,000 MXN" };
  }
  const installments = body.installments === true;
  if (installments && (currency !== "mxn" || !payment_methods.includes("card"))) {
    return { ok: false, error: "Los meses sin intereses requieren pesos mexicanos y pago con tarjeta" };
  }
  return {
    ok: true,
    value: {
      price_cents,
      currency,
      payment_methods,
      allow_promotion_codes: body.allow_promotion_codes !== false,
      installments,
      collect_tax_id: body.collect_tax_id === true,
    },
  };
}

export async function saveCourseSale(courseId: string, input: SaleInput): Promise<Course | null> {
  const { rows } = await sql<Course>`
    update course set price_cents = ${input.price_cents}, currency = ${input.currency},
      payment_methods = ${input.payment_methods as unknown as string},
      allow_promotion_codes = ${input.allow_promotion_codes}, installments = ${input.installments},
      collect_tax_id = ${input.collect_tax_id}
    where id = ${courseId} and kind = 'publico' returning *`;
  const course = rows[0] ?? null;
  return course && course.price_cents > 0 ? syncStripePrice(course) : course;
}

const isMissing = (err: unknown) => (err as { code?: string })?.code === "resource_missing";

/**
 * Deja el producto y el precio de Stripe iguales al curso (en el modo actual,
 * prueba o real). Devuelve el curso con los ids actualizados.
 */
export async function syncStripePrice(course: Course): Promise<Course> {
  const stripe = getStripe();
  const sameMode = course.stripe_mode === STRIPE_MODE;
  const product = {
    name: course.title,
    description: (course.summary || course.description).slice(0, 500) || undefined,
  };

  let productId = sameMode ? course.stripe_product_id : null;
  if (productId) {
    try {
      await stripe.products.update(productId, { ...product, active: true });
    } catch (err) {
      if (!isMissing(err)) throw err;
      productId = null;
    }
  }
  if (!productId) {
    productId = (await stripe.products.create({ ...product, metadata: { course_id: course.id } })).id;
  }

  let priceId = sameMode ? course.stripe_price_id : null;
  let oldPriceId: string | null = null;
  if (priceId) {
    const current = await stripe.prices.retrieve(priceId).catch((err) => (isMissing(err) ? null : Promise.reject(err)));
    const matches =
      current?.active &&
      current.unit_amount === course.price_cents &&
      current.currency === course.currency &&
      current.product === productId;
    if (!matches) {
      oldPriceId = current?.active ? priceId : null;
      priceId = null;
    }
  }
  if (!priceId) {
    priceId = (
      await stripe.prices.create({
        product: productId,
        unit_amount: course.price_cents,
        currency: course.currency,
        metadata: { course_id: course.id },
      })
    ).id;
    await stripe.products.update(productId, { default_price: priceId });
    // El precio anterior se archiva (Stripe no deja borrar precios); quien ya pagó no se ve afectado.
    if (oldPriceId) await stripe.prices.update(oldPriceId, { active: false }).catch(() => {});
  }

  const { rows } = await sql<Course>`
    update course set stripe_mode = ${STRIPE_MODE}, stripe_product_id = ${productId}, stripe_price_id = ${priceId}
    where id = ${course.id} returning *`;
  return rows[0];
}

/** Antes de cobrar: si el precio no es del modo actual o falta, se sincroniza. */
async function ensureStripePrice(course: Course): Promise<Course> {
  if (course.stripe_mode === STRIPE_MODE && course.stripe_price_id && course.stripe_product_id) return course;
  return syncStripePrice(course);
}

/** Si el curso cambia de nombre o descripción, se refleja en Stripe (sin fallar el guardado). */
export async function refreshStripeProduct(course: Course): Promise<void> {
  if (course.stripe_mode !== STRIPE_MODE || !course.stripe_product_id) return;
  await getStripe()
    .products.update(course.stripe_product_id, {
      name: course.title,
      description: (course.summary || course.description).slice(0, 500) || undefined,
    })
    .catch((err) => console.error("[cursos/pagos] actualizar producto", err));
}

/* ───────────── Checkout ───────────── */

export type Purchase = {
  id: string;
  course_id: string | null;
  student_id: string | null;
  course_title: string;
  student_email: string;
  student_name: string;
  stripe_mode: string;
  checkout_session_id: string;
  payment_intent_id: string | null;
  charge_id: string | null;
  status: "pending" | "paid" | "failed" | "expired" | "refunded" | "partially_refunded" | "disputed";
  amount_cents: number;
  discount_cents: number;
  refunded_cents: number;
  currency: string;
  promotion_code: string | null;
  payment_method: string | null;
  installments: number | null;
  receipt_url: string | null;
  voucher_url: string | null;
  tax_ids: { type: string; value: string }[] | null;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
  updated_at: string;
};

/** Crea la sesión de pago de Stripe y deja la compra como pendiente. */
export async function startCoursePurchase(
  courseIn: Course,
  student: { id: string; email: string; full_name: string },
  returnUrl: string,
): Promise<string> {
  const course = await ensureStripePrice(courseIn);
  const methods = course.payment_methods.length ? course.payment_methods : ["card"];
  const metadata = { kind: "course", course_id: course.id, student_id: student.id };

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    locale: "es",
    line_items: [{ price: course.stripe_price_id!, quantity: 1 }],
    customer_email: student.email,
    client_reference_id: student.id,
    metadata,
    payment_intent_data: {
      receipt_email: student.email,
      description: `Curso: ${course.title}`,
      metadata,
    },
    payment_method_types: methods,
    allow_promotion_codes: course.allow_promotion_codes || undefined,
    payment_method_options: {
      ...(course.installments && methods.includes("card") ? { card: { installments: { enabled: true } } } : {}),
      ...(methods.includes("oxxo") ? { oxxo: { expires_after_days: 3 } } : {}),
    },
    // Para pedir RFC Stripe necesita crear un cliente.
    ...(course.collect_tax_id ? { tax_id_collection: { enabled: true }, customer_creation: "always" as const } : {}),
    success_url: `${returnUrl}?compra={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
  });

  await sql`
    insert into course_purchase (course_id, student_id, course_title, student_email, student_name, stripe_mode,
      checkout_session_id, amount_cents, currency)
    values (${course.id}, ${student.id}, ${course.title}, ${student.email}, ${student.full_name}, ${STRIPE_MODE},
      ${session.id}, ${session.amount_total ?? course.price_cents}, ${course.currency})
    on conflict (checkout_session_id) do nothing`;

  if (!session.url) throw new Error("Stripe no devolvió la URL de pago");
  return session.url;
}

/* ───────────── Confirmación (webhook y regreso del checkout) ───────────── */

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id ?? null);

/**
 * Registra el resultado de una sesión de Checkout de curso. Siempre vuelve a
 * leer la sesión de Stripe, así sirve igual desde el webhook o al regresar.
 * Devuelve null si la sesión no es de un curso.
 */
export async function syncCheckoutSession(sessionId: string): Promise<Purchase | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["discounts.promotion_code", "payment_intent.latest_charge", "payment_intent.payment_method"],
  });
  const meta = session.metadata ?? {};
  if (meta.kind !== "course" || !isUuid(meta.course_id ?? "") || !isUuid(meta.student_id ?? "")) return null;

  const pi = typeof session.payment_intent === "object" ? session.payment_intent : null;
  const charge = pi && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
  const pm = pi && typeof pi.payment_method === "object" ? pi.payment_method : null;
  const promo = session.discounts?.[0]?.promotion_code;
  const promoCode = promo && typeof promo === "object" ? promo.code : null;
  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  const status = paid ? "paid" : session.status === "expired" ? "expired" : "pending";
  const voucher = pi?.next_action?.oxxo_display_details?.hosted_voucher_url ?? null;
  const installmentsCount = charge?.payment_method_details?.card?.installments?.plan?.count ?? null;
  const taxIds = session.customer_details?.tax_ids?.map((t) => ({ type: t.type, value: t.value ?? "" })) ?? null;

  // La fila puede no existir si la sesión se creó fuera de esta instancia; se reconstruye con los metadatos.
  const { rows: course } = await sql<{ title: string }>`select title from course where id = ${meta.course_id}`;
  const { rows: student } = await sql<{ email: string; full_name: string }>`
    select email, full_name from student where id = ${meta.student_id}`;

  const { rows } = await sql<Purchase>`
    insert into course_purchase (course_id, student_id, course_title, student_email, student_name, stripe_mode,
      checkout_session_id, amount_cents, currency)
    values (${course[0] ? meta.course_id : null}, ${student[0] ? meta.student_id : null},
      ${course[0]?.title ?? "Curso"}, ${student[0]?.email ?? session.customer_details?.email ?? ""},
      ${student[0]?.full_name ?? session.customer_details?.name ?? ""},
      ${session.livemode ? "live" : "test"}, ${session.id}, ${session.amount_total ?? 0}, ${session.currency ?? "mxn"})
    on conflict (checkout_session_id) do update set
      payment_intent_id = ${pi?.id ?? null},
      charge_id = coalesce(${charge?.id ?? null}, course_purchase.charge_id),
      amount_cents = ${session.amount_total ?? 0},
      discount_cents = ${session.total_details?.amount_discount ?? 0},
      currency = ${session.currency ?? "mxn"},
      promotion_code = ${promoCode},
      payment_method = coalesce(${pm?.type ?? session.payment_method_types?.[0] ?? null}, course_purchase.payment_method),
      installments = ${installmentsCount},
      receipt_url = coalesce(${charge?.receipt_url ?? null}, course_purchase.receipt_url),
      voucher_url = ${paid ? null : voucher},
      tax_ids = ${taxIds ? JSON.stringify(taxIds) : null}::jsonb,
      -- No se revierte una compra ya reembolsada o en disputa por un evento repetido.
      status = case when course_purchase.status in ('refunded', 'partially_refunded', 'disputed')
                    then course_purchase.status else ${status} end,
      paid_at = case when ${paid} then coalesce(course_purchase.paid_at, now()) else course_purchase.paid_at end
    returning *`;
  const purchase = rows[0];

  if (purchase.status === "paid" && purchase.course_id && purchase.student_id) {
    await enroll(purchase.course_id, purchase.student_id, "purchase");
  }
  return purchase;
}

/** Pago con OXXO vencido o rechazado. */
export async function markCheckoutFailed(sessionId: string, status: "failed" | "expired"): Promise<boolean> {
  const { rowCount } = await sql`
    update course_purchase set status = ${status}, voucher_url = null
    where checkout_session_id = ${sessionId} and status = 'pending'`;
  return (rowCount ?? 0) > 0;
}

async function revokeAccess(purchase: Purchase) {
  if (!purchase.course_id || !purchase.student_id) return;
  // Solo se quita si entró por compra (no si el profesor lo inscribió a mano).
  await sql`
    delete from course_enrollment
    where course_id = ${purchase.course_id} and student_id = ${purchase.student_id} and source = 'purchase'`;
}

async function purchaseByPaymentIntent(piId: string | null): Promise<Purchase | null> {
  if (!piId) return null;
  const { rows } = await sql<Purchase>`select * from course_purchase where payment_intent_id = ${piId} limit 1`;
  return rows[0] ?? null;
}

/** Reembolso desde Stripe (o desde el dashboard): total quita el acceso; parcial no. */
export async function applyChargeRefund(charge: Stripe.Charge): Promise<boolean> {
  const purchase = await purchaseByPaymentIntent(idOf(charge.payment_intent));
  if (!purchase) return false;
  const full = charge.refunded || charge.amount_refunded >= charge.amount;
  const { rows } = await sql<Purchase>`
    update course_purchase set
      status = case when status = 'disputed' then status when ${full} then 'refunded' else 'partially_refunded' end,
      refunded_cents = ${charge.amount_refunded},
      refunded_at = coalesce(refunded_at, now())
    where id = ${purchase.id} returning *`;
  if (full) await revokeAccess(rows[0]);
  return true;
}

/** Disputa (contracargo): se quita el acceso; si se gana, se devuelve. */
export async function applyDispute(dispute: Stripe.Dispute, closed: boolean): Promise<boolean> {
  const purchase = await purchaseByPaymentIntent(idOf(dispute.payment_intent));
  if (!purchase) return false;
  if (!closed) {
    await sql`update course_purchase set status = 'disputed' where id = ${purchase.id}`;
    await revokeAccess(purchase);
  } else if (dispute.status === "won") {
    await sql`update course_purchase set status = 'paid' where id = ${purchase.id}`;
    if (purchase.course_id && purchase.student_id) await enroll(purchase.course_id, purchase.student_id, "purchase");
  } else if (dispute.status === "lost") {
    await sql`update course_purchase set status = 'refunded', refunded_cents = amount_cents,
      refunded_at = coalesce(refunded_at, now()) where id = ${purchase.id}`;
  }
  return true;
}

/* ───────────── Consultas para alumno y dashboard ───────────── */

/** Última compra del alumno para un curso (para mostrar "pago pendiente"). */
export async function getLatestPurchase(courseId: string, studentId: string): Promise<Purchase | null> {
  const { rows } = await sql<Purchase>`
    select * from course_purchase where course_id = ${courseId} and student_id = ${studentId}
    order by created_at desc limit 1`;
  return rows[0] ?? null;
}

export async function getPurchase(id: string): Promise<Purchase | null> {
  if (!isUuid(id)) return null;
  const { rows } = await sql<Purchase>`select * from course_purchase where id = ${id}`;
  return rows[0] ?? null;
}

export async function listPurchases(filter: { status?: string; courseId?: string } = {}): Promise<Purchase[]> {
  const { rows } = await sql<Purchase>`
    select * from course_purchase
    where (${filter.status ?? null}::text is null or status = ${filter.status ?? null})
      and (${filter.courseId ?? null}::uuid is null or course_id = ${filter.courseId ?? null}::uuid)
      and stripe_mode = ${STRIPE_MODE}
    order by created_at desc limit 500`;
  return rows;
}

export type SalesSummary = { paid_count: number; gross_cents: number; refunded_cents: number; pending_count: number };

export async function salesSummary(): Promise<Record<string, SalesSummary>> {
  const { rows } = await sql<SalesSummary & { currency: string }>`
    select currency,
      count(*) filter (where status in ('paid', 'partially_refunded'))::int as paid_count,
      coalesce(sum(amount_cents) filter (where status in ('paid', 'partially_refunded', 'refunded')), 0)::int as gross_cents,
      coalesce(sum(refunded_cents), 0)::int as refunded_cents,
      count(*) filter (where status = 'pending')::int as pending_count
    from course_purchase where stripe_mode = ${STRIPE_MODE} group by currency`;
  return Object.fromEntries(rows.map(({ currency, ...r }) => [currency, r]));
}

/** Reembolsa desde el dashboard. Sin monto = total. El webhook confirma después. */
export async function refundPurchase(purchase: Purchase, amountCents?: number): Promise<void> {
  if (!purchase.payment_intent_id) throw new Error("Esta compra no tiene un pago para reembolsar");
  if (purchase.stripe_mode !== STRIPE_MODE) throw new Error("La compra es de otro modo de Stripe (prueba/real)");
  const left = purchase.amount_cents - purchase.refunded_cents;
  const amount = amountCents ?? left;
  if (amount <= 0 || amount > left) throw new Error("Monto de reembolso inválido");
  const refund = await getStripe().refunds.create({
    payment_intent: purchase.payment_intent_id,
    amount,
    reason: "requested_by_customer",
    metadata: { purchase_id: purchase.id },
  });
  if (refund.status === "failed") throw new Error("Stripe rechazó el reembolso");
  const charge = await getStripe().charges.retrieve(idOf(refund.charge) ?? purchase.charge_id ?? "");
  await applyChargeRefund(charge);
}
