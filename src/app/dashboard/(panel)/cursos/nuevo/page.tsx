import type { Metadata } from "next";
import { requireDashboard } from "@/lib/dashboard/auth";
import { PageHeader } from "@/components/ui/kit";
import { CourseForm } from "@/components/dashboard/cursos/CourseForms";

export const metadata: Metadata = { title: "Nuevo curso" };
export const dynamic = "force-dynamic";

export default async function NuevoCursoPage() {
  await requireDashboard("/dashboard/cursos/nuevo");
  return (
    <>
      <PageHeader
        title="Nuevo curso"
        description="Después de crearlo podrás agregar sesiones y compartir el enlace."
        crumbs={[{ label: "Cursos", href: "/dashboard/cursos" }, { label: "Nuevo" }]}
      />
      <CourseForm />
    </>
  );
}
