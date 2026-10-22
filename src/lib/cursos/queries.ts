import type { QueryResultRow } from "@vercel/postgres";
import { db, sql as rawSql } from "@/lib/db";
import { COURSES_SCHEMA_SQL } from "./schema";
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
  student_name: string;
  comment: string;
  grade: string | null;
  feedback: string | null;
  created_at: string;
  files: CourseFile[];
};

export type SessionWithMaterials = CourseSession & { materials: CourseMaterial[]; submission_count: number };
export type CourseWithSessions = Course & { sessions: SessionWithMaterials[] };

/* ───────────── Esquema ───────────── */

let schemaReady: Promise<void> | null = null;

/** Crea las tablas de cursos si aún no existen (una vez por instancia). */
function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const { rows } = await rawSql`select to_regclass('public.course_submission_file') as t`;
    if (!rows[0]?.t) await db.query(COURSES_SCHEMA_SQL);
  })().catch((err) => {
    schemaReady = null;
    throw err;
  });
  return schemaReady;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);

type Primitive = string | number | boolean | null | undefined;

/** Igual que `sql` de @vercel/postgres, pero asegura el esquema antes. */
async function sql<T extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: Primitive[]) {
  await ensureSchema();
  return rawSql<T>(strings, ...values);
}

/* ───────────── Validación ───────────── */

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type CourseInput = { slug: string; title: string; description: string; hidden: boolean };

function randomSlug(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function normalizeCourseInput(body: Record<string, unknown>): Result<CourseInput> {
  const title = String(body.title ?? "").trim();
  if (!title) return { ok: false, error: "Falta el título" };
  const rawSlug = String(body.slug ?? "").trim();
  const slug = rawSlug ? slugify(rawSlug) : randomSlug();
  if (!isValidSlug(slug)) return { ok: false, error: "Id/slug inválido (usa letras, números y guiones)" };
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

export async function listVisibleCourses(): Promise<(Course & { session_count: number })[]> {
  const { rows } = await sql<Course & { session_count: number }>`
    select c.*, (select count(*)::int from course_session s where s.course_id = c.id and not s.hidden) as session_count
    from course c where not c.hidden order by c.created_at desc`;
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

/** Sesión visible (curso y sesión no ocultos) que acepta entregas. */
export async function getSessionOpenForSubmissions(sessionId: string): Promise<CourseSession | null> {
  if (!isUuid(sessionId)) return null;
  const { rows } = await sql<CourseSession>`
    select s.* from course_session s join course c on c.id = s.course_id
    where s.id = ${sessionId} and not s.hidden and not c.hidden and s.accepts_submissions limit 1`;
  return rows[0] ?? null;
}

/** Material cuyo curso y sesión son visibles (para servir el archivo sin sesión). */
export async function isMaterialPublic(pathname: string): Promise<boolean> {
  const { rows } = await sql`
    select 1 from course_material m
    join course_session s on s.id = m.session_id
    join course c on c.id = s.course_id
    where m.pathname = ${pathname} and not s.hidden and not c.hidden limit 1`;
  return rows.length > 0;
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

export async function createSubmission(
  sessionId: string,
  studentName: string,
  comment: string,
  files: Omit<CourseFile, "id">[],
): Promise<string> {
  const { rows } = await sql<{ id: string }>`
    insert into course_submission (session_id, student_name, comment)
    values (${sessionId}, ${studentName}, ${comment}) returning id`;
  const id = rows[0].id;
  for (const f of files) {
    await sql`
      insert into course_submission_file (submission_id, pathname, filename, content_type, size)
      values (${id}, ${f.pathname}, ${f.filename}, ${f.content_type}, ${f.size})`;
  }
  return id;
}

export async function listSubmissions(sessionId: string): Promise<CourseSubmission[]> {
  const [subs, files] = await Promise.all([
    sql<Omit<CourseSubmission, "files">>`
      select * from course_submission where session_id = ${sessionId} order by created_at desc`,
    sql<CourseFile & { submission_id: string }>`
      select f.id, f.submission_id, f.pathname, f.filename, f.content_type, f.size::float8 as size
      from course_submission_file f join course_submission x on x.id = f.submission_id
      where x.session_id = ${sessionId}`,
  ]);
  return subs.rows.map((s) => ({ ...s, files: files.rows.filter((f) => f.submission_id === s.id) }));
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
