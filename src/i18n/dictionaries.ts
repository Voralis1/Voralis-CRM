import { fr, type Messages } from "./messages/fr";
import { en } from "./messages/en";
import { pt } from "./messages/pt";
import { ru } from "./messages/ru";
import { affiliate } from "./messages/affiliate";
import { admin } from "./messages/admin";
import { mediabuying } from "./messages/mediabuying";
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

// Modules de traduction par espace (remplis par section, sans conflit).
const SECTIONS = [affiliate, admin, mediabuying];

// Ajoute les clés des sections : d'abord le FR (fallback garanti), puis la
// surcharge de la langue cible.
function withSections(loc: Locale, base: Messages): Messages {
  let out: any = base;
  for (const s of SECTIONS) {
    out = deepMerge(out, s.fr ?? {});
    if (loc !== "fr") out = deepMerge(out, s[loc] ?? {});
  }
  return out;
}

const dictionaries: Record<Locale, Messages> = {
  fr: withSections("fr", fr),
  en: withSections("en", deepMerge(fr, en)),
  pt: withSections("pt", deepMerge(fr, pt)),
  ru: withSections("ru", deepMerge(fr, ru)),
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
