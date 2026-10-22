"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { Course, CourseSession } from "@/lib/cursos/queries";
import { toLocalInput } from "@/lib/cursos/shared";

const LABEL = "text-xs font-semibold uppercase tracking-wide text-subtle";

function FormShell({
  title,
  error,
  submitting,
  submitLabel,
  valid,
  onSubmit,
  onCancel,
  children,
}: {
  title: string;
  error: string | null;
  submitting: boolean;
  submitLabel: string;
  valid: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="surface-card grid gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold">{title}</h3>
        <button type="button" onClick={onCancel} className="text-sm text-muted transition hover:text-fg">
          Cerrar
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      {error ? (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={!valid || submitting}>
        {submitting ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}

async function send<T>(url: string, method: string, body: unknown, key: string): Promise<T> {
  const r = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "No se pudo guardar");
  return j[key] as T;
}

export function CourseForm({
  course,
  onSaved,
  onCancel,
}: {
  course?: Course;
  onSaved: (c: Course) => void;
  onCancel: () => void;
}) {
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
      onSaved(
        course
          ? await send<Course>(`/api/dashboard/cursos/${course.id}`, "PATCH", body, "course")
          : await send<Course>("/api/dashboard/cursos", "POST", body, "course"),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormShell
      title={course ? "Editar curso" : "Nuevo curso"}
      error={error}
      submitting={submitting}
      submitLabel={course ? "Guardar cambios" : "Crear curso"}
      valid={title.trim().length > 1}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <label className="block">
        <span className={LABEL}>Título *</span>
        <input className="agenda-input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block">
        <span className={LABEL}>Id en el enlace {course ? "" : "(opcional, se genera solo)"}</span>
        <input
          className="agenda-input mt-1"
          placeholder="react-2026"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className={LABEL}>Descripción</span>
        <textarea className="agenda-textarea mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Oculto (los alumnos no lo ven)
      </label>
    </FormShell>
  );
}

export function SessionForm({
  courseId,
  session,
  nextPosition,
  onSaved,
  onCancel,
}: {
  courseId: string;
  session?: CourseSession;
  nextPosition: number;
  onSaved: (s: CourseSession) => void;
  onCancel: () => void;
}) {
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
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        hidden,
      };
      onSaved(
        session
          ? await send<CourseSession>(`/api/dashboard/cursos/sesiones/${session.id}`, "PATCH", body, "session")
          : await send<CourseSession>(`/api/dashboard/cursos/${courseId}/sesiones`, "POST", body, "session"),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormShell
      title={session ? "Editar sesión" : "Nueva sesión"}
      error={error}
      submitting={submitting}
      submitLabel={session ? "Guardar cambios" : "Crear sesión"}
      valid={title.trim().length > 1 && Number(position) >= 1}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <label className="block">
        <span className={LABEL}>Número de sesión *</span>
        <input
          type="number"
          min={1}
          className="agenda-input mt-1"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
      </label>
      <label className="block">
        <span className={LABEL}>Título *</span>
        <input className="agenda-input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block sm:col-span-2">
        <span className={LABEL}>Descripción corta</span>
        <textarea className="agenda-textarea mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="block sm:col-span-2">
        <span className={LABEL}>Detalles (Markdown: listas, tablas, código, enlaces…)</span>
        <textarea
          className="agenda-textarea mt-1 min-h-48 font-mono text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={acceptsSubmissions}
          onChange={(e) => setAcceptsSubmissions(e.target.checked)}
        />
        Recibe entregas
      </label>
      {acceptsSubmissions ? (
        <label className="block">
          <span className={LABEL}>Fecha de entrega (opcional)</span>
          <input
            type="datetime-local"
            className="agenda-input mt-1"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </label>
      ) : (
        <span />
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Oculta (los alumnos no la ven)
      </label>
    </FormShell>
  );
}
