import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courseHref, loadCourse, sessionHref } from "@/lib/dashboard/cursos";
import { formatDateTime, formatDuration } from "@/lib/cursos/shared";
import { Badge, ButtonLink, EmptyState } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await loadCourse((await params).id);
  return { title: course?.title ?? "Curso" };
}

export default async function CursoSesionesPage({ params }: Props) {
  const course = await loadCourse((await params).id);
  if (!course) notFound();
  const newHref = `${courseHref(course.id)}/sesiones/nueva`;
  const isPublic = course.kind === "publico";
  const noun = isPublic ? "clase" : "sesión";

  if (course.sessions.length === 0) {
    return (
      <EmptyState
        icon="layers"
        title={`Este curso aún no tiene ${isPublic ? "clases" : "sesiones"}`}
        action={
          <ButtonLink href={newHref} icon="plus">
            Crear la primera {noun}
          </ButtonLink>
        }
      >
        {isPublic
          ? "Cada clase tiene su video, contenido y materiales. Puedes marcar algunas como muestra gratis."
          : "Cada sesión tiene su contenido, materiales, asistencia y, si quieres, entregas."}
      </EmptyState>
    );
  }

  const now = Date.now();

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {isPublic
            ? "Toca una clase para subir su video y materiales."
            : "Toca una sesión para pasar lista, subir materiales o calificar."}
        </p>
        <ButtonLink href={newHref} icon="plus" className="shrink-0">
          <span className="hidden sm:inline">Nueva {noun}</span>
          <span className="capitalize sm:hidden">{noun}</span>
        </ButtonLink>
      </div>

      <ul className="surface-card divide-y divide-border overflow-hidden">
        {course.sessions.map((s) => {
          const overdue = s.due_at ? new Date(s.due_at).getTime() < now : false;
          return (
            <li key={s.id}>
              <Link
                href={sessionHref(course.id, s.id)}
                className="flex items-center gap-3 px-4 py-4 transition hover:bg-surface-2 sm:gap-4"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    s.hidden ? "bg-surface-2 text-subtle" : "text-white"
                  }`}
                  style={s.hidden ? undefined : { background: "var(--grad)" }}
                >
                  {s.position}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{s.title}</span>
                    {s.hidden ? <Badge tone="muted">Oculta</Badge> : null}
                    {isPublic && s.is_preview ? <Badge tone="primary">Muestra gratis</Badge> : null}
                    {isPublic && !s.video_key ? <Badge tone="warn">Sin video</Badge> : null}
                    {s.ungraded_count > 0 ? <Badge tone="warn">{s.ungraded_count} por calificar</Badge> : null}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
                    {isPublic ? (
                      s.video_duration ? (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="video" className="h-3.5 w-3.5" />
                          {formatDuration(s.video_duration)}
                        </span>
                      ) : null
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="users" className="h-3.5 w-3.5" />
                        Asistencia {s.attendance_count}/{course.student_count}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Icon name="file" className="h-3.5 w-3.5" />
                      {s.material_count} {s.material_count === 1 ? "material" : "materiales"}
                    </span>
                    {s.accepts_submissions ? (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="upload" className="h-3.5 w-3.5" />
                        {s.submission_count} {s.submission_count === 1 ? "entrega" : "entregas"}
                      </span>
                    ) : null}
                    {s.accepts_submissions && s.due_at ? (
                      <span
                        className={`inline-flex items-center gap-1 ${overdue ? "" : "text-amber-700 dark:text-amber-400"}`}
                      >
                        <Icon name="clock" className="h-3.5 w-3.5" />
                        {overdue ? "Cerró" : "Vence"} {formatDateTime(s.due_at)}
                      </span>
                    ) : null}
                  </span>
                </span>
                <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-subtle" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
