-- ===========================================================================
-- MIGRATIONS MEDIA BUYER — à exécuter en UNE FOIS dans Supabase > SQL Editor.
-- Ordre : (1) rôle media_buyer, (2) commandes media buyer, (3) dépenses pub.
-- Idempotent : peut être relancé sans danger.
--
-- ⚠️ Si Supabase renvoie une erreur du type « ALTER TYPE ... ADD VALUE cannot
--    run inside a transaction block », exécute SEULE la ligne du bloc 1
--    (alter type ...), puis relance le reste.
-- ===========================================================================


-- ===========================================================================
-- 1) RÔLES : ajout de « media_buyer » + réaffectation des « agent » -> admin
-- ===========================================================================
alter type user_role add value if not exists 'media_buyer';

update profiles set role = 'admin' where role = 'agent';


-- ===========================================================================
-- 2) COMMANDES DES MEDIA BUYERS (séparée des `orders` des affiliés)
-- ===========================================================================
create sequence if not exists mb_order_seq start 1;

create table if not exists mediabuyers_orders (
  id              uuid primary key default gen_random_uuid(),
  public_id       text unique not null default lpad(nextval('mb_order_seq')::text, 6, '0'),
  media_buyer_id  uuid references profiles(id) on delete set null,  -- le media buyer propriétaire
  product         text,
  country         text,                              -- abréviation 2-3 lettres
  first_name      text not null,
  last_name       text,
  phone           text not null,
  address         text,
  city            text,
  quantity        int not null default 1,
  campaign        text,                              -- campagne (lien avec le spend)
  status          order_status not null default 'new',
  payout_amount   numeric(10,2),
  payout_currency char(3),
  comment         text,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_mb_orders_buyer  on mediabuyers_orders(media_buyer_id);
create index if not exists idx_mb_orders_status on mediabuyers_orders(status);

drop trigger if exists trg_mb_orders_touch on mediabuyers_orders;
create trigger trg_mb_orders_touch before update on mediabuyers_orders
  for each row execute function touch_updated_at();

alter table mediabuyers_orders enable row level security;
drop policy if exists p_mb_orders_read on mediabuyers_orders;
create policy p_mb_orders_read on mediabuyers_orders for select
  using (media_buyer_id = auth.uid() or current_role_name() = 'admin');


-- ===========================================================================
-- 3) DÉPENSES PUBLICITAIRES (Media Buying Cost Tracker — Partie 1)
-- ===========================================================================
create table if not exists media_spend (
  id              uuid primary key default gen_random_uuid(),
  media_buyer_id  uuid references profiles(id) on delete set null,  -- compte propriétaire
  date            date not null default current_date,
  buyer_name      text,                              -- qui a dépensé (Ikram, Reda…)
  country         text,                              -- abréviation 2-3 lettres
  campaign        text not null,                     -- champ clé du lien
  amount_usd      numeric(12,2) not null default 0,
  note            text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_media_spend_buyer on media_spend(media_buyer_id);
create index if not exists idx_media_spend_link  on media_spend(campaign, country);

alter table media_spend enable row level security;
drop policy if exists p_media_spend_read on media_spend;
create policy p_media_spend_read on media_spend for select
  using (media_buyer_id = auth.uid() or current_role_name() = 'admin');
