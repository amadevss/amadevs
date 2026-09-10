import { sql } from "@/lib/db";
import type { Booking, BookingWithService, Service } from "./types";

/* ── Servicios ─────────────────────────────────────────────────────────── */

export async function getActiveServices(): Promise<Service[]> {
  const { rows } = await sql<Service>`
    select id, slug, name, description, duration_minutes, price_cents, currency, active, sort_order
    from service where active order by sort_order`;
  return rows;
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const { rows } = await sql<Service>`
    select id, slug, name, description, duration_minutes, price_cents, currency, active, sort_order
    from service where slug = ${slug} and active limit 1`;
  return rows[0] ?? null;
}

/* ── Reglas de horario ─────────────────────────────────────────────────── */

export interface AvailabilityRule {
  weekday: number; // 0 = domingo … 6 = sábado
  start_time: string; // "10:00:00"
  end_time: string;
  timezone: string;
}

export async function getRulesForWeekday(weekday: number): Promise<AvailabilityRule[]> {
  const { rows } = await sql<AvailabilityRule>`
    select weekday, start_time, end_time, timezone
    from availability_rule where active and weekday = ${weekday}
    order by start_time`;
  return rows;
}

export async function getActiveWeekdays(): Promise<number[]> {
  const { rows } = await sql<{ weekday: number }>`
    select distinct weekday from availability_rule where active order by weekday`;
  return rows.map((r) => r.weekday);
}

/* ── Rangos ocupados (reservas vivas + bloqueos) ───────────────────────── */

export interface BusyRange {
  start: string; // ISO UTC
  end: string;
}

/** Reservas confirmadas/en curso + holds vigentes + blackouts que tocan [from, to). */
export async function getBusyRanges(fromISO: string, toISO: string): Promise<BusyRange[]> {
  const { rows } = await sql<{ start: Date | string; end: Date | string }>`
    select starts_at as start, ends_at as end
    from booking
    where (
      status in ('confirmed', 'completed')
      or (status = 'pending_payment' and hold_expires_at > now())
    )
      and starts_at < ${toISO} and ends_at > ${fromISO}
    union all
    select lower(during) as start, upper(during) as end
    from blackout
    where during && tstzrange(${fromISO}::timestamptz, ${toISO}::timestamptz)`;
  return rows.map((r) => ({
    start: new Date(r.start).toISOString(),
    end: new Date(r.end).toISOString(),
  }));
}

/* ── Alta de reserva (hold) ───────────────────────────────────────────── */

export interface CreateHoldArgs {
  reference: string;
  serviceId: string;
  startsAt: string; // ISO UTC
  endsAt: string;
  amountCents: number;
  currency: string;
  holdMs: number;
  freeConfirm: boolean; // servicio gratis → queda 'confirmed' de una vez
  customer: {
    name: string;
    email: string;
    company?: string | null;
    note?: string | null;
    timezone: string;
  };
}

/** Postgres es code '23P01' si el horario se solapa con otra reserva viva. */
export const OVERLAP_CODES = new Set(["23P01", "23505"]);

export async function createHold(a: CreateHoldArgs): Promise<Booking> {
  const status = a.freeConfirm ? "confirmed" : "pending_payment";
  const holdExpiresAt = a.freeConfirm
    ? null
    : new Date(Date.now() + a.holdMs).toISOString();
  const paidAt = a.freeConfirm ? new Date().toISOString() : null;

  const { rows } = await sql<Booking>`
    insert into booking (
      reference, service_id, customer_name, customer_email, customer_company,
      customer_note, customer_timezone, starts_at, ends_at, status,
      amount_cents, currency, hold_expires_at, paid_at
    ) values (
      ${a.reference}, ${a.serviceId}, ${a.customer.name}, ${a.customer.email},
      ${a.customer.company ?? null}, ${a.customer.note ?? null}, ${a.customer.timezone},
      ${a.startsAt}, ${a.endsAt}, ${status},
      ${a.amountCents}, ${a.currency}, ${holdExpiresAt}, ${paidAt}
    )
    returning *`;
  return rows[0];
}

export async function attachCheckoutSession(
  bookingId: string,
  sessionId: string,
): Promise<void> {
  await sql`update booking set stripe_checkout_session_id = ${sessionId} where id = ${bookingId}`;
}

/* ── Consulta de una reserva ──────────────────────────────────────────── */

export async function getBookingByReference(
  reference: string,
): Promise<BookingWithService | null> {
  const { rows } = await sql<BookingWithService>`
    select b.*, s.name as service_name, s.slug as service_slug
    from booking b join service s on s.id = b.service_id
    where b.reference = ${reference} limit 1`;
  return rows[0] ?? null;
}

export async function getBookingByReferenceAndEmail(
  reference: string,
  email: string,
): Promise<BookingWithService | null> {
  const { rows } = await sql<BookingWithService>`
    select b.*, s.name as service_name, s.slug as service_slug
    from booking b join service s on s.id = b.service_id
    where b.reference = ${reference}
      and lower(b.customer_email) = lower(${email})
    limit 1`;
  return rows[0] ?? null;
}

/* ── Transiciones desde el webhook / cron ─────────────────────────────── */

export async function confirmBookingBySession(args: {
  sessionId: string;
  paymentIntentId: string;
  receiptUrl: string | null;
}): Promise<Booking | null> {
  const { rows } = await sql<Booking>`
    update booking set
      status = 'confirmed',
      paid_at = coalesce(paid_at, now()),
      hold_expires_at = null,
      stripe_payment_intent_id = ${args.paymentIntentId},
      stripe_receipt_url = ${args.receiptUrl}
    where stripe_checkout_session_id = ${args.sessionId}
      and status in ('pending_payment', 'confirmed')
    returning *`;
  return rows[0] ?? null;
}

export async function expireBookingBySession(sessionId: string): Promise<void> {
  await sql`
    update booking set status = 'expired', hold_expires_at = null
    where stripe_checkout_session_id = ${sessionId} and status = 'pending_payment'`;
}

export async function refundBookingByPaymentIntent(
  paymentIntentId: string,
): Promise<void> {
  await sql`
    update booking set status = 'refunded'
    where stripe_payment_intent_id = ${paymentIntentId}
      and status in ('confirmed', 'completed')`;
}

export async function markExpiredHolds(): Promise<number> {
  const { rowCount } = await sql`
    update booking set status = 'expired', hold_expires_at = null
    where status = 'pending_payment' and hold_expires_at < now()`;
  return rowCount ?? 0;
}

/* ── Pagos (libro mayor) ──────────────────────────────────────────────── */

export async function recordPayment(args: {
  bookingId: string;
  paymentIntentId: string | null;
  chargeId: string | null;
  amountCents: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  receiptUrl: string | null;
  raw: unknown;
}): Promise<void> {
  await sql`
    insert into payment (
      booking_id, stripe_payment_intent_id, stripe_charge_id,
      amount_cents, currency, status, receipt_url, raw
    ) values (
      ${args.bookingId}, ${args.paymentIntentId}, ${args.chargeId},
      ${args.amountCents}, ${args.currency}, ${args.status}, ${args.receiptUrl},
      ${JSON.stringify(args.raw)}
    )`;
}

/* ── Idempotencia de webhooks ─────────────────────────────────────────── */

/** true si es la primera vez que vemos este evento (y lo deja registrado). */
export async function claimWebhookEvent(id: string, type: string): Promise<boolean> {
  const { rowCount } = await sql`
    insert into webhook_event (id, type) values (${id}, ${type})
    on conflict (id) do nothing`;
  return (rowCount ?? 0) > 0;
}

/** Libera el registro si el procesamiento falló, para que Stripe reintente. */
export async function unclaimWebhookEvent(id: string): Promise<void> {
  await sql`delete from webhook_event where id = ${id}`;
}
