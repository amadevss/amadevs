import { profile, socials } from "@/lib/content";

const WA_TEXT = encodeURIComponent(
  "Hola Bryan, me interesa una conferencia o taller para un grupo. Te comparto: tema de interés, número de asistentes, fecha tentativa y modalidad (presencial u online).",
);

const MAIL_SUBJECT = encodeURIComponent("Cotización — conferencia / taller para grupo");
const MAIL_BODY = encodeURIComponent(
  [
    "Hola Bryan,",
    "",
    "Me interesa una conferencia o taller para un grupo.",
    "",
    "· Tema de interés:",
    "· Número de asistentes:",
    "· Fecha tentativa:",
    "· Modalidad (presencial u online):",
    "· Ciudad / sede:",
    "",
    "Gracias.",
  ].join("\n"),
);

export default function GroupQuoteCard() {
  const wa = `${socials.whatsapp}?text=${WA_TEXT}`;
  const mail = `mailto:${profile.email}?subject=${MAIL_SUBJECT}&body=${MAIL_BODY}`;

  return (
    <section className="surface-card p-6 sm:p-8">
      <p className="eyebrow">Para grupos</p>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
        Conferencia o taller para un grupo
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
        Sesiones para equipos, universidades y eventos. El precio depende del aforo, la
        duración y si es presencial u online, así que se cotiza a la medida.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          Cotizar por WhatsApp
        </a>
        <a href={mail} className="btn btn-ghost">
          Cotizar por correo
        </a>
      </div>
    </section>
  );
}
