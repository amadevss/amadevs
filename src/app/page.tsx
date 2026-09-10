import PageDecor from "@/components/PageDecor";
import Hero from "@/components/sections/Hero";
import Metrics from "@/components/sections/Metrics";
import About from "@/components/sections/About";
import Services from "@/components/sections/Services";
import Specialties from "@/components/sections/Specialties";
import Roles from "@/components/sections/Roles";
import Talks from "@/components/sections/Talks";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <div className="relative">
      <PageDecor />
      <Hero />
      <Metrics />
      <About />
      <Services />
      <Specialties />
      <Roles />
      <Talks />
      <Skills />
      <Projects />
      <Contact />
    </div>
  );
}
