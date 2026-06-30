# Rôles & fonctionnalités — VORALIS CRM

## 1. Rôles et accès

Trois rôles (`src/lib/auth.ts`). Le rôle historique **`agent` a été supprimé** (fusionné dans `admin`).

| Rôle | Page d'accueil (`homeForRole`) | Périmètre |
|------|-------------------------------|-----------|
| `admin` | `/admin/orders` | Tout le back-office ; peut aussi superviser l'espace media buying |
| `affiliate` | `/panel` | Son panel uniquement (ses leads, son token, son postback) |
| `media_buyer` | `/media-buying` | Ses commandes et ses dépenses |

**Protection :**
- `src/middleware.ts` exige une session sur `/admin/*` et `/panel/*` (sinon `→ /login?next=…`).
- Chaque layout vérifie le rôle : `AdminLayout` (admin only), `PanelLayout` (affiliate only), `MediaBuyingLayout` (media_buyer **ou** admin).
- La **RLS** isole les données au niveau base (voir [`data-model.md`](data-model.md) §6).

**Pages publiques :** `/` (redirige selon le rôle), `/login`, `/signup`.
À l'inscription, le type de compte (`affiliate` / `media_buyer`) est choisi et **verrouillé** ; pas d'auto-login (redirige vers `/login?registered=1`).

---

## 2. Back-office admin (`/admin`)

`/admin` redirige vers `/admin/dashboard`.

| Route | Titre | Ce qu'on y fait |
|-------|-------|-----------------|
| `/admin/dashboard` | Tableau de bord | Vue « CEO » : bannière hero, filtres de période, cartes KPI (total leads, confirmés, taux de confirmation, taux de livraison, livrés, taux d'annulation), top 3 affiliés, répartition par pays, tendance 7 jours, dernières soumissions. |
| `/admin/orders` | Commandes des affiliates | Table de tous les leads affiliés (≤ 300) : `public_id`, produit, pays, affilié, statut, payout, client (nom/tél/adresse), date. **Changement de statut** (déclenche postback). |
| `/admin/mediabuyers-orders` | Commandes des media buyers | Vue admin des commandes saisies par les media buyers : id, buyer, produit, pays, campagne, statut, payout, client, date. |
| `/admin/bulk-update` | Mise à jour | **Mise à jour en masse** : coller des `public_id` (séparés par retour ligne/virgule/point-virgule/espace) + choisir un nouveau statut. Renvoie les compteurs mis à jour / échoués / introuvables. |
| `/admin/products` | Gestion de produits | Liste des **projets** (containers). Création via modale (id, nom, dates, nombre de produits cible). |
| `/admin/products/[projectId]` | Projet : *nom* | **Produits du projet** : ajout/édition/suppression (id, nom, catégorie, pays, prix, capacité/jour, taux de confirmation %, payout $, statut, horaires, description). Export CSV. |
| `/admin/affiliates` | Affiliate network & affiliates | Gestion des networks et de leurs sous-affiliés : token (masqué), état du postback, statut. Actions : **suspendre/réactiver**, **régénérer le token**. |
| `/admin/statuses` | Gestion des status | **Statuts personnalisés** : id, titre, groupe (annulé / confirmé / en traitement / double / spam-erreur), masquer la date aux affiliés, label de tri. CRUD. |
| `/admin/statistics` | Statistiques | KPI (total, confirmés, taux de confirmation/annulation) + grille de performance par produit/affilié, déclinée par statut, avec tri/filtre/pagination. |
| `/admin/payout` | Payout | Montant dû par affilié (somme des confirmés non payés × payout produit). Bouton **« Payé »** → pose `paid_at` (solde). |
| `/admin/offers` | *(hors menu)* | Gestion des **offres** : id, nom, produit, pays, payout, devise, `payout_model` (`confirmed`/`delivered`), statut. Activer/suspendre. |

---

## 3. Panel affilié (`/panel`)

Données **isolées par affilié** (RLS sur `affiliate_id`).

| Route | Titre | Ce qu'on y fait |
|-------|-------|-----------------|
| `/panel` | Tableau de bord | KPI personnels : leads envoyés, taux de confirmation, taux d'annulation, payout total dû. Rappels d'usage de l'API. |
| `/panel/leads` | Mes leads | Ses leads (≤ 200) : `public_id`, offre, produit, pays, statut (badge coloré), payout, client, dates. |
| `/panel/products` | Produits | Catalogue lecture seule des produits disponibles : id, nom, catégorie, pays, prix (formaté par devise), capacité/jour, taux de confirmation, payout, statut, horaires. Export **CSV / JSON**. |
| `/panel/settings` | API & Postback | Token (copiable), exemples cURL, schéma de payload, pays supportés, codes de réponse. Formulaire **URL de postback + méthode** (GET/POST), liste des macros, secret HMAC pour le POST. |
| `/panel/account` | Mon compte | Infos du compte (nom, email, statut, date d'inscription). Modifier nom/email. Changer le mot de passe (vérifie l'actuel). |

---

## 4. Espace media buying (`/media-buying`)

Accessible aux `media_buyer` et aux `admin` (supervision). Données isolées par `media_buyer_id`.

| Route | Titre | Ce qu'on y fait |
|-------|-------|-----------------|
| `/media-buying` | Tableau de bord | KPI : dépense pub (USD), nombre de leads, confirmés, livrés, **coût par livré**, **coût par lead**. Mode d'emploi. |
| `/media-buying/orders` | Mes commandes | Ses commandes (≤ 300) : `public_id`, produit, pays, campagne, statut, payout, client, date. Saisie avec produit (depuis le catalogue) et campagne en autocomplétion. |
| `/media-buying/spend` | Dépenses des publicités | Saisie ligne à ligne des dépenses : date, buyer, pays, campagne, montant (USD), note. Table de ses dépenses ; campagne auto-complétée. |
| `/media-buying/results` | Résultats | Croise dépenses ↔ commandes par **campagne + pays** : coût par lead / confirmé / livré, marge par commande. |

---

## 5. Internationalisation (i18n)

- Locales : **`fr`** (défaut/fallback) et **`en`** (`src/i18n/messages/*.ts`).
- Sélection mémorisée (cookie `NEXT_LOCALE` + localStorage) ; les clés EN manquantes retombent sur le FR (fusion profonde).
- Sélecteur de langue dans la topbar (`LanguageSwitcher`). Les libellés de navigation viennent de `t("nav.*")`.

---

## 6. Parcours type d'un lead (bout en bout)

1. L'affilié envoie un lead via `POST /api/v1/leads` → `orders` en statut `new` (payout posé si produit connu).
2. Le centre d'appel/admin le traite dans `/admin/orders` : `processing` → `confirmed`/`rejected`/…
3. Chaque changement de statut écrit dans `status_history` **et** enfile un `postback` → livré au tracker de l'affilié (immédiat + cron de rattrapage).
4. À la confirmation/livraison (selon `payout_model`), le payout devient dû ; visible dans `/admin/payout` et le panel affilié.
5. L'admin marque « Payé » → `paid_at` posé, montant soldé.

Voir aussi [`data-model.md`](data-model.md) et [`api-reference.md`](api-reference.md).
