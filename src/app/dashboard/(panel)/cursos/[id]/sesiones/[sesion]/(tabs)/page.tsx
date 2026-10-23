import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { courseHref, loadSession } from "@/lib/dashboard/cursos";
import { listSessionAttendance } from "@/lib/cursos/queries";
import AttendancePanel from "@/components/dashboard/cursos/AttendancePanel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; sesion: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, sesion } = await params;
  const s = await loadSession(id, sesion);
  return { title: s ? `Asistencia · ${s.title}` : "Sesión" };
}

export default async function AsistenciaPage({ params }: Props) {
  const { id, sesion } = await params;
  const session = await loadSession(id, sesion);
  if (!session) notFound();
  const rows = await listSessionAttendance(session.id);
  return <AttendancePanel sessionId={session.id} initialRows={rows} courseHref={courseHref(id)} />;
}
