"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useFeedback } from "@/components/ui/feedback";
import { ErrorNote, FIELD_LABEL } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

/**
 * Formulario de "entrar" o "registro". Si viene courseSlug, además inscribe
 * al alumno en ese curso y lo lleva ahí.
 */
export default function AuthForm({
  mode,
  base,
  courseSlug,
}: {
  mode: "entrar" | "registro";
  base: string;
  courseSlug?: string;
}) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);

  const registering = mode === "registro";
  const qs = courseSlug ? `?curso=${encodeURIComponent(courseSlug)}` : "";
  const otherHref = `${base}/${registering ? "entrar" : "registro"}${qs}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setExists(false);
    try {
      const r = await fetch(`/api/cursos/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, email, password, courseSlug }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 409 && registering) setExists(true);
        throw new Error(j.error || "No se pudo continuar");
      }
      toast.success(registering ? "¡Cuenta creada! Bienvenido." : "¡Hola de nuevo!");
      router.push(courseSlug ? `${base}/${courseSlug}` : base || "/");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  }

  return (
    <div className="surface-card p-5 sm:p-8">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4">
        {registering ? (
          <label className="block">
            <span className={FIELD_LABEL}>Nombre completo</span>
            <input
              className="agenda-input mt-1 min-h-11"
              autoComplete="name"
              placeholder="Nombre(s) y apellidos"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
            <span className="mt-1 block text-xs text-subtle">Así aparecerás en la lista del profesor.</span>
          </label>
        ) : null}
        <label className="block">
          <span className={FIELD_LABEL}>Correo</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            className="agenda-input mt-1 min-h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus={!registering}
          />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Contraseña</span>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={registering ? "new-password" : "current-password"}
              minLength={registering ? 8 : undefined}
              className="agenda-input min-h-11 pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute inset-y-0 right-0 grid grid-cols-1 w-12 place-items-center text-subtle transition hover:text-fg"
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} className="h-5 w-5" />
            </button>
          </div>
          {registering ? (
            <span className={`mt-1 block text-xs ${password && password.length < 8 ? "text-amber-700 dark:text-amber-400" : "text-subtle"}`}>
              {password && password.length < 8 ? `Faltan ${8 - password.length} caracteres` : "Mínimo 8 caracteres."}
            </span>
          ) : null}
        </label>

        {error ? (
          <ErrorNote>
            {error}
            {exists ? (
              <>
                {" "}
                <Link href={otherHref} className="font-semibold underline">
                  Entra con tu cuenta
                </Link>
              </>
            ) : null}
          </ErrorNote>
        ) : null}

        <button type="submit" className="btn btn-primary min-h-12 w-full text-base" disabled={sending}>
          {sending ? "Un momento…" : registering ? (courseSlug ? "Crear cuenta e inscribirme" : "Crear cuenta") : "Entrar"}
        </button>

        {!registering ? (
          <p className="text-center text-xs text-subtle">¿Olvidaste tu contraseña? Pídele a tu profesor que la restablezca.</p>
        ) : null}
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted">
        {registering ? "¿Ya tienes cuenta?" : "¿Es tu primera vez?"}{" "}
        <Link href={otherHref} className="font-semibold text-primary-ink hover:underline">
          {registering ? "Entra aquí" : "Crea tu cuenta"}
        </Link>
      </div>
    </div>
  );
}
