import Image from "next/image";
import ProjectCard from "../components/ProjectCard";

const projects = [
  { title: "IBFK", url: "https://www.ibfk.edu.mx/" },
  { title: "Area 51 PV", url: "https://area-51-pv.vercel.app/" },
  { title: "Clínica Dental Luz", url: "https://clinicadentalluz.vercel.app/" },
  { title: "Connectados", url: "https://www.connectados.tech/" },
  { title: "Eligue", url: "https://www.eligue.com.mx/" },
  { title: "Nelson Bar", url: "https://www.nelsonbar.com.mx/" },
  { title: "QommAdd", url: "https://qommadd.com/" },
];

export default function Home() {
  return (
    <div className="min-h-screen py-6 sm:py-10">
      <main className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Hero con imagen protagonista */}
        <section className="relative overflow-hidden rounded-2xl border border-black/[.06] dark:border-indigo-500/20 bg-white/70 dark:bg-gradient-to-br dark:from-slate-900/90 dark:to-indigo-950/50 px-6 py-7 shadow-sm dark:shadow-indigo-500/10">
          <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-gradient-to-br from-fuchsia-400/30 to-indigo-400/30 dark:from-fuchsia-500/40 dark:to-indigo-500/40 blur-2xl" />
          <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full bg-gradient-to-tr from-sky-400/30 to-emerald-400/30 dark:from-sky-500/40 dark:to-emerald-500/40 blur-2xl" />

          <div className="relative flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative">
              <div className="relative h-[160px] w-[160px] sm:h-[180px] sm:w-[180px] rounded-full p-[3px] bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-sky-400 dark:from-fuchsia-400 dark:via-indigo-400 dark:to-sky-300 shadow-lg dark:shadow-indigo-500/50">
                <div className="h-full w-full rounded-full overflow-hidden bg-white dark:bg-slate-800">
                  <Image src="/profile.jpeg" alt="Foto de perfil" width={180} height={180} className="h-full w-full object-cover" priority />
                </div>
              </div>
              <div className="absolute -right-2 -bottom-2 rounded-full bg-white dark:bg-emerald-500 px-2 py-1 text-[11px] border border-black/[.06] dark:border-emerald-400/30 dark:text-white font-medium shadow-sm dark:shadow-emerald-500/30">Disponible</div>
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">Desarrollador Full‑stack</h1>
              <p className="mt-2 text-neutral-700 dark:text-slate-300 max-w-prose">
                Construyo apps web escalables, seguras y optimizadas. Sistemas administrativos, POS
                a medida y plataformas modernas con integraciones inteligentes.
              </p>
            </div>
          </div>
        </section>

        {/* Habilidades */}
        <section className="bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/40 dark:bg-gradient-to-br dark:from-slate-900/90 dark:to-indigo-950/50 border border-black/[.06] dark:border-indigo-500/20 rounded-lg p-6 shadow-sm dark:shadow-indigo-500/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">⚙️ Habilidades Técnicas</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Tecnologías y áreas en las que más aporto valor.</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lenguajes y Frameworks */}
            <div className="rounded-lg border border-black/[.06] dark:border-indigo-500/20 bg-white/80 dark:bg-slate-800/60 p-4 hover:shadow-md dark:hover:shadow-indigo-500/20 transition-shadow">
              <h3 className="font-medium text-slate-900 dark:text-indigo-300">🧠 Lenguajes y Frameworks</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                <span className="rounded-md border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-500/30 dark:text-yellow-100 dark:shadow-yellow-500/20 dark:shadow-sm px-2.5 py-1 font-medium">JavaScript</span>
                <span className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/30 dark:text-blue-100 dark:shadow-blue-500/20 dark:shadow-sm px-2.5 py-1 font-medium">TypeScript</span>
                <span className="rounded-md border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/50 dark:bg-cyan-500/30 dark:text-cyan-100 dark:shadow-cyan-500/20 dark:shadow-sm px-2.5 py-1 font-medium">React.js</span>
                <span className="rounded-md border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/50 dark:bg-purple-500/30 dark:text-purple-100 dark:shadow-purple-500/20 dark:shadow-sm px-2.5 py-1 font-medium">Next.js (SSR/SSG/SPA/PWA)</span>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/30 dark:text-emerald-100 dark:shadow-emerald-500/20 dark:shadow-sm px-2.5 py-1 font-medium">Node.js</span>
                <span className="rounded-md border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/30 dark:text-orange-100 dark:shadow-orange-500/20 dark:shadow-sm px-2.5 py-1 font-medium">Express</span>
              </div>
            </div>

            {/* Bases de Datos */}
            <div className="rounded-lg border border-black/[.06] dark:border-indigo-500/20 bg-white/80 dark:bg-slate-800/60 p-4 hover:shadow-md dark:hover:shadow-indigo-500/20 transition-shadow">
              <h3 className="font-medium text-slate-900 dark:text-indigo-300">🗄️ Bases de Datos</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-neutral-700 dark:text-slate-300">
                <li className="dark:text-slate-200">PostgreSQL, MySQL, SQLite, MongoDB, Firebase</li>
                <li className="dark:text-slate-200">Modelado de datos, relaciones y consultas optimizadas</li>
                <li className="dark:text-slate-200">Integración de ORM como Prisma o Mongoose</li>
              </ul>
            </div>

            {/* Integraciones y Funcionalidades */}
            <div className="rounded-lg border border-black/[.06] dark:border-indigo-500/20 bg-white/80 dark:bg-slate-800/60 p-4 hover:shadow-md dark:hover:shadow-indigo-500/20 transition-shadow">
              <h3 className="font-medium text-slate-900 dark:text-indigo-300">💳 Integraciones y Funcionalidades</h3>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-neutral-700 dark:text-slate-300">
                <li className="dark:text-slate-200">Stripe (pagos, suscripciones, webhooks)</li>
                <li className="dark:text-slate-200">Push Notifications y mensajería en tiempo real</li>
                <li className="dark:text-slate-200">Autenticación segura (JWT, OAuth, Firebase Auth)</li>
                <li className="dark:text-slate-200">APIs REST y GraphQL</li>
              </ul>
            </div>

            {/* Sistemas y Aplicaciones */}
            <div className="rounded-lg border border-black/[.06] dark:border-indigo-500/20 bg-white/80 dark:bg-slate-800/60 p-4 hover:shadow-md dark:hover:shadow-indigo-500/20 transition-shadow">
              <h3 className="font-medium text-slate-900 dark:text-indigo-300">🏗️ Sistemas y Aplicaciones</h3>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-neutral-700 dark:text-slate-300">
                <li className="dark:text-slate-200">Sistemas administrativos personalizados</li>
                <li className="dark:text-slate-200">Puntos de venta (POS) integrados y adaptables</li>
                <li className="dark:text-slate-200">Sistemas de gestión de citas y reservas</li>
                <li className="dark:text-slate-200">Dashboards de control y estadísticas</li>
              </ul>
            </div>

            {/* Otros conocimientos */}
            <div className="md:col-span-2 rounded-lg border border-black/[.06] dark:border-indigo-500/20 bg-white/80 dark:bg-slate-800/60 p-4 hover:shadow-md dark:hover:shadow-indigo-500/20 transition-shadow">
              <h3 className="font-medium text-slate-900 dark:text-indigo-300">🧩 Otros conocimientos</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                <span className="rounded-md border border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-500/50 dark:bg-pink-500/30 dark:text-pink-100 dark:shadow-pink-500/20 dark:shadow-sm px-2.5 py-1 font-medium">Arquitectura SSR / SSG / SPA / PWA</span>
                <span className="rounded-md border border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/50 dark:bg-teal-500/30 dark:text-teal-100 dark:shadow-teal-500/20 dark:shadow-sm px-2.5 py-1 font-medium">Optimización SEO y rendimiento</span>
                <span className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/30 dark:text-rose-100 dark:shadow-rose-500/20 dark:shadow-sm px-2.5 py-1 font-medium">Control de versiones con Git / GitHub</span>
                <span className="rounded-md border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/50 dark:bg-violet-500/30 dark:text-violet-100 dark:shadow-violet-500/20 dark:shadow-sm px-2.5 py-1 font-medium">Despliegue en Vercel, Render y Railway</span>
              </div>
            </div>
          </div>
        </section>

        {/* Proyectos */}
        <section>
          <h2 className="text-lg font-semibold mb-4 dark:text-white">🔗 Proyectos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.url} title={p.title} url={p.url} />
            ))}
          </div>
        </section>

        <section className="text-sm text-neutral-600 dark:text-slate-400 bg-white/80 dark:bg-gradient-to-br dark:from-slate-900/90 dark:to-indigo-950/50 border border-black/[.06] dark:border-indigo-500/20 rounded-lg p-5 shadow-sm dark:shadow-indigo-500/10">
          <h3 className="font-medium dark:text-indigo-300">🎯 Enfoque</h3>
          <p className="mt-2 dark:text-slate-300">
            Mi objetivo es construir software que combine rendimiento, simplicidad y escalabilidad,
            con una visión centrada en la eficiencia y la experiencia del usuario.
          </p>
        </section>
      </main>
    </div>
  );
}
