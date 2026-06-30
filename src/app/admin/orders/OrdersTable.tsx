"use client";

import { STATUS_META, type OrderStatus } from "@/lib/types";
import { formatProductPrice } from "@/lib/currency";
import { useT } from "@/i18n/I18nProvider";

interface OrdersTableProps {
  rows: any[];
}

export function OrdersTable({ rows }: OrdersTableProps) {
  const t = useT();
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[1200px]">
        <thead className="bg-elevated">
          <tr>
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
            const meta = STATUS_META[o.status as OrderStatus];
            const offers = o.offers as any;
            const affiliates = o.affiliate_network as any;
            const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;

            return (
              <tr key={o.id} className="align-top row-hover">
                <td className="td font-mono text-xs">{o.public_id}</td>
                <td className="td">{o.product ?? offers?.product ?? "—"}</td>
                <td className="td">{o.country}</td>
                <td className="td">{affiliates?.name ?? "—"}</td>
                <td className="td">{o.affiliate ?? "—"}</td>
                <td className="td text-xs text-ink-muted">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                <td className="td">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta?.color}`}>
                    {meta?.label ?? o.status}
                  </span>
                </td>
                <td className="td">{o.payout_amount != null ? formatProductPrice(o.payout_amount, o.country) : "—"}</td>
                <td className="td">{fullName}</td>
                <td className="td">{o.phone}</td>
                <td className="td text-sm">{o.address ?? "—"}</td>
                <td className="td text-sm">{o.comment ?? "—"}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td className="td text-center text-ink-muted" colSpan={12}>{t("adm.orders.empty")}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
