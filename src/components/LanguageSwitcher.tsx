"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES } from "@/i18n/config";

// Sélecteur de langue FR | EN. Bascule instantanée, choix mémorisé.
export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex rounded-lg border border-brand-line bg-white p-0.5 text-xs">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-md px-2.5 py-1 font-semibold uppercase transition ${
            locale === l
              ? "bg-brand-deep text-white"
              : "text-slate-500 hover:text-brand-dark"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
