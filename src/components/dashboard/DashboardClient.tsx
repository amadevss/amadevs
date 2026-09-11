"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatDateTime,
  formatMoney,
  STATUS_LABEL,
  STATUS_TONE,
  TONE_CLASS,
} from "@/lib/agenda/format";
import type { Blackout, BookingWithService, PaymentWithBooking, Service } from "@/lib/agenda/types";
import ManualBookingForm, { type ManualBookingPrefill } from "./ManualBookingForm";
import CalendarView from "./CalendarView";
import PaymentsView from "./PaymentsView";

type Tab = "proximas" | "pasadas" | "canceladas" | "todas";
type View = "lista" | "calendario" | "pagos";

const TAB_LABEL: Record<Tab, string> = {
  proximas: "Próximas",
  pasadas: "Pasadas",
  canceladas: "Canceladas",
  todas: "Todas",
};

const VIEW_LABEL: Record<View, string> = {
  lista: "Lista",
  calendario: "Calendario",
  pagos: "Pagos",
};

const DEAD_STATUSES = new Set(["canceled", "expired", "refunded"]);
const CANCELABLE_STATUSES = new Set(["pending_payment", "confirmed"]);

export default function DashboardClient({
  initialBookings,
  initialPayments,
  initialBlackouts,
  services,
  businessTimezone,
}: {
  initialBookings: BookingWithService[];
  initialPayments: PaymentWithBooking[];
  initialBlackouts: Blackout[];
  services: Service[];
  businessTimezone: string;
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [payments, setPayments] = useState(initialPayments);
  const [view, setView] = useState<View>("lista");
  const [tab, setTab] = useState<Tab>("proximas");
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState<ManualBookingPrefill | undefined>(undefined);
  const [prefillNonce, setPrefillNonce] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const now = Date.now();
    return bookings.filter((b) => {
      const starts = new Date(b.starts_at).getTime();
      const dead = DEAD_STATUSES.has(b.status);
      if (tab === "todas") return true;
      if (tab === "canceladas") return dead;
      if (tab === "pasadas") return !dead && starts < now;
      return !dead && starts >= now;
    });
  }, [bookings, tab]);

  async function refresh() {
    setRefreshing(true);
    try {
      const [rb, rp] = await Promise.all([
        fetch("/api/dashboard/bookings"),
        fetch("/api/dashboard/payments"),
      ]);
      const [jb, jp] = await Promise.all([rb.json(), rp.json()]);
      if (rb.ok) setBookings(jb.bookings as BookingWithService[]);
      if (rp.ok) setPayments(jp.payments as PaymentWithBooking[]);
    } finally {
      setRefreshing(false);
    }
  }

  function openManualForm(pre?: ManualBookingPrefill) {
    setPrefill(pre);
    setPrefillNonce((n) => n + 1);
    setShowForm(true);
  }

  async function cancelBooking(id: string) {
    if (!window.confirm("¿Cancelar esta reserva?")) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/dashboard/bookings/${id}/cancel`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo cancelar");
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...j.booking } : b)));
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/dashboard/logout", { method: "POST" });
    router.replace("/dashboard/login");
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-full border border-border bg-surface p-1">
          {(Object.keys(VIEW_LABEL) as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                view === v ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2"
              }`}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-ghost" onClick={refresh} disabled={refreshing}>
            {refreshing ? "Actualizando…" : "Actualizar"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (showForm ? setShowForm(false) : openManualForm())}
          >
            {showForm ? "Cerrar formulario" : "+ Reserva manual"}
          </button>
          <button
            type="button"
            className="text-sm text-muted transition hover:text-fg"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {showForm ? (
        <ManualBookingForm
          key={prefillNonce}
          services={services}
          initial={prefill}
          onCancel={() => setShowForm(false)}
          onCreated={(b) => {
            setBookings((prev) => [b, ...prev]);
            setShowForm(false);
            setView("lista");
            setTab("proximas");
          }}
        />
      ) : null}

      {view === "calendario" ? (
        <CalendarView
          bookings={bookings}
          initialBlackouts={initialBlackouts}
          services={services}
          businessTimezone={businessTimezone}
          onPickSlot={(args) => openManualForm(args)}
        />
      ) : view === "pagos" ? (
        <PaymentsView payments={payments} businessTimezone={businessTimezone} />
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  tab === t ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2"
                }`}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Sesión</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Importe</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-subtle">
                      Sin reservaciones en esta vista.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{b.reference}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{b.customer_name}</div>
                        <div className="text-xs text-subtle">{b.customer_email}</div>
                      </td>
                      <td className="px-4 py-3">{b.service_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateTime(b.starts_at, b.customer_timezone)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {b.amount_cents === 0 ? "Gratis" : formatMoney(b.amount_cents, b.currency)}
                      </td>
                      <td className="px-4 py-3 text-xs text-subtle">
                        {b.source === "manual" ? "Manual" : "En línea"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            TONE_CLASS[STATUS_TONE[b.status]]
                          }`}
                        >
                          {STATUS_LABEL[b.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {CANCELABLE_STATUSES.has(b.status) ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-rose-600 transition hover:underline disabled:opacity-40 dark:text-rose-400"
                            disabled={busyId === b.id}
                            onClick={() => cancelBooking(b.id)}
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
