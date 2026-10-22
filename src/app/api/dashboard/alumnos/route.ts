import { NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { listAllStudents } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasDashboardSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ students: await listAllStudents() });
}
