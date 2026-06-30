"use client";

import { Icon } from "@/components/icons";
import { useT } from "@/i18n/I18nProvider";
import type { TFunc } from "@/i18n/dictionaries";

interface ExportButtonProps {
  rows: any[];
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
    const offers = o.offers as any;
    const affiliates = o.affiliate_network as any;
    const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;
    return [
      o.public_id,
      o.product ?? offers?.product ?? "",
      o.country ?? "",
      affiliates?.name ?? "",
      o.affiliate ?? "",
      new Date(o.created_at).toLocaleString("fr-FR"),
      o.status,
      o.payout_amount != null ? Number(o.payout_amount).toFixed(2) : "",
      fullName,
      o.phone,
      o.address ?? "",
      o.comment ?? "",
    ].map((c) => String(c ?? ""));
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function ExportButton({ rows }: ExportButtonProps) {
  const t = useT();
  const HEADERS = buildHeaders(t);
  const date = new Date().toISOString().split("T")[0];
  const body = buildRows(rows);

  const exportExcel = () => {
    // Fichier .xls reconnu par Excel : table HTML avec en-tête UTF-8.
    const thead = `<tr>${HEADERS.map((h) => `<th style="background:#5b4fcf;color:#fff;font-weight:600">${esc(h)}</th>`).join("")}</tr>`;
    const tbody = body
      .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
      .join("");
    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="UTF-8"></head>` +
      `<body><table border="1">${thead}${tbody}</table></body></html>`;
    triggerDownload(
      new Blob(["﻿" + html], { type: "application/vnd.ms-excel;charset=utf-8;" }),
      `leads-${date}.xls`
    );
  };

  const exportCsv = () => {
    const csv = [HEADERS, ...body]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    triggerDownload(
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
