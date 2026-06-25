"use client";

import { useState } from "react";

// Copie le contenu d'une ligne produit dans le presse-papier.
export default function CopyRowButton({ text }: { text: string }) {
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
      className="rounded-md border border-brand-line px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-mist"
    >
      {copied ? "Copié ✓" : "Copier"}
    </button>
  );
}
