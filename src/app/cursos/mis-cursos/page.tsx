import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { attendancePercent, getStudentProfile, listCourseCompletion } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { Badge, ButtonLink, EmptyState, ProgressBar } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

export const metadata: Metadata = { title: "Mis cursos" };
export const dynamic = "force-dynamic";

export default async function MisCursosPage() {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  if (!student) redirect(`${base}/entrar`);
  const [courses, completion] = await Promise.all([getStudentProfile(student.id), listCourseCompletion(student.id)]);
  const progressOf = new Map(completion.map((p) => [p.course_id, p]));

  if (courses.length === 0) {
    return (
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
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {courses.map((c) => {
        const withDelivery = c.sessions.filter((s) => s.accepts_submissions);
        const done = withDelivery.filter((s) => s.submitted).length;
        const pending = withDelivery.length - done;
        const pct = attendancePercent(c.sessions.map((s) => s.attendance));
        const lessons = c.kind === "publico" ? progressOf.get(c.id) : undefined;
        return (
          <li key={c.id}>
            <Link
              href={`${base}/${c.slug}`}
              className="surface-card grid h-full grid-cols-1 content-between gap-4 p-5 transition active:scale-[0.99] sm:p-6 sm:hover:-translate-y-0.5 sm:hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white"
                  style={{ background: "var(--grad)" }}
                >
                  <Icon name="book" className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-bold leading-snug">{c.title}</h2>
                  <p className="text-xs text-subtle">
                    {c.sessions.length} {c.sessions.length === 1 ? "sesión" : "sesiones"}
                  </p>
                </div>
                {pending > 0 ? <Badge tone="warn">{pending} pendientes</Badge> : null}
              </div>
              {lessons ? (
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Clases vistas</span>
                    <span className="font-semibold text-fg">
                      {lessons.completed} de {lessons.total}
                    </span>
                  </div>
                  <ProgressBar value={lessons.total ? (lessons.completed / lessons.total) * 100 : 0} label="Clases vistas" />
                </div>
              ) : null}
              {withDelivery.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Entregas</span>
                    <span className="font-semibold text-fg">
                      {done} de {withDelivery.length}
                    </span>
                  </div>
                  <ProgressBar value={(done / withDelivery.length) * 100} label="Entregas" />
                </div>
              ) : null}
              <div className="flex items-center justify-between text-sm">
                {lessons ? (
                  <span className="text-muted">Curso abierto</span>
                ) : (
                  <span className="text-muted">
                    Asistencia: <strong className="text-fg">{pct === null ? "—" : `${pct}%`}</strong>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-medium text-primary-ink">
                  {lessons && lessons.completed > 0 && lessons.completed < lessons.total ? "Continuar" : "Abrir"} <Icon name="chevronRight" className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
