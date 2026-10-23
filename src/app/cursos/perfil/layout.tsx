import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import RouteTabs from "@/components/ui/RouteTabs";

export default async function PerfilLayout({ children }: { children: ReactNode }) {
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
      <header className="mb-6 flex items-center gap-4">
        <span
          className="grid grid-cols-1 h-14 w-14 shrink-0 place-items-center rounded-full font-display text-lg font-bold text-white"
          style={{ background: "var(--grad)" }}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{student.full_name}</h1>
          <p className="break-all text-sm text-muted">{student.email}</p>
        </div>
      </header>
      <RouteTabs
        label="Perfil"
        tabs={[
          { href: `${base}/perfil`, label: "Mi avance", exact: true },
          { href: `${base}/perfil/seguridad`, label: "Contraseña" },
        ]}
      />
      {children}
    </>
  );
}
