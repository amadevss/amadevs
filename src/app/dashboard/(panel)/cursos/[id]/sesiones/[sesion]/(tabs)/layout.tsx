import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboard } from "@/lib/dashboard/auth";
import { courseHref, loadCourse, loadSession, sessionHref } from "@/lib/dashboard/cursos";
import { formatDateTime } from "@/lib/cursos/shared";
import { Badge, ButtonLink, PageHeader } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import RouteTabs from "@/components/ui/RouteTabs";
import DeleteButton from "@/components/dashboard/DeleteButton";

export default async function SesionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string; sesion: string }>;
}) {
  const { id, sesion } = await params;
  await requireDashboard();
  const [session, course] = await Promise.all([loadSession(id, sesion), loadCourse(id)]);
  if (!session || !course) notFound();

  const href = sessionHref(course.id, session.id);
  const idx = course.sessions.findIndex((s) => s.id === session.id);
  const prev = course.sessions[idx - 1];
  const next = course.sessions[idx + 1];
  const overdue = session.due_at ? new Date(session.due_at).getTime() < Date.now() : false;

  const tabs = [
    { href, label: "Asistencia", count: session.attendance_count, exact: true },
    { href: `${href}/materiales`, label: "Materiales", count: session.material_count },
  ];
  if (session.accepts_submissions || session.submission_count > 0) {
    tabs.push({ href: `${href}/entregas`, label: "Entregas", count: session.submission_count });
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Cursos", href: "/dashboard/cursos" },
          { label: course.title, href: courseHref(course.id) },
          { label: `Sesión ${session.position}` },
        ]}
        title={session.title}
        badge={session.hidden ? <Badge tone="muted">Oculta</Badge> : null}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Sesión {session.position}</span>
            {session.accepts_submissions ? (
              session.due_at ? (
                <span className={`inline-flex items-center gap-1 ${overdue ? "text-subtle" : "text-amber-700 dark:text-amber-400"}`}>
                  <Icon name="clock" className="h-3.5 w-3.5" />
                  {overdue ? "Entregas cerraron" : "Entregas hasta"} {formatDateTime(session.due_at)}
                </span>
              ) : (
                <span>Recibe entregas sin fecha límite</span>
              )
            ) : (
              <span>Sin entregas</span>
            )}
          </span>
        }
        actions={
          <>
            <ButtonLink href={`${href}/editar`} variant="ghost" icon="edit">
              Editar
            </ButtonLink>
            {!session.hidden && !course.hidden ? (
              <ButtonLink href={`/cursos/${course.slug}/${session.position}`} variant="ghost" icon="external" external>
                Ver
              </ButtonLink>
            ) : null}
            <DeleteButton
              variant="button"
              url={`/api/dashboard/cursos/sesiones/${session.id}`}
              title={`¿Eliminar la sesión ${session.position}?`}
              message="Se borran sus materiales, entregas (con archivos) y asistencia. No se puede deshacer."
              confirmLabel="Eliminar sesión"
              success="Sesión eliminada"
              redirectTo={courseHref(course.id)}
            />
          </>
        }
      />

      <RouteTabs label="Secciones de la sesión" tabs={tabs} />
      {children}

      {prev || next ? (
        <nav aria-label="Otras sesiones" className="mt-8 grid grid-cols-2 gap-3">
          {prev ? (
            <Link
              href={sessionHref(course.id, prev.id)}
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
              href={sessionHref(course.id, next.id)}
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
      ) : null}
    </>
  );
}
