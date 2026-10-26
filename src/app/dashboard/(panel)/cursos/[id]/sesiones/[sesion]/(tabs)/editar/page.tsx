import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadSession } from "@/lib/dashboard/cursos";
import { SessionForm } from "@/components/dashboard/cursos/CourseForms";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; sesion: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, sesion } = await params;
  const s = await loadSession(id, sesion);
  return { title: s ? `Editar · ${s.title}` : "Editar" };
}

export default async function EditarSesionPage({ params }: Props) {
  const { id, sesion } = await params;
  const session = await loadSession(id, sesion);
  if (!session) notFound();
  return (
    <SessionForm courseId={id} courseKind={session.course.kind} session={session} nextPosition={session.position} />
  );
}
