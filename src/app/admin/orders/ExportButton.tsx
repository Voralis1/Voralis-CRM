"use client";

interface ExportButtonProps {
  rows: any[];
}

export function ExportButton({ rows }: ExportButtonProps) {
  const handleExport = () => {
    const csvContent = [
      [
        "ID de la commande",
        "Produit",
        "Pays",
        "Affiliate network",
        "Affiliate",
        "Date de réception",
        "Status",
        "Prix",
        "Nom complet",
        "Téléphone",
        "Adresse",
        "Informations additionnelles",
      ],
      ...rows.map((o) => {
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
        ];
      }),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={handleExport} className="btn-primary">
      Télécharger en Excel
    </button>
  );
}
