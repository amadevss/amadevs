import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import {
  getEnrolledSession,
  getStudentSubmission,
  sessionExists,
  submissionBlockedReason,
} from "@/lib/cursos/queries";
import { hasDashboardSession } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { courseExists } from "@/lib/cursos/queries";
import {
  MAX_COVER_BYTES,
  MAX_MATERIAL_BYTES,
  MAX_SUBMISSION_BYTES,
  coverFolder,
  materialFolder,
  submissionFolder,
} from "@/lib/cursos/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Emite tokens para que el navegador suba directo a Vercel Blob (privado).
 * - kind "entrega": alumno con sesión, inscrito, y con la entrega abierta.
 * - kind "material": solo con sesión de dashboard.
 * - kind "portada": imagen de portada de un curso, solo dashboard.
 * El registro en la base de datos se hace después con otra llamada.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload ?? "{}") as { kind?: string; sessionId?: string; courseId?: string };
        const sessionId = String(payload.sessionId ?? "");

        if (payload.kind === "portada") {
          const courseId = String(payload.courseId ?? "");
          if (!(await hasDashboardSession())) throw new Error("No autorizado");
          if (!(await courseExists(courseId))) throw new Error("Curso no encontrado");
          if (!pathname.startsWith(coverFolder(courseId))) throw new Error("Ruta inválida");
          return {
            addRandomSuffix: true,
            maximumSizeInBytes: MAX_COVER_BYTES,
            allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          };
        }

        if (payload.kind === "material") {
          if (!(await hasDashboardSession())) throw new Error("No autorizado");
          if (!(await sessionExists(sessionId))) throw new Error("Sesión no encontrada");
          if (!pathname.startsWith(materialFolder(sessionId))) throw new Error("Ruta inválida");
          return { addRandomSuffix: true, maximumSizeInBytes: MAX_MATERIAL_BYTES };
        }

        if (payload.kind === "entrega") {
          const student = await getCurrentStudent();
          if (!student) throw new Error("Inicia sesión para entregar");
          const session = await getEnrolledSession(sessionId, student.id);
          if (!session) throw new Error("No estás inscrito en este curso");
          const blocked = submissionBlockedReason(session, await getStudentSubmission(session.id, student.id));
          if (blocked) throw new Error(blocked);
          if (!pathname.startsWith(submissionFolder(sessionId, student.id))) throw new Error("Ruta inválida");
          return { addRandomSuffix: true, maximumSizeInBytes: MAX_SUBMISSION_BYTES };
        }

        throw new Error("Tipo de subida inválido");
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
