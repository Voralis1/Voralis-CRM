"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/i18n/I18nProvider";

interface StatusItem {
  id: string;
  title: string;
  group: string;
  hideDateFromAffiliates: boolean;
  sortLabel: string;
}

// Les valeurs (envoyées à l'API) restent en français ; seul le libellé affiché est traduit.
const GROUP_OPTIONS = ["annulé", "confirmé", "en traitement", "double", "spam/erreur"];
const GROUP_LABEL_KEYS: Record<string, string> = {
  "annulé": "adm.statuses.groupCancelled",
  "confirmé": "adm.statuses.groupConfirmed",
  "en traitement": "adm.statuses.groupProcessing",
  "double": "adm.statuses.groupDouble",
  "spam/erreur": "adm.statuses.groupSpam",
};
const SORT_OPTIONS = ["Par date de commande"];
const SORT_LABEL_KEYS: Record<string, string> = {
  "Par date de commande": "adm.statuses.sortByOrderDate",
};

const initialForm: StatusItem = {
  id: "",
  title: "",
  group: GROUP_OPTIONS[0],
  hideDateFromAffiliates: false,
  sortLabel: SORT_OPTIONS[0],
};

export default function StatusesAdminPage() {
  const t = useT();
  const groupLabel = (g: string) => (GROUP_LABEL_KEYS[g] ? t(GROUP_LABEL_KEYS[g]) : g);
  const sortLabel = (s: string) => (SORT_LABEL_KEYS[s] ? t(SORT_LABEL_KEYS[s]) : s);
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
      if (!res.ok) throw new Error(data.error || t("adm.statuses.errLoad"));
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
    if (!confirm(t("adm.statuses.confirmDelete"))) return;
    try {
      const res = await fetch(`/api/admin/statuses/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("adm.statuses.errDelete"));
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
      if (!res.ok) throw new Error(data.error || t("adm.statuses.errSave"));
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
          <h1 className="text-2xl font-bold">{t("adm.statuses.title")}</h1>
          <p className="text-sm text-ink-muted">{t("adm.statuses.subtitle")}</p>
        </div>
        <button type="button" onClick={openNew} className="btn btn-primary max-w-max">
          {t("adm.statuses.create")}
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-ink-muted hover:bg-hovered"
            >
              ✕
            </button>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{editingId ? t("adm.statuses.editStatus") : t("adm.statuses.newStatus")}</h2>
                <p className="text-sm text-ink-muted">{t("adm.statuses.formHint")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>{t("adm.statuses.id")}</span>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => handleChange("id", e.target.value)}
                    disabled={!!editingId}
                    className="input w-full disabled:bg-elevated"
                    placeholder={t("adm.statuses.phId")}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.statuses.statusTitle")}</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="input w-full"
                    placeholder={t("adm.statuses.phTitle")}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.statuses.group")}</span>
                  <select
                    value={form.group}
                    onChange={(e) => handleChange("group", e.target.value)}
                    className="input w-full"
                  >
                    {GROUP_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {groupLabel(g)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.statuses.hideDate")}</span>
                  <select
                    value={form.hideDateFromAffiliates ? "yes" : "no"}
                    onChange={(e) => handleChange("hideDateFromAffiliates", e.target.value === "yes")}
                    className="input w-full"
                  >
                    <option value="no">{t("adm.statuses.no")}</option>
                    <option value="yes">{t("adm.statuses.yes")}</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm sm:col-span-2">
                  <span>{t("adm.statuses.sort")}</span>
                  <select
                    value={form.sortLabel}
                    onChange={(e) => handleChange("sortLabel", e.target.value)}
                    className="input w-full"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {sortLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  {t("adm.statuses.cancel")}
                </button>
                <button
                  type="button"
                  disabled={!canSubmit || isSaving}
                  onClick={handleSave}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {isSaving ? t("adm.statuses.saving") : editingId ? t("adm.statuses.modify") : t("adm.statuses.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !isModalOpen && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("adm.statuses.colId")}</th>
              <th className="th">{t("adm.statuses.colTitle")}</th>
              <th className="th">{t("adm.statuses.colGroup")}</th>
              <th className="th">{t("adm.statuses.colHideDate")}</th>
              <th className="th">{t("adm.statuses.colSort")}</th>
              <th className="th">{t("adm.statuses.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {statuses.length === 0 ? (
              <tr>
                <td className="td text-center text-ink-muted" colSpan={6}>
                  {t("adm.statuses.empty")}
                </td>
              </tr>
            ) : (
              statuses.map((status) => (
                <tr key={status.id} className="row-hover">
                  <td className="td font-mono text-xs">{status.id}</td>
                  <td className="td">{status.title}</td>
                  <td className="td">{groupLabel(status.group)}</td>
                  <td className="td">{status.hideDateFromAffiliates ? t("adm.statuses.yes") : t("adm.statuses.no")}</td>
                  <td className="td">{sortLabel(status.sortLabel)}</td>
                  <td className="td">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(status)}
                        className="text-xs text-accent hover:underline"
                      >
                        {t("adm.statuses.modify")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(status.id)}
                        className="text-xs text-danger hover:underline"
                      >
                        {t("adm.statuses.delete")}
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
