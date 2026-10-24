/**
 * Copias de db/migrations/007_courses.sql, 008_course_students.sql y 009_public_courses.sql. Las
 * variables de Neon son "sensibles" y no se pueden bajar con la CLI, así que la
 * app aplica las migraciones sola la primera vez (son idempotentes).
 * Si cambias un .sql, cambia aquí también.
 */
export const COURSES_SCHEMA_SQL = `
-- Cursos: cursos → sesiones → materiales, y entregas de alumnos (sin login,
-- solo nombre completo). Los archivos viven en Vercel Blob (privado); aquí
-- solo guardamos el pathname. Idempotente.

create table if not exists course (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,           -- id público: cursos.bryanoliveros.com/<slug>
  title       text not null,
  description text not null default '',
  hidden      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists course_session (
  id                  uuid primary key default gen_random_uuid(),
  course_id           uuid not null references course(id) on delete cascade,
  position            integer not null,        -- número de sesión, también va en la URL
  title               text not null,
  description         text not null default '',
  content             text not null default '', -- detalles en markdown
  accepts_submissions boolean not null default true,
  due_at              timestamptz,
  hidden              boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (course_id, position)
);

create table if not exists course_material (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references course_session(id) on delete cascade,
  pathname     text not null unique,
  filename     text not null,
  content_type text not null default 'application/octet-stream',
  size         bigint not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists course_material_session_idx on course_material (session_id, created_at);

create table if not exists course_submission (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references course_session(id) on delete cascade,
  student_name text not null,
  comment      text not null default '',
  grade        text,
  feedback     text,
  created_at   timestamptz not null default now()
);

create index if not exists course_submission_session_idx on course_submission (session_id, created_at desc);

create table if not exists course_submission_file (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references course_submission(id) on delete cascade,
  pathname      text not null unique,
  filename      text not null,
  content_type  text not null default 'application/octet-stream',
  size          bigint not null default 0
);

create index if not exists course_submission_file_sub_idx on course_submission_file (submission_id);

-- set_updated_at() ya existe (006_blog_post.sql); se redefine por si acaso.
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists course_set_updated_at on course;
create trigger course_set_updated_at
  before update on course
  for each row execute function set_updated_at();

drop trigger if exists course_session_set_updated_at on course_session;
create trigger course_session_set_updated_at
  before update on course_session
  for each row execute function set_updated_at();
`;

export const STUDENTS_SCHEMA_SQL = `
-- Alumnos con cuenta (registro abierto con el enlace del curso), sesiones de
-- login, inscripciones, entregas ligadas al alumno y asistencia. Idempotente.

create table if not exists student (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,          -- siempre en minúsculas
  full_name       text not null,
  password_hash   text not null,
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists student_set_updated_at on student;
create trigger student_set_updated_at
  before update on student
  for each row execute function set_updated_at();

create table if not exists student_login (
  token_hash  text primary key,                  -- sha256 del token de la cookie
  student_id  uuid not null references student(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists student_login_student_idx on student_login (student_id);

create table if not exists course_enrollment (
  course_id  uuid not null references course(id) on delete cascade,
  student_id uuid not null references student(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, student_id)
);

create index if not exists course_enrollment_student_idx on course_enrollment (student_id);

-- Las entregas ahora pertenecen a un alumno (una por sesión; se reemplaza).
alter table course_submission
  add column if not exists student_id uuid references student(id) on delete cascade;
alter table course_submission
  add column if not exists updated_at timestamptz not null default now();
create unique index if not exists course_submission_student_uniq
  on course_submission (session_id, student_id) where student_id is not null;

create table if not exists course_attendance (
  session_id uuid not null references course_session(id) on delete cascade,
  student_id uuid not null references student(id) on delete cascade,
  status     text not null check (status in ('presente', 'retardo', 'falta', 'justificada')),
  updated_at timestamptz not null default now(),
  primary key (session_id, student_id)
);
`;

export const PUBLIC_COURSES_SCHEMA_SQL = `
-- Cursos públicos: catálogo, portada, video por clase, clases de muestra y
-- avance del alumno. Solo agrega columnas/tablas; los cursos que ya existen
-- quedan como 'privado' y no cambian. Idempotente.

alter table course add column if not exists kind text not null default 'privado';
do $$ begin
  alter table course add constraint course_kind_check check (kind in ('privado', 'publico'));
exception when duplicate_object then null; end $$;
alter table course add column if not exists summary text not null default '';
alter table course add column if not exists cover_pathname text;

alter table course_session add column if not exists is_preview boolean not null default false;
alter table course_session add column if not exists video_key text;
alter table course_session add column if not exists video_filename text;
alter table course_session add column if not exists video_size bigint;
alter table course_session add column if not exists video_duration integer; -- segundos

create table if not exists course_lesson_progress (
  session_id       uuid not null references course_session(id) on delete cascade,
  student_id       uuid not null references student(id) on delete cascade,
  position_seconds integer not null default 0,
  completed_at     timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (session_id, student_id)
);

create index if not exists course_lesson_progress_student_idx
  on course_lesson_progress (student_id, updated_at desc);
`;
