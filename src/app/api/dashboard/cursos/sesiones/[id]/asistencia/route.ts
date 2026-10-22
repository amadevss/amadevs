import { NextRequest, NextResponse } from "next/server";
import {
  ATTENDANCE_STATUSES,
  listSessionAttendance,
  markAllPresent,
  sessionExists,
  setAttendance,
  type AttendanceStatus,
} from "@/lib/cursos/queries";
import { hasDashboardSession } from "@/lib/cursos/server";
import { isUuid } from "@/lib/cursos/sql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  return NextResponse.json({ rows: await listSessionAttendance(id) });
}

/** { studentId, status } marca a un alumno (status null = quitar). { all: true } = todos presentes. */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  if (!(await sessionExists(id))) return bad("Sesión no encontrada", 404);
  const body = await req.json().catch(() => ({}));

  if (body?.all === true) {
    await markAllPresent(id);
    return NextResponse.json({ rows: await listSessionAttendance(id) });
  }

  const studentId = String(body?.studentId ?? "");
  const status = body?.status === null ? null : String(body?.status ?? "");
  if (!isUuid(studentId)) return bad("Alumno inválido");
  if (status !== null && !ATTENDANCE_STATUSES.includes(status as AttendanceStatus)) return bad("Estado inválido");
  await setAttendance(id, studentId, status as AttendanceStatus | null);
  return NextResponse.json({ ok: true });
}
