import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { PageHeader } from "@/components/ui/kit";
import RouteTabs from "@/components/ui/RouteTabs";

export default async function MisCursosLayout({ children }: { children: ReactNode }) {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  if (!student) redirect(`${base}/entrar`);
  return (
    <>
      <PageHeader title="Mis cursos" description="Tus cursos, entregas, asistencia y calificaciones." />
      <RouteTabs
        label="Mis cursos"
        tabs={[
          { href: `${base}/mis-cursos`, label: "Cursos", exact: true },
          { href: `${base}/mis-cursos/avance`, label: "Mi avance" },
        ]}
      />
      {children}
    </>
  );
}
