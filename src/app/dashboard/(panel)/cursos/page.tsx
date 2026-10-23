import type { Metadata } from "next";
import Link from "next/link";
import { requireDashboard } from "@/lib/dashboard/auth";
import { listCoursesOverview } from "@/lib/cursos/queries";
import { COURSES_PUBLIC_ORIGIN } from "@/lib/cursos/shared";
import { courseHref } from "@/lib/dashboard/paths";
import { Badge, ButtonLink, EmptyState, PageHeader, VisibilityBadge } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import CopyLinkButton from "@/components/dashboard/cursos/CopyLinkButton";

export const metadata: Metadata = { title: "Cursos" };
export const dynamic = "force-dynamic";

export default async function CursosPage() {
  await requireDashboard("/dashboard/cursos");
  const courses = await listCoursesOverview();

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Crea cursos, organiza sus sesiones y comparte el enlace de inscripción."
        actions={
          <ButtonLink href="/dashboard/cursos/nuevo" icon="plus">
            Nuevo curso
          </ButtonLink>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon="book"
          title="Aún no tienes cursos"
          action={
            <ButtonLink href="/dashboard/cursos/nuevo" icon="plus">
              Crear mi primer curso
            </ButtonLink>
          }
        >
          Un curso agrupa sesiones con materiales, entregas y asistencia. Tus alumnos se inscriben con un enlace.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <li key={c.id} className="surface-card flex flex-col overflow-hidden">
              <Link href={courseHref(c.id)} className="group grid flex-1 gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white"
                    style={{ background: "var(--grad)" }}
                  >
                    <Icon name="book" className="h-5 w-5" />
                  </span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {c.ungraded_count > 0 ? <Badge tone="warn">{c.ungraded_count} por calificar</Badge> : null}
                    <VisibilityBadge hidden={c.hidden} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold leading-snug group-hover:text-primary-ink">{c.title}</h2>
                  {c.description ? <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p> : null}
                </div>
                <dl className="grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-3 text-center">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-subtle">Sesiones</dt>
                    <dd className="font-display text-lg font-bold">{c.session_count}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-subtle">Alumnos</dt>
                    <dd className="font-display text-lg font-bold">{c.student_count}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-subtle">Entregas</dt>
                    <dd className="font-display text-lg font-bold">{c.submission_count}</dd>
                  </div>
                </dl>
              </Link>
              <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-1.5">
                <span className="min-w-0 truncate px-2 font-mono text-xs text-subtle">/{c.slug}</span>
                <CopyLinkButton url={`${COURSES_PUBLIC_ORIGIN}/${c.slug}`} compact />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
