"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadCourseFile } from "@/lib/cursos/upload";
import { formatBytes, formatDateTime, MAX_SUBMISSION_BYTES, MAX_SUBMISSION_FILES } from "@/lib/cursos/shared";
import type { CourseSubmission } from "@/lib/cursos/queries";
import FileList from "./FileList";

/**
 * Entregable del alumno: muestra su entrega (archivos, calificación y
 * comentario del profesor) y le deja enviarla o reemplazarla.
 */
export default function SubmissionPanel({
  sessionId,
  studentId,
  submission,
  blockedReason,
}: {
  sessionId: string;
  studentId: string;
  submission: CourseSubmission | null;
  blockedReason: string | null;
}) {
  const [editing, setEditing] = useState(false);

  if (submission && !editing) {
    return (
      <div className="grid gap-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">Entregado ✓</p>
          <p className="text-xs text-muted">Última actualización: {formatDateTime(submission.updated_at)}</p>
        </div>
        {submission.comment ? <p className="whitespace-pre-line text-sm text-muted">{submission.comment}</p> : null}
        <FileList files={submission.files} />
        {submission.grade || submission.feedback ? (
          <div className="rounded-xl border border-primary/30 bg-primary-soft px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-ink">Revisión del profesor</p>
            {submission.grade ? <p className="mt-1 font-display text-2xl font-bold">{submission.grade}</p> : null}
            {submission.feedback ? <p className="mt-1 whitespace-pre-line text-sm">{submission.feedback}</p> : null}
          </div>
        ) : null}
        {blockedReason ? (
          <p className="text-xs text-subtle">{blockedReason}.</p>
        ) : (
          <button type="button" className="btn btn-ghost min-h-11 w-full sm:w-auto" onClick={() => setEditing(true)}>
            Reemplazar entrega
          </button>
        )}
      </div>
    );
  }

  if (blockedReason) return <p className="text-sm text-subtle">{blockedReason}.</p>;

  return (
    <SubmissionForm
      sessionId={sessionId}
      studentId={studentId}
      previous={submission}
      onCancel={submission ? () => setEditing(false) : undefined}
    />
  );
}

function SubmissionForm({
  sessionId,
  studentId,
  previous,
  onCancel,
}: {
  sessionId: string;
  studentId: string;
  previous: CourseSubmission | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [comment, setComment] = useState(previous?.comment ?? "");
  const [kept, setKept] = useState(previous?.files ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const room = MAX_SUBMISSION_FILES - kept.length;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list);
    const tooBig = picked.find((f) => f.size > MAX_SUBMISSION_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" pesa más de ${formatBytes(MAX_SUBMISSION_BYTES)}`);
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...picked].slice(0, room));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const uploaded = kept.map((f) => ({ pathname: f.pathname, filename: f.filename }));
      for (let i = 0; i < files.length; i++) {
        uploaded.push(
          await uploadCourseFile(
            files[i],
            "entrega",
            sessionId,
            (pct) => setProgress((p) => ({ ...p, [i]: pct })),
            studentId,
          ),
        );
      }
      const r = await fetch("/api/cursos/entregas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, comment, files: uploaded }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo enviar la entrega");
      router.refresh();
      onCancel?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  const valid = kept.length + files.length > 0 || comment.trim().length > 0;

  return (
    <form onSubmit={submit} className="grid gap-4">
      {kept.length > 0 ? (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Archivos que ya subiste</span>
          <div className="mt-1">
            <FileList
              files={kept}
              compact
              onDelete={sending ? undefined : (id) => setKept((prev) => prev.filter((f) => f.id !== id))}
            />
          </div>
        </div>
      ) : null}

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
          Archivos (fotos, video, PDF, etc.)
        </span>
        <label
          className={`mt-1 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border-strong bg-surface-2 px-4 py-6 text-center text-sm text-muted transition hover:border-primary ${
            room <= 0 || sending ? "pointer-events-none opacity-50" : ""
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          <span className="font-medium text-fg">Toca para tomar foto o elegir archivos</span>
          <span className="text-xs">
            Hasta {MAX_SUBMISSION_FILES} archivos, {formatBytes(MAX_SUBMISSION_BYTES)} c/u
          </span>
          <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
        </label>
        {files.length > 0 ? (
          <ul className="mt-2 grid gap-1.5 text-sm">
            {files.map((f, i) => (
              <li key={i} className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-1.5">
                <span className="min-w-0 truncate">{f.name}</span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-subtle">
                  {sending ? `${Math.round(progress[i] ?? 0)}%` : formatBytes(f.size)}
                  {!sending ? (
                    <button
                      type="button"
                      className="p-1 text-rose-600 hover:underline dark:text-rose-400"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    >
                      Quitar
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Comentario (opcional)</span>
        <textarea
          className="agenda-textarea mt-1"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={sending}
        />
      </label>

      {error ? (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" className="btn btn-primary min-h-11 w-full sm:w-auto" disabled={!valid || sending}>
          {sending ? "Enviando…" : previous ? "Guardar cambios" : "Enviar entrega"}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-ghost min-h-11 w-full sm:w-auto" onClick={onCancel} disabled={sending}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
