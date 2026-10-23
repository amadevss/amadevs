"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { AttendanceRow, AttendanceStatus } from "@/lib/cursos/queries";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE } from "@/lib/cursos/shared";
import { useFeedback } from "@/components/ui/feedback";
import { ButtonLink, EmptyState } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

const STATUS_ORDER: AttendanceStatus[] = ["presente", "retardo", "falta", "justificada"];

/** Pase de lista: un toque por alumno (tocar el estado activo lo quita). Se guarda solo. */
export default function AttendancePanel({
  sessionId,
  initialRows,
  courseHref,
}: {
  sessionId: string;
  initialRows: AttendanceRow[];
  courseHref: string;
}) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [rows, setRows] = useState(initialRows);
  const [pending, setPending] = useState(0);
  const [savedOnce, setSavedOnce] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [, startRefresh] = useTransition();

  const counts = useMemo(() => {
    const c: Record<string, number> = { sin: 0 };
    for (const r of rows) c[r.status ?? "sin"] = (c[r.status ?? "sin"] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  async function mark(studentId: string, status: AttendanceStatus | null) {
    const before = rows;
    setRows((prev) => prev.map((r) => (r.student_id === studentId ? { ...r, status } : r)));
    setPending((n) => n + 1);
    try {
      const r = await fetch(`/api/dashboard/cursos/sesiones/${sessionId}/asistencia`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId, status }),
      });
      if (!r.ok) throw new Error();
      setSavedOnce(true);
      // Actualiza el contador de la pestaña sin tocar la lista.
      startRefresh(() => router.refresh());
    } catch {
      setRows(before);
      toast.error("No se pudo guardar la asistencia. Revisa tu conexión.");
    } finally {
      setPending((n) => n - 1);
    }
  }

  async function allPresent() {
    setBulkBusy(true);
    try {
      const r = await fetch(`/api/dashboard/cursos/sesiones/${sessionId}/asistencia`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo guardar la asistencia");
      setRows(j.rows as AttendanceRow[]);
      toast.success(`${counts.sin} marcados como presentes`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBulkBusy(false);
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="Aún no hay alumnos inscritos"
        action={
          <ButtonLink href={courseHref} variant="ghost" icon="link">
            Ver enlace de inscripción
          </ButtonLink>
        }
      >
        Comparte el enlace del curso; cuando se inscriban podrás pasar lista aquí.
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="surface-card grid gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((st) => (
              <span key={st} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${ATTENDANCE_TONE[st]}`}>
                {counts[st] ?? 0} {ATTENDANCE_LABEL[st].toLowerCase()}
              </span>
            ))}
            {counts.sin ? (
              <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-subtle">
                {counts.sin} sin registro
              </span>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-subtle" aria-live="polite">
            {pending > 0 ? (
              <>
                <Icon name="refresh" className="h-3.5 w-3.5 animate-spin" /> Guardando…
              </>
            ) : savedOnce ? (
              <>
                <Icon name="check" className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Guardado
              </>
            ) : (
              "Se guarda al tocar"
            )}
          </span>
        </div>
        {counts.sin ? (
          <button type="button" className="btn btn-ghost min-h-11 w-full sm:w-auto sm:justify-self-start" onClick={allPresent} disabled={bulkBusy}>
            <Icon name="check" className="h-4 w-4" />
            {bulkBusy ? "Guardando…" : `Marcar ${counts.sin} sin registro como presentes`}
          </button>
        ) : null}
      </div>

      {rows.length > 8 ? (
        <label className="relative block">
          <span className="sr-only">Buscar alumno</span>
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            className="agenda-input min-h-11 pl-9"
            placeholder="Buscar alumno"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      ) : null}

      <ul className="surface-card divide-y divide-border overflow-hidden">
        {visible.map((r) => (
          <li key={r.student_id} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  r.status === "presente"
                    ? "bg-emerald-500"
                    : r.status === "retardo"
                      ? "bg-amber-500"
                      : r.status === "falta"
                        ? "bg-rose-500"
                        : r.status === "justificada"
                          ? "bg-sky-500"
                          : "bg-border-strong"
                }`}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{r.full_name}</span>
                <span className="block truncate text-xs text-subtle">{r.email}</span>
              </span>
            </span>
            <div className="grid grid-cols-4 gap-1" role="group" aria-label={`Asistencia de ${r.full_name}`}>
              {STATUS_ORDER.map((st) => (
                <button
                  key={st}
                  type="button"
                  aria-pressed={r.status === st}
                  onClick={() => mark(r.student_id, r.status === st ? null : st)}
                  className={`min-h-10 rounded-lg border px-2 text-xs font-semibold transition active:scale-95 ${
                    r.status === st ? ATTENDANCE_TONE[st] : "border-border text-subtle hover:bg-surface-2"
                  }`}
                >
                  {ATTENDANCE_LABEL[st]}
                </button>
              ))}
            </div>
          </li>
        ))}
        {visible.length === 0 ? <li className="px-4 py-6 text-center text-sm text-subtle">Nadie coincide con la búsqueda.</li> : null}
      </ul>
    </div>
  );
}
