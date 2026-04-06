"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function HeaderClient() {
  return (
    <header className="mx-auto max-w-4xl px-6 py-5 flex items-center justify-between">
      <span className="text-sm font-medium opacity-80 dark:text-indigo-300 dark:opacity-90">amadevs</span>
      <div className="flex items-center gap-3">
        <Link
          href="/blog"
          className="rounded-md border border-black/[.08] bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white dark:border-indigo-500/30 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Blog
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}


