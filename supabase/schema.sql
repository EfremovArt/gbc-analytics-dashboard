create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.orders (
  retailcrm_id bigint primary key,
  number text not null unique,
  external_id text,
  status text not null,
  total numeric(12, 2) not null default 0,
  items_count integer not null default 0,
  customer_name text not null,
  phone text,
  email text,
  city text,
  address text,
  order_method text,
  order_type text,
  source text,
  ordered_at timestamptz not null,
  raw jsonb not null default '{}'::jsonb,
  telegram_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_ordered_at_idx on public.orders (ordered_at desc);
create index if not exists orders_total_idx on public.orders (total desc);
create index if not exists orders_telegram_notified_at_idx on public.orders (telegram_notified_at);

create or replace trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();
