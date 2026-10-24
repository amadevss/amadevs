import { NextRequest, NextResponse } from "next/server";
import { canSelfEnroll, getVisibleCourse } from "@/lib/cursos/queries";
import { createStudent, enroll, startStudentSession, validateRegistration } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Registro abierto: crea la cuenta, inicia sesión y (si viene) inscribe al curso. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const parsed = validateRegistration(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { email, fullName, password } = parsed.value;
  const student = await createStudent(email, fullName, password);
  if (!student) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo. Inicia sesión." },
      { status: 409 },
    );
  }

  await startStudentSession(student.id);
  const course = body.courseSlug ? await getVisibleCourse(String(body.courseSlug)) : null;
  if (course && canSelfEnroll(course)) await enroll(course.id, student.id);
  return NextResponse.json({ ok: true });
}
