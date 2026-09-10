import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";

const focus = [
  "Desarrollo web moderno (Next.js, Node.js)",
  "Optimización de navegadores y rendimiento web",
  "Diseño de requerimientos y arquitectura",
  "Escalabilidad, SEO técnico y Core Web Vitals",
  "Dashboards y plataformas a medida",
  "Odoo · Vercel · infraestructura Knotion",
  "No-code / low-code e IA aplicada",
  "Conferencias y formación de equipos",
];

export default function About() {
  return (
    <section id="sobre-mi" className="scroll-mt-24 py-10 sm:py-16">
      <SectionHeading
        eyebrow="Sobre mí"
        emoji="🧑‍💻"
        title="Más de 8 años convirtiendo ideas en productos web que escalan"
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Reveal className="space-y-4 text-[15px] leading-relaxed text-muted">
          <p>
            Soy <strong className="text-fg">Bryan Oliveros Pérez</strong> (
            <span className="font-mono text-primary-ink">amadevs</span>), desarrollador full-stack
            con más de 8 años de experiencia en el sector del desarrollo de software. Acompaño a
            empresas, instituciones y equipos desde la <strong className="text-fg">definición de
            requerimientos</strong> hasta la puesta en producción, cuidando la arquitectura, la
            seguridad y la <strong className="text-fg">escalabilidad</strong> en cada decisión.
          </p>
          <p>
            Soy especialista en <strong className="text-fg">desarrollo web</strong>, en la
            <strong className="text-fg"> optimización de navegadores</strong> y el rendimiento web
            (Core Web Vitals, carga, renderizado y compatibilidad cross-browser), y en todo lo que
            rodea a la web moderna: aplicaciones con Next.js y Node.js,{" "}
            <strong className="text-fg">creación de dashboards</strong> y paneles de control, sistemas
            administrativos, puntos de venta y <strong className="text-fg">plataformas no-code y
            low-code</strong>. También en <strong className="text-fg">Odoo</strong>,{" "}
            <strong className="text-fg">Vercel</strong> e <strong className="text-fg">infraestructura
            Knotion</strong>. Diseño soluciones para usuarios de todos los niveles, desde quien nunca
            ha usado un panel de administración hasta equipos técnicos exigentes.
          </p>
          <p>
            Además de construir, <strong className="text-fg">enseño y comparto</strong>: soy
            conferencista, consultor y profesor, con más de 12 charlas y talleres sobre inteligencia
            artificial y desarrollo para universidades, empresas e instituciones públicas. Con base en
            Tijuana, México, colaboro con clientes a nivel nacional e internacional.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="surface-card self-start p-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-subtle">
            En qué me enfoco
          </h3>
          <ul className="mt-4 space-y-2.5">
            {focus.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-fg">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--grad)" }}
                />
                {f}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
