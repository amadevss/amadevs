import type { BookingWithService } from "@/lib/agenda/types";

export const BOOKING_FILTERS = ["proximas", "espera", "pasadas", "canceladas", "todas"] as const;
export type BookingFilter = (typeof BOOKING_FILTERS)[number];

export const BOOKING_FILTER_LABEL: Record<BookingFilter, string> = {
  proximas: "Próximas",
  espera: "Pago pendiente",
  pasadas: "Pasadas",
  canceladas: "Canceladas",
  todas: "Todas",
};

const DEAD = new Set(["canceled", "expired", "refunded"]);
export const CANCELABLE = new Set(["pending_payment", "confirmed"]);

export function parseBookingFilter(v: string | undefined): BookingFilter {
  return (BOOKING_FILTERS as readonly string[]).includes(v ?? "") ? (v as BookingFilter) : "proximas";
}

export function matchesFilter(b: BookingWithService, filter: BookingFilter, now = Date.now()): boolean {
  const starts = new Date(b.starts_at).getTime();
  const dead = DEAD.has(b.status);
  switch (filter) {
    case "todas":
      return true;
    case "canceladas":
      return dead;
    case "espera":
      return b.status === "pending_payment";
    case "pasadas":
      return !dead && starts < now;
    default:
      return !dead && starts >= now;
  }
}
