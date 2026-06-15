import { NextResponse } from "next/server";
import { authenticateAffiliate } from "@/lib/api-auth";
import { leadSchema } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Fenêtre de déduplication sur le téléphone (jours).
const DEDUP_WINDOW_DAYS = 30;

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
  const lead = parsed.data;
  const db = createAdminClient();

  // 3) Vérifier que l'offre existe et est active
  const { data: offer } = await db
    .from("offers")
    .select("id, country, status")
    .eq("id", lead.offer_id)
    .single();
  if (!offer || offer.status !== "active")
    return NextResponse.json(
      { success: false, error_code: "OFFER_NOT_FOUND", message: "Offre inconnue ou inactive" },
      { status: 403 }
    );
  if (offer.country !== lead.country)
    return NextResponse.json(
      { success: false, error_code: "COUNTRY_MISMATCH", message: "Pays non couvert par cette offre" },
      { status: 422 }
    );

  // 4) Déduplication sur le téléphone
  const since = new Date(Date.now() - DEDUP_WINDOW_DAYS * 86400_000).toISOString();
  const { data: dup } = await db
    .from("orders")
    .select("public_id")
    .eq("phone", lead.phone)
    .neq("status", "trash")
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();
  if (dup)
    return NextResponse.json(
      { success: false, error_code: "DUPLICATE_LEAD", message: `Lead déjà existant (${dup.public_id})` },
      { status: 409 }
    );

  // 5) Insertion
  const { data: created, error } = await db
    .from("orders")
    .insert({
      affiliate_id: auth.affiliate.id,
      offer_id: lead.offer_id,
      first_name: lead.first_name,
      last_name: lead.last_name ?? null,
      phone: lead.phone,
      country: lead.country,
      address: lead.address ?? null,
      city: lead.city ?? null,
      quantity: lead.quantity,
      ip: lead.ip ?? null,
      user_agent: lead.user_agent ?? null,
      sub1: lead.sub1 ?? null, sub2: lead.sub2 ?? null, sub3: lead.sub3 ?? null,
      sub4: lead.sub4 ?? null, sub5: lead.sub5 ?? null,
      comment: lead.comment ?? null,
      status: "new",
    })
    .select("id, public_id, status")
    .single();

  if (error || !created)
    return NextResponse.json(
      { success: false, error_code: "SERVER", message: "Échec de création du lead" },
      { status: 500 }
    );

  // Historique initial (baseline "new")
  await db.from("status_history").insert({
    order_id: created.id,
    from_status: null,
    to_status: "new",
    note: "Lead reçu via API",
  });

  return NextResponse.json(
    { success: true, lead_id: created.public_id, status: created.status, message: "Lead reçu avec succès" },
    { status: 201 }
  );
}
