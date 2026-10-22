import { NextRequest, NextResponse } from "next/server";
import { changeOwnPassword, getCurrentStudent } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const student = await getCurrentStudent();
  if (!student) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const error = await changeOwnPassword(student, String(body?.current ?? ""), String(body?.next ?? ""));
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
