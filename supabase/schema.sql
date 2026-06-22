-- =====================================================================
-- VORALIS CRM — Schéma PostgreSQL (Supabase)
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- =====================================================================

create extension if not exists pgcrypto;       -- gen_random_uuid, digest
create extension if not exists pg_net;          -- (optionnel) appels HTTP depuis Postgres

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'agent', 'affiliate');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payout_model as enum ('confirmed', 'delivered');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'new', 'duplicate', 'trash',
    'processing', 'no_answer', 'callback', 'confirmed', 'rejected',
    'shipped', 'in_delivery', 'delivered', 'returned', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type postback_state as enum ('pending', 'sent', 'failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- PROFILES (lié à auth.users) — rôle de chaque utilisateur
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'affiliate',
  full_name   text,
  created_at  timestamptz not null default now()
);

-- Crée automatiquement un profil à l'inscription Supabase Auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- AFFILIATES (webmasters)
-- ---------------------------------------------------------------------
create table if not exists affiliates (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid unique references profiles(id) on delete set null,
  name             text not null,
  email            text,
  api_token        text not null unique,        -- vrl_live_xxx (lu seulement par owner/admin via RLS)
  postback_url     text,                         -- template avec macros {lead_id}, {status}...
  postback_method  text not null default 'GET',  -- 'GET' | 'POST'
  signature_secret text not null default encode(gen_random_bytes(16), 'hex'),
  status           text not null default 'active', -- active | paused | banned
  created_at       timestamptz not null default now()
);
create index if not exists idx_affiliates_token on affiliates(api_token);

-- ---------------------------------------------------------------------
-- OFFERS
-- ---------------------------------------------------------------------
create table if not exists offers (
  id           text primary key,                 -- ex. 'AO-LUMORA-001'
  name         text not null,
  product      text,
  country      char(2) not null,                 -- ISO2
  payout       numeric(10,2) not null default 0,
  currency     char(3) not null default 'USD',
  payout_model payout_model not null default 'delivered',
  status       text not null default 'active',   -- active | paused
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ORDERS (le lead de bout en bout) + identifiant public séquentiel
-- ---------------------------------------------------------------------
create sequence if not exists order_seq start 1;

create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  public_id      text unique not null
                 default lpad(nextval('order_seq')::text, 6, '0'),
  affiliate_id   uuid not null references affiliates(id) on delete restrict,
  offer_id       text references offers(id) on delete restrict,  -- facultatif
  product        text,                                           -- produit en texte libre
  first_name     text not null,
  last_name      text,
  phone          text not null,
  country        char(2),                                        -- facultatif
  address        text,
  city           text,
  quantity       int not null default 1,
  ip             text,
  user_agent     text,
  affiliate text, sub3 text, sub4 text, sub5 text,
  comment        text,
  status         order_status not null default 'new',
  assigned_agent uuid references profiles(id) on delete set null,
  payout_amount  numeric(10,2),                  -- renseigné quand statut facturable atteint
  payout_currency char(3),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  confirmed_at   timestamptz,
  delivered_at   timestamptz
);
create index if not exists idx_orders_affiliate on orders(affiliate_id);
create index if not exists idx_orders_status    on orders(status);
create index if not exists idx_orders_phone      on orders(phone);
create index if not exists idx_orders_created    on orders(created_at desc);

-- met à jour updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_orders_touch on orders;
create trigger trg_orders_touch before update on orders
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------
-- STATUS HISTORY
-- ---------------------------------------------------------------------
create table if not exists status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  changed_by  uuid references profiles(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_history_order on status_history(order_id);

-- ---------------------------------------------------------------------
-- POSTBACKS (file d'attente vers les trackers affiliés)
-- ---------------------------------------------------------------------
create table if not exists postbacks (
  id              bigint generated always as identity primary key,
  order_id        uuid not null references orders(id) on delete cascade,
  affiliate_id    uuid not null references affiliates(id) on delete cascade,
  status          order_status not null,
  method          text not null default 'GET',
  url             text,                           -- résolue au moment de l'envoi
  payload         jsonb,
  attempts        int not null default 0,
  max_attempts    int not null default 4,
  http_status     int,
  response_body   text,
  state           postback_state not null default 'pending',
  last_attempt_at timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_postbacks_state on postbacks(state, attempts);

-- À chaque changement de statut : historiser + enfiler un postback
create or replace function on_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare aff affiliates%rowtype;
begin
  if new.status is distinct from old.status then
    insert into status_history(order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, new.assigned_agent);

    select * into aff from affiliates where id = new.affiliate_id;
    if aff.postback_url is not null and length(trim(aff.postback_url)) > 0 then
      insert into postbacks(order_id, affiliate_id, status, method)
      values (new.id, new.affiliate_id, new.status, coalesce(aff.postback_method,'GET'));
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_status on orders;
create trigger trg_orders_status after update of status on orders
  for each row execute function on_order_status_change();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table profiles       enable row level security;
alter table affiliates     enable row level security;
alter table offers         enable row level security;
alter table orders         enable row level security;
alter table status_history enable row level security;
alter table postbacks      enable row level security;

-- Helpers
create or replace function current_role_name()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function my_affiliate_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from affiliates where auth_user_id = auth.uid()
$$;

-- profiles : chacun voit/édite son profil ; admin voit tout
drop policy if exists p_profiles_self on profiles;
create policy p_profiles_self on profiles for select
  using (id = auth.uid() or current_role_name() = 'admin');

-- affiliates : l'affilié voit/édite SA ligne ; admin tout
drop policy if exists p_aff_select on affiliates;
create policy p_aff_select on affiliates for select
  using (auth_user_id = auth.uid() or current_role_name() in ('admin','agent'));
drop policy if exists p_aff_update on affiliates;
create policy p_aff_update on affiliates for update
  using (auth_user_id = auth.uid() or current_role_name() = 'admin');
drop policy if exists p_aff_admin_all on affiliates;
create policy p_aff_admin_all on affiliates for all
  using (current_role_name() = 'admin') with check (current_role_name() = 'admin');

-- offers : lecture par tout authentifié ; écriture admin
drop policy if exists p_offers_read on offers;
create policy p_offers_read on offers for select using (auth.uid() is not null);
drop policy if exists p_offers_admin on offers;
create policy p_offers_admin on offers for all
  using (current_role_name() = 'admin') with check (current_role_name() = 'admin');

-- orders : affilié voit les siens ; agent/admin voient tout, peuvent éditer
drop policy if exists p_orders_aff on orders;
create policy p_orders_aff on orders for select
  using (affiliate_id = my_affiliate_id() or current_role_name() in ('admin','agent'));
drop policy if exists p_orders_staff_update on orders;
create policy p_orders_staff_update on orders for update
  using (current_role_name() in ('admin','agent'))
  with check (current_role_name() in ('admin','agent'));

-- status_history : affilié voit l'historique de ses orders ; staff tout
drop policy if exists p_history_read on status_history;
create policy p_history_read on status_history for select
  using (
    current_role_name() in ('admin','agent')
    or exists (select 1 from orders o where o.id = status_history.order_id
               and o.affiliate_id = my_affiliate_id())
  );

-- postbacks : affilié lit les siens ; staff tout
drop policy if exists p_postbacks_read on postbacks;
create policy p_postbacks_read on postbacks for select
  using (affiliate_id = my_affiliate_id() or current_role_name() in ('admin','agent'));

-- NB : l'API publique (intake leads) et le dispatcher utilisent la SERVICE ROLE,
-- qui contourne la RLS. L'authentification y est faite par token affilié (code).
