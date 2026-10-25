"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Course } from "@/lib/cursos/queries";
import { useFeedback } from "@/components/ui/feedback";
import { Badge, ErrorNote, FIELD_LABEL } from "@/components/ui/kit";

const METHODS = [
  { value: "card", label: "Tarjeta de crédito o débito", hint: "Visa, Mastercard, American Express." },
  { value: "oxxo", label: "Efectivo en OXXO", hint: "Solo pesos. El acceso llega cuando se acredita (horas después)." },
];

function Check({
  checked,
  onChange,
  title,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border border-border p-3 transition ${
        disabled ? "opacity-50" : "cursor-pointer hover:bg-surface-2"
      }`}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[var(--primary)]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-subtle">{hint}</span>
      </span>
    </label>
  );
}

/** Precio y opciones de pago de un curso público. Al guardar se sincroniza con Stripe. */
export default function SaleForm({ course, mode }: { course: Course; mode: "test" | "live" }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [free, setFree] = useState(course.price_cents === 0);
  const [price, setPrice] = useState(course.price_cents ? String(course.price_cents / 100) : "");
  const [currency, setCurrency] = useState(course.currency || "mxn");
  const [methods, setMethods] = useState<string[]>(course.payment_methods?.length ? course.payment_methods : ["card"]);
  const [promos, setPromos] = useState(course.allow_promotion_codes);
  const [installments, setInstallments] = useState(course.installments);
  const [taxId, setTaxId] = useState(course.collect_tax_id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mxn = currency === "mxn";
  const toggleMethod = (m: string, on: boolean) => setMethods((prev) => (on ? [...new Set([...prev, m])] : prev.filter((x) => x !== m)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/dashboard/cursos/${course.id}/venta`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          price: free ? 0 : price,
          currency,
          payment_methods: mxn ? methods : methods.filter((m) => m !== "oxxo"),
          allow_promotion_codes: promos,
          installments: mxn && methods.includes("card") && installments,
          collect_tax_id: taxId,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo guardar");
      toast.success(free ? "El curso quedó gratis" : "Precio guardado y sincronizado con Stripe");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card grid grid-cols-1 gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Precio y pagos</h2>
        <Badge tone={mode === "live" ? "ok" : "warn"} dot>
          Stripe en modo {mode === "live" ? "real" : "prueba"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { v: true, t: "Gratis", h: "Cualquiera se inscribe sin pagar." },
          { v: false, t: "De pago", h: "Pago único con Stripe; acceso permanente." },
        ].map((o) => (
          <label
            key={o.t}
            className={`cursor-pointer rounded-xl border p-3 transition ${free === o.v ? "border-primary bg-primary-soft" : "border-border hover:bg-surface-2"}`}
          >
            <input type="radio" name="free" className="sr-only" checked={free === o.v} onChange={() => setFree(o.v)} />
            <span className="block text-sm font-semibold">{o.t}</span>
            <span className="block text-xs text-subtle">{o.h}</span>
          </label>
        ))}
      </div>

      {!free ? (
        <>
          <div className="grid grid-cols-[1fr_7rem] gap-3 sm:max-w-sm">
            <label className="block">
              <span className={FIELD_LABEL}>Precio</span>
              <input
                className="agenda-input mt-1 min-h-11"
                inputMode="decimal"
                placeholder="499"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label className="block">
              <span className={FIELD_LABEL}>Moneda</span>
              <select className="agenda-input mt-1 min-h-11" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="mxn">MXN</option>
                <option value="usd">USD</option>
              </select>
            </label>
          </div>

          <fieldset className="grid grid-cols-1 gap-2">
            <legend className={`${FIELD_LABEL} mb-1`}>Formas de pago</legend>
            {METHODS.map((m) => (
              <Check
                key={m.value}
                checked={methods.includes(m.value) && (mxn || m.value !== "oxxo")}
                onChange={(on) => toggleMethod(m.value, on)}
                title={m.label}
                hint={m.value === "oxxo" && !mxn ? "Disponible solo en pesos mexicanos." : m.hint}
                disabled={m.value === "oxxo" && !mxn}
              />
            ))}
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-2">
            <legend className={`${FIELD_LABEL} mb-1`}>Opciones</legend>
            <Check
              checked={installments && mxn && methods.includes("card")}
              onChange={setInstallments}
              disabled={!mxn || !methods.includes("card")}
              title="Meses sin intereses"
              hint="Con tarjetas de crédito mexicanas que lo permitan. Debe estar activo en tu cuenta de Stripe."
            />
            <Check checked={promos} onChange={setPromos} title="Aceptar cupones" hint="Muestra el campo de código de descuento al pagar." />
            <Check
              checked={taxId}
              onChange={setTaxId}
              title="Pedir datos fiscales (RFC)"
              hint="El alumno puede escribir su RFC al pagar; lo ves en Ventas para facturar."
            />
          </fieldset>
        </>
      ) : null}

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle">
          {course.stripe_price_id && course.stripe_mode === mode
            ? `Stripe: ${course.stripe_product_id} · ${course.stripe_price_id}`
            : "Al guardar un precio se crea el producto en Stripe automáticamente."}
        </p>
        <button type="submit" className="btn btn-primary min-h-11" disabled={saving || (!free && !price)}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
