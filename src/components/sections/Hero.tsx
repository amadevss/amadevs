import Image from "next/image";
import RotatingRoles from "../motion/RotatingRoles";
import { profile } from "@/lib/content";

/**
 * Antes: componente cliente con `useScroll` + 6 `useTransform` + springs de
 * puntero manejando rotateX/rotateY/scale sobre la tarjeta en cada frame de
 * scroll y de movimiento del ratón.
 *
 * Ahora: componente de servidor. La entrada es una animación de carga CSS
 * (`.hero-in`, con stagger vía `--d`), el retrato se inclina un poco sólo al
 * pasar el puntero (`.hero-portrait:hover`) y los resplandores flotan con un
 * keyframe lento en el compositor.
 */
export default function Hero() {
  return (
    <section className="relative pt-10 pb-10 sm:pt-14 sm:pb-16">
      <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Texto */}
        <div>
          <p className="hero-in eyebrow" style={{ "--d": "0s" } as React.CSSProperties}>
            📍 {profile.location} · <span className="font-mono">@{profile.handle}</span>
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
            <RotatingRoles items={profile.roles} />
          </div>

          <p
            className="hero-in mt-6 max-w-xl text-[15px] leading-relaxed text-muted"
            style={{ "--d": "0.25s" } as React.CSSProperties}
          >
            {profile.tagline}
          </p>

          <div
            className="hero-in mt-8 flex flex-wrap items-center gap-3"
            style={{ "--d": "0.35s" } as React.CSSProperties}
          >
            <a href="#contacto" className="btn btn-primary">
              💬 Hablemos
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#proyectos" className="btn btn-ghost">
              🚀 Ver proyectos
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
            ✈️ {profile.availability}
          </p>
        </div>

        {/* Retrato: leve tilt al pasar el puntero, resplandores flotando */}
        <div className="relative mx-auto w-full max-w-sm">
          <div
            aria-hidden
            className="hero-glow absolute -bottom-6 -left-6 -z-10 h-36 w-36 rounded-full blur-3xl"
          >
            <div
              className="h-full w-full rounded-full"
              style={{ background: "radial-gradient(circle,rgba(139,92,246,0.55),transparent 70%)" }}
            />
          </div>
          <div
            aria-hidden
            className="hero-glow hero-glow--b absolute -right-6 -top-6 -z-10 h-28 w-28 rounded-full blur-3xl"
          >
            <div
              className="h-full w-full rounded-full"
              style={{ background: "radial-gradient(circle,rgba(240,145,59,0.55),transparent 70%)" }}
            />
          </div>

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
