-- =====================================================================
-- SCRIPT POUR SUPPRIMER ET RECRÉER LA TABLE ORDERS
-- =====================================================================
-- Exécutez ce script SI vous devez réinitialiser la table orders
-- ATTENTION: Cela supprimera TOUTES les données existantes!

-- Suppression des dépendances (triggers, postbacks, status_history)
drop trigger if exists trg_orders_status on orders;
drop trigger if exists trg_orders_touch on orders;
drop table if exists postbacks cascade;
drop table if exists status_history cascade;

-- Suppression de la table orders
drop table if exists orders cascade;

-- Suppression de la séquence
drop sequence if exists order_seq;

-- =====================================================================
-- RECRÉATION DE LA TABLE ORDERS AVEC TOUS LES CHAMPS
-- =====================================================================

create sequence if not exists order_seq start 1;

create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  public_id      text unique not null
                 default ('VL-' || to_char(now(),'YYYY') || '-' ||
                          lpad(nextval('order_seq')::text, 6, '0')),
  affiliate_id   uuid not null references affiliates(id) on delete restrict,
  offer_id       text not null references offers(id) on delete restrict,
  first_name     text not null,
  last_name      text,
  phone          text not null,
  country        char(2) not null,
  address        text,
  city           text,
  quantity       int not null default 1,
  ip             text,
  user_agent     text,
  sub1 text, sub2 text, sub3 text, sub4 text, sub5 text,
  comment        text,
  status         order_status not null default 'new',
  assigned_agent uuid references profiles(id) on delete set null,
  payout_amount  numeric(10,2),
  payout_currency char(3),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  confirmed_at   timestamptz,
  delivered_at   timestamptz
);

-- Recréation des index
create index if not exists idx_orders_affiliate on orders(affiliate_id);
create index if not exists idx_orders_status    on orders(status);
create index if not exists idx_orders_phone      on orders(phone);
create index if not exists idx_orders_created    on orders(created_at desc);

-- Recréation du trigger pour updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_orders_touch before update on orders
  for each row execute function touch_updated_at();

-- Recréation de la table status_history
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

-- Recréation de la table postbacks
create table if not exists postbacks (
  id              bigint generated always as identity primary key,
  order_id        uuid not null references orders(id) on delete cascade,
  affiliate_id    uuid not null references affiliates(id) on delete cascade,
  status          order_status not null,
  method          text not null default 'GET',
  url             text,
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

-- Recréation du trigger pour les changements de statut
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

create trigger trg_orders_status after update of status on orders
  for each row execute function on_order_status_change();

-- Réactivation du RLS
alter table orders         enable row level security;
alter table status_history enable row level security;
alter table postbacks      enable row level security;
