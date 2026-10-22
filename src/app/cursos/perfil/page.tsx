import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { attendancePercent, getStudentProfile } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE } from "@/lib/cursos/shared";
import { ChangePasswordForm } from "@/components/cursos/StudentActions";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  if (!student) redirect(base || "/");
  const courses = await getStudentProfile(student.id);

  return (
    <div className="grid gap-5 sm:gap-6">
      <header>
        <p className="eyebrow">Mi perfil</p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">{student.full_name}</h1>
        <p className="mt-1 break-all text-sm text-muted">{student.email}</p>
      </header>

      {courses.map((c) => {
        const pct = attendancePercent(c.sessions.map((s) => s.attendance));
        return (
          <section key={c.id} className="surface-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <Link href={`${base}/${c.slug}`} className="font-display text-lg font-bold hover:text-primary-ink">
                {c.title}
              </Link>
              <div className="shrink-0 text-right">
                <p className="font-display text-xl font-bold">{pct === null ? "—" : `${pct}%`}</p>
                <p className="text-[11px] uppercase tracking-wide text-subtle">asistencia</p>
              </div>
            </div>
            {c.sessions.length > 0 ? (
              <ul className="mt-4 divide-y divide-border">
                {c.sessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`${base}/${c.slug}/${s.position}`}
                      className="flex min-h-12 items-center gap-3 py-2 text-sm"
                    >
                      <span className="w-6 shrink-0 text-center text-xs font-bold text-subtle">{s.position}</span>
                      <span className="min-w-0 flex-1 truncate">{s.title}</span>
                      {s.attendance ? (
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${ATTENDANCE_TONE[s.attendance]}`}>
                          {ATTENDANCE_LABEL[s.attendance]}
                        </span>
                      ) : null}
                      {s.accepts_submissions ? (
                        <span className="w-14 shrink-0 text-right text-xs font-semibold">
                          {s.grade ?? (s.submitted ? "✓" : "—")}
                        </span>
                      ) : (
                        <span className="w-14 shrink-0" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}

      <section className="surface-card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-base font-bold">Cambiar contraseña</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
