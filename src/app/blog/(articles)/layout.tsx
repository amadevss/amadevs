import type { ReactNode } from "react";
import Link from "next/link";
import ReadingProgress from "@/components/ReadingProgress";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ReadingProgress />

      <div className="mx-auto max-w-3xl py-10 sm:py-14 px-4">
        {/* Back button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition-colors mb-8 group"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Todos los artículos
        </Link>

        {/* Article card */}
        <article className="rounded-2xl border border-black/[.08] bg-white/80 shadow-sm dark:border-indigo-500/25 dark:bg-slate-900/70 dark:shadow-indigo-500/10 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-6 sm:p-10">
            <div className="prose prose-slate max-w-none dark:prose-invert
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h1:text-3xl prose-h1:mb-6
              prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-black/[.06] dark:prose-h2:border-indigo-500/20 prose-h2:pb-2
              prose-h3:text-base prose-h3:mt-6
              prose-a:text-indigo-600 dark:prose-a:text-indigo-300 prose-a:no-underline hover:prose-a:underline
              prose-code:before:content-none prose-code:after:content-none
              prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:font-mono
              prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-xl prose-pre:shadow-md
              prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50/60 dark:prose-blockquote:bg-indigo-950/40 prose-blockquote:rounded-r-lg prose-blockquote:py-1
              prose-strong:text-slate-900 dark:prose-strong:text-white
              prose-li:marker:text-indigo-400
              prose-hr:border-black/[.06] dark:prose-hr:border-indigo-500/20
              prose-table:text-sm">
              {children}
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
