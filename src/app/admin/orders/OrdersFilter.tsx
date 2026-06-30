"use client";

import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";

interface OrdersFilterProps {
  onFiltersChange: (filters: OrderFilters) => void;
}

export interface OrderFilters {
  public_id: string;
  product: string;
  country: string;
  affiliate_name: string;
  status: string;
  first_name: string;
  phone: string;
}

export function OrdersFilter({ onFiltersChange }: OrdersFilterProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    public_id: "",
    product: "",
    country: "",
    affiliate_name: "",
    status: "",
    first_name: "",
    phone: "",
  });

  const activeCount = Object.values(filters).filter((v) => v.trim() !== "").length;

  const handleChange = (key: keyof OrderFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: OrderFilters = {
      public_id: "",
      product: "",
      country: "",
      affiliate_name: "",
      status: "",
      first_name: "",
      phone: "",
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 font-semibold text-ink"
        >
          <span
            className={`inline-block text-xs transition-transform ${open ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          {t("adm.orders.filters")}
          {activeCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-ink-inverse">
              {activeCount}
            </span>
          )}
        </button>
        {open && (
          <button onClick={handleReset} className="text-xs text-ink-muted hover:text-ink">
            {t("adm.orders.reset")}
          </button>
        )}
      </div>

      {!open ? null : (
      <div className="mt-3 space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <input
          type="text"
          placeholder={t("adm.orders.phOrderId")}
          value={filters.public_id}
          onChange={(e) => handleChange("public_id", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder={t("adm.orders.phProduct")}
          value={filters.product}
          onChange={(e) => handleChange("product", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder={t("adm.orders.phCountry")}
          value={filters.country}
          onChange={(e) => handleChange("country", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder={t("adm.orders.phAffiliate")}
          value={filters.affiliate_name}
          onChange={(e) => handleChange("affiliate_name", e.target.value)}
          className="input text-sm"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <input
          type="text"
          placeholder={t("adm.orders.phStatus")}
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder={t("adm.orders.phFullName")}
          value={filters.first_name}
          onChange={(e) => handleChange("first_name", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder={t("adm.orders.phPhone")}
          value={filters.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className="input text-sm"
        />
      </div>
      </div>
      )}
    </div>
  );
}
