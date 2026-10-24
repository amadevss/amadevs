import { redirect } from "next/navigation";
import { coursesBasePath } from "@/lib/cursos/server";

/** Ruta vieja: el avance ahora vive en Mis cursos. */
export default async function PerfilRedirect() {
  redirect(`${await coursesBasePath()}/mis-cursos/avance`);
}
