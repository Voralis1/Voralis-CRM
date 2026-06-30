import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/i18n/server";

const CONFIRMED = new Set(["confirmed", "shipped", "in_delivery", "delivered"]);
const money = (n: number) => `$${n.toFixed(2)}`;
const div = (a: number, b: number) => (b > 0 ? money(a / b) : "—");
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10}%` : "—");

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-2 text-2xl font-bold text-accent">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function MediaBuyingHome() {
  const t = getServerT();
  // RLS : limité au buyer connecté.
  const supabase = createClient();
  const { data: spend } = await supabase.from("media_spend").select("amount_usd");
  const { data: orders } = await supabase.from("mediabuyers_orders").select("status");

  const spent = (spend ?? []).reduce((s: number, r: any) => s + Number(r.amount_usd || 0), 0);
  const rows = orders ?? [];
  const leads = rows.length;
  const confirmed = rows.filter((o: any) => CONFIRMED.has(o.status)).length;
  const delivered = rows.filter((o: any) => o.status === "delivered").length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">{t("mb.dashboard.title")}</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={t("mb.dashboard.spent")} value={money(spent)} sub={t("mb.dashboard.spentSub")} />
        <Kpi label={t("mb.dashboard.leads")} value={String(leads)} />
        <Kpi label={t("mb.dashboard.confirmed")} value={String(confirmed)} sub={pct(confirmed, leads) + " " + t("mb.dashboard.confirmedSub")} />
        <Kpi label={t("mb.dashboard.delivered")} value={String(delivered)} sub={pct(delivered, confirmed) + " " + t("mb.dashboard.deliveredSub")} />
        <Kpi label={t("mb.dashboard.costPerDelivered")} value={div(spent, delivered)} sub={t("mb.dashboard.costPerDeliveredSub")} />
        <Kpi label={t("mb.dashboard.costPerLead")} value={div(spent, leads)} sub={t("mb.dashboard.costPerLeadSub")} />
      </div>

      <div className="card p-6 text-sm text-ink-muted">
        <p className="font-semibold text-ink">{t("mb.dashboard.howItWorks")}</p>
        <p className="mt-2">
          {t("mb.dashboard.helpBefore")} <strong>« {t("mb.dashboard.spendTab")} »</strong> {t("mb.dashboard.helpMiddle")}{" "}
          <strong>{t("mb.dashboard.campaignCountry")}</strong>. {t("mb.dashboard.helpResultsLead")}
          <strong> « {t("mb.dashboard.resultsTab")} »</strong> {t("mb.dashboard.helpAfter")}
        </p>
      </div>
    </div>
  );
}
