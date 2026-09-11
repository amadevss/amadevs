import { DateTime } from "luxon";
import type { BookingStatus, PaymentStatus } from "./types";

/** @vercel/postgres devuelve las columnas timestamptz como objetos Date. */
export type DateInput = string | Date;

function toDateTime(value: DateInput): DateTime {
  if (value instanceof Date) return DateTime.fromJSDate(value, { zone: "utc" });
  const iso = DateTime.fromISO(value, { zone: "utc" });
  return iso.isValid ? iso : DateTime.fromSQL(value, { zone: "utc" });
}

export function formatMoney(cents: number, currency = "mxn"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDateTime(value: DateInput, timezone: string): string {
  return toDateTime(value)
    .setZone(timezone)
    .setLocale("es")
    .toFormat("cccc d 'de' LLLL, yyyy · HH:mm");
}

export function formatTime(value: DateInput, timezone: string): string {
  return toDateTime(value).setZone(timezone).toFormat("HH:mm");
}

export function tzAbbr(timezone: string): string {
  return (
    DateTime.now().setZone(timezone).toFormat("ZZZZ") || timezone.split("/").pop() || timezone
  );
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Pago pendiente",
  confirmed: "Pagado",
  completed: "Completada",
  canceled: "Cancelada",
  expired: "Expirada",
  refunded: "Reembolsada",
};

export const STATUS_TONE: Record<BookingStatus, "ok" | "warn" | "muted" | "bad"> = {
  pending_payment: "warn",
  confirmed: "ok",
  completed: "ok",
  canceled: "bad",
  expired: "muted",
  refunded: "bad",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  succeeded: "Exitoso",
  failed: "Fallido",
  refunded: "Reembolsado",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, "ok" | "warn" | "muted" | "bad"> = {
  pending: "warn",
  succeeded: "ok",
  failed: "bad",
  refunded: "muted",
};

export const TONE_CLASS: Record<"ok" | "warn" | "muted" | "bad", string> = {
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  muted: "border-border bg-black/5 text-subtle dark:bg-white/5",
  bad: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};
