import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { createSession, normalizeSessionInput } from "@/lib/cursos/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === "23505";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const parsed = normalizeSessionInput((await req.json().catch(() => ({}))) ?? {});
  if (!parsed.ok) return bad(parsed.error);
  const { id } = await params;
  try {
    const session = await createSession(id, parsed.value);
    return NextResponse.json({ session });
  } catch (err) {
    if (isUniqueViolation(err)) return bad("Ya existe una sesión con ese número", 409);
    console.error("[dashboard/cursos] create session", err);
    return bad("No se pudo crear la sesión", 500);
  }
}
