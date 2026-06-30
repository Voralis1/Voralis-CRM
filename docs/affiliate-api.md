# API Leads — Guide pour les affiliés

Ce document explique comment envoyer des leads via l'API de Voralis.

## Authentification
- Header: `Authorization: Bearer <API_TOKEN>`
- Le token est généré côté Back‑Office et visible pour l'affilié dans l'interface (onglet API / token).

## Endpoint
- URL: `POST /api/v1/leads`
- Contenu: `application/json`

## Schéma attendu (payload)
Champs requis:
- `offer_id` (string) — identifiant de l'offre
- `first_name` (string)
- `phone` (string) — format autorisé: chiffres, +, espaces, parenthèses, points, tirets
- `country` (string) — code pays supporté (ex. `SN`)

Champs optionnels:
- `last_name` (string)
- `address` (string)
- `city` (string)
- `quantity` (int)
- `ip` (string)
- `user_agent` (string)
- `sub1` .. `sub5` (string)
- `comment` (string)

Exemple minimal valide:

```json
{
  "offer_id": "offer_123",
  "first_name": "Jean",
  "phone": "+221770000000",
  "country": "SN"
}
```

Exemple complet (curl):

```bash
curl -X POST https://example.com/api/v1/leads \
  -H "Authorization: Bearer vrl_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id":"offer_123",
    "first_name":"Jean",
    "last_name":"Dupont",
    "phone":"+221770000000",
    "country":"SN",
    "address":"1 rue Exemple",
    "city":"Dakar",
    "quantity":1,
    "ip":"1.2.3.4",
    "user_agent":"MyAgent/1.0",
    "sub1":"API",
    "comment":"Test"
  }'
```

## Codes de réponse importants
- `201` — Succès. Body: `{ success: true, lead_id, status, message }`.
- `400` — JSON invalide / validation échouée.
- `401` — Token manquant ou invalide.
- `403` — Offre inconnue ou affilié suspendu.
- `409` — Doublon (lead existant sur téléphone dans 30 derniers jours).
- `422` — Pays non couvert par l'offre.
- `500` — Erreur serveur.

## Comportement serveur
- L'affilié ne doit pas fournir `affiliate_id` — il est déduit depuis le token.
- L'API vérifie que l'offre est active et que le `country` correspond à l'offre.
- Déduplication: recherche par `phone` sur les 30 derniers jours (ignore `trash`).
- Lead créé avec `status: "new"` et insertion dans `status_history`.

## Pays supportés
`["AO","ML","SN","CI","GN","GA","CG","MA"]`

## Conseils d'intégration
- Utiliser la méthode `POST` avec content-type JSON.
- En cas d'erreurs 4xx/5xx, logguer la réponse et réessayer en backoff si nécessaire.
- Pour tests manuels, utiliser le snippet curl ci‑dessus ou la collection Postman fournie.

## Contact
Pour tout problème d'authentification ou d'offres, contacter l'équipe support interne.
