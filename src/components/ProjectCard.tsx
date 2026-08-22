import Image from "next/image";

type ProjectCardProps = {
  title: string;
  url: string;
  description?: string;
};

export default function ProjectCard({ title, url, description }: ProjectCardProps) {
  const thumbnailUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-black/[.06] dark:border-indigo-500/20 bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-indigo-950/40 p-3 shadow-sm dark:shadow-indigo-500/10 hover:shadow-md dark:hover:shadow-indigo-500/20 transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold dark:text-white">{title}</h3>
          {description && (
            <p className="text-xs text-neutral-600 dark:text-slate-400 mt-0.5 leading-snug">{description}</p>
          )}
          <p className="text-[11px] text-neutral-400 dark:text-slate-500 mt-0.5 truncate">{url}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline dark:text-indigo-300 dark:hover:text-indigo-200 transition-colors"
        >
          Visitar
          <Image src="/window.svg" alt="icon" width={14} height={14} className="opacity-70 dark:opacity-90" />
        </a>
      </div>

      {/* Miniatura del sitio */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-md border border-black/[.06] dark:border-indigo-500/30 overflow-hidden group"
      >
        {/* Barra de navegador simulada */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-black/[.06] dark:border-indigo-500/30 bg-white/90 dark:bg-slate-800/80">
          <span className="h-2 w-2 rounded-full bg-red-400/80 dark:bg-red-500" />
          <span className="h-2 w-2 rounded-full bg-yellow-400/80 dark:bg-yellow-500" />
          <span className="h-2 w-2 rounded-full bg-green-400/80 dark:bg-green-500" />
          <span className="ml-2 truncate text-[11px] text-neutral-500 dark:text-slate-400">{url}</span>
        </div>
        {/* Imagen miniatura */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          <Image
            src={thumbnailUrl}
            alt={`Vista previa de ${title}`}
            fill
            className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
            unoptimized
          />
        </div>
      </a>
    </article>
  );
}
