import type { Tone } from "@/components/ui/kit";

/** Estado de la entrega de un alumno en una sesión (sirve en servidor y cliente). */
export type DeliveryState = "calificada" | "entregada" | "vencida" | "pendiente" | "ninguna";

export function deliveryState(
  s: { accepts_submissions: boolean; due_at: string | Date | null },
  st: { submitted: boolean; grade: string | null } | undefined,
  now = Date.now(),
): DeliveryState {
  if (!s.accepts_submissions) return "ninguna";
  if (st?.grade) return "calificada";
  if (st?.submitted) return "entregada";
  if (s.due_at && new Date(s.due_at).getTime() < now) return "vencida";
  return "pendiente";
}

export const DELIVERY_LABEL: Record<DeliveryState, string> = {
  calificada: "Calificada",
  entregada: "Entregada",
  vencida: "Vencida",
  pendiente: "Pendiente",
  ninguna: "Sin entrega",
};

export const DELIVERY_TONE: Record<DeliveryState, Tone> = {
  calificada: "primary",
  entregada: "ok",
  vencida: "bad",
  pendiente: "warn",
  ninguna: "muted",
};
