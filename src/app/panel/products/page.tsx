import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmationRateFor, type RateOrder } from "@/lib/confirmationRate";
import { formatProductPrice, formatPayout, currencyForCountry } from "@/lib/currency";
import DownloadButton from "./DownloadButton.client";
import DownloadJsonButton from "./DownloadJsonButton.client";
import CopyRowButton from "./CopyRowButton.client";

// Toujours recharger pour refléter les produits ajoutés par l'administrateur.
export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  name: string;
  category: string | null;
  country: string | null;
  price: number | null;
  daily_capacity: number | null;
  payout: number | null;
  status: string | null;
  working_hours: string | null;
  description: string | null;
}

export default async function PanelProductsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_products")
    .select("id, name, category, country, price, daily_capacity, payout, status, working_hours, description")
    .order("created_at", { ascending: false });

  const products = (data ?? []) as ProductRow[];

  // Taux de confirmation global (comme la page admin) -> service role pour
  // lire l'agrégat de tous les leads (statut/offer_id/product, sans données perso).
  const admin = createAdminClient();
  const { data: orders } = await admin.from("orders").select("status, offer_id, product");
  const allOrders = (orders ?? []) as RateOrder[];

  // Taux calculé une seule fois -> réutilisé par le tableau ET le CSV.
  const enriched = products.map((p) => ({ p, rate: confirmationRateFor(p, allOrders) }));

  const csvHeaders = [
    "ID produit", "Nom du produit", "Catégorie", "Pays", "Prix",
    "Capacité journalière", "Taux de confirmation", "Payout", "Status",
    "Horaires de travail", "Informations supplémentaires",
  ];
  // Catalogue JSON prêt pour l'intégration API / CRM de l'affilié.
  const jsonData = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category ?? null,
    country: p.country ?? null,
    currency: currencyForCountry(p.country) || null,
    price: p.price ?? null,
    payout: p.payout ?? null,
    status: p.status ?? null,
  }));

  const csvRows = enriched.map(({ p, rate }) => [
    p.id, p.name, p.category ?? "", p.country ?? "",
    p.price != null ? formatProductPrice(p.price, p.country) : "",
    p.daily_capacity != null ? String(p.daily_capacity) : "",
    rate ? `${rate}%` : "",
    p.payout ? formatPayout(p.payout) : "",
    p.status ?? "",
    p.working_hours ?? "",
    p.description ?? "",
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produits</h1>
          <p className="text-sm text-slate-500">
            Liste des produits disponibles, mise à jour automatiquement à chaque ajout par l'administrateur.
          </p>
        </div>
        <div className="flex gap-2">
          <DownloadJsonButton data={jsonData} filename="produits.json" />
          <DownloadButton headers={csvHeaders} rows={csvRows} filename="produits.csv" />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Impossible de charger les produits : {error.message}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1300px]">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">ID produit</th>
              <th className="th">Nom du produit</th>
              <th className="th">Catégorie</th>
              <th className="th">Pays</th>
              <th className="th">Prix</th>
              <th className="th">Capacité journalière</th>
              <th className="th">Taux de confirmation</th>
              <th className="th">Payout ($)</th>
              <th className="th">Status</th>
              <th className="th">Horaires de travail</th>
              <th className="th">Informations supplémentaires</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="td text-center text-slate-500" colSpan={12}>
                  Aucun produit disponible pour le moment.
                </td>
              </tr>
            ) : (
              enriched.map(({ p, rate }, i) => (
                  <tr key={p.id} className="hover:bg-brand-mist/40">
                    <td className="td font-mono text-xs">{p.id}</td>
                    <td className="td font-medium">{p.name}</td>
                    <td className="td">{p.category || "—"}</td>
                    <td className="td">{p.country || "—"}</td>
                    <td className="td">{p.price != null ? formatProductPrice(p.price, p.country) : "—"}</td>
                    <td className="td">{p.daily_capacity || "—"}</td>
                    <td className="td">{rate ? `${rate}%` : "—"}</td>
                    <td className="td">{p.payout ? formatPayout(p.payout) : "—"}</td>
                    <td className="td">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "paused"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {p.status || "—"}
                      </span>
                    </td>
                    <td className="td">{p.working_hours || "—"}</td>
                    <td className="td text-sm">{p.description || "—"}</td>
                    <td className="td"><CopyRowButton text={csvRows[i].join("\t")} /></td>
                  </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
