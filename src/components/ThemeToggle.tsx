"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = (resolvedTheme ?? theme) === "dark";
  const label = isDark ? "🌙 Oscuro" : "☀️ Claro";

  if (!mounted) return (
    <button className="rounded-full border border-black/[.08] dark:border-indigo-500/30 bg-white/70 dark:bg-indigo-500/20 dark:backdrop-blur-sm px-3 py-1.5 text-sm opacity-70 dark:opacity-90" aria-hidden>
      …
    </button>
  );

  return (
    <button
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border border-black/[.08] dark:border-indigo-500/30 bg-white/70 dark:bg-indigo-500/20 dark:backdrop-blur-sm px-3 py-1.5 text-sm dark:text-indigo-200 hover:shadow-sm dark:hover:shadow-indigo-500/30 dark:hover:bg-indigo-500/30 transition-all font-medium"
    >
      {label}
    </button>
  );
}


