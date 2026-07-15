# VORALIS — Guide d'intégration API (Affiliés)

Bienvenue ! Ce guide explique comment **envoyer vos leads**, **suivre leurs statuts** et **recevoir les mises à jour** (postbacks) sur la plateforme VORALIS.

- **URL de base :** `https://www.voralisnatural.com` (remplacez par l'URL qui vous a été communiquée)
- **Format :** JSON (UTF-8)
- **Authentification :** votre **token API** personnel, dans l'en-tête `Authorization`

> Votre token est disponible dans votre espace, onglet **« API & Postback »**. Ne le partagez jamais publiquement.

---

## 1. Authentification

Chaque requête doit contenir votre token dans l'en-tête HTTP :

```
Authorization: Bearer VOTRE_TOKEN
```

Un token invalide renvoie `401`. Un compte suspendu renvoie `403`.

---

## 2. Envoyer un lead

**`POST /api/v1/leads`**

En-têtes :
```
Authorization: Bearer VOTRE_TOKEN
Content-Type: application/json
```

### Champs

| Champ | Obligatoire | Type | Règle / exemple |
|-------|:-----------:|------|-----------------|
| `first_name` | ✅ | texte | Prénom. Max 120 |
| `phone` | ✅ | texte | 6 à 20 caractères. Chiffres, `+ ( ) - . espace` |
| `country` | ✅ | texte | Code pays 2–3 lettres (ex. `SN`, `CI`, `GN`, `AGO`) |
| `quantity` | ✅ | entier | 1 à 99 |
| `affiliate` | ✅ | texte | Votre identifiant de sous-affilié / source (ex. `fb_camp_12`). Max 255 |
| `product_id` | ✅* | texte | ID du produit dans le catalogue (prioritaire sur `product_name`). Max 200 |
| `product_name` | ✅* | texte | Nom exact du produit, insensible à la casse. Max 200 |
| `last_name` | ⬜ | texte | Nom. Max 120 |
| `address` | ⬜ | texte | Adresse. Max 300 |
| `city` | ⬜ | texte | Ville. Max 120 |
| `ip` | ⬜ | texte | IP du client. Max 60 |
| `user_agent` | ⬜ | texte | User-agent du client. Max 400 |
| `sub1`, `sub2`, `sub3`, `sub4`, `sub5` | ⬜ | texte | Paramètres de tracking libres. Max 255 |
| `comment` | ⬜ | texte | Note interne. Max 1000 |

> \* `product_id` **ou** `product_name` est obligatoire — au moins l'un des deux doit être envoyé (les deux ensemble fonctionnent aussi, `product_id` étant alors prioritaire). Omettre les deux renvoie une erreur `400 VALIDATION`.

### Codes pays et devises

Le champ `country` accepte un code de **2 à 3 lettres** (ISO 3166-1 alpha-2 ou alpha-3) — **n'importe quel pays du monde est accepté**, pas seulement ceux ci-dessous. La **devise** est déterminée automatiquement à partir du pays, avec une couverture quasi mondiale (codes ISO 4217).

Nos marchés principaux, avec leurs abréviations recommandées :

| Code | Pays | Devise |
|------|------|--------|
| `SN` | Sénégal | FCFA (XOF) |
| `CI` | Côte d'Ivoire | FCFA (XOF) |
| `ML` | Mali | FCFA (XOF) |
| `BF` | Burkina Faso | FCFA (XOF) |
| `TG` | Togo | FCFA (XOF) |
| `GN` | Guinée | GNF |
| `GAB` | Gabon | FCFA (XAF) |
| `BZV` | Congo-Brazzaville | FCFA (XAF) |
| `AGO` | Angola | Kz (Kwanza) |
| `NG` | Nigéria | ₦ (Naira) |

> Pour tout autre pays (ex. `FR`, `US`, `MA`, `CD`…), la devise officielle correspondante est résolue automatiquement — inutile de nous demander de l'ajouter. Seul un code totalement inconnu (pays inexistant) affichera une devise vide, sans provoquer d'erreur.

### Exemple (cURL)

```bash
curl -X POST https://VOTRE-DOMAINE.com/api/v1/leads \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Lumora",
    "first_name": "Joao",
    "last_name": "Silva",
    "phone": "+244923000000",
    "country": "AGO",
    "address": "Rua 1, Bairro Central",
    "city": "Luanda",
    "quantity": 1,
    "affiliate": "fb_camp_12",
    "sub3": "adset_45",
    "comment": "Client rappelé le soir"
  }'
```

### Réponse en cas de succès — `201 Created`

```json
{
  "success": true,
  "lead_id": "000123",
  "status": "new",
  "message": "Lead reçu avec succès"
}
```

> Conservez le `lead_id` : il identifie le lead pour le suivi et apparaît dans les postbacks (`{lead_id}`).

---

## 3. Consulter le statut d'un lead

**`GET /api/v1/leads/{lead_id}`**

```bash
curl https://VOTRE-DOMAINE.com/api/v1/leads/000123 \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Réponse — `200 OK`

```json
{
  "public_id": "000123",
  "product_id": "218022",
  "product": "PERDA DE PESO",
  "status": "confirmed",
  "status_label": "Confirmé",
  "country": "AGO",
  "created_at": "2026-06-30T10:15:00Z",
  "updated_at": "2026-06-30T12:40:00Z",
  "affiliate": "fb_camp_12",
  "sub1": null,
  "sub2": null,
  "sub3": "adset_45",
  "sub4": null,
  "sub5": null,
  "payout_amount": 6.00,
  "payout_currency": "USD"
}
```

Lead inconnu → `404`.

### Consulter plusieurs leads en un seul appel

**`GET /api/v1/leads?ids=000123,000124,000125`**

Jusqu'à **100 IDs** par appel, séparés par des virgules :

```bash
curl "https://VOTRE-DOMAINE.com/api/v1/leads?ids=000123,000124,000125" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Réponse groupée — `200 OK`

```json
{
  "success": true,
  "leads": [
    { "public_id": "000123", "status": "confirmed", "status_label": "Confirmé", "...": "..." },
    { "public_id": "000124", "status": "spam", "status_label": "Spam", "...": "..." }
  ],
  "not_found": ["000125"]
}
```

Chaque élément de `leads` a la même forme que la réponse unitaire ci-dessus. `not_found` liste les IDs demandés introuvables ou qui ne vous appartiennent pas. Au-delà de 100 IDs, l'API renvoie `400 VALIDATION`.

---

## 4. Catalogue produits

Il n'y a pas d'endpoint public pour lister les produits. Le catalogue complet (ID, nom, pays, prix, payout) est téléchargeable en JSON/CSV depuis votre espace, page **« Produits »**. Utilisez l'`id` du produit en `product_id` pour un rattachement fiable (le nom exact fonctionne aussi, insensible à la casse).

---

## 5. Statuts d'un lead

Un lead évolue au fil de son traitement. Voici les statuts possibles :

| Statut | Signification |
|--------|---------------|
| `new` | Nouveau — reçu |
| `duplicate` | Doublon |
| `trash` | Invalide |
| `processing` | En traitement (centre d'appel) |
| `no_answer` | Injoignable |
| `callback` | Rappel programmé |
| `confirmed` | **Confirmé** |
| `test_confirmed` | Confirmé (test) |
| `rejected` | Annulé par le client |
| `shipped` | Expédié |
| `in_delivery` | En livraison |
| `delivered` | **Livré** |
| `returned` | Retourné |
| `cancelled` | Annulé |

> La commission (**payout**) est due au statut facturable du produit (`confirmed` ou `delivered` selon le modèle de payout du produit).

---

## 6. Postbacks (mises à jour automatiques)

À **chaque changement de statut**, VORALIS appelle automatiquement votre URL de tracker pour vous notifier. Configurez cette URL dans votre espace, onglet **« API & Postback »**.

### Macros disponibles dans l'URL

| Macro | Valeur |
|-------|--------|
| `{lead_id}` | Identifiant du lead (ex. `000123`) |
| `{status}` | Statut (ex. `confirmed`) |
| `{status_label}` | Libellé du statut |
| `{product_id}` | Identifiant du produit |
| `{country}` | Pays |
| `{payout}` | Montant de commission (`0` si non facturable) |
| `{currency}` | Devise du payout |
| `{quantity}` | Quantité |
| `{comment}` | Commentaire |
| `{affiliate}` | Votre identifiant de sous-affilié |
| `{sub1}` `{sub2}` `{sub3}` `{sub4}` `{sub5}` | Vos paramètres de tracking |
| `{timestamp}` | Date/heure ISO 8601 |

### Exemple d'URL de postback

```
https://votre-tracker.com/postback?clickid={sub3}&status={status}&payout={payout}&leadid={lead_id}
```

### Méthode GET ou POST

- **GET** (par défaut) : les macros sont insérées dans l'URL (valeurs encodées).
- **POST** : le corps est envoyé en JSON, **signé** via l'en-tête
  `X-Voralis-Signature` (HMAC-SHA256 du corps avec votre **secret de signature**, affiché dans votre espace). Cela vous permet de vérifier l'authenticité de l'appel.

---

## 7. Codes de réponse

| Code | Signification |
|------|---------------|
| `201` | Lead créé avec succès |
| `200` | Requête réussie (consultation) |
| `400` | JSON invalide ou champs non conformes (voir `details`) |
| `401` | Token manquant ou invalide |
| `403` | Compte affilié suspendu |
| `409` | Doublon (même téléphone déjà envoyé récemment) |
| `500` | Erreur serveur — réessayez plus tard |

### Format d'erreur

```json
{
  "success": false,
  "error_code": "VALIDATION",
  "message": "Description de l'erreur",
  "details": { "champ": "raison" }
}
```

Codes d'erreur : `AUTH`, `VALIDATION`, `BAD_JSON`, `DUPLICATE_LEAD`, `SERVER`.

---

## 8. Règles importantes

- **Anti-doublon :** un lead avec le **même numéro de téléphone** envoyé dans les **30 derniers jours** est refusé (`409`). Vérifiez côté source pour éviter les rejets.
- **Téléphone :** privilégiez le **format international** (ex. `+221770000000`) pour une meilleure joignabilité.
- **`affiliate` :** utilisez un identifiant stable par campagne/source — il vous sert à segmenter vos stats et revient dans les postbacks.
- **Sécurité :** gardez votre token secret. En cas de fuite, régénérez-le depuis votre espace (l'ancien devient immédiatement invalide).

---

## 9. Support

Pour toute question d'intégration (token, produits, postbacks), contactez votre responsable de compte VORALIS.
