"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/** Inscribirse a un curso (alumno ya con sesión). */
export function EnrollButton({ courseSlug }: { courseSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary min-h-11 w-full sm:w-auto"
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
          return window.alert("No se pudo completar la inscripción");
        }
        router.refresh();
      }}
    >
      {busy ? "Inscribiendo…" : "Inscribirme a este curso"}
    </button>
  );
}

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await fetch("/api/cursos/auth/salir", { method: "POST" });
        router.refresh();
      }}
    >
      Salir
    </button>
  );
}

const LABEL = "text-xs font-semibold uppercase tracking-wide text-subtle";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const r = await fetch("/api/cursos/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(j.error || "No se pudo cambiar la contraseña");
      setState("idle");
      return;
    }
    setCurrent("");
    setNext("");
    setState("ok");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={LABEL}>Contraseña actual</span>
        <input
          type="password"
          autoComplete="current-password"
          className="agenda-input mt-1 min-h-11"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className={LABEL}>Nueva (mínimo 8)</span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="agenda-input mt-1 min-h-11"
          value={next}
          onChange={(e) => {
            setNext(e.target.value);
            setState("idle");
          }}
          required
        />
      </label>
      {error ? (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 sm:col-span-2 dark:text-rose-400">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-ghost min-h-11 w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? "Guardando…" : state === "ok" ? "Contraseña actualizada ✓" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
