"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

export function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg border border-line bg-elevated px-3 py-2 font-mono text-xs text-ink">
        {value}
      </code>
      <button
        className="btn btn-secondary shrink-0"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        <Icon name={copied ? "check" : "copy"} size={14} />
        {copied ? "Copié" : label ?? "Copier"}
      </button>
    </div>
  );
}
