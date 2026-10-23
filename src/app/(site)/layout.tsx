import type { ReactNode } from "react";
import HeaderClient from "@/components/HeaderClient";
import RouteTransition from "@/components/RouteTransition";
import SiteFooter from "@/components/SiteFooter";
import ScrollProgress from "@/components/motion/ScrollProgress";

/** Layout del sitio público: header, footer y contenedor de la landing. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <div className="app-shell">
        <HeaderClient />
        <main className="mx-auto max-w-5xl px-5 pt-6 sm:px-6 sm:pt-8">
          <RouteTransition>{children}</RouteTransition>
        </main>
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <SiteFooter />
        </div>
      </div>
    </>
  );
}
