import Link from "next/link";
import { isPaid, nextLesson, type Course, type CourseSession, type LessonProgress } from "@/lib/cursos/queries";
import type { Purchase } from "@/lib/cursos/payments";
import { formatDuration } from "@/lib/cursos/shared";
import { formatMoney } from "@/lib/agenda/format";
import { Badge, Breadcrumbs, ButtonLink, EmptyState, ProgressBar } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import { BuyButton, EnrollButton } from "./StudentActions";
import { CourseCover, CourseFacts } from "./Catalog";

type Props = {
  course: Course;
  lessons: CourseSession[];
  progress: LessonProgress[];
  base: string;
  loggedIn: boolean;
  enrolled: boolean;
  /** Última compra del alumno para este curso (si hay). */
  purchase?: Purchase | null;
  /** Resultado al volver de Stripe. */
  justPaid?: "paid" | "pending" | null;
};

const METHOD_LABEL: Record<string, string> = { card: "tarjeta", oxxo: "OXXO" };

/** Página de un curso público: portada, inscripción o avance, y temario. */
export default function PublicCourse({ course, lessons, progress, base, loggedIn, enrolled, purchase, justPaid }: Props) {
  const paid = isPaid(course);
  const price = paid ? formatMoney(course.price_cents, course.currency) : null;
  const pendingOxxo = !enrolled && purchase?.status === "pending" && purchase.voucher_url ? purchase : null;
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

      {justPaid === "paid" && enrolled ? (
        <p className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Icon name="check" className="h-5 w-5 shrink-0" />
          ¡Pago recibido! Ya tienes acceso a todo el curso. Te enviamos el recibo por correo.
        </p>
      ) : null}

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
              {paid ? (
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <p className="font-display text-3xl font-bold">{price}</p>
                  <p className="text-xs text-muted">
                    Pago único · acceso permanente
                    {course.installments ? " · meses sin intereses" : ""}
                    {course.payment_methods.length ? ` · ${course.payment_methods.map((m) => METHOD_LABEL[m] ?? m).join(" u ")}` : ""}
                  </p>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm font-semibold text-primary-ink">
                  <Icon name="sparkles" className="h-4 w-4" />
                  Curso gratuito
                </p>
              )}
              {pendingOxxo || justPaid === "pending" ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                  <p className="font-semibold">Tu pago en OXXO está pendiente</p>
                  <p className="mt-0.5">
                    Te damos acceso en cuanto se acredite (puede tardar unas horas después de pagar).
                  </p>
                  {pendingOxxo?.voucher_url ? (
                    <a href={pendingOxxo.voucher_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex font-semibold underline">
                      Ver mi ficha de pago
                    </a>
                  ) : null}
                </div>
              ) : null}
              {loggedIn ? (
                paid ? (
                  <BuyButton courseSlug={course.slug} label={pendingOxxo ? "Pagar de otra forma" : `Comprar por ${price}`} />
                ) : (
                  <EnrollButton courseSlug={course.slug} />
                )
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ButtonLink href={`${base}/registro${qs}`} className="min-h-12 w-full text-base">
                    {paid ? "Crear cuenta y comprar" : "Inscribirme gratis"}
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
