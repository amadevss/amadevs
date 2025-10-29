import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import HeaderClient from "../components/HeaderClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://amadevs.vercel.app"),
  title: {
    default: "Desarrollador Full-stack | Portfolio",
    template: "%s | amadevs",
  },
  description:
    "Desarrollador Full-stack especializado en React.js, Next.js, Node.js y TypeScript. Creo aplicaciones web escalables, sistemas administrativos, POS personalizados y plataformas modernas con integraciones inteligentes.",
  keywords: [
    "desarrollador full-stack",
    "desarrollador web",
    "React.js",
    "Next.js",
    "Node.js",
    "TypeScript",
    "JavaScript",
    "desarrollo web",
    "aplicaciones web",
    "sistemas administrativos",
    "POS",
    "MongoDB",
    "PostgreSQL",
    "Firebase",
    "Stripe",
    "Vercel",
    "desarrollador freelance",
    "programador",
    "desarrollo de software",
  ],
  authors: [{ name: "amadevs" }],
  creator: "amadevs",
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
    siteName: "amadevs - Desarrollador Full-stack",
    title: "Desarrollador Full-stack | Portfolio Profesional",
    description:
      "Desarrollador Full-stack especializado en React.js, Next.js, Node.js y TypeScript. Creo aplicaciones web escalables, sistemas administrativos, POS personalizados y plataformas modernas.",
    images: [
      {
        url: "/profile.jpeg",
        width: 1200,
        height: 630,
        alt: "Desarrollador Full-stack - amadevs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Desarrollador Full-stack | Portfolio",
    description:
      "Desarrollador Full-stack especializado en React.js, Next.js, Node.js y TypeScript. Creo aplicaciones web escalables y sistemas modernos.",
    images: ["/profile.jpeg"],
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
  name: "amadevs",
  jobTitle: "Desarrollador Full-stack",
  description:
    "Desarrollador Full-stack especializado en React.js, Next.js, Node.js y TypeScript. Creo aplicaciones web escalables, sistemas administrativos, POS personalizados y plataformas modernas.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://amadevs.vercel.app",
  knowsAbout: [
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
    "Mongoose",
    "Stripe",
    "JWT",
    "OAuth",
    "REST API",
    "GraphQL",
    "Desarrollo Web",
  ],
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <div className="min-h-dvh bg-[radial-gradient(1200px_800px_at_50%_-200px,rgba(99,102,241,0.20),transparent)] dark:bg-[radial-gradient(1200px_800px_at_50%_-200px,rgba(139,92,246,0.25),transparent)] dark:bg-gradient-to-b dark:from-slate-950 dark:via-indigo-950/50 dark:to-slate-950">
            <HeaderClient />
            <main className="mx-auto max-w-4xl px-6 pb-10">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
