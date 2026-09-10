import Image from "next/image";
import TiltCard from "./motion/TiltCard";
import type { Project } from "@/lib/content";

export default function ProjectCard({ title, url, description, tags }: Project) {
  const thumbnailUrl = `https://api.microlink.io/?url=${encodeURIComponent(
    url,
  )}&screenshot=true&meta=false&embed=screenshot.url`;
  const host = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <TiltCard className="h-full">
      <article className="surface-card group flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-lg)]">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          aria-label={`Abrir ${title}`}
        >
          {/* Barra de navegador */}
          <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-3.5 py-2.5">
            <span className="h-2 w-2 rounded-full bg-red-400/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            <span className="ml-2 truncate text-[11px] text-subtle">{host}</span>
          </div>
          {/* Miniatura */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
            <Image
              src={thumbnailUrl}
              alt={`Vista previa de ${title}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              unoptimized
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </a>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-ink transition hover:gap-1.5"
            >
              Visitar
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          </div>
          <p className="text-[13px] leading-relaxed text-muted">{description}</p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-subtle"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </article>
    </TiltCard>
  );
}
