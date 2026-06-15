"use client";

import { useState } from "react";

export function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg border border-brand-line bg-brand-mist px-3 py-2 font-mono text-xs text-brand-dark">
        {value}
      </code>
      <button
        className="btn-ghost shrink-0"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copié ✓" : label ?? "Copier"}
      </button>
    </div>
  );
}
