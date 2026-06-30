-- ---------------------------------------------------------------------------
-- Dépenses publicitaires des media buyers (Media Buying Cost Tracker, Partie 1).
-- 1 ligne par campagne, par jour. Reliée aux commandes via campagne + pays.
-- À exécuter dans Supabase : SQL Editor -> Run.
-- ---------------------------------------------------------------------------
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

-- RLS : le media buyer voit/gère ses dépenses ; l'admin voit tout.
alter table media_spend enable row level security;
drop policy if exists p_media_spend_read on media_spend;
create policy p_media_spend_read on media_spend for select
  using (media_buyer_id = auth.uid() or current_role_name() = 'admin');
