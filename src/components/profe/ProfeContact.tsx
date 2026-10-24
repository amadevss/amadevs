import Reveal from "../motion/Reveal";
import { profile, socials } from "@/lib/content";

export default function ProfeContact() {
  return (
    <section id="contacto" className="scroll-mt-24 py-10 sm:py-16">
      <Reveal>
        <div className="surface-card relative overflow-hidden p-8 sm:p-12">
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--grad)" }} />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
            style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)", opacity: 0.2 }}
          />

          <div className="relative max-w-2xl">
            <p className="eyebrow">Contacto</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              ¿Buscas una capacitación, conferencia o curso de IA?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Diseño sesiones a la medida para escuelas, universidades y empresas, presenciales o en
              línea, en México y en el extranjero. Escríbeme y lo planeamos juntos.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/agenda" className="btn btn-primary">
                📅 Agenda una sesión
              </a>
              <a href={socials.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                WhatsApp
              </a>
              <a href={`mailto:${profile.email}`} className="btn btn-ghost">
                {profile.email}
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
