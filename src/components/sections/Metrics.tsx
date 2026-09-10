import Reveal from "../motion/Reveal";
import Counter from "../motion/Counter";
import { metrics } from "@/lib/content";

export default function Metrics() {
  return (
    <section className="py-4">
      <div className="surface-card grid grid-cols-2 gap-px overflow-hidden bg-border p-px lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Reveal
            key={m.label}
            as="div"
            delay={i * 0.08}
            y={18}
            className="bg-surface px-5 py-7 text-center"
          >
            <div className="text-xl">{m.emoji}</div>
            <div className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-gradient">
                <Counter value={m.value} prefix={m.prefix} suffix={m.suffix} text={m.text} />
              </span>
            </div>
            <div className="mt-2 text-xs font-medium uppercase tracking-wider text-subtle">
              {m.label}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
