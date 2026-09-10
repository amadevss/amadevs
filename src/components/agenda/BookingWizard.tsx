"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/agenda/format";
import type { Service } from "@/lib/agenda/types";

interface Slot {
  startsAt: string;
  endsAt: string;
}

const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function todayISO() {
  const n = new Date();
  return toISODate(n.getFullYear(), n.getMonth(), n.getDate());
}
function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return toISODate(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
function weekdayOfISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay(); // 0 = domingo
}
function humanDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  const wdName = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][wd];
  return `${wdName} ${d} de ${MONTHS[m - 1]} ${y}`;
}
function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const HORIZON_DAYS = 60;

export default function BookingWizard({
  services,
  activeWeekdays,
  businessTimezone,
}: {
  services: Service[];
  activeWeekdays: number[];
  businessTimezone: string;
}) {
  const [serviceSlug, setServiceSlug] = useState<string | null>(
    services.length === 1 ? services[0].slug : null,
  );
  const service = services.find((s) => s.slug === serviceSlug) ?? null;

  const today = todayISO();
  const maxISO = addDaysISO(today, HORIZON_DAYS);
  const [view, setView] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m - 1 }; // month 0-indexed
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [form, setForm] = useState({ name: "", email: "", company: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [canceledRef, setCanceledRef] = useState<string | null>(null);

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || businessTimezone;
    } catch {
      return businessTimezone;
    }
  }, [businessTimezone]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("cancelado");
    if (c) setCanceledRef(c);
  }, []);

  // Al cambiar de servicio o fecha, recargar horarios.
  useEffect(() => {
    if (!serviceSlug || !selectedDate) {
      setSlots(null);
      return;
    }
    let alive = true;
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots(null);
    setSelectedSlot(null);
    fetch(`/api/agenda/availability?date=${selectedDate}&service=${serviceSlug}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "No se pudo cargar la disponibilidad");
        return j.slots as Slot[];
      })
      .then((s) => {
        if (alive) setSlots(s);
      })
      .catch((e) => {
        if (alive) setSlotsError((e as Error).message);
      })
      .finally(() => {
        if (alive) setSlotsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [serviceSlug, selectedDate]);

  const monthCells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(view.year, view.month, d));
    return cells;
  }, [view]);

  function dayDisabled(iso: string) {
    if (iso < today || iso > maxISO) return true;
    return !activeWeekdays.includes(weekdayOfISO(iso));
  }

  const canGoPrev =
    `${view.year}-${pad(view.month + 1)}` > today.slice(0, 7);
  const canGoNext =
    `${view.year}-${pad(view.month + 1)}` < maxISO.slice(0, 7);

  async function submit() {
    if (!service || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await fetch("/api/agenda/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceSlug: service.slug,
          startsAt: selectedSlot.startsAt,
          customer: {
            name: form.name,
            email: form.email,
            company: form.company,
            note: form.note,
            timezone,
          },
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo completar la reserva");
      window.location.href = j.checkoutUrl || j.redirectUrl;
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  }

  const formValid =
    form.name.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());

  return (
    <div className="grid gap-6">
      {canceledRef ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Cancelaste el pago de la reserva{" "}
          <span className="font-mono">{canceledRef}</span>. El horario queda apartado unos
          minutos por si quieres reintentar.
        </p>
      ) : null}

      {/* Paso 1 — Servicio */}
      <section className="surface-card p-5 sm:p-6">
        <StepTitle n={1} title="Elige el tipo de sesión" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {services.map((s) => {
            const selected = s.slug === serviceSlug;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => setServiceSlug(s.slug)}
                aria-pressed={selected}
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:border-border-strong hover:bg-surface-2"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-sm font-semibold text-primary">
                    {s.price_cents === 0 ? "Gratis" : formatMoney(s.price_cents, s.currency)}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-subtle">
                  {s.duration_minutes} min
                </span>
                {s.description ? (
                  <span className="mt-2 block text-sm text-muted">{s.description}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* Paso 2 — Fecha y hora */}
      <section
        className={`surface-card p-5 sm:p-6 ${service ? "" : "pointer-events-none opacity-50"}`}
      >
        <StepTitle n={2} title="Elige fecha y hora" />

        <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,20rem)_1fr]">
          {/* Calendario */}
          <div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-muted enabled:hover:bg-surface-2 disabled:opacity-30"
                onClick={() =>
                  setView((v) =>
                    v.month === 0
                      ? { year: v.year - 1, month: 11 }
                      : { year: v.year, month: v.month - 1 },
                  )
                }
                disabled={!canGoPrev}
                aria-label="Mes anterior"
              >
                ←
              </button>
              <span className="text-sm font-semibold capitalize">
                {MONTHS[view.month]} {view.year}
              </span>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-muted enabled:hover:bg-surface-2 disabled:opacity-30"
                onClick={() =>
                  setView((v) =>
                    v.month === 11
                      ? { year: v.year + 1, month: 0 }
                      : { year: v.year, month: v.month + 1 },
                  )
                }
                disabled={!canGoNext}
                aria-label="Mes siguiente"
              >
                →
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-semibold text-subtle">
              {WEEKDAY_LABELS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {monthCells.map((iso, i) =>
                iso === null ? (
                  <span key={`e${i}`} />
                ) : (
                  <button
                    key={iso}
                    type="button"
                    className="agenda-day"
                    data-selected={selectedDate === iso}
                    disabled={dayDisabled(iso)}
                    onClick={() => setSelectedDate(iso)}
                  >
                    {Number(iso.slice(-2))}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Horarios */}
          <div className="min-h-[8rem]">
            {!selectedDate ? (
              <p className="text-sm text-subtle">Selecciona un día en el calendario.</p>
            ) : (
              <>
                <p className="text-sm font-semibold capitalize">{humanDate(selectedDate)}</p>
                <p className="mt-0.5 text-xs text-subtle">
                  Horarios en tu zona ({timezone})
                </p>

                {slotsLoading ? (
                  <p className="mt-3 text-sm text-subtle">Cargando horarios…</p>
                ) : slotsError ? (
                  <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{slotsError}</p>
                ) : slots && slots.length === 0 ? (
                  <p className="mt-3 text-sm text-subtle">
                    No hay horarios disponibles ese día. Prueba con otra fecha.
                  </p>
                ) : slots ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {slots.map((s) => {
                      const sel = selectedSlot?.startsAt === s.startsAt;
                      return (
                        <button
                          key={s.startsAt}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          aria-pressed={sel}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                            sel
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border-strong hover:bg-surface-2"
                          }`}
                        >
                          {timeLabel(s.startsAt)}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Paso 3 — Datos */}
      <section
        className={`surface-card p-5 sm:p-6 ${
          service && selectedSlot ? "" : "pointer-events-none opacity-50"
        }`}
      >
        <StepTitle n={3} title="Tus datos" />

        {service && selectedSlot ? (
          <p className="mt-2 text-sm text-muted">
            {service.name} · {humanDate(selectedSlot.startsAt.slice(0, 10))} a las{" "}
            {timeLabel(selectedSlot.startsAt)} ({timezone})
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Nombre *
            </span>
            <input
              className="agenda-input mt-1"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Correo *
            </span>
            <input
              className="agenda-input mt-1"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Empresa / organización
            </span>
            <input
              className="agenda-input mt-1"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              autoComplete="organization"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
              ¿Qué te gustaría resolver en la sesión?
            </span>
            <textarea
              className="agenda-textarea mt-1"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
        </div>

        {submitError ? (
          <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
            {submitError}
          </p>
        ) : null}

        <button
          type="button"
          className="btn btn-primary mt-5 w-full sm:w-auto"
          disabled={!formValid || submitting}
          onClick={submit}
        >
          {submitting
            ? "Procesando…"
            : service && service.price_cents === 0
              ? "Confirmar reserva"
              : service
                ? `Ir a pagar ${formatMoney(service.price_cents, service.currency)}`
                : "Continuar"}
        </button>
        <p className="mt-3 text-xs text-subtle">
          El pago se procesa de forma segura con Stripe. El horario se aparta 30 minutos
          mientras completas el pago.
        </p>
      </section>
    </div>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
        {n}
      </span>
      <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
    </div>
  );
}
