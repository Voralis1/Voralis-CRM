# VORALIS · TECHNICAL DOCUMENTATION

## API Integration Guide — Affiliates

This guide explains how to **send your leads**, **track their statuses** and **receive updates** (postbacks) on the VORALIS platform.

| Parameter | Value |
|---|---|
| Base URL | `https://www.voralisnatural.com`|
| Format | JSON (UTF-8) |
| Authentication | Your personal **API token**, in the `Authorization` header |

> Your token is available in your dashboard, under the **"API & Postback"** tab. Never share it publicly.

---

## 1. Authentication

Every request must include your token in the HTTP header:

```
Authorization: Bearer YOUR_TOKEN
```

An invalid token returns `401`. A suspended account returns `403`.

---

## 2. Send a lead

**`POST /api/v1/leads`**

Headers:
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Fields

| Field | Required | Type | Rule / example |
|---|:---:|---|---|
| `first_name` | ✓ | text | First name. Max 120 |
| `phone` | ✓ | text | 6 to 20 characters. Digits, `+ ( ) - . space` |
| `country` | ✓ | text | 2–3 letter country code (e.g. `SN`, `CI`, `GN`, `AGO`) |
| `quantity` | ✓ | integer | 1 to 99 |
| `affiliate` | ✓ | text | Your sub-affiliate / source ID (e.g. `fb_camp_12`). Max 255 |
| `product_id` | ✓* | text | Product ID from the products catalog. Takes priority over `product_name` if both are sent. Max 200 |
| `product_name` | ✓* | text | Exact product name (case-insensitive). Used if `product_id` is absent. Max 200 |
| `last_name` | — | text | Last name. Max 120 |
| `address` | — | text | Address. Max 300 |
| `city` | — | text | City. Max 120 |
| `ip` | — | text | Client IP. Max 60 |
| `user_agent` | — | text | Client user-agent. Max 400 |
| `sub1`, `sub2`, `sub3`, `sub4`, `sub5` | — | text | Free tracking parameters. Max 255 |
| `comment` | — | text | Internal note. Max 1000 |

> \* `product_id` **or** `product_name` is required — at least one of the two must be sent (both together is fine, `product_id` then takes priority). Omitting both returns a `400 VALIDATION` error.
>
> `last_name`, `address` and `city` remain fully optional: a lead can be sent without them.

### Country codes and currencies

The `country` field accepts a **2 to 3 letter** code (ISO 3166-1 alpha-2 or alpha-3) — **any country in the world is accepted**, not just the ones below. The **currency** is automatically resolved from the country, with near-worldwide coverage (ISO 4217 codes).

Our main markets, with their recommended abbreviations:

| Code | Country | Currency |
|---|---|---|
| `SN` | Senegal | FCFA (XOF) |
| `CI` | Ivory Coast | FCFA (XOF) |
| `ML` | Mali | FCFA (XOF) |
| `BF` | Burkina Faso | FCFA (XOF) |
| `TG` | Togo | FCFA (XOF) |
| `GN` | Guinea | GNF |
| `GAB` | Gabon | FCFA (XAF) |
| `BZV` | Congo-Brazzaville | FCFA (XAF) |
| `AGO` | Angola | Kz (Kwanza) |
| `NG` | Nigeria | ₦ (Naira) |

> Any other country (e.g. `FR`, `US`, `MA`, `CD`…) has its official currency resolved automatically — no need to ask us to add it. Only a code matching no real country will show an empty currency, without causing an error.

### Example (cURL) — full payload

```bash
curl -X POST https://www.voralisnatural.com/api/v1/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
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
    "comment": "Customer called back in the evening"
  }'
```

### Example (cURL) — minimal payload (required fields only)

```bash
curl -X POST https://www.voralisnatural.com/api/v1/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "218022",
    "first_name": "Joao",
    "phone": "+244923000000",
    "country": "AGO",
    "quantity": 1,
    "affiliate": "fb_camp_12"
  }'
```

### Success response — `201 Created`

```json
{
  "success": true,
  "lead_id": "000123",
  "status": "new",
  "message": "Lead received successfully"
}
```

> Keep the `lead_id`: it identifies the lead for tracking and appears in postbacks (`{lead_id}`).

---

## 3. Check a lead's status

**`GET /api/v1/leads/{lead_id}`**

```bash
curl https://www.voralisnatural.com/api/v1/leads/000123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response — `200 OK`

```json
{
  "public_id": "000123",
  "product_id": "218022",
  "product": "PERDA DE PESO",
  "status": "confirmed",
  "status_label": "Confirmed",
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

Unknown lead → `404`.

### Check multiple leads in one call — `GET /api/v1/leads?ids=...`

To avoid one call per lead, you can query up to **100 IDs** at once, comma-separated:

```bash
curl "https://www.voralisnatural.com/api/v1/leads?ids=000123,000124,000125" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Batch response — `200 OK`

```json
{
  "success": true,
  "leads": [
    { "public_id": "000123", "status": "confirmed", "status_label": "Confirmed", "...": "..." },
    { "public_id": "000124", "status": "spam", "status_label": "Spam", "...": "..." }
  ],
  "not_found": ["000125"]
}
```

Each item in `leads` has the same shape as the single-lead response above. `not_found` lists the requested IDs that don't exist or don't belong to you. Requesting more than 100 IDs returns `400 VALIDATION`.

---

## 4. Product catalog

There is no public endpoint to list products. The full catalog (ID, name, country, price, payout) is available as a JSON/CSV download from your dashboard, under **"Products"**. Use the product's `id` in `product_id` for the most reliable match, or its exact name in `product_name` (case-insensitive).

---

## 5. Lead statuses

A lead progresses through several stages as it is processed. Possible statuses:

| Status | Meaning |
|---|---|
| `new` | New — received |
| `duplicate` | Duplicate |
| `trash` | Invalid |
| `processing` | Being processed (call center) |
| `no_answer` | Unreachable |
| `callback` | Callback scheduled |
| `confirmed` | **Confirmed** |
| `test_confirmed` | Confirmed (test) |
| `rejected` | Cancelled by customer |
| `shipped` | Shipped |
| `in_delivery` | Out for delivery |
| `delivered` | **Delivered** |
| `returned` | Returned |
| `cancelled` | Cancelled |

> The commission (**payout**) is owed once the product reaches its billable status (`confirmed` or `delivered`, depending on the product's payout model).

---

## 6. Postbacks (automatic updates)

On every status change, VORALIS automatically calls your tracker URL to notify you. Configure this URL in your dashboard, under the **"API & Postback"** tab.

### Macros available in the URL

| Macro | Value |
|---|---|
| `{lead_id}` | Lead ID (e.g. `000123`) |
| `{status}` | Status (e.g. `confirmed`) |
| `{status_label}` | Status label |
| `{product_id}` | Product ID |
| `{country}` | Country |
| `{payout}` | Commission amount (`0` if not billable) |
| `{currency}` | Payout currency |
| `{quantity}` | Quantity |
| `{comment}` | Comment |
| `{affiliate}` | Your sub-affiliate ID |
| `{sub1}` `{sub2}` `{sub3}` `{sub4}` `{sub5}` | Your tracking parameters |
| `{timestamp}` | ISO 8601 date/time |

### Example postback URL

```
https://your-tracker.com/postback?clickid={sub3}&status={status}&payout={payout}&leadid={lead_id}
```

### GET or POST method

- **GET** (default): macros are inserted directly into the URL (values are encoded).
- **POST**: the body is sent as JSON, **signed** via the `X-Voralis-Signature` header (HMAC-SHA256 of the body using your **signing secret**, shown in your dashboard). This lets you verify the authenticity of the call.

---

## 7. Response codes

| Code | Meaning |
|---|---|
| `201` | Lead created successfully |
| `200` | Request succeeded (lookup) |
| `400` | Invalid JSON or non-compliant fields (see `details`) |
| `401` | Missing or invalid token |
| `403` | Suspended affiliate account |
| `409` | Duplicate (same phone number already sent recently) |
| `500` | Server error — please retry later |

### Error format

```json
{
  "success": false,
  "error_code": "VALIDATION",
  "message": "Error description",
  "details": { "field": "reason" }
}
```

Error codes: `AUTH`, `VALIDATION`, `BAD_JSON`, `DUPLICATE_LEAD`, `SERVER`.

---

## 8. Important rules

- **Duplicate prevention:** a lead with the **same phone number** submitted within the last **30 days** is rejected (`409`). Filter on your end to avoid rejections.
- **Phone number:** prefer the **international format** (e.g. `+221770000000`) for better reachability.
- **`affiliate`:** use a stable identifier per campaign/source — it's used to segment your stats and is returned in postbacks.
- **Security:** keep your token secret. If it's ever leaked, regenerate it from your dashboard (the old one becomes invalid immediately).

---

## 9. Support

For any integration questions (token, products, postbacks), contact your VORALIS account manager.

---

*Voralis · API Integration Guide for Affiliates · Internal document, do not distribute publicly*
