"use client";

import { useEffect, useState, useTransition } from "react";
import { useT } from "@/i18n/I18nProvider";
import { ExportButton } from "./ExportButton";
import { OrdersFilter, OrderFilters } from "./OrdersFilter";
import { OrdersTable } from "./OrdersTable";
import { bulkChangeStatus } from "./actions";
import type { OrderStatusRow } from "@/lib/orderStatus";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<OrderStatusRow[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [isApplying, startApplying] = useTransition();

  useEffect(() => {
    fetch("/api/admin/statuses", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const options: OrderStatusRow[] = data.statuses || [];
        setStatuses(options);
        setBulkStatus((current) => current || options[0]?.slug || "");
      })
      .catch(() => {});
  }, []);

  const totalRows = rows.length;
  const filteredRows = rows.filter((o) => {
    const affiliates = o.affiliate_network as any;
    const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;

    return (
      (!filters.public_id || o.public_id.toLowerCase().includes(filters.public_id.toLowerCase())) &&
      (!filters.product || (o.product || "").toLowerCase().includes(filters.product.toLowerCase())) &&
      (!filters.country || (o.country || "").toLowerCase().includes(filters.country.toLowerCase())) &&
      (!filters.affiliate_name || (affiliates?.name || "").toLowerCase().includes(filters.affiliate_name.toLowerCase())) &&
      (!filters.status || o.status.toLowerCase().includes(filters.status.toLowerCase())) &&
      (!filters.first_name || fullName.toLowerCase().includes(filters.first_name.toLowerCase())) &&
      (!filters.phone || o.phone.toLowerCase().includes(filters.phone.toLowerCase()))
    );
  });

  const toggleRow = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((current) => {
      const allSelected = filteredRows.length > 0 && filteredRows.every((o) => current.has(o.id));
      if (allSelected) return new Set();
      return new Set(filteredRows.map((o) => o.id));
    });
  };

  const selectedRows = filteredRows.filter((o) => selectedIds.has(o.id));
  const exportRows = selectedRows.length > 0 ? selectedRows : filteredRows;

  const applyBulkStatus = () => {
    if (selectedRows.length === 0 || !bulkStatus) return;
    setBulkMessage(null);
    const publicIds = selectedRows.map((o) => o.public_id);
    const label = statuses.find((s) => s.slug === bulkStatus)?.title ?? bulkStatus;
    startApplying(async () => {
      const res = await bulkChangeStatus(publicIds, bulkStatus);
      if (res.updated.length > 0) {
        setSelectedIds(new Set());
        setBulkMessage(
          `${res.updated.length} ${
            res.updated.length > 1 ? t("adm.bulk.orderPlural") : t("adm.bulk.orderSingular")
          } ${res.updated.length > 1 ? t("adm.bulk.updatedToward") : t("adm.bulk.updatedTowardSingular")} « ${label} ».`
        );
      } else {
        setBulkMessage(res.error ?? t("adm.bulk.failed"));
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-ink-muted">
          {filteredRows.length} {t("adm.orders.of")} {totalRows} {t("adm.orders.summary")} · {t("adm.orders.summaryHint")}
          {selectedRows.length > 0 && (
            <>
              {" — "}
              <strong>{selectedRows.length}</strong> {t("adm.orders.selectedSuffix")} ·{" "}
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-accent hover:underline"
              >
                {t("adm.orders.clearSelection")}
              </button>
            </>
          )}
        </div>
        <ExportButton rows={exportRows} />
      </div>

      {selectedRows.length > 0 && (
        <div className="card flex flex-wrap items-center gap-2 p-3">
          <span className="text-sm font-medium text-ink">{t("adm.bulk.newStatus")}</span>
          <select
            className="input w-auto"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary disabled:opacity-50"
            disabled={isApplying || !bulkStatus}
            onClick={applyBulkStatus}
          >
            {isApplying ? t("adm.bulk.updating") : t("adm.bulk.update")}
          </button>
          {bulkMessage && <span className="text-sm text-ink-muted">{bulkMessage}</span>}
        </div>
      )}

      <OrdersFilter onFiltersChange={setFilters} />

      <OrdersTable
        rows={filteredRows}
        statuses={statuses}
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
      />
    </div>
  );
}
