"use client";

import { upload } from "@vercel/blob/client";
import { materialFolder, safeFilename, submissionFolder } from "./shared";

export type UploadedFile = { pathname: string; filename: string };

/** Sube un archivo directo del navegador a Blob (privado). */
export async function uploadCourseFile(
  file: File,
  kind: "material" | "entrega",
  sessionId: string,
  onProgress?: (pct: number) => void,
): Promise<UploadedFile> {
  const folder = kind === "material" ? materialFolder(sessionId) : submissionFolder(sessionId);
  const blob = await upload(`${folder}${safeFilename(file.name)}`, file, {
    access: "private",
    handleUploadUrl: "/api/cursos/upload",
    clientPayload: JSON.stringify({ kind, sessionId }),
    contentType: file.type || undefined,
    multipart: file.size > 50 * 1024 * 1024,
    onUploadProgress: onProgress ? (e) => onProgress(e.percentage) : undefined,
  });
  return { pathname: blob.pathname, filename: file.name };
}
