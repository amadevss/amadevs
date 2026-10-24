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
import { DELIVERY_LABEL, DELIVERY_TONE, deliveryState } from "@/lib/cursos/status";
import { Badge, Breadcrumbs, ButtonLink, EmptyState, ProgressBar } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
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
      {enrolled ? <Breadcrumbs items={[{ label: "Mis cursos", href: `${base}/mis-cursos` }, { label: course.title }]} /> : <p className="eyebrow mb-3">Curso</p>}
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
      {course.description ? <p className="mt-3 whitespace-pre-line text-muted">{course.description}</p> : null}
    </header>
  );

  if (!student) {
    const qs = `?curso=${encodeURIComponent(course.slug)}`;
    return (
      <div className="mx-auto max-w-md">
        {header}
        <div className="surface-card grid grid-cols-1 gap-4 p-5 sm:p-6">
          <p className="flex items-start gap-3 text-sm text-muted">
            <span className="grid grid-cols-1 h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-ink">
              <Icon name="lock" className="h-4 w-4" />
            </span>
            Para ver las sesiones y entregar tareas necesitas una cuenta. Te inscribimos al curso en el mismo paso.
          </p>
          <ButtonLink href={`${base}/registro${qs}`} className="w-full min-h-12 text-base">
            Crear cuenta e inscribirme
          </ButtonLink>
          <ButtonLink href={`${base}/entrar${qs}`} variant="ghost" className="w-full">
            Ya tengo cuenta
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="mx-auto max-w-md">
        {header}
        <div className="surface-card grid grid-cols-1 gap-4 p-5 sm:p-6">
          <p className="text-sm text-muted">Aún no estás inscrito en este curso. Inscríbete para ver sus sesiones.</p>
          <EnrollButton courseSlug={course.slug} />
        </div>
      </div>
    );
  }

  const [sessions, statuses] = await Promise.all([
    listVisibleSessions(course.id),
    listStudentSessionStatus(course.id, student.id),
  ]);
  const byId = new Map(statuses.map((s) => [s.session_id, s]));
  const pct = attendancePercent(statuses.map((s) => s.attendance));
  const now = Date.now();
  const withDelivery = sessions.filter((s) => s.accepts_submissions);
  const done = withDelivery.filter((s) => byId.get(s.id)?.submitted).length;

  return (
    <>
      {header}

      {sessions.length > 0 ? (
        <section className="surface-card mb-6 grid grid-cols-1 gap-4 p-4 sm:p-5">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-subtle">Asistencia</dt>
              <dd className="font-display text-2xl font-bold">{pct === null ? "—" : `${pct}%`}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-subtle">Entregas</dt>
              <dd className="font-display text-2xl font-bold">
                {done}/{withDelivery.length}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-subtle">Sesiones</dt>
              <dd className="font-display text-2xl font-bold">{sessions.length}</dd>
            </div>
          </dl>
          {withDelivery.length > 0 ? <ProgressBar value={(done / withDelivery.length) * 100} label="Entregas hechas" /> : null}
        </section>
      ) : null}

      {sessions.length === 0 ? (
        <EmptyState icon="clock" title="Aún no hay sesiones publicadas">
          Tu profesor las irá publicando; vuelve pronto.
        </EmptyState>
      ) : (
        <ol className="grid grid-cols-1 gap-3">
          {sessions.map((s) => {
            const st = byId.get(s.id);
            const state = deliveryState(s, st, now);
            return (
              <li key={s.id}>
                <Link
                  href={`${base}/${course.slug}/${s.position}`}
                  className="surface-card flex items-start gap-3 p-4 transition active:scale-[0.99] sm:gap-4 sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-[var(--shadow-md)]"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      state === "calificada" || state === "entregada" ? "bg-emerald-500 text-white" : "text-white"
                    }`}
                    style={state === "calificada" || state === "entregada" ? undefined : { background: "var(--grad)" }}
                  >
                    {state === "calificada" || state === "entregada" ? <Icon name="check" className="h-5 w-5" /> : s.position}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-subtle">Sesión {s.position}</span>
                    <span className="block font-semibold leading-snug">{s.title}</span>
                    {s.description ? (
                      <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{s.description}</span>
                    ) : null}
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {state !== "ninguna" ? (
                        <Badge tone={DELIVERY_TONE[state]}>
                          {state === "calificada" && st?.grade ? `Calificación: ${st.grade}` : DELIVERY_LABEL[state]}
                          {state === "pendiente" && s.due_at ? ` · ${formatDateTime(s.due_at)}` : ""}
                        </Badge>
                      ) : null}
                      {st?.attendance ? (
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ATTENDANCE_TONE[st.attendance]}`}>
                          {ATTENDANCE_LABEL[st.attendance]}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <Icon name="chevronRight" className="mt-3 h-5 w-5 shrink-0 text-subtle" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
