import type { Metadata } from "next";
import Link from "next/link";
import {
  getStudentAttendance,
  getStudentSubmission,
  listMaterials,
  listVisibleSessions,
} from "@/lib/cursos/queries";
import { loadStudentSession, peekSessionTitle } from "@/lib/cursos/studentPage";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE, formatDateTime } from "@/lib/cursos/shared";
import { DELIVERY_LABEL, DELIVERY_TONE, deliveryState } from "@/lib/cursos/status";
import { Badge, Breadcrumbs, ButtonLink } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import Markdown from "@/components/cursos/Markdown";
import FileList from "@/components/cursos/FileList";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ curso: string; sesion: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { curso, sesion } = await params;
  const title = await peekSessionTitle(curso, sesion);
  return title ? { title } : {};
}

export default async function SesionPage({ params }: Props) {
  const { curso, sesion } = await params;
  const { course, session, student, base } = await loadStudentSession(curso, sesion);

  const [materials, sessions, submission, attendance] = await Promise.all([
    listMaterials(session.id),
    listVisibleSessions(course.id),
    getStudentSubmission(session.id, student.id),
    getStudentAttendance(session.id, student.id),
  ]);
  const idx = sessions.findIndex((s) => s.id === session.id);
  const prev = sessions[idx - 1];
  const next = sessions[idx + 1];
  const state = deliveryState(session, submission ? { submitted: true, grade: submission.grade } : undefined);
  const courseHref = `${base}/${course.slug}`;
  const entregaHref = `${courseHref}/${session.position}/entrega`;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Mis cursos", href: base || "/" },
          { label: course.title, href: courseHref },
          { label: `Sesión ${session.position}` },
        ]}
      />

      <article className="surface-card overflow-hidden">
        <div className="h-1 w-full" style={{ background: "var(--grad)" }} />
        <div className="grid gap-6 p-5 sm:gap-8 sm:p-10">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">Sesión {session.position}</p>
              {attendance ? (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ATTENDANCE_TONE[attendance]}`}>
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
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                <Icon name="file" className="h-5 w-5 text-primary-ink" />
                Material de apoyo
              </h2>
              <FileList files={materials} />
            </section>
          ) : null}
        </div>
      </article>

      {session.accepts_submissions ? (
        <section className="surface-card mt-5 grid gap-4 p-5 sm:mt-6 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold">Tu entrega</h2>
              <p className="mt-0.5 text-sm text-muted">
                {session.due_at ? `Fecha límite: ${formatDateTime(session.due_at)}` : "Sin fecha límite"}
              </p>
            </div>
            <Badge tone={DELIVERY_TONE[state]}>{DELIVERY_LABEL[state]}</Badge>
          </div>

          {submission?.grade || submission?.feedback ? (
            <div className="rounded-xl border border-primary/30 bg-primary-soft px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-ink">Revisión del profesor</p>
              {submission.grade ? <p className="mt-1 font-display text-2xl font-bold">{submission.grade}</p> : null}
              {submission.feedback ? <p className="mt-1 whitespace-pre-line text-sm">{submission.feedback}</p> : null}
            </div>
          ) : submission ? (
            <p className="text-sm text-muted">
              Enviaste {submission.files.length} {submission.files.length === 1 ? "archivo" : "archivos"} el{" "}
              {formatDateTime(submission.updated_at)}. Tu profesor aún no la califica.
            </p>
          ) : (
            <p className="text-sm text-muted">
              {state === "vencida"
                ? "La fecha límite ya pasó, pero aún puedes enviar tu entrega."
                : "Sube fotos, videos, PDF u otros archivos, con un comentario si quieres."}
            </p>
          )}

          <ButtonLink
            href={entregaHref}
            variant={submission ? "ghost" : "primary"}
            icon={submission ? "eye" : "upload"}
            className="w-full sm:w-auto sm:justify-self-start"
          >
            {submission ? "Ver mi entrega" : "Subir mi entrega"}
          </ButtonLink>
        </section>
      ) : null}

      <nav aria-label="Otras sesiones" className="mt-5 grid grid-cols-2 gap-3 sm:mt-6">
        {prev ? (
          <Link
            href={`${courseHref}/${prev.position}`}
            className="surface-card flex min-h-14 items-center gap-2 px-4 py-3 text-sm transition hover:bg-surface-2"
          >
            <Icon name="chevronLeft" className="h-4 w-4 shrink-0 text-subtle" />
            <span className="min-w-0">
              <span className="block text-xs text-subtle">Sesión {prev.position}</span>
              <span className="block truncate font-medium">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`${courseHref}/${next.position}`}
            className="surface-card flex min-h-14 items-center justify-end gap-2 px-4 py-3 text-right text-sm transition hover:bg-surface-2"
          >
            <span className="min-w-0">
              <span className="block text-xs text-subtle">Sesión {next.position}</span>
              <span className="block truncate font-medium">{next.title}</span>
            </span>
            <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-subtle" />
          </Link>
        ) : null}
      </nav>
    </>
  );
}
