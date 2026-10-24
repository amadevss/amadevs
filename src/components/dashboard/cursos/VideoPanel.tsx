"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { formatBytes, formatDuration, MAX_VIDEO_BYTES } from "@/lib/cursos/shared";
import { useFeedback } from "@/components/ui/feedback";
import { ErrorNote } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

type Video = { filename: string; size: number; duration: number | null };

/** Lee la duración del video en el navegador antes de subirlo. */
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    const done = (d: number | null) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => done(null);
    v.src = url;
  });
}

/** PUT directo al almacenamiento con barra de progreso. */
function putFile(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 100);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Error ${xhr.status} al subir`)));
    xhr.onerror = () => reject(new Error("Se perdió la conexión con el almacenamiento"));
    xhr.send(file);
  });
}

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "No se pudo completar");
  return j;
}

export default function VideoPanel({
  sessionId,
  video,
  previewUrl,
  configured,
}: {
  sessionId: string;
  video: Video | null;
  previewUrl: string | null;
  configured: boolean;
}) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startRefresh] = useTransition();
  const busy = pct !== null;

  async function pick(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("video/")) return setError("El archivo debe ser un video (MP4 recomendado).");
    if (file.size > MAX_VIDEO_BYTES) return setError(`El video pesa más de ${formatBytes(MAX_VIDEO_BYTES)}.`);
    setPct(0);
    try {
      const duration = await readDuration(file);
      const { key, uploadUrl } = await post(`/api/dashboard/cursos/sesiones/${sessionId}/video/subida`, {
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });
      await putFile(uploadUrl, file, (p) => setPct(Math.min(p, 99)));
      await post(`/api/dashboard/cursos/sesiones/${sessionId}/video`, { key, filename: file.name, duration });
      toast.success(video ? "Video reemplazado" : "Video subido");
      startRefresh(() => router.refresh());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPct(null);
    }
  }

  async function remove() {
    const yes = await confirm({
      title: "¿Quitar el video?",
      message: "Se borra del almacenamiento y los alumnos dejan de verlo.",
      confirmLabel: "Quitar video",
      danger: true,
    });
    if (!yes) return;
    const r = await fetch(`/api/dashboard/cursos/sesiones/${sessionId}/video`, { method: "DELETE" });
    if (!r.ok) return toast.error("No se pudo quitar el video");
    toast.success("Video quitado");
    startRefresh(() => router.refresh());
  }

  if (!configured) {
    return (
      <div className="surface-card grid grid-cols-1 justify-items-center gap-2 p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Icon name="alert" className="h-6 w-6" />
        </span>
        <p className="font-semibold">Almacenamiento de video no configurado</p>
        <p className="max-w-md text-sm text-muted">
          Falta conectar el almacenamiento del VPS (MinIO). En cuanto se agreguen sus claves podrás subir videos aquí.
          Mientras tanto puedes preparar el contenido y los materiales de la clase.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {video ? (
        <section className="surface-card grid grid-cols-1 gap-4 p-4 sm:p-5">
          {previewUrl ? (
            <video src={previewUrl} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black" />
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{video.filename}</p>
              <p className="text-xs text-subtle">
                {formatBytes(Number(video.size))}
                {video.duration ? ` · ${formatDuration(video.duration)}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost min-h-10" disabled={busy} onClick={() => inputRef.current?.click()}>
                <Icon name="upload" className="h-4 w-4" />
                Reemplazar
              </button>
              <button type="button" className="btn btn-ghost min-h-10 text-rose-600 dark:text-rose-400" disabled={busy} onClick={remove}>
                <Icon name="trash" className="h-4 w-4" />
                Quitar
              </button>
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong bg-surface px-4 py-8 text-center transition hover:border-primary/60 disabled:opacity-60"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary-ink">
            <Icon name="video" className="h-6 w-6" />
          </span>
          <span className="font-medium text-primary-ink">Subir el video de la clase</span>
          <span className="text-xs text-subtle">MP4 recomendado · hasta {formatBytes(MAX_VIDEO_BYTES)}</span>
        </button>
      )}

      {busy ? (
        <div className="surface-card grid grid-cols-1 gap-2 px-4 py-3" aria-live="polite">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Subiendo video… no cierres esta página</span>
            <span className="text-subtle">{Math.round(pct ?? 0)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: "var(--grad)" }} />
          </div>
        </div>
      ) : null}

      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <input ref={inputRef} type="file" accept="video/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
