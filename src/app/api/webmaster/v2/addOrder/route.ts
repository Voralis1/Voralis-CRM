import { NextResponse } from "next/server";
import { authenticateToken } from "@/lib/api-auth";
import { leadSchema } from "@/lib/validation";
import { ingestLead } from "@/lib/leads";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Endpoint de compatibilité « façon LeadVertex ».
//
// Permet à un affilié déjà intégré à LeadVertex d'envoyer ses leads sans
// réécrire son code : mêmes noms de champs (fio, goods, externalWebmaster,
// utm_*) et même style d'authentification par query string (?token=...).
//
//   POST /api/webmaster/v2/addOrder?token=vrl_live_xxx
//   Content-Type: application/x-www-form-urlencoded  (ou JSON)
//
// En interne, on mappe ce format vers le schéma Voralis puis on appelle la
// MÊME logique d'ingestion que /api/v1/leads (offre, déduplication, insertion).
// ---------------------------------------------------------------------------

type Flat = Record<string, string>;

// Aplatit un corps de requête (form-urlencoded OU JSON) en paires clé/valeur,
// y compris les clés imbriquées style PHP (goods[0][goodID]).
async function readBody(req: Request): Promise<Flat> {
  const ct = req.headers.get("content-type") || "";
  const out: Flat = {};

  if (ct.includes("application/json")) {
    let json: any = {};
    try { json = await req.json(); } catch { json = {}; }
    const walk = (obj: any, prefix: string) => {
      if (obj === null || obj === undefined) return;
      if (Array.isArray(obj)) obj.forEach((v, i) => walk(v, `${prefix}[${i}]`));
      else if (typeof obj === "object") for (const k of Object.keys(obj)) walk(obj[k], prefix ? `${prefix}[${k}]` : k);
      else out[prefix] = String(obj);
    };
    walk(json, "");
    return out;
  }

  // form-urlencoded ou multipart -> FormData
  try {
    const fd = await req.formData();
    for (const [k, v] of fd.entries()) out[k] = String(v);
    return out;
  } catch {
    // fallback : corps brut urlencoded
    const text = await req.text().catch(() => "");
    for (const [k, v] of new URLSearchParams(text)) out[k] = v;
    return out;
  }
}

// Récupère le premier good présent quel que soit le style d'encodage :
// goods[0][goodID] / goods[goodID] / goodID / goodId.
function pickGood(b: Flat, field: string): string | undefined {
  return (
    b[`goods[0][${field}]`] ??
    b[`goods[${field}]`] ??
    b[field] ??
    b[field.toLowerCase()]
  );
}

export async function POST(req: Request) {
  const url = new URL(req.url);

  // 1) Authentification : ?token= (compat LeadVertex) ou Authorization: Bearer
  const headerToken = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const token = url.searchParams.get("token") || headerToken;
  const auth = await authenticateToken(token);
  if ("error" in auth)
    return NextResponse.json(
      { status: "error", error_code: "AUTH", message: auth.error },
      { status: auth.code }
    );

  // 2) Lecture du corps (form_params LeadVertex ou JSON)
  const b = await readBody(req);

  // 3) Découpage du nom complet « fio » en prénom / nom
  const fio = (b.fio || b.name || "").trim();
  const sp = fio.indexOf(" ");
  const firstName = b.first_name || (sp === -1 ? fio : fio.slice(0, sp));
  const lastName = b.last_name || (sp === -1 ? "" : fio.slice(sp + 1));

  // 4) Mapping LeadVertex -> schéma Voralis
  const comment = [
    b.comment,
    b.domain ? `domain: ${b.domain}` : "",
    b.additional14 ? `add14: ${b.additional14}` : "",
    b.additional15 ? `add15: ${b.additional15}` : "",
  ].filter(Boolean).join(" | ") || undefined;

  const mapped = {
    product_id: pickGood(b, "goodID") || b.product_id || undefined,
    product_name: b.product || b["goods[0][title]"] || undefined,
    first_name: firstName,
    last_name: lastName || undefined,
    phone: b.phone,
    country: (b.country || "").toUpperCase(),
    address: b.address || undefined,
    city: b.city || undefined,
    quantity: pickGood(b, "quantity") || b.quantity || 1,
    ip: b.ip || undefined,
    user_agent: req.headers.get("user-agent") || b.user_agent || undefined,
    // externalWebmaster = identifiant de l'affilié -> affiliate (obligatoire)
    affiliate: b.affiliate || b.externalWebmaster || undefined,
    sub3: b.sub3 || b.utm_campaign || undefined,
    sub4: b.sub4 || b.utm_medium || undefined,
    sub5: b.sub5 || b.utm_content || undefined,
    comment,
  };

  // 5) Validation via le schéma standard
  const parsed = leadSchema.safeParse(mapped);
  if (!parsed.success)
    return NextResponse.json(
      {
        status: "error",
        error_code: "VALIDATION",
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );

  // 6) Ingestion partagée
  const result = await ingestLead(auth.affiliate.id, parsed.data);
  if (!result.ok)
    return NextResponse.json(
      { status: "error", error_code: result.error_code, message: result.message },
      { status: result.code }
    );

  // Réponse au format compatible (status/orderID) + champs Voralis.
  return NextResponse.json(
    {
      status: "success",
      orderID: result.lead_id,
      lead_id: result.lead_id,
      lead_status: result.status,
      message: "Lead reçu avec succès",
    },
    { status: 201 }
  );
}
