import { notFound, redirect } from "next/navigation";
import { getVisibleCourse, getVisibleSession } from "./queries";
import { coursesBasePath } from "./server";
import { getCurrentStudent, isEnrolled } from "./students";

/** Curso + sesión visibles para un alumno inscrito; si no, 404 o al curso. */
export async function loadStudentSession(curso: string, sesion: string) {
  const position = Number(sesion);
  if (!Number.isInteger(position)) notFound();
  const course = await getVisibleCourse(curso);
  if (!course) notFound();
  const session = await getVisibleSession(course.id, position);
  if (!session) notFound();
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  // Solo alumnos inscritos; si no, al curso (ahí se registra o inscribe).
  if (!student || !(await isEnrolled(course.id, student.id))) redirect(`${base}/${course.slug}`);
  return { course, session, student, base };
}

/** Para metadata: no redirige ni lanza 404. */
export async function peekSessionTitle(curso: string, sesion: string): Promise<string | null> {
  const position = Number(sesion);
  if (!Number.isInteger(position)) return null;
  const course = await getVisibleCourse(curso);
  if (!course) return null;
  const session = await getVisibleSession(course.id, position);
  return session ? `${session.title} · ${course.title}` : null;
}
