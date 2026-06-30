"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, type Locale } from "@/i18n/config";
import { Icon } from "@/components/icons";

const NATIVE: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  pt: "Português",
  ru: "Русский",
};

// Sélecteur de langue : icône globe + menu déroulant (FR / EN / PT / RU).
export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Changer de langue"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-semibold text-ink-muted transition hover:border-line-strong hover:text-ink"
      >
        <Icon name="globe" size={16} />
        <span className="uppercase">{locale}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-modal">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={
                  "flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-hovered " +
                  (l === locale ? "font-semibold text-accent" : "text-ink")
                }
              >
                <span className="flex items-center gap-2">
                  <span className="w-7 text-[10px] font-semibold uppercase text-ink-faint">{l}</span>
                  {NATIVE[l]}
                </span>
                {l === locale && <Icon name="check" size={15} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
