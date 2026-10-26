import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { deleteBlobs, hasDashboardSession } from "@/lib/cursos/server";
import {
  getSessionStudent,
  getStudentSubmission,
  listSubmissions,
  upsertTeacherSubmission,
} from "@/lib/cursos/queries";
import { MAX_SUBMISSION_FILES, submissionFolder } from "@/lib/cursos/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  return NextResponse.json({ submissions: await listSubmissions(id) });
}

/**
 * El profesor crea o edita la entrega de un alumno inscrito: comentario,
 * archivos que el navegador ya subió a Blob, fecha de entrega y, opcional,
 * calificación. Si no manda `grade`/`feedback` se conservan los que había.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id: sessionId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return bad("JSON inválido");

  const student = await getSessionStudent(sessionId, String(body.studentId ?? ""));
  if (!student) return bad("El alumno no está inscrito en este curso", 404);

  const comment = String(body.comment ?? "").trim().slice(0, 5000);
  const files: { pathname: string; filename: string }[] = Array.isArray(body.files)
    ? body.files.map((f: { pathname?: unknown; filename?: unknown }) => ({
        pathname: String(f?.pathname ?? ""),
        filename: String(f?.filename ?? "").trim().slice(0, 200),
      }))
    : [];
  if (files.length === 0 && !comment) return bad("Adjunta al menos un archivo o un comentario");
  if (files.length > MAX_SUBMISSION_FILES) return bad(`Máximo ${MAX_SUBMISSION_FILES} archivos`);
  const folder = submissionFolder(sessionId, student.id);
  if (files.some((f) => !f.pathname.startsWith(folder))) return bad("Archivo inválido");

  const submittedAt = body.submittedAt ? new Date(String(body.submittedAt)) : new Date();
  if (Number.isNaN(submittedAt.getTime())) return bad("Fecha de entrega inválida");
  if (submittedAt.getTime() > Date.now() + 5 * 60 * 1000) return bad("La fecha de entrega no puede ser futura");

  const existing = await getStudentSubmission(sessionId, student.id);
  const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max) || null;
  const grade = "grade" in body ? text(body.grade, 40) : (existing?.grade ?? null);
  const feedback = "feedback" in body ? text(body.feedback, 5000) : (existing?.feedback ?? null);

  try {
    const withMeta = await Promise.all(
      files.map(async (f) => {
        const meta = await head(f.pathname);
        return {
          pathname: f.pathname,
          filename: f.filename || f.pathname.split("/").pop() || "archivo",
          content_type: meta.contentType || "application/octet-stream",
          size: meta.size,
        };
      }),
    );
    const { id, oldPathnames } = await upsertTeacherSubmission(sessionId, student, {
      comment,
      files: withMeta,
      grade,
      feedback,
      submittedAt: submittedAt.toISOString(),
    });
    await deleteBlobs(oldPathnames);
    return NextResponse.json({ ok: true, id, created: !existing });
  } catch (err) {
    console.error("[dashboard/cursos] teacher submission", err);
    return bad("No se pudo guardar la entrega", 500);
  }
}
