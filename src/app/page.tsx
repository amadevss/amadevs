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

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">Desarrollador Full‑stack</h1>
              <p className="mt-2 text-neutral-700 dark:text-slate-300 max-w-prose">
                Construyo apps web escalables, seguras y optimizadas. Sistemas administrativos, POS
                a medida y plataformas modernas con integraciones inteligentes.
              </p>
              <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                <a
                  href="https://www.linkedin.com/in/bryan-oliveros-perez-amadevs"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a
                  href="https://github.com/amadevss"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/amadevss/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 dark:from-purple-500 dark:via-pink-500 dark:to-orange-400 dark:hover:from-purple-600 dark:hover:via-pink-600 dark:hover:to-orange-500 text-white transition-all shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/>
                  </svg>
                </a>
              </div>
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
