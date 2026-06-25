-- ---------------------------------------------------------------------------
-- Correctif RLS : isolation des leads par affilié après le passage à
-- `affiliate_network`. Le helper pointait encore sur l'ancienne table
-- `affiliates`, ce qui empêchait tout NOUVEL affilié de voir ses propres leads.
-- À exécuter dans Supabase : SQL Editor -> coller -> Run.
-- ---------------------------------------------------------------------------
create or replace function my_affiliate_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from affiliate_network where auth_user_id = auth.uid()
$$;
