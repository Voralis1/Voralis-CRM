"use client";

import { Icon } from "@/components/icons";
import { useT } from "@/i18n/I18nProvider";
import { downloadFile } from "@/lib/downloadFile";

// Bouton de téléchargement CSV de la liste des produits.
// Reçoit les lignes déjà formatées depuis le Server Component.
export default function DownloadButton({
  headers,
  rows,
  filename = "produits.csv",
}: {
  headers: string[];
  rows: string[][];
  filename?: string;
}) {
  const t = useT();
  const handleDownload = () => {
    if (rows.length === 0) {
      alert(t("aff.products.nothingToDownload"));
      return;
    }
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadFile(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-2 rounded-lg bg-[#1f7a45] px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-[#1a6b3c] active:scale-[0.97]"
    >
      <Icon name="sheet" size={16} />
      {t("aff.products.downloadCsv")}
    </button>
  );
}
