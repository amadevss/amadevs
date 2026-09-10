import type { ReactNode } from "react";
import Link from "next/link";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl py-10 sm:py-14">
      <Link
        href="/blog"
        className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-subtle transition-colors hover:text-primary-ink"
      >
        <svg
          className="h-4 w-4 transition-transform group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Todos los artículos
      </Link>

      <article className="surface-card overflow-hidden">
        <div className="h-1 w-full" style={{ background: "var(--grad)" }} />

        <div className="p-6 sm:p-10">
          <div
            className="prose prose-slate max-w-none dark:prose-invert
              prose-headings:font-display prose-headings:tracking-tight
              prose-h1:text-3xl prose-h1:mb-6
              prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
              prose-h3:text-base prose-h3:mt-6
              prose-a:text-primary-ink prose-a:no-underline hover:prose-a:underline
              prose-code:before:content-none prose-code:after:content-none
              prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:font-mono
              prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-xl prose-pre:shadow-md
              prose-blockquote:border-primary prose-blockquote:bg-primary-soft prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic
              prose-strong:text-fg
              prose-li:marker:text-primary
              prose-hr:border-border
              prose-table:text-sm"
          >
            {children}
          </div>
        </div>
      </article>
    </div>
  );
}
