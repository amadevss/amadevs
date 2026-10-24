"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { CourseStudentRow } from "@/lib/cursos/queries";
import type { StudentAccountRow } from "@/lib/cursos/students";
import { formatDateTime } from "@/lib/cursos/shared";
import { useFeedback } from "@/components/ui/feedback";
import { Badge, EmptyState, ProgressBar } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

function suggestPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const actionBtn =
  "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-40";
const dangerBtn =
  "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-40 dark:text-rose-400";

type Student = { id: string; full_name: string; email: string };

/** Acciones por alumno: contraseña, baja del curso (opcional) y eliminar cuenta. */
function StudentActions({ student, courseId }: { student: Student; courseId?: string }) {
  const router = useRouter();
  const { toast, confirm, prompt } = useFeedback();
  const [busy, setBusy] = useState(false);
  const [, startRefresh] = useTransition();

  async function resetPassword() {
    const password = await prompt({
      title: `Nueva contraseña para ${student.full_name}`,
      message: "Te sugerimos una al azar; puedes cambiarla. Después compártesela al alumno.",
      label: "Contraseña (mínimo 8 caracteres)",
      defaultValue: suggestPassword(),
      confirmLabel: "Guardar contraseña",
      validate: (v) => (v.length < 8 ? "Debe tener al menos 8 caracteres" : null),
    });
    if (!password) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/dashboard/alumnos/${student.id}/password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo restablecer");
      const copy = await confirm({
        title: "Contraseña actualizada",
        message: (
          <>
            Compártela con {student.full_name}:
            <span className="mt-2 block select-all rounded-xl bg-surface-2 px-3 py-2.5 font-mono text-base text-fg">
              {password}
            </span>
          </>
        ),
        confirmLabel: "Copiar",
        cancelLabel: "Cerrar",
      });
      if (copy) {
        await navigator.clipboard.writeText(password).then(
          () => toast.success("Contraseña copiada"),
          () => toast.info("No se pudo copiar; cópiala a mano."),
        );
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unenroll() {
    const ok = await confirm({
      title: `¿Dar de baja a ${student.full_name}?`,
      message: "Deja de ver el curso. Su cuenta, asistencia y entregas se conservan por si vuelve a inscribirse.",
      confirmLabel: "Dar de baja",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const r = await fetch(`/api/dashboard/cursos/${courseId}/alumnos/${student.id}`, { method: "DELETE" });
    setBusy(false);
    if (!r.ok) return toast.error("No se pudo dar de baja");
    toast.success(`${student.full_name} dado de baja del curso`);
    startRefresh(() => router.refresh());
  }

  async function removeAccount() {
    const ok = await confirm({
      title: `¿Eliminar la cuenta de ${student.full_name}?`,
      message: (
        <>
          <span className="block break-all">{student.email}</span>
          <span className="mt-2 block">
            Se borran su cuenta, inscripciones, asistencia, entregas y archivos en <strong>todos</strong> los cursos. No
            se puede deshacer.
          </span>
        </>
      ),
      confirmLabel: "Eliminar cuenta",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const r = await fetch(`/api/dashboard/alumnos/${student.id}`, { method: "DELETE" });
    setBusy(false);
    if (!r.ok) return toast.error("No se pudo eliminar la cuenta");
    toast.success("Cuenta eliminada");
    startRefresh(() => router.refresh());
  }

  return (
    <div className="-ml-2.5 flex flex-wrap items-center sm:ml-0 sm:justify-end">
      <button type="button" className={actionBtn} disabled={busy} onClick={resetPassword}>
        <Icon name="lock" className="h-4 w-4" /> Contraseña
      </button>
      {courseId ? (
        <button type="button" className={actionBtn} disabled={busy} onClick={unenroll}>
          <Icon name="logout" className="h-4 w-4" /> Dar de baja
        </button>
      ) : null}
      <button type="button" className={dangerBtn} disabled={busy} onClick={removeAccount}>
        <Icon name="trash" className="h-4 w-4" /> Eliminar
      </button>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
      <input
        type="search"
        className="agenda-input min-h-11 pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

const matches = (s: Student, q: string) =>
  !q || s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);

function attendancePct(s: CourseStudentRow): number | null {
  const marked = s.presente + s.retardo + s.falta;
  return marked === 0 ? null : Math.round(((s.presente + s.retardo) / marked) * 100);
}

/** Alumnos inscritos en un curso. */
/** `lessons`: solo en cursos públicos; muestra clases vistas en lugar de asistencia. */
export function CourseStudentsPanel({
  courseId,
  students,
  lessons,
}: {
  courseId: string;
  students: CourseStudentRow[];
  lessons?: { total: number; completed: Record<string, number> };
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const list = useMemo(() => students.filter((s) => matches(s, q)), [students, q]);

  if (students.length === 0) {
    return (
      <EmptyState icon="users" title="Nadie se ha inscrito todavía">
        Copia el enlace de inscripción de arriba y compártelo con tus alumnos.
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {students.length > 5 ? <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nombre o correo" /> : null}
      <ul className="grid grid-cols-1 gap-3">
        {list.map((s) => {
          const seen = lessons ? (lessons.completed[s.id] ?? 0) : 0;
          const pct = lessons ? (lessons.total ? Math.round((seen / lessons.total) * 100) : null) : attendancePct(s);
          return (
            <li key={s.id} className="surface-card grid grid-cols-1 gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{s.full_name}</p>
                  <p className="break-all text-xs text-subtle">{s.email}</p>
                  <p className="mt-0.5 text-xs text-subtle">Inscrito {formatDateTime(s.enrolled_at)}</p>
                </div>
                <div className="w-24 shrink-0 text-right">
                  <p className="font-display text-xl font-bold">{pct === null ? "—" : `${pct}%`}</p>
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-subtle">{lessons ? "avance" : "asistencia"}</p>
                  {pct !== null ? <ProgressBar value={pct} label={lessons ? "Avance" : "Asistencia"} /> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lessons ? (
                  <Badge tone="ok">
                    {seen} de {lessons.total} clases vistas
                  </Badge>
                ) : (
                  <>
                    <Badge tone="ok">{s.presente} presente</Badge>
                    {s.retardo ? <Badge tone="warn">{s.retardo} retardo</Badge> : null}
                    {s.falta ? <Badge tone="bad">{s.falta} falta</Badge> : null}
                    {s.justificada ? <Badge tone="info">{s.justificada} justificada</Badge> : null}
                  </>
                )}
                {!lessons || s.submissions > 0 ? <Badge tone="primary">{s.submissions} entregas</Badge> : null}
              </div>
              <div className="border-t border-border pt-2">
                <StudentActions student={s} courseId={courseId} />
              </div>
            </li>
          );
        })}
        {list.length === 0 ? <li className="py-6 text-center text-sm text-subtle">Nadie coincide con la búsqueda.</li> : null}
      </ul>
    </div>
  );
}

/** Todas las cuentas de alumnos, inscritas o no. */
export function AllStudentsPanel({ students }: { students: StudentAccountRow[] }) {
  const [query, setQuery] = useState("");
  const [onlyOrphans, setOnlyOrphans] = useState(false);
  const q = query.trim().toLowerCase();
  const orphans = students.filter((s) => s.courses === 0).length;
  const list = useMemo(
    () => students.filter((s) => matches(s, q) && (!onlyOrphans || s.courses === 0)),
    [students, q, onlyOrphans],
  );

  if (students.length === 0) {
    return (
      <EmptyState icon="users" title="Aún no hay cuentas de alumnos">
        Las cuentas se crean cuando un alumno se registra con el enlace de un curso.
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nombre o correo" />
        {orphans > 0 ? (
          <button
            type="button"
            aria-pressed={onlyOrphans}
            onClick={() => setOnlyOrphans((v) => !v)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
              onlyOrphans ? "border-primary/40 bg-primary-soft text-primary-ink" : "border-border text-muted hover:bg-surface-2"
            }`}
          >
            Sin cursos <span className="text-xs opacity-80">{orphans}</span>
          </button>
        ) : null}
      </div>
      <ul className="surface-card divide-y divide-border overflow-hidden">
        {list.map((s) => (
          <li key={s.id} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid grid-cols-1 h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-ink">
                {s.full_name
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {s.full_name}
                  {s.courses === 0 ? <Badge tone="muted">Sin cursos</Badge> : null}
                </p>
                <p className="break-all text-xs text-subtle">{s.email}</p>
                <p className="text-xs text-subtle">
                  {s.courses} {s.courses === 1 ? "curso" : "cursos"} · {s.submissions} entregas · desde{" "}
                  {formatDateTime(s.created_at)}
                </p>
              </div>
            </div>
            <StudentActions student={s} />
          </li>
        ))}
        {list.length === 0 ? <li className="px-4 py-6 text-center text-sm text-subtle">Nadie coincide con la búsqueda.</li> : null}
      </ul>
      <p className="text-xs text-subtle">
        ¿Buscas la asistencia de un alumno? Ábrela desde la pestaña Alumnos de cada{" "}
        <Link href="/dashboard/cursos" className="text-primary-ink hover:underline">
          curso
        </Link>
        .
      </p>
    </div>
  );
}
