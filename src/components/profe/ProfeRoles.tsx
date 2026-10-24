import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";
import { roles } from "@/lib/content";

/** Solo los roles de docencia, en este orden. Los datos salen de content.ts. */
const SHOWN = [
  { key: "profesor", emoji: "🎓", color: "#f97316" },
  { key: "conferencista", emoji: "🎤", color: "#f59e0b" },
];

export default function ProfeRoles() {
  const items = SHOWN.flatMap((d) => {
    const role = roles.find((r) => r.key === d.key);
    return role ? [{ ...role, ...d }] : [];
  });

  return (
    <section id="roles" className="scroll-mt-24 py-10 sm:py-16">
      <SectionHeading
        eyebrow="En el aula y en el escenario"
        emoji="🎓"
        title="Profesor · Conferencista"
        description="Comparto lo aprendido en más de 8 años de práctica con docentes, estudiantes y equipos."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {items.map((r, i) => (
          <Reveal key={r.key} delay={i * 0.08} className="h-full">
            <article className="surface-card relative flex h-full flex-col p-6">
              <span
                className="grid h-11 w-11 place-items-center rounded-xl text-xl"
                style={{ background: `${r.color}20`, border: `1px solid ${r.color}45` }}
              >
                {r.emoji}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{r.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{r.summary}</p>
              {r.highlights.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {r.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-fg">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r.color }} />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
