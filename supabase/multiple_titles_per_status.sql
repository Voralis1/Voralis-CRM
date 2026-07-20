-- =====================================================================
-- Plusieurs titres par slug de statut.
--
-- Contexte : order_statuses associe aujourd'hui 1 slug <-> 1 titre. On
-- garde le slug comme "bucket" métier (pilote payout, postback, groupes
-- de stats), et on ajoute une table à part pour pouvoir définir PLUSIEURS
-- titres détaillés sous un même slug (ex. slug "confirmed" -> titres
-- "Confirmé", "Expédié", "En livraison", "Livré"). La commande garde le
-- slug (pour toute la logique existante, inchangée) + un titre précis
-- choisi parmi ceux du slug (pour l'affichage).
--
-- Le postback continue d'envoyer le slug (pas le titre précis) : aucun
-- changement de ce côté.
--
-- À exécuter une fois dans le SQL editor Supabase.
-- =====================================================================

-- 1) Table des titres, plusieurs par slug.
create table if not exists status_titles (
  id         bigint generated always as identity primary key,
  slug       text not null references order_statuses(slug) on delete cascade,
  title      text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (slug, title)
);
create index if not exists idx_status_titles_slug on status_titles(slug);

alter table status_titles enable row level security;
drop policy if exists p_status_titles_read on status_titles;
create policy p_status_titles_read on status_titles for select using (auth.role() = 'authenticated');
-- L'API back-office (service role) contourne la RLS pour les écritures.

-- 2) Seed : un titre par défaut par slug existant (= le titre actuel du
--    slug), pour qu'aucun slug ne se retrouve sans titre sélectionnable.
insert into status_titles (slug, title, sort_order)
select slug, title, 0 from order_statuses
where not exists (select 1 from status_titles st where st.slug = order_statuses.slug);

-- 3) Colonne sur orders/mediabuyers_orders : titre précis actuellement
--    affiché (nullable -> repli sur le titre du slug si absent).
alter table orders add column if not exists status_title_id bigint references status_titles(id) on delete set null;
alter table mediabuyers_orders add column if not exists status_title_id bigint references status_titles(id) on delete set null;

-- Backfill : rattache chaque commande existante au titre par défaut de son slug actuel.
update orders o
set status_title_id = st.id
from status_titles st
where st.slug = o.status and o.status_title_id is null;

update mediabuyers_orders o
set status_title_id = st.id
from status_titles st
where st.slug = o.status and o.status_title_id is null;

-- 4) status_history : capture aussi le titre précis choisi (texte libre,
--    sans contrainte de clé étrangère -- comme to_status/from_status déjà
--    en place -- pour rester consultable même si un titre est supprimé
--    plus tard).
alter table status_history add column if not exists to_status_title text;
alter table status_history add column if not exists from_status_title text;

-- 5) Trigger : se déclenche maintenant aussi sur un changement de TITRE
--    (même slug), pas seulement de slug. Le postback, lui, ne part que
--    si le SLUG change (comportement inchangé).
create or replace function on_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  aff affiliate_network%rowtype;
  new_title text;
  old_title text;
  slug_changed boolean;
  title_changed boolean;
begin
  slug_changed := (TG_OP = 'INSERT') or (new.status is distinct from old.status);
  title_changed := (TG_OP = 'UPDATE') and (new.status_title_id is distinct from old.status_title_id);

  if TG_OP = 'UPDATE' and (slug_changed or title_changed) then
    select title into new_title from status_titles where id = new.status_title_id;
    select title into old_title from status_titles where id = old.status_title_id;
    insert into status_history(order_id, from_status, to_status, changed_by, to_status_title, from_status_title)
    values (new.id, old.status, new.status, new.assigned_agent, new_title, old_title);
  end if;

  if slug_changed then
    select * into aff from affiliate_network where id = new.affiliate_id;
    if aff.postback_url is not null and length(trim(aff.postback_url)) > 0 then
      insert into postbacks(order_id, affiliate_id, status, method)
      values (new.id, new.affiliate_id, new.status, coalesce(aff.postback_method,'GET'));
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_status on orders;
create trigger trg_orders_status after insert or update of status, status_title_id on orders
  for each row execute function on_order_status_change();
