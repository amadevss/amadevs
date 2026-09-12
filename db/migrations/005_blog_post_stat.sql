-- Contadores de vistas y likes por artículo del blog. Idempotente.
create table if not exists blog_post_stat (
  slug       text primary key,
  views      integer not null default 0,
  likes      integer not null default 0,
  updated_at timestamptz not null default now()
);
