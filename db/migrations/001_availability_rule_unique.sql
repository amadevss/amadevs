-- Elimina reglas de horario duplicadas y evita que vuelva a pasar.
-- Idempotente: se puede correr varias veces.

-- 1. Quita duplicados exactos, conservando una fila por regla lógica.
delete from availability_rule a
using availability_rule b
where a.ctid > b.ctid
  and a.weekday    = b.weekday
  and a.start_time = b.start_time
  and a.end_time   = b.end_time
  and a.timezone   = b.timezone;

-- 2. Constraint única para que el seed sea idempotente de aquí en adelante.
do $$ begin
  alter table availability_rule
    add constraint availability_rule_unique
    unique (weekday, start_time, end_time, timezone);
exception when duplicate_object then null; end $$;
