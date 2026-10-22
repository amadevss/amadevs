import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVisibleCourse, getVisibleSession, listMaterials, listVisibleSessions } from "@/lib/cursos/queries";
import { coursesBasePath } from "@/lib/cursos/server";
import { formatDateTime } from "@/lib/cursos/shared";
import Markdown from "@/components/cursos/Markdown";
import FileList from "@/components/cursos/FileList";
import SubmissionForm from "@/components/cursos/SubmissionForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ curso: string; sesion: string }> };

async function load(params: Props["params"]) {
  const { curso, sesion } = await params;
  const position = Number(sesion);
  if (!Number.isInteger(position)) return null;
  const course = await getVisibleCourse(curso);
  if (!course) return null;
  const session = await getVisibleSession(course.id, position);
  if (!session) return null;
  return { course, session };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  return data ? { title: `${data.session.title} · ${data.course.title}` } : {};
}

export default async function SesionPage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();
  const { course, session } = data;

  const [materials, sessions, base] = await Promise.all([
    listMaterials(session.id),
    listVisibleSessions(course.id),
    coursesBasePath(),
  ]);
  const idx = sessions.findIndex((s) => s.id === session.id);
  const prev = sessions[idx - 1];
  const next = sessions[idx + 1];
  const overdue = session.due_at ? new Date(session.due_at).getTime() < Date.now() : false;

  return (
    <>
      <Link
        href={`${base}/${course.slug}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-subtle transition-colors hover:text-primary-ink"
      >
        ← {course.title}
      </Link>

      <article className="surface-card overflow-hidden">
        <div className="h-1 w-full" style={{ background: "var(--grad)" }} />
        <div className="grid gap-8 p-6 sm:p-10">
          <header>
            <p className="eyebrow">Sesión {session.position}</p>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">{session.title}</h1>
            {session.description ? (
              <p className="mt-3 whitespace-pre-line text-muted">{session.description}</p>
            ) : null}
          </header>

          <Markdown source={session.content} />

          {materials.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Materiales</h2>
              <FileList files={materials} />
            </section>
          ) : null}
        </div>
      </article>

      {session.accepts_submissions ? (
        <section className="surface-card mt-6 p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold">Entregable</h2>
          {session.due_at ? (
            <p className={`mt-1 text-sm ${overdue ? "text-rose-600 dark:text-rose-400" : "text-subtle"}`}>
              Fecha de entrega: {formatDateTime(session.due_at)}
              {overdue ? " (vencida, aún puedes enviar)" : ""}
            </p>
          ) : null}
          <div className="mt-5">
            <SubmissionForm sessionId={session.id} />
          </div>
        </section>
      ) : null}

      <nav className="mt-6 flex justify-between gap-3 text-sm">
        {prev ? (
          <Link href={`${base}/${course.slug}/${prev.position}`} className="btn btn-ghost">
            ← Sesión {prev.position}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`${base}/${course.slug}/${next.position}`} className="btn btn-ghost">
            Sesión {next.position} →
          </Link>
        ) : null}
      </nav>
    </>
  );
}
