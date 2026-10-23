/** Rutas del dashboard de cursos (sirve en servidor y en cliente). */
export const courseHref = (courseId: string) => `/dashboard/cursos/${courseId}`;
export const sessionHref = (courseId: string, sessionId: string) =>
  `/dashboard/cursos/${courseId}/sesiones/${sessionId}`;
