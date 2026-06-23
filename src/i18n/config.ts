// Configuration i18n — français par défaut, anglais en option.
export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

// Nom du cookie (et de la clé localStorage) mémorisant la langue choisie.
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return value === "fr" || value === "en";
}
