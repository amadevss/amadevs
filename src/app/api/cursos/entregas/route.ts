import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { createSubmission, getSessionOpenForSubmissions } from "@/lib/cursos/queries";
import { MAX_SUBMISSION_FILES, submissionFolder } from "@/lib/cursos/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

/**
 * Registra una entrega (sin login): nombre completo + comentario + archivos
 * que el navegador ya subió a Blob. Se verifica que cada archivo exista y
 * pertenezca a la carpeta de esa sesión.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return bad("JSON inválido");

  const sessionId = String(body.sessionId ?? "");
  const studentName = String(body.studentName ?? "").trim().replace(/\s+/g, " ");
  const comment = String(body.comment ?? "").trim().slice(0, 5000);
  const pathnames: string[] = Array.isArray(body.files)
    ? body.files.map((f: { pathname?: unknown }) => String(f?.pathname ?? ""))
    : [];

  if (studentName.length < 3 || studentName.length > 120) return bad("Escribe tu nombre completo");
  if (pathnames.length === 0 && !comment) return bad("Adjunta al menos un archivo o un comentario");
  if (pathnames.length > MAX_SUBMISSION_FILES) return bad(`Máximo ${MAX_SUBMISSION_FILES} archivos`);

  const session = await getSessionOpenForSubmissions(sessionId);
  if (!session) return bad("Esta sesión no recibe entregas", 404);

  const folder = submissionFolder(sessionId);
  if (pathnames.some((p) => !p.startsWith(folder))) return bad("Archivo inválido");

  try {
    const files = await Promise.all(
      pathnames.map(async (pathname, i) => {
        const meta = await head(pathname);
        const original = String(body.files[i]?.filename ?? "").trim().slice(0, 200);
        return {
          pathname,
          filename: original || pathname.split("/").pop() || "archivo",
          content_type: meta.contentType || "application/octet-stream",
          size: meta.size,
        };
      }),
    );
    const id = await createSubmission(sessionId, studentName, comment, files);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[cursos/entregas]", err);
    return bad("No se pudo registrar la entrega", 500);
  }
}
