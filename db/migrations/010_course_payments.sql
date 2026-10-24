-- Venta de cursos públicos con Stripe: precio y opciones de pago por curso,
-- compras y origen de cada inscripción. Solo agrega; idempotente.

alter table course add column if not exists price_cents integer not null default 0;   -- 0 = gratis
alter table course add column if not exists currency text not null default 'mxn';
alter table course add column if not exists payment_methods text[] not null default '{card}';
alter table course add column if not exists allow_promotion_codes boolean not null default true;
alter table course add column if not exists installments boolean not null default false;  -- meses sin intereses
alter table course add column if not exists collect_tax_id boolean not null default false; -- pedir RFC
-- Producto y precio en Stripe; son distintos en modo prueba y en modo real.
alter table course add column if not exists stripe_mode text;
alter table course add column if not exists stripe_product_id text;
alter table course add column if not exists stripe_price_id text;

-- link: con el enlace o gratis · purchase: compra · manual: desde el dashboard
alter table course_enrollment add column if not exists source text not null default 'link';

create table if not exists course_purchase (
  id                  uuid primary key default gen_random_uuid(),
  course_id           uuid references course(id) on delete set null,
  student_id          uuid references student(id) on delete set null,
  course_title        text not null,
  student_email       text not null,
  student_name        text not null default '',
  stripe_mode         text not null,
  checkout_session_id text not null unique,
  payment_intent_id   text,
  charge_id           text,
  status              text not null default 'pending'
                      check (status in ('pending', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded', 'disputed')),
  amount_cents        integer not null default 0,
  discount_cents      integer not null default 0,
  refunded_cents      integer not null default 0,
  currency            text not null default 'mxn',
  promotion_code      text,
  payment_method      text,
  installments        integer,
  receipt_url         text,
  voucher_url         text,              -- ficha de OXXO mientras está pendiente
  tax_ids             jsonb,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  refunded_at         timestamptz,
  updated_at          timestamptz not null default now()
);

create index if not exists course_purchase_course_idx on course_purchase (course_id, created_at desc);
create index if not exists course_purchase_student_idx on course_purchase (student_id, created_at desc);
create index if not exists course_purchase_pi_idx on course_purchase (payment_intent_id);

drop trigger if exists course_purchase_set_updated_at on course_purchase;
create trigger course_purchase_set_updated_at
  before update on course_purchase
  for each row execute function set_updated_at();
