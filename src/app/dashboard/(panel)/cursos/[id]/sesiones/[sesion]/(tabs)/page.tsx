import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { courseHref, loadSession } from "@/lib/dashboard/cursos";
import { listSessionAttendance } from "@/lib/cursos/queries";
import { mediaConfigured, presignDownload } from "@/lib/media/s3";
import AttendancePanel from "@/components/dashboard/cursos/AttendancePanel";
import VideoPanel from "@/components/dashboard/cursos/VideoPanel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; sesion: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, sesion } = await params;
  const s = await loadSession(id, sesion);
  if (!s) return { title: "Sesión" };
  return { title: `${s.course.kind === "publico" ? "Video" : "Asistencia"} · ${s.title}` };
}

/** Primera pestaña: video en cursos públicos, asistencia en privados. */
export default async function SesionInicioPage({ params }: Props) {
  const { id, sesion } = await params;
  const session = await loadSession(id, sesion);
  if (!session) notFound();

  if (session.course.kind === "publico") {
    const configured = mediaConfigured();
    const previewUrl =
      configured && session.video_key ? await presignDownload(session.video_key, 60 * 60).catch(() => null) : null;
    return (
      <VideoPanel
        sessionId={session.id}
        configured={configured}
        previewUrl={previewUrl}
        video={
          session.video_key
            ? { filename: session.video_filename ?? "video", size: Number(session.video_size ?? 0), duration: session.video_duration }
            : null
        }
      />
    );
  }

  const rows = await listSessionAttendance(session.id);
  return <AttendancePanel sessionId={session.id} initialRows={rows} courseHref={courseHref(id)} />;
}
