"use client";

import { STATUS_META, type OrderStatus, ALL_STATUSES } from "@/lib/types";
import { useState } from "react";
import { updateOrder, createOrder, fetchAffiliates, fetchOffers } from "./actions";

interface LeadsTableProps {
  rows: any[];
}

interface Affiliate {
  id: string;
  name: string;
}

interface Offer {
  id: string;
  product: string;
  country: string;
}

export function LeadsTable({ rows }: LeadsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createData, setCreateData] = useState({
    affiliate_id: "",
    offer_id: "",
    first_name: "",
    last_name: "",
    phone: "",
    country: "",
    address: "",
    status: "new",
    payout_amount: "",
    comment: "",
    sub1: "",
  });
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  const handleExportExcel = () => {
    // Préparation des données
    const csvContent = [
      [
        "ID de la commande",
        "Produit",
        "Pays",
        "Affiliate network",
        "ID de l'Affiliate",
        "Date de réception",
        "Statut",
        "Prix",
        "Nom complet",
        "Téléphone",
        "Adresse",
        "Informations additionnelles",
        "Source",
      ],
      ...rows.map((o) => {
        const meta = STATUS_META[o.status as OrderStatus];
        const offers = o.offers as any;
        const affiliates = o.affiliates as any;
        const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;

        return [
          o.public_id,
          offers?.product ?? "",
          o.country,
          affiliates?.name ?? "",
          o.affiliate_id,
          new Date(o.created_at).toLocaleString("fr-FR"),
          meta?.label ?? o.status,
          o.payout_amount != null ? Number(o.payout_amount).toFixed(2) : "",
          fullName,
          o.phone,
          o.address ?? "",
          o.comment ?? "",
          o.sub1 ?? "",
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
    const [affiliatesList, offersList] = await Promise.all([
      fetchAffiliates(),
      fetchOffers(),
    ]);
    setAffiliates(affiliatesList);
    setOffers(offersList);
    setIsCreating(true);
  };

  const handleEditClick = (order: any) => {
    setEditingId(order.id);
    setEditData({
      first_name: order.first_name,
      last_name: order.last_name,
      phone: order.phone,
      address: order.address,
      country: order.country,
      comment: order.comment,
      payout_amount: order.payout_amount,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateOrder(editingId, editData);
      setEditingId(null);
      window.location.reload();
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  const handleSaveCreate = async () => {
    try {
      if (!createData.affiliate_id || !createData.offer_id) {
        alert("Veuillez remplir au moins l'affiliate et l'offre");
        return;
      }
      await createOrder({
        affiliate_id: createData.affiliate_id,
        offer_id: createData.offer_id,
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
        sub1: createData.sub1 || undefined,
      });
      setIsCreating(false);
      window.location.reload();
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
        >
          📥 Télécharger en Excel
        </button>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          ✏️ Ajouter un lead
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Ajouter un nouveau lead</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Affiliate Network *
                  </label>
                  <select
                    value={createData.affiliate_id}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        affiliate_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">-- Sélectionner --</option>
                    {affiliates.map((aff) => (
                      <option key={aff.id} value={aff.id}>
                        {aff.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Produit *
                  </label>
                  <select
                    value={createData.offer_id}
                    onChange={(e) =>
                      setCreateData({ ...createData, offer_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">-- Sélectionner --</option>
                    {offers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.product} ({offer.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Prénom *
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={createData.last_name}
                    onChange={(e) =>
                      setCreateData({ ...createData, last_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="text"
                    value={createData.phone}
                    onChange={(e) =>
                      setCreateData({ ...createData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Pays *</label>
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  value={createData.address}
                  onChange={(e) =>
                    setCreateData({ ...createData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Statut</label>
                  <select
                    value={createData.status}
                    onChange={(e) =>
                      setCreateData({ ...createData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {ALL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_META[status].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Prix</label>
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Informations additionnelles
                </label>
                <textarea
                  value={createData.comment}
                  onChange={(e) =>
                    setCreateData({ ...createData, comment: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <select
                  value={createData.sub1}
                  onChange={(e) =>
                    setCreateData({ ...createData, sub1: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="API">API</option>
                  <option value="Manuel">Manuel</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveCreate}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                >
                  Créer le lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Modifier le lead</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prénom</label>
                <input
                  type="text"
                  value={editData.first_name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, first_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={editData.last_name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, last_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="text"
                  value={editData.phone || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  value={editData.address || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pays</label>
                <input
                  type="text"
                  value={editData.country || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, country: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Informations additionnelles
                </label>
                <textarea
                  value={editData.comment || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, comment: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prix</label>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">ID de la commande</th>
              <th className="th">Produit</th>
              <th className="th">Pays</th>
              <th className="th">Affiliate network</th>
              <th className="th">ID de l'Affiliate</th>
              <th className="th">Date de réception</th>
              <th className="th">status de la dernière mise à jour</th>
              <th className="th">Prix</th>
              <th className="th">Nom complet</th>
              <th className="th">Téléphone</th>
              <th className="th">Adresse</th>
              <th className="th">Informations additionnelles</th>
              <th className="th">Source</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const meta = STATUS_META[o.status as OrderStatus];
              const offers = o.offers as any;
              const affiliates = o.affiliates as any;
              const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;

              return (
                <tr key={o.public_id} className="hover:bg-brand-mist/50">
                  <td className="td font-mono text-xs">{o.public_id}</td>
                  <td className="td">{offers?.product ?? "—"}</td>
                  <td className="td">{o.country}</td>
                  <td className="td">{affiliates?.name ?? "—"}</td>
                  <td className="td font-mono text-xs text-slate-500">
                    {o.affiliate_id}
                  </td>
                  <td className="td text-xs text-slate-500">
                    {new Date(o.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="td">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta?.color}`}
                    >
                      {meta?.label ?? o.status}
                    </span>
                  </td>
                  <td className="td">
                    {o.payout_amount != null
                      ? `$${Number(o.payout_amount).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="td">{fullName}</td>
                  <td className="td">{o.phone}</td>
                  <td className="td text-sm">{o.address ?? "—"}</td>
                  <td className="td text-sm">{o.comment ?? "—"}</td>
                  <td className="td font-mono text-xs text-slate-500">
                    {o.sub1 ?? "—"}
                  </td>
                  <td className="td">
                    <button
                      onClick={() => handleEditClick(o)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Éditer
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  className="td text-center text-slate-400"
                  colSpan={14}
                >
                  Aucun lead pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
