-- =====================================================================
-- VORALIS CRM — Données de démarrage (seed)
-- Exécuter APRÈS schema.sql. Ajuste les valeurs à ton catalogue réel.
-- =====================================================================

-- Offres exemple (un SKU par marché)
insert into offers (id, name, product, country, payout, currency, payout_model, status) values
  ('AO-LUMORA-001', 'Lumora — Angola',        'Lumora',  'AO', 6.00, 'USD', 'delivered', 'active'),
  ('ML-MARUKAYA-001','Marukaya — Mali',        'Marukaya','ML', 5.50, 'USD', 'delivered', 'active'),
  ('SN-LUMORA-001', 'Lumora — Sénégal',        'Lumora',  'SN', 5.50, 'USD', 'delivered', 'active'),
  ('GN-LUMORA-001', 'Lumora — Guinée',         'Lumora',  'GN', 6.00, 'USD', 'confirmed', 'active')
on conflict (id) do nothing;

-- Affilié de démonstration (token de test — à régénérer en prod).
-- Le postback_url est un exemple : remplace par celui du webmaster.
insert into affiliates (name, email, api_token, postback_url, postback_method, status) values
  ('Webmaster Démo', 'demo@partner.com',
   'vrl_live_demo_0000000000000000000000000000',
   'https://tracker-demo.com/postback?clickid={sub1}&status={status}&payout={payout}&leadid={lead_id}',
   'GET', 'active')
on conflict (api_token) do nothing;

-- -------------------------------------------------------------------
-- DEVENIR ADMIN :
-- 1) Inscris-toi via /signup avec ton email.
-- 2) Récupère ton user id : select id, email from auth.users;
-- 3) Promeus-toi :
--    update profiles set role = 'admin' where id = '<TON_UUID>';
-- Pour un agent centre d'appel : role = 'agent'.
-- -------------------------------------------------------------------
