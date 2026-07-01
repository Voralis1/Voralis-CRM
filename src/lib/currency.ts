// Devise par pays (abréviations internes Voralis).
const CURRENCY_BY_COUNTRY: Record<string, string> = {
  SN: "XOF", CI: "XOF", ML: "XOF", BF: "XOF", TG: "XOF", // Franc CFA Ouest (UEMOA)
  BZV: "XAF", GAB: "XAF", // Franc CFA Centre (CEMAC)
  GN: "GNF", // Franc guinéen
  AGO: "AOA", // Kwanza angolais
  NG: "NGN", // Naira nigérian
};

// Certains affiliés/leads envoient le code ISO 2 lettres au lieu du code
// interne 3 lettres attendu. On les fait pointer vers le même pays.
const COUNTRY_ALIASES: Record<string, string> = {
  AO: "AGO", // Angola
  GA: "GAB", // Gabon
  CG: "BZV", // Congo-Brazzaville
};

// Code pays canonique : résout les alias (ex. "AO" -> "AGO") pour que deux
// leads du même pays soient toujours regroupés/identifiés ensemble.
export function canonicalCountry(country?: string | null): string {
  const c = String(country ?? "").trim().toUpperCase();
  return COUNTRY_ALIASES[c] ?? c;
}

// Libellé d'affichage par devise.
const CURRENCY_LABEL: Record<string, string> = {
  XOF: "FCFA",
  XAF: "FCFA",
  GNF: "GNF",
  AOA: "Kz",
  NGN: "₦",
  USD: "$",
};

export function currencyForCountry(country?: string | null): string {
  if (!country) return "";
  return CURRENCY_BY_COUNTRY[canonicalCountry(country)] ?? "";
}

// Libellé de la devise du pays (ex. "FCFA"), vide si pays inconnu.
export function currencyLabelForCountry(country?: string | null): string {
  return CURRENCY_LABEL[currencyForCountry(country)] ?? "";
}

// Prix produit : montant dans la devise du pays. Pays inconnu -> montant seul.
export function formatProductPrice(amount: number | string, country?: string | null): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount ?? "");
  const value = n.toLocaleString("fr-FR");
  const label = currencyLabelForCountry(country);
  return label ? `${value} ${label}` : value;
}

// Payout : toujours en dollars.
export function formatPayout(amount: number | string): string {
  const n = Number(amount);
  return `$${Number.isFinite(n) ? n.toFixed(2) : amount}`;
}
