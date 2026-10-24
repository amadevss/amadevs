import PageDecor from "@/components/PageDecor";
import Metrics from "@/components/sections/Metrics";
import Talks from "@/components/sections/Talks";
import ProfeHero from "@/components/profe/ProfeHero";
import ProfeAbout from "@/components/profe/ProfeAbout";
import ProfeRoles from "@/components/profe/ProfeRoles";
import ProfeContact from "@/components/profe/ProfeContact";

/** profe.bryanoliveros.com: docencia e IA. Los datos se comparten con la landing (content.ts). */
export default function ProfeHome() {
  return (
    <div className="relative">
      <PageDecor />
      <ProfeHero />
      <Metrics />
      <ProfeAbout />
      <ProfeRoles />
      <Talks />
      <ProfeContact />
    </div>
  );
}
