import Link from "next/link";

const posts = [
  {
    slug: "firebase_realtime_database",
    title: "Firebase Realtime Database para chat de soporte",
    description:
      "Guia practica para construir un chat de soporte en tiempo real con reglas, presencia y typing.",
  },
];

export default function BlogPage() {
  return (
    <section className="mx-auto max-w-3xl py-8 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
          Blog
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
          Articulos tecnicos
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Publicaciones escritas en Markdown/MDX dentro del proyecto.
        </p>
      </header>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-black/[.08] bg-white/80 p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-indigo-500/25 dark:bg-slate-900/70"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {post.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
