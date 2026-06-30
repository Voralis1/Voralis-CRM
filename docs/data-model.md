# Modèle de données — VORALIS CRM

Base **PostgreSQL** gérée par Supabase. Toutes les tables métier ont la **RLS activée**.
Source : `supabase/schema.sql` + migrations (`supabase/*.sql`) et `src/lib/types.ts` pour le cycle de vie des statuts.

---

## 1. Types énumérés (enums)

| Enum | Valeurs | Usage |
|------|---------|-------|
| `user_role` | `admin`, `affiliate`, `media_buyer` | Rôle d'un profil. *(L'ancien `agent` a été migré vers `admin`.)* |
| `payout_model` | `confirmed`, `delivered` | Statut qui déclenche la facturation du payout d'une offre |
| `order_status` | `new`, `duplicate`, `trash`, `processing`, `no_answer`, `callback`, `confirmed`, `rejected`, `shipped`, `in_delivery`, `delivered`, `returned`, `cancelled` | Statut d'un lead (13 valeurs) |
| `postback_state` | `pending`, `sent`, `failed` | État de livraison d'un postback |

---

## 2. Tables principales

### `profiles` — comptes (liés à `auth.users`)
| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid PK | = `auth.users.id` (cascade) |
| `role` | `user_role` | défaut `affiliate` |
| `full_name` | text | |
| `created_at` | timestamptz | |

Créé automatiquement à l'inscription via le trigger `handle_new_user` (function `on_auth_user_created`).

### `affiliate_network` — comptes partenaires (modèle actuel)
| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid PK | |
| `auth_user_id` | uuid | → `profiles.id` (set null), **unique** |
| `name`, `email` | text | |
| `api_token` | text **unique** | format `vrl_live_…`, indexé |
| `postback_url` | text | gabarit avec macros |
| `postback_method` | text | `GET` (défaut) ou `POST` |
| `signature_secret` | text | secret HMAC (POST) |
| `status` | text | `active` / `paused` / `banned` |
| `created_at` | timestamptz | |

### `affiliate` — sous-affiliés rattachés à un network
| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid PK | |
| `name` | text | identifiant de tracking |
| `network_id` | uuid | → `affiliate_network.id` (cascade) |
| | | **unique** `(network_id, name)` |

> Une table héritée `affiliates` (singulier→pluriel) existe encore pour compatibilité ; le modèle courant est `affiliate_network` + `affiliate`. `drop_old_affiliate_fk.sql` finalise la transition de la FK de `orders`.

### `offers` — offres
| Colonne | Type | Notes |
|---------|------|-------|
| `id` | text PK | ex. `AO-LUMORA-001` |
| `name`, `product` | text | |
| `country` | char(2) | ISO2 |
| `payout` | numeric(10,2) | commission |
| `currency` | char(3) | défaut `USD` |
| `payout_model` | `payout_model` | `confirmed` / `delivered` |
| `status` | text | `active` / `paused` |

### `orders` — leads (table pivot)
| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid PK | UUID interne |
| `public_id` | text **unique** | numérique séquentiel `000001`… |
| `affiliate_id` | uuid | → `affiliate_network.id` (restrict) |
| `offer_id` | text **nullable** | → `offers.id` (optionnel depuis migration) |
| `product` | text | nom/SKU libre |
| `first_name` | text | requis |
| `last_name` | text | |
| `phone` | text | requis, indexé |
| `country` | text **nullable** | 2–3 lettres (était char(2)) |
| `address`, `city` | text | |
| `quantity` | int | défaut 1 |
| `ip`, `user_agent` | text | |
| `affiliate` | text | sous-affilié (ex-`sub2`) |
| `sub3`, `sub4`, `sub5` | text | tracking |
| `comment` | text | notes internes |
| `status` | `order_status` | défaut `new` |
| `assigned_agent` | uuid | → `profiles.id` (set null) |
| `payout_amount` | numeric(10,2) **nullable** | posé au statut facturable |
| `payout_currency` | char(3) **nullable** | |
| `paid_at` | timestamptz **nullable** | date de paiement à l'affilié |
| `created_at` / `updated_at` | timestamptz | `updated_at` via trigger |
| `confirmed_at` / `delivered_at` | timestamptz | |

Index : `affiliate_id`, `status`, `phone`, `created_at DESC`, `paid_at`.

### `status_history` — audit des changements de statut
`id` (bigint identity) · `order_id` → `orders` (cascade) · `from_status` / `to_status` (`order_status`) · `changed_by` → `profiles` (set null) · `note` · `created_at`. Alimentée par le trigger de changement de statut **et** à la création du lead (`note = "Lead reçu via API"`).

### `postbacks` — file d'attente des notifications
`id` (bigint identity) · `order_id` → `orders` (cascade) · `affiliate_id` → `affiliate_network` (cascade) · `status` · `method` (défaut `GET`) · `url` · `payload` (jsonb) · `attempts` (défaut 0) · `max_attempts` (défaut **4**) · `http_status` · `response_body` · `state` (`pending`/`sent`/`failed`) · `last_attempt_at` · `created_at`. Index sur `(state, attempts)` pour le polling du dispatcher.

---

## 3. Tables media buying

### `mediabuyers_orders` — commandes saisies par les media buyers
`id` (uuid PK) · `public_id` (text unique, séquence `mb_order_seq`) · `media_buyer_id` → `profiles` (set null) · `product` · `country` · `first_name` (requis) · `last_name` · `phone` (requis) · `address` · `city` · `quantity` · **`campaign`** · `status` (`order_status`, défaut `new`) · `payout_amount` / `payout_currency` · `comment` · `paid_at` · `created_at` / `updated_at`.

### `media_spend` — dépenses publicitaires
`id` (uuid PK) · `media_buyer_id` → `profiles` (set null) · `date` (défaut `current_date`) · `buyer_name` · `country` · **`campaign`** (requis) · `amount_usd` (numeric(12,2)) · `note` · `created_at`. Index sur `(campaign, country)` pour relier dépenses ↔ commandes et calculer le coût par lead/confirmé/livré.

---

## 4. Tables catalogue & configuration

### `projects` — portefeuilles de produits
`id` (text PK) · `name` · `created_at` (date) · `expires_at` (date) · `product_count` (int).

### `project_products` — produits d'un projet
`id` (text PK) · `project_id` → `projects` (cascade) · `name` · `description` · `price` (numeric(12,2)) · `measure` · `country` · `quantity` · `category` · `daily_capacity` · `confirmation_rate` (numeric(5,2)) · `payout` (numeric(12,2)) · `status` (défaut `active`) · `working_hours`. Sert de **catalogue affilié** et alimente le calcul du payout.

### `order_statuses` — statuts personnalisés (admin)
`id` (text PK) · `title` · `group_name` · `hide_date_from_affiliates` (bool) · `sort_label` · `created_at`.

### `admin` — fiches du personnel
`id` (uuid PK) · `name` · `email` · `created_at`.

---

## 5. Cycle de vie des statuts

Défini dans `src/lib/types.ts` (`STATUS_META` pour libellés/groupes, `NEXT_STATUSES` pour les transitions).

| Statut | Libellé | Groupe |
|--------|---------|--------|
| `new` | Nouveau | Réception |
| `duplicate` | Doublon | Réception |
| `trash` | Invalide | Réception |
| `processing` | En traitement | Centre d'appel |
| `no_answer` | Injoignable | Centre d'appel |
| `callback` | Rappel programmé | Centre d'appel |
| `confirmed` | Confirmé | Centre d'appel |
| `rejected` | Annulé (client) | Centre d'appel |
| `shipped` | Expédié | Logistique |
| `in_delivery` | En livraison | Logistique |
| `delivered` | Livré | Logistique |
| `returned` | Retourné | Logistique |
| `cancelled` | Annulé | Logistique |

**Transitions autorisées (`NEXT_STATUSES`) :**

```
new          → processing, duplicate, trash
duplicate    → processing, trash
trash        → new
processing   → confirmed, no_answer, callback, rejected
no_answer    → processing, confirmed, rejected
callback     → processing, confirmed, rejected
confirmed    → shipped, cancelled
rejected     → processing
shipped      → in_delivery, returned
in_delivery  → delivered, returned
delivered    → returned
returned     → in_delivery
cancelled    → processing
```

---

## 6. Row-Level Security (RLS)

Helpers SQL : `current_role_name()` (rôle courant via `profiles`) et `my_affiliate_id()` (id du `affiliate_network` de l'utilisateur courant).

| Table | Lecture | Écriture |
|-------|---------|----------|
| `profiles` | soi-même, ou admin (tout) | — |
| `affiliate_network` | tous (authentifiés) | propriétaire (`auth_user_id`) ou admin |
| `affiliate` | tous (authentifiés) | admin |
| `offers` | tous (authentifiés) | admin |
| `orders` | ses propres leads (`affiliate_id = my_affiliate_id()`) ou admin | admin uniquement |
| `status_history` | admin ; affilié pour ses propres commandes | (trigger) |
| `postbacks` | siens (`my_affiliate_id()`) ou admin | (système) |
| `mediabuyers_orders` | siennes (`media_buyer_id`) ou admin | propriétaire / admin |
| `media_spend` | siennes (`media_buyer_id`) ou admin | propriétaire / admin |
| `projects`, `project_products` | tous (authentifiés) | admin |
| `order_statuses`, `admin` | tous (authentifiés) | admin |

> L'API publique tourne côté serveur avec le **service role** (contourne la RLS) après authentification par token.

---

## 7. Triggers & functions

| Objet | Déclencheur | Effet |
|-------|-------------|-------|
| `handle_new_user()` / `on_auth_user_created` | après insert sur `auth.users` | crée la ligne `profiles` |
| `touch_updated_at()` / `trg_orders_touch`, `trg_mb_orders_touch` | avant update | met à jour `updated_at` |
| `on_order_status_change()` / `trg_orders_status` | après update de `status` sur `orders` | 1) insère dans `status_history` ; 2) si l'affilié a une `postback_url`, enfile une ligne dans `postbacks` |
| `current_role_name()`, `my_affiliate_id()` | — | helpers RLS |
| séquences `order_seq`, `mb_order_seq` | — | génération des `public_id` numériques |

---

## 8. Génération du `public_id`

- Côté application (`src/lib/orderId.ts`, fonction `nextOrderPublicId`) : lit les `public_id` existants, extrait la partie numérique, prend `max + 1`, complète à **6 chiffres** (`000001`, `000002`, …). Réessai jusqu'à 4 fois en cas de collision (code Postgres `23505`).
- Le schéma fournit aussi un défaut basé sur la séquence `order_seq` (`lpad(nextval('order_seq')::text, 6, '0')`).

---

## 9. Mécanique du payout

1. À la **création du lead**, si le produit correspondant a un `price`, `payout_amount` est posé (en `USD`).
2. L'**admin** peut aussi fixer/ajuster `payout_amount` et `payout_currency` sur la commande.
3. Le statut facturable dépend du `payout_model` de l'offre (`confirmed` ou `delivered`).
4. L'écran **Payout** somme les commandes confirmées non payées (`paid_at IS NULL`) par affilié ; le bouton « Payé » pose `paid_at` (= soldé).
5. Dans le postback, la macro `{payout}` vaut `0` tant que `payout_amount` est nul.

---

## 10. Migrations notables (`supabase/`)

| Fichier | Changement |
|---------|------------|
| `migrate_roles.sql` | ajoute `media_buyer`, migre `agent` → `admin` |
| `migrate_numeric_public_id.sql` | `VL-AAAA-XXXXXX` → `000006` |
| `migrate_country_text.sql` | `orders.country` : `char(2)` → `text` (2–3 lettres) |
| `migrate_optional_offer.sql` | `offer_id` et `country` nullables ; ajout `orders.product` |
| `migrate_payout_paid.sql` | ajout `orders.paid_at` + index |
| `migrate_product_columns.sql` | enrichit `project_products` (category, daily_capacity, confirmation_rate, payout, status, working_hours) |
| `create_affiliate_model.sql` | nouveau modèle `admin` / `affiliate_network` / `affiliate` ; `sub2` → `affiliate` |
| `fix_affiliate_rls.sql` | `my_affiliate_id()` pointe sur `affiliate_network` |
| `drop_old_affiliate_fk.sql` | retire l'ancienne FK `orders.affiliate_id → affiliates` |
