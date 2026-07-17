-- =====================================================================
-- URGENT : media_spend a été remplacée (import du 17/07/2026, nouvelles
-- colonnes account_name/spend/clicks/impressions/leads/cpl/ctr) et la RLS
-- n'a pas été recréée sur la nouvelle table -> actuellement lisible par
-- N'IMPORTE QUI avec la clé anon publique (aucune authentification requise).
-- À exécuter une fois dans le SQL editor Supabase, dès que possible.
--
-- Il n'y a plus de colonne media_buyer_id pour rattacher une ligne à un
-- buyer précis (l'appartenance se déduit maintenant par nom, côté
-- application — voir src/lib/mediaBuyerAccounts.ts). On restreint donc la
-- RLS à l'admin uniquement ; les pages /media-buying/spend et /results
-- lisent cette table via le service role (qui contourne la RLS) après
-- avoir authentifié la session Next.js, puis filtrent par buyer côté code.
-- =====================================================================

alter table media_spend enable row level security;

drop policy if exists p_media_spend_read on media_spend;
drop policy if exists p_media_spend_write on media_spend;

create policy p_media_spend_read on media_spend
  for select using (current_role_name() = 'admin');

create policy p_media_spend_write on media_spend
  for all using (current_role_name() = 'admin')
  with check (current_role_name() = 'admin');
