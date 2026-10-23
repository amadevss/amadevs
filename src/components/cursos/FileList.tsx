import { fileUrl, formatBytes, isImage, isVideo } from "@/lib/cursos/shared";
import Icon from "@/components/ui/icons";

type FileItem = { id: string; pathname: string; filename: string; content_type: string; size: number };

/**
 * Archivos adjuntos: las imágenes y videos se muestran en línea; el resto
 * como enlace de descarga. Sirve en servidor y en cliente (sin hooks).
 */
export default function FileList({
  files,
  compact = false,
  onDelete,
}: {
  files: FileItem[];
  compact?: boolean;
  onDelete?: (id: string) => void;
}) {
  if (files.length === 0) return null;

  const media = compact ? [] : files.filter((f) => isImage(f.content_type) || isVideo(f.content_type));
  const others = compact ? files : files.filter((f) => !media.includes(f));

  return (
    <div className="grid grid-cols-1 gap-4">
      {media.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {media.map((f) => (
            <figure key={f.id} className="overflow-hidden rounded-xl border border-border bg-surface-2">
              {isImage(f.content_type) ? (
                <a href={fileUrl(f.pathname)} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- archivo privado vía redirect firmado */}
                  <img src={fileUrl(f.pathname)} alt={f.filename} loading="lazy" className="max-h-80 w-full object-contain" />
                </a>
              ) : (
                <video src={fileUrl(f.pathname)} controls preload="metadata" className="max-h-80 w-full" />
              )}
              <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-subtle">
                <span className="truncate">{f.filename}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <a href={fileUrl(f.pathname, true)} className="-m-1 p-1.5 font-medium text-primary-ink hover:underline">
                    Descargar
                  </a>
                  {onDelete ? (
                    <button type="button" onClick={() => onDelete(f.id)} className="-m-1 p-1.5 text-rose-600 hover:underline dark:text-rose-400">
                      Quitar
                    </button>
                  ) : null}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      {others.length > 0 ? (
        <ul className="grid grid-cols-1 gap-2">
          {others.map((f) => (
            <li
              key={f.id}
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
            >
              <a
                href={fileUrl(f.pathname)}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 font-medium hover:text-primary-ink"
              >
                <Icon name="file" className="h-4 w-4 shrink-0 text-subtle" />
                <span className="truncate">{f.filename}</span>
              </a>
              <span className="flex shrink-0 items-center gap-3 text-xs text-subtle">
                {formatBytes(f.size)}
                <a href={fileUrl(f.pathname, true)} className="-m-1 p-1.5 font-medium text-primary-ink hover:underline">
                  Descargar
                </a>
                {onDelete ? (
                  <button type="button" onClick={() => onDelete(f.id)} className="-m-1 p-1.5 text-rose-600 hover:underline dark:text-rose-400">
                    Quitar
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
