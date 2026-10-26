"use client";

import { upload } from "@vercel/blob/client";
import { coverFolder, materialFolder, safeFilename, submissionFolder } from "./shared";

export type UploadedFile = { pathname: string; filename: string };

/** Sube un archivo directo del navegador a Blob (privado). */
export async function uploadCourseFile(
  file: File,
  kind: "material" | "entrega" | "entrega-profesor",
  sessionId: string,
  onProgress?: (pct: number) => void,
  studentId = "",
): Promise<UploadedFile> {
  const folder = kind === "material" ? materialFolder(sessionId) : submissionFolder(sessionId, studentId);
  const blob = await upload(`${folder}${safeFilename(file.name)}`, file, {
    access: "private",
    handleUploadUrl: "/api/cursos/upload",
    clientPayload: JSON.stringify({ kind, sessionId, studentId }),
    contentType: file.type || undefined,
    multipart: file.size > 50 * 1024 * 1024,
    onUploadProgress: onProgress ? (e) => onProgress(e.percentage) : undefined,
  });
  return { pathname: blob.pathname, filename: file.name };
}

/** Sube la portada de un curso (dashboard). */
export async function uploadCourseCover(file: File, courseId: string, onProgress?: (pct: number) => void): Promise<UploadedFile> {
  const blob = await upload(`${coverFolder(courseId)}${safeFilename(file.name)}`, file, {
    access: "private",
    handleUploadUrl: "/api/cursos/upload",
    clientPayload: JSON.stringify({ kind: "portada", courseId }),
    contentType: file.type || undefined,
    onUploadProgress: onProgress ? (e) => onProgress(e.percentage) : undefined,
  });
  return { pathname: blob.pathname, filename: file.name };
}
