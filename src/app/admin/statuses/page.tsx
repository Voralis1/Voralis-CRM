"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/i18n/I18nProvider";

interface StatusItem {
  id: number;
  slug: string;
  title: string;
  group: string;
  color: string;
  hideDateFromAffiliates: boolean;
  sortLabel: string;
}

interface TitleItem {
  id: number;
  slug: string;
  title: string;
  sortOrder: number;
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

// Palette fixe (mêmes classes Tailwind que les statuts historiques) pour garder
// un rendu de badge cohérent quel que soit le statut, y compris les nouveaux.
const COLOR_OPTIONS = [
  { value: "bg-slate-100 text-slate-700", label: "Gris" },
  { value: "bg-amber-100 text-amber-800", label: "Ambre" },
  { value: "bg-orange-100 text-orange-800", label: "Orange" },
  { value: "bg-yellow-100 text-yellow-800", label: "Jaune" },
  { value: "bg-emerald-100 text-emerald-800", label: "Émeraude" },
  { value: "bg-cyan-100 text-cyan-800", label: "Cyan" },
  { value: "bg-sky-100 text-sky-800", label: "Ciel" },
  { value: "bg-blue-100 text-blue-800", label: "Bleu" },
  { value: "bg-green-200 text-green-900", label: "Vert" },
  { value: "bg-rose-100 text-rose-700", label: "Rose" },
  { value: "bg-red-100 text-red-700", label: "Rouge" },
];

// Slug = identifiant technique stocké dans orders.status (immuable une fois créé).
const SLUG_PATTERN = /^[a-z0-9_]+$/;

const initialForm: Omit<StatusItem, "id"> = {
  slug: "",
  title: "",
  group: GROUP_OPTIONS[0],
  color: COLOR_OPTIONS[0].value,
  hideDateFromAffiliates: false,
  sortLabel: SORT_OPTIONS[0],
};

export default function StatusesAdminPage() {
  const t = useT();
  const groupLabel = (g: string) => (GROUP_LABEL_KEYS[g] ? t(GROUP_LABEL_KEYS[g]) : g);
  const sortLabel = (s: string) => (SORT_LABEL_KEYS[s] ? t(SORT_LABEL_KEYS[s]) : s);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [titles, setTitles] = useState<TitleItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<StatusItem, "id">>(initialForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulaire "nouveau titre" par slug (une saisie en cours par slug).
  const [newTitleDrafts, setNewTitleDrafts] = useState<Record<string, string>>({});
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

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

  const fetchTitles = async () => {
    try {
      const res = await fetch("/api/admin/statuses/titles", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("adm.statuses.errLoad"));
      setTitles(data.titles || []);
    } catch (err) {
      setTitleError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchStatuses();
    fetchTitles();
  }, []);

  const titlesBySlug = useMemo(() => {
    const map = new Map<string, TitleItem[]>();
    for (const ti of titles) {
      const list = map.get(ti.slug) ?? [];
      list.push(ti);
      map.set(ti.slug, list);
    }
    return map;
  }, [titles]);

  const canSubmit = useMemo(
    () =>
      form.slug.trim() !== "" &&
      SLUG_PATTERN.test(form.slug.trim()) &&
      form.title.trim() !== "" &&
      form.group.trim() !== "",
    [form]
  );

  const handleChange = (key: keyof Omit<StatusItem, "id">, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openNew = () => {
    setEditingSlug(null);
    setForm(initialForm);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (status: StatusItem) => {
    setEditingSlug(status.slug);
    setForm(status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(t("adm.statuses.confirmDelete"))) return;
    try {
      const res = await fetch(`/api/admin/statuses/${encodeURIComponent(slug)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("adm.statuses.errDelete"));
      await Promise.all([fetchStatuses(), fetchTitles()]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    try {
      const url = editingSlug
        ? `/api/admin/statuses/${encodeURIComponent(editingSlug)}`
        : "/api/admin/statuses";
      const method = editingSlug ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug.trim(),
          title: form.title,
          group: form.group,
          color: form.color,
          hideDateFromAffiliates: form.hideDateFromAffiliates,
          sortLabel: form.sortLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("adm.statuses.errSave"));
      setIsModalOpen(false);
      setForm(initialForm);
      setEditingSlug(null);
      await Promise.all([fetchStatuses(), fetchTitles()]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTitle = async (slug: string) => {
    const value = (newTitleDrafts[slug] || "").trim();
    if (!value) return;
    setTitleError(null);
    try {
      const res = await fetch("/api/admin/statuses/titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title: value, sortOrder: (titlesBySlug.get(slug)?.length ?? 0) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("adm.statuses.errSaveTitle"));
      setNewTitleDrafts((d) => ({ ...d, [slug]: "" }));
      await fetchTitles();
    } catch (err) {
      setTitleError((err as Error).message);
    }
  };

  const startEditTitle = (ti: TitleItem) => {
    setEditingTitleId(ti.id);
    setEditingTitleValue(ti.title);
    setTitleError(null);
  };

  const saveEditTitle = async () => {
    if (editingTitleId == null) return;
    const value = editingTitleValue.trim();
    if (!value) return;
    try {
      const res = await fetch(`/api/admin/statuses/titles/${editingTitleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("adm.statuses.errSaveTitle"));
      setEditingTitleId(null);
      setEditingTitleValue("");
      await fetchTitles();
    } catch (err) {
      setTitleError((err as Error).message);
    }
  };

  const handleDeleteTitle = async (id: number) => {
    if (!confirm(t("adm.statuses.confirmDeleteTitle"))) return;
    try {
      const res = await fetch(`/api/admin/statuses/titles/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("adm.statuses.errDeleteTitle"));
      await fetchTitles();
    } catch (err) {
      setTitleError((err as Error).message);
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
                <h2 className="text-lg font-semibold">{editingSlug ? t("adm.statuses.editStatus") : t("adm.statuses.newStatus")}</h2>
                <p className="text-sm text-ink-muted">{t("adm.statuses.formHint")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>{t("adm.statuses.slug")}</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleChange("slug", e.target.value.toLowerCase())}
                    disabled={!!editingSlug}
                    className="input w-full disabled:bg-elevated"
                    placeholder={t("adm.statuses.phSlug")}
                  />
                  <span className="text-xs text-ink-muted">{t("adm.statuses.slugHint")}</span>
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
                  <span>{t("adm.statuses.color")}</span>
                  <select
                    value={form.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    className="input w-full"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
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
                  {isSaving ? t("adm.statuses.saving") : editingSlug ? t("adm.statuses.modify") : t("adm.statuses.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !isModalOpen && (
        <div className="alert alert-danger">{error}</div>
      )}
      {titleError && <div className="alert alert-danger">{titleError}</div>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("adm.statuses.colId")}</th>
              <th className="th">{t("adm.statuses.colSlug")}</th>
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
                <td className="td text-center text-ink-muted" colSpan={7}>
                  {t("adm.statuses.empty")}
                </td>
              </tr>
            ) : (
              statuses.map((status) => (
                <tr key={status.slug} className="row-hover align-top">
                  <td className="td font-mono text-xs">{status.id}</td>
                  <td className="td">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.slug}
                    </span>
                  </td>
                  <td className="td">
                    <div>{status.title}</div>
                    <div className="mt-2 space-y-1.5">
                      <div className="text-xs font-medium text-ink-muted">{t("adm.statuses.titlesLabel")}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(titlesBySlug.get(status.slug) ?? []).map((ti) =>
                          editingTitleId === ti.id ? (
                            <span key={ti.id} className="inline-flex items-center gap-1">
                              <input
                                autoFocus
                                value={editingTitleValue}
                                onChange={(e) => setEditingTitleValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveEditTitle()}
                                className="input h-7 w-32 text-xs"
                              />
                              <button onClick={saveEditTitle} className="text-xs text-accent hover:underline">
                                ✓
                              </button>
                              <button onClick={() => setEditingTitleId(null)} className="text-xs text-ink-muted hover:underline">
                                ✕
                              </button>
                            </span>
                          ) : (
                            <span
                              key={ti.id}
                              className="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-xs"
                            >
                              {ti.title}
                              <button onClick={() => startEditTitle(ti)} className="text-ink-muted hover:text-accent" title={t("adm.statuses.modify")}>
                                ✎
                              </button>
                              <button onClick={() => handleDeleteTitle(ti.id)} className="text-ink-muted hover:text-danger" title={t("adm.statuses.delete")}>
                                ×
                              </button>
                            </span>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          value={newTitleDrafts[status.slug] || ""}
                          onChange={(e) => setNewTitleDrafts((d) => ({ ...d, [status.slug]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handleAddTitle(status.slug)}
                          placeholder={t("adm.statuses.newTitlePlaceholder")}
                          className="input h-7 w-36 text-xs"
                        />
                        <button
                          onClick={() => handleAddTitle(status.slug)}
                          className="text-xs text-accent hover:underline whitespace-nowrap"
                        >
                          {t("adm.statuses.addTitle")}
                        </button>
                      </div>
                    </div>
                  </td>
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
                        onClick={() => handleDelete(status.slug)}
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
