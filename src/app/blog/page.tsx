import Link from "next/link";

type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  tags: string[];
  accent: string;
};

const posts: Post[] = [
  {
    slug: "firebase_realtime_database",
    title: "Firebase Realtime Database para chat de soporte",
    description:
      "Guía práctica para construir un chat de soporte en tiempo real con reglas de seguridad, presencia y typing — portable a cualquier framework.",
    date: "2025-08-01",
    readTime: 8,
    tags: ["Firebase", "Realtime", "Chat"],
    accent: "from-orange-400 to-amber-500",
  },
  {
    slug: "view_transitions_nextjs",
    title: "View Transitions en Next.js: animaciones nativas entre páginas",
    description:
      "Cómo implementar transiciones fluidas entre páginas en Next.js usando la View Transitions API nativa del navegador, sin librerías externas.",
    date: "2025-08-22",
    readTime: 6,
    tags: ["Next.js", "CSS", "Animaciones"],
    accent: "from-indigo-400 to-purple-500",
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
    <section className="mx-auto max-w-3xl py-8 sm:py-12 px-4">
      {/* Header */}
      <header className="mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
          Blog
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Artículos técnicos
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {posts.length} artículo{posts.length !== 1 ? "s" : ""} sobre desarrollo web, arquitectura y herramientas.
        </p>
      </header>

      {/* Post list */}
      <ul className="space-y-5">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-0 rounded-2xl border border-black/[.06] dark:border-indigo-500/20 bg-white/80 dark:bg-slate-900/70 shadow-sm dark:shadow-indigo-500/10 overflow-hidden hover:shadow-md dark:hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Color accent top bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${post.accent}`} />

              <div className="p-5 sm:p-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title + arrow */}
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold leading-snug text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {post.title}
                  </h2>
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {post.description}
                </p>

                {/* Meta: date + read time */}
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                  <span>{formatDate(post.date)}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
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
