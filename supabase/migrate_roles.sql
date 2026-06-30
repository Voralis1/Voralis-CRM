-- ---------------------------------------------------------------------------
-- Rôles : suppression d'« agent » (inutile) + ajout de « media_buyer ».
--
-- À exécuter dans Supabase : SQL Editor -> Run.
-- (ALTER TYPE ... ADD VALUE doit être exécuté seul / hors transaction.)
-- ---------------------------------------------------------------------------

-- 1) Ajouter le rôle media_buyer à l'enum.
alter type user_role add value if not exists 'media_buyer';

-- 2) Réaffecter les éventuels comptes « agent » -> « admin » (agent n'existe plus
--    côté application ; le back-office est désormais réservé aux admins).
update profiles set role = 'admin' where role = 'agent';

-- Note : la valeur 'agent' reste techniquement dans l'enum (PostgreSQL ne permet
-- pas de retirer une valeur d'enum simplement). Elle n'est plus utilisée ni
-- attribuable : aucun compte ne la porte et l'application l'ignore.
