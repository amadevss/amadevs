import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCourse } from "@/lib/dashboard/cursos";
import { listCourseStudents } from "@/lib/cursos/queries";
import { CourseStudentsPanel } from "@/components/dashboard/cursos/StudentsPanels";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await loadCourse((await params).id);
  return { title: course ? `Alumnos · ${course.title}` : "Alumnos" };
}

export default async function CursoAlumnosPage({ params }: Props) {
  const course = await loadCourse((await params).id);
  if (!course) notFound();
  const students = await listCourseStudents(course.id);
  return <CourseStudentsPanel courseId={course.id} students={students} />;
}
