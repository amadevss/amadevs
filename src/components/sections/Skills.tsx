import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";
import { skillGroups } from "@/lib/content";

export default function Skills() {
  return (
    <section id="habilidades" className="scroll-mt-24 py-10 sm:py-16">
      <SectionHeading
        eyebrow="Stack"
        emoji="🧠"
        title="Habilidades técnicas"
        description="Tecnologías y áreas donde más aporto valor."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {skillGroups.map((group, i) => (
          <Reveal key={group.title} delay={i * 0.05}>
            <div className="surface-card h-full p-6">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-subtle">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-lg text-sm"
                    style={{ background: `${group.color}20`, border: `1px solid ${group.color}45` }}
                  >
                    {group.emoji}
                  </span>
                  {group.title}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border px-2.5 py-1 text-[13px] font-medium text-fg"
                      style={{ background: `${group.color}12`, borderColor: `${group.color}33` }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
