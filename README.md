# VORALIS CRM

CRM interne de gestion des leads affiliés COD — remplaçant de LeadVertex.
**Stack :** Next.js 14 (App Router, TypeScript) · Supabase (PostgreSQL + Auth + RLS) · Tailwind CSS.

Ce CRM est aussi la **source de vérité unique** qui alimente le dashboard CEO :
la table `orders` est le pivot de bout en bout (acquisition → confirmation → livraison → cash).

---

## Architecture

```
Affilié ──POST /api/v1/leads──▶  CRM (Supabase orders)
                                  │  Centre d'appel (back-office) change le statut
                                  ▼
                          trigger Postgres ──▶ file `postbacks`
                                  │
            cron /api/internal/dispatch (1 min) ──postback──▶ tracker affilié
```

- **API publique** (`/api/v1/*`) : auth par token affilié (Bearer), client SERVICE ROLE.
- **Panel & back-office** : Supabase Auth + **RLS** (chacun ne voit que ce qu'il doit voir).
- **Moteur de postbacks** : trigger qui enfile + dispatcher avec retry (4 tentatives) + signature HMAC.

| Rôle        | Accès |
|-------------|-------|
| `affiliate` | son panel : ses leads, ses stats, son token, son URL de postback |
| `agent`     | back-office : traitement des leads (changement de statut) |
| `admin`     | tout : offres, affiliés, attribution des rôles |

---

## Installation

### 1. Créer le projet Supabase
1. Sur [supabase.com](https://supabase.com) → nouveau projet.
2. **SQL Editor** → coller et exécuter `supabase/schema.sql`.
3. Puis exécuter `supabase/seed.sql` (offres + affilié de démo ; à adapter).

### 2. Variables d'environnement
Copier `.env.example` → `.env.local` et renseigner (Project Settings > API) :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # secret — serveur uniquement
CRON_SECRET=<chaîne_aléatoire_longue>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Lancer en local
```bash
npm install
npm run dev
# http://localhost:3000
```

### 4. Devenir admin
1. S'inscrire sur `/signup` avec ton email.
2. Dans Supabase SQL Editor :
   ```sql
   select id, email from auth.users;          -- récupérer ton UUID
   update profiles set role = 'admin' where id = '<TON_UUID>';
   ```
3. Pour un agent centre d'appel : `role = 'agent'` (ou via l'écran Admin > Affiliés).

---

## API affiliés (référence rapide)

### Envoyer un lead
```bash
curl -X POST https://<app>/api/v1/leads \
  -H "Authorization: Bearer <TOKEN_AFFILIE>" \
  -H "Content-Type: application/json" \
  -d '{"offer_id":"AO-LUMORA-001","first_name":"Joao","phone":"+244923000000",
       "country":"AO","sub1":"fb_camp_123"}'
# 201 → { "success": true, "lead_id": "VL-2026-000123", "status": "new" }
```

### Consulter un statut
```bash
curl https://<app>/api/v1/leads/VL-2026-000123 -H "Authorization: Bearer <TOKEN>"
```

### Lister les offres
```bash
curl https://<app>/api/v1/offers -H "Authorization: Bearer <TOKEN>"
```

### Postbacks (remontée des statuts)
L'affilié configure son URL dans le panel (`/panel/settings`) avec macros :

```
https://tracker.com/postback?clickid={sub1}&status={status}&payout={payout}&leadid={lead_id}
```

Macros : `{lead_id} {status} {payout} {currency} {offer_id} {country} {quantity} {comment} {sub1}…{sub5} {timestamp}`.
En POST, le corps JSON est signé : en-tête `X-Voralis-Signature` (HMAC-SHA256, secret affilié).

**Statuts :** `new, duplicate, trash, processing, no_answer, callback, confirmed, rejected, shipped, in_delivery, delivered, returned, cancelled`.
Le payout est posé automatiquement au statut facturable de l'offre (`confirmed` ou `delivered`).

---

## Déploiement (Vercel)

1. Pousser le repo, importer sur Vercel.
2. Renseigner les mêmes variables d'env (dont `CRON_SECRET`).
3. `vercel.json` déclare déjà le cron du dispatcher (toutes les minutes).
   Vercel Cron envoie `Authorization: Bearer $CRON_SECRET` — pris en charge par la route.

> Alternative sans Vercel Cron : appeler `POST /api/internal/dispatch` avec l'en-tête
> `x-cron-secret: <CRON_SECRET>` depuis n8n (Schedule node) ou pg_cron + pg_net.

---

## Migration depuis LeadVertex

1. Exporter l'historique LeadVertex (Excel) → importer dans `orders` (script ponctuel).
2. Faire tourner les deux systèmes **en parallèle** 2–3 semaines.
3. Basculer les affiliés un par un : leur fournir leur nouveau token + URL de postback.
4. Couper LeadVertex une fois les volumes stables côté CRM interne.

---

## Sécurité

- `SUPABASE_SERVICE_ROLE_KEY` : serveur uniquement, jamais exposée au client.
- RLS active sur toutes les tables métier ; l'API publique authentifie par token.
- Tokens régénérables depuis le panel ; affiliés suspendables (statut `paused`).
- Postbacks signés (HMAC) et journalisés (`postbacks.response_body`, `http_status`).

---

## Ce qui est inclus / à étendre

**Inclus (fonctionnel) :** schéma + RLS + triggers, API intake/statut/offres, moteur de
postbacks avec retry & signature, auth, panel webmaster (dashboard, leads, token, postback),
back-office centre d'appel (traitement + transitions de statut), admin offres & affiliés.

**À étendre selon besoin :** rate-limiting middleware sur l'API publique, import historique
LeadVertex, pagination/recherche avancée, mobile money pour la réconciliation cash,
tests automatisés, intégration directe avec le dashboard CEO (mêmes tables Supabase).

---

## Structure
```
supabase/schema.sql        schéma complet (tables, enums, RLS, triggers)
supabase/seed.sql          offres + affilié de démo
src/lib/                   clients Supabase, auth, validation, postback engine, types
src/app/api/v1/            API affiliés (leads, offers)
src/app/api/internal/      dispatcher de postbacks (cron)
src/app/panel/             espace webmaster
src/app/admin/             back-office centre d'appel + admin
```
