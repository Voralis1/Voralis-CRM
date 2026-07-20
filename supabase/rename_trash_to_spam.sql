-- =====================================================================
-- Renomme le statut "trash" en "spam" (même statut, nouveau slug).
-- Contexte : le postback envoie le slug tel quel dans la macro {status}.
-- Le tracker de l'affilié kma.biz (trackerlead.biz) attend le mot "spam"
-- pour cette catégorie de lead ; "trash" n'est pas reconnu (HTTP 400
-- "Status must be defined"). À exécuter une fois dans le SQL editor
-- Supabase.
--
-- orders.status / mediabuyers_orders.status / status_history.to_status
-- référencent le slug par clé étrangère -> on ne peut pas juste faire un
-- UPDATE order_statuses (le nouveau slug n'existe pas encore tant qu'on
-- n'a pas re-pointé les lignes qui l'utilisent). D'où l'ordre : insérer
-- "spam" d'abord, re-pointer tout ce qui utilisait "trash", supprimer
-- "trash" ensuite.
-- =====================================================================

do $$
begin
  if exists (select 1 from order_statuses where slug = 'trash')
     and not exists (select 1 from order_statuses where slug = 'spam') then

    insert into order_statuses (slug, title, group_name, hide_date_from_affiliates, sort_label, color)
    select 'spam', title, group_name, hide_date_from_affiliates, sort_label, color
    from order_statuses where slug = 'trash';

    update orders set status = 'spam' where status = 'trash';
    update mediabuyers_orders set status = 'spam' where status = 'trash';
    update status_history set to_status = 'spam' where to_status = 'trash';
    update status_history set from_status = 'spam' where from_status = 'trash';

    delete from order_statuses where slug = 'trash';
  end if;
end $$;
