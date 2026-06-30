"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

export const PERIODS = [
  { key: "today", label: "Aujourd'hui" },
  { key: "7d", label: "7 Derniers Jours" },
  { key: "30d", label: "30 Derniers Jours" },
  { key: "month", label: "Ce Mois" },
  { key: "lastMonth", label: "Mois Dernier" },
  { key: "all", label: "Tout le Temps" },
] as const;

export type PeriodKey = (typeof PERIODS)[number]["key"];

export default function PeriodFilter({
  defaultPeriod = "30d",
  onChange,
}: {
  defaultPeriod?: PeriodKey;
  onChange?: (p: PeriodKey) => void;
}) {
  const [active, setActive] = useState<PeriodKey>(defaultPeriod);

  const select = (p: PeriodKey) => {
    setActive(p);
    onChange?.(p);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm font-medium text-ink-muted">
        <Icon name="calendar" size={16} />
      </span>

      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => select(p.key)}
          className={"period-pill" + (active === p.key ? " active" : "")}
        >
          {p.label}
        </button>
      ))}

      
    </div>
  );
}
