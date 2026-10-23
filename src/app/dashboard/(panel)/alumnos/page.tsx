import type { Metadata } from "next";
import { requireDashboard } from "@/lib/dashboard/auth";
import { listAllStudents } from "@/lib/cursos/students";
import { PageHeader } from "@/components/ui/kit";
import { AllStudentsPanel } from "@/components/dashboard/cursos/StudentsPanels";

export const metadata: Metadata = { title: "Alumnos" };
export const dynamic = "force-dynamic";

export default async function AlumnosPage() {
  await requireDashboard();
  const students = await listAllStudents();
  return (
    <>
      <PageHeader
        title="Alumnos"
        description={`${students.length} ${students.length === 1 ? "cuenta" : "cuentas"} en todos los cursos. Restablece contraseñas o elimina cuentas que ya no se usan.`}
      />
      <AllStudentsPanel students={students} />
    </>
  );
}
