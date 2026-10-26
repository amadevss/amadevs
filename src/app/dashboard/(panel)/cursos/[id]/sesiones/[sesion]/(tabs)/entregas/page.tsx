import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadSession } from "@/lib/dashboard/cursos";
import { listSessionAttendance, listSubmissions } from "@/lib/cursos/queries";
import SubmissionsPanel from "@/components/dashboard/cursos/SubmissionsPanel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; sesion: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, sesion } = await params;
  const s = await loadSession(id, sesion);
  return { title: s ? `Entregas · ${s.title}` : "Sesión" };
}

export default async function EntregasPage({ params }: Props) {
  const { id, sesion } = await params;
  const session = await loadSession(id, sesion);
  if (!session) notFound();
  const [submissions, enrolled] = await Promise.all([listSubmissions(session.id), listSessionAttendance(session.id)]);
  const delivered = new Set(submissions.map((s) => s.student_id));
  const pending = enrolled
    .filter((e) => !delivered.has(e.student_id))
    .map((e) => ({ id: e.student_id, full_name: e.full_name }));

  return (
    <SubmissionsPanel
      sessionId={session.id}
      submissions={submissions}
      missing={session.accepts_submissions ? pending : []}
      pending={pending}
      dueAt={session.due_at}
    />
  );
}
