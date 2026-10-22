import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { coursesBasePath } from "@/lib/cursos/server";
import { getCurrentStudent } from "@/lib/cursos/students";
import { LogoutButton } from "@/components/cursos/StudentActions";

export const metadata: Metadata = {
  title: { default: "Cursos", template: "%s | Cursos" },
  // Los cursos se comparten por enlace; no hace falta indexarlos.
  robots: { index: false, follow: false },
};

export default async function CursosLayout({ children }: { children: ReactNode }) {
  const [student, base] = await Promise.all([getCurrentStudent(), coursesBasePath()]);
  const firstName = student?.full_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl pb-12 pt-4 sm:pb-16 sm:pt-6">
      {student ? (
        <nav className="mb-6 flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm">
          <Link href={base || "/"} className="min-h-10 truncate px-1 py-2 font-medium">
            <span className="hidden sm:inline">Hola, </span>
            {firstName}
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Link href={`${base}/`} className="rounded-full px-3 py-2 text-muted transition hover:bg-surface-2 hover:text-fg">
              Mis cursos
            </Link>
            <Link href={`${base}/perfil`} className="rounded-full px-3 py-2 text-muted transition hover:bg-surface-2 hover:text-fg">
              Perfil
            </Link>
            <LogoutButton className="rounded-full px-3 py-2 text-muted transition hover:bg-surface-2 hover:text-fg" />
          </div>
        </nav>
      ) : null}
      {children}
    </div>
  );
}
