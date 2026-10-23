import type { Metadata } from "next";
import type { ReactNode } from "react";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { FeedbackProvider } from "@/components/ui/feedback";
import StudentShell from "@/components/cursos/StudentShell";

export const metadata: Metadata = {
  title: { default: "Cursos", template: "%s | Cursos" },
  // Los cursos se comparten por enlace; no hace falta indexarlos.
  robots: { index: false, follow: false },
};

export default async function CursosLayout({ children }: { children: ReactNode }) {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  return (
    <FeedbackProvider>
      <StudentShell firstName={student?.full_name.split(" ")[0] ?? null} base={base}>
        {children}
      </StudentShell>
    </FeedbackProvider>
  );
}
