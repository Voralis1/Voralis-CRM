-- ---------------------------------------------------------------------------
-- Nouveau modèle de données : admin / affiliate_network / affiliate
--
-- - admin              : comptes staff (name, email)            ex. Admin Test, Voralis
-- - affiliate_network  : réseaux affiliés (token, postback...)   ex. Fgmed
-- - affiliate          : affiliés rattachés à un réseau          ex. ezaff, 3379, 123
--
-- L'app est rebranchée sur ces tables. La table `affiliates` actuelle est
-- CONSERVÉE (non supprimée) pour rollback, mais n'est plus utilisée.
-- Les 5 leads existants pointent tous vers Fgmed -> on préserve l'id de Fgmed,
-- donc AUCUNE donnée de orders à migrer (juste le repointage de la FK).
--
-- À exécuter dans Supabase : SQL Editor -> coller -> Run.  (À lancer AVANT le
-- déploiement du nouveau code.)
-- ---------------------------------------------------------------------------

-- 1) ADMIN -------------------------------------------------------------------
create table if not exists admin (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  created_at  timestamptz not null default now()
);

-- 2) AFFILIATE NETWORK (ex-« affiliates ») -----------------------------------
create table if not exists affiliate_network (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid unique references profiles(id) on delete set null,
  name             text not null,
  email            text,
  api_token        text not null unique,          -- vrl_live_xxx
  postback_url     text,
  postback_method  text not null default 'GET',   -- 'GET' | 'POST'
  signature_secret text not null default encode(gen_random_bytes(16), 'hex'),
  status           text not null default 'active',-- active | paused | banned
  created_at       timestamptz not null default now()
);
create index if not exists idx_affiliate_network_token on affiliate_network(api_token);

-- 3) AFFILIATE (rattaché à un réseau) ----------------------------------------
create table if not exists affiliate (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                       -- ex. ezaff, 3379, 123
  network_id  uuid not null references affiliate_network(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (network_id, name)
);
create index if not exists idx_affiliate_network_id on affiliate(network_id);

-- ---------------------------------------------------------------------------
-- SEED : reprise des vraies données actuelles
-- ---------------------------------------------------------------------------

-- Réseau Fgmed : on PRÉSERVE son id (les orders pointent déjà dessus) + son
-- auth_user_id (pour la connexion au panel) et son token/postback.
insert into affiliate_network (id, auth_user_id, name, email, api_token, postback_url, postback_method, signature_secret, status)
select id, auth_user_id, name, email, api_token, postback_url, postback_method, signature_secret, status
from affiliates
where name = 'Fgmed'
on conflict (id) do nothing;

-- Admin : « Admin Test » et « Voralis » (propriétaire du CRM).
insert into admin (name, email)
select name, email
from affiliates
where name in ('Admin Test', 'Voralis')
on conflict do nothing;

-- Renommage orders.sub2 -> affiliate et suppression de orders.sub1 (inutile).
-- Idempotent : ne fait rien si déjà appliqué.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'orders' and column_name = 'sub2') then
    alter table orders rename column sub2 to affiliate;
  end if;
  if exists (select 1 from information_schema.columns
             where table_name = 'orders' and column_name = 'sub1') then
    alter table orders drop column sub1;
  end if;
end $$;

-- Affiliés : valeurs distinctes du champ `affiliate` déjà reçues, rattachées au réseau Fgmed.
insert into affiliate (name, network_id)
select distinct o.affiliate, (select id from affiliate_network where name = 'Fgmed')
from orders o
where o.affiliate is not null and o.affiliate <> ''
  and exists (select 1 from affiliate_network where name = 'Fgmed')
on conflict (network_id, name) do nothing;

-- ---------------------------------------------------------------------------
-- Lien orders -> affiliate_network : on AJOUTE une 2e clé étrangère sur
-- orders.affiliate_id (sans supprimer l'ancienne vers `affiliates`). L'id de
-- Fgmed étant préservé, toutes les lignes restent valides dans les DEUX tables.
--
-- Avantage : l'ancien code (embed `affiliates(name)`) ET le nouveau
-- (`affiliate_network(name)`) fonctionnent en même temps -> déploiement sans
-- coupure. L'ancienne FK pourra être supprimée plus tard, une fois le nouveau
-- code en production :
--   alter table orders drop constraint orders_affiliate_id_fkey;
-- ---------------------------------------------------------------------------
alter table orders drop constraint if exists orders_affiliate_network_fkey;
alter table orders add constraint orders_affiliate_network_fkey
  foreign key (affiliate_id) references affiliate_network(id) on delete restrict;

-- ---------------------------------------------------------------------------
-- RLS (lecture authentifiée ; écritures via service role côté serveur)
-- ---------------------------------------------------------------------------
alter table admin             enable row level security;
alter table affiliate_network enable row level security;
alter table affiliate         enable row level security;

drop policy if exists p_admin_read on admin;
create policy p_admin_read on admin for select using (auth.uid() is not null);

drop policy if exists p_affnet_read on affiliate_network;
create policy p_affnet_read on affiliate_network for select using (auth.uid() is not null);

drop policy if exists p_affnet_self on affiliate_network;
create policy p_affnet_self on affiliate_network for all
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

drop policy if exists p_aff_read on affiliate;
create policy p_aff_read on affiliate for select using (auth.uid() is not null);
