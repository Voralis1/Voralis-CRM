"use client";

import { Icon } from "@/components/icons";
import { useT } from "@/i18n/I18nProvider";
import type { TFunc } from "@/i18n/dictionaries";
import { downloadFile } from "@/lib/downloadFile";
import { buildExcelBlob } from "@/lib/exportExcel";

const buildHeaders = (t: TFunc): string[] => [
  t("adm.mbOrders.colId"),
  t("adm.mbOrders.colBuyer"),
  t("adm.mbOrders.colProduct"),
  t("adm.mbOrders.colCountry"),
  t("adm.mbOrders.colCampaign"),
  t("adm.mbOrders.colStatus"),
  t("adm.mbOrders.colPrice"),
  t("adm.mbOrders.colFullName"),
  t("adm.mbOrders.colPhone"),
  t("adm.mbOrders.colAddress"),
  t("adm.mbOrders.colReceivedDate"),
];

function buildRows(rows: any[]): string[][] {
  return rows.map((o) => {
    const buyer = (o.profiles as any)?.full_name;
    const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;
    return [
      o.public_id,
      buyer ?? "",
      o.product ?? "",
      o.country ?? "",
      o.campaign ?? "",
      o.status ?? "",
      o.payout_amount != null ? Number(o.payout_amount).toFixed(2) : "",
      fullName,
      o.phone ?? "",
      o.address ?? "",
      new Date(o.created_at).toLocaleString("fr-FR"),
    ].map((c) => String(c ?? ""));
  });
}

export default function MbExportButton({ rows }: { rows: any[] }) {
  const t = useT();
  const HEADERS = buildHeaders(t);
  const date = new Date().toISOString().split("T")[0];

  const exportExcel = async () => {
    const body = buildRows(rows);
    const blob = await buildExcelBlob(HEADERS, body, "Commandes");
    downloadFile(blob, `commandes-media-buyers-${date}.xlsx`);
  };

  return (
    <button
      type="button"
      onClick={exportExcel}
      title={t("adm.mbOrders.exportExcelTitle")}
      className="inline-flex items-center gap-2 rounded-lg bg-[#1f7a45] px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-[#1a6b3c]"
    >
      <Icon name="sheet" size={16} />
      {t("adm.mbOrders.exportExcel")}
    </button>
  );
}
