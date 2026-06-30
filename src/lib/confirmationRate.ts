// Calcul partagé du taux de confirmation d'un produit à partir des leads.
// confirmés = statut confirmé ou au-delà ; valides = hors duplicate/trash.
const CONFIRMED = new Set(["confirmed", "shipped", "in_delivery", "delivered", "returned", "cancelled"]);
const EXCLUDED = new Set(["duplicate", "trash"]);
const norm = (v: any) => String(v ?? "").trim().toLowerCase();

export type RateOrder = { status: string; offer_id: string | null; product: string | null };

// Rattachement lead↔produit : offer_id == id (manuel) ou nom identique (API),
// insensible à la casse. Renvoie un pourcentage à une décimale.
export function confirmationRateFor(
  product: { id: string; name: string },
  orders: RateOrder[]
): number {
  const pName = norm(product.name);
  const related = orders.filter(
    (o) => o.offer_id === product.id || (o.product && norm(o.product) === pName)
  );
  const valid = related.filter((o) => !EXCLUDED.has(o.status)).length;
  const confirmed = related.filter((o) => CONFIRMED.has(o.status)).length;
  return valid > 0 ? Math.round((confirmed / valid) * 1000) / 10 : 0;
}
