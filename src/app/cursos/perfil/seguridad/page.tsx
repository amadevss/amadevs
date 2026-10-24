import { redirect } from "next/navigation";
import { coursesBasePath } from "@/lib/cursos/server";

/** Ruta vieja: la contraseña ahora vive en Ajustes. */
export default async function SeguridadRedirect() {
  redirect(`${await coursesBasePath()}/ajustes`);
}
