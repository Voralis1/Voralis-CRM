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
- `first_name` (string)
- `phone` (string) — format autorisé: chiffres, +, espaces, parenthèses, points, tirets
- `country` (string) — code pays 2-3 lettres (ex. `SN`)
- `quantity` (int) — 1 à 99
- `affiliate` (string) — identifiant de votre sous-affilié / source
- **`product_id` OU `product_name`** (au moins un des deux ; `product_id` prioritaire si les deux sont envoyés)

Champs optionnels:
- `last_name` (string)
- `address` (string)
- `city` (string)
- `ip` (string)
- `user_agent` (string)
- `sub1` .. `sub5` (string)
- `comment` (string)

Exemple minimal valide:

```json
{
  "product_id": "218022",
  "first_name": "Jean",
  "phone": "+221770000000",
  "country": "SN",
  "quantity": 1,
  "affiliate": "3379"
}
```

Exemple complet (curl):

```bash
curl -X POST https://example.com/api/v1/leads \
  -H "Authorization: Bearer vrl_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id":"218022",
    "first_name":"Jean",
    "last_name":"Dupont",
    "phone":"+221770000000",
    "country":"SN",
    "address":"1 rue Exemple",
    "city":"Dakar",
    "quantity":1,
    "affiliate":"3379",
    "ip":"1.2.3.4",
    "user_agent":"MyAgent/1.0",
    "comment":"Test"
  }'
```

## Codes de réponse importants
- `201` — Succès. Body: `{ success: true, lead_id, status, message }`.
- `400` — JSON invalide / validation échouée (voir `details`).
- `401` — Token manquant ou invalide.
- `403` — Compte affilié suspendu.
- `500` — Erreur serveur.

## Comportement serveur
- L'affilié ne doit pas fournir `affiliate_id` — il est déduit depuis le token (`Authorization: Bearer`). Le champ `affiliate` est un identifiant libre de sous-affilié/source, distinct du token.
- `product_id` est résolu en priorité contre le catalogue produits, avec repli sur `product_name` (nom exact) si non fourni ou non trouvé ; sans correspondance, la valeur reçue est conservée en texte libre et le payout reste vide.
- Aucune déduplication automatique par téléphone : chaque appel crée un nouveau lead.
- Lead créé avec `status: "new"` et insertion dans `status_history`.

## Pays supportés
Tous les codes pays 2-3 lettres (ISO 3166-1) sont acceptés — pas seulement une liste restreinte. La devise est résolue automatiquement pour la quasi-totalité des pays du monde (couverture ISO 4217), avec une priorité historique sur les marchés principaux : `AO, ML, SN, CI, GN, GA, CG, MA`. Un code pays inconnu n'entraîne pas d'erreur, seule la devise affichée reste vide.

## Consulter plusieurs leads — `GET /api/v1/leads?ids=...`
- URL: `GET /api/v1/leads?ids=000123,000124,000125` (jusqu'à 100 IDs séparés par des virgules)
- Réponse `200` : `{ success: true, leads: [...], not_found: [...] }` — `leads` contient les mêmes champs que la consultation unitaire (`GET /api/v1/leads/{id}`), `not_found` liste les IDs introuvables ou n'appartenant pas à l'affilié.
- `400 VALIDATION` si `ids` est vide/manquant ou dépasse 100 éléments.

## Conseils d'intégration
- Utiliser la méthode `POST` avec content-type JSON.
- En cas d'erreurs 4xx/5xx, logguer la réponse et réessayer en backoff si nécessaire.
- Pour tests manuels, utiliser le snippet curl ci‑dessus ou la collection Postman fournie.

## Contact
Pour tout problème d'authentification ou de produits, contacter l'équipe support interne.
