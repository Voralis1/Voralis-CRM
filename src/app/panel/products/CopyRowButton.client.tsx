"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useT } from "@/i18n/I18nProvider";

// Copie le contenu d'une ligne produit dans le presse-papier.
export default function CopyRowButton({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* presse-papier indisponible */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn btn-secondary px-2.5 py-1 text-xs"
    >
      <Icon name={copied ? "check" : "copy"} size={13} />
      {copied ? t("aff.products.copied") : t("aff.products.copy")}
    </button>
  );
}
