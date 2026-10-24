import type { Metadata } from "next";
import type { ReactNode } from "react";
import HeaderClient, { type NavItem } from "@/components/HeaderClient";
import SiteFooter from "@/components/SiteFooter";
import ScrollProgress from "@/components/motion/ScrollProgress";

const PROFE_URL = "https://profe.bryanoliveros.com";
const TITLE = "Profe Bryan Oliveros — Inteligencia artificial y docencia";
const DESCRIPTION =
  "Bryan Oliveros Pérez, profesor y conferencista de inteligencia artificial: capacitación docente, IA generativa en el aula, agentes con low-code, cursos y talleres para escuelas, universidades y empresas.";

export const metadata: Metadata = {
  metadataBase: new URL(PROFE_URL),
  title: { absolute: TITLE, template: "%s | Profe Bryan" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: "Profe Bryan Oliveros",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/profile.png", width: 1080, height: 1350, alt: "Bryan Oliveros Pérez" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/profile.png"] },
};

// Anclas (#) quedan en esta página; las rutas (/) van al sitio principal.
const NAV: NavItem[] = [
  { href: "#sobre-mi", label: "Sobre mí" },
  { href: "#roles", label: "Roles" },
  { href: "#conferencias", label: "Conferencias" },
  { href: "/cursos", label: "Cursos" },
  { href: "#contacto", label: "Contacto" },
  { href: "/", label: "Sitio principal" },
  { href: "/agenda", label: "Agenda" },
];

const ORANGE_BRAND =
  "bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(249,115,22,0.35)]";

/** Layout de profe.<dominio>: mismo esqueleto que la landing, con el tema naranja. */
export default function ProfeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-profe">
      <ScrollProgress />
      <div className="app-shell">
        <HeaderClient nav={NAV} brandClassName={ORANGE_BRAND} homeHref="#inicio" />
        <main className="mx-auto max-w-5xl px-5 pt-6 sm:px-6 sm:pt-8">{children}</main>
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
