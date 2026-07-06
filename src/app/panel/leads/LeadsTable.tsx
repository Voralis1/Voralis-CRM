"use client";

import { STATUS_META, type OrderStatus, ALL_STATUSES } from "@/lib/types";
import { useState } from "react";
import { updateOrder, createOrder, deleteOrder, fetchProducts } from "./actions";
import { formatPayout } from "@/lib/currency";
import { useT } from "@/i18n/I18nProvider";

interface LeadsTableProps {
  rows: any[];
}

interface Product {
  id: string;
  name: string;
  payout: number | null;
  country: string | null;
}

export function LeadsTable({ rows }: LeadsTableProps) {
  const t = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createData, setCreateData] = useState({
    affiliate: "",
    product_id: "",
    first_name: "",
    last_name: "",
    phone: "",
    country: "",
    address: "",
    status: "new",
    payout_amount: "",
    comment: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [deletingOrder, setDeletingOrder] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportExcel = () => {
    // Préparation des données
    const csvContent = [
      [
        t("aff.leads.colOrderId"),
        t("aff.leads.colProduct"),
        t("aff.leads.colCountry"),
        t("aff.leads.colNetwork"),
        t("aff.leads.colAffiliate"),
        t("aff.leads.colReceivedDate"),
        t("aff.leads.labelStatus"),
        t("aff.leads.colPayout"),
        t("aff.leads.colFullName"),
        t("aff.leads.colPhone"),
        t("aff.leads.colAddress"),
        t("aff.leads.colExtraInfo"),
      ],
      ...rows.map((o) => {
        const meta = STATUS_META[o.status as OrderStatus];
        const affiliates = o.affiliate_network as any;
        const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;

        return [
          o.public_id,
          o.product ?? "",
          o.country ?? "",
          affiliates?.name ?? "",
          o.affiliate ?? "",
          new Date(o.created_at).toLocaleString("fr-FR"),
          meta?.label ?? o.status,
          o.payout_amount != null ? formatPayout(o.payout_amount) : "",
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

  const handleCreateClick = async () => {
    const productsList = await fetchProducts();
    setProducts(productsList);
    setIsCreating(true);
  };

  const handleEditClick = async (order: any) => {
    // Charge les produits pour permettre de changer de produit en édition.
    if (products.length === 0) {
      try {
        setProducts(await fetchProducts());
      } catch {
        /* ignore */
      }
    }
    setEditingId(order.id);
    setEditData({
      first_name: order.first_name ?? "",
      last_name: order.last_name ?? "",
      phone: order.phone ?? "",
      address: order.address ?? "",
      country: order.country ?? "",
      comment: order.comment ?? "",
      payout_amount: order.payout_amount ?? "",
      status: order.status ?? "new",
      affiliate: order.affiliate ?? "",
      product_id: order.product_id ?? "",
    });
  };

  const confirmDelete = async () => {
    if (!deletingOrder) return;
    setIsDeleting(true);
    try {
      await deleteOrder(deletingOrder.id);
      setDeletingOrder(null);
      window.location.reload();
    } catch (error) {
      alert(`${t("aff.leads.errorPrefix")}: ${error}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateOrder(editingId, editData);
      setEditingId(null);
      window.location.reload();
    } catch (error) {
      alert(`${t("aff.leads.errorPrefix")}: ${error}`);
    }
  };

  const handleSaveCreate = async () => {
    try {
      if (!createData.affiliate || !createData.product_id) {
        alert(t("aff.leads.validationMissing"));
        return;
      }
      await createOrder({
        affiliate: createData.affiliate,
        product_id: createData.product_id,
        first_name: createData.first_name,
        last_name: createData.last_name,
        phone: createData.phone,
        country: createData.country,
        address: createData.address || undefined,
        status: createData.status,
        payout_amount: createData.payout_amount
          ? parseFloat(createData.payout_amount as any)
          : undefined,
        comment: createData.comment || undefined,
      });
      setIsCreating(false);
      window.location.reload();
    } catch (error) {
      alert(`${t("aff.leads.errorPrefix")}: ${error}`);
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          className="btn-primary"
        >
          📥 {t("aff.leads.exportExcel")}
        </button>
        <button
          onClick={handleCreateClick}
          className="btn-primary"
        >
          ✏️ {t("aff.leads.addLead")}
        </button>
      </div>

      {isCreating && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="modal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{t("aff.leads.createTitle")}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t("aff.leads.labelAffiliateRequired")}</label>
                  <input
                    type="text"
                    value={createData.affiliate}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        affiliate: e.target.value,
                      })
                    }
                    placeholder={t("aff.leads.affiliatePlaceholder")}
                    className="input w-full"
                  />
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("aff.leads.affiliateHelp")}
                  </p>
                </div>

                <div>
                  <label className="label">
                    {t("aff.leads.labelProductRequired")}
                  </label>
                  <select
                    value={createData.product_id}
                    onChange={(e) => {
                      const selected = products.find((p) => p.id === e.target.value);
                      setCreateData({
                        ...createData,
                        product_id: e.target.value,
                        // Pré-remplit le payout (en dollars) avec celui du produit choisi.
                        payout_amount:
                          selected?.payout != null
                            ? String(selected.payout)
                            : createData.payout_amount,
                      });
                    }}
                    className="input w-full"
                  >
                    <option value="">{t("aff.leads.selectPlaceholder")}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.country ? ` — ${product.country}` : ""}
                        {product.payout != null ? ` (${formatPayout(product.payout)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    {t("aff.leads.labelFirstNameRequired")}
                  </label>
                  <input
                    type="text"
                    value={createData.first_name}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        first_name: e.target.value,
                      })
                    }
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="label">{t("aff.leads.labelLastName")}</label>
                  <input
                    type="text"
                    value={createData.last_name}
                    onChange={(e) =>
                      setCreateData({ ...createData, last_name: e.target.value })
                    }
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    {t("aff.leads.labelPhoneRequired")}
                  </label>
                  <input
                    type="text"
                    value={createData.phone}
                    onChange={(e) =>
                      setCreateData({ ...createData, phone: e.target.value })
                    }
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="label">{t("aff.leads.labelCountryRequired")}</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="FR"
                    value={createData.country}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        country: e.target.value.toUpperCase(),
                      })
                    }
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label">{t("aff.leads.labelAddress")}</label>
                <input
                  type="text"
                  value={createData.address}
                  onChange={(e) =>
                    setCreateData({ ...createData, address: e.target.value })
                  }
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t("aff.leads.labelStatus")}</label>
                  <select
                    value={createData.status}
                    onChange={(e) =>
                      setCreateData({ ...createData, status: e.target.value })
                    }
                    className="input w-full"
                  >
                    {ALL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_META[status].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">{t("aff.leads.labelPayout")}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={createData.payout_amount}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        payout_amount: e.target.value,
                      })
                    }
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  {t("aff.leads.labelExtraInfo")}
                </label>
                <textarea
                  value={createData.comment}
                  onChange={(e) =>
                    setCreateData({ ...createData, comment: e.target.value })
                  }
                  className="input w-full"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setIsCreating(false)}
                  className="btn-secondary"
                >
                  {t("aff.leads.cancel")}
                </button>
                <button
                  onClick={handleSaveCreate}
                  className="btn-primary"
                >
                  {t("aff.leads.createButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="modal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{t("aff.leads.editTitle")}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t("aff.leads.labelAffiliate")}</label>
                  <input
                    type="text"
                    value={editData.affiliate || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, affiliate: e.target.value })
                    }
                    placeholder="Sous-composant de l'affiliate network"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="label">{t("aff.leads.labelProduct")}</label>
                  <select
                    value={editData.product_id || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, product_id: e.target.value })
                    }
                    className="input w-full"
                  >
                    <option value="">{t("aff.leads.selectPlaceholder")}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.country ? ` — ${product.country}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t("aff.leads.labelStatus")}</label>
                  <select
                    value={editData.status || "new"}
                    onChange={(e) =>
                      setEditData({ ...editData, status: e.target.value })
                    }
                    className="input w-full"
                  >
                    {ALL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_META[status].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">{t("aff.leads.labelFirstName")}</label>
                <input
                  type="text"
                  value={editData.first_name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, first_name: e.target.value })
                  }
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">{t("aff.leads.labelLastName")}</label>
                <input
                  type="text"
                  value={editData.last_name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, last_name: e.target.value })
                  }
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">{t("aff.leads.labelPhone")}</label>
                <input
                  type="text"
                  value={editData.phone || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">{t("aff.leads.labelAddress")}</label>
                <input
                  type="text"
                  value={editData.address || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">{t("aff.leads.labelCountry")}</label>
                <input
                  type="text"
                  value={editData.country || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, country: e.target.value })
                  }
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">
                  {t("aff.leads.labelExtraInfo")}
                </label>
                <textarea
                  value={editData.comment || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, comment: e.target.value })
                  }
                  className="input w-full"
                  rows={3}
                />
              </div>

              <div>
                <label className="label">{t("aff.leads.labelPayout")}</label>
                <input
                  type="number"
                  step="0.01"
                  value={editData.payout_amount || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      payout_amount: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="input w-full"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingId(null)}
                  className="btn-secondary"
                >
                  {t("aff.leads.cancel")}
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary"
                >
                  {t("aff.leads.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingOrder && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="modal max-w-md w-full">
            <h2 className="text-xl font-bold mb-2">{t("aff.leads.deleteTitle")}</h2>
            <p className="text-sm text-ink-muted">
              {t("aff.leads.deleteConfirmPre")}{" "}
              <span className="font-mono font-semibold">{deletingOrder.public_id}</span>{" "}
              {t("aff.leads.deleteConfirmPost")}
            </p>
            <div className="flex gap-2 justify-end pt-6">
              <button
                onClick={() => setDeletingOrder(null)}
                disabled={isDeleting}
                className="btn-secondary disabled:opacity-50"
              >
                {t("aff.leads.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn-danger disabled:opacity-50"
              >
                {isDeleting ? t("aff.leads.deleting") : t("aff.leads.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead>
            <tr>
              <th className="th">{t("aff.leads.colOrderId")}</th>
              <th className="th">{t("aff.leads.colProduct")}</th>
              <th className="th">{t("aff.leads.colCountry")}</th>
              <th className="th">{t("aff.leads.colNetwork")}</th>
              <th className="th">{t("aff.leads.colAffiliate")}</th>
              <th className="th">{t("aff.leads.colReceivedDate")}</th>
              <th className="th">{t("aff.leads.colLastStatus")}</th>
              <th className="th">{t("aff.leads.colPayout")}</th>
              <th className="th">{t("aff.leads.colFullName")}</th>
              <th className="th">{t("aff.leads.colPhone")}</th>
              <th className="th">{t("aff.leads.colAddress")}</th>
              <th className="th">{t("aff.leads.colExtraInfo")}</th>
              <th className="th">{t("aff.leads.colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const meta = STATUS_META[o.status as OrderStatus];
              const affiliates = o.affiliate_network as any;
              const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;

              return (
                <tr key={o.public_id} className="row-hover">
                  <td className="td font-mono text-xs">{o.public_id}</td>
                  <td className="td">{o.product ?? "—"}</td>
                  <td className="td">{o.country}</td>
                  <td className="td">{affiliates?.name ?? "—"}</td>
                  <td className="td">{o.affiliate ?? "—"}</td>
                  <td className="td text-xs text-ink-muted">
                    {new Date(o.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="td">
                    <span
                      className={`badge ${meta?.color}`}
                    >
                      {meta?.label ?? o.status}
                    </span>
                  </td>
                  <td className="td">
                    {o.payout_amount != null
                      ? formatPayout(o.payout_amount)
                      : "—"}
                  </td>
                  <td className="td">{fullName}</td>
                  <td className="td">{o.phone}</td>
                  <td className="td text-sm">{o.address ?? "—"}</td>
                  <td className="td text-sm">{o.comment ?? "—"}</td>
                  <td className="td">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEditClick(o)}
                        className="text-accent hover:text-ink font-medium"
                      >
                        {t("aff.leads.edit")}
                      </button>
                      <button
                        onClick={() => setDeletingOrder(o)}
                        className="text-danger hover:text-ink font-medium"
                      >
                        {t("aff.leads.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  className="td text-center text-ink-muted"
                  colSpan={13}
                >
                  {t("aff.leads.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
