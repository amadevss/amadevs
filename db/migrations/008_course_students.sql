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
