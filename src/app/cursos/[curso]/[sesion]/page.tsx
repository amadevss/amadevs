import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getStudentAttendance,
  getStudentSubmission,
  getVisibleCourse,
  getVisibleSession,
  listMaterials,
  listVisibleSessions,
  submissionBlockedReason,
} from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent, isEnrolled } from "@/lib/cursos/students";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE, formatDateTime } from "@/lib/cursos/shared";
import Markdown from "@/components/cursos/Markdown";
import FileList from "@/components/cursos/FileList";
import SubmissionPanel from "@/components/cursos/SubmissionForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ curso: string; sesion: string }> };

async function load(params: Props["params"]) {
  const { curso, sesion } = await params;
  const position = Number(sesion);
  if (!Number.isInteger(position)) return null;
  const course = await getVisibleCourse(curso);
  if (!course) return null;
  const session = await getVisibleSession(course.id, position);
  if (!session) return null;
  return { course, session };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  return data ? { title: `${data.session.title} · ${data.course.title}` } : {};
}

export default async function SesionPage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();
  const { course, session } = data;

  // Solo alumnos inscritos; si no, al curso (ahí se registra o inscribe).
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  if (!student || !(await isEnrolled(course.id, student.id))) redirect(`${base}/${course.slug}`);

  const [materials, sessions, submission, attendance] = await Promise.all([
    listMaterials(session.id),
    listVisibleSessions(course.id),
    getStudentSubmission(session.id, student.id),
    getStudentAttendance(session.id, student.id),
  ]);
  const idx = sessions.findIndex((s) => s.id === session.id);
  const prev = sessions[idx - 1];
  const next = sessions[idx + 1];
  const overdue = session.due_at ? new Date(session.due_at).getTime() < Date.now() : false;

  return (
    <>
      <Link
        href={`${base}/${course.slug}`}
        className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-subtle transition-colors hover:text-primary-ink"
      >
        ← {course.title}
      </Link>

      <article className="surface-card overflow-hidden">
        <div className="h-1 w-full" style={{ background: "var(--grad)" }} />
        <div className="grid gap-6 p-5 sm:gap-8 sm:p-10">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">Sesión {session.position}</p>
              {attendance ? (
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ATTENDANCE_TONE[attendance]}`}>
                  {ATTENDANCE_LABEL[attendance]}
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">{session.title}</h1>
            {session.description ? <p className="mt-3 whitespace-pre-line text-muted">{session.description}</p> : null}
          </header>

          <Markdown source={session.content} />

          {materials.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Material de apoyo</h2>
              <FileList files={materials} />
            </section>
          ) : null}
        </div>
      </article>

      {session.accepts_submissions ? (
        <section className="surface-card mt-5 p-5 sm:mt-6 sm:p-8">
          <h2 className="font-display text-lg font-bold">Tu entregable</h2>
          {session.due_at ? (
            <p className={`mt-1 text-sm ${overdue ? "text-rose-600 dark:text-rose-400" : "text-subtle"}`}>
              Fecha de entrega: {formatDateTime(session.due_at)}
              {overdue && !submission ? " (vencida, aún puedes enviar)" : ""}
            </p>
          ) : null}
          <div className="mt-5">
            <SubmissionPanel
              sessionId={session.id}
              studentId={student.id}
              submission={submission}
              blockedReason={submissionBlockedReason(session, submission)}
            />
          </div>
        </section>
      ) : null}

      <nav className="mt-5 grid grid-cols-2 gap-3 text-sm sm:mt-6">
        {prev ? (
          <Link href={`${base}/${course.slug}/${prev.position}`} className="btn btn-ghost min-h-11">
            ← Sesión {prev.position}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`${base}/${course.slug}/${next.position}`} className="btn btn-ghost min-h-11">
            Sesión {next.position} →
          </Link>
        ) : null}
      </nav>
    </>
  );
}
