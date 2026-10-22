"use client";

import { useState } from "react";
import type { Course, CourseSession, CourseWithSessions } from "@/lib/cursos/queries";
import { COURSES_PUBLIC_ORIGIN } from "@/lib/cursos/shared";
import { CourseForm, SessionForm } from "./CourseForms";
import SessionPanel from "./SessionPanel";
import StudentsPanel from "./StudentsPanel";

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

const actionBtn =
  "inline-flex min-h-10 items-center rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-fg";
const dangerBtn =
  "inline-flex min-h-10 items-center rounded-lg px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400";

export default function CursosAdminView({ initialCourses }: { initialCourses: CourseWithSessions[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [selectedId, setSelectedId] = useState<string | null>(initialCourses[0]?.id ?? null);
  const [tab, setTab] = useState<"sesiones" | "alumnos">("sesiones");
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
    if (!window.confirm(`¿Eliminar el curso "${c.title}" con todas sus sesiones, materiales, entregas y asistencia?`)) return;
    const r = await fetch(`/api/dashboard/cursos/${c.id}`, { method: "DELETE" });
    if (!r.ok) return window.alert("No se pudo eliminar el curso");
    setCourses((prev) => prev.filter((x) => x.id !== c.id));
    setSelectedId(null);
  }

  async function removeSession(s: CourseSession) {
    if (!window.confirm(`¿Eliminar la sesión "${s.title}" con sus materiales, entregas y asistencia?`)) return;
    const r = await fetch(`/api/dashboard/cursos/sesiones/${s.id}`, { method: "DELETE" });
    if (!r.ok) return window.alert("No se pudo eliminar la sesión");
    patchCourse(s.course_id, (c) => ({ ...c, sessions: c.sessions.filter((x) => x.id !== s.id) }));
    if (sessionId === s.id) setSessionId(null);
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copia el enlace:", url);
    }
  }

  return (
    <div className="grid gap-5">
      {/* Cursos: en celular se desplazan de lado */}
      <div className="flex items-center gap-2">
        <div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1">
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
              className={`min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-medium transition ${
                c.id === selectedId
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-muted hover:bg-surface-2"
              }`}
            >
              {c.title}
              {c.hidden ? " · oculto" : ""}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary min-h-10 shrink-0 px-4"
          onClick={() => setCourseForm((f) => (f?.mode === "create" ? null : { mode: "create" }))}
        >
          + Curso
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
          <section className="surface-card grid gap-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold">{course.title}</h2>
                <Badge hidden={course.hidden} />
              </div>
              <div className="flex">
                <button type="button" className={actionBtn} onClick={() => setCourseForm({ mode: "edit", course })}>
                  Editar
                </button>
                <button type="button" className={dangerBtn} onClick={() => removeCourse(course)}>
                  Eliminar
                </button>
              </div>
            </div>
            {course.description ? <p className="text-sm text-muted">{course.description}</p> : null}
            <div className="grid gap-2 rounded-xl bg-surface-2 p-3 text-sm sm:flex sm:items-center">
              <span className="text-xs text-subtle">Enlace de inscripción:</span>
              <a
                href={`/cursos/${course.slug}`}
                target="_blank"
                rel="noreferrer"
                className="break-all font-mono text-primary-ink hover:underline"
              >
                {COURSES_PUBLIC_ORIGIN.replace("https://", "")}/{course.slug}
              </a>
              <button
                type="button"
                className="btn btn-ghost min-h-10 sm:ml-auto"
                onClick={() => copyLink(`${COURSES_PUBLIC_ORIGIN}/${course.slug}`)}
              >
                {copied ? "Copiado ✓" : "Copiar enlace"}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1 sm:w-80">
            {(["sesiones", "alumnos"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`min-h-10 rounded-full text-sm font-medium transition ${
                  tab === t ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2"
                }`}
              >
                {t === "sesiones" ? `Sesiones (${course.sessions.length})` : "Alumnos"}
              </button>
            ))}
          </div>

          {tab === "alumnos" ? (
            <StudentsPanel key={course.id} courseId={course.id} />
          ) : (
            <>
              <section className="grid gap-3">
                <button
                  type="button"
                  className="btn btn-ghost min-h-11 w-full sm:w-auto sm:justify-self-end"
                  onClick={() => setSessionForm((f) => (f?.mode === "create" ? null : { mode: "create" }))}
                >
                  + Nueva sesión
                </button>

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
                  <ul className="surface-card divide-y divide-border overflow-hidden">
                    {course.sessions.map((s) => (
                      <li key={s.id} className={s.id === sessionId ? "bg-primary-soft/40" : ""}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 pb-1 pt-3 text-left"
                          onClick={() => setSessionId(s.id === sessionId ? null : s.id)}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold">
                            {s.position}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{s.title}</span>
                            <span className="block text-xs text-subtle">
                              {s.materials.length} materiales ·{" "}
                              {s.accepts_submissions ? `${s.submission_count} entregas` : "sin entregas"}
                            </span>
                          </span>
                          <Badge hidden={s.hidden} />
                        </button>
                        <div className="flex flex-wrap justify-end px-2 pb-2">
                          <button
                            type="button"
                            className={actionBtn}
                            onClick={() => setSessionId(s.id === sessionId ? null : s.id)}
                          >
                            {s.id === sessionId ? "Cerrar" : "Asistencia y entregas"}
                          </button>
                          <a href={`/cursos/${course.slug}/${s.position}`} target="_blank" rel="noreferrer" className={actionBtn}>
                            Ver
                          </a>
                          <button type="button" className={actionBtn} onClick={() => setSessionForm({ mode: "edit", session: s })}>
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
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
