import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";
import ScrollTilt from "../motion/ScrollTilt";
import { roles } from "@/lib/content";

const deco = [
  { emoji: "🎤", color: "#8b5cf6" },
  { emoji: "🧭", color: "#06b6d4" },
  { emoji: "🎓", color: "#f59e0b" },
];

export default function Roles() {
  return (
    <section id="roles" className="scroll-mt-24 py-10 sm:py-16">
      <SectionHeading
        eyebrow="Más allá del código"
        emoji="🎓"
        title="Conferencista · Consultor · Profesor"
        description="Comparto lo aprendido en 8+ años de práctica: en escenarios, con equipos y en el aula."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {roles.map((r, i) => {
          const d = deco[i % deco.length];
          return (
            <ScrollTilt key={r.key} strength={12}>
              <Reveal delay={i * 0.08} className="h-full">
                <article className="surface-card relative flex h-full flex-col p-6">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl text-xl"
                    style={{ background: `${d.color}20`, border: `1px solid ${d.color}45` }}
                  >
                    {d.emoji}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{r.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{r.summary}</p>

                  {r.highlights.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-border pt-4">
                      {r.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm text-fg">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: d.color }}
                          />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </Reveal>
            </ScrollTilt>
          );
        })}
      </div>
    </section>
  );
}
