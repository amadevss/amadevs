"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { DateTime } from "luxon";
import { STATUS_TONE } from "@/lib/agenda/format";
import type { Blackout, BookingWithService, Service } from "@/lib/agenda/types";

const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const DOT_CLASS: Record<"ok" | "warn" | "muted" | "bad", string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  muted: "bg-subtle",
  bad: "bg-rose-500",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

interface Slot {
  startsAt: string;
  endsAt: string;
}

export default function CalendarView({
  bookings,
  initialBlackouts,
  services,
  businessTimezone,
  onPickSlot,
}: {
  bookings: BookingWithService[];
  initialBlackouts: Blackout[];
  services: Service[];
  businessTimezone: string;
  onPickSlot: (args: { date: string; time?: string; serviceSlug?: string }) => void;
}) {
  const today = DateTime.now().setZone(businessTimezone);
  const todayIso = today.toISODate() ?? "";
  const [view, setView] = useState({ year: today.year, month: today.month - 1 });
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [calServiceSlug, setCalServiceSlug] = useState(services[0]?.slug ?? "");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [blackouts, setBlackouts] = useState(initialBlackouts);
  const [showBlackoutForm, setShowBlackoutForm] = useState(false);
  const [blackoutBusy, setBlackoutBusy] = useState(false);
  const [blackoutError, setBlackoutError] = useState<string | null>(null);
  const [bStartDate, setBStartDate] = useState("");
  const [bStartTime, setBStartTime] = useState("07:00");
  const [bEndDate, setBEndDate] = useState("");
  const [bEndTime, setBEndTime] = useState("21:00");
  const [bReason, setBReason] = useState("");

  function timeLabel(value: string | Date) {
    return DateTime.fromJSDate(new Date(value)).setZone(businessTimezone).toFormat("HH:mm");
  }

  function pickDate(iso: string) {
    setSelectedDate(iso);
    setShowBlackoutForm(false);
  }

  function toggleBlackoutForm() {
    if (showBlackoutForm) {
      setShowBlackoutForm(false);
      return;
    }
    setBStartDate(selectedDate);
    setBEndDate(selectedDate);
    setBStartTime("07:00");
    setBEndTime("21:00");
    setBReason("");
    setBlackoutError(null);
    setShowBlackoutForm(true);
  }

  async function submitBlackout(e: FormEvent) {
    e.preventDefault();
    setBlackoutBusy(true);
    setBlackoutError(null);
    try {
      const r = await fetch("/api/dashboard/blackouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          startDate: bStartDate,
          startTime: bStartTime,
          endDate: bEndDate,
          endTime: bEndTime,
          reason: bReason,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo crear el bloqueo");
      setBlackouts((prev) => [j.blackout as Blackout, ...prev]);
      setShowBlackoutForm(false);
    } catch (err) {
      setBlackoutError((err as Error).message);
    } finally {
      setBlackoutBusy(false);
    }
  }

  async function removeBlackout(id: string) {
    if (!window.confirm("¿Quitar este bloqueo?")) return;
    try {
      const r = await fetch(`/api/dashboard/blackouts/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo quitar el bloqueo");
      setBlackouts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      window.alert((err as Error).message);
    }
  }

  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingWithService[]> = {};
    for (const b of bookings) {
      const iso = DateTime.fromJSDate(new Date(b.starts_at)).setZone(businessTimezone).toISODate();
      if (!iso) continue;
      (map[iso] ??= []).push(b);
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    }
    return map;
  }, [bookings, businessTimezone]);

  function blackoutsForDay(iso: string): Blackout[] {
    const dayStart = DateTime.fromISO(iso, { zone: businessTimezone }).startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    return blackouts.filter((b) => {
      const bs = DateTime.fromJSDate(new Date(b.starts_at)).setZone(businessTimezone);
      const be = DateTime.fromJSDate(new Date(b.ends_at)).setZone(businessTimezone);
      return bs < dayEnd && be > dayStart;
    });
  }

  useEffect(() => {
    if (!selectedDate || !calServiceSlug) {
      setSlots(null);
      return;
    }
    let alive = true;
    setSlotsLoading(true);
    setSlots(null);
    fetch(`/api/agenda/availability?date=${selectedDate}&service=${calServiceSlug}`)
      .then((r) => r.json())
      .then((j) => {
        if (alive) setSlots(j.slots ?? []);
      })
      .catch(() => {
        if (alive) setSlots([]);
      })
      .finally(() => {
        if (alive) setSlotsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedDate, calServiceSlug, blackouts]);

  const monthCells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(view.year, view.month, d));
    return cells;
  }, [view]);

  const selectedBookings = selectedDate ? (bookingsByDate[selectedDate] ?? []) : [];
  const selectedBlackouts = selectedDate ? blackoutsForDay(selectedDate) : [];

  return (
    <div className="surface-card grid gap-6 p-5 sm:grid-cols-[minmax(0,20rem)_1fr] sm:p-6">
      {/* Calendario */}
      <div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface-2"
            onClick={() =>
              setView((v) =>
                v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 },
              )
            }
            aria-label="Mes anterior"
          >
            ←
          </button>
          <span className="text-sm font-semibold capitalize">
            {MONTHS[view.month]} {view.year}
          </span>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface-2"
            onClick={() =>
              setView((v) =>
                v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 },
              )
            }
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
          {monthCells.map((iso, i) => {
            if (iso === null) return <span key={`e${i}`} />;
            const dayBookings = bookingsByDate[iso] ?? [];
            const tones = Array.from(new Set(dayBookings.map((b) => STATUS_TONE[b.status])));
            const blocked = blackoutsForDay(iso).length > 0;
            return (
              <button
                key={iso}
                type="button"
                className={`agenda-day ${blocked ? "bg-black/5 dark:bg-white/5" : ""}`}
                data-selected={selectedDate === iso}
                onClick={() => pickDate(iso)}
              >
                <span className="flex flex-col items-center leading-none">
                  <span className={iso === todayIso ? "font-bold" : ""}>{Number(iso.slice(-2))}</span>
                  {tones.length > 0 ? (
                    <span className="mt-1 flex justify-center gap-0.5">
                      {tones.slice(0, 3).map((t) => (
                        <span key={t} className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[t]}`} />
                      ))}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-black/10 dark:bg-white/10" />
          Día con horario bloqueado
        </p>
      </div>

      {/* Detalle del día */}
      <div>
        {selectedDate ? (
          <>
            <p className="text-sm font-semibold capitalize">
              {DateTime.fromISO(selectedDate).setLocale("es").toFormat("cccc d 'de' LLLL yyyy")}
            </p>

            <div className="mt-3 grid gap-2">
              {selectedBookings.length === 0 ? (
                <p className="text-sm text-subtle">Sin reservaciones este día.</p>
              ) : (
                selectedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-mono text-xs text-subtle">{timeLabel(b.starts_at)}</span>{" "}
                      <span className="font-medium">{b.customer_name}</span>{" "}
                      <span className="text-subtle">· {b.service_name}</span>
                    </span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[STATUS_TONE[b.status]]}`} />
                  </div>
                ))
              )}
            </div>

            {/* Bloqueos de horario */}
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  Bloqueos de horario
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={toggleBlackoutForm}
                >
                  {showBlackoutForm ? "Cancelar" : "+ Bloquear"}
                </button>
              </div>

              {selectedBlackouts.length === 0 ? (
                <p className="mt-2 text-sm text-subtle">Sin bloqueos este día.</p>
              ) : (
                <div className="mt-2 grid gap-2">
                  {selectedBlackouts.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-black/5 px-3 py-2 text-sm dark:bg-white/5"
                    >
                      <span>
                        <span className="font-mono text-xs text-subtle">
                          {timeLabel(b.starts_at)}–{timeLabel(b.ends_at)}
                        </span>
                        {b.reason ? <span className="text-muted"> · {b.reason}</span> : null}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 text-xs font-medium text-rose-600 transition hover:underline dark:text-rose-400"
                        onClick={() => removeBlackout(b.id)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showBlackoutForm ? (
                <form onSubmit={submitBlackout} className="mt-3 grid gap-3 rounded-lg border border-border p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-subtle">
                        Desde
                      </span>
                      <input
                        type="date"
                        className="agenda-input mt-1"
                        value={bStartDate}
                        onChange={(e) => setBStartDate(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-subtle">
                        Hora
                      </span>
                      <input
                        type="time"
                        className="agenda-input mt-1"
                        value={bStartTime}
                        onChange={(e) => setBStartTime(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-subtle">
                        Hasta
                      </span>
                      <input
                        type="date"
                        className="agenda-input mt-1"
                        value={bEndDate}
                        onChange={(e) => setBEndDate(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-subtle">
                        Hora
                      </span>
                      <input
                        type="time"
                        className="agenda-input mt-1"
                        value={bEndTime}
                        onChange={(e) => setBEndTime(e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-subtle">
                      Motivo (opcional)
                    </span>
                    <input
                      className="agenda-input mt-1"
                      value={bReason}
                      onChange={(e) => setBReason(e.target.value)}
                      placeholder="Vacaciones, personal…"
                    />
                  </label>
                  {blackoutError ? (
                    <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                      {blackoutError}
                    </p>
                  ) : null}
                  <button type="submit" className="btn btn-primary" disabled={blackoutBusy}>
                    {blackoutBusy ? "Guardando…" : "Bloquear"}
                  </button>
                </form>
              ) : null}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  Horarios disponibles
                </p>
                {services.length > 1 ? (
                  <select
                    className="rounded-lg border border-border-strong bg-surface-2 px-2 py-1 text-xs"
                    value={calServiceSlug}
                    onChange={(e) => setCalServiceSlug(e.target.value)}
                  >
                    {services.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              {slotsLoading ? (
                <p className="mt-3 text-sm text-subtle">Cargando…</p>
              ) : slots && slots.length === 0 ? (
                <p className="mt-3 text-sm text-subtle">Sin horarios libres ese día.</p>
              ) : slots ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.startsAt}
                      type="button"
                      className="rounded-lg border border-border-strong px-3 py-1.5 text-sm font-medium transition hover:bg-surface-2"
                      onClick={() =>
                        onPickSlot({
                          date: selectedDate,
                          time: timeLabel(s.startsAt),
                          serviceSlug: calServiceSlug,
                        })
                      }
                    >
                      {timeLabel(s.startsAt)}
                    </button>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                className="btn btn-ghost mt-4"
                onClick={() => onPickSlot({ date: selectedDate, serviceSlug: calServiceSlug })}
              >
                + Agregar sin horario fijo
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-subtle">Selecciona un día en el calendario.</p>
        )}
      </div>
    </div>
  );
}
