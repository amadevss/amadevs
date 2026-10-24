/** Utilidades de cursos que sirven tanto en servidor como en cliente. */

export const MATERIAL_PREFIX = "cursos/materiales";
export const SUBMISSION_PREFIX = "cursos/entregas";
/** Portadas de cursos públicos (Blob). Se pueden ver sin sesión. */
export const COVER_PREFIX = "cursos/portadas";

export const MAX_SUBMISSION_FILES = 10;
export const MAX_SUBMISSION_BYTES = 500 * 1024 * 1024; // 500 MB por archivo
export const MAX_MATERIAL_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB por archivo
export const MAX_COVER_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB (límite de una subida directa a S3)

export const materialFolder = (sessionId: string) => `${MATERIAL_PREFIX}/${sessionId}/`;
export const coverFolder = (courseId: string) => `${COVER_PREFIX}/${courseId}/`;
export const submissionFolder = (sessionId: string, studentId: string) =>
  `${SUBMISSION_PREFIX}/${sessionId}/${studentId}/`;

/** Nombre de archivo seguro para usarlo dentro de un pathname de Blob. */
export function safeFilename(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.slice(-120) || "archivo";
}

/** URL interna que valida permisos y redirige al archivo privado. */
export function fileUrl(pathname: string, download = false): string {
  return `/api/cursos/archivo?p=${encodeURIComponent(pathname)}${download ? "&dl=1" : ""}`;
}

export function isImage(contentType: string): boolean {
  return contentType.startsWith("image/");
}

export function isVideo(contentType: string): boolean {
  return contentType.startsWith("video/");
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  const trim = (v: string) => v.replace(/\.0+$/, "");
  if (n < 1024 * 1024 * 1024) return `${trim((n / 1024 / 1024).toFixed(1))} MB`;
  return `${trim((n / 1024 / 1024 / 1024).toFixed(2))} GB`;
}

export function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  });
}

export const COURSES_PUBLIC_ORIGIN = "https://cursos.bryanoliveros.com";

/** ISO → valor para <input type="datetime-local"> en la zona del navegador. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const ATTENDANCE_LABEL: Record<string, string> = {
  presente: "Presente",
  retardo: "Retardo",
  falta: "Falta",
  justificada: "Justificada",
};

export const ATTENDANCE_TONE: Record<string, string> = {
  presente: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  retardo: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  falta: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  justificada: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
};

/** 3725 → "1 h 2 min"; 95 → "1:35". */
export function formatDuration(seconds: number | null | undefined, long = false): string {
  if (!seconds || seconds < 1) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (long) return h > 0 ? `${h} h ${m} min` : `${Math.max(1, m)} min`;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
