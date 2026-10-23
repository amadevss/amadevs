"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useFeedback } from "@/components/ui/feedback";
import { ErrorNote, FIELD_LABEL } from "@/components/ui/kit";

/** Inscribirse a un curso (alumno ya con sesión). */
export function EnrollButton({ courseSlug }: { courseSlug: string }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary min-h-12 w-full text-base"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await fetch("/api/cursos/inscribir", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ courseSlug }),
        });
        if (!r.ok) {
          setBusy(false);
          return toast.error("No se pudo completar la inscripción. Intenta de nuevo.");
        }
        toast.success("¡Listo! Ya estás inscrito.");
        router.refresh();
      }}
    >
      {busy ? "Inscribiendo…" : "Inscribirme a este curso"}
    </button>
  );
}

export function ChangePasswordForm() {
  const { toast } = useFeedback();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirmNext.length > 0 && confirmNext !== next;
  const valid = current.length > 0 && next.length >= 8 && next === confirmNext;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSending(true);
    setError(null);
    const r = await fetch("/api/cursos/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const j = await r.json().catch(() => ({}));
    setSending(false);
    if (!r.ok) {
      setError(j.error || "No se pudo cambiar la contraseña");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirmNext("");
    toast.success("Contraseña actualizada. Cerramos tus sesiones en otros dispositivos.");
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="block">
        <span className={FIELD_LABEL}>Contraseña actual</span>
        <input
          type="password"
          autoComplete="current-password"
          className="agenda-input mt-1 min-h-11"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={FIELD_LABEL}>Nueva contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="agenda-input mt-1 min-h-11"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
          <span className={`mt-1 block text-xs ${next && next.length < 8 ? "text-amber-700 dark:text-amber-400" : "text-subtle"}`}>
            {next && next.length < 8 ? `Faltan ${8 - next.length} caracteres` : "Mínimo 8 caracteres."}
          </span>
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Repite la nueva</span>
          <input
            type="password"
            autoComplete="new-password"
            className="agenda-input mt-1 min-h-11"
            value={confirmNext}
            onChange={(e) => setConfirmNext(e.target.value)}
            required
          />
          {mismatch ? <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">No coinciden</span> : null}
        </label>
      </div>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <button type="submit" className="btn btn-primary min-h-11 w-full sm:w-auto sm:justify-self-start" disabled={!valid || sending}>
        {sending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
