export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "canceled"
  | "expired"
  | "refunded";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  active: boolean;
  sort_order: number;
}

/** @vercel/postgres deserializa timestamptz como Date. */
export type Timestamptz = string | Date;

export interface Booking {
  id: string;
  reference: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string | null;
  customer_note: string | null;
  customer_timezone: string;
  starts_at: Timestamptz;
  ends_at: Timestamptz;
  status: BookingStatus;
  amount_cents: number;
  currency: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_receipt_url: string | null;
  hold_expires_at: Timestamptz | null;
  paid_at: Timestamptz | null;
  canceled_at: Timestamptz | null;
  meeting_url: string | null;
  created_at: Timestamptz;
  updated_at: Timestamptz;
}

export interface BookingWithService extends Booking {
  service_name: string;
  service_slug: string;
}

/** Payload que envía el formulario de reserva. */
export interface CreateBookingInput {
  serviceSlug: string;
  /** Inicio del horario elegido, en ISO 8601 con offset (ej. "2026-09-15T17:00:00.000Z"). */
  startsAt: string;
  customer: {
    name: string;
    email: string;
    company?: string;
    note?: string;
    timezone: string;
  };
}
