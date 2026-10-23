"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useFeedback } from "@/components/ui/feedback";
import { ErrorNote } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
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
  sessionHref,
  courseHref,
}: {
  sessionId: string;
  studentId: string;
  submission: CourseSubmission | null;
  blockedReason: string | null;
  sessionHref: string;
  courseHref: string;
}) {
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="grid justify-items-center gap-3 py-6 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
          <Icon name="check" className="h-8 w-8" />
        </span>
        <p className="font-display text-xl font-bold">¡Entrega enviada!</p>
        <p className="max-w-sm text-sm text-muted">
          Tu profesor ya puede verla. Te avisaremos aquí mismo cuando la califique.
        </p>
        <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href={sessionHref} className="btn btn-primary min-h-11">
            Volver a la sesión
          </Link>
          <Link href={courseHref} className="btn btn-ghost min-h-11">
            Ir al curso
          </Link>
        </div>
        <button type="button" onClick={() => setSent(false)} className="mt-1 min-h-10 text-sm text-subtle hover:text-fg">
          Ver lo que envié
        </button>
      </div>
    );
  }

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
      onSent={() => {
        setEditing(false);
        setSent(true);
      }}
    />
  );
}

function SubmissionForm({
  sessionId,
  studentId,
  previous,
  onCancel,
  onSent,
}: {
  sessionId: string;
  studentId: string;
  previous: CourseSubmission | null;
  onCancel?: () => void;
  onSent: () => void;
}) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [comment, setComment] = useState(previous?.comment ?? "");
  const [kept, setKept] = useState(previous?.files ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
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
      toast.success(previous ? "Entrega actualizada" : "Entrega enviada");
      router.refresh();
      onSent();
    } catch (err) {
      setError((err as Error).message);
      toast.error("No se pudo enviar. Revisa tu conexión e intenta de nuevo.");
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
          className={`mt-1 flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center text-sm text-muted transition ${
            dragging ? "border-primary bg-primary-soft" : "border-border-strong bg-surface-2 hover:border-primary/60"
          } ${room <= 0 || sending ? "pointer-events-none opacity-50" : ""}`}
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
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary-ink">
            <Icon name="upload" className="h-6 w-6" />
          </span>
          <span className="font-medium text-fg">
            {room <= 0 ? "Llegaste al máximo de archivos" : "Toca para tomar foto o elegir archivos"}
          </span>
          <span className="text-xs">
            Hasta {MAX_SUBMISSION_FILES} archivos, {formatBytes(MAX_SUBMISSION_BYTES)} c/u
          </span>
          <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
        </label>
        {files.length > 0 ? (
          <ul className="mt-3 grid gap-2 text-sm" aria-live="polite">
            {files.map((f, i) => {
              const pct = Math.round(progress[i] ?? 0);
              return (
                <li key={i} className="grid gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5">
                  <div className="flex min-h-8 items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon name="file" className="h-4 w-4 shrink-0 text-subtle" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-subtle">
                      {sending ? (pct >= 100 ? <Icon name="check" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : `${pct}%`) : formatBytes(f.size)}
                      {!sending ? (
                        <button
                          type="button"
                          aria-label={`Quitar ${f.name}`}
                          className="grid h-8 w-8 place-items-center rounded-full text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
                          onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        >
                          <Icon name="x" className="h-4 w-4" />
                        </button>
                      ) : null}
                    </span>
                  </div>
                  {sending ? (
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: "var(--grad)" }} />
                    </div>
                  ) : null}
                </li>
              );
            })}
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

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" className="btn btn-primary min-h-11 w-full sm:w-auto" disabled={!valid || sending}>
          {sending ? "Subiendo y enviando…" : previous ? "Guardar cambios" : "Enviar entrega"}
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
