"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { PromoRow } from "@/lib/cursos/coupons";
import { useFeedback } from "@/components/ui/feedback";
import { Badge, EmptyState, ErrorNote, FIELD_LABEL } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

type CourseOption = { id: string; title: string };

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

function CreateForm({ courses, onDone }: { courses: CourseOption[]; onDone: () => void }) {
  const { toast } = useFeedback();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("mxn");
  const [max, setMax] = useState("");
  const [expires, setExpires] = useState("");
  const [firstTime, setFirstTime] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const r = await fetch("/api/dashboard/cupones", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        kind,
        value,
        currency,
        max_redemptions: max || null,
        expires_at: expires ? new Date(expires).toISOString() : null,
        first_time_only: firstTime,
        course_ids: selected,
      }),
    });
    const j = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) return setError(j.error || "No se pudo crear el cupón");
    toast.success(`Cupón ${code.toUpperCase()} creado`);
    setCode("");
    setValue("");
    setMax("");
    setExpires("");
    setSelected([]);
    onDone();
  }

  return (
    <form onSubmit={submit} className="surface-card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
      <h2 className="font-display text-lg font-bold sm:col-span-2">Nuevo cupón</h2>
      <label className="block">
        <span className={FIELD_LABEL}>Código *</span>
        <input
          className="agenda-input mt-1 min-h-11 font-mono uppercase"
          placeholder="DOCENTES20"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
        />
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <label className="block">
          <span className={FIELD_LABEL}>Descuento *</span>
          <input className="agenda-input mt-1 min-h-11" inputMode="decimal" placeholder={kind === "percent" ? "20" : "100"} value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Tipo</span>
          <select
            className="agenda-input mt-1 min-h-11"
            value={kind === "percent" ? "percent" : currency}
            onChange={(e) => {
              if (e.target.value === "percent") setKind("percent");
              else {
                setKind("amount");
                setCurrency(e.target.value);
              }
            }}
          >
            <option value="percent">%</option>
            <option value="mxn">$ MXN</option>
            <option value="usd">$ USD</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className={FIELD_LABEL}>Límite de usos (opcional)</span>
        <input className="agenda-input mt-1 min-h-11" inputMode="numeric" placeholder="Sin límite" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} />
      </label>
      <label className="block">
        <span className={FIELD_LABEL}>Vence (opcional)</span>
        <input type="datetime-local" className="agenda-input mt-1 min-h-11" value={expires} onChange={(e) => setExpires(e.target.value)} />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className={FIELD_LABEL}>Cursos</legend>
        <p className="mb-2 text-xs text-subtle">Sin seleccionar ninguno, aplica a todos los cursos de pago.</p>
        {courses.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay cursos públicos de pago.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => {
              const on = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                  className={`min-h-9 rounded-full border px-3 text-sm transition ${on ? "border-primary bg-primary-soft text-primary-ink" : "border-border text-muted hover:bg-surface-2"}`}
                >
                  {on ? "✓ " : ""}
                  {c.title}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>
      <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={firstTime} onChange={(e) => setFirstTime(e.target.checked)} />
        Solo para la primera compra de cada persona
      </label>
      {error ? <div className="sm:col-span-2"><ErrorNote>{error}</ErrorNote></div> : null}
      <div className="flex justify-end border-t border-border pt-4 sm:col-span-2">
        <button type="submit" className="btn btn-primary min-h-11" disabled={saving || code.length < 3 || !value}>
          {saving ? "Creando…" : "Crear cupón"}
        </button>
      </div>
    </form>
  );
}

export default function PromotionsPanel({ promos, courses }: { promos: PromoRow[]; courses: CourseOption[] }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [busy, setBusy] = useState<string | null>(null);
  const [, startRefresh] = useTransition();
  const refresh = () => startRefresh(() => router.refresh());
  const titleOf = new Map(courses.map((c) => [c.id, c.title]));

  async function toggle(p: PromoRow) {
    setBusy(p.id);
    const r = await fetch(`/api/dashboard/cupones/${p.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    setBusy(null);
    if (!r.ok) return toast.error("No se pudo actualizar el cupón");
    toast.success(p.active ? `${p.code} pausado` : `${p.code} activo`);
    refresh();
  }

  async function remove(p: PromoRow) {
    const yes = await confirm({
      title: `¿Borrar el cupón ${p.code}?`,
      message: "Deja de funcionar de inmediato. Las compras que ya lo usaron no cambian.",
      confirmLabel: "Borrar",
      danger: true,
    });
    if (!yes) return;
    setBusy(p.id);
    const r = await fetch(`/api/dashboard/cupones/${p.id}`, { method: "DELETE" });
    setBusy(null);
    if (!r.ok) return toast.error("No se pudo borrar el cupón");
    toast.success("Cupón borrado");
    refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <CreateForm courses={courses} onDone={refresh} />
      {promos.length === 0 ? (
        <EmptyState icon="sparkles" title="Aún no hay cupones">
          Crea un código y compártelo; los alumnos lo escriben al pagar.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {promos.map((p) => {
            const expired = p.expires_at ? p.expires_at * 1000 < Date.now() : false;
            const usable = p.active && p.valid && !expired;
            return (
              <li key={p.id} className="surface-card grid grid-cols-1 gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-lg font-bold">{p.code}</p>
                    <p className="text-sm text-muted">
                      {p.percent_off ? `${p.percent_off}% de descuento` : p.amount_off ? `${money(p.amount_off, p.currency ?? "mxn")} de descuento` : ""}
                    </p>
                  </div>
                  <Badge tone={usable ? "ok" : "muted"}>{usable ? "Activo" : expired ? "Vencido" : !p.valid ? "Agotado" : "Pausado"}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
                  <span>
                    Usado {p.times_redeemed}
                    {p.max_redemptions ? ` de ${p.max_redemptions}` : ""} veces
                  </span>
                  {p.expires_at ? <span>Vence {new Date(p.expires_at * 1000).toLocaleDateString("es-MX")}</span> : null}
                  {p.first_time_only ? <span>Solo primera compra</span> : null}
                  <span>{p.course_ids.length ? p.course_ids.map((id) => titleOf.get(id) ?? "Curso").join(", ") : "Todos los cursos"}</span>
                </div>
                <div className="flex gap-2 border-t border-border pt-2">
                  <button type="button" className="btn btn-ghost min-h-9 px-3 text-xs" disabled={busy === p.id || expired || !p.valid} onClick={() => toggle(p)}>
                    <Icon name={p.active ? "eyeOff" : "eye"} className="h-3.5 w-3.5" />
                    {p.active ? "Pausar" : "Activar"}
                  </button>
                  <button type="button" className="btn btn-ghost min-h-9 px-3 text-xs text-rose-600 dark:text-rose-400" disabled={busy === p.id} onClick={() => remove(p)}>
                    <Icon name="trash" className="h-3.5 w-3.5" />
                    Borrar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
