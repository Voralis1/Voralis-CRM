import { createAdminClient } from "@/lib/supabase/admin";
import { nextOrderPublicId } from "@/lib/orderId";
import { dispatchPending } from "@/lib/postback";
import type { LeadInput } from "@/lib/validation";

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

  // Produit : l'affilié peut envoyer product_id (recommandé, plus fiable)
  //     OU product_name (nom exact, insensible à la casse). product_id est
  //     prioritaire si les deux sont fournis. La commission (payout, toujours
  //     en dollars) est récupérée du produit trouvé. Aucune correspondance ->
  //     on garde la valeur reçue en texte libre (colonne `product`) et
  //     product_id reste vide (contrainte FK).
  let payoutAmount: number | null = null;
  let payoutCurrency: string | null = null;
  let productName: string | null = null;
  let productId: string | null = null;

  if (lead.product_id) {
    const prod = (
      await db.from("project_products").select("id, name, payout").eq("id", lead.product_id).maybeSingle()
    ).data;
    if (prod) {
      productId = prod.id;
      productName = prod.name;
      if (prod.payout != null) {
        payoutAmount = Number(prod.payout);
        payoutCurrency = "USD";
      }
    } else {
      productName = lead.product_id;
    }
  } else if (lead.product_name) {
    const prod = (
      await db.from("project_products").select("id, name, payout").ilike("name", lead.product_name).maybeSingle()
    ).data;
    if (prod) {
      productId = prod.id;
      productName = prod.name;
      if (prod.payout != null) {
        payoutAmount = Number(prod.payout);
        payoutCurrency = "USD";
      }
    } else {
      productName = lead.product_name;
    }
  }

  // Insertion avec un identifiant public numérique (retry si collision).
  const baseRow = {
    affiliate_id: affiliateId,
    product_id: productId,
    product: productName,
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
    sub1: lead.sub1 ?? null,
    sub2: lead.sub2 ?? null,
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

  // Envoi immédiat du postback "new" (enfilé par le trigger DB à l'insertion
  // ci-dessus), best-effort : borné à ce seul lead pour ne pas ajouter la
  // latence du backlog global d'autres affiliés sur cette API publique.
  try {
    await dispatchPending(1, created.id);
  } catch {
    /* le cron réessaiera */
  }

  return { ok: true, lead_id: created.public_id, status: created.status };
}
