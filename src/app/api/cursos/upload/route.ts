import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionOpenForSubmissions, sessionExists } from "@/lib/cursos/queries";
import { hasDashboardSession } from "@/lib/cursos/server";
import {
  MAX_MATERIAL_BYTES,
  MAX_SUBMISSION_BYTES,
  materialFolder,
  submissionFolder,
} from "@/lib/cursos/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Emite tokens para que el navegador suba directo a Vercel Blob (privado).
 * - kind "entrega": cualquiera con el enlace, solo a sesiones abiertas.
 * - kind "material": solo con sesión de dashboard.
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
        const payload = JSON.parse(clientPayload ?? "{}") as { kind?: string; sessionId?: string };
        const sessionId = String(payload.sessionId ?? "");

        if (payload.kind === "material") {
          if (!(await hasDashboardSession())) throw new Error("No autorizado");
          if (!(await sessionExists(sessionId))) throw new Error("Sesión no encontrada");
          if (!pathname.startsWith(materialFolder(sessionId))) throw new Error("Ruta inválida");
          return { addRandomSuffix: true, maximumSizeInBytes: MAX_MATERIAL_BYTES };
        }

        if (payload.kind === "entrega") {
          if (!(await getSessionOpenForSubmissions(sessionId))) {
            throw new Error("Esta sesión no recibe entregas");
          }
          if (!pathname.startsWith(submissionFolder(sessionId))) throw new Error("Ruta inválida");
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
