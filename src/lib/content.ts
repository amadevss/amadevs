export type Project = {
  title: string;
  url: string;
  description: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    title: "CONCAAM",
    url: "https://www.concaam.org",
    description:
      "Confederación de Colegios y Asociaciones de Abogados de México: plataforma institucional que reúne organizaciones de todo el país para fortalecer el gremio y la ética profesional.",
    tags: ["Plataforma", "Institucional", "Next.js"],
  },
  {
    title: "Connectados",
    url: "https://www.connectados.tech/",
    description:
      "Plataforma para conectar escuelas y colegios, facilitando la comunicación y la gestión educativa entre instituciones, docentes y familias.",
    tags: ["SaaS", "Educación", "Dashboard"],
  },
  {
    title: "Eligue",
    url: "https://www.eligue.com.mx/",
    description:
      "Plataforma deportiva para organizar ligas y torneos con seguimiento de estadísticas en tiempo real.",
    tags: ["Plataforma", "Deporte", "Realtime"],
  },
  {
    title: "QommAdd",
    url: "https://qommadd.com/",
    description:
      "Plataforma de comunidad y publicidad local para negocios y emprendedores.",
    tags: ["Marketplace", "Comunidad"],
  },
  {
    title: "Area 51 PV",
    url: "https://area-51-pv.vercel.app/",
    description:
      "Sistema de punto de venta (POS) a medida para un comercio de computadoras en Tijuana.",
    tags: ["POS", "Sistema a medida"],
  },
  {
    title: "Fistor Sport",
    url: "https://fistorsport.com/",
    description:
      "Tienda y plataforma deportiva con equipamiento, ropa y accesorios para atletas.",
    tags: ["E-commerce", "Deporte"],
  },
  {
    title: "Clínica Dental Luz",
    url: "https://clinicadentalluz.vercel.app/",
    description:
      "Clínica dental con agenda de citas en línea, catálogo de servicios y atención personalizada.",
    tags: ["Citas", "Salud"],
  },
  {
    title: "Nelson Bar",
    url: "https://www.nelsonbar.com.mx/",
    description:
      "Bar y restaurante con menú digital, carta de cócteles y reservaciones en línea.",
    tags: ["Menú digital", "Reservas"],
  },
  {
    title: "Herramientas IA Lab",
    url: "https://www.herramientasialab.com/",
    description:
      "Directorio curado de herramientas de inteligencia artificial para productividad y desarrollo.",
    tags: ["Directorio", "IA"],
  },
  {
    title: "IBFK",
    url: "https://www.ibfk.edu.mx/",
    description:
      "Landing del Colegio Bilingüe Frida Kahlo, institución educativa con formación bilingüe.",
    tags: ["Landing", "Educación"],
  },
  {
    title: "Custos Dei",
    url: "https://www.custosdei.edu.mx/",
    description:
      "Landing de institución educativa católica con formación académica y valores de fe.",
    tags: ["Landing", "Educación"],
  },
  {
    title: "CEIST",
    url: "https://www.ceist.edu.mx/",
    description:
      "Landing de institución educativa de nivel superior con programas tecnológicos y científicos.",
    tags: ["Landing", "Educación"],
  },
];

export type Service = {
  icon: string;
  emoji: string;
  color: string;
  title: string;
  description: string;
};

export const services: Service[] = [
  {
    icon: "layers",
    emoji: "🌐",
    color: "#3b82f6",
    title: "Desarrollo web escalable",
    description:
      "Aplicaciones y plataformas con Next.js y arquitectura SSR/SSG/SPA/PWA, pensadas para crecer sin fricción ni deuda técnica.",
  },
  {
    icon: "blueprint",
    emoji: "📐",
    color: "#8b5cf6",
    title: "Diseño de requerimientos y arquitectura",
    description:
      "Traduzco necesidades de negocio en especificaciones claras, modelos de datos y decisiones técnicas sostenibles.",
  },
  {
    icon: "gauge",
    emoji: "⚡",
    color: "#f59e0b",
    title: "Escalabilidad y rendimiento",
    description:
      "Auditoría y optimización de rendimiento, seguridad y capacidad de carga para productos que ya están creciendo.",
  },
  {
    icon: "chart",
    emoji: "📊",
    color: "#10b981",
    title: "Dashboards y paneles de control",
    description:
      "Paneles de métricas, reporting y administración a medida para tomar decisiones con datos en tiempo real.",
  },
  {
    icon: "blocks",
    emoji: "🧩",
    color: "#ec4899",
    title: "Plataformas no-code y low-code",
    description:
      "Diseño e implementación de soluciones no-code, o híbridas con código, para acelerar entregas sin sacrificar control.",
  },
  {
    icon: "mic",
    emoji: "🎤",
    color: "#06b6d4",
    title: "Conferencias y formación",
    description:
      "Charlas y talleres sobre desarrollo web moderno, arquitectura y buenas prácticas, adaptados a equipos de cualquier nivel.",
  },
];

export type Role = {
  key: string;
  title: string;
  summary: string;
  // Estas listas se completan con la información que envíe Bryan.
  highlights: string[];
};

export const roles: Role[] = [
  {
    key: "conferencista",
    title: "Conferencista",
    summary:
      "Comparto en universidades, eventos y comunidades cómo aplicar la inteligencia artificial y construir productos web escalables, con foco en arquitectura, rendimiento y experiencia de usuario.",
    highlights: [
      "+12 conferencias y talleres impartidos",
      "IA aplicada al turismo médico — Secretaría de Turismo de Tijuana",
      "Construcción de MCPs y APIs con Vercel y Next.js — GDG Tijuana",
      "IA generativa en educación — U. Rosario Castellanos, CEIST, Merited",
    ],
  },
  {
    key: "consultor",
    title: "Consultor",
    summary:
      "Acompaño a empresas y equipos en decisiones de arquitectura, escalabilidad, diseño de requerimientos y calidad de software, de la estrategia a la implementación.",
    highlights: [
      "Especialista en Odoo, Vercel e infraestructura Knotion",
      "IA en procesos contables y administrativos — Kim Gómez Franco, Wood & Iron",
      "Arquitectura, integraciones y roadmap técnico",
    ],
  },
  {
    key: "profesor",
    title: "Profesor",
    summary:
      "Formo a personas de todos los niveles en desarrollo web moderno e inteligencia artificial, desde fundamentos hasta arquitectura avanzada y buenas prácticas de producción.",
    highlights: [
      "Profesor de IA y consultoría — Tec de Monterrey",
      "Director de la vertical de IA en capacitación docente (+200 maestros en Tijuana)",
      "Formación en Google Workspace, IA generativa y low-code",
    ],
  },
];

export type Specialty = {
  name: string;
  logo: string;
  emoji: string;
  color: string;
  purpose: string;
};

export const specialties: Specialty[] = [
  {
    name: "Odoo",
    logo: "/logos/odoo.webp",
    emoji: "🧱",
    color: "#a24689",
    purpose:
      "ERP modular de código abierto. Unifica ventas, inventario, compras, contabilidad, CRM, manufactura y RRHH en un solo sistema. Implementación, personalización de módulos y despliegue.",
  },
  {
    name: "Vercel",
    logo: "/logos/vercel.jpg",
    emoji: "▲",
    color: "#0ea5e9",
    purpose:
      "Plataforma de despliegue para la web moderna. Hosting de apps Next.js con red edge global, entregas continuas, previews por rama y escalado automático sin servidores que administrar.",
  },
  {
    name: "Knotion",
    logo: "/logos/knotion.jpg",
    emoji: "📚",
    color: "#2ca6bd",
    purpose:
      "Plataforma educativa digital para instituciones. Implementación, administración e infraestructura del modelo de aprendizaje —contenidos, aulas y seguimiento— para colegios de nivel básico.",
  },
];

export type Talk = {
  id: number;
  title: string;
  institution: string | null;
  description: string;
  logo: string;
};

export const talks: Talk[] = [
  {
    id: 1,
    title: "Educación desde la distancia",
    institution: "Colegio Instituto Bilingüe Frida Kahlo",
    description:
      "Capacitación docente sobre el uso integral de Google Workspace para fortalecer la interacción en clases en línea: configuración y aprovechamiento de Meet, Drive, Classroom y Gmail.",
    logo: "/logos/t01-ibfk.jpg",
  },
  {
    id: 2,
    title: "Arquitectos del saber: diseñando el aula del mañana",
    institution: "Universidad Nacional Rosario Castellanos",
    description:
      "Uso práctico de la IA en la docencia universitaria: herramientas y protocolos con ChatGPT, Claude y Perplexity, panorama de la IA occidental vs. oriental, estado del arte, MCPs y agentes.",
    logo: "/logos/t02-rosario.jpg",
  },
  {
    id: 3,
    title: "Construyendo MCPs y APIs",
    institution: "Google Developer Experts Tijuana",
    description:
      "Taller práctico de construcción de MCPs y APIs con Vercel y Next.js, con enfoque en buenas prácticas de desarrollo.",
    logo: "/logos/t03-gdg.png",
  },
  {
    id: 4,
    title: "Profesor de IA y Consultoría",
    institution: "Tec de Monterrey",
    description: "Profesor de inteligencia artificial y consultoría dentro de la institución.",
    logo: "/logos/t04-tec.png",
  },
  {
    id: 5,
    title: "Inteligencia Artificial para firmas contables",
    institution: "Kim Gómez Franco",
    description:
      "Capacitación al equipo de contadores de una de las firmas más reconocidas de Tijuana sobre la aplicación práctica de la IA en procesos contables y administrativos.",
    logo: "/logos/t05-kgf.png",
  },
  {
    id: 6,
    title: "Director de la vertical de IA — Capacitación Continua Docente",
    institution: null,
    description:
      "Profesor y director de la vertical de Inteligencia Artificial en un programa de capacitación continua para docentes, liderando una comunidad de más de 200 maestros en Tijuana.",
    logo: "/logos/t06-capacitacion.jpg",
  },
  {
    id: 7,
    title: "IA en turismo médico",
    institution: "Secretaría de Turismo de Tijuana, B.C.",
    description:
      "Conferencia sobre el uso de la IA aplicada al turismo médico y las oportunidades de innovación en la atención a pacientes internacionales.",
    logo: "/logos/t07-sectur.jpg",
  },
  {
    id: 8,
    title: "Diseño de experiencias de aprendizaje con IA generativa",
    institution: "Merited",
    description:
      "Diseño de experiencias de aprendizaje con inteligencia artificial generativa, alineado con los principios de la Nueva Escuela Mexicana.",
    logo: "/logos/t08-merited.jpg",
  },
  {
    id: 9,
    title: "Arquitectos del diseño: la IA como herramienta",
    institution: "CEIST Universidad",
    description:
      "Conferencia a estudiantes y docentes sobre el uso de la inteligencia artificial como herramienta de diseño y aprendizaje.",
    logo: "/logos/t09-ceist.jpg",
  },
  {
    id: 10,
    title: "Agentes personalizados con low-code y Google",
    institution: null,
    description:
      "Taller de creación de agentes personalizados con herramientas low-code del ecosistema de Google: Gemini Gems, NotebookLM y otras aplicaciones.",
    logo: "/logos/t10-lowcode.jpg",
  },
  {
    id: 11,
    title: "Inteligencia Artificial: dentro de la caja negra",
    institution: "Colegio Tijuana",
    description:
      "Origen y funcionamiento de la IA y su aprovechamiento dentro de la Nueva Escuela Mexicana: planeaciones didácticas y otros recursos pedagógicos.",
    logo: "/logos/t11-colegio-tj.jpg",
  },
  {
    id: 12,
    title: "Sesiones de capacitación continua con IA",
    institution: "Wood & Iron",
    description:
      "Programa de capacitación continua para el equipo de una empresa de Tijuana, enfocado en integrar la IA en sus procesos internos y de negocio.",
    logo: "/logos/t12-wood-iron.jpg",
  },
];

export type SkillGroup = {
  title: string;
  emoji: string;
  color: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    title: "Lenguajes y frameworks",
    emoji: "🧬",
    color: "#3b82f6",
    items: ["JavaScript", "TypeScript", "React.js", "Next.js", "Node.js", "Express"],
  },
  {
    title: "Web, navegadores y rendimiento",
    emoji: "🌐",
    color: "#0ea5e9",
    items: [
      "Optimización de navegadores",
      "Core Web Vitals y Lighthouse",
      "Optimización de renderizado y carga",
      "Lazy-loading y code-splitting",
      "Caché, CDN y edge",
      "Compatibilidad cross-browser",
      "SEO técnico y accesibilidad",
    ],
  },
  {
    title: "Bases de datos",
    emoji: "🗄️",
    color: "#10b981",
    items: ["PostgreSQL", "MySQL", "SQLite", "MongoDB", "Firebase", "Prisma", "Mongoose"],
  },
  {
    title: "Integraciones y funcionalidades",
    emoji: "🔌",
    color: "#f59e0b",
    items: [
      "Stripe (pagos y suscripciones)",
      "Realtime y push notifications",
      "Auth (JWT, OAuth, Firebase)",
      "APIs REST y GraphQL",
    ],
  },
  {
    title: "Sistemas y aplicaciones",
    emoji: "🏗️",
    color: "#ec4899",
    items: [
      "Sistemas administrativos",
      "Puntos de venta (POS)",
      "Gestión de citas y reservas",
      "Dashboards y estadísticas",
    ],
  },
  {
    title: "Arquitectura y despliegue",
    emoji: "🚢",
    color: "#8b5cf6",
    items: [
      "SSR / SSG / SPA / PWA",
      "Optimización SEO y rendimiento",
      "Git y GitHub",
      "Vercel, Render y Railway",
    ],
  },
];

export type Metric = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  text?: string;
  emoji: string;
};

export const metrics: Metric[] = [
  { value: 8, prefix: "+", label: "Años de experiencia", emoji: "📅" },
  { value: 12, prefix: "+", label: "Conferencias y talleres", emoji: "🎤" },
  { value: 200, prefix: "+", label: "Docentes capacitados", emoji: "🎓" },
  { value: 0, text: "MX + Intl", label: "Nacional e internacional", emoji: "✈️" },
];

export const profile = {
  name: "Bryan Oliveros Pérez",
  handle: "amadevs",
  roles: ["Desarrollador Full-stack", "Conferencista", "Consultor", "Profesor"],
  tagline:
    "Más de 8 años construyendo software web escalable: desarrollo web, optimización de navegadores y rendimiento, diseño de requerimientos y arquitectura, dashboards, plataformas no-code y productos listos para producción, para usuarios de todos los niveles.",
  location: "Tijuana, México",
  availability: "Disponible para proyectos · viajo a nivel nacional e internacional",
  email: "grupoconnectados@gmail.com",
};

export const socials = {
  whatsapp: "https://wa.me/526647517720",
  linkedin: "https://www.linkedin.com/in/bryan-oliveros-perez-amadevs",
  github: "https://github.com/amadevss",
  instagram: "https://www.instagram.com/amadevss/",
  email: "mailto:grupoconnectados@gmail.com",
};
