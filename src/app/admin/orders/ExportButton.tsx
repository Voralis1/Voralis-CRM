"use client";

import { Icon } from "@/components/icons";
import { useT } from "@/i18n/I18nProvider";
import type { TFunc } from "@/i18n/dictionaries";
import { downloadFile } from "@/lib/downloadFile";
import { buildExcelBlob } from "@/lib/exportExcel";
import { formatProductPrice } from "@/lib/currency";

interface ExportButtonProps {
  rows: any[];
  // Appelé après un export Excel réussi (pas CSV) — laissé à `undefined`
  // quand `rows` ne correspond pas à une sélection explicite de l'utilisateur.
  onExcelExported?: (rows: any[]) => void;
}

const buildHeaders = (t: TFunc): string[] => [
  t("adm.orders.colOrderId"),
  t("adm.orders.colProduct"),
  t("adm.orders.colCountry"),
  t("adm.orders.colNetwork"),
  t("adm.orders.colAffiliate"),
  t("adm.orders.colReceivedDate"),
  t("adm.orders.hStatus"),
  t("adm.orders.colPrice"),
  t("adm.orders.colFullName"),
  t("adm.orders.colPhone"),
  t("adm.orders.colAddress"),
  t("adm.orders.colExtra"),
];

function buildRows(rows: any[]): string[][] {
  return rows.map((o) => {
    const affiliates = o.affiliate_network as any;
    const product = o.project_products as any;
    const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;
    return [
      o.public_id,
      o.product ?? "",
      o.country ?? "",
      affiliates?.name ?? "",
      o.affiliate ?? "",
      new Date(o.created_at).toLocaleString("fr-FR"),
      o.status,
      product?.price != null ? formatProductPrice(product.price, o.country) : "",
      fullName,
      o.phone,
      o.address ?? "",
      o.comment ?? "",
    ].map((c) => String(c ?? ""));
  });
}

export function ExportButton({ rows, onExcelExported }: ExportButtonProps) {
  const t = useT();
  const HEADERS = buildHeaders(t);
  const date = new Date().toISOString().split("T")[0];
  const body = buildRows(rows);

  const exportExcel = async () => {
    const blob = await buildExcelBlob(HEADERS, body, "Leads");
    downloadFile(blob, `leads-${date}.xlsx`);
    onExcelExported?.(rows);
  };

  const exportCsv = () => {
    const csv = [HEADERS, ...body]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadFile(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }),
      `leads-${date}.csv`
    );
  };

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-line shadow-card">
      <button
        type="button"
        onClick={exportExcel}
        title={t("adm.orders.exportExcelTitle")}
        className="inline-flex items-center gap-2 bg-[#1f7a45] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a6b3c]"
      >
        <Icon name="sheet" size={16} />
        {t("adm.orders.exportExcel")}
      </button>
      <button
        type="button"
        onClick={exportCsv}
        title={t("adm.orders.exportCsvTitle")}
        className="inline-flex items-center gap-2 border-l border-white/20 bg-elevated px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-hovered hover:text-ink"
      >
        <Icon name="download" size={16} />
        {t("adm.orders.exportCsv")}
      </button>
    </div>
  );
}
