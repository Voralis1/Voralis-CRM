"use client";

import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";

// Affiche le token API d'un affilié : masqué par défaut, avec révélation et copie.
export default function TokenCell({ token }: { token: string }) {
  const t = useT();
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponible */
    }
  }

  const masked = token.slice(0, 9) + "•".repeat(8);

  return (
    <div className="flex items-center gap-2">
      <code className="rounded bg-elevated px-2 py-0.5 text-xs text-ink">
        {shown ? token : masked}
      </code>
      <button type="button" onClick={() => setShown((s) => !s)} className="text-xs text-accent hover:underline">
        {shown ? t("adm.affiliates.hide") : t("adm.affiliates.show")}
      </button>
      <button type="button" onClick={copy} className="text-xs text-accent hover:underline">
        {copied ? t("adm.affiliates.copied") : t("adm.affiliates.copy")}
      </button>
    </div>
  );
}
