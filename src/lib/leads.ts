import { createAdminClient } from "@/lib/supabase/admin";
import { nextOrderPublicId } from "@/lib/orderId";
import type { LeadInput } from "@/lib/validation";

// Fenêtre de déduplication sur le téléphone (jours).
export const DEDUP_WINDOW_DAYS = 30;

export type IngestResult =
  | { ok: true; lead_id: string; status: string }
  | { ok: false; code: number; error_code: string; message: string };

// Cœur d'ingestion d'un lead, partagé par /api/v1/leads et l'endpoint
// compatible LeadVertex (/api/webmaster/v2/addOrder). Le payload doit déjà
// avoir été validé par leadSchema ; l'affilié doit déjà être authentifié.
export async function ingestLead(
  affiliateId: string,
  lead: LeadInput
): Promise<IngestResult> {
  const db = createAdminClient();

  // 1) Offre FACULTATIVE : si un offer_id est fourni, il doit exister et être
  //    actif (intégrité référentielle). Sinon, le lead est créé sans offre.
  if (lead.offer_id) {
    const { data: offer } = await db
      .from("offers")
      .select("id, status")
      .eq("id", lead.offer_id)
      .single();
    if (!offer || offer.status !== "active")
      return { ok: false, code: 403, error_code: "OFFER_NOT_FOUND", message: "Offre inconnue ou inactive" };
  }

  // 2) Déduplication sur le téléphone
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
    return { ok: false, code: 409, error_code: "DUPLICATE_LEAD", message: `Lead déjà existant (${dup.public_id})` };

  // 3a) Prix : récupéré depuis le catalogue (project_products) par nom de produit
  //     (correspondance exacte, insensible à la casse). Pas de produit ou pas de
  //     correspondance -> prix laissé vide (saisie manuelle possible ensuite).
  let payoutAmount: number | null = null;
  let payoutCurrency: string | null = null;
  if (lead.product) {
    const { data: prod } = await db
      .from("project_products")
      .select("price")
      .ilike("name", lead.product)
      .limit(1)
      .maybeSingle();
    if (prod?.price != null) {
      payoutAmount = Number(prod.price);
      payoutCurrency = "USD";
    }
  }

  // 4) Insertion avec un identifiant public numérique (retry si collision).
  const baseRow = {
    affiliate_id: affiliateId,
    offer_id: lead.offer_id ?? null,
    product: lead.product ?? null,
    first_name: lead.first_name,
    last_name: lead.last_name ?? null,
    phone: lead.phone,
    country: lead.country ?? null,
    address: lead.address ?? null,
    city: lead.city ?? null,
    quantity: lead.quantity,
    ip: lead.ip ?? null,
    user_agent: lead.user_agent ?? null,
    affiliate: lead.affiliate,
    sub3: lead.sub3 ?? null,
    sub4: lead.sub4 ?? null, sub5: lead.sub5 ?? null,
    comment: lead.comment ?? null,
    payout_amount: payoutAmount,
    payout_currency: payoutCurrency,
    status: "new",
  };

  let created: { id: string; public_id: string; status: string } | null = null;
  let error: any = null;
  for (let attempt = 0; attempt < 4 && !created; attempt++) {
    const publicId = await nextOrderPublicId(db);
    const res = await db
      .from("orders")
      .insert({ ...baseRow, public_id: publicId })
      .select("id, public_id, status")
      .single();
    created = res.data;
    error = res.error;
    // 23505 = violation de contrainte d'unicité (public_id pris) -> on réessaie.
    if (error?.code !== "23505") break;
  }

  if (error || !created)
    return { ok: false, code: 500, error_code: "SERVER", message: "Échec de création du lead" };

  // Historique initial (baseline "new")
  await db.from("status_history").insert({
    order_id: created.id,
    from_status: null,
    to_status: "new",
    note: "Lead reçu via API",
  });

  // Registre des affiliés : garantit que le sous-affilié (affiliate) existe dans
  // la table `affiliate`, rattaché au réseau (affiliateId).
  if (lead.affiliate) {
    await db
      .from("affiliate")
      .upsert({ name: lead.affiliate, network_id: affiliateId }, { onConflict: "network_id,name", ignoreDuplicates: true });
  }

  return { ok: true, lead_id: created.public_id, status: created.status };
}
