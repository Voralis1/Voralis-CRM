// Garde-fou anti-erreur de saisie sur le payout d'un produit (project_products.payout).
//
// Contexte : le payout est une commission en USD (toujours quelques dollars
// dans ce métier), tandis que price est le prix catalogue en devise locale
// (souvent des dizaines de milliers de XOF/GNF/AOA). Une confusion entre les
// deux champs (ex. payout=50000 au lieu de 8) fige un payout aberrant sur
// chaque commande créée tant que le produit n'est pas corrigé — voir
// ingestLead() dans src/lib/leads.ts qui copie project_products.payout sur
// orders.payout_amount dès la création du lead.
const MAX_SANE_PAYOUT_USD = 1000;

export function validateProductPayout(price: number, payout: number): string | null {
  if (payout < 0) return "Le payout ne peut pas être négatif.";
  if (payout > MAX_SANE_PAYOUT_USD)
    return `Payout suspect (${payout}$) : supérieur à ${MAX_SANE_PAYOUT_USD}$. Vérifiez qu'il n'y a pas eu de confusion avec le prix catalogue (devise locale).`;
  if (price > 0 && payout >= price)
    return "Le payout (en USD) est égal ou supérieur au prix catalogue (devise locale) : vérifiez qu'il n'y a pas eu de confusion entre les deux champs.";
  return null;
}
