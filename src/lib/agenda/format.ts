import { DateTime } from "luxon";
import type { BookingStatus } from "./types";

export function formatMoney(cents: number, currency = "mxn"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDateTime(iso: string, timezone: string): string {
  return DateTime.fromISO(iso, { zone: "utc" })
    .setZone(timezone)
    .setLocale("es")
    .toFormat("cccc d 'de' LLLL, yyyy · HH:mm");
}

export function formatTime(iso: string, timezone: string): string {
  return DateTime.fromISO(iso, { zone: "utc" }).setZone(timezone).toFormat("HH:mm");
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
