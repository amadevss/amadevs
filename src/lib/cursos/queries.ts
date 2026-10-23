import { isUuid, sql } from "./sql";
import { isValidSlug, slugify } from "@/lib/blog/posts";

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  hidden: boolean;
  created_at: string;
  updated_at: string;
};

export type CourseSession = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  description: string;
  content: string;
  accepts_submissions: boolean;
  due_at: string | null;
  hidden: boolean;
  created_at: string;
  updated_at: string;
};

export type CourseFile = {
  id: string;
  pathname: string;
  filename: string;
  content_type: string;
  size: number;
};

export type CourseMaterial = CourseFile & { session_id: string; created_at: string };

export type CourseSubmission = {
  id: string;
  session_id: string;
  student_id: string | null;
  student_name: string;
  student_email: string | null;
  comment: string;
  grade: string | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  files: CourseFile[];
};

export const ATTENDANCE_STATUSES = ["presente", "retardo", "falta", "justificada"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type SessionWithMaterials = CourseSession & { materials: CourseMaterial[]; submission_count: number };
export type CourseWithSessions = Course & { sessions: SessionWithMaterials[] };

/* ───────────── Validación ───────────── */

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type CourseInput = { slug: string; title: string; description: string; hidden: boolean };

/** Rutas propias de /cursos que no pueden usarse como id de curso. */
const RESERVED_SLUGS = new Set(["entrar", "registro", "perfil", "salir"]);

function randomSlug(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function normalizeCourseInput(body: Record<string, unknown>): Result<CourseInput> {
  const title = String(body.title ?? "").trim();
  if (!title) return { ok: false, error: "Falta el título" };
  const rawSlug = String(body.slug ?? "").trim();
  const slug = rawSlug ? slugify(rawSlug) : randomSlug();
  if (!isValidSlug(slug)) return { ok: false, error: "Id/slug inválido (usa letras, números y guiones)" };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: `"${slug}" está reservado, usa otro id` };
  return {
    ok: true,
    value: {
      slug,
      title,
      description: String(body.description ?? "").trim(),
      hidden: body.hidden === true,
    },
  };
}

export type SessionInput = {
  position: number;
  title: string;
  description: string;
  content: string;
  accepts_submissions: boolean;
  due_at: string | null;
  hidden: boolean;
};

export function normalizeSessionInput(body: Record<string, unknown>): Result<SessionInput> {
  const title = String(body.title ?? "").trim();
  if (!title) return { ok: false, error: "Falta el título" };
  const position = Number(body.position);
  if (!Number.isInteger(position) || position < 1) return { ok: false, error: "Número de sesión inválido" };
  let due_at: string | null = null;
  if (body.due_at) {
    const d = new Date(String(body.due_at));
    if (Number.isNaN(d.getTime())) return { ok: false, error: "Fecha de entrega inválida" };
    due_at = d.toISOString();
  }
  return {
    ok: true,
    value: {
      position,
      title,
      description: String(body.description ?? "").trim(),
      content: String(body.content ?? "").trim(),
      accepts_submissions: body.accepts_submissions !== false,
      due_at,
      hidden: body.hidden === true,
    },
  };
}

/* ───────────── Lectura pública ───────────── */

/** Cursos visibles en los que el alumno está inscrito. */
export async function listStudentCourses(studentId: string): Promise<(Course & { session_count: number })[]> {
  const { rows } = await sql<Course & { session_count: number }>`
    select c.*, (select count(*)::int from course_session s where s.course_id = c.id and not s.hidden) as session_count
    from course c join course_enrollment e on e.course_id = c.id
    where e.student_id = ${studentId} and not c.hidden order by e.created_at desc`;
  return rows;
}

export async function getVisibleCourse(slug: string): Promise<Course | null> {
  const { rows } = await sql<Course>`select * from course where slug = ${slug} and not hidden limit 1`;
  return rows[0] ?? null;
}

export async function listVisibleSessions(courseId: string): Promise<CourseSession[]> {
  const { rows } = await sql<CourseSession>`
    select * from course_session where course_id = ${courseId} and not hidden order by position`;
  return rows;
}

export async function getVisibleSession(courseId: string, position: number): Promise<CourseSession | null> {
  const { rows } = await sql<CourseSession>`
    select * from course_session
    where course_id = ${courseId} and position = ${position} and not hidden limit 1`;
  return rows[0] ?? null;
}

export async function listMaterials(sessionId: string): Promise<CourseMaterial[]> {
  const { rows } = await sql<CourseMaterial>`
    select id, session_id, pathname, filename, content_type, size::float8 as size, created_at
    from course_material where session_id = ${sessionId} order by created_at`;
  return rows;
}

/* ───────────── Dashboard ───────────── */

export async function listCoursesForDashboard(): Promise<CourseWithSessions[]> {
  const [courses, sessions, materials] = await Promise.all([
    sql<Course>`select * from course order by created_at desc`,
    sql<CourseSession & { submission_count: number }>`
      select s.*, (select count(*)::int from course_submission x where x.session_id = s.id) as submission_count
      from course_session s order by position`,
    sql<CourseMaterial>`
      select id, session_id, pathname, filename, content_type, size::float8 as size, created_at
      from course_material order by created_at`,
  ]);
  return courses.rows.map((c) => ({
    ...c,
    sessions: sessions.rows
      .filter((s) => s.course_id === c.id)
      .map((s) => ({ ...s, materials: materials.rows.filter((m) => m.session_id === s.id) })),
  }));
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const { rows } = await sql<Course>`
    insert into course (slug, title, description, hidden)
    values (${input.slug}, ${input.title}, ${input.description}, ${input.hidden})
    returning *`;
  return rows[0];
}

export async function updateCourse(id: string, input: CourseInput): Promise<Course | null> {
  const { rows } = await sql<Course>`
    update course set slug = ${input.slug}, title = ${input.title},
      description = ${input.description}, hidden = ${input.hidden}
    where id = ${id} returning *`;
  return rows[0] ?? null;
}

/** Pathnames de todos los archivos bajo un curso o sesión (para borrarlos de Blob). */
export async function listBlobPathnames(scope: { courseId?: string; sessionId?: string }): Promise<string[]> {
  const { rows } = await sql<{ pathname: string }>`
    select m.pathname from course_material m join course_session s on s.id = m.session_id
    where s.course_id = ${scope.courseId ?? null} or s.id = ${scope.sessionId ?? null}
    union all
    select f.pathname from course_submission_file f
    join course_submission x on x.id = f.submission_id
    join course_session s on s.id = x.session_id
    where s.course_id = ${scope.courseId ?? null} or s.id = ${scope.sessionId ?? null}`;
  return rows.map((r) => r.pathname);
}

export async function deleteCourse(id: string): Promise<boolean> {
  const { rowCount } = await sql`delete from course where id = ${id}`;
  return (rowCount ?? 0) > 0;
}

export async function createSession(courseId: string, input: SessionInput): Promise<CourseSession> {
  const { rows } = await sql<CourseSession>`
    insert into course_session (course_id, position, title, description, content, accepts_submissions, due_at, hidden)
    values (${courseId}, ${input.position}, ${input.title}, ${input.description}, ${input.content},
            ${input.accepts_submissions}, ${input.due_at}, ${input.hidden})
    returning *`;
  return rows[0];
}

export async function updateSession(id: string, input: SessionInput): Promise<CourseSession | null> {
  const { rows } = await sql<CourseSession>`
    update course_session set position = ${input.position}, title = ${input.title},
      description = ${input.description}, content = ${input.content},
      accepts_submissions = ${input.accepts_submissions}, due_at = ${input.due_at}, hidden = ${input.hidden}
    where id = ${id} returning *`;
  return rows[0] ?? null;
}

export async function deleteSession(id: string): Promise<boolean> {
  const { rowCount } = await sql`delete from course_session where id = ${id}`;
  return (rowCount ?? 0) > 0;
}

export async function sessionExists(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const { rows } = await sql`select 1 from course_session where id = ${id} limit 1`;
  return rows.length > 0;
}

export async function addMaterial(sessionId: string, file: Omit<CourseFile, "id">): Promise<CourseMaterial> {
  const { rows } = await sql<CourseMaterial>`
    insert into course_material (session_id, pathname, filename, content_type, size)
    values (${sessionId}, ${file.pathname}, ${file.filename}, ${file.content_type}, ${file.size})
    returning id, session_id, pathname, filename, content_type, size::float8 as size, created_at`;
  return rows[0];
}

export async function deleteMaterial(id: string): Promise<string | null> {
  const { rows } = await sql<{ pathname: string }>`
    delete from course_material where id = ${id} returning pathname`;
  return rows[0]?.pathname ?? null;
}

export async function updateSubmissionReview(
  id: string,
  grade: string | null,
  feedback: string | null,
): Promise<boolean> {
  const { rowCount } = await sql`
    update course_submission set grade = ${grade}, feedback = ${feedback} where id = ${id}`;
  return (rowCount ?? 0) > 0;
}

export async function deleteSubmission(id: string): Promise<string[] | null> {
  const { rows: files } = await sql<{ pathname: string }>`
    select pathname from course_submission_file where submission_id = ${id}`;
  const { rowCount } = await sql`delete from course_submission where id = ${id}`;
  if (!rowCount) return null;
  return files.map((f) => f.pathname);
}


/* ───────────── Alumno: entregas, asistencia, permisos ───────────── */

async function attachFiles(subs: Omit<CourseSubmission, "files">[]): Promise<CourseSubmission[]> {
  if (subs.length === 0) return [];
  const ids = subs.map((x) => x.id);
  const { rows } = await sql<CourseFile & { submission_id: string }>`
    select id, submission_id, pathname, filename, content_type, size::float8 as size
    from course_submission_file where submission_id = any(${ids as unknown as string})`;
  return subs.map((x) => ({ ...x, files: rows.filter((f) => f.submission_id === x.id) }));
}

export async function getStudentSubmission(sessionId: string, studentId: string): Promise<CourseSubmission | null> {
  const { rows } = await sql<Omit<CourseSubmission, "files">>`
    select x.*, null::text as student_email from course_submission x
    where x.session_id = ${sessionId} and x.student_id = ${studentId} limit 1`;
  return (await attachFiles(rows))[0] ?? null;
}

/** ¿Puede el alumno enviar o reemplazar su entrega ahora? Devuelve el motivo si no. */
export function submissionBlockedReason(session: CourseSession, existing: CourseSubmission | null): string | null {
  if (!session.accepts_submissions) return "Esta sesión no recibe entregas";
  if (existing?.grade) return "Tu entrega ya fue calificada";
  const overdue = session.due_at ? new Date(session.due_at).getTime() < Date.now() : false;
  if (overdue && existing) return "La fecha de entrega ya pasó";
  return null;
}

/**
 * Crea o reemplaza la entrega del alumno. Devuelve los pathnames de los
 * archivos anteriores para borrarlos de Blob.
 */
export async function upsertStudentSubmission(
  sessionId: string,
  student: { id: string; full_name: string },
  comment: string,
  files: Omit<CourseFile, "id">[],
): Promise<{ id: string; oldPathnames: string[] }> {
  const { rows } = await sql<{ id: string }>`
    insert into course_submission (session_id, student_id, student_name, comment)
    values (${sessionId}, ${student.id}, ${student.full_name}, ${comment})
    on conflict (session_id, student_id) where student_id is not null
    do update set comment = excluded.comment, student_name = excluded.student_name, updated_at = now()
    returning id`;
  const id = rows[0].id;
  const { rows: old } = await sql<{ pathname: string }>`
    delete from course_submission_file where submission_id = ${id} returning pathname`;
  for (const f of files) {
    await sql`
      insert into course_submission_file (submission_id, pathname, filename, content_type, size)
      values (${id}, ${f.pathname}, ${f.filename}, ${f.content_type}, ${f.size})`;
  }
  const keep = new Set(files.map((f) => f.pathname));
  return { id, oldPathnames: old.map((o) => o.pathname).filter((p) => !keep.has(p)) };
}

/** Sesión visible de un curso visible en el que el alumno está inscrito. */
export async function getEnrolledSession(sessionId: string, studentId: string): Promise<CourseSession | null> {
  if (!isUuid(sessionId)) return null;
  const { rows } = await sql<CourseSession>`
    select s.* from course_session s
    join course c on c.id = s.course_id
    join course_enrollment e on e.course_id = c.id and e.student_id = ${studentId}
    where s.id = ${sessionId} and not s.hidden and not c.hidden limit 1`;
  return rows[0] ?? null;
}

/** ¿El alumno puede ver este archivo? (material de su curso o su propia entrega) */
export async function canStudentSeeFile(pathname: string, studentId: string): Promise<boolean> {
  const { rows } = await sql`
    select 1 from course_material m
    join course_session s on s.id = m.session_id
    join course c on c.id = s.course_id
    join course_enrollment e on e.course_id = c.id and e.student_id = ${studentId}
    where m.pathname = ${pathname} and not s.hidden and not c.hidden
    union all
    select 1 from course_submission_file f
    join course_submission x on x.id = f.submission_id
    where f.pathname = ${pathname} and x.student_id = ${studentId}
    limit 1`;
  return rows.length > 0;
}

export type StudentSessionStatus = {
  session_id: string;
  attendance: AttendanceStatus | null;
  submitted: boolean;
  grade: string | null;
};

/** Asistencia y estado de entrega del alumno en cada sesión de un curso. */
export async function listStudentSessionStatus(courseId: string, studentId: string): Promise<StudentSessionStatus[]> {
  const { rows } = await sql<StudentSessionStatus>`
    select s.id as session_id, a.status as attendance, (x.id is not null) as submitted, x.grade
    from course_session s
    left join course_attendance a on a.session_id = s.id and a.student_id = ${studentId}
    left join course_submission x on x.session_id = s.id and x.student_id = ${studentId}
    where s.course_id = ${courseId} and not s.hidden`;
  return rows;
}

export async function getStudentAttendance(sessionId: string, studentId: string): Promise<AttendanceStatus | null> {
  const { rows } = await sql<{ status: AttendanceStatus }>`
    select status from course_attendance where session_id = ${sessionId} and student_id = ${studentId}`;
  return rows[0]?.status ?? null;
}

/** Porcentaje de asistencia: presente y retardo cuentan; justificada no cuenta en contra. */
export function attendancePercent(statuses: (AttendanceStatus | null)[]): number | null {
  const marked = statuses.filter((x): x is AttendanceStatus => !!x && x !== "justificada");
  if (marked.length === 0) return null;
  const ok = marked.filter((x) => x === "presente" || x === "retardo").length;
  return Math.round((ok / marked.length) * 100);
}

/* ───────────── Dashboard: alumnos, asistencia, entregas ───────────── */

export type CourseStudentRow = {
  id: string;
  email: string;
  full_name: string;
  enrolled_at: string;
  presente: number;
  retardo: number;
  falta: number;
  justificada: number;
  submissions: number;
};

export async function listCourseStudents(courseId: string): Promise<CourseStudentRow[]> {
  if (!isUuid(courseId)) return [];
  const { rows } = await sql<CourseStudentRow>`
    select st.id, st.email, st.full_name, e.created_at as enrolled_at,
      count(*) filter (where a.status = 'presente')::int as presente,
      count(*) filter (where a.status = 'retardo')::int as retardo,
      count(*) filter (where a.status = 'falta')::int as falta,
      count(*) filter (where a.status = 'justificada')::int as justificada,
      (select count(*)::int from course_submission x join course_session s2 on s2.id = x.session_id
        where x.student_id = st.id and s2.course_id = ${courseId}) as submissions
    from course_enrollment e
    join student st on st.id = e.student_id
    left join course_session s on s.course_id = e.course_id
    left join course_attendance a on a.session_id = s.id and a.student_id = st.id
    where e.course_id = ${courseId}
    group by st.id, e.created_at
    order by st.full_name`;
  return rows;
}

export type AttendanceRow = { student_id: string; full_name: string; email: string; status: AttendanceStatus | null };

export async function listSessionAttendance(sessionId: string): Promise<AttendanceRow[]> {
  if (!isUuid(sessionId)) return [];
  const { rows } = await sql<AttendanceRow>`
    select st.id as student_id, st.full_name, st.email, a.status
    from course_session s
    join course_enrollment e on e.course_id = s.course_id
    join student st on st.id = e.student_id
    left join course_attendance a on a.session_id = s.id and a.student_id = st.id
    where s.id = ${sessionId}
    order by st.full_name`;
  return rows;
}

export async function setAttendance(sessionId: string, studentId: string, status: AttendanceStatus | null) {
  if (status === null) {
    await sql`delete from course_attendance where session_id = ${sessionId} and student_id = ${studentId}`;
    return;
  }
  await sql`
    insert into course_attendance (session_id, student_id, status) values (${sessionId}, ${studentId}, ${status})
    on conflict (session_id, student_id) do update set status = excluded.status, updated_at = now()`;
}

/** Marca "presente" a todos los inscritos que aún no tienen asistencia en la sesión. */
export async function markAllPresent(sessionId: string): Promise<void> {
  await sql`
    insert into course_attendance (session_id, student_id, status)
    select s.id, e.student_id, 'presente' from course_session s
    join course_enrollment e on e.course_id = s.course_id
    where s.id = ${sessionId}
    on conflict (session_id, student_id) do nothing`;
}

export async function listSubmissions(sessionId: string): Promise<CourseSubmission[]> {
  if (!isUuid(sessionId)) return [];
  const { rows } = await sql<Omit<CourseSubmission, "files">>`
    select x.*, st.email as student_email from course_submission x
    left join student st on st.id = x.student_id
    where x.session_id = ${sessionId} order by x.updated_at desc`;
  return attachFiles(rows);
}

export async function courseExists(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const { rows } = await sql`select 1 from course where id = ${id} limit 1`;
  return rows.length > 0;
}

export type ProfileSession = {
  id: string;
  position: number;
  title: string;
  attendance: AttendanceStatus | null;
  grade: string | null;
  submitted: boolean;
  accepts_submissions: boolean;
  due_at: string | null;
};

export type ProfileCourse = Course & { session_count: number; sessions: ProfileSession[] };

/** Resumen para el perfil del alumno: por curso, asistencia y calificaciones. */
export async function getStudentProfile(studentId: string): Promise<ProfileCourse[]> {
  const courses = await listStudentCourses(studentId);
  if (courses.length === 0) return [];
  const ids = courses.map((c) => c.id);
  const { rows } = await sql<ProfileSession & { course_id: string }>`
    select s.id, s.course_id, s.position, s.title, s.accepts_submissions, s.due_at,
           a.status as attendance, x.grade, (x.id is not null) as submitted
    from course_session s
    left join course_attendance a on a.session_id = s.id and a.student_id = ${studentId}
    left join course_submission x on x.session_id = s.id and x.student_id = ${studentId}
    where s.course_id = any(${ids as unknown as string}) and not s.hidden
    order by s.position`;
  return courses.map((c) => ({ ...c, sessions: rows.filter((r) => r.course_id === c.id) }));
}

/* ───────────── Dashboard: vistas por ruta ───────────── */

export type CourseOverview = Course & {
  session_count: number;
  student_count: number;
  submission_count: number;
  ungraded_count: number;
};

/** Cursos con sus totales, para la lista del dashboard. */
export async function listCoursesOverview(): Promise<CourseOverview[]> {
  const { rows } = await sql<CourseOverview>`
    select c.*,
      (select count(*)::int from course_session s where s.course_id = c.id) as session_count,
      (select count(*)::int from course_enrollment e where e.course_id = c.id) as student_count,
      (select count(*)::int from course_submission x join course_session s on s.id = x.session_id
        where s.course_id = c.id) as submission_count,
      (select count(*)::int from course_submission x join course_session s on s.id = x.session_id
        where s.course_id = c.id and x.grade is null) as ungraded_count
    from course c order by c.created_at desc`;
  return rows;
}

export type SessionOverview = CourseSession & {
  material_count: number;
  submission_count: number;
  ungraded_count: number;
  attendance_count: number;
};

export type DashboardCourse = Course & { student_count: number; sessions: SessionOverview[] };

export async function getDashboardCourse(id: string): Promise<DashboardCourse | null> {
  if (!isUuid(id)) return null;
  const [course, sessions, students] = await Promise.all([
    sql<Course>`select * from course where id = ${id} limit 1`,
    sql<SessionOverview>`
      select s.*,
        (select count(*)::int from course_material m where m.session_id = s.id) as material_count,
        (select count(*)::int from course_submission x where x.session_id = s.id) as submission_count,
        (select count(*)::int from course_submission x where x.session_id = s.id and x.grade is null) as ungraded_count,
        (select count(*)::int from course_attendance a where a.session_id = s.id) as attendance_count
      from course_session s where s.course_id = ${id} order by s.position`,
    sql<{ n: number }>`select count(*)::int as n from course_enrollment where course_id = ${id}`,
  ]);
  if (!course.rows[0]) return null;
  return { ...course.rows[0], student_count: students.rows[0]?.n ?? 0, sessions: sessions.rows };
}

export type DashboardSession = SessionOverview & {
  course: Pick<Course, "id" | "slug" | "title">;
  student_count: number;
};

export async function getDashboardSession(courseId: string, sessionId: string): Promise<DashboardSession | null> {
  if (!isUuid(courseId) || !isUuid(sessionId)) return null;
  const { rows } = await sql<SessionOverview & { c_id: string; c_slug: string; c_title: string; student_count: number }>`
    select s.*, c.id as c_id, c.slug as c_slug, c.title as c_title,
      (select count(*)::int from course_material m where m.session_id = s.id) as material_count,
      (select count(*)::int from course_submission x where x.session_id = s.id) as submission_count,
      (select count(*)::int from course_submission x where x.session_id = s.id and x.grade is null) as ungraded_count,
      (select count(*)::int from course_attendance a where a.session_id = s.id) as attendance_count,
      (select count(*)::int from course_enrollment e where e.course_id = c.id) as student_count
    from course_session s join course c on c.id = s.course_id
    where s.id = ${sessionId} and s.course_id = ${courseId} limit 1`;
  const r = rows[0];
  if (!r) return null;
  const { c_id, c_slug, c_title, ...session } = r;
  return { ...session, course: { id: c_id, slug: c_slug, title: c_title } };
}

export type PendingReview = {
  id: string;
  student_name: string;
  updated_at: string;
  session_id: string;
  session_position: number;
  session_title: string;
  course_id: string;
  course_title: string;
};

/** Entregas sin calificar, las más recientes primero. */
export async function listPendingReviews(limit = 6): Promise<{ total: number; items: PendingReview[] }> {
  const [items, total] = await Promise.all([
    sql<PendingReview>`
      select x.id, x.student_name, x.updated_at, s.id as session_id, s.position as session_position,
             s.title as session_title, c.id as course_id, c.title as course_title
      from course_submission x
      join course_session s on s.id = x.session_id
      join course c on c.id = s.course_id
      where x.grade is null
      order by x.updated_at desc limit ${limit}`,
    sql<{ n: number }>`select count(*)::int as n from course_submission where grade is null`,
  ]);
  return { total: total.rows[0]?.n ?? 0, items: items.rows };
}

export async function countStudents(): Promise<{ total: number; lastWeek: number }> {
  const { rows } = await sql<{ total: number; last_week: number }>`
    select count(*)::int as total,
           count(*) filter (where created_at > now() - interval '7 days')::int as last_week
    from student`;
  return { total: rows[0]?.total ?? 0, lastWeek: rows[0]?.last_week ?? 0 };
}
