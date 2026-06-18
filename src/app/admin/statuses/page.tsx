"use client";

import { useEffect, useMemo, useState } from "react";

interface StatusItem {
  id: string;
  title: string;
  group: string;
  hideDateFromAffiliates: boolean;
  sortLabel: string;
}

const GROUP_OPTIONS = ["annulé", "confirmé", "en traitement", "double", "spam/erreur"];
const SORT_OPTIONS = ["Par date de commande"];

const initialForm: StatusItem = {
  id: "",
  title: "",
  group: GROUP_OPTIONS[0],
  hideDateFromAffiliates: false,
  sortLabel: SORT_OPTIONS[0],
};

export default function StatusesAdminPage() {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<StatusItem>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = async () => {
    try {
      const res = await fetch("/api/admin/statuses", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de charger les statuts.");
      setStatuses(data.statuses || []);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const canSubmit = useMemo(
    () => form.id.trim() !== "" && form.title.trim() !== "" && form.group.trim() !== "",
    [form]
  );

  const handleChange = (key: keyof StatusItem, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openNew = () => {
    setEditingId(null);
    setForm(initialForm);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (status: StatusItem) => {
    setEditingId(status.id);
    setForm(status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmer la suppression de ce statut ?")) return;
    try {
      const res = await fetch(`/api/admin/statuses/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression.");
      await fetchStatuses();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    try {
      const url = editingId
        ? `/api/admin/statuses/${encodeURIComponent(editingId)}`
        : "/api/admin/statuses";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          title: form.title,
          group: form.group,
          hideDateFromAffiliates: form.hideDateFromAffiliates,
          sortLabel: form.sortLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement.");
      setIsModalOpen(false);
      setForm(initialForm);
      setEditingId(null);
      await fetchStatuses();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des status</h1>
          <p className="text-sm text-slate-500">Créez, modifiez et supprimez les statuts de commande.</p>
        </div>
        <button type="button" onClick={openNew} className="btn btn-primary max-w-max">
          Créer un statut
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{editingId ? "Modifier le statut" : "Nouveau statut"}</h2>
                <p className="text-sm text-slate-500">Renseigne les informations du statut puis enregistre.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>ID</span>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => handleChange("id", e.target.value)}
                    disabled={!!editingId}
                    className="input w-full disabled:bg-slate-100"
                    placeholder="confirmed"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Titre</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="input w-full"
                    placeholder="Confirmé"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Groupe</span>
                  <select
                    value={form.group}
                    onChange={(e) => handleChange("group", e.target.value)}
                    className="input w-full"
                  >
                    {GROUP_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>Masquer la date aux affiliés</span>
                  <select
                    value={form.hideDateFromAffiliates ? "yes" : "no"}
                    onChange={(e) => handleChange("hideDateFromAffiliates", e.target.value === "yes")}
                    className="input w-full"
                  >
                    <option value="no">Non</option>
                    <option value="yes">Oui</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm sm:col-span-2">
                  <span>Tri</span>
                  <select
                    value={form.sortLabel}
                    onChange={(e) => handleChange("sortLabel", e.target.value)}
                    className="input w-full"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!canSubmit || isSaving}
                  onClick={handleSave}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {isSaving ? "Enregistrement…" : editingId ? "Modifier" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !isModalOpen && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">ID</th>
              <th className="th">Titre</th>
              <th className="th">Groupe</th>
              <th className="th">Masquer la date aux affiliés</th>
              <th className="th">Tri</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {statuses.length === 0 ? (
              <tr>
                <td className="td text-center text-slate-500" colSpan={6}>
                  Aucun statut créé pour le moment.
                </td>
              </tr>
            ) : (
              statuses.map((status) => (
                <tr key={status.id} className="hover:bg-brand-mist/40">
                  <td className="td font-mono text-xs">{status.id}</td>
                  <td className="td">{status.title}</td>
                  <td className="td">{status.group}</td>
                  <td className="td">{status.hideDateFromAffiliates ? "Oui" : "Non"}</td>
                  <td className="td">{status.sortLabel}</td>
                  <td className="td">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(status)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(status.id)}
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
