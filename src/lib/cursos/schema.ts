/**
 * Copia de db/migrations/007_courses.sql. Las variables de Neon son "sensibles"
 * y no se pueden bajar con la CLI, así que la app aplica la migración sola la
 * primera vez (es idempotente). Si cambias una, cambia la otra.
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
