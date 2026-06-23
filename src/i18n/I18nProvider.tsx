"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { createTranslator, getMessages, type TFunc } from "@/i18n/dictionaries";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunc;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Les deux dictionnaires sont embarqués côté client -> bascule instantanée
  // (aucun aller-retour réseau pour traduire les composants client).
  const t = useMemo(() => createTranslator(getMessages(locale)), [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setLocaleState(next); // 1) instantané pour les composants client
      // 2) mémorisation (cookie pour le SSR + localStorage par sécurité)
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      try {
        localStorage.setItem(LOCALE_COOKIE, next);
      } catch {
        /* localStorage indisponible */
      }
      // 3) rafraîchit le rendu serveur (menus, titres) sans recharger la page
      router.refresh();
    },
    [locale, router]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans <I18nProvider>");
  return ctx;
}

// Raccourci : const t = useT(); t("common.save").
export function useT(): TFunc {
  return useI18n().t;
}
