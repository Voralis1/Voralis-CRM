-- =====================================================================
-- Ajout de sub1 et sub2 sur orders (aux côtés de sub3, sub4, sub5 déjà
-- existants) : 5 champs de tracking libres au total (sub1..sub5).
-- Idempotent, à exécuter une fois dans le SQL editor Supabase.
--
-- Rappel : `affiliate` (l'ex-sub2 renommé lors du passage au modèle
-- affiliate_network, cf. create_affiliate_model.sql) reste un champ à part
-- entière (sous-affilié), inchangé — ce script ajoute un sub2 distinct.
-- =====================================================================

alter table orders add column if not exists sub1 text;
alter table orders add column if not exists sub2 text;
