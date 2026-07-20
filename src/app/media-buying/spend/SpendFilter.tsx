"use client";

import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";

export interface SpendFilters {
  date: string;
  account_name: string;
  country: string;
  campaign: string;
  impressions: string;
  clicks: string;
  ctr: string;
  leads: string;
  spend: string;
  cpl: string;
}

const EMPTY_FILTERS: SpendFilters = {
  date: "", account_name: "", country: "", campaign: "",
  impressions: "", clicks: "", ctr: "", leads: "", spend: "", cpl: "",
};

interface SpendFilterProps {
  onFiltersChange: (filters: SpendFilters) => void;
}

export function SpendFilter({ onFiltersChange }: SpendFilterProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<SpendFilters>({ ...EMPTY_FILTERS });

  const activeCount = Object.values(filters).filter((v) => v.trim() !== "").length;

  const handleChange = (key: keyof SpendFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    setFilters({ ...EMPTY_FILTERS });
    onFiltersChange({ ...EMPTY_FILTERS });
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 font-semibold text-ink"
        >
          <span className={`inline-block text-xs transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
          {t("mb.spend.filters")}
          {activeCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-ink-inverse">
              {activeCount}
            </span>
          )}
        </button>
        {open && (
          <button onClick={handleReset} className="text-xs text-ink-muted hover:text-ink">
            {t("mb.spend.reset")}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              type="text"
              placeholder={t("mb.spend.date")}
              value={filters.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="input text-sm"
            />
            <input
              type="text"
              placeholder={t("mb.spend.thAccountName")}
              value={filters.account_name}
              onChange={(e) => handleChange("account_name", e.target.value)}
              className="input text-sm"
            />
            <input
              type="text"
              placeholder={t("mb.spend.country")}
              value={filters.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="input text-sm"
            />
            <input
              type="text"
              placeholder={t("mb.spend.campaign")}
              value={filters.campaign}
              onChange={(e) => handleChange("campaign", e.target.value)}
              className="input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              type="text"
              placeholder={t("mb.spend.impressions")}
              value={filters.impressions}
              onChange={(e) => handleChange("impressions", e.target.value)}
              className="input text-sm"
            />
            <input
              type="text"
              placeholder={t("mb.spend.clicks")}
              value={filters.clicks}
              onChange={(e) => handleChange("clicks", e.target.value)}
              className="input text-sm"
            />
            <input
              type="text"
              placeholder={t("mb.spend.ctr")}
              value={filters.ctr}
              onChange={(e) => handleChange("ctr", e.target.value)}
              className="input text-sm"
            />
            <input
              type="text"
              placeholder={t("mb.spend.leads")}
              value={filters.leads}
              onChange={(e) => handleChange("leads", e.target.value)}
              className="input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              type="text"
              placeholder={t("mb.spend.amount")}
              value={filters.spend}
              onChange={(e) => handleChange("spend", e.target.value)}
              className="input text-sm"
            />
            <input
              type="text"
              placeholder={t("mb.spend.cpl")}
              value={filters.cpl}
              onChange={(e) => handleChange("cpl", e.target.value)}
              className="input text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
