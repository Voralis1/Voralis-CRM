"use client";

import { useMemo, useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { canonicalCountry } from "@/lib/currency";

const CONFIRMED = new Set(["confirmed"]);
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
const normCountry = (v: unknown) => canonicalCountry(String(v ?? "")).toLowerCase();
const inRange = (d: string, from: string, to: string) => (!from || d >= from) && (!to || d <= to);

// Argent : "$X.XX", ou "—" si dénominateur 0 (jamais de division par zéro).
const money = (n: number) => `$${n.toFixed(2)}`;
const div = (a: number, b: number, fmt: (n: number) => string) => (b > 0 ? fmt(a / b) : "—");
const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;

export default function ResultsClient({ spend, orders }: { spend: any[]; orders: any[] }) {
  const t = useT();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [buyer, setBuyer] = useState("");
  const [country, setCountry] = useState("");

  const rows = useMemo(() => {
    const sFilt = spend.filter(
      (s) =>
        inRange(String(s.date), from, to) &&
        (!buyer || norm(s.account_name).includes(norm(buyer))) &&
        (!country || normCountry(s.country) === normCountry(country))
    );
    const oFilt = orders.filter(
      (o) =>
        inRange(String(o.created_at).slice(0, 10), from, to) &&
        (!country || normCountry(o.country) === normCountry(country))
    );

    const groups = new Map<string, any>();
    for (const s of sFilt) {
      const key = `${norm(s.account_name)}|${norm(s.campaign)}|${normCountry(s.country)}`;
      const g = groups.get(key) ?? { buyer: s.account_name || "—", campaign: s.campaign || "—", country: s.country || "—", spent: 0 };
      g.spent += Number(s.spend) || 0;
      groups.set(key, g);
    }

    return Array.from(groups.values()).map((g) => {
      const rel = oFilt.filter((o) => norm(o.campaign) === norm(g.campaign) && normCountry(o.country) === normCountry(g.country));
      const leads = rel.length;
      const confirmed = rel.filter((o) => CONFIRMED.has(o.status)).length;
      const delivered = rel.filter((o) => o.status === "delivered").length;
      return { ...g, leads, confirmed, delivered };
    });
  }, [spend, orders, from, to, buyer, country]);

  const tot = rows.reduce(
    (t, r) => ({ spent: t.spent + r.spent, leads: t.leads + r.leads, confirmed: t.confirmed + r.confirmed, delivered: t.delivered + r.delivered }),
    { spent: 0, leads: 0, confirmed: 0, delivered: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("mb.results.title")}</h1>
        <p className="text-sm text-ink-muted">{t("mb.results.subtitle")}</p>
      </div>

      <div className="card p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="label">{t("mb.results.from")}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input w-full" />
        </div>
        <div>
          <label className="label">{t("mb.results.to")}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input w-full" />
        </div>
        <div>
          <label className="label">{t("mb.results.buyer")}</label>
          <input value={buyer} onChange={(e) => setBuyer(e.target.value)} className="input w-full" placeholder={t("mb.results.all")} />
        </div>
        <div>
          <label className="label">{t("mb.results.country")}</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} className="input w-full" placeholder={t("mb.results.all")} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("mb.results.thBuyer")}</th><th className="th">{t("mb.results.thCampaign")}</th><th className="th">{t("mb.results.thCountry")}</th>
              <th className="th">{t("mb.results.thSpent")}</th><th className="th">{t("mb.results.thLeads")}</th><th className="th">{t("mb.results.thConfirmed")}</th><th className="th">{t("mb.results.thDelivered")}</th>
              <th className="th">{t("mb.results.thCostPerDelivered")}</th><th className="th">{t("mb.results.thCostPerLead")}</th>
              <th className="th">{t("mb.results.thConfirmationPct")}</th><th className="th">{t("mb.results.thDeliveryPct")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="row-hover">
                <td className="td">{r.buyer}</td>
                <td className="td">{r.campaign}</td>
                <td className="td">{r.country}</td>
                <td className="td font-semibold">{money(r.spent)}</td>
                <td className="td">{r.leads}</td>
                <td className="td">{r.confirmed}</td>
                <td className="td">{r.delivered}</td>
                <td className="td font-semibold text-accent">{div(r.spent, r.delivered, money)}</td>
                <td className="td">{div(r.spent, r.leads, money)}</td>
                <td className="td">{div(r.confirmed, r.leads, pct)}</td>
                <td className="td">{div(r.delivered, r.confirmed, pct)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-center text-ink-muted" colSpan={11}>{t("mb.results.empty")}</td></tr>}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-elevated font-semibold">
                <td className="td" colSpan={3}>{t("mb.results.total")}</td>
                <td className="td">{money(tot.spent)}</td>
                <td className="td">{tot.leads}</td>
                <td className="td">{tot.confirmed}</td>
                <td className="td">{tot.delivered}</td>
                <td className="td text-accent">{div(tot.spent, tot.delivered, money)}</td>
                <td className="td">{div(tot.spent, tot.leads, money)}</td>
                <td className="td">{div(tot.confirmed, tot.leads, pct)}</td>
                <td className="td">{div(tot.delivered, tot.confirmed, pct)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
