"use client";

import { useState, type FormEvent } from "react";
import type { BookingWithService, Service } from "@/lib/agenda/types";

export interface ManualBookingPrefill {
  date?: string;
  time?: string;
  serviceSlug?: string;
}

export default function ManualBookingForm({
  services,
  initial,
  onCreated,
  onCancel,
}: {
  services: Service[];
  initial?: ManualBookingPrefill;
  onCreated: (booking: BookingWithService) => void;
  onCancel: () => void;
}) {
  const [serviceSlug, setServiceSlug] = useState(initial?.serviceSlug ?? services[0]?.slug ?? "");
  const service = services.find((s) => s.slug === serviceSlug) ?? null;
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [priceMxn, setPriceMxn] = useState(
    service ? String(service.price_cents / 100) : "0",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onServiceChange(slug: string) {
    setServiceSlug(slug);
    const s = services.find((x) => x.slug === slug);
    setPriceMxn(s ? String(s.price_cents / 100) : "0");
  }

  const valid =
    !!service &&
    !!date &&
    !!time &&
    name.trim().length > 1 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!service) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/dashboard/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceSlug: service.slug,
          date,
          time,
          amountCents: Math.round((parseFloat(priceMxn) || 0) * 100),
          customer: { name, email, company, note },
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo crear la reserva");
      onCreated(j.booking as BookingWithService);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card grid gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold">Nueva reserva manual</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted transition hover:text-fg"
        >
          Cerrar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Servicio
          </span>
          <select
            className="agenda-input mt-1"
            value={serviceSlug}
            onChange={(e) => onServiceChange(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name} · {s.duration_minutes} min
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Precio (MXN)
          </span>
          <input
            className="agenda-input mt-1"
            type="number"
            min="0"
            step="0.01"
            value={priceMxn}
            onChange={(e) => setPriceMxn(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Fecha
          </span>
          <input
            className="agenda-input mt-1"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Hora (Tijuana)
          </span>
          <input
            className="agenda-input mt-1"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Nombre *
          </span>
          <input
            className="agenda-input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Correo *
          </span>
          <input
            className="agenda-input mt-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Empresa
          </span>
          <input
            className="agenda-input mt-1"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Nota
          </span>
          <textarea
            className="agenda-textarea mt-1"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn btn-primary w-full sm:w-auto"
        disabled={!valid || submitting}
      >
        {submitting ? "Guardando…" : "Crear reserva confirmada"}
      </button>
    </form>
  );
}
