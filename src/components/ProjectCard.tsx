import Image from "next/image";

type ProjectCardProps = {
  title: string;
  url: string;
  description?: string;
};

export default function ProjectCard({ title, url, description }: ProjectCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-black/[.06] dark:border-indigo-500/20 bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-indigo-950/40 p-3 shadow-sm dark:shadow-indigo-500/10 hover:shadow-md dark:hover:shadow-indigo-500/20 transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold dark:text-white">{title}</h3>
          <p className="text-xs text-neutral-600 dark:text-slate-400">{description ?? url}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground hover:underline dark:text-indigo-300 dark:hover:text-indigo-200 transition-colors"
        >
          Visitar
          <Image src="/window.svg" alt="icon" width={14} height={14} className="opacity-70 dark:opacity-90" />
        </a>
      </div>

      {/* Ventana de navegador con previsualización */}
      <div className="rounded-md border border-black/[.06] dark:border-indigo-500/30 overflow-hidden bg-white/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-black/[.06] dark:border-indigo-500/30 bg-white/90 dark:bg-slate-800/80 text-[11px]">
          <span className="h-2 w-2 rounded-full bg-red-400/80 dark:bg-red-500" />
          <span className="h-2 w-2 rounded-full bg-yellow-400/80 dark:bg-yellow-500" />
          <span className="h-2 w-2 rounded-full bg-green-400/80 dark:bg-green-500" />
          <span className="ml-2 truncate text-neutral-600 dark:text-slate-400">{url}</span>
        </div>
        <div className="relative">
          <iframe
            src={url}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="block h-56 w-full bg-white dark:bg-slate-950"
          />
          {/* Fallback visual en caso de X-Frame-Options */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center text-center text-xs text-neutral-500 dark:text-slate-500 [iframe]:hidden">
            Vista previa no disponible. El sitio bloquea la incrustación.
          </div>
        </div>
      </div>
    </article>
  );
}
