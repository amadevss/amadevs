import { NextRequest, NextResponse } from "next/server";
import { listCourseStudents } from "@/lib/cursos/queries";
import { hasDashboardSession } from "@/lib/cursos/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasDashboardSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json({ students: await listCourseStudents(id) });
}
