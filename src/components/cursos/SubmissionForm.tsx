"use client";

import { useRef, useState, type FormEvent } from "react";
import { uploadCourseFile } from "@/lib/cursos/upload";
import { formatBytes, MAX_SUBMISSION_BYTES, MAX_SUBMISSION_FILES } from "@/lib/cursos/shared";

/** Entrega sin login: nombre completo + archivos (imágenes, video, PDF…) + comentario. */
export default function SubmissionForm({ sessionId }: { sessionId: string }) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list);
    const tooBig = picked.find((f) => f.size > MAX_SUBMISSION_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" pesa más de ${formatBytes(MAX_SUBMISSION_BYTES)}`);
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_SUBMISSION_FILES));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        uploaded.push(
          await uploadCourseFile(files[i], "entrega", sessionId, (pct) =>
            setProgress((p) => ({ ...p, [i]: pct })),
          ),
        );
      }
      const r = await fetch("/api/cursos/entregas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, studentName: name, comment, files: uploaded }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo enviar la entrega");
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm">
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">¡Entrega recibida! ✅</p>
        <p className="mt-1 text-muted">
          Gracias, {name.split(" ")[0]}. Si necesitas corregir algo puedes enviar otra entrega.
        </p>
        <button
          type="button"
          className="btn btn-ghost mt-4"
          onClick={() => {
            setFiles([]);
            setComment("");
            setProgress({});
            setStatus("idle");
          }}
        >
          Enviar otra entrega
        </button>
      </div>
    );
  }

  const sending = status === "sending";
  const valid = name.trim().length >= 3 && (files.length > 0 || comment.trim().length > 0);

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Nombre completo *</span>
        <input
          className="agenda-input mt-1"
          placeholder="Nombre(s) y apellidos"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={sending}
        />
      </label>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
          Archivos (imágenes, video, PDF, etc.)
        </span>
        <label
          className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border-strong bg-surface-2 px-4 py-6 text-center text-sm text-muted transition hover:border-primary"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          <span className="font-medium text-fg">Toca para elegir o arrastra aquí</span>
          <span className="text-xs">
            Hasta {MAX_SUBMISSION_FILES} archivos, {formatBytes(MAX_SUBMISSION_BYTES)} c/u
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
            disabled={sending}
          />
        </label>
        {files.length > 0 ? (
          <ul className="mt-2 grid gap-1.5 text-sm">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-1.5">
                <span className="min-w-0 truncate">{f.name}</span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-subtle">
                  {sending ? `${Math.round(progress[i] ?? 0)}%` : formatBytes(f.size)}
                  {!sending ? (
                    <button
                      type="button"
                      className="text-rose-600 hover:underline dark:text-rose-400"
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

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={!valid || sending}>
        {sending ? "Enviando…" : "Enviar entrega"}
      </button>
    </form>
  );
}
