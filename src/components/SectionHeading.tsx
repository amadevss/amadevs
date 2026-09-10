import Reveal from "./motion/Reveal";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  emoji?: string;
};

export default function SectionHeading({ eyebrow, title, description, emoji }: Props) {
  return (
    <Reveal className="mb-10 max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h2>
      {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
    </Reveal>
  );
}
