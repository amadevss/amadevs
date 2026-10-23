import NotFoundCard from "@/components/ui/NotFoundCard";
import { coursesBasePath } from "@/lib/cursos/server";

export default async function CursosNotFound() {
  const base = await coursesBasePath();
  return <NotFoundCard href={base || "/"} label="Ir a mis cursos" />;
}
