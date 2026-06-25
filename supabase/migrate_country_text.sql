-- ---------------------------------------------------------------------------
-- Le pays peut faire 2 OU 3 lettres (ex. AGO, GAB, BZV) selon les abréviations
-- Voralis. La colonne orders.country était en char(2) -> on la passe en text.
-- Non destructif (élargissement de type). À exécuter dans Supabase SQL Editor.
-- ---------------------------------------------------------------------------
alter table orders alter column country type text;
