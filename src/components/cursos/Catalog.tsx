import Link from "next/link";
import type { CatalogCourse } from "@/lib/cursos/queries";
import { fileUrl, formatDuration } from "@/lib/cursos/shared";
import { Badge, EmptyState } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

/** Portada del curso, o un degradado con ícono si no tiene. */
export function CourseCover({ pathname, title, className = "" }: { pathname: string | null; title: string; className?: string }) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-surface-2 ${className}`}>
      {pathname ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fileUrl(pathname)} alt={`Portada de ${title}`} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid h-full w-full place-items-center text-white" style={{ background: "var(--grad)" }}>
          <Icon name="book" className="h-10 w-10 opacity-90" />
        </div>
      )}
    </div>
  );
}

/** Datos rápidos del curso: clases y duración total. */
export function CourseFacts({ lessons, seconds }: { lessons: number; seconds: number }) {
  const duration = formatDuration(seconds, true);
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
      <span className="inline-flex items-center gap-1">
        <Icon name="layers" className="h-3.5 w-3.5" />
        {lessons} {lessons === 1 ? "clase" : "clases"}
      </span>
      {duration ? (
        <span className="inline-flex items-center gap-1">
          <Icon name="clock" className="h-3.5 w-3.5" />
          {duration} de video
        </span>
      ) : null}
    </span>
  );
}

/** Lista de cursos públicos. Los privados nunca llegan aquí. */
export default function Catalog({
  courses,
  base,
  enrolledIds = [],
}: {
  courses: CatalogCourse[];
  base: string;
  enrolledIds?: string[];
}) {
  if (courses.length === 0) {
    return (
      <EmptyState icon="book" title="Pronto habrá cursos aquí">
        Estamos preparando los primeros cursos abiertos. Vuelve pronto.
      </EmptyState>
    );
  }
  const enrolled = new Set(enrolledIds);
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {courses.map((c) => (
        <li key={c.id}>
          <Link
            href={`${base}/${c.slug}`}
            className="surface-card group flex h-full flex-col overflow-hidden transition active:scale-[0.99] sm:hover:-translate-y-0.5 sm:hover:shadow-[var(--shadow-md)]"
          >
            <CourseCover pathname={c.cover_pathname} title={c.title} />
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-bold leading-snug group-hover:text-primary-ink">{c.title}</h2>
                {enrolled.has(c.id) ? <Badge tone="ok">Inscrito</Badge> : <Badge tone="primary">Gratis</Badge>}
              </div>
              {c.summary || c.description ? (
                <p className="line-clamp-2 text-sm text-muted">{c.summary || c.description}</p>
              ) : null}
              <div className="mt-auto pt-2">
                <CourseFacts lessons={c.lesson_count} seconds={c.total_seconds} />
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
