"use client";

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
  const handleDownload = () => {
    if (rows.length === 0) {
      alert("Aucun produit à télécharger.");
      return;
    }
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
    >
      📥 Télécharger (CSV)
    </button>
  );
}
