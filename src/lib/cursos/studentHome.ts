import { attendancePercent, type ProfileCourse } from "@/lib/cursos/queries";
import { deliveryState } from "@/lib/cursos/status";

/** Entregas que el alumno aún puede hacer: primero las que van a tiempo, luego por fecha límite. */
export function pendingDeliveries(courses: ProfileCourse[], now = Date.now()) {
  return courses
    .flatMap((c) =>
      c.sessions
        .map((s) => ({ course: c, session: s, state: deliveryState(s, s, now) }))
        .filter((x) => x.state === "pendiente" || x.state === "vencida"),
    )
    .sort((a, b) => {
      if (a.state !== b.state) return a.state === "pendiente" ? -1 : 1;
      const da = a.session.due_at ? new Date(a.session.due_at).getTime() : Infinity;
      const db = b.session.due_at ? new Date(b.session.due_at).getTime() : Infinity;
      return da - db;
    });
}

/** Asistencia de todas las sesiones de todos los cursos juntas. */
export function overallAttendance(courses: ProfileCourse[]): number | null {
  return attendancePercent(courses.flatMap((c) => c.sessions.map((s) => s.attendance)));
}
