export type OrderStatus =
  | "new" | "duplicate" | "trash"
  | "processing" | "no_answer" | "callback" | "confirmed" | "test_confirmed" | "rejected"
  | "shipped" | "in_delivery" | "delivered" | "returned" | "cancelled";

export type StatusGroup = "Réception" | "Centre d'appel" | "Logistique";

export const STATUS_META: Record<
  OrderStatus,
  { label: string; group: StatusGroup; color: string }
> = {
  new:         { label: "Nouveau",          group: "Réception",      color: "bg-slate-100 text-slate-700" },
  duplicate:   { label: "Doublon",          group: "Réception",      color: "bg-slate-100 text-slate-500" },
  trash:       { label: "Invalide",         group: "Réception",      color: "bg-slate-100 text-slate-400" },
  processing:  { label: "En traitement",    group: "Centre d'appel", color: "bg-amber-100 text-amber-800" },
  no_answer:   { label: "Injoignable",      group: "Centre d'appel", color: "bg-orange-100 text-orange-800" },
  callback:    { label: "Rappel programmé", group: "Centre d'appel", color: "bg-yellow-100 text-yellow-800" },
  confirmed:   { label: "Confirmé",         group: "Centre d'appel", color: "bg-emerald-100 text-emerald-800" },
  test_confirmed: { label: "Test confirmé", group: "Centre d'appel", color: "bg-cyan-100 text-cyan-800" },
  rejected:    { label: "Annulé (client)",  group: "Centre d'appel", color: "bg-rose-100 text-rose-700" },
  shipped:     { label: "Expédié",          group: "Logistique",     color: "bg-sky-100 text-sky-800" },
  in_delivery: { label: "En livraison",     group: "Logistique",     color: "bg-blue-100 text-blue-800" },
  delivered:   { label: "Livré",            group: "Logistique",     color: "bg-green-200 text-green-900" },
  returned:    { label: "Retourné",         group: "Logistique",     color: "bg-red-100 text-red-700" },
  cancelled:   { label: "Annulé",           group: "Logistique",     color: "bg-red-50 text-red-600" },
};

export const ALL_STATUSES = Object.keys(STATUS_META) as OrderStatus[];

// Transitions proposées dans le back-office (depuis un statut donné).
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  new:         ["processing", "test_confirmed", "duplicate", "trash"],
  duplicate:   ["processing", "trash"],
  trash:       ["new"],
  processing:  ["confirmed", "test_confirmed", "no_answer", "callback", "rejected"],
  no_answer:   ["processing", "confirmed", "rejected"],
  callback:    ["processing", "confirmed", "rejected"],
  confirmed:   ["shipped", "cancelled"],
  test_confirmed: ["processing", "cancelled"],
  rejected:    ["processing"],
  shipped:     ["in_delivery", "returned"],
  in_delivery: ["delivered", "returned"],
  delivered:   ["returned"],
  returned:    ["in_delivery"],
  cancelled:   ["processing"],
};

export type Affiliate = {
  id: string;
  name: string;
  email: string | null;
  api_token: string;
  postback_url: string | null;
  postback_method: string;
  signature_secret: string;
  status: string;
};

export type Offer = {
  id: string;
  name: string;
  product: string | null;
  country: string;
  payout: number;
  currency: string;
  payout_model: "confirmed" | "delivered";
  status: string;
};

export type Order = {
  id: string;
  public_id: string;
  affiliate_id: string;
  offer_id: string | null;
  product: string | null;
  first_name: string;
  last_name: string | null;
  phone: string;
  country: string | null;
  address: string | null;
  city: string | null;
  quantity: number;
  ip: string | null;
  affiliate: string | null;
  sub3: string | null; sub4: string | null; sub5: string | null;
  comment: string | null;
  status: OrderStatus;
  payout_amount: number | null;
  payout_currency: string | null;
  created_at: string;
  updated_at: string;
};
