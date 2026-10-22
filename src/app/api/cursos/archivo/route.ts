import { NextRequest, NextResponse } from "next/server";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { isMaterialPublic } from "@/lib/cursos/queries";
import { hasDashboardSession } from "@/lib/cursos/server";
import { MATERIAL_PREFIX, SUBMISSION_PREFIX } from "@/lib/cursos/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINK_TTL_MS = 30 * 60 * 1000; // el enlace firmado dura 30 min

/**
 * Sirve un archivo privado de Blob: valida permisos y redirige a una URL
 * firmada temporal (así no pasa por la función y no hay límite de tamaño).
 * - Materiales: públicos si su curso y sesión están visibles.
 * - Entregas: solo con sesión de dashboard.
 */
export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get("p") ?? "";
  const download = req.nextUrl.searchParams.get("dl") === "1";

  let allowed = false;
  if (pathname.startsWith(`${MATERIAL_PREFIX}/`)) {
    allowed = (await isMaterialPublic(pathname)) || (await hasDashboardSession());
  } else if (pathname.startsWith(`${SUBMISSION_PREFIX}/`)) {
    allowed = await hasDashboardSession();
  }
  if (!allowed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  try {
    const validUntil = Date.now() + LINK_TTL_MS;
    const token = await issueSignedToken({ pathname, operations: ["get"], validUntil });
    const { presignedUrl } = await presignUrl(token, {
      operation: "get",
      pathname,
      access: "private",
      validUntil,
    });
    const target = new URL(presignedUrl);
    if (download) target.searchParams.set("download", "1");
    return NextResponse.redirect(target, {
      status: 302,
      headers: { "cache-control": "private, max-age=600" },
    });
  } catch (err) {
    console.error("[cursos/archivo]", err);
    return NextResponse.json({ error: "No se pudo obtener el archivo" }, { status: 500 });
  }
}
