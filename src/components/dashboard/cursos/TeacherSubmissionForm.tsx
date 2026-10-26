"use client";

import { useRef, useState, type FormEvent } from "react";
import type { CourseSubmission } from "@/lib/cursos/queries";
import {
  formatBytes,
  formatDateTime,
  MAX_SUBMISSION_BYTES,
  MAX_SUBMISSION_FILES,
  toLocalInput,
} from "@/lib/cursos/shared";
import { uploadCourseFile } from "@/lib/cursos/upload";
import { useFeedback } from "@/components/ui/feedback";
import { ErrorNote, FIELD_LABEL } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

type Item = { key: string; filename: string; size: number; pathname?: string; pct: number; error?: string };

/**
 * El profesor registra (o edita) la entrega de un alumno: elige al alumno,
 * sube archivos, escribe el comentario y la fecha en que se entregó y, si es
 * nueva, puede dejarla calificada.
 */
export default function TeacherSubmissionForm({
  sessionId,
  students,
  submission,
  dueAt,
  onDone,
  onCancel,
}: {
  sessionId: string;
  /** Alumnos que se pueden elegir (solo al crear). */
  students: { id: string; full_name: string }[];
  /** Si viene, se edita esa entrega en lugar de crear una. */
  submission?: CourseSubmission;
  dueAt: string | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { toast } = useFeedback();
  const editing = !!submission;
  const [studentId, setStudentId] = useState(submission?.student_id ?? (students.length === 1 ? students[0].id : ""));
  const [comment, setComment] = useState(submission?.comment ?? "");
  const [submittedAt, setSubmittedAt] = useState(toLocalInput(submission?.updated_at ?? new Date().toISOString()));
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [items, setItems] = useState<Item[]>(
    (submission?.files ?? []).map((f) => ({
      key: f.id,
      filename: f.filename,
      size: f.size,
      pathname: f.pathname,
      pct: 100,
    })),
  );
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploading = items.some((i) => !i.error && !i.pathname);
  const ready = items.filter((i) => i.pathname);
  const late = dueAt && submittedAt ? new Date(submittedAt).getTime() > new Date(dueAt).getTime() : false;
  const valid = !!studentId && !!submittedAt && (ready.length > 0 || comment.trim().length > 0) && !uploading;

  const patch = (key: string, p: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...p } : i)));

  async function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0 || !studentId) return;
    const room = MAX_SUBMISSION_FILES - ready.length - items.filter((i) => !i.error && !i.pathname).length;
    if (files.length > room) toast.error(`Máximo ${MAX_SUBMISSION_FILES} archivos por entrega`);

    const batch = files.slice(0, Math.max(room, 0)).map((f, i) => ({ file: f, key: `${Date.now()}-${i}-${f.name}` }));
    setItems((prev) => [
      ...prev.filter((i) => !i.error),
      ...batch.map(({ file, key }) => ({
        key,
        filename: file.name,
        size: file.size,
        pct: 0,
        error: file.size > MAX_SUBMISSION_BYTES ? `Pesa más de ${formatBytes(MAX_SUBMISSION_BYTES)}` : undefined,
      })),
    ]);

    for (const { file, key } of batch) {
      if (file.size > MAX_SUBMISSION_BYTES) continue;
      try {
        const up = await uploadCourseFile(
          file,
          "entrega-profesor",
          sessionId,
          (pct) => patch(key, { pct: Math.min(pct, 99) }),
          studentId,
        );
        patch(key, { pathname: up.pathname, pct: 100 });
      } catch (err) {
        patch(key, { error: (err as Error).message || "Falló la subida" });
      }
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        studentId,
        comment,
        submittedAt: new Date(submittedAt).toISOString(),
        files: ready.map((i) => ({ pathname: i.pathname, filename: i.filename })),
      };
      if (!editing) {
        body.grade = grade;
        body.feedback = feedback;
      }
      const r = await fetch(`/api/dashboard/cursos/sesiones/${sessionId}/entregas`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo guardar la entrega");
      const name = submission?.student_name ?? students.find((s) => s.id === studentId)?.full_name ?? "el alumno";
      toast.success(editing ? "Entrega actualizada" : `Entrega registrada para ${name}`);
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card grid grid-cols-1 gap-4 border-primary/40 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{editing ? `Editar entrega de ${submission.student_name}` : "Agregar entrega"}</p>
          <p className="text-xs text-subtle">
            {editing
              ? "Agrega o quita archivos y ajusta el comentario o la fecha."
              : "Registra el trabajo a nombre de un alumno, como si lo hubiera entregado."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-subtle transition hover:bg-surface-2 hover:text-fg"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {editing ? null : (
          <label className="block">
            <span className={FIELD_LABEL}>Alumno</span>
            <select
              className="agenda-input mt-1 min-h-11"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={items.length > 0}
              required
            >
              <option value="">Elige un alumno…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
            {items.length > 0 ? (
              <span className="mt-1 block text-xs text-subtle">Quita los archivos para cambiar de alumno.</span>
            ) : null}
          </label>
        )}
        <label className="block">
          <span className={FIELD_LABEL}>Fecha de entrega</span>
          <input
            type="datetime-local"
            className="agenda-input mt-1 min-h-11"
            value={submittedAt}
            max={toLocalInput(new Date().toISOString())}
            onChange={(e) => setSubmittedAt(e.target.value)}
            required
          />
          {dueAt ? (
            <span className={`mt-1 block text-xs ${late ? "text-rose-600 dark:text-rose-400" : "text-subtle"}`}>
              {late ? "Quedará marcada como tarde. " : ""}Límite: {formatDateTime(dueAt)}
            </span>
          ) : null}
        </label>
      </div>

      <label className="block">
        <span className={FIELD_LABEL}>Comentario del alumno (opcional)</span>
        <textarea
          className="agenda-textarea mt-1"
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Lo que el alumno escribió con su entrega…"
        />
      </label>

      <div className="grid grid-cols-1 gap-2">
        <span className={FIELD_LABEL}>Archivos</span>
        <label
          className={`flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition ${
            dragging ? "border-primary bg-primary-soft" : "border-border-strong bg-surface hover:border-primary/60"
          } ${studentId ? "cursor-pointer" : "pointer-events-none opacity-50"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <Icon name="upload" className="h-5 w-5 text-primary-ink" />
          <span className="text-sm font-medium">
            {studentId ? (
              <>
                <span className="hidden sm:inline">Arrastra archivos aquí o </span>
                <span className="text-primary-ink">elige archivos</span>
              </>
            ) : (
              "Primero elige al alumno"
            )}
          </span>
          <span className="text-xs text-subtle">
            Hasta {MAX_SUBMISSION_FILES} archivos de {formatBytes(MAX_SUBMISSION_BYTES)} c/u
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            disabled={!studentId}
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>

        {items.length > 0 ? (
          <ul className="grid grid-cols-1 gap-2" aria-live="polite">
            {items.map((i) => (
              <li key={i.key} className="grid grid-cols-1 gap-1.5 rounded-xl border border-border px-3 py-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon name={i.pathname ? "file" : "upload"} className="h-4 w-4 shrink-0 text-subtle" />
                    <span className="truncate">{i.filename}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={`text-xs ${i.error ? "text-rose-600 dark:text-rose-400" : "text-subtle"}`}>
                      {i.error ?? (i.pathname ? formatBytes(i.size) : `${Math.round(i.pct)}%`)}
                    </span>
                    {i.pathname || i.error ? (
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((x) => x.key !== i.key))}
                        aria-label={`Quitar ${i.filename}`}
                        className="grid h-8 w-8 place-items-center rounded-full text-subtle transition hover:bg-rose-500/10 hover:text-rose-600"
                      >
                        <Icon name="x" className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </span>
                </div>
                {!i.error && !i.pathname ? (
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full transition-[width]" style={{ width: `${i.pct}%`, background: "var(--grad)" }} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {editing ? null : (
        <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <label className="block">
            <span className={FIELD_LABEL}>Calificación (opcional)</span>
            <input
              className="agenda-input mt-1 min-h-11"
              value={grade}
              placeholder="10, A, Aprobado…"
              onChange={(e) => setGrade(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={FIELD_LABEL}>Comentario para el alumno (opcional)</span>
            <textarea
              className="agenda-textarea mt-1 min-h-11"
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </label>
        </div>
      )}

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-ghost min-h-11" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary min-h-11" disabled={!valid || saving}>
          {saving ? "Guardando…" : uploading ? "Subiendo archivos…" : editing ? "Guardar cambios" : "Registrar entrega"}
        </button>
      </div>
    </form>
  );
}
