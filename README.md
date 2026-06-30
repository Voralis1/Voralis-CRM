# VORALIS CRM

CRM interne de gestion des leads affiliés **COD** (Cash On Delivery) — remplaçant de LeadVertex.
C'est la **source de vérité unique** du parcours d'un lead : acquisition → centre d'appel → logistique → cash.

**Stack :** Next.js 14 (App Router, TypeScript) · Supabase (PostgreSQL + Auth + RLS) · Tailwind CSS · déployable sur Vercel.

---

## Sommaire de la documentation

| Document | Contenu |
|----------|---------|
| **README.md** (ce fichier) | Vue d'ensemble, installation, déploiement, sécurité, structure du repo |
| [`docs/data-model.md`](docs/data-model.md) | Modèle de données complet : tables, enums, RLS, triggers, cycle de vie des statuts |
| [`docs/api-reference.md`](docs/api-reference.md) | Référence API complète (affiliés, admin, cron) + moteur de postbacks |
| [`docs/features-and-roles.md`](docs/features-and-roles.md) | Rôles, droits d'accès et description de chaque écran par espace |
| [`docs/API_AFFILIES.md`](docs/API_AFFILIES.md) · [`docs/affiliate-api.md`](docs/affiliate-api.md) | Guides d'intégration destinés aux affiliés (partenaires) |
| [`docs/postman_affiliates_collection.json`](docs/postman_affiliates_collection.json) | Collection Postman pour tester l'API affiliés |

---

## Vue d'ensemble

```
Affilié ──POST /api/v1/leads──▶  CRM (table « orders » dans Supabase)
                                  │
                                  │  Centre d'appel / Admin change le statut
                                  ▼
                    trigger Postgres ──▶ file d'attente « postbacks »
                                  │
        dispatcher (inline + cron) ──postback HTTP──▶ tracker de l'affilié
```

Le CRM couvre **trois métiers**, chacun avec son espace et son rôle :

| Espace | Rôle | Sert à |
|--------|------|--------|
| **Back-office** (`/admin`) | `admin` | Traiter les leads, gérer offres/produits/affiliés/statuts, suivre payout & statistiques |
| **Panel affilié** (`/panel`) | `affiliate` | Envoyer des leads via API, suivre leurs statuts, configurer postback & token |
| **Media buying** (`/media-buying`) | `media_buyer` | Saisir des commandes, enregistrer les dépenses pub, calculer le ROI |

> Le rôle historique `agent` a été **supprimé** (fusionné dans `admin`). Les rôles actifs sont : `admin`, `affiliate`, `media_buyer`.

Détails complets : [`docs/features-and-roles.md`](docs/features-and-roles.md).

---

## Concepts clés

- **Lead / Order** : un prospect COD. Table pivot `orders`, identifié par un `public_id` numérique séquentiel (`000001`, `000002`, …). 13 statuts répartis en 3 groupes (Réception, Centre d'appel, Logistique).
- **Affiliate network** : compte partenaire (webmaster) qui envoie des leads. Détient un `api_token` (`vrl_live_…`), une URL de postback et un secret de signature. Un **affiliate** est un sous-affilié rattaché à un network (tracking).
- **Offer / Product** : une offre (`offers`) ou un produit de catalogue (`projects` → `project_products`) porte le pays, le prix et le **payout**. Le payout est posé au statut facturable (`confirmed` ou `delivered` selon `payout_model`).
- **Postback** : à chaque changement de statut, un trigger Postgres enfile une notification ; le dispatcher la livre au tracker de l'affilié (GET avec macros, ou POST JSON signé HMAC), avec retry.
- **Media buying** : commandes (`mediabuyers_orders`) et dépenses publicitaires (`media_spend`) reliées par `campaign` + `country` pour le calcul du coût par lead/confirmé/livré.

Détails complets : [`docs/data-model.md`](docs/data-model.md).

---

## Installation

### 1. Créer le projet Supabase
1. Sur [supabase.com](https://supabase.com) → nouveau projet.
2. **SQL Editor** → exécuter `supabase/schema.sql` (schéma de base : tables, enums, RLS, triggers).
3. Exécuter les migrations/extensions dans l'ordre logique (modèle affilié, projets/produits, statuts, media buyer) :
   ```
   supabase/create_affiliate_model.sql
   supabase/create_project_tables.sql
   supabase/create_status_table.sql
   supabase/create_mediabuyers_orders.sql
   supabase/create_media_spend.sql
   supabase/migrate_*.sql          # numeric_public_id, country_text, optional_offer, payout_paid, product_columns, roles
   supabase/fix_affiliate_rls.sql
   supabase/drop_old_affiliate_fk.sql
   ```
   > `supabase/run_mediabuyer_migrations.sql` regroupe les migrations media buyer. `supabase/seed.sql` insère des offres + un affilié de démo (à adapter).

### 2. Variables d'environnement
Créer un fichier `.env` (ou `.env.local`) — clés disponibles dans Supabase → *Project Settings > API* :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # SECRET — serveur uniquement, jamais exposé au client
CRON_SECRET=<chaîne_aléatoire_longue>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Lancer en local
```bash
npm install
npm run dev          # http://localhost:3000
```

### 4. Créer le premier admin
1. S'inscrire sur `/signup` (compte affilié ou media buyer par défaut).
2. Promouvoir le compte en admin avec le script fourni :
   ```bash
   node promote-admin.js <ton_email>
   ```
   (Le script lit `.env`, trouve l'utilisateur et passe `profiles.role = 'admin'`.)
   Alternative SQL :
   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = '<ton_email>');
   ```

---

## Déploiement (Vercel)

1. Importer le repo sur Vercel.
2. Renseigner les mêmes variables d'environnement (dont `CRON_SECRET`).
3. `vercel.json` déclare un **cron quotidien** qui relance le dispatcher de postbacks :
   ```json
   { "crons": [ { "path": "/api/internal/dispatch", "schedule": "0 3 * * *" } ] }
   ```
   Vercel Cron appelle la route avec `Authorization: Bearer $CRON_SECRET`.

> **Note importante sur les postbacks :** ils partent **immédiatement** après un changement de statut (dispatch *inline best-effort* déclenché par le code). Le cron quotidien n'est qu'un **filet de sécurité** qui réessaie les postbacks en attente ou en échec. Pour un rattrapage plus fréquent, change le `schedule` (ex. `* * * * *` pour chaque minute) ou appelle `POST /api/internal/dispatch` avec l'en-tête `x-cron-secret: <CRON_SECRET>` depuis n8n / pg_cron + pg_net.

---

## API affiliés — démarrage rapide

Référence complète : [`docs/api-reference.md`](docs/api-reference.md).

### Envoyer un lead
```bash
curl -X POST https://<app>/api/v1/leads \
  -H "Authorization: Bearer <TOKEN_AFFILIE>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name":"Joao","last_name":"Silva","phone":"+244923000000",
    "address":"Rua 1","city":"Luanda","country":"AO","quantity":1,
    "product":"Lumora","affiliate":"fb_camp_123"
  }'
# 201 → { "success": true, "lead_id": "000123", "status": "new", "message": "Lead reçu avec succès" }
```

### Consulter un statut
```bash
curl https://<app>/api/v1/leads/000123 -H "Authorization: Bearer <TOKEN>"
```

### Lister les offres
```bash
curl https://<app>/api/v1/offers -H "Authorization: Bearer <TOKEN>"
```

### Compatibilité LeadVertex
`POST /api/webmaster/v2/addOrder` accepte le format LeadVertex (`fio`, `externalWebmaster`, `goods[0][quantity]`…) en `x-www-form-urlencoded` ou JSON, token en `?token=` ou Bearer. Voir la référence API.

---

## Sécurité

- `SUPABASE_SERVICE_ROLE_KEY` : serveur uniquement. L'API publique authentifie par token affilié et utilise le client *service role* (qui contourne la RLS) côté serveur.
- **RLS active** sur toutes les tables métier : un affilié ne voit que ses leads, un media buyer que ses commandes/dépenses, l'admin voit tout.
- Tokens régénérables depuis le back-office ; affiliés suspendables (statut `paused`/`banned` → API refusée en 403).
- Postbacks **POST** signés en **HMAC-SHA256** (en-tête `X-Voralis-Signature`, secret par affilié) et journalisés (`postbacks.http_status`, `response_body`, `attempts`).
- Routes `/admin/*` et `/panel/*` protégées par middleware + vérification de rôle dans chaque layout.

---

## Structure du repo

```
src/app/
  api/v1/                 API affiliés (leads, leads/[id], offers)
  api/webmaster/v2/       endpoint compatibilité LeadVertex (addOrder)
  api/internal/dispatch   dispatcher de postbacks (cron + best-effort)
  api/admin/              API back-office (projects, products, statuses, statistics)
  api/signup              création de compte (affiliate / media_buyer)
  admin/                  back-office (dashboard, orders, products, affiliés, statuts, payout, stats…)
  panel/                  espace affilié (dashboard, leads, produits, API/postback, compte)
  media-buying/           espace media buyer (dashboard, commandes, dépenses, résultats)
  login/ · signup/        authentification

src/components/           Shell (sidebar/topbar), KpiCard, PeriodFilter, HeroBanner, icônes…
src/lib/                  clients Supabase, auth, validation (zod), moteur de postback, currency, types
src/i18n/                 internationalisation FR (défaut) / EN
src/middleware.ts         protection des routes /admin et /panel

supabase/                 schéma SQL, migrations, seed
docs/                     documentation détaillée (voir sommaire ci-dessus)
promote-admin.js          script : promouvoir un utilisateur en admin
```

---

## État du projet

**Fonctionnel :** schéma + RLS + triggers, API d'intake (v1 + compat LeadVertex), consultation de statut, offres, moteur de postbacks (retry + signature HMAC), auth multi-rôles, back-office complet (traitement des leads, offres, projets/produits, affiliés, statuts personnalisés, payout, statistiques, mise à jour en masse), panel affilié (leads, catalogue, API/postback, compte), espace media buying (commandes, dépenses, ROI), i18n FR/EN, refonte UI « Tableau de bord CEO ».

**À étendre selon besoin :** rate-limiting sur l'API publique, import historique LeadVertex, filtrage par période réellement branché sur les requêtes du dashboard, réconciliation mobile money, tests automatisés.
