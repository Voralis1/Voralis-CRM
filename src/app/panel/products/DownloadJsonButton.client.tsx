"use client";

// Bouton de téléchargement du catalogue produits au format JSON
// (prêt pour l'intégration API / CRM de l'affilié).
export default function DownloadJsonButton({
  data,
  filename = "produits.json",
}: {
  data: unknown;
  filename?: string;
}) {
  const handleDownload = () => {
    if (Array.isArray(data) && data.length === 0) {
      alert("Aucun produit à télécharger.");
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
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
    >
      📥 Télécharger (JSON)
    </button>
  );
}
