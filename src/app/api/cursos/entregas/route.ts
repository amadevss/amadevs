import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import {
  getEnrolledSession,
  getStudentSubmission,
  submissionBlockedReason,
  upsertStudentSubmission,
} from "@/lib/cursos/queries";
import { deleteBlobs } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { MAX_SUBMISSION_FILES, submissionFolder } from "@/lib/cursos/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

/**
 * Crea o reemplaza la entrega del alumno con sesión: comentario + archivos que
 * el navegador ya subió a Blob (se verifica que existan y sean de su carpeta).
 */
export async function POST(req: NextRequest) {
  const student = await getCurrentStudent();
  if (!student) return bad("Inicia sesión para entregar", 401);

  const body = await req.json().catch(() => null);
  if (!body) return bad("JSON inválido");

  const sessionId = String(body.sessionId ?? "");
  const comment = String(body.comment ?? "").trim().slice(0, 5000);
  const files: { pathname: string; filename: string }[] = Array.isArray(body.files)
    ? body.files.map((f: { pathname?: unknown; filename?: unknown }) => ({
        pathname: String(f?.pathname ?? ""),
        filename: String(f?.filename ?? "").trim().slice(0, 200),
      }))
    : [];

  if (files.length === 0 && !comment) return bad("Adjunta al menos un archivo o un comentario");
  if (files.length > MAX_SUBMISSION_FILES) return bad(`Máximo ${MAX_SUBMISSION_FILES} archivos`);

  const session = await getEnrolledSession(sessionId, student.id);
  if (!session) return bad("No estás inscrito en este curso", 404);
  const existing = await getStudentSubmission(session.id, student.id);
  const blocked = submissionBlockedReason(session, existing);
  if (blocked) return bad(blocked, 409);

  const folder = submissionFolder(session.id, student.id);
  if (files.some((f) => !f.pathname.startsWith(folder))) return bad("Archivo inválido");

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
    const { oldPathnames } = await upsertStudentSubmission(session.id, student, comment, withMeta);
    await deleteBlobs(oldPathnames);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cursos/entregas]", err);
    return bad("No se pudo registrar la entrega", 500);
  }
}
