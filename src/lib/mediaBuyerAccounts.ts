// Détermine quels comptes publicitaires (media_spend.account_name) appartiennent
// à quel media buyer. Depuis le remplacement de la table media_spend par un
// import externe, il n'y a plus de colonne media_buyer_id : l'appartenance se
// déduit par correspondance de nom avec profiles.full_name. Le compte "Fgmed"
// sert de générique/catch-all : il récupère tout account_name qui ne
// correspond au nom d'aucun autre media buyer (ex. comptes pub partagés comme
// "caresnesair 1", pas nommés d'après une personne).
const FALLBACK_BUYER_NAME = "fgmed";

export function accountNameBelongsToBuyer(
  accountName: string | null | undefined,
  buyerFullName: string | null | undefined,
  allBuyerFullNames: (string | null | undefined)[]
): boolean {
  const acc = String(accountName ?? "").trim().toLowerCase();
  const buyer = String(buyerFullName ?? "").trim().toLowerCase();
  if (!acc || !buyer) return false;
  if (acc === buyer) return true;
  if (buyer === FALLBACK_BUYER_NAME) {
    const claimed = new Set(allBuyerFullNames.map((n) => String(n ?? "").trim().toLowerCase()).filter(Boolean));
    return !claimed.has(acc);
  }
  return false;
}
