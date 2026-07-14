"use client";

import { useState } from "react";
import { formatProductPrice } from "@/lib/currency";
import { useT } from "@/i18n/I18nProvider";
import { statusMeta, type OrderStatusRow } from "@/lib/orderStatus";
import { createMbOrder, deleteMbOrder } from "./actions";

const empty = {
  product: "", country: "", campaign: "",
  first_name: "", last_name: "", phone: "",
  address: "", city: "", quantity: "1",
  payout_amount: "", status: "new", comment: "",
};

export default function OrdersClient({
  rows,
  products = [],
  campaigns = [],
  statuses,
}: {
  rows: any[];
  products?: string[];
  campaigns?: string[];
  statuses: OrderStatusRow[];
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await createMbOrder({
        product: form.product, country: form.country, campaign: form.campaign,
        first_name: form.first_name, last_name: form.last_name, phone: form.phone,
        address: form.address, city: form.city,
        quantity: form.quantity ? parseInt(form.quantity, 10) : 1,
        payout_amount: form.payout_amount ? parseFloat(form.payout_amount) : null,
        status: form.status, comment: form.comment,
      });
      setForm({ ...empty });
      setOpen(false);
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t("mb.orders.deleteConfirm"))) return;
    try {
      await deleteMbOrder(id);
      window.location.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("mb.orders.title")}</h1>
          <p className="text-sm text-ink-muted">{t("mb.orders.subtitle")}</p>
        </div>
        <button onClick={() => { setForm({ ...empty }); setOpen(true); }} className="btn-primary">
          {t("mb.orders.add")}
        </button>
      </div>

      {open && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">{t("mb.orders.newOrder")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("mb.orders.firstName")} v={form.first_name} on={(v) => set("first_name", v)} />
              <Field label={t("mb.orders.lastName")} v={form.last_name} on={(v) => set("last_name", v)} />
              <Field label={t("mb.orders.phone")} v={form.phone} on={(v) => set("phone", v)} />
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.orders.product")}</label>
                <select value={form.product} onChange={(e) => set("product", e.target.value)} className="input w-full">
                  <option value="">{t("mb.orders.selectOption")}</option>
                  {products.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <Field label={t("mb.orders.country")} v={form.country} on={(v) => set("country", v)} placeholder="AGO" />
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.orders.campaign")}</label>
                <input list="mb-order-campaigns" value={form.campaign} onChange={(e) => set("campaign", e.target.value)} className="input w-full" placeholder={t("mb.orders.campaignPlaceholder")} />
                <datalist id="mb-order-campaigns">
                  {campaigns.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <Field label={t("mb.orders.address")} v={form.address} on={(v) => set("address", v)} />
              <Field label={t("mb.orders.city")} v={form.city} on={(v) => set("city", v)} />
              <Field label={t("mb.orders.quantity")} type="number" v={form.quantity} on={(v) => set("quantity", v)} />
              <Field label={t("mb.orders.price")} type="number" v={form.payout_amount} on={(v) => set("payout_amount", v)} />
              <div>
                <label className="block text-sm font-medium mb-1">{t("mb.orders.status")}</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input w-full">
                  {statuses.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">{t("mb.orders.additionalInfo")}</label>
                <input value={form.comment} onChange={(e) => set("comment", e.target.value)} className="input w-full" />
              </div>
            </div>
            {error && <div className="alert alert-danger mt-3 text-sm">{error}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-secondary">{t("mb.orders.cancel")}</button>
              <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? t("mb.orders.saving") : t("mb.orders.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("mb.orders.thId")}</th><th className="th">{t("mb.orders.thProduct")}</th><th className="th">{t("mb.orders.thCountry")}</th>
              <th className="th">{t("mb.orders.thCampaign")}</th><th className="th">{t("mb.orders.thStatus")}</th><th className="th">{t("mb.orders.thPrice")}</th>
              <th className="th">{t("mb.orders.thFullName")}</th><th className="th">{t("mb.orders.thPhone")}</th>
              <th className="th">{t("mb.orders.thDate")}</th><th className="th">{t("mb.orders.thAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const meta = statusMeta(statuses, o.status);
              return (
                <tr key={o.id} className="row-hover">
                  <td className="td font-mono text-xs">{o.public_id}</td>
                  <td className="td">{o.product ?? "—"}</td>
                  <td className="td">{o.country ?? "—"}</td>
                  <td className="td">{o.campaign ?? "—"}</td>
                  <td className="td"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta?.color}`}>{meta?.title ?? o.status}</span></td>
                  <td className="td">{o.payout_amount != null ? formatProductPrice(o.payout_amount, o.country) : "—"}</td>
                  <td className="td">{o.first_name}{o.last_name ? ` ${o.last_name}` : ""}</td>
                  <td className="td">{o.phone}</td>
                  <td className="td text-xs text-ink-muted">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                  <td className="td"><button onClick={() => remove(o.id)} className="text-xs text-danger hover:underline">{t("mb.orders.delete")}</button></td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td className="td text-center text-ink-muted" colSpan={10}>{t("mb.orders.empty")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, v, on, type = "text", placeholder }: { label: string; v: string; on: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type={type} value={v} placeholder={placeholder} onChange={(e) => on(e.target.value)} className="input w-full" />
    </div>
  );
}
