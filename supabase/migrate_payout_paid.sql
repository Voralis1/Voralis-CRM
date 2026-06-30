-- ---------------------------------------------------------------------------
-- Suivi des paiements de payout aux webmasters.
-- paid_at = horodatage du paiement (NULL = pas encore payé). Le payout dû à un
-- webmaster = somme du payout produit de ses leads confirmés NON encore payés.
-- Le bouton « Payé » pose paid_at = now() sur ces leads -> le dû repasse à 0.
-- À exécuter dans Supabase : SQL Editor -> Run.
-- ---------------------------------------------------------------------------
alter table orders add column if not exists paid_at timestamptz;
create index if not exists idx_orders_paid_at on orders(paid_at);
