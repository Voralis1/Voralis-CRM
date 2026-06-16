import { createClient } from "@/lib/supabase/server";
import StatisticsBoard from "./StatisticsBoard.client";

export const dynamic = "force-dynamic";

type OrderRow = {
  affiliate_id: string;
  affiliates: { name: string | null } | null;
  offer_id: string;
  offers: { product: string | null } | null;
  status: string;
  payout_amount: number | null;
  created_at: string;
};

// Statuts considérés comme "facturables" / qualité de lead
const CONFIRMED = "confirmed";
const DELIVERED = "delivered";
const INVALID = new Set(["trash", "duplicate", "rejected", "cancelled", "returned"]);

export interface StatRow {
  key: string;
  label: string;
  total: number;
  confirmed: number;
  delivered: number;
  invalid: number;
  confirmRate: number;
  deliveryRate: number;
  invalidRate: number;
  payout: number;
}

function buildStats(
  rows: OrderRow[],
  keyOf: (o: OrderRow) => string,
  labelOf: (o: OrderRow) => string
): StatRow[] {
  const map = new Map<string, StatRow>();

  for (const o of rows) {
    const key = keyOf(o);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: labelOf(o),
        total: 0,
        confirmed: 0,
        delivered: 0,
        invalid: 0,
        confirmRate: 0,
        deliveryRate: 0,
        invalidRate: 0,
        payout: 0,
      });
    }
    const s = map.get(key)!;
    s.total += 1;
    if (o.status === CONFIRMED) s.confirmed += 1;
    if (o.status === DELIVERED) s.delivered += 1;
    if (INVALID.has(o.status)) s.invalid += 1;
    if (o.payout_amount != null) s.payout += Number(o.payout_amount);
  }

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

  return Array.from(map.values())
    .map((s) => ({
      ...s,
      confirmRate: pct(s.confirmed, s.total),
      deliveryRate: pct(s.delivered, s.total),
      invalidRate: pct(s.invalid, s.total),
    }))
    .sort((a, b) => b.total - a.total);
}

export default async function StatisticsPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "affiliate_id, affiliates(name), offer_id, offers(product), status, payout_amount, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = (data ?? []) as unknown as OrderRow[];

  const affiliateStats = buildStats(
    rows,
    (o) => o.affiliate_id,
    (o) => o.affiliates?.name ?? "Inconnu"
  );

  const productStats = buildStats(
    rows,
    (o) => o.offers?.product ?? o.offer_id,
    (o) => o.offers?.product ?? o.offer_id ?? "Inconnu"
  );

  const totals = {
    total: rows.length,
    confirmed: rows.filter((o) => o.status === CONFIRMED).length,
    delivered: rows.filter((o) => o.status === DELIVERED).length,
    payout: rows.reduce((acc, o) => acc + Number(o.payout_amount ?? 0), 0),
  };

  return (
    <StatisticsBoard
      affiliateStats={affiliateStats}
      productStats={productStats}
      totals={totals}
    />
  );
}
