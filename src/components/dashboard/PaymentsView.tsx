"use client";

import {
  formatDateTime,
  formatMoney,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  TONE_CLASS,
} from "@/lib/agenda/format";
import type { PaymentWithBooking } from "@/lib/agenda/types";

export default function PaymentsView({
  payments,
  businessTimezone,
}: {
  payments: PaymentWithBooking[];
  businessTimezone: string;
}) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted">
        Cada fila es un cargo o reembolso confirmado por Stripe. Solo se registran aquí cuando
        el webhook de Stripe avisa a la app — si el webhook no está conectado, un pago puede
        completarse en Stripe y nunca aparecer en esta lista.
      </p>

      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Sesión</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Recibo</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-subtle">
                  Aún no se ha registrado ningún pago.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateTime(p.created_at, businessTimezone)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                  <td className="px-4 py-3">{p.customer_name}</td>
                  <td className="px-4 py-3">{p.service_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatMoney(p.amount_cents, p.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        TONE_CLASS[PAYMENT_STATUS_TONE[p.status]]
                      }`}
                    >
                      {PAYMENT_STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.receipt_url ? (
                      <a
                        href={p.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Ver ↗
                      </a>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
