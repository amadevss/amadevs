import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStudentSubmission, submissionBlockedReason } from "@/lib/cursos/queries";
import { loadStudentSession, peekSessionTitle } from "@/lib/cursos/studentPage";
import { formatDateTime } from "@/lib/cursos/shared";
import { Breadcrumbs } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import SubmissionPanel from "@/components/cursos/SubmissionForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ curso: string; sesion: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { curso, sesion } = await params;
  const title = await peekSessionTitle(curso, sesion);
  return title ? { title: `Entrega · ${title}` } : {};
}

export default async function EntregaPage({ params }: Props) {
  const { curso, sesion } = await params;
  const { course, session, student, base } = await loadStudentSession(curso, sesion);
  const courseHref = `${base}/${course.slug}`;
  const sessionHref = `${courseHref}/${session.position}`;
  if (!session.accepts_submissions) redirect(sessionHref);

  const submission = await getStudentSubmission(session.id, student.id);
  const overdue = session.due_at ? new Date(session.due_at).getTime() < Date.now() : false;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Mis cursos", href: `${base}/mis-cursos` },
          { label: course.title, href: courseHref },
          { label: `Sesión ${session.position}`, href: sessionHref },
          { label: "Entrega" },
        ]}
      />
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {submission ? "Tu entrega" : "Subir entrega"}
        </h1>
        <p className="mt-1 text-sm text-muted">{session.title}</p>
        {session.due_at ? (
          <p
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              overdue
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }`}
          >
            <Icon name="clock" className="h-3.5 w-3.5" />
            {overdue ? "Venció" : "Fecha límite"}: {formatDateTime(session.due_at)}
            {overdue && !submission ? " · aún puedes enviarla" : ""}
          </p>
        ) : null}
      </header>
      <section className="surface-card p-5 sm:p-6">
        <SubmissionPanel
          sessionId={session.id}
          studentId={student.id}
          submission={submission}
          blockedReason={submissionBlockedReason(session, submission)}
          sessionHref={sessionHref}
          courseHref={courseHref}
        />
      </section>
    </>
  );
}
