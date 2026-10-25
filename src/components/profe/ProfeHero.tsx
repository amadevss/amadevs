import Image from "next/image";
import RotatingRoles from "../motion/RotatingRoles";
import { profile } from "@/lib/content";

const ROLES = ["Profesor de IA", "Conferencista", "Formador docente", "Consultor en IA aplicada"];

/** Portada de profe.<dominio>: misma estructura que el Hero principal, enfocada en docencia. */
export default function ProfeHero() {
  return (
    <section id="inicio" className="relative scroll-mt-24 pt-10 pb-10 sm:pt-14 sm:pb-16">
      <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="hero-in eyebrow" style={{ "--d": "0s" } as React.CSSProperties}>
            🎓 Docencia e inteligencia artificial
          </p>

          <h1
            className="hero-in mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ "--d": "0.05s" } as React.CSSProperties}
          >
            {profile.name}
          </h1>

          <div
            className="hero-in mt-3 text-2xl font-semibold sm:text-3xl"
            style={{ "--d": "0.15s" } as React.CSSProperties}
          >
            <RotatingRoles items={ROLES} />
          </div>

          <p
            className="hero-in mt-6 max-w-xl text-[15px] leading-relaxed text-muted"
            style={{ "--d": "0.25s" } as React.CSSProperties}
          >
            Formo a docentes, estudiantes y equipos de trabajo para usar la inteligencia artificial con
            criterio: desde los fundamentos hasta agentes, MCPs y buenas prácticas, en el aula y en la
            empresa. Más de 12 conferencias y talleres y más de 1000 docentes capacitados.
          </p>

          <div
            className="hero-in mt-8 flex flex-wrap items-center gap-3"
            style={{ "--d": "0.35s" } as React.CSSProperties}
          >
            {/* <a> a propósito: /cursos vive en otro subdominio (redirección del middleware). */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/cursos" className="btn btn-primary">
              📚 Ver cursos
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#conferencias" className="btn btn-ghost">
              🎤 Conferencias y talleres
            </a>
          </div>

          <p
            className="hero-in mt-6 flex items-center gap-2 text-sm text-subtle"
            style={{ "--d": "0.5s" } as React.CSSProperties}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            📍 {profile.location} · capacitaciones presenciales y en línea
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div
            aria-hidden
            className="hero-glow absolute -bottom-12 -left-12 -z-10 h-52 w-52 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(249,115,22,0.42) 0%, rgba(249,115,22,0.15) 45%, transparent 75%)",
            }}
          />
          <div
            aria-hidden
            className="hero-glow hero-glow--b absolute -right-12 -top-12 -z-10 h-44 w-44 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0.14) 45%, transparent 75%)",
            }}
          />

          <div className="hero-in" style={{ "--d": "0.2s" } as React.CSSProperties}>
            <div className="hero-portrait surface-card relative overflow-hidden p-4">
              <div className="absolute inset-x-0 top-0 z-10 h-1" style={{ background: "var(--grad)" }} />
              <div className="relative w-full overflow-hidden rounded-2xl">
                <div className="rounded-2xl p-[3px]" style={{ background: "var(--grad)" }}>
                  <div className="relative overflow-hidden rounded-[calc(1rem-3px)] bg-black">
                    <Image
                      src="/profile.png"
                      alt={`Retrato de ${profile.name}`}
                      width={540}
                      height={675}
                      priority
                      className="aspect-[4/5] w-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
