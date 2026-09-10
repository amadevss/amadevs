"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, type MouseEvent } from "react";
import { safeViewTransition } from "@/lib/viewTransition";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = (resolvedTheme ?? theme) === "dark";

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    const next = isDark ? "light" : "dark";
    const root = document.documentElement;

    root.style.setProperty("--vt-x", `${e.clientX}px`);
    root.style.setProperty("--vt-y", `${e.clientY}px`);
    root.classList.add("vt-theme");

    safeViewTransition(
      () => setTheme(next),
      () => root.classList.remove("vt-theme"),
    );
  }

  return (
    <button
      type="button"
      aria-label={mounted ? (isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro") : "Cambiar tema"}
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-full border border-border-strong bg-surface text-fg shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
    >
      {!mounted ? (
        <span className="block h-4 w-4 rounded-full bg-subtle/40" />
      ) : isDark ? (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
      ) : (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
