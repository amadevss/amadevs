import { redirect } from "next/navigation";
import { getVisibleCourse } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import AuthForm from "./AuthForms";

/** Página de entrar/registro, compartida por las dos rutas. */
export default async function AuthPage({ mode, curso }: { mode: "entrar" | "registro"; curso?: string }) {
  const [student, base, course] = await Promise.all([
    getCurrentStudent(),
    coursesBasePath(),
    curso ? getVisibleCourse(curso) : Promise.resolve(null),
  ]);
  if (student) redirect(course ? `${base}/${course.slug}` : base || "/");

  const registering = mode === "registro";
  return (
    <div className="mx-auto max-w-md">
      <header className="mb-6">
        <p className="eyebrow">{course ? "Inscripción" : "Cursos"}</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          {registering ? "Crea tu cuenta" : "Entra a tus cursos"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {course ? (
            <>
              {registering ? "Regístrate" : "Entra"} para inscribirte a <strong className="text-fg">{course.title}</strong>.
            </>
          ) : registering ? (
            "Con tu cuenta verás tus sesiones, materiales y entregas."
          ) : (
            "Usa el correo y la contraseña con los que te registraste."
          )}
        </p>
      </header>
      <AuthForm mode={mode} base={base} courseSlug={course?.slug} />
      {!course && registering ? (
        <p className="mt-4 text-center text-xs text-subtle">
          Para inscribirte a un curso usa el enlace que te compartió tu profesor.
        </p>
      ) : null}
    </div>
  );
}
