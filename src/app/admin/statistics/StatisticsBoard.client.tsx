"use client";

import { useState } from "react";
import type { StatRow } from "./page";

interface StatisticsBoardProps {
  affiliateStats: StatRow[];
  productStats: StatRow[];
  totals: { total: number; confirmed: number; delivered: number; payout: number };
}

type Tab = "affiliates" | "products";

function downloadCSV(filename: string, firstColLabel: string, rows: StatRow[]) {
  const headers = [
    firstColLabel,
    "Commandes totales",
    "Confirmées",
    "Taux de confirmation (%)",
    "Livrées",
    "Taux de livraison (%)",
    "Invalides",
    "Taux d'invalidité (%)",
    "Cash généré",
  ];
  const body = rows.map((r) => [
    r.label,
    r.total,
    r.confirmed,
    r.confirmRate,
    r.delivered,
    r.deliveryRate,
    r.invalid,
    r.invalidRate,
    r.payout.toFixed(2),
  ]);
  const csv = [headers, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function rateColor(rate: number) {
  if (rate >= 40) return "text-emerald-700";
  if (rate >= 20) return "text-amber-600";
  return "text-rose-600";
}

function StatsTable({ rows, firstColLabel }: { rows: StatRow[]; firstColLabel: string }) {
  if (rows.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-slate-500">
        Aucune donnée disponible pour le moment.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-brand-mist">
          <tr>
            <th className="th">{firstColLabel}</th>
            <th className="th">Commandes</th>
            <th className="th">Confirmées</th>
            <th className="th">Taux confirmation</th>
            <th className="th">Livrées</th>
            <th className="th">Taux livraison</th>
            <th className="th">Invalides</th>
            <th className="th">Cash généré</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="hover:bg-brand-mist/40">
              <td className="td font-medium">{r.label}</td>
              <td className="td">{r.total}</td>
              <td className="td">{r.confirmed}</td>
              <td className={`td font-semibold ${rateColor(r.confirmRate)}`}>{r.confirmRate}%</td>
              <td className="td">{r.delivered}</td>
              <td className="td">{r.deliveryRate}%</td>
              <td className="td">
                {r.invalid} <span className="text-xs text-slate-400">({r.invalidRate}%)</span>
              </td>
              <td className="td font-mono">${r.payout.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StatisticsBoard({ affiliateStats, productStats, totals }: StatisticsBoardProps) {
  const [tab, setTab] = useState<Tab>("affiliates");

  const confirmRate = totals.total > 0 ? Math.round((totals.confirmed / totals.total) * 1000) / 10 : 0;
  const activeRows = tab === "affiliates" ? affiliateStats : productStats;
  const firstColLabel = tab === "affiliates" ? "Affilié" : "Produit";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="text-sm text-slate-500">Performances par affilié et par produit.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadCSV(
              tab === "affiliates" ? "statistiques-affilies" : "statistiques-produits",
              firstColLabel,
              activeRows
            )
          }
          className="btn btn-secondary max-w-max"
        >
          Télécharger (CSV)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="text-sm text-slate-500">Commandes totales</div>
          <div className="mt-2 text-2xl font-semibold">{totals.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-500">Confirmées</div>
          <div className="mt-2 text-2xl font-semibold">{totals.confirmed}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-500">Taux de confirmation</div>
          <div className="mt-2 text-2xl font-semibold">{confirmRate}%</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-500">Cash total généré</div>
          <div className="mt-2 text-2xl font-semibold">${totals.payout.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("affiliates")}
          className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
            tab === "affiliates"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Par affilié
        </button>
        <button
          type="button"
          onClick={() => setTab("products")}
          className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
            tab === "products"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Par produit
        </button>
      </div>

      <StatsTable rows={activeRows} firstColLabel={firstColLabel} />
    </div>
  );
}
