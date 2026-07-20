"use client";

import { useMemo, useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { updateSpend, deleteSpend } from "./actions";
import { SpendFilter, type SpendFilters } from "./SpendFilter";

type SpendRow = {
  id: number;
  date: string;
  account_name: string | null;
  country: string | null;
  campaign: string;
  clicks: number | null;
  impressions: number | null;
  leads: number | null;
  spend: number | null;
  cpl: number | null;
  ctr: number | null;
};

const EMPTY_FILTERS: SpendFilters = {
  date: "", account_name: "", country: "", campaign: "",
  impressions: "", clicks: "", ctr: "", leads: "", spend: "", cpl: "",
};

const contains = (value: unknown, needle: string) =>
  !needle.trim() || String(value ?? "").toLowerCase().includes(needle.trim().toLowerCase());

export default function SpendClient({
  rows,
  campaigns,
  isAdmin,
}: {
  rows: SpendRow[];
  campaigns: string[];
  isAdmin: boolean;
}) {
  const t = useT();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ date: "", account_name: "", country: "", campaign: "", clicks: "", impressions: "", leads: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SpendFilters>({ ...EMPTY_FILTERS });

  const filteredRows = useMemo(() => {
    return rows.filter((s) =>
      contains(new Date(s.date).toLocaleDateString("fr-FR"), filters.date) &&
      contains(s.account_name, filters.account_name) &&
      contains(s.country, filters.country) &&
      contains(s.campaign, filters.campaign) &&
      contains(s.impressions, filters.impressions) &&
      contains(s.clicks, filters.clicks) &&
      contains(s.ctr, filters.ctr) &&
      contains(s.leads, filters.leads) &&
      contains(s.spend, filters.spend) &&
      contains(s.cpl, filters.cpl)
    );
  }, [rows, filters]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openEdit = (s: SpendRow) => {
    setEditingId(s.id);
    setForm({
      date: String(s.date).slice(0, 10),
      account_name: s.account_name ?? "",
      country: s.country ?? "",
      campaign: s.campaign ?? "",
      clicks: s.clicks != null ? String(s.clicks) : "",
      impressions: s.impressions != null ? String(s.impressions) : "",
      leads: s.leads != null ? String(s.leads) : "",
      amount: s.spend != null ? String(s.spend) : "",
    });
  };

  const save = async () => {
    if (editingId == null) return;
    setSaving(true);
    setError(null);
    try {
      await updateSpend(editingId, {
        date: form.date,
        account_name: form.account_name,
        country: form.country,
        campaign: form.campaign,
        clicks: form.clicks ? parseInt(form.clicks, 10) : 0,
        impressions: form.impressions ? parseInt(form.impressions, 10) : 0,
        leads: form.leads ? parseInt(form.leads, 10) : 0,
        spend: form.amount ? parseFloat(form.amount) : 0,
      });
      setEditingId(null);
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm(t("mb.spend.deleteConfirm"))) return;
    try { await deleteSpend(id); window.location.reload(); } catch (e) { alert((e as Error).message); }
  };

  const money = (n: number | null) => (n != null ? `$${Number(n).toFixed(2)}` : "—");
  const pct = (n: number | null) => (n != null ? `${Number(n).toFixed(2)}%` : "—");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("mb.spend.title")}</h1>
        <p className="text-sm text-ink-muted">{t("mb.spend.subtitle")}</p>
      </div>

      {editingId != null && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-lg bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">{t("mb.spend.editSpend")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.date")}</label>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.accountName")}</label>
                <input
                  value={form.account_name}
                  onChange={(e) => set("account_name", e.target.value)}
                  className="input w-full"
                  placeholder={t("mb.spend.accountNamePlaceholder")}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.country")}</label>
                <input value={form.country} onChange={(e) => set("country", e.target.value)} className="input w-full" placeholder="AGO" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.campaign")}</label>
                <input list="mb-campaigns" value={form.campaign} onChange={(e) => set("campaign", e.target.value)} className="input w-full" placeholder={t("mb.spend.campaignPlaceholder")} />
                <datalist id="mb-campaigns">
                  {campaigns.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.amount")}</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="input w-full" placeholder="50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.clicks")}</label>
                <input type="number" step="1" value={form.clicks} onChange={(e) => set("clicks", e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.impressions")}</label>
                <input type="number" step="1" value={form.impressions} onChange={(e) => set("impressions", e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.leads")}</label>
                <input type="number" step="1" value={form.leads} onChange={(e) => set("leads", e.target.value)} className="input w-full" />
              </div>
            </div>
            {error && <div className="alert alert-danger mt-3 text-sm">{error}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="btn-secondary">{t("mb.spend.cancel")}</button>
              <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? "…" : t("mb.spend.edit")}</button>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-ink-muted">
        {filteredRows.length} {t("mb.spend.of")} {rows.length} {t("mb.spend.summary")}
      </div>

      <SpendFilter onFiltersChange={setFilters} />

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("mb.spend.date")}</th>
              <th className="th">{t("mb.spend.thAccountName")}</th>
              <th className="th">{t("mb.spend.country")}</th>
              <th className="th">{t("mb.spend.campaign")}</th>
              <th className="th">{t("mb.spend.impressions")}</th>
              <th className="th">{t("mb.spend.clicks")}</th>
              <th className="th">{t("mb.spend.ctr")}</th>
              <th className="th">{t("mb.spend.leads")}</th>
              <th className="th">{t("mb.spend.amount")}</th>
              <th className="th">{t("mb.spend.cpl")}</th>
              <th className="th">{t("mb.spend.thAction")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((s) => (
              <tr key={s.id} className="row-hover">
                <td className="td">{new Date(s.date).toLocaleDateString("fr-FR")}</td>
                <td className="td">{s.account_name ?? "—"}</td>
                <td className="td">{s.country ?? "—"}</td>
                <td className="td">{s.campaign}</td>
                <td className="td">{s.impressions ?? "—"}</td>
                <td className="td">{s.clicks ?? "—"}</td>
                <td className="td">{pct(s.ctr)}</td>
                <td className="td">{s.leads ?? "—"}</td>
                <td className="td font-semibold">{money(s.spend)}</td>
                <td className="td">{money(s.cpl)}</td>
                <td className="td">
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(s)} className="text-xs text-accent hover:underline">{t("mb.spend.edit")}</button>
                    <button onClick={() => remove(s.id)} className="text-xs text-danger hover:underline">{t("mb.spend.delete")}</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && <tr><td className="td text-center text-ink-muted" colSpan={11}>{t("mb.spend.empty")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
