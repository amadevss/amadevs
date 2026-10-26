-- Entregas registradas por el profesor desde el dashboard (a nombre de un
-- alumno). Solo agrega una columna; las entregas existentes quedan en false.
-- Idempotente.

alter table course_submission
  add column if not exists added_by_teacher boolean not null default false;
