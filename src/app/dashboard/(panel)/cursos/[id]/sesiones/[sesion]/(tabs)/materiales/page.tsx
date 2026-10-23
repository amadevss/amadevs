import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadSession } from "@/lib/dashboard/cursos";
import { listMaterials } from "@/lib/cursos/queries";
import MaterialsPanel from "@/components/dashboard/cursos/MaterialsPanel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; sesion: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, sesion } = await params;
  const s = await loadSession(id, sesion);
  return { title: s ? `Materiales · ${s.title}` : "Sesión" };
}

export default async function MaterialesPage({ params }: Props) {
  const { id, sesion } = await params;
  const session = await loadSession(id, sesion);
  if (!session) notFound();
  const materials = await listMaterials(session.id);
  return <MaterialsPanel sessionId={session.id} materials={materials} />;
}
