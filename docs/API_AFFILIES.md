# API d'envoi de leads — Documentation Affilié (Voralis CRM)

Ce document explique comment envoyer vos leads vers le CRM Voralis via notre API.
La procédure est **identique pour tous les affiliés** : seul votre token change.

- **URL de base :** `https://www.voralisnatural.com`
- **Authentification :** un token secret personnel (`vrl_live_…`) que nous vous communiquons.
- **Format :** JSON (recommandé) ou, pour les intégrations existantes type LeadVertex, `form_params`.



---

## 1. Avant de commencer

Nous vous fournissons **un seul élément** :

- **Votre token API** — ex. `vrl_live_a1b2c3...`. Il vous identifie ; ne le partagez jamais.

C'est tout : avec ce token, vous pouvez commencer à envoyer vos leads immédiatement.

---

## 2. Envoyer un lead — `POST /api/v1/leads` (recommandé)

```
POST https://www.voralisnatural.com/api/v1/leads
Authorization: Bearer VOTRE_TOKEN
Content-Type: application/json
```

### Champs du corps JSON

| Champ          | Obligatoire | Règle / format |
|----------------|:-----------:|----------------|
| `first_name`   | ✅ | Prénom — 1 à 120 caractères. |
| `phone`        | ✅ | 6 à 20 caractères. Caractères autorisés : chiffres, `+ ( ) . - espace`. |
| `country`      | ✅ | Abréviation pays **2 à 3 lettres** : `SN, CI, BZV, ML, GN, AGO, GAB, BF, NG, TG`. |
| `quantity`     | ✅ | Quantité — entier de 1 à 99. |
| `affiliate`    | ✅ | Votre identifiant d'affilié (ex. `3379`). 1 à 255 caractères. |
| `product_id`   | ✅* | **ID du produit (recommandé)** — prioritaire sur `product_name` si les deux sont envoyés. |
| `product_name` | ✅* | Nom exact du produit (insensible à la casse), utilisé si `product_id` absent. |
| `last_name`    | — | Nom — ≤ 120 caractères. |
| `address`      | — | Adresse — ≤ 300 caractères. |
| `city`         | — | Ville — ≤ 120 caractères. |
| `ip`           | — | IP du prospect (recommandé pour l'antifraude). |
| `user_agent`   | — | User-agent du prospect (recommandé). |
| `sub3`…`sub5`  | — | Vos autres paramètres de tracking (campagne…). ≤ 255 chacun. |
| `comment`      | — | Note libre (contexte, remarques…) — ≤ 1000 caractères. |

> **Champs obligatoires :** `first_name`, `phone`, `country`, `quantity`, `affiliate`, et **au moins un** de `product_id`/`product_name` (\* — omettre les deux renvoie une erreur `400 VALIDATION`).

**Produits** : récupérez la liste (ID + nom + pays + payout) depuis votre espace
(bouton **Télécharger JSON** sur la page Produits). Mettez de préférence l'**ID** du
produit dans le champ `product_id` — c'est exact et insensible aux fautes de recopie.
Le nom exact reste accepté via `product_name` (insensible à la casse).

### Exemple (cURL)

```bash
curl -X POST https://www.voralisnatural.com/api/v1/leads \
  -H "Authorization: Bearer vrl_live_c473641f3c7b7631dc4b23f87b05bd13d2b8ba4805f57022" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name":"Abdoul",
    "last_name":"Karim",
    "phone":"+611573050",
    "address":"Quartier Almamya",
    "city":"Conakry",
    "quantity":1,
    "affiliate":"3379",
    "product_name":"perda de peso",
    "country":"GN"
  }'
```

### Exemple (PHP)

```php
$ch = curl_init("https://www.voralisnatural.com/api/v1/leads");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer vrl_live_VOTRE_TOKEN",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "first_name" => "Abdoul",
    "last_name"  => "Karim",
    "phone"      => "+611579019",
    "address"    => "Quartier Almamya",
    "city"       => "Conakry",
    "quantity"   => 1,
    "product_name" => "perda de peso",
    "country"    => "GN",
    "affiliate"  => "3379",
  ]),
]);
$response = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
```

### Exemple (JavaScript / Node)

```js
const res = await fetch("https://www.voralisnatural.com/api/v1/leads", {
  method: "POST",
  headers: {
    Authorization: "Bearer vrl_live_VOTRE_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    first_name: "Abdoul",
    last_name: "Karim",
    phone: "+611579019",
    address: "Quartier Almamya",
    city: "Conakry",
    quantity: 1,
    product_name: "perda de peso",
    country: "GN",
    affiliate: "3379",
  }),
});
const data = await res.json();
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

Conservez `lead_id` : il permet de suivre le statut du lead (§4) et il est renvoyé dans les postbacks.

---

## 3. Codes d'erreur

| HTTP | `error_code`     | Signification | Action côté affilié |
|:----:|------------------|---------------|---------------------|
| 401  | `AUTH`           | Token manquant ou invalide | Vérifier le header `Authorization`. |
| 403  | `AUTH`           | Compte affilié suspendu | Nous contacter. |
| 400  | `VALIDATION`     | Un champ est manquant ou mal formé | Corriger selon `details`. |
| 400  | `BAD_JSON`       | Corps JSON illisible | Vérifier le `Content-Type` et le JSON. |
| 409  | `DUPLICATE_LEAD` | Téléphone déjà reçu il y a **moins de 30 jours** | Ne pas renvoyer ; gérer comme doublon. |
| 500  | `SERVER`         | Erreur interne | Réessayer plus tard. |

**Bonnes pratiques :**
- Traitez **409** comme un doublon (ne pas boucler).
- En cas de **5xx** ou de timeout, réessayez avec un léger délai (backoff).
- Un lead accepté démarre toujours au statut `new`.

---

## 4. Suivre le statut d'un lead — `GET /api/v1/leads/{lead_id}`

```bash
curl https://www.voralisnatural.com/api/v1/leads/000123 \
  -H "Authorization: Bearer vrl_live_VOTRE_TOKEN"
```

Statuts possibles : `new, duplicate, trash, processing, no_answer, callback, confirmed, rejected, shipped, in_delivery, delivered, returned, cancelled`.

---

## 5. Recevoir les mises à jour automatiquement (postback) — optionnel

Plutôt que d'interroger l'API, nous pouvons **vous notifier** à chaque changement de statut.
Communiquez-nous une **URL de postback** avec des macros, par ex. :

```
https://votre-serveur.com/postback?id={lead_id}&status={status}&payout={payout}
```

Macros disponibles : `{lead_id}`, `{status}`, `{status_label}`, `{product_id}`, `{country}`, `{payout}`, `{currency}`, `{quantity}`, `{comment}`, `{affiliate}`, `{sub3}`…`{sub5}`, `{timestamp}`.
En **POST**, le corps est signé (`X-Voralis-Signature` = HMAC-SHA256 du corps avec votre secret).

---

## 6. Compatibilité LeadVertex — `POST /api/webmaster/v2/addOrder`

Si vous êtes **déjà intégré à LeadVertex**, vous pouvez envoyer vos leads **sans changer votre code** :
mêmes noms de champs (`fio`, `externalWebmaster`, `utm_*`) et authentification par query string.

```
POST https://www.voralisnatural.com/api/webmaster/v2/addOrder?token=vrl_live_VOTRE_TOKEN
Content-Type: application/x-www-form-urlencoded
```

### Correspondance des champs

| Champ LeadVertex            | Champ Voralis | Remarque |
|-----------------------------|---------------|----------|
| `fio`                       | `first_name` (+ `last_name` facultatif) | **Obligatoire** : prénom requis, nom découpé au 1er espace s'il est présent. |
| `phone`                     | `phone`       | **Obligatoire.** |
| `address`                   | `address`     | Facultatif. |
| `city`                      | `city`        | Facultatif. |
| `goods[0][quantity]`        | `quantity`    | **Obligatoire** (entier ≥ 1). |
| `country`                   | `country`     | **Obligatoire** — code ISO 2 lettres (mis en majuscules). |
| `product` / `goods[0][title]` | `product_name` | Nom exact du produit. **Un des deux** (`product_name` ou `goodID`) est obligatoire. |
| `goodID` / `goods[0][goodID]` | `product_id` | ID du produit, prioritaire sur `product_name`. **Un des deux** est obligatoire. |
| `ip`                        | `ip`          | |
| `externalWebmaster`         | `affiliate`   | **Obligatoire** — identifiant de votre affilié. |
| `utm_campaign`              | `sub3`        | |
| `utm_medium`                | `sub4`        | |
| `utm_content`               | `sub5`        | |
| `domain`, `additional14/15` | `comment`     | Regroupés dans la note. |

Les champs LeadVertex non listés (ex. `goods[0][goodID]`, `price`) sont simplement ignorés —
vous pouvez les laisser, ils n'ont aucun effet.

### Exemple (cURL, format LeadVertex)

```bash
curl -X POST "https://www.voralisnatural.com/api/webmaster/v2/addOrder?token=vrl_live_VOTRE_TOKEN" \
  -d "fio=Abdoul Karim" \
  --data-urlencode "phone=+611579019" \
  -d "address=Quartier Almamya" \
  -d "city=Conakry" \
  -d "goods[0][quantity]=1" \
  -d "country=GN" \
  -d "product=perda de peso" \
  -d "ip=197.149.242.31" \
  -d "goodID=218022" \
  -d "externalWebmaster=3379"
```

> ℹ️ Avec `curl -d`, encodez le téléphone via `--data-urlencode` pour préserver le `+`.

### Réponse

```json
{ "status": "success", "orderID": "000123", "lead_id": "000123", "lead_status": "new" }
```

En cas d'erreur : `{ "status": "error", "error_code": "...", "message": "..." }` avec le même tableau de codes qu'au §3.

> 💡 **Recommandation :** pour les nouvelles intégrations, préférez `/api/v1/leads` (JSON + Bearer token).
> L'endpoint `/api/webmaster/v2/addOrder` n'existe que pour faciliter la migration des affiliés déjà sous LeadVertex.

---

## Résumé express

1. On vous donne **un token**.
2. Vous faites un `POST /api/v1/leads` avec `Authorization: Bearer <token>` et le JSON du lead (obligatoires : `first_name`, `phone`, `country`, `quantity`, `affiliate`, et `product_id` ou `product_name`).
3. Un téléphone déjà vu < 30 j est refusé (409).
4. Vous recevez un `lead_id` ; suivez le statut via l'API ou par postback.
