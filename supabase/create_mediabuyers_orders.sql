-- ---------------------------------------------------------------------------
-- Table des commandes des MEDIA BUYERS (séparée des `orders` des affiliés).
-- À exécuter dans Supabase : SQL Editor -> Run.
-- ---------------------------------------------------------------------------
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

-- met à jour updated_at (réutilise la fonction existante touch_updated_at)
drop trigger if exists trg_mb_orders_touch on mediabuyers_orders;
create trigger trg_mb_orders_touch before update on mediabuyers_orders
  for each row execute function touch_updated_at();

-- RLS : le media buyer voit/gère SES commandes ; l'admin voit tout.
alter table mediabuyers_orders enable row level security;
drop policy if exists p_mb_orders_read on mediabuyers_orders;
create policy p_mb_orders_read on mediabuyers_orders for select
  using (media_buyer_id = auth.uid() or current_role_name() = 'admin');
