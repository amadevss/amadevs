import { NextRequest, NextResponse } from "next/server";
import { deleteBlobs, hasDashboardSession } from "@/lib/cursos/server";
import { deleteMaterial } from "@/lib/cursos/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  const pathname = await deleteMaterial(id);
  if (!pathname) return bad("Material no encontrado", 404);
  await deleteBlobs([pathname]);
  return NextResponse.json({ ok: true });
}
