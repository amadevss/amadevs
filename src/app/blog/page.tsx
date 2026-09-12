import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogStats } from "@/lib/blog/stats";

export const metadata: Metadata = {
  title: "Artículos técnicos",
  description:
    "Artículos sobre desarrollo web moderno, arquitectura, escalabilidad y herramientas por Bryan Oliveros Pérez (amadevs).",
};

export const dynamic = "force-dynamic";

type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  tags: string[];
};

const posts: Post[] = [
  {
    slug: "algo-pasa",
    title: "Algo pasa",
    description:
      "Una reflexión personal sobre la soledad, los momentos efímeros y las ganas de construir una versión mejor de mí mismo.",
    date: "2026-09-11",
    readTime: 2,
    tags: ["Personal", "Reflexión"],
  },
  {
    slug: "view_transitions_nextjs",
    title: "View Transitions en Next.js: animaciones nativas entre páginas",
    description:
      "Cómo implementar transiciones fluidas entre páginas en Next.js usando la View Transitions API nativa del navegador, sin librerías externas.",
    date: "2025-08-22",
    readTime: 6,
    tags: ["Next.js", "CSS", "Animaciones"],
  },
  {
    slug: "firebase_realtime_database",
    title: "Firebase Realtime Database para chat de soporte",
    description:
      "Guía práctica para construir un chat de soporte en tiempo real con reglas de seguridad, presencia y typing — portable a cualquier framework.",
    date: "2025-08-01",
    readTime: 8,
    tags: ["Firebase", "Realtime", "Chat"],
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const stats = await getAllBlogStats();

  return (
    <section className="mx-auto max-w-3xl py-12 sm:py-16">
      <header className="mb-10">
        <p className="eyebrow">Blog</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Artículos técnicos</h1>
        <p className="mt-2 text-muted">
          {posts.length} artículo{posts.length !== 1 ? "s" : ""} sobre desarrollo web, arquitectura y
          herramientas.
        </p>
      </header>

      <ul className="space-y-5">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="surface-card group block overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
            >
              <div className="h-1 w-full" style={{ background: "var(--grad)" }} />
              <div className="p-5 sm:p-6">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-subtle"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary-ink">
                    {post.title}
                  </h2>
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-subtle transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary-ink"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-muted">{post.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-subtle">
                  <span>{formatDate(post.date)}</span>
                  <span className="h-1 w-1 rounded-full bg-border-strong" />
                  <span>{post.readTime} min de lectura</span>
                  <span className="h-1 w-1 rounded-full bg-border-strong" />
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21l-7.682-8.318a4.5 4.5 0 010-6.364z"
                      />
                    </svg>
                    {stats[post.slug]?.likes ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {stats[post.slug]?.views ?? 0}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
