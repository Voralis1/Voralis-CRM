// Calcul partagé du taux de confirmation d'un produit à partir des leads.
// confirmés = statut confirmé ou au-delà ; valides = hors spam.
const CONFIRMED = new Set(["confirmed", "cancelled"]);
const EXCLUDED = new Set(["spam"]);
const norm = (v: any) => String(v ?? "").trim().toLowerCase();

export type RateOrder = { status: string; product_id: string | null; product: string | null };

// Rattachement lead↔produit : product_id == id (manuel) ou nom identique (API),
// insensible à la casse. Renvoie un pourcentage à une décimale.
export function confirmationRateFor(
  product: { id: string; name: string },
  orders: RateOrder[]
): number {
  const pName = norm(product.name);
  const related = orders.filter(
    (o) => o.product_id === product.id || (o.product && norm(o.product) === pName)
  );
  const valid = related.filter((o) => !EXCLUDED.has(o.status)).length;
  const confirmed = related.filter((o) => CONFIRMED.has(o.status)).length;
  return valid > 0 ? Math.round((confirmed / valid) * 1000) / 10 : 0;
}

// Variante utilisée sur les pages produits de l'espace affilié : taux =
// confirmées / (confirmées + annulées). Mêmes groupes de statut que les
// statistiques admin (cf. STATUS_GROUPS "approved"/"canceled").
const CONFIRMED_ONLY = new Set(["confirmed"]);
const CANCELLED_ONLY = new Set(["cancelled"]);

export function affiliateConfirmationRateFor(
  product: { id: string; name: string },
  orders: RateOrder[]
): number {
  const pName = norm(product.name);
  const related = orders.filter(
    (o) => o.product_id === product.id || (o.product && norm(o.product) === pName)
  );
  const confirmed = related.filter((o) => CONFIRMED_ONLY.has(o.status)).length;
  const cancelled = related.filter((o) => CANCELLED_ONLY.has(o.status)).length;
  const denom = confirmed + cancelled;
  return denom > 0 ? Math.round((confirmed / denom) * 1000) / 10 : 0;
}
