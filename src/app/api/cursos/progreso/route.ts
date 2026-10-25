import { NextRequest, NextResponse } from "next/server";
import { getEnrolledSession, saveLessonProgress } from "@/lib/cursos/queries";
import { getCurrentStudent } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Guarda el avance del alumno en una clase: segundo del video donde va y,
 * si viene `completed`, la marca (o desmarca) como vista.
 */
export async function POST(req: NextRequest) {
  const student = await getCurrentStudent();
  if (!student) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const session = await getEnrolledSession(String(body?.sessionId ?? ""), student.id);
  if (!session) return NextResponse.json({ error: "No estás inscrito en este curso" }, { status: 403 });

  // Sin posición (botón "Marcar como vista") se conserva la que había.
  const raw = body?.position == null ? NaN : Math.floor(Number(body.position));
  const position = Number.isFinite(raw) ? Math.max(0, Math.min(raw, 24 * 60 * 60)) : null;
  const completed = typeof body?.completed === "boolean" ? body.completed : undefined;
  const progress = await saveLessonProgress(session.id, student.id, position, completed);
  return NextResponse.json({ progress });
}
