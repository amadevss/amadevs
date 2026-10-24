import { listCatalogCourses, listStudentCourses } from "@/lib/cursos/queries";
import Catalog from "./Catalog";

/** Encabezado + catálogo; lo usan /catalogo y la portada sin sesión. */
export default async function CatalogPage({ base, studentId }: { base: string; studentId?: string }) {
  const [courses, mine] = await Promise.all([
    listCatalogCourses(),
    studentId ? listStudentCourses(studentId) : Promise.resolve([]),
  ]);
  return (
    <>
      <header className="mb-6">
        <p className="eyebrow">Cursos abiertos</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Aprende a tu ritmo</h1>
        <p className="mt-2 max-w-xl text-muted">
          Clases en video con material de apoyo. Tu avance se guarda solo y puedes continuar donde te quedaste.
        </p>
      </header>
      <Catalog courses={courses} base={base} enrolledIds={mine.map((c) => c.id)} />
    </>
  );
}
