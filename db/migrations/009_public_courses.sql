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
