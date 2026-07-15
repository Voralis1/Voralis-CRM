# Référence API — VORALIS CRM

Trois familles d'endpoints :

1. **API affiliés** (`/api/v1/*`, `/api/webmaster/v2/*`) — auth par **token affilié** (Bearer), exécutée avec le client *service role*.
2. **API back-office** (`/api/admin/*`, `/api/signup`) — auth par **session Supabase** (cookies), protégée par le middleware.
3. **Interne** (`/api/internal/dispatch`) — auth par **`CRON_SECRET`**.

Codes d'erreur applicatifs : `AUTH`, `VALIDATION`, `BAD_JSON`, `DUPLICATE_LEAD`, `SERVER`.

---

## 1. API affiliés

### `POST /api/v1/leads` — envoyer un lead
**Auth :** `Authorization: Bearer <token>` · **Content-Type :** `application/json`

Champs (validés par zod, `src/lib/validation.ts`) :

| Champ | Requis | Règle |
|-------|:-----:|-------|
| `first_name` | ✅ | 1–120 |
| `phone` | ✅ | 6–20, `^[+0-9\s().-]+$` |
| `country` | ✅ | 2–3 lettres, `^[A-Za-z]{2,3}$`, mis en majuscules |
| `quantity` | ✅ | entier 1–99 |
| `affiliate` | ✅ | 1–255 (sous-affilié / tracking) |
| `product_id` | ✅* | 1–200 (ID catalogue, prioritaire sur `product_name`) |
| `product_name` | ✅* | 1–200 (nom exact, insensible à la casse) |
| `last_name` | ⬜ | ≤ 120 |
| `address` | ⬜ | ≤ 300 |
| `city` | ⬜ | ≤ 120 |
| `ip` | ⬜ | ≤ 60 |
| `user_agent` | ⬜ | ≤ 400 |
| `sub1`, `sub2`, `sub3`, `sub4`, `sub5` | ⬜ | ≤ 255 |
| `comment` | ⬜ | ≤ 1000 |

\* Au moins un des deux (`superRefine` dans `validation.ts`) : `product_id` ou `product_name` requis, sinon `400 VALIDATION` (`details.product_id`).

**201**
```json
{ "success": true, "lead_id": "000123", "status": "new", "message": "Lead reçu avec succès" }
```

**Erreurs**
| HTTP | error_code | Cas |
|------|------------|-----|
| 401 | `AUTH` | token manquant/mal formé/inconnu |
| 403 | `AUTH` | compte affilié suspendu |
| 400 | `BAD_JSON` | corps JSON invalide |
| 400 | `VALIDATION` | champs invalides (`details` fourni) |
| 409 | `DUPLICATE_LEAD` | doublon (même téléphone < 30 j) — `message` contient le `public_id` existant |
| 500 | `SERVER` | échec de création |

> `country` n'est pas restreint à une liste : n'importe quel code ISO 3166-1 alpha-2/alpha-3 est accepté. `src/lib/currency.ts` résout la devise pour la quasi-totalité des pays du monde (couverture ISO 4217 complète, avec un mapping historique prioritaire pour les marchés Voralis : `SN, CI, ML, BF, TG` → XOF, `GAB, BZV` → XAF, `GN` → GNF, `AGO` → AOA, `NG` → NGN). Un pays totalement inconnu du mapping renvoie une devise vide (aucune erreur).

---

### `GET /api/v1/leads/{lead_id}` — consulter un statut
**Auth :** Bearer. `{lead_id}` = `public_id`.

**200**
```json
{
  "public_id": "000123", "product_id": "218022", "product": "PERDA DE PESO",
  "status": "confirmed", "status_label": "Confirmé",
  "country": "AO", "created_at": "…", "updated_at": "…",
  "affiliate": "fb_camp_123", "sub1": "…", "sub2": "…", "sub3": "…", "sub4": "…", "sub5": "…",
  "payout_amount": 5.50, "payout_currency": "USD"
}
```
**404** `{ "success": false, "message": "Lead introuvable" }` · **401** si token absent.

---

### `GET /api/v1/leads?ids=...` — consulter plusieurs statuts d'un coup
**Auth :** Bearer. `ids` = liste de `public_id` séparés par des virgules (déduplication + `trim()` côté serveur), max **100** par appel.

`GET /api/v1/leads?ids=000035,000038,000041`

**200**
```json
{
  "success": true,
  "leads": [
    { "public_id": "000035", "status": "spam", "status_label": "Spam", "...": "..." },
    { "public_id": "000038", "status": "confirmed", "status_label": "Confirmé", "...": "..." }
  ],
  "not_found": ["000041"]
}
```
Mêmes champs que l'endpoint unitaire pour chaque élément de `leads` (`product_id`, `product`, `country`, `created_at`, `updated_at`, `affiliate`, `sub1`…`sub5`, `payout_amount`, `payout_currency`). `not_found` regroupe les IDs demandés introuvables **ou** n'appartenant pas à l'affilié (même traitement dans les deux cas, pour ne rien révéler sur l'existence d'un lead d'un tiers) — le filtre `affiliate_id` est appliqué directement dans la requête SQL, pas en post-traitement.

**Erreurs**
| HTTP | error_code | Cas |
|------|------------|-----|
| 401 | `AUTH` | token manquant/mal formé/inconnu |
| 400 | `VALIDATION` | `ids` manquant/vide, ou plus de 100 IDs demandés |

---

### Catalogue produits
Pas d'endpoint public. Le catalogue complet (`id`, `name`, `country`, `price`, `payout`) est téléchargeable en JSON/CSV depuis le panneau affilié, page **Produits**. Utiliser l'`id` en `product_id` pour un match fiable, ou le nom exact en `product_name`.

---

### `POST /api/webmaster/v2/addOrder` — compatibilité LeadVertex
**Auth :** `?token=<token>` **ou** Bearer · **Content-Type :** `x-www-form-urlencoded` ou `application/json`.

Même flux interne que `/api/v1/leads`, avec mapping des champs LeadVertex :

| LeadVertex | → Voralis |
|------------|-----------|
| `fio` | `first_name` + `last_name` (split au 1er espace) |
| `phone`, `address`, `city`, `country`, `ip` | identiques |
| `product` / `goods[0][title]` | `product_name` (un des deux `product_*` requis) |
| `goods[0][quantity]` | `quantity` |
| `goodID` / `goods[0][goodID]` | `product_id` (un des deux `product_*` requis) |
| `externalWebmaster` | `affiliate` |
| `utm_source` / `utm_term` / `utm_campaign` / `utm_medium` / `utm_content` | `sub1` / `sub2` / `sub3` / `sub4` / `sub5` |
| `domain`, `additional14`, `additional15` | regroupés dans `comment` |

**201**
```json
{ "status": "success", "orderID": "000123", "lead_id": "000123", "lead_status": "new", "message": "Lead reçu avec succès" }
```
Erreurs : mêmes `error_code`, format `{ "status": "error", "error_code": "…", "message": "…", "details": {…} }`.

| Aspect | `/api/v1/leads` | `/api/webmaster/v2/addOrder` |
|--------|-----------------|------------------------------|
| Auth | Bearer | `?token=` ou Bearer |
| Corps | JSON | form-urlencoded ou JSON |
| Nom | `first_name`+`last_name` | `fio` (auto-split) |
| Sous-affilié | `affiliate` | `externalWebmaster` |
| Réponse | native Voralis | compatible LeadVertex (`orderID`) |

---

## 2. Flux d'intake (logique partagée)

En amont, `leadSchema.safeParse` (`src/lib/validation.ts`) valide le payload — via `superRefine`, `product_id` **ou** `product_name` doit être fourni (au moins un des deux), sinon `400 VALIDATION` avant même d'appeler `ingestLead`.

`src/lib/leads.ts` → `ingestLead(affiliateId, lead)` :

1. **Déduplication** : recherche par `phone` sur `orders` (hors `trash`) sur **30 jours** glissants → `DUPLICATE_LEAD` (409) si trouvé.
2. **Résolution produit** : lookup exact par `product_id` (fallback `product_name` par `ilike` sinon). Si trouvé dans `project_products` → `product_id`/nom canonique + `price` posé comme `payout_amount` (USD). Sans correspondance, la valeur reçue est conservée en texte libre dans `product` et `product_id` reste `null` (contrainte FK).
3. **Insertion** : `public_id` via `nextOrderPublicId()` (6 chiffres, retry 4×), statut initial `new`.
4. **Historique** : ligne `status_history` (`from=null`, `to=new`, note « Lead reçu via API »).
5. **Sous-affilié** : upsert dans `affiliate` `(network_id, name)`.

---

## 3. Moteur de postbacks

### Mise en file (DB)
À chaque update de `orders.status`, le trigger `trg_orders_status` (`on_order_status_change()`) insère une ligne `postbacks` (`state=pending`, `attempts=0`, `max_attempts=4`) **si** l'affilié a une `postback_url` non vide.

### Dispatch — `src/lib/postback.ts` → `dispatchPending(limit)`
1. Récupère les postbacks `pending`/`failed` triés par `created_at`, dans la limite.
2. Si `attempts >= max_attempts` → marque `failed` et passe.
3. Charge la commande + l'`affiliate_network` ; si manquants ou pas d'URL → `failed`.
4. Construit les **macros** (`buildVars`) et résout l'URL/payload.
5. Envoie la requête (timeout **10 s**) :
   - **GET** : URL avec macros substituées (valeurs URL-encodées).
   - **POST** : corps JSON des variables + en-tête `X-Voralis-Signature` = **HMAC-SHA256(corps, signature_secret)**.
6. Met à jour `url`, `payload`, `attempts++`, `http_status`, `response_body` (tronqué 500 c.), `last_attempt_at`.
   - `2xx` → `sent` · sinon `failed` quand `attempts >= max_attempts`, sinon reste `pending`.

### Déclenchement
- **Inline best-effort** : `changeStatus()` / `bulkChangeStatus()` appellent `dispatchPending()` juste après l'update → livraison quasi-immédiate.
- **Cron de rattrapage** : `GET|POST /api/internal/dispatch` (auth `CRON_SECRET`). `vercel.json` le planifie quotidiennement (`0 3 * * *`) ; ajustable.

**Macros disponibles**

| Macro | Valeur |
|-------|--------|
| `{lead_id}` | `public_id` |
| `{status}` / `{status_label}` | statut |
| `{product_id}` | produit |
| `{country}` | pays |
| `{payout}` | `payout_amount` (ou `0`) |
| `{currency}` | `payout_currency` / devise produit / `USD` |
| `{quantity}` | quantité (ou `1`) |
| `{comment}` | commentaire |
| `{affiliate}` | sous-affilié |
| `{sub1}` `{sub2}` `{sub3}` `{sub4}` `{sub5}` | tracking |
| `{timestamp}` | ISO 8601 |

### `GET|POST /api/internal/dispatch`
**Auth :** `x-cron-secret`, `?secret=`, ou `Authorization: Bearer` (= `CRON_SECRET`).
```json
{ "ok": true, "processed": 25, "sent": 20, "failed": 5 }
```
**401** `{ "error": "unauthorized" }`.

---

## 4. API back-office (session Supabase)

> Protégées par le middleware (`/admin` requiert une session) et la vérification de rôle admin dans les layouts/routes.

### Projets & produits
| Méthode & route | Effet |
|-----------------|-------|
| `GET /api/admin/projects` | liste des projets (`{ projects: [...] }`) |
| `POST /api/admin/projects` | crée un projet (`id`, `name`, `createdAt`, `expiresAt`, `productCount?`) |
| `GET /api/admin/projects/{projectId}` | projet + ses produits |
| `DELETE /api/admin/projects/{projectId}` | supprime le projet (cascade produits) |
| `POST /api/admin/projects/{projectId}/products` | ajoute un produit (`id`,`name`,`price` requis ; `category`,`country`,`dailyCapacity`,`payout`,`status`,`workingHours`,`additionalInfo`…) |
| `PUT /api/admin/projects/{projectId}/products/{productId}` | modifie un produit |
| `DELETE /api/admin/projects/{projectId}/products/{productId}` | supprime un produit |

### Statuts personnalisés
| Méthode & route | Effet |
|-----------------|-------|
| `GET /api/admin/statuses` | liste (`{ statuses: [...] }`) |
| `POST /api/admin/statuses` | crée (`id`,`title`,`group` requis ; `hideDateFromAffiliates`,`sortLabel`) |
| `PUT /api/admin/statuses/{id}` | modifie |
| `DELETE /api/admin/statuses/{id}` | supprime |

### Statistiques
`GET /api/admin/statistics` (admin) — paramètres : `page` (1), `pageSize` (50, max 200), `sortBy` (`totalOrders`), `sortDir` (`asc`/`desc`), `groupBy` (`none`/`product`/`price`/`affiliateNetwork`/`affiliate`), `filters` (JSON, ex. `{"totalOrders":">100"}`).
Réponse : `{ rows: [...], total, page, pageSize }` avec compteurs/taux par statut.

---

## 5. Création de compte

`POST /api/signup` — **public**. Corps : `email`, `password`, `name`, `role?` (`affiliate` défaut, ou `media_buyer`).
- Crée l'utilisateur Supabase (email confirmé).
- `affiliate` → génère un `api_token` (`generateApiToken()` : `vrl_live_` + hex) et crée l'`affiliate_network`.
- `media_buyer` → met `profiles.role = media_buyer`.

**200** `{ "ok": true, "role": "affiliate" }` · **400** `{ "message": "Email already registered" }`.

---

## 6. Authentification — récapitulatif

| Endpoint(s) | Méthode d'auth |
|-------------|----------------|
| `/api/v1/*` | `Authorization: Bearer <api_token>` (`affiliate_network.api_token`, statut `active`) |
| `/api/webmaster/v2/addOrder` | `?token=` ou Bearer |
| `/api/admin/*` | session Supabase (cookies) + rôle `admin` |
| `/api/internal/dispatch` | `CRON_SECRET` (`x-cron-secret` / `?secret=` / Bearer) |
| `/api/signup` | aucune (public) |

`src/lib/api-auth.ts` : `authenticateAffiliate(req)` extrait le Bearer puis `authenticateToken()` valide contre `affiliate_network` (401 si invalide, 403 si suspendu).
`src/middleware.ts` protège `/admin/*` et `/panel/*` (redirige vers `/login?next=…` sans session).
