import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCourse } from "@/lib/dashboard/cursos";
import { CourseForm } from "@/components/dashboard/cursos/CourseForms";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await loadCourse((await params).id);
  return { title: course ? `Editar · ${course.title}` : "Editar curso" };
}

export default async function EditarCursoPage({ params }: Props) {
  const course = await loadCourse((await params).id);
  if (!course) notFound();
  return <CourseForm course={course} />;
}
