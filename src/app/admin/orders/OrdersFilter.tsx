"use client";

import { useState } from "react";

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
          className="flex items-center gap-2 font-semibold text-slate-700"
        >
          <span
            className={`inline-block text-xs transition-transform ${open ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          Filtres
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
              {activeCount}
            </span>
          )}
        </button>
        {open && (
          <button onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-700">
            Réinitialiser
          </button>
        )}
      </div>

      {!open ? null : (
      <div className="mt-3 space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <input
          type="text"
          placeholder="ID commande"
          value={filters.public_id}
          onChange={(e) => handleChange("public_id", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder="Produit"
          value={filters.product}
          onChange={(e) => handleChange("product", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder="Pays"
          value={filters.country}
          onChange={(e) => handleChange("country", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder="Affiliate"
          value={filters.affiliate_name}
          onChange={(e) => handleChange("affiliate_name", e.target.value)}
          className="input text-sm"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <input
          type="text"
          placeholder="Statut"
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder="Nom complet"
          value={filters.first_name}
          onChange={(e) => handleChange("first_name", e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder="Téléphone"
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
