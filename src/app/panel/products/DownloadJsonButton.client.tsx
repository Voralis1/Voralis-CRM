"use client";

import { Icon } from "@/components/icons";
import { useT } from "@/i18n/I18nProvider";

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
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
