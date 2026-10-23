import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { attendancePercent, getStudentProfile } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE } from "@/lib/cursos/shared";
import { DELIVERY_LABEL, DELIVERY_TONE, deliveryState } from "@/lib/cursos/status";
import { Badge, EmptyState } from "@/components/ui/kit";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  if (!student) redirect(`${base}/entrar`);
  const courses = await getStudentProfile(student.id);

  if (courses.length === 0) {
    return (
      <EmptyState icon="book" title="Aún no tienes cursos">
        Cuando te inscribas verás aquí tu asistencia y calificaciones.
      </EmptyState>
    );
  }

  const now = Date.now();

  return (
    <div className="grid gap-5">
      {courses.map((c) => {
        const pct = attendancePercent(c.sessions.map((s) => s.attendance));
        const graded = c.sessions.filter((s) => s.grade);
        return (
          <section key={c.id} className="surface-card overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-5 pb-3 sm:p-6 sm:pb-4">
              <div className="min-w-0">
                <Link href={`${base}/${c.slug}`} className="font-display text-lg font-bold hover:text-primary-ink">
                  {c.title}
                </Link>
                <p className="text-xs text-subtle">
                  {graded.length} {graded.length === 1 ? "calificación" : "calificaciones"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-2xl font-bold">{pct === null ? "—" : `${pct}%`}</p>
                <p className="text-[11px] uppercase tracking-wide text-subtle">asistencia</p>
              </div>
            </div>
            {c.sessions.length > 0 ? (
              <ul className="divide-y divide-border border-t border-border">
                {c.sessions.map((s) => {
                  const state = deliveryState(s, s, now);
                  return (
                    <li key={s.id}>
                      <Link
                        href={`${base}/${c.slug}/${s.position}`}
                        className="flex min-h-14 items-center gap-3 px-5 py-2 text-sm transition hover:bg-surface-2 sm:px-6"
                      >
                        <span className="w-6 shrink-0 text-center text-xs font-bold text-subtle">{s.position}</span>
                        <span className="min-w-0 flex-1 truncate">{s.title}</span>
                        {s.attendance ? (
                          <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold sm:inline ${ATTENDANCE_TONE[s.attendance]}`}>
                            {ATTENDANCE_LABEL[s.attendance]}
                          </span>
                        ) : null}
                        {state === "calificada" ? (
                          <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 font-display text-sm font-bold text-primary-ink">
                            {s.grade}
                          </span>
                        ) : state !== "ninguna" ? (
                          <Badge tone={DELIVERY_TONE[state]}>{DELIVERY_LABEL[state]}</Badge>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
