import Link from "next/link";
import { profile, socials } from "@/lib/content";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-10">
      <div className="flex flex-col items-center justify-between gap-6 text-sm text-subtle sm:flex-row">
        <div className="flex items-center gap-2">
          <span
            className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold text-white"
            style={{ background: "var(--grad)" }}
          >
            a
          </span>
          <span className="font-medium text-muted">
            {profile.name} · <span className="font-mono">{profile.handle}</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/blog" className="transition hover:text-fg">
            Blog
          </Link>
          <a href={socials.github} target="_blank" rel="noopener noreferrer" className="transition hover:text-fg">
            GitHub
          </a>
          <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="transition hover:text-fg">
            LinkedIn
          </a>
          <a href={`mailto:${profile.email}`} className="transition hover:text-fg">
            Email
          </a>
        </div>

        <p>
          © {year} · Hecho con Next.js
        </p>
      </div>
    </footer>
  );
}
