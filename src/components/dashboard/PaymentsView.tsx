import { formatDateTime, formatMoney, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "@/lib/agenda/format";
import type { PaymentWithBooking } from "@/lib/agenda/types";
import { Badge, EmptyState } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

/** Cargos y reembolsos confirmados por Stripe (componente de servidor). */
export default function PaymentsView({
  payments,
  businessTimezone,
}: {
  payments: PaymentWithBooking[];
  businessTimezone: string;
}) {
  if (payments.length === 0) {
    return (
      <EmptyState icon="card" title="Aún no hay pagos registrados">
        Los pagos aparecen aquí cuando Stripe confirma el cobro.
      </EmptyState>
    );
  }

  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {payments.map((p) => (
          <li key={p.id} className="surface-card grid gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.customer_name}</p>
                <p className="truncate text-xs text-subtle">{p.service_name}</p>
              </div>
              <p className="shrink-0 font-display text-lg font-bold">{formatMoney(p.amount_cents, p.currency)}</p>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-subtle">
              <span>{formatDateTime(p.created_at, businessTimezone)}</span>
              <Badge tone={PAYMENT_STATUS_TONE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-xs">
              <span className="font-mono text-subtle">{p.reference}</span>
              {p.receipt_url ? (
                <a
                  href={p.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 font-medium text-primary-ink"
                >
                  Recibo <Icon name="external" className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="surface-card hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Recibo</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-border transition last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3">{formatDateTime(p.created_at, businessTimezone)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{p.customer_name}</div>
                  <div className="text-xs text-subtle">
                    {p.service_name} · <span className="font-mono">{p.reference}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatMoney(p.amount_cents, p.currency)}</td>
                <td className="px-4 py-3">
                  <Badge tone={PAYMENT_STATUS_TONE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {p.receipt_url ? (
                    <a
                      href={p.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary-ink hover:underline"
                    >
                      Ver <Icon name="external" className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
