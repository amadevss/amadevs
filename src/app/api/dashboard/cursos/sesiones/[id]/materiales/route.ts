import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { head } from "@vercel/blob";
import { addMaterial, sessionExists } from "@/lib/cursos/queries";
import { materialFolder } from "@/lib/cursos/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };

/** Registra un material que el navegador ya subió a Blob. */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const pathname = String(body?.pathname ?? "");
  if (!pathname.startsWith(materialFolder(id))) return bad("Archivo inválido");
  if (!(await sessionExists(id))) return bad("Sesión no encontrada", 404);
  try {
    const meta = await head(pathname);
    const material = await addMaterial(id, {
      pathname,
      filename: String(body?.filename ?? "").trim().slice(0, 200) || pathname.split("/").pop() || "archivo",
      content_type: meta.contentType || "application/octet-stream",
      size: meta.size,
    });
    return NextResponse.json({ material });
  } catch (err) {
    console.error("[dashboard/cursos] add material", err);
    return bad("No se pudo registrar el material", 500);
  }
}
