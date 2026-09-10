"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import SocialLinks from "./SocialLinks";

const NAV = [
  { href: "/#sobre-mi", label: "Sobre mí" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#roles", label: "Roles" },
  { href: "/#conferencias", label: "Conferencias" },
  { href: "/#proyectos", label: "Proyectos" },
  { href: "/blog", label: "Blog" },
  { href: "/agenda", label: "Agenda" },
];

export default function HeaderClient() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50" style={{ viewTransitionName: "site-header" }}>
      <div
        className={`mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 transition-all duration-300 sm:px-6 ${
          scrolled
            ? "mt-3 mb-2 rounded-full border border-border bg-surface/85 py-2 shadow-[var(--shadow-md)] backdrop-blur-xl"
            : "mt-3 border border-transparent py-4"
        }`}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-[15px] font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ background: "var(--grad)" }}>
            <span className="text-xs font-bold">a</span>
          </span>
          amadevs
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-2.5 py-1.5 text-sm font-medium text-muted transition hover:bg-primary-soft hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SocialLinks className="hidden lg:flex" btnClass="h-8 w-8" iconClass="h-[15px] w-[15px]" />
          <span className="hidden h-5 w-px bg-border-strong lg:block" />
          <Link
            href="/agenda"
            className="hidden shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:inline-flex"
            style={{ background: "var(--grad)" }}
          >
            Agenda una sesión
          </Link>
          <ThemeToggle />
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border-strong bg-surface md:hidden"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-1 max-w-5xl px-5 md:hidden">
          <nav className="flex flex-col gap-1 rounded-2xl border border-border bg-surface/95 p-2 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-primary-soft hover:text-fg"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-1 border-t border-border px-1 pt-2">
              <SocialLinks />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
