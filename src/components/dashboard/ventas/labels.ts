import type { Tone } from "@/components/ui/kit";
import type { Purchase } from "@/lib/cursos/payments";

export const PURCHASE_LABEL: Record<Purchase["status"], string> = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Falló",
  expired: "Expiró",
  refunded: "Reembolsado",
  partially_refunded: "Reembolso parcial",
  disputed: "En disputa",
};

export const PURCHASE_TONE: Record<Purchase["status"], Tone> = {
  pending: "warn",
  paid: "ok",
  failed: "bad",
  expired: "muted",
  refunded: "info",
  partially_refunded: "info",
  disputed: "bad",
};

export const METHOD_LABEL: Record<string, string> = { card: "Tarjeta", oxxo: "OXXO" };
