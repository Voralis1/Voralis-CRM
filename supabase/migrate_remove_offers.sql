-- Remplace le concept d'« offre » (table offers, orders.offer_id) par une
-- référence directe au produit du catalogue (project_products.id).
-- Le payout/currency/payout_model vivent désormais sur project_products,
-- qui devient la seule source de vérité pour la commission.

-- 1) La config de commission migre sur project_products.
alter table project_products
  add column if not exists payout_model text not null default 'delivered'
    check (payout_model in ('confirmed', 'delivered'));
alter table project_products
  add column if not exists currency text not null default 'USD';

-- 2) orders référence directement le produit.
alter table orders
  add column if not exists product_id text references project_products(id) on delete set null;

-- Backfill best-effort : ne reprend que les offer_id qui correspondent
-- réellement à un produit existant (les offer_id "legacy" sans produit
-- correspondant restent non rattachés ; leur nom est déjà dans orders.product).
update orders
set product_id = offer_id
where offer_id is not null
  and offer_id in (select id from project_products);

-- 3) Supprime l'ancienne colonne (et sa FK) puis la table offers.
alter table orders drop column if exists offer_id;
drop table if exists offers;
