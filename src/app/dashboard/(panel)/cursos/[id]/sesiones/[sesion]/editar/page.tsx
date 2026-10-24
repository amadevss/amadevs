import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireDashboard } from "@/lib/dashboard/auth";
import { courseHref, loadSession, sessionHref } from "@/lib/dashboard/cursos";
import { PageHeader } from "@/components/ui/kit";
import { SessionForm } from "@/components/dashboard/cursos/CourseForms";

export const metadata: Metadata = { title: "Editar" };
export const dynamic = "force-dynamic";

export default async function EditarSesionPage({ params }: { params: Promise<{ id: string; sesion: string }> }) {
  const { id, sesion } = await params;
  await requireDashboard();
  const session = await loadSession(id, sesion);
  if (!session) notFound();
  const noun = session.course.kind === "publico" ? "Clase" : "Sesión";
  return (
    <>
      <PageHeader
        title={`Editar ${noun.toLowerCase()}`}
        crumbs={[
          { label: "Cursos", href: "/dashboard/cursos" },
          { label: session.course.title, href: courseHref(id) },
          { label: `${noun} ${session.position}`, href: sessionHref(id, session.id) },
          { label: "Editar" },
        ]}
      />
      <SessionForm courseId={id} courseKind={session.course.kind} session={session} nextPosition={session.position} />
    </>
  );
}
