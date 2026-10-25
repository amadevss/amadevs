import type { Metadata } from "next";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import CatalogPage from "@/components/cursos/CatalogPage";

export const metadata: Metadata = {
  title: "Explorar cursos",
  description: "Cursos abiertos de Bryan Oliveros: clases en video, material de apoyo y avance guardado.",
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  return <CatalogPage base={base} studentId={student?.id} />;
}
