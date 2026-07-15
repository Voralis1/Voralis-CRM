import { NextResponse } from "next/server";
import { authenticateAffiliate } from "@/lib/api-auth";
import { leadSchema } from "@/lib/validation";
import { ingestLead } from "@/lib/leads";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderStatuses, statusMeta } from "@/lib/orderStatus";

export const runtime = "nodejs";

// Nombre max d'IDs par appel : évite qu'un affilié ne demande des milliers de
// leads d'un coup et ne fasse exploser le temps de réponse.
const MAX_BATCH_IDS = 100;

const LEAD_FIELDS =
  "public_id, product_id, product, status, country, created_at, updated_at, affiliate, sub1, sub2, sub3, sub4, sub5, payout_amount, payout_currency";

// GET /api/v1/leads?ids=000035,000038,... — consultation groupée de statuts.
export async function GET(req: Request) {
  const auth = await authenticateAffiliate(req);
  if ("error" in auth)
    return NextResponse.json(
      { success: false, error_code: "AUTH", message: auth.error },
      { status: auth.code }
    );

  const url = new URL(req.url);
  const ids = Array.from(
    new Set(
      (url.searchParams.get("ids") || "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "")
    )
  );

  if (ids.length === 0)
    return NextResponse.json(
      { success: false, error_code: "VALIDATION", message: "Paramètre 'ids' manquant ou vide" },
      { status: 400 }
    );
  if (ids.length > MAX_BATCH_IDS)
    return NextResponse.json(
      {
        success: false,
        error_code: "VALIDATION",
        message: `Trop d'IDs demandés (max ${MAX_BATCH_IDS} par appel)`,
      },
      { status: 400 }
    );

  const db = createAdminClient();

  // Filtre affiliate_id dans la requête elle-même : un affilié ne peut jamais
  // récupérer un lead qui n'est pas le sien, même en devinant un public_id.
  const [{ data: orders }, statuses] = await Promise.all([
    db.from("orders").select(LEAD_FIELDS).eq("affiliate_id", auth.affiliate.id).in("public_id", ids),
    getOrderStatuses(db),
  ]);

  const found = orders ?? [];
  const foundIds = new Set(found.map((o) => o.public_id));
  const notFound = ids.filter((id) => !foundIds.has(id));

  const leads = found.map((order) => ({
    ...order,
    status_label: statusMeta(statuses, order.status)?.title ?? order.status,
  }));

  return NextResponse.json({ success: true, leads, not_found: notFound });
}

export async function POST(req: Request) {
  // 1) Authentification par token affilié
  const auth = await authenticateAffiliate(req);
  if ("error" in auth)
    return NextResponse.json(
      { success: false, error_code: "AUTH", message: auth.error },
      { status: auth.code }
    );

  // 2) Validation du payload
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error_code: "BAD_JSON", message: "Corps JSON invalide" },
      { status: 400 }
    );
  }
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error_code: "VALIDATION",
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // 3) Ingestion (offre + déduplication + insertion), logique partagée
  const result = await ingestLead(auth.affiliate.id, parsed.data);
  if (!result.ok)
    return NextResponse.json(
      { success: false, error_code: result.error_code, message: result.message },
      { status: result.code }
    );

  return NextResponse.json(
    { success: true, lead_id: result.lead_id, status: result.status, message: "Lead reçu avec succès" },
    { status: 201 }
  );
}
