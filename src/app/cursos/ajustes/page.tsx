import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { FIELD_LABEL, PageHeader, Section } from "@/components/ui/kit";
import { ChangePasswordForm } from "@/components/cursos/StudentActions";
import AppearancePicker from "@/components/cursos/AppearancePicker";

export const metadata: Metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  if (!student) redirect(`${base}/entrar`);
  const initials = student.full_name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <PageHeader title="Ajustes" description="Tu cuenta, contraseña y apariencia." />
      <div className="grid grid-cols-1 gap-5">
        <Section title="Cuenta">
          <div className="flex items-center gap-4">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-lg font-bold text-white"
              style={{ background: "var(--grad)" }}
            >
              {initials}
            </span>
            <dl className="grid min-w-0 grid-cols-1 gap-2">
              <div>
                <dt className={FIELD_LABEL}>Nombre</dt>
                <dd className="font-medium">{student.full_name}</dd>
              </div>
              <div>
                <dt className={FIELD_LABEL}>Correo</dt>
                <dd className="break-all text-sm text-muted">{student.email}</dd>
              </div>
            </dl>
          </div>
        </Section>

        <Section title="Cambiar contraseña">
          <p className="-mt-2 mb-5 text-sm text-muted">
            Al cambiarla cerramos tu sesión en otros dispositivos. Este se queda abierto.
          </p>
          <ChangePasswordForm />
        </Section>

        <Section title="Apariencia">
          <AppearancePicker />
        </Section>
      </div>
    </>
  );
}
