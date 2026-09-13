-- Posts del blog gestionables desde el dashboard (crear, ocultar, eliminar).
-- Idempotente.
create table if not exists blog_post (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text not null default '',
  content      text not null,               -- cuerpo en markdown/MDX
  tags         text[] not null default '{}',
  read_time    integer not null default 1,
  published_at date not null default current_date,
  hidden       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists blog_post_published_at_idx on blog_post (published_at desc);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists blog_post_set_updated_at on blog_post;
create trigger blog_post_set_updated_at
  before update on blog_post
  for each row execute function set_updated_at();
