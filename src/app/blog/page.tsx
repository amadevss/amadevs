import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Artículos técnicos",
  description:
    "Artículos sobre desarrollo web moderno, arquitectura, escalabilidad y herramientas por Bryan Oliveros Pérez (amadevs).",
};

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

export default function BlogPage() {
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

                <div className="mt-4 flex items-center gap-3 text-xs text-subtle">
                  <span>{formatDate(post.date)}</span>
                  <span className="h-1 w-1 rounded-full bg-border-strong" />
                  <span>{post.readTime} min de lectura</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
