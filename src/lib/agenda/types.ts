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

export interface Booking {
  id: string;
  reference: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string | null;
  customer_note: string | null;
  customer_timezone: string;
  starts_at: string; // ISO 8601 (UTC)
  ends_at: string; // ISO 8601 (UTC)
  status: BookingStatus;
  amount_cents: number;
  currency: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_receipt_url: string | null;
  hold_expires_at: string | null;
  paid_at: string | null;
  canceled_at: string | null;
  meeting_url: string | null;
  created_at: string;
  updated_at: string;
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
