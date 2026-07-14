import type { OrderStatus } from "@/lib/types";

// Sous-colonnes présentes dans CHAQUE groupe de statut.
export const SUBCOLS = [
  { key: "qty", label: "Qté", kind: "int" },
  { key: "pct", label: "%", kind: "pct" },
  { key: "avgBill", label: "Panier moyen", kind: "money" },
  { key: "sum", label: "Total", kind: "money" },
  { key: "purchasingSum", label: "Montant achats", kind: "money" },
] as const;

export type SubColKey = (typeof SUBCOLS)[number]["key"];
export type CellKind = (typeof SUBCOLS)[number]["kind"];

// Les 6 groupes de statut, avec leur couleur d'en-tête et le mapping vers les
// statuts de commande réels (slugs de la table order_statuses, cf.
// src/lib/orderStatus.ts). Un statut personnalisé n'entre dans aucun de ces
// groupes tant qu'il n'est pas explicitement ajouté ici.
export const STATUS_GROUPS = [
  { key: "approved", label: "Confirmé", color: "#DFF3DF", statuses: ["confirmed"] },
  { key: "canceled", label: "Annulé", color: "#F8D7DA", statuses: ["cancelled", "rejected"] },
  { key: "sent", label: "Expédié", color: "#E8E2FF", statuses: ["shipped"] },
  { key: "paid", label: "Livré", color: "#DFF3DF", statuses: ["delivered"] },
  { key: "returned", label: "Retourné", color: "#F5B7B1", statuses: ["returned"] },
  { key: "in_transit", label: "En livraison", color: "#F9E79F", statuses: ["in_delivery"] },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  color: string;
  statuses: OrderStatus[];
}>;

export type GroupKey = (typeof STATUS_GROUPS)[number]["key"];

// Colonnes de tête (gelées à gauche pour « Product »).
export const LEAD_COLUMNS = [
  { key: "product", label: "Produit", kind: "text", frozen: true },
  { key: "price", label: "Prix", kind: "money" },
  { key: "affiliateNetwork", label: "Réseau d'affiliés", kind: "text" },
  { key: "affiliate", label: "Affilié", kind: "text" },
  { key: "totalOrders", label: "Nombre de commandes", kind: "int" },
] as const;

// Clé d'accès aplatie d'une sous-colonne de groupe (ex. "approved_qty").
export const cellKey = (group: string, sub: string) => `${group}_${sub}`;

// Type de chaque colonne filtrable (clé -> "text" | "int" | "money" | "pct").
export const COLUMN_KINDS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const c of LEAD_COLUMNS) map[c.key] = c.kind;
  for (const g of STATUS_GROUPS) for (const s of SUBCOLS) map[cellKey(g.key, s.key)] = s.kind;
  return map;
})();

export interface StatRow {
  key: string;
  product: string;
  price: number;
  affiliateNetwork: string;
  affiliate: string;
  totalOrders: number;
  // colonnes dynamiques `${group}_${sub}` -> number
  [k: string]: string | number;
}

export interface StatsResponse {
  rows: StatRow[];
  total: number;
  page: number;
  pageSize: number;
}
