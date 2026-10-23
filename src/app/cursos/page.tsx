import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { attendancePercent, getStudentProfile } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { formatDateTime } from "@/lib/cursos/shared";
import { deliveryState } from "@/lib/cursos/status";
import { Badge, EmptyState, ProgressBar } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

export const metadata: Metadata = { title: "Mis cursos" };
export const dynamic = "force-dynamic";

export default async function MisCursosPage() {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  if (!student) redirect(`${base}/entrar`);

  const courses = await getStudentProfile(student.id);
  const now = Date.now();

  // Entregas que aún puede hacer, la más próxima primero.
  const todo = courses
    .flatMap((c) =>
      c.sessions
        .map((s) => ({ course: c, session: s, state: deliveryState(s, s, now) }))
        .filter((x) => x.state === "pendiente" || x.state === "vencida"),
    )
    .sort((a, b) => {
      const da = a.session.due_at ? new Date(a.session.due_at).getTime() : Infinity;
      const db = b.session.due_at ? new Date(b.session.due_at).getTime() : Infinity;
      // Primero las que aún están a tiempo.
      if (a.state !== b.state) return a.state === "pendiente" ? -1 : 1;
      return da - db;
    });
  const next = todo[0];
  const overdue = todo.filter((x) => x.state === "vencida").length;

  return (
    <>
      <header className="mb-6">
        <p className="eyebrow">Mis cursos</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Hola, {student.full_name.split(" ")[0]}
        </h1>
      </header>

      {next ? (
        <Link
          href={`${base}/${next.course.slug}/${next.session.position}/entrega`}
          className="mb-6 block overflow-hidden rounded-2xl border border-primary/30 bg-primary-soft p-5 transition active:scale-[0.99] sm:hover:shadow-[var(--shadow-md)]"
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-ink">
            <Icon name="upload" className="h-4 w-4" />
            {next.state === "vencida" ? "Entrega vencida (aún puedes enviarla)" : "Tu próxima entrega"}
          </p>
          <p className="mt-2 font-display text-lg font-bold leading-snug">{next.session.title}</p>
          <p className="mt-0.5 text-sm text-muted">
            {next.course.title} · Sesión {next.session.position}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {next.session.due_at ? `Fecha límite: ${formatDateTime(next.session.due_at)}` : "Sin fecha límite"}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-ink">
              Subir entrega <Icon name="chevronRight" className="h-4 w-4" />
            </span>
          </div>
          {todo.length > 1 ? (
            <p className="mt-3 border-t border-primary/20 pt-3 text-xs text-muted">
              Tienes {todo.length} entregas por hacer{overdue ? ` (${overdue} vencidas)` : ""}.
            </p>
          ) : null}
        </Link>
      ) : null}

      {courses.length === 0 ? (
        <EmptyState icon="book" title="Aún no estás inscrito en ningún curso">
          Abre el enlace que te compartió tu profesor para inscribirte.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {courses.map((c) => {
            const withDelivery = c.sessions.filter((s) => s.accepts_submissions);
            const done = withDelivery.filter((s) => s.submitted).length;
            const pending = withDelivery.length - done;
            const pct = attendancePercent(c.sessions.map((s) => s.attendance));
            return (
              <li key={c.id}>
                <Link
                  href={`${base}/${c.slug}`}
                  className="surface-card grid grid-cols-1 gap-4 p-5 transition active:scale-[0.99] sm:p-6 sm:hover:-translate-y-0.5 sm:hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="grid grid-cols-1 h-11 w-11 shrink-0 place-items-center rounded-2xl text-white"
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
                    <span className="text-muted">
                      Asistencia: <strong className="text-fg">{pct === null ? "—" : `${pct}%`}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary-ink">
                      Abrir <Icon name="chevronRight" className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
