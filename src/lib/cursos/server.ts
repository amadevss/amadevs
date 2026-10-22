import { cookies, headers } from "next/headers";
import { del } from "@vercel/blob";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";

export async function hasDashboardSession(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value);
}

/**
 * Base de los enlaces de cursos: en cursos.bryanoliveros.com las rutas van en
 * la raíz (/<curso>/<sesion>); en el dominio principal o en previews, bajo /cursos.
 */
export async function coursesBasePath(): Promise<string> {
  const host = (await headers()).get("host") ?? "";
  return host.startsWith("cursos.") ? "" : "/cursos";
}

/** Borra archivos de Blob sin romper el flujo si alguno falla. */
export async function deleteBlobs(pathnames: string[]): Promise<void> {
  if (pathnames.length === 0) return;
  try {
    await del(pathnames);
  } catch (err) {
    console.error("[cursos] no se pudieron borrar archivos de Blob", err);
  }
}
