import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  attendancePercent,
  getVisibleCourse,
  listStudentSessionStatus,
  listVisibleSessions,
} from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent, isEnrolled } from "@/lib/cursos/students";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE, formatDateTime } from "@/lib/cursos/shared";
import AuthForms from "@/components/cursos/AuthForms";
import { EnrollButton } from "@/components/cursos/StudentActions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ curso: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getVisibleCourse((await params).curso);
  return course ? { title: course.title, description: course.description } : {};
}

export default async function CursoPage({ params }: Props) {
  const course = await getVisibleCourse((await params).curso);
  if (!course) notFound();
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  const enrolled = student ? await isEnrolled(course.id, student.id) : false;

  const header = (
    <header className="mb-6">
      <p className="eyebrow">Curso</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
      {course.description ? <p className="mt-3 whitespace-pre-line text-muted">{course.description}</p> : null}
    </header>
  );

  if (!student) {
    return (
      <div className="mx-auto max-w-md">
        {header}
        <p className="mb-4 text-sm text-muted">Crea tu cuenta para inscribirte y ver las sesiones.</p>
        <AuthForms courseSlug={course.slug} />
      </div>
    );
  }

  if (!enrolled) {
    return (
      <>
        {header}
        <div className="surface-card p-5 sm:p-6">
          <p className="mb-4 text-sm text-muted">Aún no estás inscrito en este curso.</p>
          <EnrollButton courseSlug={course.slug} />
        </div>
      </>
    );
  }

  const [sessions, statuses] = await Promise.all([
    listVisibleSessions(course.id),
    listStudentSessionStatus(course.id, student.id),
  ]);
  const byId = new Map(statuses.map((s) => [s.session_id, s]));
  const pct = attendancePercent(statuses.map((s) => s.attendance));

  return (
    <>
      {header}

      {pct !== null ? (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
          <span className="text-muted">Tu asistencia</span>
          <span className="font-display text-xl font-bold">{pct}%</span>
        </div>
      ) : null}

      {sessions.length === 0 ? (
        <p className="text-muted">Aún no hay sesiones publicadas.</p>
      ) : (
        <ol className="grid gap-3">
          {sessions.map((s) => {
            const st = byId.get(s.id);
            return (
              <li key={s.id}>
                <Link
                  href={`${base}/${course.slug}/${s.position}`}
                  className="surface-card flex items-start gap-3 p-4 transition active:scale-[0.99] sm:gap-4 sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-[var(--shadow-md)]"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ background: "var(--grad)" }}
                  >
                    {s.position}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{s.title}</span>
                    {s.description ? (
                      <span className="mt-0.5 block text-sm text-muted line-clamp-2">{s.description}</span>
                    ) : null}
                    <span className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      {st?.attendance ? (
                        <span className={`rounded-full border px-2 py-0.5 font-medium ${ATTENDANCE_TONE[st.attendance]}`}>
                          {ATTENDANCE_LABEL[st.attendance]}
                        </span>
                      ) : null}
                      {s.accepts_submissions ? (
                        st?.submitted ? (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                            {st.grade ? `Calificación: ${st.grade}` : "Entregado"}
                          </span>
                        ) : (
                          <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-subtle">
                            Pendiente{s.due_at ? ` · ${formatDateTime(s.due_at)}` : ""}
                          </span>
                        )
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
