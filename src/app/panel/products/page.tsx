import { createClient } from "@/lib/supabase/server";

// Toujours recharger pour refléter les produits ajoutés par l'administrateur.
export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  measure: string | null;
  country: string | null;
  quantity: number | null;
  created_at: string | null;
}

export default async function PanelProductsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_products")
    .select("id, name, description, price, measure, country, quantity, created_at")
    .order("created_at", { ascending: false });

  const products = (data ?? []) as ProductRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Produits</h1>
        <p className="text-sm text-slate-500">
          Liste des produits disponibles, mise à jour automatiquement à chaque ajout par l'administrateur.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Impossible de charger les produits : {error.message}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">Nom</th>
              <th className="th">Description</th>
              <th className="th">Prix</th>
              <th className="th">Mesure</th>
              <th className="th">Pays</th>
              <th className="th">Quantité</th>
              <th className="th">Ajouté le</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="td text-center text-slate-500" colSpan={7}>
                  Aucun produit disponible pour le moment.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-brand-mist/40">
                  <td className="td font-medium">{p.name}</td>
                  <td className="td text-sm">{p.description || "—"}</td>
                  <td className="td">{p.price != null ? `${Number(p.price).toFixed(2)} €` : "—"}</td>
                  <td className="td">{p.measure || "—"}</td>
                  <td className="td">{p.country || "—"}</td>
                  <td className="td">{p.quantity ?? "—"}</td>
                  <td className="td text-xs text-slate-500">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
