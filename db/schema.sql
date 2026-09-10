-- ============================================================================
-- amadevs · Agenda + Pagos (estilo Calendly)
-- Base de datos: Neon (PostgreSQL 15+)
--
-- Cómo aplicarlo:
--   1. Crea el proyecto en Neon y copia la cadena de conexión "pooled".
--   2. Pega este archivo completo en el SQL Editor de Neon y ejecútalo,
--      o:  psql "$DATABASE_URL" -f db/schema.sql
--   3. Ajusta los precios y el horario en la sección SEED (al final).
--
-- Notas de diseño:
--   - Todo el tiempo se guarda en timestamptz (UTC). La conversión a la zona
--     horaria de quien reserva y a America/Tijuana se hace en la app.
--   - El dinero se guarda en enteros (centavos). Nunca float.
--   - La restricción EXCLUDE de "booking" impide dobles reservas a nivel de BD:
--     es la red de seguridad ante condiciones de carrera, no confíes solo en
--     la consulta de disponibilidad.
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type booking_status as enum (
    'pending_payment',  -- se creó el "hold", esperando el pago en Stripe
    'confirmed',         -- pagado
    'completed',         -- la sesión ya ocurrió
    'canceled',          -- cancelada (por ti o por el cliente)
    'expired',           -- el hold venció sin pago
    'refunded'           -- reembolsada
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- SERVICE · lo que la gente puede reservar (paquetes con precio fijo)
-- ---------------------------------------------------------------------------
create table if not exists service (
  id               uuid primary key default gen_random_uuid(),
  slug             text    not null unique,
  name             text    not null,
  description      text,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents      integer not null check (price_cents >= 0),   -- 0 = gratis (diagnóstico)
  currency         text    not null default 'mxn',
  active           boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AVAILABILITY_RULE · tu horario semanal recurrente
--   weekday: 0 = domingo ... 6 = sábado
--   start_time / end_time se interpretan en `timezone`
-- ---------------------------------------------------------------------------
create table if not exists availability_rule (
  id         uuid primary key default gen_random_uuid(),
  weekday    smallint not null check (weekday between 0 and 6),
  start_time time     not null,
  end_time   time     not null,
  timezone   text     not null default 'America/Tijuana',
  active     boolean  not null default true,
  check (start_time < end_time)
);

-- ---------------------------------------------------------------------------
-- BLACKOUT · rangos bloqueados manualmente (vacaciones, personal)
-- ---------------------------------------------------------------------------
create table if not exists blackout (
  id         uuid primary key default gen_random_uuid(),
  during     tstzrange not null,
  reason     text,
  created_at timestamptz not null default now(),
  constraint blackout_no_overlap exclude using gist (during with &&)
);

-- ---------------------------------------------------------------------------
-- BOOKING · la reserva
-- ---------------------------------------------------------------------------
create table if not exists booking (
  id                         uuid primary key default gen_random_uuid(),
  reference                  text not null unique,          -- id público: CNS-7F3K2QA
  service_id                 uuid not null references service(id),

  customer_name              text not null,
  customer_email             text not null,
  customer_company           text,
  customer_note              text,
  customer_timezone          text not null default 'America/Tijuana',

  starts_at                  timestamptz not null,
  ends_at                    timestamptz not null,
  during                     tstzrange generated always as (tstzrange(starts_at, ends_at)) stored,

  status                     booking_status not null default 'pending_payment',

  amount_cents               integer not null,
  currency                   text    not null default 'mxn',

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id   text unique,
  stripe_receipt_url         text,                          -- recibo hospedado por Stripe

  hold_expires_at            timestamptz,                   -- mientras está en pending_payment
  paid_at                    timestamptz,
  canceled_at                timestamptz,
  meeting_url                text,                          -- link de Meet/Zoom (se llena al confirmar)

  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  check (ends_at > starts_at)
);

-- Ninguna reserva "viva" puede solaparse con otra.
alter table booking drop constraint if exists booking_no_overlap;
alter table booking add  constraint booking_no_overlap
  exclude using gist (during with &&)
  where (status in ('pending_payment', 'confirmed', 'completed'));

create index if not exists booking_starts_at_idx on booking (starts_at);
create index if not exists booking_status_idx    on booking (status);
create index if not exists booking_email_idx     on booking (lower(customer_email));

-- ---------------------------------------------------------------------------
-- PAYMENT · libro mayor, una fila por cargo / reembolso de Stripe
-- ---------------------------------------------------------------------------
create table if not exists payment (
  id                       uuid primary key default gen_random_uuid(),
  booking_id               uuid not null references booking(id) on delete cascade,
  stripe_payment_intent_id text,
  stripe_charge_id         text,
  amount_cents             integer not null,
  currency                 text    not null default 'mxn',
  status                   payment_status not null default 'pending',
  receipt_url              text,
  raw                      jsonb,                           -- evento de Stripe completo
  created_at               timestamptz not null default now()
);
create index if not exists payment_booking_id_idx on payment (booking_id);

-- ---------------------------------------------------------------------------
-- WEBHOOK_EVENT · idempotencia de webhooks de Stripe
--   insertamos el event.id antes de procesar; si ya existe, no re-procesamos.
-- ---------------------------------------------------------------------------
create table if not exists webhook_event (
  id           text primary key,        -- Stripe event id (evt_...)
  type         text not null,
  processed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Trigger updated_at
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists booking_set_updated_at on booking;
create trigger booking_set_updated_at
  before update on booking
  for each row execute function set_updated_at();

-- ============================================================================
-- SEED · ajusta esto a tu realidad
-- ============================================================================

insert into service (slug, name, description, duration_minutes, price_cents, currency, sort_order) values
  ('diagnostico-15', 'Llamada de diagnóstico',     'Videollamada breve para entender tu necesidad.', 15,      0, 'mxn', 0),
  ('consultoria-1h', 'Consultoría · 1 hora',       'Sesión 1:1 enfocada en un tema concreto.',       60, 150000, 'mxn', 1),
  ('consultoria-2h', 'Consultoría · 2 horas',      'Sesión extendida para revisión profunda.',      120, 280000, 'mxn', 2),
  ('consultoria-3h', 'Consultoría · media jornada','Bloque de trabajo conjunto.',                   180, 390000, 'mxn', 3)
on conflict (slug) do nothing;

-- Horario: lunes a viernes. weekday 1=lunes ... 5=viernes
insert into availability_rule (weekday, start_time, end_time, timezone) values
  (1, '10:00', '18:00', 'America/Tijuana'),
  (2, '10:00', '18:00', 'America/Tijuana'),
  (3, '10:00', '18:00', 'America/Tijuana'),
  (4, '10:00', '18:00', 'America/Tijuana'),
  (5, '10:00', '15:00', 'America/Tijuana')
on conflict do nothing;

-- ============================================================================
-- Consultas útiles para el día a día
-- ============================================================================

-- Reservas que ocupan el calendario (para pintar los slots ocupados):
--   select starts_at, ends_at, status from booking
--   where status = 'confirmed'
--      or (status = 'pending_payment' and hold_expires_at > now());

-- Liberar holds vencidos (lo llama el cron cada ~10 min):
--   update booking set status = 'expired'
--   where status = 'pending_payment' and hold_expires_at < now();

-- Buscar una reserva por su id público:
--   select b.*, s.name as service_name
--   from booking b join service s on s.id = b.service_id
--   where b.reference = $1;
