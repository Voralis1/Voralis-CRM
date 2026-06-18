-- Migration : identifiants de commande numériques (sans lettres).
-- À exécuter une fois dans le SQL editor Supabase.

-- 1) Nouveau format par défaut pour les futures commandes : que des chiffres.
alter table orders
  alter column public_id set default lpad(nextval('order_seq')::text, 6, '0');

-- 2) Conversion des commandes existantes : on retire le préfixe « VL-AAAA- »
--    pour ne garder que la partie numérique (ex. VL-2026-000006 -> 000006).
update orders
set public_id = regexp_replace(public_id, '^[A-Za-z]+-\d{4}-', '')
where public_id ~ '[A-Za-z]';
