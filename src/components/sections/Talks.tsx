import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";
import Logo from "../Logo";
import { talks } from "@/lib/content";

export default function Talks() {
  return (
    <section id="conferencias" className="scroll-mt-24 py-10 sm:py-16">
      <SectionHeading
        eyebrow={`+${talks.length} conferencias y talleres`}
        emoji="🎤"
        title="Conferencias y talleres"
        description="Sesiones sobre inteligencia artificial, desarrollo web y transformación digital para universidades, empresas e instituciones públicas."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {talks.map((t, i) => (
          <Reveal key={t.id} delay={(i % 2) * 0.06}>
            <article className="surface-card flex h-full gap-4 p-5">
                <Logo src={t.logo} alt={t.institution ?? t.title} className="h-11 w-11" />
                <div className="min-w-0">
                  <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight">
                    {t.title}
                  </h3>
                  {t.institution && (
                    <p className="mt-0.5 text-xs font-medium text-primary-ink">{t.institution}</p>
                  )}
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{t.description}</p>
                </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
