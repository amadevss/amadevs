"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { formatDateTime, formatMoney, STATUS_LABEL, STATUS_TONE } from "@/lib/agenda/format";
import type { BookingWithService } from "@/lib/agenda/types";
import {
  BOOKING_FILTERS,
  BOOKING_FILTER_LABEL,
  CANCELABLE,
  matchesFilter,
  type BookingFilter,
} from "@/lib/dashboard/bookings";
import { useFeedback } from "@/components/ui/feedback";
import { Badge, ButtonLink, EmptyState } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

export default function BookingsView({
  bookings,
  filter,
  businessTimezone,
}: {
  bookings: BookingWithService[];
  filter: BookingFilter;
  businessTimezone: string;
}) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startRefresh] = useTransition();
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const now = Date.now();
    return Object.fromEntries(
      BOOKING_FILTERS.map((f) => [f, bookings.filter((b) => matchesFilter(b, f, now)).length]),
    ) as Record<BookingFilter, number>;
  }, [bookings]);

  const rows = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    const list = bookings.filter((b) => matchesFilter(b, filter, now));
    const searched = q
      ? list.filter((b) =>
          [b.customer_name, b.customer_email, b.reference, b.service_name].some((v) => v?.toLowerCase().includes(q)),
        )
      : list;
    // Próximas: la más cercana primero. Resto: la más reciente primero.
    return searched.sort((a, b) => {
      const d = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      return filter === "proximas" || filter === "espera" ? d : -d;
    });
  }, [bookings, filter, query]);

  async function cancel(b: BookingWithService) {
    const ok = await confirm({
      title: "¿Cancelar esta reserva?",
      message: (
        <>
          {b.customer_name} · {b.service_name}
          <br />
          {formatDateTime(b.starts_at, businessTimezone)}
        </>
      ),
      confirmLabel: "Cancelar reserva",
      cancelLabel: "No, mantener",
      danger: true,
    });
    if (!ok) return;
    setBusyId(b.id);
    try {
      const r = await fetch(`/api/dashboard/bookings/${b.id}/cancel`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo cancelar");
      toast.success("Reserva cancelada");
      startRefresh(() => router.refresh());
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1.5">
          {BOOKING_FILTERS.map((f) => {
            const active = f === filter;
            return (
              <Link
                key={f}
                href={f === "proximas" ? "/dashboard/reservas" : `/dashboard/reservas?estado=${f}`}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition ${
                  active ? "border-primary/40 bg-primary-soft text-primary-ink" : "border-border text-muted hover:bg-surface-2"
                }`}
              >
                {BOOKING_FILTER_LABEL[f]}
                <span className={`text-xs ${active ? "text-primary-ink" : "text-subtle"}`}>{counts[f]}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">Buscar</span>
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          className="agenda-input min-h-11 pl-9"
          placeholder="Buscar por nombre, correo o folio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {rows.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={query ? "Sin resultados" : "No hay reservas en esta vista"}
          action={
            query ? null : (
              <ButtonLink href="/dashboard/reservas/nueva" icon="plus" variant="ghost">
                Registrar una reserva
              </ButtonLink>
            )
          }
        >
          {query ? "Prueba con otro nombre, correo o folio." : "Cambia el filtro o registra una reserva manual."}
        </EmptyState>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map((b) => (
              <li key={b.id} className="surface-card grid grid-cols-1 gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.customer_name}</p>
                    <p className="truncate text-xs text-subtle">{b.customer_email}</p>
                  </div>
                  <Badge tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-1 text-sm">
                  <p className="flex items-center gap-2 text-muted">
                    <Icon name="calendar" className="h-4 w-4 shrink-0" />
                    {formatDateTime(b.starts_at, businessTimezone)}
                  </p>
                  <p className="flex items-center gap-2 text-muted">
                    <Icon name="card" className="h-4 w-4 shrink-0" />
                    {b.service_name} · {b.amount_cents === 0 ? "Gratis" : formatMoney(b.amount_cents, b.currency)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-subtle">
                  <span className="font-mono">
                    {b.reference} · {b.source === "manual" ? "Manual" : "En línea"}
                  </span>
                  {CANCELABLE.has(b.status) ? (
                    <button
                      type="button"
                      className="min-h-10 rounded-lg px-3 font-medium text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-40 dark:text-rose-400"
                      disabled={busyId === b.id}
                      onClick={() => cancel(b)}
                    >
                      {busyId === b.id ? "Cancelando…" : "Cancelar"}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {/* Computadora: tabla */}
          <div className="surface-card hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Sesión</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Importe</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b border-border transition last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.customer_name}</div>
                      <div className="text-xs text-subtle">
                        <span className="font-mono">{b.reference}</span> · {b.source === "manual" ? "Manual" : "En línea"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{b.service_name}</td>
                    <td className="px-4 py-3">{formatDateTime(b.starts_at, businessTimezone)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {b.amount_cents === 0 ? "Gratis" : formatMoney(b.amount_cents, b.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {CANCELABLE.has(b.status) ? (
                        <button
                          type="button"
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-40 dark:text-rose-400"
                          disabled={busyId === b.id}
                          onClick={() => cancel(b)}
                        >
                          {busyId === b.id ? "Cancelando…" : "Cancelar"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
