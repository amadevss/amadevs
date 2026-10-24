import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";

const topics = [
  "IA generativa aplicada a la docencia",
  "ChatGPT, Claude y Perplexity: herramientas y protocolos",
  "IA y la Nueva Escuela Mexicana: planeaciones y recursos",
  "Agentes con low-code: Gemini Gems y NotebookLM",
  "MCPs y APIs con Vercel y Next.js",
  "Google Workspace para clases en línea",
  "IA en procesos de empresa y despachos",
];

export default function ProfeAbout() {
  return (
    <section id="sobre-mi" className="scroll-mt-24 py-10 sm:py-16">
      <SectionHeading
        eyebrow="Sobre mí"
        emoji="🧑‍🏫"
        title="Enseño inteligencia artificial para que se use, no solo para que se entienda"
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Reveal className="space-y-4 text-[15px] leading-relaxed text-muted">
          <p>
            Soy <strong className="text-fg">Bryan Oliveros Pérez</strong>, profesor, conferencista y
            consultor. Formo a personas de todos los niveles en{" "}
            <strong className="text-fg">inteligencia artificial</strong> y desarrollo web moderno,
            desde fundamentos hasta arquitectura avanzada y buenas prácticas de producción.
          </p>
          <p>
            Soy <strong className="text-fg">profesor de IA y consultoría en el Tec de Monterrey</strong>{" "}
            y dirijo la vertical de IA de un programa de capacitación continua docente, con una
            comunidad de más de 200 maestros en Tijuana. He impartido más de 12 charlas y talleres
            para universidades, empresas e instituciones públicas.
          </p>
          <p>
            Además de enseñar, construyo software desde hace más de 8 años, así que lo que comparto
            sale de la práctica: herramientas que funcionan hoy y cómo aplicarlas en el aula y en el
            trabajo diario.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="surface-card self-start p-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-subtle">
            Temas que imparto
          </h3>
          <ul className="mt-4 space-y-2.5">
            {topics.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-fg">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--grad)" }} />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
