import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVisibleCourse, listVisibleSessions } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { formatDateTime } from "@/lib/cursos/shared";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ curso: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getVisibleCourse((await params).curso);
  return course ? { title: course.title, description: course.description } : {};
}

export default async function CursoPage({ params }: Props) {
  const course = await getVisibleCourse((await params).curso);
  if (!course) notFound();
  const [sessions, base] = await Promise.all([listVisibleSessions(course.id), coursesBasePath()]);

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Curso</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
        {course.description ? (
          <p className="mt-3 whitespace-pre-line text-muted">{course.description}</p>
        ) : null}
      </header>

      {sessions.length === 0 ? (
        <p className="text-muted">Aún no hay sesiones publicadas.</p>
      ) : (
        <ol className="grid gap-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`${base}/${course.slug}/${s.position}`}
                className="surface-card flex items-start gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:p-5"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ background: "var(--grad)" }}
                >
                  {s.position}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{s.title}</span>
                  {s.description ? (
                    <span className="mt-0.5 block text-sm text-muted line-clamp-2">{s.description}</span>
                  ) : null}
                  {s.accepts_submissions && s.due_at ? (
                    <span className="mt-1 block text-xs text-subtle">Entrega: {formatDateTime(s.due_at)}</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
