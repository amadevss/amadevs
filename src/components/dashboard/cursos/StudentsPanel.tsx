"use client";

import { useEffect, useState } from "react";
import type { CourseStudentRow } from "@/lib/cursos/queries";
import { formatDateTime } from "@/lib/cursos/shared";

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

/** Alumnos inscritos en un curso: asistencia, entregas, restablecer contraseña y baja. */
export default function StudentsPanel({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<CourseStudentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const r = await fetch(`/api/dashboard/cursos/${courseId}/alumnos`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudieron cargar los alumnos");
      setStudents(j.students as CourseStudentRow[]);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function resetPassword(s: CourseStudentRow) {
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
    if (!window.confirm(`¿Dar de baja a ${s.full_name} de este curso? Sus entregas se conservan.`)) return;
    setBusyId(s.id);
    const r = await fetch(`/api/dashboard/cursos/${courseId}/alumnos/${s.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!r.ok) return window.alert("No se pudo dar de baja");
    setStudents((prev) => prev?.filter((x) => x.id !== s.id) ?? null);
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold">
          Alumnos inscritos {students ? `(${students.length})` : ""}
        </h3>
        <button type="button" className="min-h-10 px-2 text-sm text-muted transition hover:text-fg" onClick={load}>
          Actualizar
        </button>
      </div>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {!students ? (
        <p className="text-sm text-subtle">Cargando…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-subtle">Nadie se ha inscrito todavía. Comparte el enlace del curso.</p>
      ) : (
        <ul className="grid gap-3">
          {students.map((s) => (
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
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-40"
                  disabled={busyId === s.id}
                  onClick={() => resetPassword(s)}
                >
                  Restablecer contraseña
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center rounded-lg px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-40 dark:text-rose-400"
                  disabled={busyId === s.id}
                  onClick={() => unenroll(s)}
                >
                  Dar de baja
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
