-- =====================================================================
-- Statuts de commande illimités (remplace l'enum order_status figé)
-- À exécuter une fois dans le SQL editor Supabase.
--
-- Contexte : orders.status était un enum Postgres à 14 valeurs figées, ce qui
-- empêchait de créer de nouveaux statuts depuis l'onglet « Gestion des
-- statuts ». On convertit les colonnes concernées en texte libre, contraint
-- par une clé étrangère vers order_statuses(slug) — l'admin peut donc créer
-- autant de statuts que voulu, chacun avec un vrai ID numérique (1, 2, 3…)
-- comme identifiant technique dans order_statuses.
--
-- Aucune valeur stockée ne change (toujours du texte comme "confirmed"), donc
-- tout le code métier existant (commission, postbacks, stats) continue de
-- fonctionner sans modification.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) order_statuses : id texte -> slug, + vrai id numérique + couleur
-- ---------------------------------------------------------------------
-- Le SQL editor de Supabase exécute chaque instruction séparément (pas de
-- transaction unique) : si le script échoue plus loin, ce qui a déjà commité
-- ici le reste. On rend donc ce bloc idempotent pour pouvoir relancer tout
-- le script sans se soucier de ce qui est déjà passé.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'order_statuses' and column_name = 'slug'
  ) then
    alter table order_statuses rename column id to slug;
    alter table order_statuses drop constraint order_statuses_pkey;
    alter table order_statuses add column id bigint generated always as identity;
    alter table order_statuses add constraint order_statuses_pkey primary key (id);
    alter table order_statuses add constraint order_statuses_slug_key unique (slug);
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'order_statuses' and column_name = 'color'
  ) then
    alter table order_statuses add column color text not null default 'bg-slate-100 text-slate-700';
  end if;
end $$;

-- Couleurs des 6 statuts déjà présents (reprises de STATUS_META, src/lib/types.ts)
update order_statuses set color = 'bg-slate-100 text-slate-700' where slug = 'new';
update order_statuses set color = 'bg-amber-100 text-amber-800' where slug = 'processing';
update order_statuses set color = 'bg-emerald-100 text-emerald-800' where slug = 'confirmed';
update order_statuses set color = 'bg-cyan-100 text-cyan-800' where slug = 'test_confirmed';
update order_statuses set color = 'bg-red-50 text-red-600' where slug = 'cancelled';
update order_statuses set color = 'bg-slate-100 text-slate-400' where slug = 'trash';

-- Réensemencement des 8 statuts historiques absents de la table (pour que
-- toute commande existante ait une correspondance avant la conversion en FK).
insert into order_statuses (slug, title, group_name, hide_date_from_affiliates, sort_label, color)
values
  ('duplicate',   'Doublon',          'double',    false, 'Par date de commande', 'bg-slate-100 text-slate-500'),
  ('no_answer',   'Injoignable',      'en traitement', false, 'Par date de commande', 'bg-orange-100 text-orange-800'),
  ('callback',    'Rappel programmé', 'en traitement', false, 'Par date de commande', 'bg-yellow-100 text-yellow-800'),
  ('rejected',    'Annulé (client)',  'annulé',    false, 'Par date de commande', 'bg-rose-100 text-rose-700'),
  ('shipped',     'Expédié',          'confirmé',  false, 'Par date de commande', 'bg-sky-100 text-sky-800'),
  ('in_delivery', 'En livraison',     'confirmé',  false, 'Par date de commande', 'bg-blue-100 text-blue-800'),
  ('delivered',   'Livré',            'confirmé',  false, 'Par date de commande', 'bg-green-200 text-green-900'),
  ('returned',    'Retourné',         'confirmé',  false, 'Par date de commande', 'bg-red-100 text-red-700')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2) Vérification : toute valeur de statut déjà en base doit avoir une
--    correspondance dans order_statuses AVANT de poser les FK.
--    Ne pas continuer si l'une de ces requêtes renvoie une ligne.
-- ---------------------------------------------------------------------
-- select distinct status from orders where status::text not in (select slug from order_statuses);
-- select distinct status from mediabuyers_orders where status::text not in (select slug from order_statuses);

-- ---------------------------------------------------------------------
-- 3) Conversion des colonnes enum -> text (non destructif, mêmes valeurs)
-- ---------------------------------------------------------------------
-- trg_orders_status est défini "after update OF status" : Postgres bloque
-- tout changement de type de cette colonne tant que le trigger existe. On le
-- supprime avant la conversion et on le recrée juste après (la fonction
-- on_order_status_change() ne référence pas le type order_status, donc elle
-- continue de fonctionner à l'identique une fois status en text).
drop trigger if exists trg_orders_status on orders;

alter table orders alter column status type text using status::text;
alter table orders alter column status set default 'new';

create trigger trg_orders_status after update of status on orders
  for each row execute function on_order_status_change();

alter table status_history alter column from_status type text using from_status::text;
alter table status_history alter column to_status   type text using to_status::text;

alter table postbacks alter column status type text using status::text;

alter table mediabuyers_orders alter column status type text using status::text;
alter table mediabuyers_orders alter column status set default 'new';

-- ---------------------------------------------------------------------
-- 4) Intégrité référentielle : status doit exister dans order_statuses,
--    sans limiter les valeurs possibles (l'admin peut en ajouter à volonté).
--    status_history/postbacks restent en texte libre sans FK : ce sont des
--    logs immuables, une FK y bloquerait l'archivage d'un statut tant qu'une
--    seule ligne d'historique le référence.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'orders' and constraint_name = 'orders_status_fkey'
  ) then
    alter table orders
      add constraint orders_status_fkey foreign key (status) references order_statuses(slug);
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'mediabuyers_orders' and constraint_name = 'mediabuyers_orders_status_fkey'
  ) then
    alter table mediabuyers_orders
      add constraint mediabuyers_orders_status_fkey foreign key (status) references order_statuses(slug);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5) Le type enum n'est plus utilisé par aucune colonne : on le supprime.
-- ---------------------------------------------------------------------
drop type if exists order_status;

-- ---------------------------------------------------------------------
-- 6) Vérification finale (doit renvoyer 0 ligne)
-- ---------------------------------------------------------------------
-- select o.status from orders o
-- left join order_statuses os on os.slug = o.status
-- where os.slug is null;
