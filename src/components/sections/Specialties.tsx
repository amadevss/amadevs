import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";
import TiltCard from "../motion/TiltCard";
import Logo from "../Logo";
import { specialties } from "@/lib/content";

const webExtras = [
  { emoji: "🌐", label: "Desarrollo web", color: "#3b82f6" },
  { emoji: "🧭", label: "Optimización de navegadores", color: "#0ea5e9" },
  { emoji: "⚡", label: "Rendimiento web · Core Web Vitals", color: "#f59e0b" },
  { emoji: "🧩", label: "Compatibilidad cross-browser", color: "#8b5cf6" },
  { emoji: "🔎", label: "SEO técnico", color: "#10b981" },
  { emoji: "♿", label: "Accesibilidad", color: "#ec4899" },
];

export default function Specialties() {
  return (
    <section id="especialidades" className="scroll-mt-24 py-10 sm:py-16">
      <SectionHeading
        eyebrow="Especialidades"
        emoji="⚡"
        title="En lo que soy especialista"
        description="Desarrollo web de punta a punta y las plataformas donde acompaño la implementación completa: de la decisión técnica a la operación."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {specialties.map((s, i) => (
          <Reveal key={s.name} delay={i * 0.06}>
            <TiltCard className="h-full">
                <article
                  className="surface-card flex h-full flex-col gap-4 p-6"
                  style={{ borderColor: `${s.color}40` }}
                >
                  <div className="flex items-center gap-3">
                    <Logo src={s.logo} alt={s.name} className="h-12 w-12" />
                    <h3 className="font-display text-lg font-semibold tracking-tight">
                      <span className="mr-1.5">{s.emoji}</span>
                      {s.name}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{s.purpose}</p>
                  <span
                    className="mt-auto h-1 w-14 rounded-full"
                    style={{ background: s.color }}
                    aria-hidden
                  />
                </article>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1} className="mt-5">
        <div className="surface-card flex flex-wrap gap-2.5 p-5">
          <span className="mr-1 self-center font-display text-sm font-semibold uppercase tracking-wider text-subtle">
            🌐 También en la web
          </span>
          {webExtras.map((e) => (
            <span
              key={e.label}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium text-fg"
              style={{ background: `${e.color}14`, borderColor: `${e.color}40` }}
            >
              <span>{e.emoji}</span>
              {e.label}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
