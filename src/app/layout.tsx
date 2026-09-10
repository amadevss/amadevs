import type { Metadata } from "next";
import { unstable_ViewTransition as ViewTransition } from "react";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import HeaderClient from "../components/HeaderClient";
import SiteFooter from "../components/SiteFooter";
import ScrollProgress from "../components/motion/ScrollProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://amadevs.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bryan Oliveros Pérez — Desarrollador Full-stack, Conferencista, Consultor y Profesor",
    template: "%s | amadevs",
  },
  description:
    "Bryan Oliveros Pérez (amadevs): desarrollador full-stack con más de 8 años de experiencia. Especialista en desarrollo web, optimización de navegadores y rendimiento web (Core Web Vitals), diseño de requerimientos, arquitectura y escalabilidad, dashboards y plataformas no-code. Especialista en Odoo, Vercel e infraestructura Knotion. Conferencista, consultor y profesor con más de 12 charlas sobre inteligencia artificial, con base en Tijuana, México.",
  keywords: [
    "Bryan Oliveros Pérez",
    "amadevs",
    "desarrollador full-stack",
    "especialista desarrollo web",
    "optimización de navegadores",
    "rendimiento web",
    "Core Web Vitals",
    "SEO técnico",
    "conferencista tecnología",
    "conferencista inteligencia artificial",
    "consultor de software",
    "profesor de desarrollo web",
    "profesor de inteligencia artificial",
    "especialista Odoo",
    "especialista Vercel",
    "infraestructura Knotion",
    "diseño de requerimientos",
    "arquitectura de software",
    "escalabilidad",
    "React.js",
    "Next.js",
    "Node.js",
    "TypeScript",
    "dashboards",
    "plataformas no-code",
    "low-code",
    "sistemas administrativos",
    "POS",
    "Tijuana",
    "México",
    "desarrollo web",
  ],
  authors: [{ name: "Bryan Oliveros Pérez", url: SITE_URL }],
  creator: "Bryan Oliveros Pérez",
  publisher: "amadevs",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: "Bryan Oliveros Pérez — amadevs",
    title: "Bryan Oliveros Pérez — Desarrollador Full-stack, Conferencista, Consultor y Profesor",
    description:
      "Más de 8 años construyendo software web escalable: diseño de requerimientos, arquitectura, dashboards y plataformas no-code. Conferencista, consultor y profesor.",
    images: [
      {
        url: "/profile.png",
        width: 1080,
        height: 1350,
        alt: "Bryan Oliveros Pérez — Desarrollador Full-stack",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bryan Oliveros Pérez — Desarrollador Full-stack, Conferencista, Consultor y Profesor",
    description:
      "Más de 8 años en desarrollo de software: arquitectura, escalabilidad, dashboards y plataformas no-code. Conferencista, consultor y profesor.",
    images: ["/profile.png"],
    creator: "@amadevs",
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
  classification: "Desarrollo Web",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Bryan Oliveros Pérez",
  alternateName: "amadevs",
  jobTitle: ["Desarrollador Full-stack", "Conferencista", "Consultor", "Profesor"],
  description:
    "Desarrollador full-stack con más de 8 años de experiencia en desarrollo de software, diseño de requerimientos, arquitectura y escalabilidad. Especializado en desarrollo web, creación de dashboards y plataformas no-code para usuarios de todos los niveles. Especialista en Odoo, Vercel e infraestructura Knotion. Conferencista, consultor y profesor con más de 12 conferencias sobre inteligencia artificial.",
  url: SITE_URL,
  image: `${SITE_URL}/profile.png`,
  email: "grupoconnectados@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tijuana",
    addressRegion: "Baja California",
    addressCountry: "MX",
  },
  knowsAbout: [
    "Desarrollo de software",
    "Desarrollo web",
    "Optimización de navegadores",
    "Rendimiento web",
    "Core Web Vitals",
    "SEO técnico",
    "Compatibilidad cross-browser",
    "Inteligencia artificial",
    "Diseño de requerimientos",
    "Arquitectura de software",
    "Escalabilidad",
    "Dashboards",
    "Plataformas no-code",
    "Low-code",
    "Odoo",
    "Vercel",
    "Knotion",
    "JavaScript",
    "TypeScript",
    "React.js",
    "Next.js",
    "Node.js",
    "Express",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Firebase",
    "Prisma",
    "Stripe",
    "REST API",
    "GraphQL",
  ],
  sameAs: [
    "https://www.linkedin.com/in/bryan-oliveros-perez-amadevs",
    "https://github.com/amadevss",
    "https://www.instagram.com/amadevss/",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <ScrollProgress />
          <div className="app-shell">
            <HeaderClient />
            <main className="mx-auto max-w-5xl px-5 pt-6 sm:px-6 sm:pt-8">
              <ViewTransition>{children}</ViewTransition>
            </main>
            <div className="mx-auto max-w-5xl px-5 sm:px-6">
              <SiteFooter />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
