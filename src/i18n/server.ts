import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { getMessages, createTranslator, type TFunc } from "./dictionaries";

// Langue active côté serveur, lue depuis le cookie (français par défaut).
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

// Traducteur pour les Server Components : const t = getServerT(); t("nav.orders").
export function getServerT(): TFunc {
  return createTranslator(getMessages(getLocale()));
}
