import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { isUuid, sql } from "./sql";

/**
 * Cuentas de alumnos: correo + contraseña (hash scrypt) y sesión en una cookie
 * httpOnly cuyo token se guarda hasheado en la tabla student_login.
 */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const STUDENT_COOKIE = "amadevs_alumno";
const SESSION_DAYS = 30;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export type Student = { id: string; email: string; full_name: string; created_at: string };

/* ───────────── Contraseñas ───────────── */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

/* ───────────── Validación ───────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (password.length > 200) return "La contraseña es demasiado larga";
  return null;
}

export function validateRegistration(body: Record<string, unknown>):
  | { ok: true; value: { email: string; fullName: string; password: string } }
  | { ok: false; error: string } {
  const email = normalizeEmail(String(body.email ?? ""));
  const fullName = normalizeName(String(body.fullName ?? ""));
  const password = String(body.password ?? "");
  if (fullName.length < 5 || !fullName.includes(" ")) return { ok: false, error: "Escribe tu nombre completo" };
  if (fullName.length > 120) return { ok: false, error: "El nombre es demasiado largo" };
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, error: "Correo inválido" };
  const pwError = validatePassword(password);
  if (pwError) return { ok: false, error: pwError };
  return { ok: true, value: { email, fullName, password } };
}

/* ───────────── Cuentas ───────────── */

export async function createStudent(email: string, fullName: string, password: string): Promise<Student | null> {
  const hash = await hashPassword(password);
  const { rows } = await sql<Student>`
    insert into student (email, full_name, password_hash)
    values (${email}, ${fullName}, ${hash})
    on conflict (email) do nothing
    returning id, email, full_name, created_at`;
  return rows[0] ?? null;
}

type LoginResult = { ok: true; student: Student } | { ok: false; error: string };

/** Verifica correo/contraseña con bloqueo temporal tras varios intentos fallidos. */
export async function checkStudentLogin(emailRaw: string, password: string): Promise<LoginResult> {
  const email = normalizeEmail(emailRaw);
  const { rows } = await sql<Student & { password_hash: string; locked_until: string | null }>`
    select id, email, full_name, created_at, password_hash, locked_until from student where email = ${email}`;
  const row = rows[0];
  const generic = { ok: false as const, error: "Correo o contraseña incorrectos" };
  if (!row) {
    await hashPassword(password); // mismo tiempo de respuesta exista o no la cuenta
    return generic;
  }
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    return { ok: false, error: `Demasiados intentos. Intenta de nuevo en ${LOCK_MINUTES} minutos.` };
  }
  if (!(await verifyPassword(password, row.password_hash))) {
    await sql`
      update student set
        failed_attempts = case when failed_attempts + 1 >= ${MAX_FAILED} then 0 else failed_attempts + 1 end,
        locked_until = case when failed_attempts + 1 >= ${MAX_FAILED}
                            then now() + make_interval(mins => ${LOCK_MINUTES}) else locked_until end
      where id = ${row.id}`;
    return generic;
  }
  await sql`update student set failed_attempts = 0, locked_until = null where id = ${row.id}`;
  return { ok: true, student: { id: row.id, email: row.email, full_name: row.full_name, created_at: row.created_at } };
}

export async function setStudentPassword(studentId: string, password: string): Promise<boolean> {
  if (!isUuid(studentId)) return false;
  const hash = await hashPassword(password);
  const { rowCount } = await sql`
    update student set password_hash = ${hash}, failed_attempts = 0, locked_until = null where id = ${studentId}`;
  return (rowCount ?? 0) > 0;
}

/** Cambio de contraseña por el propio alumno: pide la actual y cierra sus otras sesiones. */
export async function changeOwnPassword(student: Student, current: string, next: string): Promise<string | null> {
  const login = await checkStudentLogin(student.email, current);
  if (!login.ok) return "La contraseña actual no es correcta";
  const err = validatePassword(next);
  if (err) return err;
  await setStudentPassword(student.id, next);
  const token = (await cookies()).get(STUDENT_COOKIE)?.value ?? "";
  await sql`delete from student_login where student_id = ${student.id} and token_hash <> ${tokenHash(token)}`;
  return null;
}

/* ───────────── Sesión (cookie) ───────────── */

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startStudentSession(studentId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    insert into student_login (token_hash, student_id, expires_at)
    values (${tokenHash(token)}, ${studentId}, ${expires.toISOString()})`;
  // Limpieza ocasional de sesiones vencidas.
  await sql`delete from student_login where expires_at < now()`;
  (await cookies()).set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endStudentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(STUDENT_COOKIE)?.value;
  if (token) await sql`delete from student_login where token_hash = ${tokenHash(token)}`;
  store.delete(STUDENT_COOKIE);
}

/** Alumno con sesión activa, o null. */
export async function getCurrentStudent(): Promise<Student | null> {
  const token = (await cookies()).get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await sql<Student>`
    select s.id, s.email, s.full_name, s.created_at
    from student_login l join student s on s.id = l.student_id
    where l.token_hash = ${tokenHash(token)} and l.expires_at > now() limit 1`;
  return rows[0] ?? null;
}

/* ───────────── Inscripciones ───────────── */

export async function enroll(courseId: string, studentId: string): Promise<void> {
  await sql`
    insert into course_enrollment (course_id, student_id) values (${courseId}, ${studentId})
    on conflict do nothing`;
}

export async function unenroll(courseId: string, studentId: string): Promise<boolean> {
  if (!isUuid(courseId) || !isUuid(studentId)) return false;
  const { rowCount } = await sql`
    delete from course_enrollment where course_id = ${courseId} and student_id = ${studentId}`;
  return (rowCount ?? 0) > 0;
}

export async function isEnrolled(courseId: string, studentId: string): Promise<boolean> {
  const { rows } = await sql`
    select 1 from course_enrollment where course_id = ${courseId} and student_id = ${studentId} limit 1`;
  return rows.length > 0;
}
