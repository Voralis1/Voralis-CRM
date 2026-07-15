"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatProductPrice, formatPayout, currencyLabelForCountry } from "@/lib/currency";
import { useT } from "@/i18n/I18nProvider";
import { downloadFile } from "@/lib/downloadFile";

interface Product {
  id: string;
  name: string;
  category: string;
  country: string;
  price: string;
  dailyCapacity: string;
  quantity: string;
  confirmationRate: string;
  payout: string;
  status: string;
  workingHours: string;
  additionalInfo: string;
  imageUrl: string;
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
  quantity: "",
  confirmationRate: "",
  payout: "",
  status: "active",
  workingHours: "",
  additionalInfo: "",
  imageUrl: "",
};

export default function ProjectDetailsPage({ params }: ProjectPageProps) {
  const t = useT();
  const { projectId } = params;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Product>(initialProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Redimensionne l'image côté client (max 400px) puis l'encode en data-URL.
  const handleImageFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("adm.products.errNotImage"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 400;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        handleChange("imageUrl", canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("adm.products.errLoadProject"));
      setProject(data.project);
      setProducts(data.products || []);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  // Ouvre automatiquement le modal d'édition si on arrive avec ?edit=<id>
  // (depuis la page de détail du produit).
  useEffect(() => {
    if (!products.length) return;
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;
    const p = products.find((x) => String(x.id) === editId);
    if (p) {
      handleEditProduct(p);
      router.replace(`/admin/products/${encodeURIComponent(projectId)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

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
    if (!confirm(t("adm.products.confirmDeleteProduct"))) return;
    try {
      const response = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t("adm.products.errDelete"));
      await fetchProject();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDownloadCSV = () => {
    if (products.length === 0) {
      alert(t("adm.products.noProductsToDownload"));
      return;
    }
    const headers = [
      t("adm.products.csvId"), t("adm.products.csvName"), t("adm.products.csvCategory"), t("adm.products.csvCountry"), t("adm.products.csvPrice"),
      t("adm.products.csvCapacity"), t("adm.products.csvQuantity"), t("adm.products.csvConfirmationRate"), t("adm.products.csvPayout"), t("adm.products.csvStatus"),
      t("adm.products.csvHours"), t("adm.products.csvExtra"),
    ];
    const rows = products.map((p) => [
      p.id, p.name, p.category, p.country, p.price,
      p.dailyCapacity, p.quantity, p.confirmationRate, p.payout, p.status,
      p.workingHours, p.additionalInfo,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((val) => `"${val ?? ""}"`).join(",")).join("\n");
    downloadFile(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `produits-${project?.name || "export"}.csv`
    );
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
          quantity: form.quantity,
          payout: form.payout,
          status: form.status,
          workingHours: form.workingHours,
          additionalInfo: form.additionalInfo,
          imageUrl: form.imageUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("adm.products.errOperation"));

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
        <div className="text-lg font-semibold">{t("adm.products.projectNotFound")}</div>
        <p className="text-sm text-ink-muted">{t("adm.products.projectNotFoundHint")}</p>
        <button type="button" onClick={() => router.push("/admin/products")} className="btn btn-secondary mt-4">
          {t("adm.products.backToProductsMgmt")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("adm.products.projectLabel")} {project.name}</h1>
          <p className="text-sm text-ink-muted">{t("adm.products.idLabel")} {project.id} • {t("adm.products.createdOn")} {new Date(project.createdAt).toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={openNewProductModal} className="btn btn-primary">
            {t("adm.products.addProduct")}
          </button>
          <button type="button" onClick={handleDownloadCSV} className="btn btn-secondary">
            {t("adm.products.downloadCsv")}
          </button>
          <button type="button" onClick={() => router.push("/admin/products")} className="btn btn-secondary">
            {t("adm.products.backToProjects")}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-ink-muted text-sm">{t("adm.products.expiration")}</div>
            <div className="mt-1 font-medium">{new Date(project.expiresAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div>
            <div className="text-ink-muted text-sm">{t("adm.products.productCount")}</div>
            <div className="mt-1 font-medium">{products.length}</div>
          </div>
          <div>
            <div className="text-ink-muted text-sm">{t("adm.products.requestedCount")}</div>
            <div className="mt-1 font-medium">{project.productCount}</div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-ink-muted hover:bg-hovered"
            >
              ✕
            </button>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{editingProductId ? t("adm.products.editProduct") : t("adm.products.addNewProduct")}</h2>
                <p className="text-sm text-ink-muted">{t("adm.products.productFormHint")}</p>
              </div>

              <div className="flex items-center gap-4 sm:col-span-2">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-elevated">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt={t("adm.products.preview")} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-ink-faint">{t("adm.products.none")}</span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <span className="block">{t("adm.products.productImage")}</span>
                  <div className="flex items-center gap-2">
                    <label className="btn btn-secondary cursor-pointer text-xs">
                      {t("adm.products.chooseImage")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {form.imageUrl && (
                      <button type="button" onClick={() => handleChange("imageUrl", "")} className="text-xs text-danger hover:underline">
                        {t("adm.products.removeImage")}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.productId")}</span>
                  <input type="text" value={form.id} onChange={(e) => handleChange("id", e.target.value)} disabled={!!editingProductId} className="input w-full disabled:bg-elevated" placeholder={t("adm.products.phProductId")} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.productNameLabel")}</span>
                  <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="input w-full" placeholder={t("adm.products.phProductName")} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.category")}</span>
                  <input type="text" value={form.category} onChange={(e) => handleChange("category", e.target.value)} className="input w-full" placeholder={t("adm.products.phCategory")} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.country")}</span>
                  <input type="text" value={form.country} onChange={(e) => handleChange("country", e.target.value)} className="input w-full" placeholder={t("adm.products.phCountry")} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.price")}{currencyLabelForCountry(form.country) ? ` (${currencyLabelForCountry(form.country)})` : ` (${t("adm.products.priceCurrency")})`}</span>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => handleChange("price", e.target.value)} className="input w-full" placeholder={t("adm.products.phPrice")} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.dailyCapacity")}</span>
                  <input type="number" min="0" value={form.dailyCapacity} onChange={(e) => handleChange("dailyCapacity", e.target.value)} className="input w-full" placeholder={t("adm.products.phCapacity")} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.quantity")}</span>
                  <input type="number" min="0" value={form.quantity} onChange={(e) => handleChange("quantity", e.target.value)} className="input w-full" placeholder={t("adm.products.phQuantity")} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.payoutDollar")}</span>
                  <input type="number" min="0" step="0.01" value={form.payout} onChange={(e) => handleChange("payout", e.target.value)} className="input w-full" placeholder={t("adm.products.phPayout")} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.status")}</span>
                  <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="input w-full">
                    <option value="active">{t("adm.products.statusActive")}</option>
                    <option value="paused">{t("adm.products.statusPaused")}</option>
                    <option value="archived">{t("adm.products.statusArchived")}</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.workingHours")}</span>
                  <input type="text" value={form.workingHours} onChange={(e) => handleChange("workingHours", e.target.value)} className="input w-full" placeholder={t("adm.products.phHours")} />
                </label>
                <label className="space-y-2 text-sm sm:col-span-2">
                  <span>{t("adm.products.additionalInfo")}</span>
                  <input type="text" value={form.additionalInfo} onChange={(e) => handleChange("additionalInfo", e.target.value)} className="input w-full" placeholder={t("adm.products.phExtra")} />
                </label>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingProductId(null); }} className="btn btn-secondary">
                  {t("adm.products.cancel")}
                </button>
                <button type="button" disabled={!canAdd || isSaving} onClick={handleAddProduct} className="btn btn-primary disabled:opacity-50">
                  {isSaving ? t("adm.products.saving") : editingProductId ? t("adm.products.editProduct") : t("adm.products.addProductBtn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("adm.products.colImage")}</th>
              <th className="th">{t("adm.products.productId")}</th>
              <th className="th">{t("adm.products.productNameLabel")}</th>
              <th className="th">{t("adm.products.category")}</th>
              <th className="th">{t("adm.products.country")}</th>
              <th className="th">{t("adm.products.price")}</th>
              <th className="th">{t("adm.products.dailyCapacity")}</th>
              <th className="th">{t("adm.products.quantity")}</th>
              <th className="th">{t("adm.products.colConfirmationRate")}</th>
              <th className="th">{t("adm.products.payoutDollar")}</th>
              <th className="th">{t("adm.products.status")}</th>
              <th className="th">{t("adm.products.workingHours")}</th>
              <th className="th">{t("adm.products.additionalInfo")}</th>
              <th className="th">{t("adm.products.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="td text-center text-ink-muted" colSpan={14}>
                  {t("adm.products.emptyProducts")}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="row-hover cursor-pointer"
                  onClick={() => router.push(`/admin/products/${encodeURIComponent(projectId)}/${encodeURIComponent(product.id)}`)}
                  title={t("adm.products.viewDetails")}
                >
                  <td className="td">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-white">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-ink-faint">—</span>
                      )}
                    </div>
                  </td>
                  <td className="td font-mono text-xs">{product.id}</td>
                  <td className="td">{product.name}</td>
                  <td className="td">{product.category || "—"}</td>
                  <td className="td">{product.country || "—"}</td>
                  <td className="td">{product.price ? formatProductPrice(product.price, product.country) : "—"}</td>
                  <td className="td">{product.dailyCapacity || "—"}</td>
                  <td className="td">{product.quantity || "—"}</td>
                  <td className="td">{product.confirmationRate ? `${product.confirmationRate}%` : "—"}</td>
                  <td className="td">{product.payout ? formatPayout(product.payout) : "—"}</td>
                  <td className="td">
                    <span className={`badge ${
                      product.status === "active"
                        ? "badge-success"
                        : product.status === "paused"
                        ? "badge-warning"
                        : "badge-neutral"
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
                        onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                        className="text-xs text-accent hover:underline"
                      >
                        {t("adm.products.modify")}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                        className="text-xs text-danger hover:underline"
                      >
                        {t("adm.products.delete")}
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
