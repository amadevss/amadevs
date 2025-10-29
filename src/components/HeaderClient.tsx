"use client";

import ThemeToggle from "./ThemeToggle";

export default function HeaderClient() {
  return (
    <header className="mx-auto max-w-4xl px-6 py-5 flex items-center justify-between">
      <span className="text-sm font-medium opacity-80 dark:text-indigo-300 dark:opacity-90">amadevs</span>
      <ThemeToggle />
    </header>
  );
}


