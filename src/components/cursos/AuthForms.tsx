"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const LABEL = "text-xs font-semibold uppercase tracking-wide text-subtle";

/**
 * Crear cuenta / Iniciar sesión. Si viene courseSlug, además inscribe al
 * alumno en ese curso.
 */
export default function AuthForms({ courseSlug }: { courseSlug?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"registro" | "entrar">("registro");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/cursos/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, email, password, courseSlug }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (r.status === 409 && mode === "registro") setMode("entrar");
        throw new Error(j.error || "No se pudo continuar");
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  }

  const registering = mode === "registro";

  return (
    <div className="surface-card p-5 sm:p-8">
      <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-surface-2 p-1">
        {(["registro", "entrar"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`min-h-10 rounded-full text-sm font-semibold transition ${
              mode === m ? "bg-surface text-fg shadow-[var(--shadow-sm)]" : "text-muted"
            }`}
          >
            {m === "registro" ? "Crear cuenta" : "Ya tengo cuenta"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-4">
        {registering ? (
          <label className="block">
            <span className={LABEL}>Nombre completo</span>
            <input
              className="agenda-input mt-1 min-h-11"
              autoComplete="name"
              placeholder="Nombre(s) y apellidos"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
        ) : null}
        <label className="block">
          <span className={LABEL}>Correo</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            className="agenda-input mt-1 min-h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className={LABEL}>Contraseña{registering ? " (mínimo 8 caracteres)" : ""}</span>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={registering ? "new-password" : "current-password"}
              minLength={registering ? 8 : undefined}
              className="agenda-input min-h-11 pr-20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-muted"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </label>

        {error ? (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
        ) : null}

        <button type="submit" className="btn btn-primary min-h-11 w-full" disabled={sending}>
          {sending ? "Un momento…" : registering ? (courseSlug ? "Crear cuenta e inscribirme" : "Crear cuenta") : "Entrar"}
        </button>
        {!registering ? (
          <p className="text-center text-xs text-subtle">
            ¿Olvidaste tu contraseña? Pídele al profesor que la restablezca.
          </p>
        ) : null}
      </form>
    </div>
  );
}
