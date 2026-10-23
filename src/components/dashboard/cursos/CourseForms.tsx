"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import type { Course, CourseSession } from "@/lib/cursos/queries";
import { COURSES_PUBLIC_ORIGIN, toLocalInput } from "@/lib/cursos/shared";
import { courseHref, sessionHref } from "@/lib/dashboard/paths";
import { useFeedback } from "@/components/ui/feedback";
import { ErrorNote, FIELD_LABEL } from "@/components/ui/kit";

function FormShell({
  error,
  submitting,
  submitLabel,
  valid,
  cancelHref,
  onSubmit,
  children,
}: {
  error: string | null;
  submitting: boolean;
  submitLabel: string;
  valid: boolean;
  cancelHref: string;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <form onSubmit={onSubmit} className="surface-card grid grid-cols-1 gap-5 p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-ghost min-h-11" onClick={() => router.push(cancelHref)} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary min-h-11" disabled={!valid || submitting}>
          {submitting ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition hover:bg-surface-2">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--ring)] ${
          checked ? "bg-primary" : "bg-border-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[1.125rem]" : "left-0.5"}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-subtle">{hint}</span>
      </span>
    </label>
  );
}

async function send<T>(url: string, method: string, body: unknown, key: string): Promise<T> {
  const r = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "No se pudo guardar");
  return j[key] as T;
}

export function CourseForm({ course }: { course?: Course }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [title, setTitle] = useState(course?.title ?? "");
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [hidden, setHidden] = useState(course?.hidden ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = { title, slug, description, hidden };
      const saved = course
        ? await send<Course>(`/api/dashboard/cursos/${course.id}`, "PATCH", body, "course")
        : await send<Course>("/api/dashboard/cursos", "POST", body, "course");
      toast.success(course ? "Curso actualizado" : `Curso "${saved.title}" creado. Ahora agrega sesiones.`);
      router.push(courseHref(saved.id));
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  const host = COURSES_PUBLIC_ORIGIN.replace("https://", "");

  return (
    <FormShell
      error={error}
      submitting={submitting}
      submitLabel={course ? "Guardar cambios" : "Crear curso"}
      valid={title.trim().length > 1}
      cancelHref={course ? courseHref(course.id) : "/dashboard/cursos"}
      onSubmit={submit}
    >
      <label className="block sm:col-span-2">
        <span className={FIELD_LABEL}>Título *</span>
        <input
          className="agenda-input mt-1 min-h-11"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. React desde cero"
          autoFocus={!course}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className={FIELD_LABEL}>Enlace del curso {course ? "" : "(opcional)"}</span>
        <div className="mt-1 flex min-h-11 items-center overflow-hidden rounded-xl border border-border-strong bg-surface focus-within:outline focus-within:outline-2 focus-within:outline-[var(--ring)]">
          <span className="hidden shrink-0 border-r border-border bg-surface-2 px-3 py-2.5 text-sm text-subtle sm:block">
            {host}/
          </span>
          <input
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
            placeholder="react-2026"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <span className="mt-1 block text-xs text-subtle">
          {course
            ? "Si lo cambias, el enlace anterior deja de funcionar."
            : "Si lo dejas vacío se genera a partir del título."}
        </span>
      </label>
      <label className="block sm:col-span-2">
        <span className={FIELD_LABEL}>Descripción</span>
        <textarea
          className="agenda-textarea mt-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="¿De qué trata el curso? Los alumnos lo ven al inscribirse."
        />
      </label>
      <div className="sm:col-span-2">
        <Toggle
          checked={hidden}
          onChange={setHidden}
          title="Ocultar curso"
          hint="Los alumnos no lo ven ni pueden inscribirse mientras esté oculto."
        />
      </div>
    </FormShell>
  );
}

export function SessionForm({
  courseId,
  session,
  nextPosition,
}: {
  courseId: string;
  session?: CourseSession;
  nextPosition: number;
}) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [position, setPosition] = useState(String(session?.position ?? nextPosition));
  const [title, setTitle] = useState(session?.title ?? "");
  const [description, setDescription] = useState(session?.description ?? "");
  const [content, setContent] = useState(session?.content ?? "");
  const [acceptsSubmissions, setAcceptsSubmissions] = useState(session?.accepts_submissions ?? true);
  const [dueAt, setDueAt] = useState(toLocalInput(session?.due_at ?? null));
  const [hidden, setHidden] = useState(session?.hidden ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        position: Number(position),
        title,
        description,
        content,
        accepts_submissions: acceptsSubmissions,
        due_at: acceptsSubmissions && dueAt ? new Date(dueAt).toISOString() : null,
        hidden,
      };
      const saved = session
        ? await send<CourseSession>(`/api/dashboard/cursos/sesiones/${session.id}`, "PATCH", body, "session")
        : await send<CourseSession>(`/api/dashboard/cursos/${courseId}/sesiones`, "POST", body, "session");
      toast.success(session ? "Sesión actualizada" : `Sesión ${saved.position} creada. Sube sus materiales.`);
      router.push(session ? sessionHref(courseId, saved.id) : `${sessionHref(courseId, saved.id)}/materiales`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <FormShell
      error={error}
      submitting={submitting}
      submitLabel={session ? "Guardar cambios" : "Crear sesión"}
      valid={title.trim().length > 1 && Number(position) >= 1}
      cancelHref={session ? sessionHref(courseId, session.id) : courseHref(courseId)}
      onSubmit={submit}
    >
      <div className="grid grid-cols-[6rem_1fr] gap-3 sm:col-span-2">
        <label className="block">
          <span className={FIELD_LABEL}>Número</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            className="agenda-input mt-1 min-h-11"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Título *</span>
          <input
            className="agenda-input mt-1 min-h-11"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Componentes y props"
            autoFocus={!session}
          />
        </label>
      </div>
      <label className="block sm:col-span-2">
        <span className={FIELD_LABEL}>Descripción corta</span>
        <textarea
          className="agenda-textarea mt-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Una o dos líneas que aparecen en la lista de sesiones."
        />
      </label>
      <label className="block sm:col-span-2">
        <span className={FIELD_LABEL}>Contenido</span>
        <textarea
          className="agenda-textarea mt-1 min-h-56 font-mono text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"## Objetivo\n\n- Punto 1\n- Punto 2\n\n```js\nconsole.log('hola')\n```"}
        />
        <span className="mt-1 block text-xs text-subtle">
          Acepta Markdown: títulos (##), listas, tablas, enlaces y bloques de código.
        </span>
      </label>
      <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
        <Toggle
          checked={acceptsSubmissions}
          onChange={setAcceptsSubmissions}
          title="Recibe entregas"
          hint="Los alumnos pueden subir archivos y un comentario."
        />
        <Toggle
          checked={hidden}
          onChange={setHidden}
          title="Ocultar sesión"
          hint="Útil para prepararla antes de publicarla."
        />
      </div>
      {acceptsSubmissions ? (
        <label className="block sm:col-span-2 sm:max-w-xs">
          <span className={FIELD_LABEL}>Fecha límite (opcional)</span>
          <input
            type="datetime-local"
            className="agenda-input mt-1 min-h-11"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <span className="mt-1 block text-xs text-subtle">
            Después de esta fecha solo pueden entregar quienes aún no lo han hecho.
          </span>
        </label>
      ) : null}
    </FormShell>
  );
}
