"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { Purchase } from "@/lib/cursos/payments";
import { formatDateTime } from "@/lib/cursos/shared";
import { useFeedback } from "@/components/ui/feedback";
import { Badge, EmptyState } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import { METHOD_LABEL, PURCHASE_LABEL, PURCHASE_TONE } from "./labels";

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "paid", label: "Pagadas" },
  { value: "pending", label: "Pendientes" },
  { value: "refunded", label: "Reembolsadas" },
  { value: "disputed", label: "Disputas" },
];

export default function SalesList({ purchases, status }: { purchases: Purchase[]; status: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { toast, confirm, prompt } = useFeedback();
  const [busy, setBusy] = useState<string | null>(null);
  const [, startRefresh] = useTransition();

  function setFilter(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("estado", value);
    else next.delete("estado");
    router.push(`${pathname}${next.size ? `?${next}` : ""}`);
  }

  async function refund(p: Purchase) {
    const left = p.amount_cents - p.refunded_cents;
    const value = await prompt({
      title: `Reembolsar a ${p.student_name || p.student_email}`,
      message: "Deja el monto completo para un reembolso total (se le quita el acceso al curso). Un monto menor es un reembolso parcial y conserva el acceso.",
      label: `Monto en ${p.currency.toUpperCase()} (máximo ${money(left, p.currency)})`,
      defaultValue: (left / 100).toFixed(2),
      confirmLabel: "Continuar",
      validate: (v) => {
        const n = Number(v);
        return !Number.isFinite(n) || n <= 0 || Math.round(n * 100) > left ? "Monto inválido" : null;
      },
    });
    if (!value) return;
    const cents = Math.round(Number(value) * 100);
    const yes = await confirm({
      title: `¿Reembolsar ${money(cents, p.currency)}?`,
      message: cents >= left ? "Es un reembolso total: el alumno pierde el acceso al curso." : "Es un reembolso parcial: el alumno conserva el acceso.",
      confirmLabel: "Reembolsar",
      danger: true,
    });
    if (!yes) return;
    setBusy(p.id);
    const r = await fetch(`/api/dashboard/ventas/${p.id}/reembolso`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: cents >= left ? undefined : cents / 100 }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok) return toast.error(j.error || "No se pudo reembolsar");
    toast.success("Reembolso enviado a Stripe");
    startRefresh(() => router.refresh());
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`min-h-9 rounded-full border px-3 text-sm font-medium transition ${
              status === f.value ? "border-primary bg-primary-soft text-primary-ink" : "border-border text-muted hover:bg-surface-2"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {purchases.length === 0 ? (
        <EmptyState icon="card" title="No hay compras aquí">
          Cuando alguien compre un curso de pago aparecerá en esta lista.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {purchases.map((p) => {
            const refundable = (p.status === "paid" || p.status === "partially_refunded") && p.amount_cents > p.refunded_cents;
            return (
              <li key={p.id} className="surface-card grid grid-cols-1 gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{p.student_name || p.student_email}</p>
                    <p className="break-all text-xs text-subtle">{p.student_email}</p>
                    <p className="mt-1 text-sm">
                      {p.course_id ? (
                        <Link href={`/dashboard/cursos/${p.course_id}/venta`} className="text-primary-ink hover:underline">
                          {p.course_title}
                        </Link>
                      ) : (
                        p.course_title
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold">{money(p.amount_cents, p.currency)}</p>
                    <Badge tone={PURCHASE_TONE[p.status]}>{PURCHASE_LABEL[p.status]}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
                  <span>{formatDateTime(p.paid_at ?? p.created_at)}</span>
                  {p.payment_method ? <span>{METHOD_LABEL[p.payment_method] ?? p.payment_method}</span> : null}
                  {p.installments ? <span>{p.installments} meses sin intereses</span> : null}
                  {p.promotion_code ? (
                    <span>
                      Cupón {p.promotion_code} (−{money(p.discount_cents, p.currency)})
                    </span>
                  ) : null}
                  {p.refunded_cents > 0 ? <span>Reembolsado {money(p.refunded_cents, p.currency)}</span> : null}
                  {p.tax_ids?.length ? <span>RFC: {p.tax_ids.map((t) => t.value).join(", ")}</span> : null}
                </div>
                {refundable || p.receipt_url ? (
                  <div className="flex flex-wrap gap-2 border-t border-border pt-2">
                    {p.receipt_url ? (
                      <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost min-h-9 px-3 text-xs">
                        <Icon name="external" className="h-3.5 w-3.5" />
                        Recibo
                      </a>
                    ) : null}
                    {refundable ? (
                      <button
                        type="button"
                        className="btn btn-ghost min-h-9 px-3 text-xs text-rose-600 dark:text-rose-400"
                        disabled={busy === p.id}
                        onClick={() => refund(p)}
                      >
                        <Icon name="refresh" className="h-3.5 w-3.5" />
                        {busy === p.id ? "Reembolsando…" : "Reembolsar"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
