import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import { attendancePercent, getStudentProfile, listCourseCompletion } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { formatDateTime } from "@/lib/cursos/shared";
import { BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import { overallAttendance, pendingDeliveries } from "@/lib/cursos/studentHome";
import { Badge, ButtonLink, EmptyState, PageHeader, Section, StatCard } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import CatalogPage from "@/components/cursos/CatalogPage";

export async function generateMetadata(): Promise<Metadata> {
  // Sin sesión, la portada es el catálogo público (se puede indexar).
  return (await getCurrentStudent())
    ? { title: "Inicio" }
    : { title: "Cursos", robots: { index: true, follow: true } };
}
export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  if (!student) return <CatalogPage base={base} />;

  const [courses, completion] = await Promise.all([getStudentProfile(student.id), listCourseCompletion(student.id)]);
  const progressOf = new Map(completion.map((p) => [p.course_id, p]));
  // Curso abierto que el alumno dejó a medias, para "Continuar".
  const resume = completion
    .filter((p) => p.last_session_position !== null && p.completed < p.total)
    .map((p) => ({ p, course: courses.find((c) => c.id === p.course_id) }))
    .find((x) => x.course);
  const now = Date.now();
  const coursesHref = `${base}/mis-cursos`;

  const todo = pendingDeliveries(courses, now);
  const next = todo[0];
  const overdue = todo.filter((x) => x.state === "vencida").length;
  const pending = todo.length - overdue;
  const attendance = overallAttendance(courses);
  const sessionCount = courses.reduce((n, c) => n + c.sessions.length, 0);

  // Sin fecha de calificación: se muestran las sesiones más recientes calificadas.
  const grades = courses
    .flatMap((c) => c.sessions.filter((s) => s.grade).map((s) => ({ course: c, session: s })))
    .reverse()
    .slice(0, 5);

  const today = DateTime.now().setZone(BUSINESS_TIMEZONE);
  const greeting = today.hour < 12 ? "Buenos días" : today.hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <>
      <PageHeader
        title={`${greeting}, ${student.full_name.split(" ")[0]}`}
        description={today.setLocale("es").toFormat("cccc d 'de' LLLL")}
        actions={
          courses.length > 0 ? (
            <ButtonLink href={coursesHref} icon="book" variant="ghost">
              Mis cursos
            </ButtonLink>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Cursos"
          icon="book"
          value={courses.length}
          hint={`${sessionCount} ${sessionCount === 1 ? "sesión" : "sesiones"}`}
          href={coursesHref}
        />
        <StatCard
          label="Pendientes"
          icon="upload"
          tone={pending > 0 ? "warn" : "muted"}
          value={pending}
          hint="entregas a tiempo"
          href={next ? `${base}/${next.course.slug}/${next.session.position}/entrega` : undefined}
        />
        <StatCard
          label="Vencidas"
          icon="clock"
          tone={overdue > 0 ? "bad" : "muted"}
          value={overdue}
          hint="aún puedes enviarlas"
        />
        <StatCard
          label="Asistencia"
          icon="check"
          tone="ok"
          value={attendance === null ? "—" : `${attendance}%`}
          hint="en todos tus cursos"
          href={coursesHref}
        />
      </div>

      {next ? (
        <Link
          href={`${base}/${next.course.slug}/${next.session.position}/entrega`}
          className="mt-5 block overflow-hidden rounded-2xl border border-primary/30 bg-primary-soft p-5 transition active:scale-[0.99] sm:hover:shadow-[var(--shadow-md)]"
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-ink">
            <Icon name="upload" className="h-4 w-4" />
            {next.state === "vencida" ? "Entrega vencida (aún puedes enviarla)" : "Tu próxima entrega"}
          </p>
          <p className="mt-2 font-display text-lg font-bold leading-snug">{next.session.title}</p>
          <p className="mt-0.5 text-sm text-muted">
            {next.course.title} · Sesión {next.session.position}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {next.session.due_at ? `Fecha límite: ${formatDateTime(next.session.due_at)}` : "Sin fecha límite"}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-ink">
              Subir entrega <Icon name="chevronRight" className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ) : null}

      {resume?.course ? (
        <Link
          href={`${base}/${resume.course.slug}/${resume.p.last_session_position}`}
          className="mt-5 flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4 transition active:scale-[0.99] sm:p-5 sm:hover:shadow-[var(--shadow-md)]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-white" style={{ background: "var(--grad)" }}>
            <Icon name="play" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-primary-ink">Continúa donde te quedaste</span>
            <span className="mt-0.5 block truncate font-display text-lg font-bold">{resume.course.title}</span>
            <span className="block text-sm text-muted">
              Clase {resume.p.last_session_position} · {resume.p.completed} de {resume.p.total} vistas
            </span>
          </span>
          <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-subtle" />
        </Link>
      ) : null}

      {courses.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon="book"
            title="Aún no estás inscrito en ningún curso"
            action={
              <ButtonLink href={`${base}/catalogo`} icon="search">
                Explorar cursos
              </ButtonLink>
            }
          >
            Explora los cursos abiertos o abre el enlace que te compartió tu profesor.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Section
            title="Mis cursos"
            action={
              <Link href={coursesHref} className="text-sm font-medium text-primary-ink hover:underline">
                Ver todos
              </Link>
            }
          >
            <ul className="grid grid-cols-1 gap-2">
              {courses.slice(0, 4).map((c) => {
                const pct = attendancePercent(c.sessions.map((s) => s.attendance));
                const left = c.sessions.filter((s) => s.accepts_submissions && !s.submitted).length;
                const lessons = progressOf.get(c.id);
                return (
                  <li key={c.id}>
                    <Link
                      href={`${base}/${c.slug}`}
                      className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 transition hover:border-primary/40 hover:bg-surface-2"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                        style={{ background: "var(--grad)" }}
                      >
                        <Icon name="book" className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{c.title}</span>
                        <span className="block text-xs text-subtle">
                          {c.kind === "publico" && lessons
                            ? `${lessons.completed} de ${lessons.total} clases vistas`
                            : `${c.sessions.length} ${c.sessions.length === 1 ? "sesión" : "sesiones"} · asistencia ${pct === null ? "—" : `${pct}%`}`}
                        </span>
                      </span>
                      {left > 0 ? <Badge tone="warn">{left}</Badge> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section title="Últimas calificaciones">
            {grades.length === 0 ? (
              <EmptyState icon="grade" title="Sin calificaciones todavía">
                Cuando tu profesor califique una entrega, aparecerá aquí.
              </EmptyState>
            ) : (
              <ul className="-mx-2 grid grid-cols-1">
                {grades.map(({ course, session }) => (
                  <li key={session.id}>
                    <Link
                      href={`${base}/${course.slug}/${session.position}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface-2"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-ink">
                        <Icon name="grade" className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{session.title}</span>
                        <span className="block truncate text-xs text-subtle">
                          {course.title} · Sesión {session.position}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 font-display text-sm font-bold text-primary-ink">
                        {session.grade}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </>
  );
}
