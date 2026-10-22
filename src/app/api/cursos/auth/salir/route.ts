import { NextResponse } from "next/server";
import { endStudentSession } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await endStudentSession();
  return NextResponse.json({ ok: true });
}
