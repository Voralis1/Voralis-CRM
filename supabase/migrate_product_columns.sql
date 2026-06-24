-- ---------------------------------------------------------------------------
-- Nouvelles colonnes pour project_products (refonte de la table « produits »).
-- Non destructif : ajoute des colonnes, ne supprime rien.
-- À exécuter dans Supabase : SQL Editor -> coller -> Run.
-- ---------------------------------------------------------------------------
alter table project_products add column if not exists category          text;
alter table project_products add column if not exists daily_capacity    int           not null default 0;
alter table project_products add column if not exists confirmation_rate numeric(5,2)   not null default 0;
alter table project_products add column if not exists payout            numeric(12,2)  not null default 0;
alter table project_products add column if not exists status            text           not null default 'active';
alter table project_products add column if not exists working_hours     text;

-- « informations supplémentaires » réutilise la colonne existante `description`.
