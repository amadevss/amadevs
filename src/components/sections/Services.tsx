import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";
import TiltCard from "../motion/TiltCard";
import Icon from "../Icon";
import { services } from "@/lib/content";

export default function Services() {
  return (
    <section id="servicios" className="scroll-mt-24 py-10 sm:py-16">
      <SectionHeading
        eyebrow="Servicios"
        emoji="🛠️"
        title="Cómo puedo ayudarte"
        description="Del planteamiento inicial al producto en producción, con acompañamiento técnico en cada etapa."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.06}>
            <TiltCard className="h-full">
                <article className="surface-card group flex h-full flex-col gap-4 p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-lg)]">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl border"
                    style={{
                      color: s.color,
                      background: `${s.color}20`,
                      borderColor: `${s.color}45`,
                    }}
                  >
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    <span className="mr-1.5">{s.emoji}</span>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{s.description}</p>
                </article>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
