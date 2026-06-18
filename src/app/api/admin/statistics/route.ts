import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATUS_GROUPS, cellKey, COLUMN_KINDS, type StatRow } from "@/app/admin/statistics/config";
import type { OrderStatus } from "@/lib/types";

// Construit un prédicat numérique à partir d'une expression : ">100", "<=50",
// "10-20" (plage), "=5", ou un nombre seul (interprété comme ">=").
function numericPredicate(expr: string): ((v: number) => boolean) | null {
  const e = expr.trim();
  const range = e.match(/^(-?\d+(?:[.,]\d+)?)\s*(?:\.\.|-)\s*(-?\d+(?:[.,]\d+)?)$/);
  if (range) {
    const a = parseFloat(range[1].replace(",", "."));
    const b = parseFloat(range[2].replace(",", "."));
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return (v) => v >= lo && v <= hi;
  }
  const op = e.match(/^(>=|<=|>|<|=)?\s*(-?\d+(?:[.,]\d+)?)$/);
  if (!op) return null;
  const n = parseFloat(op[2].replace(",", "."));
  switch (op[1]) {
    case ">": return (v) => v > n;
    case "<": return (v) => v < n;
    case "<=": return (v) => v <= n;
    case "=": return (v) => v === n;
    case ">=":
    default: return (v) => v >= n; // nombre seul -> "au moins"
  }
}

function rowMatchesFilters(row: StatRow, filters: Record<string, string>): boolean {
  for (const [col, raw] of Object.entries(filters)) {
    const needle = raw.trim();
    if (!needle) continue;
    const kind = COLUMN_KINDS[col];
    if (!kind) continue;
    const value = row[col as keyof StatRow];
    if (kind === "text") {
      if (!String(value ?? "").toLowerCase().includes(needle.toLowerCase())) return false;
    } else {
      const pred = numericPredicate(needle);
      if (pred && !pred(Number(value ?? 0))) return false;
    }
  }
  return true;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// statut -> clé de groupe (pré-calculé une fois)
const STATUS_TO_GROUP = new Map<string, string>();
for (const g of STATUS_GROUPS) for (const s of g.statuses) STATUS_TO_GROUP.set(s, g.key);

type TextDim = "product" | "affiliateNetwork" | "affiliate";

type Acc = StatRow & {
  _avgBase: Record<string, { sum: number; qty: number }>;
  _priceSum: number;
  // valeur représentative + indicateur « valeurs multiples » par dimension texte
  _dim: Record<TextDim, { val: string; mixed: boolean }>;
};

const GROUP_BY_OPTIONS = ["none", "product", "price", "affiliateNetwork", "affiliate"] as const;
type GroupBy = (typeof GROUP_BY_OPTIONS)[number];

export async function GET(req: Request) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "agent")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? "50")));
  const sortBy = url.searchParams.get("sortBy") ?? "totalOrders";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const rawGroupBy = url.searchParams.get("groupBy") ?? "none";
  const groupBy: GroupBy = (GROUP_BY_OPTIONS as readonly string[]).includes(rawGroupBy)
    ? (rawGroupBy as GroupBy)
    : "none";

  let filters: Record<string, string> = {};
  const rawFilters = url.searchParams.get("filters");
  if (rawFilters) {
    try {
      const parsed = JSON.parse(rawFilters);
      if (parsed && typeof parsed === "object") filters = parsed;
    } catch {
      /* filtres invalides -> ignorés */
    }
  }
  const hasFilters = Object.values(filters).some((v) => v && v.trim() !== "");

  const db = createAdminClient();
  const { data, error } = await db
    .from("orders")
    .select("offer_id, offers(product, payout), affiliate_id, affiliates(name), status, payout_amount, quantity")
    .limit(10000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = new Map<string, Acc>();

  for (const o of (data ?? []) as any[]) {
    const product = o.offers?.product ?? o.offer_id ?? "—";
    const price = Number(o.offers?.payout ?? 0);
    const affiliate = o.affiliate_id ?? "—";
    const network = o.affiliates?.name ?? "Inconnu";
    const dimVals: Record<TextDim, string> = {
      product,
      affiliateNetwork: network,
      affiliate,
    };

    // Clé d'agrégation selon « groupBy » (none = produit × affilié).
    let key: string;
    if (groupBy === "none") key = `${product}||${affiliate}`;
    else if (groupBy === "price") key = `price:${price}`;
    else key = dimVals[groupBy];

    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        product,
        price: 0,
        affiliateNetwork: network,
        affiliate,
        totalOrders: 0,
        _avgBase: {},
        _priceSum: 0,
        _dim: {
          product: { val: product, mixed: false },
          affiliateNetwork: { val: network, mixed: false },
          affiliate: { val: affiliate, mixed: false },
        },
      } as Acc;
      for (const g of STATUS_GROUPS) {
        row[cellKey(g.key, "qty")] = 0;
        row[cellKey(g.key, "pct")] = 0;
        row[cellKey(g.key, "avgBill")] = 0;
        row[cellKey(g.key, "sum")] = 0;
        row[cellKey(g.key, "purchasingSum")] = 0;
        row._avgBase[g.key] = { sum: 0, qty: 0 };
      }
      rows.set(key, row);
    }

    // Détecte les dimensions à valeurs multiples (afficheront « — »).
    for (const d of ["product", "affiliateNetwork", "affiliate"] as TextDim[]) {
      if (row._dim[d].val !== dimVals[d]) row._dim[d].mixed = true;
    }

    row.totalOrders += 1;
    row._priceSum += price;

    const groupKey = STATUS_TO_GROUP.get(o.status as OrderStatus);
    if (groupKey) {
      const qty = Number(o.quantity ?? 1);
      const purchasing = price * qty;
      const realized = Number(o.payout_amount ?? 0);
      row[cellKey(groupKey, "qty")] = (row[cellKey(groupKey, "qty")] as number) + 1;
      row[cellKey(groupKey, "purchasingSum")] =
        (row[cellKey(groupKey, "purchasingSum")] as number) + purchasing;
      row[cellKey(groupKey, "sum")] = (row[cellKey(groupKey, "sum")] as number) + realized;
      row._avgBase[groupKey].sum += purchasing;
      row._avgBase[groupKey].qty += 1;
    }
  }

  // Finalisation : % (part du total) et Avg bill (Purchasing sum / Q-ty).
  const finalRows: StatRow[] = [];
  for (const row of rows.values()) {
    for (const g of STATUS_GROUPS) {
      const qty = row[cellKey(g.key, "qty")] as number;
      row[cellKey(g.key, "pct")] =
        row.totalOrders > 0 ? Math.round((qty / row.totalOrders) * 1000) / 10 : 0;
      const base = row._avgBase[g.key];
      row[cellKey(g.key, "avgBill")] = base.qty > 0 ? base.sum / base.qty : 0;
    }
    // Prix = prix moyen des commandes de la ligne (constant si une seule offre).
    row.price = row.totalOrders > 0 ? row._priceSum / row.totalOrders : 0;
    // Dimensions texte : « — » quand la ligne regroupe plusieurs valeurs.
    row.product = row._dim.product.mixed ? "—" : row._dim.product.val;
    row.affiliateNetwork = row._dim.affiliateNetwork.mixed ? "—" : row._dim.affiliateNetwork.val;
    row.affiliate = row._dim.affiliate.mixed ? "—" : row._dim.affiliate.val;
    const { _avgBase, _priceSum, _dim, ...clean } = row;
    if (!hasFilters || rowMatchesFilters(clean, filters)) finalRows.push(clean);
  }

  // Tri serveur sur n'importe quelle colonne.
  finalRows.sort((a, b) => {
    const va = a[sortBy as keyof StatRow];
    const vb = b[sortBy as keyof StatRow];
    let cmp: number;
    if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
    else cmp = String(va ?? "").localeCompare(String(vb ?? ""));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const total = finalRows.length;
  const start = (page - 1) * pageSize;
  const paged = finalRows.slice(start, start + pageSize);

  return NextResponse.json({ rows: paged, total, page, pageSize });
}
