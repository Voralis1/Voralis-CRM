import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac } from "crypto";

type DispatchRow = {
  id: number;
  order_id: string;
  affiliate_id: string;
  status: string;
  method: string;
  attempts: number;
  max_attempts: number;
};

// Remplace les macros {lead_id}, {status}, {payout}, {affiliate}, {sub1}.. par les vraies valeurs.
function resolveTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    encodeURIComponent(vars[key] ?? "")
  );
}

function buildVars(order: any, product: any): Record<string, string> {
  // {payout} n'est renseigné que sur les statuts facturables (payout_amount posé en base).
  const billable = order.payout_amount != null;
  return {
    lead_id: order.public_id,
    status: order.status,
    status_label: order.status,
    product_id: order.product_id ?? "",
    country: order.country ?? "",
    payout: billable ? String(order.payout_amount) : "0",
    currency: order.payout_currency ?? product?.currency ?? "USD",
    quantity: String(order.quantity ?? 1),
    comment: order.comment ?? "",
    affiliate: order.affiliate ?? "",
    sub1: order.sub1 ?? "",
    sub2: order.sub2 ?? "",
    sub3: order.sub3 ?? "",
    sub4: order.sub4 ?? "",
    sub5: order.sub5 ?? "",
    timestamp: new Date().toISOString(),
  };
}

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// Traite jusqu'à `limit` postbacks en attente (ou en échec sous max_attempts).
// Appelé par le cron /api/internal/dispatch, inline après un changement de
// statut, ET inline après la création d'un lead (avec `orderId` fourni pour
// ne dispatcher QUE le postback de ce lead précis, sans latence ajoutée par
// le backlog global d'autres affiliés sur l'API publique de création).
export async function dispatchPending(limit = 25, orderId?: string): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const db = createAdminClient();

  let query = db
    .from("postbacks")
    .select("id, order_id, affiliate_id, status, method, attempts, max_attempts")
    .in("state", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(limit);
  if (orderId) query = query.eq("order_id", orderId);
  const { data: rows } = await query;

  if (!rows || rows.length === 0) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const pb of rows as DispatchRow[]) {
    if (pb.attempts >= pb.max_attempts) {
      await db.from("postbacks").update({ state: "failed" }).eq("id", pb.id);
      failed++;
      continue;
    }

    const { data: order } = await db
      .from("orders").select("*").eq("id", pb.order_id).single();
    const { data: aff } = await db
      .from("affiliate_network").select("*").eq("id", pb.affiliate_id).single();

    if (!order || !aff || !aff.postback_url) {
      await db.from("postbacks")
        .update({ state: "failed", attempts: pb.attempts + 1, response_body: "order/affilié/url manquant" })
        .eq("id", pb.id);
      failed++;
      continue;
    }

    // product_id est optionnel : un lead peut ne pas être rattaché à un produit du catalogue.
    const { data: product } = order.product_id
      ? await db.from("project_products").select("currency").eq("id", order.product_id).single()
      : { data: null };

    const vars = buildVars(order, product);
    const method = (pb.method || aff.postback_method || "GET").toUpperCase();

    let url = aff.postback_url as string;
    let body: string | undefined;
    const headers: Record<string, string> = {};

    if (method === "POST") {
      body = JSON.stringify(vars);
      headers["Content-Type"] = "application/json";
      headers["X-Voralis-Signature"] = sign(aff.signature_secret, body);
    } else {
      url = resolveTemplate(url, vars);
    }

    let httpStatus = 0;
    let respText = "";
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(url, { method, headers, body, signal: ctrl.signal });
      clearTimeout(timer);
      httpStatus = res.status;
      respText = (await res.text()).slice(0, 500);
    } catch (e: any) {
      respText = "fetch error: " + (e?.message ?? "unknown");
    }

    const ok = httpStatus >= 200 && httpStatus < 300;
    const attempts = pb.attempts + 1;
    await db.from("postbacks").update({
      url,
      payload: vars,
      attempts,
      http_status: httpStatus || null,
      response_body: respText,
      state: ok ? "sent" : attempts >= pb.max_attempts ? "failed" : "pending",
      last_attempt_at: new Date().toISOString(),
    }).eq("id", pb.id);

    ok ? sent++ : failed++;
  }

  return { processed: rows.length, sent, failed };
}
