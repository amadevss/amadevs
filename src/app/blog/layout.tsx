import type { ReactNode } from "react";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl py-8 sm:py-12">
      <article className="rounded-2xl border border-black/[.08] bg-white/80 p-6 shadow-sm dark:border-indigo-500/25 dark:bg-slate-900/70 sm:p-8">
        <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-indigo-600 dark:prose-a:text-indigo-300 prose-code:before:content-none prose-code:after:content-none">
          {children}
        </div>
      </article>
    </div>
  );
}
