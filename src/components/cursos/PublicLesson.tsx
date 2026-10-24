import Link from "next/link";
import {
  getLessonProgress,
  getStudentSubmission,
  listMaterials,
  listVisibleSessions,
  type Course,
  type CourseSession,
} from "@/lib/cursos/queries";
import { formatDateTime } from "@/lib/cursos/shared";
import { mediaConfigured, presignDownload } from "@/lib/media/s3";
import { Badge, Breadcrumbs, ButtonLink } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import Markdown from "./Markdown";
import FileList from "./FileList";
import { LessonCompleteButton, LessonVideo } from "./LessonPlayer";

type Props = {
  course: Course;
  session: CourseSession;
  studentId: string | null;
  enrolled: boolean;
  base: string;
};

/** Clase de un curso público: video, contenido, materiales y avance. */
export default async function PublicLesson({ course, session, studentId, enrolled, base }: Props) {
  const tracking = enrolled && studentId ? studentId : null;
  const [lessons, materials, progress, submission, videoUrl] = await Promise.all([
    listVisibleSessions(course.id),
    enrolled ? listMaterials(session.id) : Promise.resolve([]),
    tracking ? getLessonProgress(session.id, tracking) : Promise.resolve(null),
    tracking && session.accepts_submissions ? getStudentSubmission(session.id, tracking) : Promise.resolve(null),
    session.video_key && mediaConfigured()
      ? presignDownload(session.video_key).catch((err) => {
          console.error("[cursos] video", err);
          return null;
        })
      : Promise.resolve(null),
  ]);

  // Sin inscripción solo se navega entre clases de muestra.
  const reachable = enrolled ? lessons : lessons.filter((l) => l.is_preview);
  const idx = reachable.findIndex((l) => l.id === session.id);
  const prev = reachable[idx - 1];
  const next = reachable[idx + 1];
  const courseHref = `${base}/${course.slug}`;
  const completed = !!progress?.completed_at;

  return (
    <>
      <Breadcrumbs
        items={[
          enrolled ? { label: "Mis cursos", href: `${base}/mis-cursos` } : { label: "Cursos", href: `${base}/catalogo` },
          { label: course.title, href: courseHref },
          { label: `Clase ${session.position}` },
        ]}
      />

      {session.video_key ? (
        videoUrl ? (
          <LessonVideo
            src={videoUrl}
            sessionId={tracking ? session.id : undefined}
            startAt={progress?.position_seconds ?? 0}
            completed={completed}
          />
        ) : (
          <div className="grid aspect-video w-full place-items-center rounded-2xl bg-surface-2 text-center text-sm text-muted">
            <span className="grid justify-items-center gap-2 px-6">
              <Icon name="video" className="h-8 w-8 text-subtle" />
              El video no está disponible en este momento. Intenta más tarde.
            </span>
          </div>
        )
      ) : null}

      <article className="surface-card mt-5 overflow-hidden">
        <div className="grid grid-cols-1 gap-6 p-5 sm:gap-8 sm:p-8">
          <header className="grid grid-cols-1 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">Clase {session.position}</p>
              {completed ? <Badge tone="ok">Vista</Badge> : null}
              {!enrolled ? <Badge tone="primary">Muestra gratis</Badge> : null}
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{session.title}</h1>
            {session.description ? <p className="whitespace-pre-line text-muted">{session.description}</p> : null}
            {tracking ? <LessonCompleteButton key={String(completed)} sessionId={session.id} completed={completed} /> : null}
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

      {tracking && session.accepts_submissions ? (
        <section className="surface-card mt-5 flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-lg font-bold">Ejercicio de la clase</h2>
            <p className="mt-0.5 text-sm text-muted">
              {submission
                ? `Enviado el ${formatDateTime(submission.updated_at)}${submission.grade ? ` · Calificación: ${submission.grade}` : ""}`
                : session.due_at
                  ? `Entrega hasta ${formatDateTime(session.due_at)}`
                  : "Sube tu ejercicio cuando lo tengas."}
            </p>
          </div>
          <ButtonLink
            href={`${courseHref}/${session.position}/entrega`}
            variant={submission ? "ghost" : "primary"}
            icon={submission ? "eye" : "upload"}
          >
            {submission ? "Ver mi entrega" : "Subir ejercicio"}
          </ButtonLink>
        </section>
      ) : null}

      {!enrolled ? (
        <section className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-5 sm:p-6">
          <p className="font-display text-lg font-bold">¿Te gustó la clase?</p>
          <p className="text-sm text-muted">
            {course.price_cents > 0 ? "Obtén" : "Inscríbete gratis a"} <strong className="text-fg">{course.title}</strong>{" "}
            para ver las {lessons.length} clases, descargar el material y guardar tu avance.
          </p>
          <ButtonLink href={courseHref} icon="sparkles" className="w-full sm:w-auto sm:justify-self-start">
            Ver el curso completo
          </ButtonLink>
        </section>
      ) : null}

      <nav aria-label="Otras clases" className="mt-5 grid grid-cols-2 gap-3 sm:mt-6">
        {prev ? (
          <Link
            href={`${courseHref}/${prev.position}`}
            className="surface-card flex min-h-14 items-center gap-2 px-4 py-3 text-sm transition hover:bg-surface-2"
          >
            <Icon name="chevronLeft" className="h-4 w-4 shrink-0 text-subtle" />
            <span className="min-w-0">
              <span className="block text-xs text-subtle">Clase {prev.position}</span>
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
              <span className="block text-xs text-subtle">Clase {next.position}</span>
              <span className="block truncate font-medium">{next.title}</span>
            </span>
            <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-subtle" />
          </Link>
        ) : null}
      </nav>
    </>
  );
}
