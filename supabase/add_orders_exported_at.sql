-- =====================================================================
-- Onglet "Commandes en traitement" : une commande explicitement exportée
-- en Excel depuis /admin/orders (avec sélection) quitte la liste principale
-- et apparaît dans le nouvel onglet, tant qu'elle n'est pas remise dans le
-- circuit (pas de bouton retour pour l'instant — aller simple).
-- Idempotent, à exécuter une fois dans le SQL editor Supabase.
-- =====================================================================

alter table orders add column if not exists exported_at timestamptz;
create index if not exists idx_orders_exported_at on orders(exported_at);
