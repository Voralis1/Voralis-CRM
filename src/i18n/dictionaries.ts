import { fr, type Messages } from "./messages/fr";
import { en } from "./messages/en";
import type { Locale } from "./config";

export type { Messages };

// Rend chaque champ optionnel en profondeur (pour le dictionnaire anglais partiel).
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Fusion profonde : `override` (en) écrase `base` (fr) ; les clés absentes
// gardent la valeur française -> fallback automatique.
function deepMerge<T>(base: T, override: any): T {
  if (override == null) return base;
  const out: any = { ...base };
  for (const key of Object.keys(override)) {
    const b: any = (base as any)?.[key];
    const o: any = override[key];
    out[key] =
      o && typeof o === "object" && !Array.isArray(o) && b && typeof b === "object"
        ? deepMerge(b, o)
        : o ?? b;
  }
  return out;
}

const dictionaries: Record<Locale, Messages> = {
  fr,
  en: deepMerge(fr, en),
};

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries.fr;
}

export type TFunc = (key: string) => string;

// Traducteur : `t("nav.orders")`. Renvoie la clé brute si introuvable.
export function createTranslator(messages: Messages): TFunc {
  return (key: string) => {
    const value = key
      .split(".")
      .reduce<any>((obj, part) => (obj == null ? undefined : obj[part]), messages);
    return typeof value === "string" ? value : key;
  };
}
