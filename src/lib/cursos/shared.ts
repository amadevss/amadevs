/** Utilidades de cursos que sirven tanto en servidor como en cliente. */

export const MATERIAL_PREFIX = "cursos/materiales";
export const SUBMISSION_PREFIX = "cursos/entregas";

export const MAX_SUBMISSION_FILES = 10;
export const MAX_SUBMISSION_BYTES = 500 * 1024 * 1024; // 500 MB por archivo
export const MAX_MATERIAL_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB por archivo

export const materialFolder = (sessionId: string) => `${MATERIAL_PREFIX}/${sessionId}/`;
export const submissionFolder = (sessionId: string) => `${SUBMISSION_PREFIX}/${sessionId}/`;

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
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
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
