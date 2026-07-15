// Devise par pays (abréviations internes Voralis).
// Historique : mapping manuel restreint aux pays effectivement traités par
// Voralis à l'origine. Conservé tel quel pour ne rien changer au comportement
// existant (canonicalCountry() en dépend pour le regroupement/affichage).
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

// ---------------------------------------------------------------------
// Couverture mondiale : devise officielle par pays, en repli du mapping
// historique ci-dessus. Indexé par ISO 3166-1 alpha-2 (ISO 4217).
// ---------------------------------------------------------------------
const ALPHA2_CURRENCY: Record<string, string> = {
  // Afrique
  DZ: "DZD", AO: "AOA", BJ: "XOF", BW: "BWP", BF: "XOF", BI: "BIF", CV: "CVE",
  CM: "XAF", CF: "XAF", TD: "XAF", KM: "KMF", CG: "XAF", CD: "CDF", CI: "XOF",
  DJ: "DJF", EG: "EGP", GQ: "XAF", ER: "ERN", SZ: "SZL", ET: "ETB", GA: "XAF",
  GM: "GMD", GH: "GHS", GN: "GNF", GW: "XOF", KE: "KES", LS: "LSL", LR: "LRD",
  LY: "LYD", MG: "MGA", MW: "MWK", ML: "XOF", MR: "MRU", MU: "MUR", MA: "MAD",
  MZ: "MZN", NA: "NAD", NE: "XOF", NG: "NGN", RW: "RWF", ST: "STN", SN: "XOF",
  SC: "SCR", SL: "SLE", SO: "SOS", ZA: "ZAR", SS: "SSP", SD: "SDG", TZ: "TZS",
  TG: "XOF", TN: "TND", UG: "UGX", ZM: "ZMW", ZW: "ZWL",

  // Amériques
  AG: "XCD", AR: "ARS", BS: "BSD", BB: "BBD", BZ: "BZD", BO: "BOB", BR: "BRL",
  CA: "CAD", CL: "CLP", CO: "COP", CR: "CRC", CU: "CUP", DM: "XCD", DO: "DOP",
  EC: "USD", SV: "USD", GD: "XCD", GT: "GTQ", GY: "GYD", HT: "HTG", HN: "HNL",
  JM: "JMD", MX: "MXN", NI: "NIO", PA: "PAB", PY: "PYG", PE: "PEN", KN: "XCD",
  LC: "XCD", VC: "XCD", SR: "SRD", TT: "TTD", US: "USD", UY: "UYU", VE: "VES",

  // Asie
  AF: "AFN", AM: "AMD", AZ: "AZN", BH: "BHD", BD: "BDT", BT: "BTN", BN: "BND",
  KH: "KHR", CN: "CNY", CY: "EUR", GE: "GEL", IN: "INR", ID: "IDR", IR: "IRR",
  IQ: "IQD", IL: "ILS", JP: "JPY", JO: "JOD", KZ: "KZT", KW: "KWD", KG: "KGS",
  LA: "LAK", LB: "LBP", MY: "MYR", MV: "MVR", MN: "MNT", MM: "MMK", NP: "NPR",
  KP: "KPW", OM: "OMR", PK: "PKR", PS: "ILS", PH: "PHP", QA: "QAR", SA: "SAR",
  SG: "SGD", KR: "KRW", LK: "LKR", SY: "SYP", TW: "TWD", TJ: "TJS", TH: "THB",
  TL: "USD", TR: "TRY", TM: "TMT", AE: "AED", UZ: "UZS", VN: "VND", YE: "YER",

  // Europe
  AL: "ALL", AD: "EUR", AT: "EUR", BY: "BYN", BE: "EUR", BA: "BAM", BG: "BGN",
  HR: "EUR", CZ: "CZK", DK: "DKK", EE: "EUR", FI: "EUR", FR: "EUR", DE: "EUR",
  GR: "EUR", HU: "HUF", IS: "ISK", IE: "EUR", IT: "EUR", XK: "EUR", LV: "EUR",
  LI: "CHF", LT: "EUR", LU: "EUR", MT: "EUR", MD: "MDL", MC: "EUR", ME: "EUR",
  NL: "EUR", MK: "MKD", NO: "NOK", PL: "PLN", PT: "EUR", RO: "RON", RU: "RUB",
  SM: "EUR", RS: "RSD", SK: "EUR", SI: "EUR", ES: "EUR", SE: "SEK", CH: "CHF",
  UA: "UAH", GB: "GBP", VA: "EUR",

  // Océanie
  AU: "AUD", FJ: "FJD", KI: "AUD", MH: "USD", FM: "USD", NR: "AUD", NZ: "NZD",
  PW: "USD", PG: "PGK", WS: "WST", SB: "SBD", TO: "TOP", TV: "AUD", VU: "VUV",
};

// ISO 3166-1 alpha-3 -> alpha-2, pour accepter les codes 3 lettres standards
// (en plus des codes internes historiques ci-dessus : BZV, GAB, AGO).
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  DZA: "DZ", AGO: "AO", BEN: "BJ", BWA: "BW", BFA: "BF", BDI: "BI", CPV: "CV",
  CMR: "CM", CAF: "CF", TCD: "TD", COM: "KM", COG: "CG", COD: "CD", CIV: "CI",
  DJI: "DJ", EGY: "EG", GNQ: "GQ", ERI: "ER", SWZ: "SZ", ETH: "ET", GAB: "GA",
  GMB: "GM", GHA: "GH", GIN: "GN", GNB: "GW", KEN: "KE", LSO: "LS", LBR: "LR",
  LBY: "LY", MDG: "MG", MWI: "MW", MLI: "ML", MRT: "MR", MUS: "MU", MAR: "MA",
  MOZ: "MZ", NAM: "NA", NER: "NE", NGA: "NG", RWA: "RW", STP: "ST", SEN: "SN",
  SYC: "SC", SLE: "SL", SOM: "SO", ZAF: "ZA", SSD: "SS", SDN: "SD", TZA: "TZ",
  TGO: "TG", TUN: "TN", UGA: "UG", ZMB: "ZM", ZWE: "ZW",

  ATG: "AG", ARG: "AR", BHS: "BS", BRB: "BB", BLZ: "BZ", BOL: "BO", BRA: "BR",
  CAN: "CA", CHL: "CL", COL: "CO", CRI: "CR", CUB: "CU", DMA: "DM", DOM: "DO",
  ECU: "EC", SLV: "SV", GRD: "GD", GTM: "GT", GUY: "GY", HTI: "HT", HND: "HN",
  JAM: "JM", MEX: "MX", NIC: "NI", PAN: "PA", PRY: "PY", PER: "PE", KNA: "KN",
  LCA: "LC", VCT: "VC", SUR: "SR", TTO: "TT", USA: "US", URY: "UY", VEN: "VE",

  AFG: "AF", ARM: "AM", AZE: "AZ", BHR: "BH", BGD: "BD", BTN: "BT", BRN: "BN",
  KHM: "KH", CHN: "CN", CYP: "CY", GEO: "GE", IND: "IN", IDN: "ID", IRN: "IR",
  IRQ: "IQ", ISR: "IL", JPN: "JP", JOR: "JO", KAZ: "KZ", KWT: "KW", KGZ: "KG",
  LAO: "LA", LBN: "LB", MYS: "MY", MDV: "MV", MNG: "MN", MMR: "MM", NPL: "NP",
  PRK: "KP", OMN: "OM", PAK: "PK", PSE: "PS", PHL: "PH", QAT: "QA", SAU: "SA",
  SGP: "SG", KOR: "KR", LKA: "LK", SYR: "SY", TWN: "TW", TJK: "TJ", THA: "TH",
  TLS: "TL", TUR: "TR", TKM: "TM", ARE: "AE", UZB: "UZ", VNM: "VN", YEM: "YE",

  ALB: "AL", AND: "AD", AUT: "AT", BLR: "BY", BEL: "BE", BIH: "BA", BGR: "BG",
  HRV: "HR", CZE: "CZ", DNK: "DK", EST: "EE", FIN: "FI", FRA: "FR", DEU: "DE",
  GRC: "GR", HUN: "HU", ISL: "IS", IRL: "IE", ITA: "IT", XKX: "XK", LVA: "LV",
  LIE: "LI", LTU: "LT", LUX: "LU", MLT: "MT", MDA: "MD", MCO: "MC", MNE: "ME",
  NLD: "NL", MKD: "MK", NOR: "NO", POL: "PL", PRT: "PT", ROU: "RO", RUS: "RU",
  SMR: "SM", SRB: "RS", SVK: "SK", SVN: "SI", ESP: "ES", SWE: "SE", CHE: "CH",
  UKR: "UA", GBR: "GB", VAT: "VA",

  AUS: "AU", FJI: "FJ", KIR: "KI", MHL: "MH", FSM: "FM", NRU: "NR", NZL: "NZ",
  PLW: "PW", PNG: "PG", WSM: "WS", SLB: "SB", TON: "TO", TUV: "TV", VUT: "VU",

  // Codes internes Voralis non-ISO, conservés pour compatibilité.
  BZV: "CG",
};

// Résout un code pays (2 ou 3 lettres, ISO ou interne) vers l'ISO alpha-2.
function toAlpha2(country: string): string {
  if (country.length === 2) return country;
  if (country.length === 3) return ALPHA3_TO_ALPHA2[country] ?? country;
  return country;
}

// Libellé d'affichage par devise. Les devises non listées ici s'affichent
// simplement avec leur code ISO 4217 (voir currencyLabelForCountry).
const CURRENCY_LABEL: Record<string, string> = {
  XOF: "FCFA",
  XAF: "FCFA",
  GNF: "GNF",
  AOA: "Kz",
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  ZAR: "R",
  GHS: "₵",
  KES: "KSh",
  MAD: "DH",
  EGP: "E£",
  BRL: "R$",
  CAD: "$",
  AUD: "$",
  CHF: "CHF",
  TRY: "₺",
  RUB: "₽",
  KRW: "₩",
};

export function currencyForCountry(country?: string | null): string {
  if (!country) return "";
  const c = String(country).trim().toUpperCase();
  // 1) Mapping historique (codes internes Voralis, priorité pour ne rien changer).
  const legacy = CURRENCY_BY_COUNTRY[canonicalCountry(c)];
  if (legacy) return legacy;
  // 2) Repli : couverture mondiale ISO, pour tout pays non listé ci-dessus.
  return ALPHA2_CURRENCY[toAlpha2(c)] ?? "";
}

// Libellé de la devise du pays (ex. "FCFA", ou le code ISO si aucun libellé
// dédié n'est défini pour cette devise). Vide seulement si le pays est inconnu.
export function currencyLabelForCountry(country?: string | null): string {
  const code = currencyForCountry(country);
  if (!code) return "";
  return CURRENCY_LABEL[code] ?? code;
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
