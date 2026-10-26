"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Course, CourseKind, CourseSession } from "@/lib/cursos/queries";
import { COURSES_PUBLIC_ORIGIN, fileUrl, formatBytes, MAX_COVER_BYTES, toLocalInput } from "@/lib/cursos/shared";
import { uploadCourseCover } from "@/lib/cursos/upload";
import Icon from "@/components/ui/icons";
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

const KIND_OPTIONS: { value: CourseKind; title: string; hint: string }[] = [
  {
    value: "privado",
    title: "Privado",
    hint: "Solo entra quien tiene el enlace. Asistencia, entregas y calificaciones, como hasta ahora.",
  },
  {
    value: "publico",
    title: "Público",
    hint: "Aparece en el catálogo. Clases con video, muestras gratis y avance guardado.",
  },
];

/** Portada del curso: se sube y guarda en cuanto se elige la imagen. */
function CoverPicker({ courseId, cover }: { courseId: string; cover: string | null }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);

  async function pick(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Elige una imagen (JPG, PNG o WebP)");
    if (file.size > MAX_COVER_BYTES) return toast.error(`La imagen pesa más de ${formatBytes(MAX_COVER_BYTES)}`);
    setPct(0);
    try {
      const up = await uploadCourseCover(file, courseId, (p) => setPct(Math.min(p, 99)));
      await send(`/api/dashboard/cursos/${courseId}/portada`, "POST", up, "ok");
      toast.success("Portada actualizada");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "No se pudo subir la portada");
    } finally {
      setPct(null);
    }
  }

  async function remove() {
    const yes = await confirm({ title: "¿Quitar la portada?", confirmLabel: "Quitar", danger: true });
    if (!yes) return;
    const r = await fetch(`/api/dashboard/cursos/${courseId}/portada`, { method: "DELETE" });
    if (!r.ok) return toast.error("No se pudo quitar la portada");
    toast.success("Portada quitada");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[14rem_1fr] sm:items-center">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface-2">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(cover)} alt="Portada del curso" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-white" style={{ background: "var(--grad)" }}>
            <Icon name="book" className="h-8 w-8" />
          </div>
        )}
        {pct !== null ? (
          <div className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-semibold text-white">
            {Math.round(pct)}%
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-2">
        <p className="text-xs text-subtle">
          Imagen horizontal (16:9), por ejemplo 1280×720. Se guarda en cuanto la eliges.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost min-h-10" disabled={pct !== null} onClick={() => inputRef.current?.click()}>
            <Icon name="upload" className="h-4 w-4" />
            {cover ? "Cambiar portada" : "Subir portada"}
          </button>
          {cover ? (
            <button type="button" className="btn btn-ghost min-h-10" disabled={pct !== null} onClick={remove}>
              Quitar
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

export function CourseForm({ course }: { course?: Course }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [kind, setKind] = useState<CourseKind>(course?.kind ?? "privado");
  const [summary, setSummary] = useState(course?.summary ?? "");
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
      const body = { title, slug, description, hidden, kind, summary };
      const saved = course
        ? await send<Course>(`/api/dashboard/cursos/${course.id}`, "PATCH", body, "course")
        : await send<Course>("/api/dashboard/cursos", "POST", body, "course");
      toast.success(course ? "Curso actualizado" : `Curso "${saved.title}" creado. Ahora agrega sesiones.`);
      if (course) {
        // Editar es una pestaña del curso: se queda aquí con los datos nuevos.
        setSubmitting(false);
        router.refresh();
        return;
      }
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
      <fieldset className="sm:col-span-2">
        <legend className={FIELD_LABEL}>Tipo de curso</legend>
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {KIND_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                kind === o.value ? "border-primary bg-primary-soft" : "border-border hover:bg-surface-2"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={o.value}
                checked={kind === o.value}
                onChange={() => setKind(o.value)}
                className="mt-1 accent-[var(--primary)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{o.title}</span>
                <span className="block text-xs text-subtle">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {course && course.kind === "privado" && kind === "publico" ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Al guardarlo como público aparecerá en el catálogo para cualquier persona.
          </p>
        ) : null}
      </fieldset>
      {course && kind === "publico" ? (
        <div className="sm:col-span-2">
          <span className={FIELD_LABEL}>Portada</span>
          <div className="mt-1">
            <CoverPicker courseId={course.id} cover={course.cover_pathname} />
          </div>
        </div>
      ) : null}
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
      {kind === "publico" ? (
        <label className="block sm:col-span-2">
          <span className={FIELD_LABEL}>Frase corta</span>
          <input
            className="agenda-input mt-1 min-h-11"
            value={summary}
            maxLength={200}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Ej. Aprende a usar la IA en tu salón de clases en 2 semanas"
          />
          <span className="mt-1 block text-xs text-subtle">
            Aparece en la tarjeta del catálogo.{!course ? " La portada la subes después de crear el curso." : ""}
          </span>
        </label>
      ) : null}
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
          hint={
            kind === "publico"
              ? "No aparece en el catálogo ni se puede abrir mientras esté oculto. Útil para prepararlo."
              : "Los alumnos no lo ven ni pueden inscribirse mientras esté oculto."
          }
        />
      </div>
    </FormShell>
  );
}

export function SessionForm({
  courseId,
  courseKind = "privado",
  session,
  nextPosition,
}: {
  courseId: string;
  courseKind?: CourseKind;
  session?: CourseSession;
  nextPosition: number;
}) {
  const isPublic = courseKind === "publico";
  const router = useRouter();
  const { toast } = useFeedback();
  const [position, setPosition] = useState(String(session?.position ?? nextPosition));
  const [title, setTitle] = useState(session?.title ?? "");
  const [description, setDescription] = useState(session?.description ?? "");
  const [content, setContent] = useState(session?.content ?? "");
  // En cursos públicos las clases no piden entrega salvo que lo actives.
  const [acceptsSubmissions, setAcceptsSubmissions] = useState(session?.accepts_submissions ?? !isPublic);
  const [isPreview, setIsPreview] = useState(session?.is_preview ?? false);
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
        is_preview: isPublic && isPreview,
      };
      const saved = session
        ? await send<CourseSession>(`/api/dashboard/cursos/sesiones/${session.id}`, "PATCH", body, "session")
        : await send<CourseSession>(`/api/dashboard/cursos/${courseId}/sesiones`, "POST", body, "session");
      const noun = isPublic ? "Clase" : "Sesión";
      toast.success(
        session
          ? `${noun} actualizada`
          : isPublic
            ? `Clase ${saved.position} creada. Ahora sube su video.`
            : `Sesión ${saved.position} creada. Sube sus materiales.`,
      );
      if (session) {
        // Editar es una pestaña de la sesión: se queda aquí con los datos nuevos.
        setSubmitting(false);
        router.refresh();
        return;
      }
      router.push(isPublic ? sessionHref(courseId, saved.id) : `${sessionHref(courseId, saved.id)}/materiales`);
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
        {isPublic ? (
          <Toggle
            checked={isPreview}
            onChange={setIsPreview}
            title="Clase de muestra gratis"
            hint="Cualquiera puede verla sin inscribirse, para conocer el curso."
          />
        ) : null}
        <Toggle
          checked={hidden}
          onChange={setHidden}
          title={isPublic ? "Ocultar clase" : "Ocultar sesión"}
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
