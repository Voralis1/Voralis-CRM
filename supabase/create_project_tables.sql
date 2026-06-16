-- Création des tables de gestion de projets et de produits pour Supabase

create table if not exists projects (
  id text primary key,
  name text not null,
  created_at date not null default current_date,
  expires_at date not null,
  product_count int not null default 0
);

create table if not exists project_products (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  created_at date not null default current_date,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  measure text,
  country text,
  quantity int not null default 0
);

alter table projects enable row level security;
alter table project_products enable row level security;

-- Exemple de politiques RLS simples pour la console Supabase
-- replace with vos règles métier réelles.

-- Projet : lecture par admin uniquement
create policy "Admin peut lire les projets" on projects
  for select using (auth.role() = 'authenticated');

-- Produit : lecture par admin uniquement
create policy "Admin peut lire les produits" on project_products
  for select using (auth.role() = 'authenticated');

-- Si vous utilisez la clé SERVICE ROLE côté serveur, vous pouvez contourner RLS.
