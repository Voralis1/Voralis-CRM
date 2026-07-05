import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalCountry } from "@/lib/currency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Endpoint de reporting pour le dashboard CEO Voralis externe.
// Protégé par REPORTING_API_KEY : header "Authorization: Bearer <clé>".
// GET /api/v1/reports/networks?from=YYYY-MM-DD&to=YYYY-MM-DD
function checkAuth(req: Request): boolean {
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return !!process.env.REPORTING_API_KEY && bearer === process.env.REPORTING_API_KEY;
}

const DELIVERED = new Set(["delivered"]);
// Même définition que le rapport Résultats media-buying : confirmée dès que la
// commande a atteint "confirmed" ou une étape ultérieure de la livraison.
// (test_confirmed est une branche à part, elle ne compte pas comme confirmée.)
const CONFIRMED = new Set(["confirmed", "shipped", "in_delivery", "delivered"]);

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error_code: "AUTH", message: "Token invalide" }, { status: 401 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from"); // YYYY-MM-DD, optionnel
  const to = url.searchParams.get("to"); // YYYY-MM-DD, optionnel

  const db = createAdminClient();

  const [{ data: networks, error: netErr }, { data: affiliates, error: affErr }, { data: oldest }, { data: newest }] =
    await Promise.all([
      db.from("affiliate_network").select("id, name, email, status, created_at"),
      db.from("affiliate").select("id, name, network_id, created_at"),
      db.from("orders").select("created_at").order("created_at", { ascending: true }).limit(1),
      db.from("orders").select("created_at").order("created_at", { ascending: false }).limit(1),
    ]);
  if (netErr) return NextResponse.json({ success: false, error_code: "DB", message: netErr.message }, { status: 500 });
  if (affErr) return NextResponse.json({ success: false, error_code: "DB", message: affErr.message }, { status: 500 });

  let ordersQuery = db.from("orders").select("affiliate_id, affiliate, status, payout_amount, country, created_at");
  if (from) ordersQuery = ordersQuery.gte("created_at", from);
  if (to) ordersQuery = ordersQuery.lte("created_at", `${to}T23:59:59`);
  const { data: orders, error: ordErr } = await ordersQuery;
  if (ordErr) return NextResponse.json({ success: false, error_code: "DB", message: ordErr.message }, { status: 500 });

  type Stats = { total_orders: number; confirmed_orders: number; delivered_orders: number; total_payout: number };
  const emptyStats = (): Stats => ({ total_orders: 0, confirmed_orders: 0, delivered_orders: 0, total_payout: 0 });

  const statsByNetwork = new Map<string, Stats>();
  const statsByAffiliateKey = new Map<string, Stats>(); // clé = `${network_id}|${affiliate_name}`
  const statsByCountry = new Map<string, Stats>();

  for (const o of orders ?? []) {
    const netStats = statsByNetwork.get(o.affiliate_id) ?? emptyStats();
    const affKey = `${o.affiliate_id}|${(o.affiliate ?? "").trim()}`;
    const affStats = statsByAffiliateKey.get(affKey) ?? emptyStats();
    const country = canonicalCountry(o.country) || "UNKNOWN";
    const countryStats = statsByCountry.get(country) ?? emptyStats();

    for (const s of [netStats, affStats, countryStats]) {
      s.total_orders += 1;
      // Payout dû dès "confirmed" (cf. project_products.payout_model et
      // /admin/payout), pas seulement à "delivered".
      if (CONFIRMED.has(o.status)) {
        s.confirmed_orders += 1;
        s.total_payout += Number(o.payout_amount) || 0;
      }
      if (DELIVERED.has(o.status)) s.delivered_orders += 1;
    }
    statsByNetwork.set(o.affiliate_id, netStats);
    statsByAffiliateKey.set(affKey, affStats);
    statsByCountry.set(country, countryStats);
  }

  const result = (networks ?? []).map((n) => ({
    id: n.id,
    name: n.name,
    email: n.email,
    status: n.status,
    created_at: n.created_at,
    stats: statsByNetwork.get(n.id) ?? emptyStats(),
    affiliates: (affiliates ?? [])
      .filter((a) => a.network_id === n.id)
      .map((a) => ({
        id: a.id,
        name: a.name,
        created_at: a.created_at,
        stats: statsByAffiliateKey.get(`${n.id}|${a.name}`) ?? emptyStats(),
      })),
  }));

  const totalConfirmedOrders = (orders ?? []).filter((o) => CONFIRMED.has(o.status)).length;

  const byCountry = Array.from(statsByCountry.entries())
    .map(([country, stats]) => ({ country, stats }))
    .sort((a, b) => b.stats.total_payout - a.stats.total_payout);

  return NextResponse.json({
    success: true,
    generated_at: new Date().toISOString(),
    // Période appliquée aux stats ci-dessous (null = aucune borne).
    filters: { from: from ?? null, to: to ?? null },
    // Bornes réelles des commandes en base (non filtrées), pour calibrer un
    // sélecteur de dates côté dashboard externe.
    date_range: {
      oldest_order: oldest?.[0]?.created_at ?? null,
      newest_order: newest?.[0]?.created_at ?? null,
    },
    totals: {
      networks: networks?.length ?? 0,
      affiliates: affiliates?.length ?? 0,
      confirmed_orders: totalConfirmedOrders,
    },
    networks: result,
    // Payout agrégé par pays (payout toujours en dollars, cf. formatPayout).
    by_country: byCountry,
  });
}
