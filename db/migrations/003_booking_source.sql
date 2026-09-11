-- Distingue reservas creadas desde el sitio público de las que el admin
-- coloca a mano en el dashboard. Idempotente.
alter table booking add column if not exists source text not null default 'online';

do $$ begin
  alter table booking
    add constraint booking_source_check check (source in ('online', 'manual'));
exception when duplicate_object then null; end $$;
