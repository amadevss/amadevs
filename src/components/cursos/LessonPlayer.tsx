"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/cursos/shared";
import { useFeedback } from "@/components/ui/feedback";
import Icon from "@/components/ui/icons";

const SAVE_EVERY_S = 15;
/** Se marca vista al llegar a este porcentaje (los créditos finales no cuentan). */
const DONE_AT = 0.9;

function send(sessionId: string, position: number | null, completed?: boolean, beacon = false) {
  const body = JSON.stringify({ sessionId, position: position === null ? null : Math.floor(position), completed });
  if (beacon && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon("/api/cursos/progreso", new Blob([body], { type: "application/json" }));
    return Promise.resolve(true);
  }
  return fetch("/api/cursos/progreso", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).then((r) => r.ok, () => false);
}

/**
 * Video de una clase. Si `sessionId` viene (alumno inscrito), retoma donde
 * se quedó, guarda el avance cada pocos segundos y marca la clase como vista
 * al acercarse al final.
 */
export function LessonVideo({
  src,
  sessionId,
  startAt = 0,
  completed = false,
}: {
  src: string;
  sessionId?: string;
  startAt?: number;
  completed?: boolean;
}) {
  const router = useRouter();
  const { toast } = useFeedback();
  const ref = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(startAt);
  const done = useRef(completed);
  const [resumed, setResumed] = useState<number | null>(null);
  // Cada render del servidor firma una URL nueva; se conserva la primera para
  // que el video no se recargue al marcar la clase como vista.
  const [videoSrc] = useState(src);

  useEffect(() => {
    done.current = completed;
  }, [completed]);

  // Al salir de la página, guarda la posición sin esperar respuesta.
  useEffect(() => {
    if (!sessionId) return;
    const flush = () => {
      const v = ref.current;
      if (v && Math.abs(v.currentTime - lastSaved.current) >= 2) send(sessionId, v.currentTime, undefined, true);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
    };
  }, [sessionId]);

  function onLoaded() {
    const v = ref.current;
    if (!v || !sessionId) return;
    if (startAt > 5 && startAt < v.duration - 10) {
      v.currentTime = startAt;
      setResumed(startAt);
    }
  }

  async function markDone(position: number) {
    if (!sessionId || done.current) return;
    done.current = true;
    if (await send(sessionId, position, true)) {
      toast.success("Clase completada");
      router.refresh();
    } else done.current = false;
  }

  function onTime() {
    const v = ref.current;
    if (!v || !sessionId) return;
    if (v.duration > 0 && v.currentTime / v.duration >= DONE_AT) void markDone(v.currentTime);
    if (Math.abs(v.currentTime - lastSaved.current) >= SAVE_EVERY_S) {
      lastSaved.current = v.currentTime;
      void send(sessionId, v.currentTime);
    }
  }

  function onPause() {
    const v = ref.current;
    if (!v || !sessionId || v.ended) return;
    lastSaved.current = v.currentTime;
    void send(sessionId, v.currentTime);
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      <video
        ref={ref}
        src={videoSrc}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={onLoaded}
        onTimeUpdate={onTime}
        onPause={onPause}
        onEnded={() => markDone(ref.current?.duration ?? 0)}
        className="aspect-video w-full rounded-2xl bg-black"
      />
      {resumed !== null ? (
        <p className="flex items-center gap-1.5 text-xs text-subtle">
          <Icon name="clock" className="h-3.5 w-3.5" />
          Retomamos en {formatDuration(resumed)}.
          <button
            type="button"
            className="font-medium text-primary-ink hover:underline"
            onClick={() => {
              if (ref.current) ref.current.currentTime = 0;
              setResumed(null);
            }}
          >
            Ver desde el inicio
          </button>
        </p>
      ) : null}
    </div>
  );
}

/** Botón para marcar o desmarcar la clase como vista a mano. */
export function LessonCompleteButton({ sessionId, completed }: { sessionId: string; completed: boolean }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className={`btn min-h-11 w-full sm:w-auto ${completed ? "btn-ghost" : "btn-primary"}`}
      onClick={async () => {
        setBusy(true);
        const ok = await send(sessionId, null, !completed);
        setBusy(false);
        if (!ok) return toast.error("No se pudo guardar. Intenta de nuevo.");
        toast.success(completed ? "Clase marcada como pendiente" : "Clase completada");
        router.refresh();
      }}
    >
      <Icon name={completed ? "refresh" : "check"} className="h-4 w-4" />
      {busy ? "Guardando…" : completed ? "Marcar como pendiente" : "Marcar como vista"}
    </button>
  );
}
