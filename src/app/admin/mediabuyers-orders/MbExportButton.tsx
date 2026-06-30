"use client";

import { Icon } from "@/components/icons";
import { useT } from "@/i18n/I18nProvider";
import type { TFunc } from "@/i18n/dictionaries";

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

export default function MbExportButton({ rows }: { rows: any[] }) {
  const t = useT();
  const HEADERS = buildHeaders(t);
  const date = new Date().toISOString().split("T")[0];

  const exportExcel = () => {
    const body = buildRows(rows);
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
      `commandes-media-buyers-${date}.xls`
    );
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
