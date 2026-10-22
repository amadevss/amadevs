import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Cursos", template: "%s | Cursos" },
  // Los cursos se comparten por enlace; no hace falta indexarlos.
  robots: { index: false, follow: false },
};

export default function CursosLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl py-10 sm:py-14">{children}</div>;
}
