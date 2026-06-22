"use client";

import { useState } from "react";

// Affiche le token API d'un affilié : masqué par défaut, avec révélation et copie.
export default function TokenCell({ token }: { token: string }) {
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
      <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
        {shown ? token : masked}
      </code>
      <button type="button" onClick={() => setShown((s) => !s)} className="text-xs text-brand-light hover:underline">
        {shown ? "Masquer" : "Voir"}
      </button>
      <button type="button" onClick={copy} className="text-xs text-brand-light hover:underline">
        {copied ? "Copié ✓" : "Copier"}
      </button>
    </div>
  );
}
