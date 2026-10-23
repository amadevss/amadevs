import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireDashboard } from "@/lib/dashboard/auth";
import { courseHref, loadCourse } from "@/lib/dashboard/cursos";
import { PageHeader } from "@/components/ui/kit";
import { CourseForm } from "@/components/dashboard/cursos/CourseForms";

export const metadata: Metadata = { title: "Editar curso" };
export const dynamic = "force-dynamic";

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireDashboard();
  const course = await loadCourse(id);
  if (!course) notFound();
  return (
    <>
      <PageHeader
        title="Editar curso"
        crumbs={[
          { label: "Cursos", href: "/dashboard/cursos" },
          { label: course.title, href: courseHref(course.id) },
          { label: "Editar" },
        ]}
      />
      <CourseForm course={course} />
    </>
  );
}
