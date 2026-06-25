-- ---------------------------------------------------------------------------
-- Finalisation du passage à affiliate_network.
--
-- orders.affiliate_id gardait encore l'ANCIENNE clé étrangère vers `affiliates`
-- (conservée pendant la transition). Tant qu'elle existe, tout NOUVEAU réseau
-- (présent seulement dans affiliate_network) fait échouer l'insertion d'un lead
-- avec une erreur 23503 -> l'API renvoie 500 "Échec de création du lead".
--
-- On supprime cette ancienne FK ; la FK vers affiliate_network suffit.
-- À exécuter dans Supabase : SQL Editor -> Run.
-- ---------------------------------------------------------------------------
alter table orders drop constraint if exists orders_affiliate_id_fkey;

-- (Sécurité) S'assurer que la FK vers affiliate_network est bien en place.
alter table orders drop constraint if exists orders_affiliate_network_fkey;
alter table orders add constraint orders_affiliate_network_fkey
  foreign key (affiliate_id) references affiliate_network(id) on delete restrict;
