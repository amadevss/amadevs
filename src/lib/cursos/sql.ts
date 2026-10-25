import type { QueryResultRow } from "@vercel/postgres";
import { db, sql as rawSql } from "@/lib/db";
import {
  COURSE_PAYMENTS_SCHEMA_SQL,
  COURSES_SCHEMA_SQL,
  PUBLIC_COURSES_SCHEMA_SQL,
  STUDENTS_SCHEMA_SQL,
} from "./schema";

let schemaReady: Promise<void> | null = null;

/** Crea las tablas de cursos/alumnos si aún no existen (una vez por instancia). */
function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const { rows } = await rawSql`
      select to_regclass('public.course_submission_file') as courses,
             to_regclass('public.course_attendance') as students,
             to_regclass('public.course_lesson_progress') as public_courses,
             to_regclass('public.course_purchase') as payments`;
    if (!rows[0]?.courses) await db.query(COURSES_SCHEMA_SQL);
    if (!rows[0]?.students) await db.query(STUDENTS_SCHEMA_SQL);
    if (!rows[0]?.public_courses) await db.query(PUBLIC_COURSES_SCHEMA_SQL);
    if (!rows[0]?.payments) await db.query(COURSE_PAYMENTS_SCHEMA_SQL);
  })().catch((err) => {
    schemaReady = null;
    throw err;
  });
  return schemaReady;
}

type Primitive = string | number | boolean | null | undefined;

/** Igual que `sql` de @vercel/postgres, pero asegura el esquema antes. */
export async function sql<T extends QueryResultRow = QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
) {
  await ensureSchema();
  return rawSql<T>(strings, ...values);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);
