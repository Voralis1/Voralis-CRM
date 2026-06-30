// Devise par pays (abréviations internes Voralis).
const CURRENCY_BY_COUNTRY: Record<string, string> = {
  SN: "XOF", CI: "XOF", ML: "XOF", BF: "XOF", TG: "XOF", // Franc CFA Ouest (UEMOA)
  BZV: "XAF", GAB: "XAF", // Franc CFA Centre (CEMAC)
  GN: "GNF", // Franc guinéen
  AGO: "AOA", // Kwanza angolais
  NG: "NGN", // Naira nigérian
};

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
  return CURRENCY_BY_COUNTRY[country.trim().toUpperCase()] ?? "";
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
