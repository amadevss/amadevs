import Link from "next/link";
import { listVisibleCourses } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";

export const dynamic = "force-dynamic";

export default async function CursosPage() {
  const [courses, base] = await Promise.all([listVisibleCourses(), coursesBasePath()]);

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Cursos</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Mis cursos</h1>
      </header>

      {courses.length === 0 ? (
        <p className="text-muted">Todavía no hay cursos publicados.</p>
      ) : (
        <div className="grid gap-4">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`${base}/${c.slug}`}
              className="surface-card block p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:p-6"
            >
              <h2 className="font-display text-lg font-bold">{c.title}</h2>
              {c.description ? <p className="mt-1 text-sm text-muted">{c.description}</p> : null}
              <p className="mt-3 text-xs font-medium text-subtle">
                {c.session_count} {c.session_count === 1 ? "sesión" : "sesiones"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
