import Link from "next/link";
import { listStudentCourses } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import AuthForms from "@/components/cursos/AuthForms";

export const dynamic = "force-dynamic";

export default async function CursosPage() {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);

  if (!student) {
    return (
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <p className="eyebrow">Cursos</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Entra a tus cursos</h1>
          <p className="mt-2 text-sm text-muted">
            Para inscribirte a un curso usa el enlace que te compartió tu profesor.
          </p>
        </header>
        <AuthForms />
      </div>
    );
  }

  const courses = await listStudentCourses(student.id);

  return (
    <>
      <header className="mb-6">
        <p className="eyebrow">Cursos</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Mis cursos</h1>
      </header>

      {courses.length === 0 ? (
        <p className="text-muted">
          Aún no estás inscrito en ningún curso. Abre el enlace que te compartió tu profesor.
        </p>
      ) : (
        <div className="grid gap-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`${base}/${c.slug}`}
              className="surface-card block p-5 transition active:scale-[0.99] sm:p-6 sm:hover:-translate-y-0.5 sm:hover:shadow-[var(--shadow-md)]"
            >
              <h2 className="font-display text-lg font-bold">{c.title}</h2>
              {c.description ? <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p> : null}
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
