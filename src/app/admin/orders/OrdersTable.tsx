"use client";

import { formatProductPrice } from "@/lib/currency";
import { useT } from "@/i18n/I18nProvider";
import { statusMeta, type OrderStatusRow } from "@/lib/orderStatus";

interface OrdersTableProps {
  rows: any[];
  statuses: OrderStatusRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
}

export function OrdersTable({ rows, statuses, selectedIds, onToggleRow, onToggleAll }: OrdersTableProps) {
  const t = useT();

  const allSelected = rows.length > 0 && rows.every((o) => selectedIds.has(o.id));

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[1200px]">
        <thead className="bg-elevated">
          <tr>
            <th className="th w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label={t("adm.orders.selectAllAria")}
              />
            </th>
            <th className="th">{t("adm.orders.colOrderId")}</th>
            <th className="th">{t("adm.orders.colProduct")}</th>
            <th className="th">{t("adm.orders.colCountry")}</th>
            <th className="th">{t("adm.orders.colNetwork")}</th>
            <th className="th">{t("adm.orders.colAffiliate")}</th>
            <th className="th">{t("adm.orders.colReceivedDate")}</th>
            <th className="th">{t("adm.orders.colLastStatus")}</th>
            <th className="th">{t("adm.orders.colPrice")}</th>
            <th className="th">{t("adm.orders.colFullName")}</th>
            <th className="th">{t("adm.orders.colPhone")}</th>
            <th className="th">{t("adm.orders.colAddress")}</th>
            <th className="th">{t("adm.orders.colExtra")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const meta = statusMeta(statuses, o.status);
            const affiliates = o.affiliate_network as any;
            const product = o.project_products as any;
            const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;

            return (
              <tr key={o.id} className="align-top row-hover">
                <td className="td w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(o.id)}
                    onChange={() => onToggleRow(o.id)}
                    aria-label={t("adm.orders.selectRowAria")}
                  />
                </td>
                <td className="td font-mono text-xs">{o.public_id}</td>
                <td className="td">{o.product ?? "—"}</td>
                <td className="td">{o.country}</td>
                <td className="td">{affiliates?.name ?? "—"}</td>
                <td className="td">{o.affiliate ?? "—"}</td>
                <td className="td text-xs text-ink-muted">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                <td className="td">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta?.color}`}>
                    {meta?.title ?? o.status}
                  </span>
                </td>
                <td className="td">{product?.price != null ? formatProductPrice(product.price, o.country) : "—"}</td>
                <td className="td">{fullName}</td>
                <td className="td">{o.phone}</td>
                <td className="td text-sm">{o.address ?? "—"}</td>
                <td className="td text-sm">{o.comment ?? "—"}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td className="td text-center text-ink-muted" colSpan={13}>{t("adm.orders.empty")}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
