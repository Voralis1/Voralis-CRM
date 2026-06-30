-- Table de gestion des statuts personnalisés (onglet « Gestion des status »).
-- À exécuter une fois dans le SQL editor Supabase.

create table if not exists order_statuses (
  id                         text primary key,
  title                      text not null,
  group_name                 text not null,
  hide_date_from_affiliates  boolean not null default false,
  sort_label                 text not null default 'Par date de commande',
  created_at                 timestamptz not null default now()
);

alter table order_statuses enable row level security;

-- L'API back-office utilise la clé SERVICE ROLE (contourne la RLS).
-- Politique de lecture pour tout utilisateur authentifié (optionnel).
drop policy if exists p_order_statuses_read on order_statuses;
create policy p_order_statuses_read on order_statuses
  for select using (auth.role() = 'authenticated');
