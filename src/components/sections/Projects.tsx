import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";
import ProjectCard from "../ProjectCard";
import { projects } from "@/lib/content";

export default function Projects() {
  return (
    <section id="proyectos" className="scroll-mt-24 py-10 sm:py-16">
      <SectionHeading
        eyebrow="Trabajo"
        emoji="🚀"
        title="Proyectos"
        description={`+${projects.length} plataformas, sistemas y sitios en producción para educación, deporte, salud, comercio y organizaciones.`}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <Reveal key={p.url} delay={(i % 3) * 0.06}>
            <ProjectCard {...p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
