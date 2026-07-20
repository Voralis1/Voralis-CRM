-- =====================================================================
-- Postback dès la création du lead (statut "new").
--
-- Contexte : trg_orders_status ne se déclenche qu'au CHANGEMENT de statut
-- (after update of status), jamais à la création -> aucun affilié n'a
-- jamais reçu de postback pour le statut initial "new". Ce script fait
-- aussi déclencher l'enfilage du postback à l'INSERT, sans dupliquer
-- status_history (déjà rempli par l'application à la création, voir
-- ingestLead() dans src/lib/leads.ts).
--
-- À exécuter une fois dans le SQL editor Supabase. Remplace intégralement
-- la fonction et le trigger définis dans schema.sql.
-- =====================================================================

create or replace function on_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare aff affiliate_network%rowtype;
begin
  -- Historique : uniquement sur un vrai changement de statut (UPDATE).
  -- La création a déjà son entrée "new" posée par l'application.
  if TG_OP = 'UPDATE' and new.status is distinct from old.status then
    insert into status_history(order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, new.assigned_agent);
  end if;

  -- Postback : à la création (statut initial) ET à chaque changement
  -- de statut ultérieur.
  if TG_OP = 'INSERT' or (TG_OP = 'UPDATE' and new.status is distinct from old.status) then
    select * into aff from affiliate_network where id = new.affiliate_id;
    if aff.postback_url is not null and length(trim(aff.postback_url)) > 0 then
      insert into postbacks(order_id, affiliate_id, status, method)
      values (new.id, new.affiliate_id, new.status, coalesce(aff.postback_method,'GET'));
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_status on orders;
create trigger trg_orders_status after insert or update of status on orders
  for each row execute function on_order_status_change();
