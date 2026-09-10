import SectionHeading from "../SectionHeading";
import Reveal from "../motion/Reveal";
import ScrollTilt from "../motion/ScrollTilt";
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
          <ScrollTilt key={p.url} strength={13}>
            <Reveal delay={(i % 3) * 0.06} tilt={10}>
              <ProjectCard {...p} />
            </Reveal>
          </ScrollTilt>
        ))}
      </div>
    </section>
  );
}
