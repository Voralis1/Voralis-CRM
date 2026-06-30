"use client";

import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { ExportButton } from "./ExportButton";
import { OrdersFilter, OrderFilters } from "./OrdersFilter";
import { OrdersTable } from "./OrdersTable";

interface OrdersBoardClientProps {
  rows: any[];
}

export default function OrdersBoardClient({ rows }: OrdersBoardClientProps) {
  const t = useT();
  const [filters, setFilters] = useState<OrderFilters>({
    public_id: "",
    product: "",
    country: "",
    affiliate_name: "",
    status: "",
    first_name: "",
    phone: "",
  });

  const totalRows = rows.length;
  const filteredRows = rows.filter((o) => {
    const offers = o.offers as any;
    const affiliates = o.affiliate_network as any;
    const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;

    return (
      (!filters.public_id || o.public_id.toLowerCase().includes(filters.public_id.toLowerCase())) &&
      (!filters.product || (o.product || offers?.product || "").toLowerCase().includes(filters.product.toLowerCase())) &&
      (!filters.country || (o.country || "").toLowerCase().includes(filters.country.toLowerCase())) &&
      (!filters.affiliate_name || (affiliates?.name || "").toLowerCase().includes(filters.affiliate_name.toLowerCase())) &&
      (!filters.status || o.status.toLowerCase().includes(filters.status.toLowerCase())) &&
      (!filters.first_name || fullName.toLowerCase().includes(filters.first_name.toLowerCase())) &&
      (!filters.phone || o.phone.toLowerCase().includes(filters.phone.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-muted">
          {filteredRows.length} {t("adm.orders.of")} {totalRows} {t("adm.orders.summary")} · {t("adm.orders.summaryHint")}
        </div>
        <ExportButton rows={filteredRows} />
      </div>

      <OrdersFilter onFiltersChange={setFilters} />

      <OrdersTable rows={filteredRows} />
    </div>
  );
}
