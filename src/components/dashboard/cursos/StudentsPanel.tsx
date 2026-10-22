"use client";

import { useEffect, useState } from "react";
import type { CourseStudentRow } from "@/lib/cursos/queries";
import type { StudentAccountRow } from "@/lib/cursos/students";
import { formatDateTime } from "@/lib/cursos/shared";

type Scope = "curso" | "todas";

function suggestPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function percent(s: CourseStudentRow): string {
  const marked = s.presente + s.retardo + s.falta;
  if (marked === 0) return "—";
  return `${Math.round(((s.presente + s.retardo) / marked) * 100)}%`;
}

const actionBtn =
  "inline-flex min-h-10 items-center rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-40";
const dangerBtn =
  "inline-flex min-h-10 items-center rounded-lg px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-40 dark:text-rose-400";

/**
 * Alumnos: los inscritos en el curso (asistencia, entregas, baja) o todas las
 * cuentas (para borrar las que no están en ningún curso). En ambos se puede
 * restablecer la contraseña y eliminar la cuenta.
 */
export default function StudentsPanel({ courseId }: { courseId: string }) {
  const [scope, setScope] = useState<Scope>("curso");
  const [enrolled, setEnrolled] = useState<CourseStudentRow[] | null>(null);
  const [accounts, setAccounts] = useState<StudentAccountRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(which: Scope = scope) {
    setError(null);
    try {
      const r = await fetch(which === "curso" ? `/api/dashboard/cursos/${courseId}/alumnos` : "/api/dashboard/alumnos");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudieron cargar los alumnos");
      if (which === "curso") setEnrolled(j.students as CourseStudentRow[]);
      else setAccounts(j.students as StudentAccountRow[]);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, scope]);

  async function resetPassword(s: { id: string; full_name: string }) {
    const password = window.prompt(
      `Nueva contraseña para ${s.full_name} (mínimo 8 caracteres). Compártesela al alumno:`,
      suggestPassword(),
    );
    if (!password) return;
    setBusyId(s.id);
    try {
      const r = await fetch(`/api/dashboard/alumnos/${s.id}/password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo restablecer");
      window.alert(`Listo. La nueva contraseña de ${s.full_name} es:\n\n${password}`);
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function unenroll(s: CourseStudentRow) {
    if (!window.confirm(`¿Dar de baja a ${s.full_name} de este curso? Su cuenta y entregas se conservan.`)) return;
    setBusyId(s.id);
    const r = await fetch(`/api/dashboard/cursos/${courseId}/alumnos/${s.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!r.ok) return window.alert("No se pudo dar de baja");
    setEnrolled((prev) => prev?.filter((x) => x.id !== s.id) ?? null);
  }

  async function removeAccount(s: { id: string; full_name: string; email: string }) {
    const ok = window.confirm(
      `¿Eliminar la cuenta de ${s.full_name} (${s.email})?\n\n` +
        "Se borran su cuenta, inscripciones, asistencia, entregas y archivos en TODOS los cursos. No se puede deshacer.",
    );
    if (!ok) return;
    setBusyId(s.id);
    const r = await fetch(`/api/dashboard/alumnos/${s.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!r.ok) return window.alert("No se pudo eliminar la cuenta");
    setEnrolled((prev) => prev?.filter((x) => x.id !== s.id) ?? null);
    setAccounts((prev) => prev?.filter((x) => x.id !== s.id) ?? null);
  }

  const list = scope === "curso" ? enrolled : accounts;

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
          {(["curso", "todas"] as const).map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => setScope(sc)}
              className={`min-h-9 rounded-full px-3 text-xs font-medium transition ${
                scope === sc ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2"
              }`}
            >
              {sc === "curso" ? "Este curso" : "Todas las cuentas"}
            </button>
          ))}
        </div>
        <button type="button" className="min-h-10 px-2 text-sm text-muted transition hover:text-fg" onClick={() => load()}>
          Actualizar {list ? `(${list.length})` : ""}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

      {!list ? (
        <p className="text-sm text-subtle">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-subtle">
          {scope === "curso"
            ? "Nadie se ha inscrito todavía. Comparte el enlace del curso."
            : "No hay cuentas de alumnos."}
        </p>
      ) : scope === "curso" ? (
        <ul className="grid gap-3">
          {(list as CourseStudentRow[]).map((s) => (
            <li key={s.id} className="surface-card grid gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{s.full_name}</p>
                  <p className="break-all text-xs text-subtle">{s.email}</p>
                  <p className="text-xs text-subtle">Inscrito: {formatDateTime(s.enrolled_at)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-xl font-bold">{percent(s)}</p>
                  <p className="text-[11px] uppercase tracking-wide text-subtle">asistencia</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-400">
                  {s.presente} presente
                </span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-400">
                  {s.retardo} retardo
                </span>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-rose-700 dark:text-rose-400">
                  {s.falta} falta
                </span>
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-sky-700 dark:text-sky-400">
                  {s.justificada} justificada
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">{s.submissions} entregas</span>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                <button type="button" className={actionBtn} disabled={busyId === s.id} onClick={() => resetPassword(s)}>
                  Restablecer contraseña
                </button>
                <button type="button" className={actionBtn} disabled={busyId === s.id} onClick={() => unenroll(s)}>
                  Dar de baja
                </button>
                <button type="button" className={dangerBtn} disabled={busyId === s.id} onClick={() => removeAccount(s)}>
                  Eliminar cuenta
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="surface-card divide-y divide-border">
          {(list as StudentAccountRow[]).map((s) => (
            <li key={s.id} className="grid gap-2 p-4 sm:flex sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{s.full_name}</p>
                <p className="break-all text-xs text-subtle">{s.email}</p>
                <p className="text-xs text-subtle">
                  {s.courses} {s.courses === 1 ? "curso" : "cursos"} · {s.submissions} entregas · cuenta creada{" "}
                  {formatDateTime(s.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                <button type="button" className={actionBtn} disabled={busyId === s.id} onClick={() => resetPassword(s)}>
                  Restablecer contraseña
                </button>
                <button type="button" className={dangerBtn} disabled={busyId === s.id} onClick={() => removeAccount(s)}>
                  Eliminar cuenta
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
