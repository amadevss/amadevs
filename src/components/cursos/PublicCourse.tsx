import Link from "next/link";
import { nextLesson, type Course, type CourseSession, type LessonProgress } from "@/lib/cursos/queries";
import { formatDuration } from "@/lib/cursos/shared";
import { Badge, Breadcrumbs, ButtonLink, EmptyState, ProgressBar } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import { EnrollButton } from "./StudentActions";
import { CourseCover, CourseFacts } from "./Catalog";

type Props = {
  course: Course;
  lessons: CourseSession[];
  progress: LessonProgress[];
  base: string;
  loggedIn: boolean;
  enrolled: boolean;
};

/** Página de un curso público: portada, inscripción o avance, y temario. */
export default function PublicCourse({ course, lessons, progress, base, loggedIn, enrolled }: Props) {
  const courseHref = `${base}/${course.slug}`;
  const byId = new Map(progress.map((p) => [p.session_id, p]));
  const completed = lessons.filter((l) => byId.get(l.id)?.completed_at).length;
  const totalSeconds = lessons.reduce((n, l) => n + (l.video_duration ?? 0), 0);
  const next = nextLesson(lessons, progress);
  const started = progress.length > 0;
  const qs = `?curso=${encodeURIComponent(course.slug)}`;

  return (
    <>
      {enrolled ? (
        <Breadcrumbs items={[{ label: "Mis cursos", href: `${base}/mis-cursos` }, { label: course.title }]} />
      ) : (
        <Breadcrumbs items={[{ label: "Cursos", href: `${base}/catalogo` }, { label: course.title }]} />
      )}

      <section className="surface-card overflow-hidden">
        <CourseCover pathname={course.cover_pathname} title={course.title} />
        <div className="grid grid-cols-1 gap-5 p-5 sm:p-8">
          <header>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
            {course.summary ? <p className="mt-2 text-lg text-muted">{course.summary}</p> : null}
            <div className="mt-3">
              <CourseFacts lessons={lessons.length} seconds={totalSeconds} />
            </div>
          </header>

          {enrolled ? (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface-2 p-4 sm:p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Tu avance</span>
                <span className="font-semibold">
                  {completed} de {lessons.length} clases
                </span>
              </div>
              <ProgressBar value={lessons.length ? (completed / lessons.length) * 100 : 0} label="Clases vistas" />
              {next ? (
                <ButtonLink href={`${courseHref}/${next.position}`} icon="play" className="min-h-12 w-full text-base sm:w-auto sm:justify-self-start">
                  {completed === lessons.length ? "Repasar el curso" : started ? `Continuar: clase ${next.position}` : "Empezar el curso"}
                </ButtonLink>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-4 sm:p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary-ink">
                <Icon name="sparkles" className="h-4 w-4" />
                Curso gratuito
              </p>
              {loggedIn ? (
                <EnrollButton courseSlug={course.slug} />
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ButtonLink href={`${base}/registro${qs}`} className="min-h-12 w-full text-base">
                    Inscribirme gratis
                  </ButtonLink>
                  <ButtonLink href={`${base}/entrar${qs}`} variant="ghost" className="min-h-12 w-full">
                    Ya tengo cuenta
                  </ButtonLink>
                </div>
              )}
            </div>
          )}

          {course.description ? <p className="whitespace-pre-line text-muted">{course.description}</p> : null}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-xl font-bold">Temario</h2>
        {lessons.length === 0 ? (
          <EmptyState icon="clock" title="Aún no hay clases publicadas">
            Las clases se irán publicando; vuelve pronto.
          </EmptyState>
        ) : (
          <ol className="surface-card divide-y divide-border overflow-hidden">
            {lessons.map((l) => {
              const p = byId.get(l.id);
              const done = !!p?.completed_at;
              const open = enrolled || l.is_preview;
              const inner = (
                <>
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      done ? "bg-emerald-500 text-white" : open ? "text-white" : "bg-surface-2 text-subtle"
                    }`}
                    style={!done && open ? { background: "var(--grad)" } : undefined}
                  >
                    {done ? <Icon name="check" className="h-4 w-4" /> : open ? l.position : <Icon name="lock" className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium leading-snug">{l.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
                      <span>Clase {l.position}</span>
                      {l.video_duration ? (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="video" className="h-3.5 w-3.5" />
                          {formatDuration(l.video_duration)}
                        </span>
                      ) : null}
                      {!enrolled && l.is_preview ? <Badge tone="primary">Muestra gratis</Badge> : null}
                      {enrolled && p && !done && p.position_seconds > 0 ? <Badge tone="info">En curso</Badge> : null}
                    </span>
                  </span>
                  {open ? <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-subtle" /> : null}
                </>
              );
              return (
                <li key={l.id}>
                  {open ? (
                    <Link href={`${courseHref}/${l.position}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2 sm:px-5">
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3.5 opacity-80 sm:px-5">{inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}
