import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStudentProfile } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { EmptyState } from "@/components/ui/kit";
import CourseProgress from "@/components/cursos/CourseProgress";

export const metadata: Metadata = { title: "Mi avance" };
export const dynamic = "force-dynamic";

export default async function AvancePage() {
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
    <div className="grid grid-cols-1 gap-5">
      {courses.map((c) => (
        <CourseProgress key={c.id} course={c} base={base} now={now} />
      ))}
    </div>
  );
}
