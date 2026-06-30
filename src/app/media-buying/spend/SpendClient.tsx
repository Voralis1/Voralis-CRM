"use client";

import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { createSpend, updateSpend, deleteSpend } from "./actions";

export default function SpendClient({
  rows,
  campaigns,
  defaultBuyer,
}: {
  rows: any[];
  campaigns: string[];
  defaultBuyer: string;
}) {
  const t = useT();
  const today = new Date().toISOString().slice(0, 10);
  const empty = { date: today, buyer_name: defaultBuyer, country: "", campaign: "", amount_usd: "", note: "" };
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditingId(null); setForm({ ...empty }); setOpen(true); };
  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      date: String(s.date).slice(0, 10),
      buyer_name: s.buyer_name ?? "",
      country: s.country ?? "",
      campaign: s.campaign ?? "",
      amount_usd: s.amount_usd != null ? String(s.amount_usd) : "",
      note: s.note ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        date: form.date,
        buyer_name: form.buyer_name,
        country: form.country,
        campaign: form.campaign,
        amount_usd: form.amount_usd ? parseFloat(form.amount_usd) : 0,
        note: form.note,
      };
      if (editingId) await updateSpend(editingId, payload);
      else await createSpend(payload);
      setForm({ ...empty });
      setEditingId(null);
      setOpen(false);
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t("mb.spend.deleteConfirm"))) return;
    try { await deleteSpend(id); window.location.reload(); } catch (e) { alert((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("mb.spend.title")}</h1>
          <p className="text-sm text-ink-muted">{t("mb.spend.subtitle")}</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          {t("mb.spend.add")}
        </button>
      </div>

      {open && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-lg bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">{editingId ? t("mb.spend.editSpend") : t("mb.spend.newSpend")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.date")}</label>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.buyer")}</label>
                <input value={form.buyer_name} onChange={(e) => set("buyer_name", e.target.value)} className="input w-full" placeholder={t("mb.spend.buyerPlaceholder")} />
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
                <input type="number" step="0.01" value={form.amount_usd} onChange={(e) => set("amount_usd", e.target.value)} className="input w-full" placeholder="50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.spend.note")}</label>
                <input value={form.note} onChange={(e) => set("note", e.target.value)} className="input w-full" />
              </div>
            </div>
            {error && <div className="alert alert-danger mt-3 text-sm">{error}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setOpen(false); setEditingId(null); }} className="btn-secondary">{t("mb.spend.cancel")}</button>
              <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? "…" : editingId ? t("mb.spend.edit") : t("mb.spend.save")}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("mb.spend.date")}</th><th className="th">{t("mb.spend.buyer")}</th><th className="th">{t("mb.spend.country")}</th>
              <th className="th">{t("mb.spend.campaign")}</th><th className="th">{t("mb.spend.amount")}</th><th className="th">{t("mb.spend.thNote")}</th><th className="th">{t("mb.spend.thAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="row-hover">
                <td className="td">{new Date(s.date).toLocaleDateString("fr-FR")}</td>
                <td className="td">{s.buyer_name ?? "—"}</td>
                <td className="td">{s.country ?? "—"}</td>
                <td className="td">{s.campaign}</td>
                <td className="td font-semibold">${Number(s.amount_usd).toFixed(2)}</td>
                <td className="td text-sm">{s.note ?? "—"}</td>
                <td className="td">
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(s)} className="text-xs text-accent hover:underline">{t("mb.spend.edit")}</button>
                    <button onClick={() => remove(s.id)} className="text-xs text-danger hover:underline">{t("mb.spend.delete")}</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-center text-ink-muted" colSpan={7}>{t("mb.spend.empty")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
