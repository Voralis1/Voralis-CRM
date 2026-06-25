"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatProductPrice, formatPayout, currencyLabelForCountry } from "@/lib/currency";

interface Product {
  id: string;
  name: string;
  category: string;
  country: string;
  price: string;
  dailyCapacity: string;
  confirmationRate: string;
  payout: string;
  status: string;
  workingHours: string;
  additionalInfo: string;
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  productCount: string;
}

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

const initialProductForm: Product = {
  id: "",
  name: "",
  category: "",
  country: "",
  price: "",
  dailyCapacity: "",
  confirmationRate: "",
  payout: "",
  status: "active",
  workingHours: "",
  additionalInfo: "",
};

export default function ProjectDetailsPage({ params }: ProjectPageProps) {
  const { projectId } = params;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Product>(initialProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger le projet.");
      setProject(data.project);
      setProducts(data.products || []);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const canAdd = useMemo(
    () => form.id.trim() !== "" && form.name.trim() !== "" && form.price.trim() !== "",
    [form]
  );

  const handleChange = (key: keyof Product, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleEditProduct = (product: Product) => {
    setForm(product);
    setEditingProductId(product.id);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Confirmer la suppression de ce produit ?")) return;
    try {
      const response = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression.");
      await fetchProject();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDownloadCSV = () => {
    if (products.length === 0) {
      alert("Aucun produit à télécharger.");
      return;
    }
    const headers = [
      "ID produit", "Nom du produit", "Catégorie", "Pays", "Prix",
      "Capacité journalière", "Taux de confirmation", "Payout", "Status",
      "Horaires de travail", "Informations supplémentaires",
    ];
    const rows = products.map((p) => [
      p.id, p.name, p.category, p.country, p.price,
      p.dailyCapacity, p.confirmationRate, p.payout, p.status,
      p.workingHours, p.additionalInfo,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((val) => `"${val ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `produits-${project?.name || "export"}.csv`);
    link.click();
  };

  const openNewProductModal = () => {
    setEditingProductId(null);
    setForm(initialProductForm);
    setIsModalOpen(true);
  };

  const handleAddProduct = async () => {
    if (!canAdd) return;
    setIsSaving(true);
    setError(null);

    try {
      const url = editingProductId
        ? `/api/admin/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(editingProductId)}`
        : `/api/admin/projects/${encodeURIComponent(projectId)}/products`;
      const method = editingProductId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          category: form.category,
          country: form.country,
          price: form.price,
          dailyCapacity: form.dailyCapacity,
          payout: form.payout,
          status: form.status,
          workingHours: form.workingHours,
          additionalInfo: form.additionalInfo,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur lors de l'opération.");

      setIsModalOpen(false);
      setForm(initialProductForm);
      setEditingProductId(null);
      await fetchProject();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!project) {
    return (
      <div className="card p-6">
        <div className="text-lg font-semibold">Projet introuvable</div>
        <p className="text-sm text-slate-600">Aucun projet n'a été trouvé avec cet ID.</p>
        <button type="button" onClick={() => router.push("/admin/products")} className="btn btn-secondary mt-4">
          Retour à la gestion des produits
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projet : {project.name}</h1>
          <p className="text-sm text-slate-500">ID : {project.id} • créé le {new Date(project.createdAt).toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={openNewProductModal} className="btn btn-primary">
            Ajouter un produit
          </button>
          <button type="button" onClick={handleDownloadCSV} className="btn btn-secondary">
            Télécharger (CSV)
          </button>
          <button type="button" onClick={() => router.push("/admin/products")} className="btn btn-secondary">
            Retour aux projets
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-slate-500 text-sm">Expiration</div>
            <div className="mt-1 font-medium">{new Date(project.expiresAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div>
            <div className="text-slate-500 text-sm">Nombre de produits</div>
            <div className="mt-1 font-medium">{products.length}</div>
          </div>
          <div>
            <div className="text-slate-500 text-sm">Nombre demandé</div>
            <div className="mt-1 font-medium">{project.productCount}</div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{editingProductId ? "Modifier le produit" : "Ajouter un nouveau produit"}</h2>
                <p className="text-sm text-slate-500">Remplis les détails du produit et enregistre.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>ID produit</span>
                  <input type="text" value={form.id} onChange={(e) => handleChange("id", e.target.value)} disabled={!!editingProductId} className="input w-full disabled:bg-slate-100" placeholder="prod_001" />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Nom du produit</span>
                  <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="input w-full" placeholder="Pilule minceur" />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Catégorie</span>
                  <input type="text" value={form.category} onChange={(e) => handleChange("category", e.target.value)} className="input w-full" placeholder="Minceur" />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Pays</span>
                  <input type="text" value={form.country} onChange={(e) => handleChange("country", e.target.value)} className="input w-full" placeholder="SN" />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Prix{currencyLabelForCountry(form.country) ? ` (${currencyLabelForCountry(form.country)})` : " (devise du pays)"}</span>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => handleChange("price", e.target.value)} className="input w-full" placeholder="100" />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Capacité journalière</span>
                  <input type="number" min="0" value={form.dailyCapacity} onChange={(e) => handleChange("dailyCapacity", e.target.value)} className="input w-full" placeholder="50" />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Payout ($)</span>
                  <input type="number" min="0" step="0.01" value={form.payout} onChange={(e) => handleChange("payout", e.target.value)} className="input w-full" placeholder="6" />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Status</span>
                  <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="input w-full">
                    <option value="active">Actif</option>
                    <option value="paused">En pause</option>
                    <option value="archived">Archivé</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>Horaires de travail</span>
                  <input type="text" value={form.workingHours} onChange={(e) => handleChange("workingHours", e.target.value)} className="input w-full" placeholder="9h - 18h" />
                </label>
                <label className="space-y-2 text-sm sm:col-span-2">
                  <span>Informations supplémentaires</span>
                  <input type="text" value={form.additionalInfo} onChange={(e) => handleChange("additionalInfo", e.target.value)} className="input w-full" placeholder="Notes, contraintes…" />
                </label>
              </div>

              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingProductId(null); }} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="button" disabled={!canAdd || isSaving} onClick={handleAddProduct} className="btn btn-primary disabled:opacity-50">
                  {isSaving ? "Enregistrement…" : editingProductId ? "Modifier le produit" : "Ajouter le produit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1400px]">
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
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="td text-center text-slate-500" colSpan={12}>
                  Aucun produit ajouté pour ce projet.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-brand-mist/40">
                  <td className="td font-mono text-xs">{product.id}</td>
                  <td className="td">{product.name}</td>
                  <td className="td">{product.category || "—"}</td>
                  <td className="td">{product.country || "—"}</td>
                  <td className="td">{product.price ? formatProductPrice(product.price, product.country) : "—"}</td>
                  <td className="td">{product.dailyCapacity || "—"}</td>
                  <td className="td">{product.confirmationRate ? `${product.confirmationRate}%` : "—"}</td>
                  <td className="td">{product.payout ? formatPayout(product.payout) : "—"}</td>
                  <td className="td">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : product.status === "paused"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {product.status || "—"}
                    </span>
                  </td>
                  <td className="td">{product.workingHours || "—"}</td>
                  <td className="td text-sm">{product.additionalInfo || "—"}</td>
                  <td className="td">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
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
