"use client";

import { Icon } from "@/components/icons";
import { useT } from "@/i18n/I18nProvider";
import { downloadFile } from "@/lib/downloadFile";

// Bouton de téléchargement du catalogue produits au format JSON
// (prêt pour l'intégration API / CRM de l'affilié).
export default function DownloadJsonButton({
  data,
  filename = "produits.json",
}: {
  data: unknown;
  filename?: string;
}) {
  const t = useT();
  const handleDownload = () => {
    if (Array.isArray(data) && data.length === 0) {
      alert(t("aff.products.nothingToDownload"));
      return;
    }
    const json = JSON.stringify(data, null, 2);
    downloadFile(new Blob([json], { type: "application/json;charset=utf-8;" }), filename);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="btn btn-secondary"
    >
      <Icon name="download" size={16} />
      {t("aff.products.downloadJson")}
    </button>
  );
}
