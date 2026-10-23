import { cache } from "react";
import { getDashboardCourse, getDashboardSession } from "@/lib/cursos/queries";

/** Mismo curso/sesión para el layout y la página en una sola petición. */
export const loadCourse = cache(getDashboardCourse);
export const loadSession = cache(getDashboardSession);

export { courseHref, sessionHref } from "./paths";
