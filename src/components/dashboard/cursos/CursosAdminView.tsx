"use client";

import { useState } from "react";
import type { Course, CourseSession, CourseWithSessions } from "@/lib/cursos/queries";
import { COURSES_PUBLIC_ORIGIN } from "@/lib/cursos/shared";
import { CourseForm, SessionForm } from "./CourseForms";
import SessionPanel from "./SessionPanel";

type CourseFormState = { mode: "create" } | { mode: "edit"; course: Course } | null;
type SessionFormState = { mode: "create" } | { mode: "edit"; session: CourseSession } | null;

function Badge({ hidden }: { hidden: boolean }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        hidden
          ? "border-border bg-surface-2 text-subtle"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {hidden ? "Oculto" : "Publicado"}
    </span>
  );
}

const linkBtn = "text-xs font-medium text-muted transition hover:text-fg";
const dangerBtn = "text-xs font-medium text-rose-600 hover:underline dark:text-rose-400";

export default function CursosAdminView({ initialCourses }: { initialCourses: CourseWithSessions[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [selectedId, setSelectedId] = useState<string | null>(initialCourses[0]?.id ?? null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormState>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(null);
  const [copied, setCopied] = useState(false);

  const course = courses.find((c) => c.id === selectedId) ?? null;
  const session = course?.sessions.find((s) => s.id === sessionId) ?? null;

  function patchCourse(id: string, fn: (c: CourseWithSessions) => CourseWithSessions) {
    setCourses((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }

  async function removeCourse(c: CourseWithSessions) {
    if (!window.confirm(`¿Eliminar el curso "${c.title}" con todas sus sesiones, materiales y entregas?`)) return;
    const r = await fetch(`/api/dashboard/cursos/${c.id}`, { method: "DELETE" });
    if (!r.ok) return window.alert("No se pudo eliminar el curso");
    setCourses((prev) => prev.filter((x) => x.id !== c.id));
    setSelectedId(null);
  }

  async function removeSession(s: CourseSession) {
    if (!window.confirm(`¿Eliminar la sesión "${s.title}" con sus materiales y entregas?`)) return;
    const r = await fetch(`/api/dashboard/cursos/sesiones/${s.id}`, { method: "DELETE" });
    if (!r.ok) return window.alert("No se pudo eliminar la sesión");
    patchCourse(s.course_id, (c) => ({ ...c, sessions: c.sessions.filter((x) => x.id !== s.id) }));
    if (sessionId === s.id) setSessionId(null);
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-6">
      {/* Cursos */}
      <div className="flex flex-wrap items-center gap-2">
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setSelectedId(c.id);
              setSessionId(null);
              setSessionForm(null);
              setCourseForm(null);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              c.id === selectedId
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-muted hover:bg-surface-2"
            }`}
          >
            {c.title}
            {c.hidden ? " · oculto" : ""}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-primary ml-auto"
          onClick={() => setCourseForm((f) => (f?.mode === "create" ? null : { mode: "create" }))}
        >
          + Nuevo curso
        </button>
      </div>

      {courseForm ? (
        <CourseForm
          key={courseForm.mode === "edit" ? courseForm.course.id : "create"}
          course={courseForm.mode === "edit" ? courseForm.course : undefined}
          onCancel={() => setCourseForm(null)}
          onSaved={(saved) => {
            setCourses((prev) =>
              prev.some((c) => c.id === saved.id)
                ? prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
                : [{ ...saved, sessions: [] }, ...prev],
            );
            setSelectedId(saved.id);
            setCourseForm(null);
          }}
        />
      ) : null}

      {!course ? (
        <p className="text-sm text-subtle">
          {courses.length === 0 ? "Crea tu primer curso para empezar." : "Elige un curso."}
        </p>
      ) : (
        <>
          {/* Detalle del curso */}
          <section className="surface-card grid gap-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-bold">{course.title}</h2>
                <Badge hidden={course.hidden} />
              </div>
              <div className="flex gap-4">
                <button type="button" className={linkBtn} onClick={() => setCourseForm({ mode: "edit", course })}>
                  Editar
                </button>
                <button type="button" className={dangerBtn} onClick={() => removeCourse(course)}>
                  Eliminar
                </button>
              </div>
            </div>
            {course.description ? <p className="text-sm text-muted">{course.description}</p> : null}
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <span className="text-subtle">Enlace para alumnos:</span>
              <a
                href={`/cursos/${course.slug}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-primary-ink hover:underline"
              >
                {COURSES_PUBLIC_ORIGIN.replace("https://", "")}/{course.slug}
              </a>
              <button
                type="button"
                className={`${linkBtn} ml-auto`}
                onClick={() => copyLink(`${COURSES_PUBLIC_ORIGIN}/${course.slug}`)}
              >
                {copied ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
          </section>

          {/* Sesiones */}
          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Sesiones ({course.sessions.length})</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSessionForm((f) => (f?.mode === "create" ? null : { mode: "create" }))}
              >
                + Nueva sesión
              </button>
            </div>

            {sessionForm ? (
              <SessionForm
                key={sessionForm.mode === "edit" ? sessionForm.session.id : "create"}
                courseId={course.id}
                session={sessionForm.mode === "edit" ? sessionForm.session : undefined}
                nextPosition={Math.max(0, ...course.sessions.map((s) => s.position)) + 1}
                onCancel={() => setSessionForm(null)}
                onSaved={(saved) => {
                  patchCourse(course.id, (c) => {
                    const exists = c.sessions.find((s) => s.id === saved.id);
                    const sessions = exists
                      ? c.sessions.map((s) => (s.id === saved.id ? { ...s, ...saved } : s))
                      : [...c.sessions, { ...saved, materials: [], submission_count: 0 }];
                    return { ...c, sessions: sessions.sort((a, b) => a.position - b.position) };
                  });
                  setSessionId(saved.id);
                  setSessionForm(null);
                }}
              />
            ) : null}

            {course.sessions.length === 0 ? (
              <p className="text-sm text-subtle">Sin sesiones todavía.</p>
            ) : (
              <ul className="surface-card divide-y divide-border">
                {course.sessions.map((s) => (
                  <li
                    key={s.id}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3 ${s.id === sessionId ? "bg-primary-soft/40" : ""}`}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => setSessionId(s.id === sessionId ? null : s.id)}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold">
                        {s.position}
                      </span>
                      <span className="min-w-0 truncate font-medium">{s.title}</span>
                      <span className="shrink-0 text-xs text-subtle">
                        {s.materials.length} mat. · {s.accepts_submissions ? `${s.submission_count} entregas` : "sin entregas"}
                      </span>
                    </button>
                    <Badge hidden={s.hidden} />
                    <div className="flex gap-4">
                      <a
                        href={`/cursos/${course.slug}/${s.position}`}
                        target="_blank"
                        rel="noreferrer"
                        className={linkBtn}
                      >
                        Ver
                      </a>
                      <button type="button" className={linkBtn} onClick={() => setSessionForm({ mode: "edit", session: s })}>
                        Editar
                      </button>
                      <button type="button" className={dangerBtn} onClick={() => removeSession(s)}>
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {session ? (
            <SessionPanel
              key={session.id}
              session={session}
              onMaterialsChange={(materials) =>
                patchCourse(course.id, (c) => ({
                  ...c,
                  sessions: c.sessions.map((s) => (s.id === session.id ? { ...s, materials } : s)),
                }))
              }
            />
          ) : course.sessions.length > 0 ? (
            <p className="text-sm text-subtle">Toca una sesión para subir materiales y ver entregas.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
