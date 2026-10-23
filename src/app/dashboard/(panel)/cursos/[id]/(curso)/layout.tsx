import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireDashboard } from "@/lib/dashboard/auth";
import { courseHref, loadCourse } from "@/lib/dashboard/cursos";
import { COURSES_PUBLIC_ORIGIN } from "@/lib/cursos/shared";
import { ButtonLink, PageHeader, VisibilityBadge } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import RouteTabs from "@/components/ui/RouteTabs";
import CopyLinkButton from "@/components/dashboard/cursos/CopyLinkButton";
import DeleteButton from "@/components/dashboard/DeleteButton";

export default async function CursoLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboard();
  const course = await loadCourse(id);
  if (!course) notFound();
  const href = courseHref(course.id);
  const publicUrl = `${COURSES_PUBLIC_ORIGIN}/${course.slug}`;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Cursos", href: "/dashboard/cursos" }, { label: course.title }]}
        title={course.title}
        badge={<VisibilityBadge hidden={course.hidden} />}
        description={course.description ? <span className="line-clamp-2">{course.description}</span> : null}
        actions={
          <>
            <ButtonLink href={`${href}/editar`} variant="ghost" icon="edit">
              Editar
            </ButtonLink>
            <DeleteButton
              variant="button"
              url={`/api/dashboard/cursos/${course.id}`}
              title={`¿Eliminar "${course.title}"?`}
              message="Se borran todas sus sesiones, materiales, entregas y asistencia. Las cuentas de los alumnos se conservan. No se puede deshacer."
              confirmLabel="Eliminar curso"
              success="Curso eliminado"
              redirectTo="/dashboard/cursos"
            />
          </>
        }
      />

      <div className="surface-card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <span className="grid grid-cols-1 h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-ink">
          <Icon name="link" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Enlace de inscripción</p>
          <p className="break-all font-mono text-sm">{publicUrl.replace("https://", "")}</p>
          {course.hidden ? (
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              El curso está oculto: nadie puede inscribirse hasta que lo publiques.
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <CopyLinkButton url={publicUrl} />
          <ButtonLink href={`/cursos/${course.slug}`} variant="ghost" icon="external" external>
            <span className="sm:hidden lg:inline">Ver</span>
          </ButtonLink>
        </div>
      </div>

      <RouteTabs
        label="Secciones del curso"
        tabs={[
          { href, label: "Sesiones", count: course.sessions.length, exact: true },
          { href: `${href}/alumnos`, label: "Alumnos", count: course.student_count },
        ]}
      />
      {children}
    </>
  );
}
