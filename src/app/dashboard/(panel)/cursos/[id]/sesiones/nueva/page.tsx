import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireDashboard } from "@/lib/dashboard/auth";
import { courseHref, loadCourse } from "@/lib/dashboard/cursos";
import { PageHeader } from "@/components/ui/kit";
import { SessionForm } from "@/components/dashboard/cursos/CourseForms";

export const metadata: Metadata = { title: "Nueva sesión" };
export const dynamic = "force-dynamic";

export default async function NuevaSesionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireDashboard(`${courseHref(id)}/sesiones/nueva`);
  const course = await loadCourse(id);
  if (!course) notFound();
  const next = Math.max(0, ...course.sessions.map((s) => s.position)) + 1;
  return (
    <>
      <PageHeader
        title="Nueva sesión"
        crumbs={[
          { label: "Cursos", href: "/dashboard/cursos" },
          { label: course.title, href: courseHref(course.id) },
          { label: "Nueva sesión" },
        ]}
      />
      <SessionForm courseId={course.id} nextPosition={next} />
    </>
  );
}
