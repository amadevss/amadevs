"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { CourseSubmission } from "@/lib/cursos/queries";
import { formatDateTime } from "@/lib/cursos/shared";
import { useFeedback } from "@/components/ui/feedback";
import { Badge, EmptyState, FIELD_LABEL } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import FileList from "@/components/cursos/FileList";

type Filter = "pendientes" | "calificadas" | "todas";
const FILTER_LABEL: Record<Filter, string> = { pendientes: "Por calificar", calificadas: "Calificadas", todas: "Todas" };

export default function SubmissionsPanel({
  submissions,
  missing,
  dueAt,
}: {
  submissions: CourseSubmission[];
  missing: { id: string; full_name: string }[];
  dueAt: string | null;
}) {
  const ungraded = submissions.filter((s) => !s.grade).length;
  const [filter, setFilter] = useState<Filter>(ungraded > 0 ? "pendientes" : "todas");
  const [showMissing, setShowMissing] = useState(false);

  const counts: Record<Filter, number> = {
    pendientes: ungraded,
    calificadas: submissions.length - ungraded,
    todas: submissions.length,
  };
  const list = useMemo(
    () =>
      submissions.filter((s) => (filter === "todas" ? true : filter === "pendientes" ? !s.grade : !!s.grade)),
    [submissions, filter],
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition ${
                filter === f ? "border-primary/40 bg-primary-soft text-primary-ink" : "border-border text-muted hover:bg-surface-2"
              }`}
            >
              {FILTER_LABEL[f]}
              <span className="text-xs opacity-80">{counts[f]}</span>
            </button>
          ))}
        </div>
        {missing.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowMissing((v) => !v)}
            aria-expanded={showMissing}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-amber-700 transition hover:bg-amber-500/10 dark:text-amber-400"
          >
            <Icon name="clock" className="h-4 w-4" />
            {missing.length} sin entregar
          </button>
        ) : null}
      </div>

      {showMissing ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Inscritos que no han entregado
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <li key={m.id} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs">
                {m.full_name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <EmptyState icon="inbox" title="Nadie ha entregado todavía">
          Las entregas aparecerán aquí en cuanto los alumnos las envíen.
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState icon="check" title={filter === "pendientes" ? "Todo calificado" : "Sin entregas en este filtro"}>
          {filter === "pendientes" ? "No queda ninguna entrega por calificar." : "Cambia el filtro para ver las demás."}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {list.map((s) => (
            <SubmissionItem key={s.id} sub={s} dueAt={dueAt} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SubmissionItem({ sub, dueAt }: { sub: CourseSubmission; dueAt: string | null }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [grade, setGrade] = useState(sub.grade ?? "");
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [, startRefresh] = useTransition();
  const dirty = grade !== (sub.grade ?? "") || feedback !== (sub.feedback ?? "");
  const late = dueAt ? new Date(sub.updated_at).getTime() > new Date(dueAt).getTime() : false;

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`/api/dashboard/cursos/entregas/${sub.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grade, feedback }),
      });
      if (!r.ok) throw new Error();
      toast.success(grade.trim() ? `Calificación guardada para ${sub.student_name}` : "Comentario guardado");
      startRefresh(() => router.refresh());
    } catch {
      toast.error("No se pudo guardar la calificación");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: `¿Eliminar la entrega de ${sub.student_name}?`,
      message: "Se borran sus archivos. El alumno podrá volver a entregar. No se puede deshacer.",
      confirmLabel: "Eliminar entrega",
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    const r = await fetch(`/api/dashboard/cursos/entregas/${sub.id}`, { method: "DELETE" });
    if (!r.ok) {
      setDeleting(false);
      return toast.error("No se pudo eliminar la entrega");
    }
    toast.success("Entrega eliminada");
    startRefresh(() => router.refresh());
  }

  return (
    <li className={`surface-card grid gap-4 p-4 sm:p-5 ${deleting ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{sub.student_name}</p>
          {sub.student_email ? <p className="break-all text-xs text-subtle">{sub.student_email}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {late ? <Badge tone="bad">Tarde</Badge> : null}
          {sub.grade ? <Badge tone="ok">Calificada: {sub.grade}</Badge> : <Badge tone="warn">Por calificar</Badge>}
        </div>
      </div>
      <p className="-mt-2 flex items-center gap-1 text-xs text-subtle">
        <Icon name="clock" className="h-3.5 w-3.5" />
        Entregada {formatDateTime(sub.updated_at)}
      </p>

      {sub.comment ? (
        <p className="whitespace-pre-line rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-muted">{sub.comment}</p>
      ) : null}
      <FileList files={sub.files} />

      <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <label className="block">
          <span className={FIELD_LABEL}>Calificación</span>
          <input
            className="agenda-input mt-1 min-h-11"
            value={grade}
            placeholder="10, A, Aprobado…"
            onChange={(e) => setGrade(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Comentario para el alumno</span>
          <textarea
            className="agenda-textarea mt-1 min-h-11"
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </label>
        <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
          >
            <Icon name="trash" className="h-4 w-4" /> Eliminar entrega
          </button>
          <button type="button" className="btn btn-primary min-h-11" onClick={save} disabled={saving || !dirty}>
            {saving ? "Guardando…" : dirty ? "Guardar calificación" : "Guardado"}
          </button>
        </div>
      </div>
    </li>
  );
}
