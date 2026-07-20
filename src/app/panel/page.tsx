import { createClient } from "@/lib/supabase/server";
import { getMyNetworkId } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";
import { getOrderStatuses, statusMeta } from "@/lib/orderStatus";
import { getServerT } from "@/i18n/server";
import HeroBanner from "@/components/HeroBanner";
import KpiCard from "@/components/KpiCard";
import PieChart from "@/components/PieChart";

export default async function PanelDashboard() {
  const t = getServerT();
  const supabase = createClient();
  const statuses = await getOrderStatuses(supabase);
  // Isolation : un affilié ne voit QUE ses propres leads (+ RLS en filet).
  const networkId = await getMyNetworkId();
  const { data: orders } = networkId
    ? await supabase
        .from("orders")
        .select("status, product, product_id, paid_at")
        .eq("affiliate_id", networkId)
    : { data: [] };

  const rows = (orders ?? []) as any[];
  const count = (s: OrderStatus) => rows.filter((r) => r.status === s).length;
  const total = rows.length;
  const CONFIRMED = new Set(["confirmed"]);
  const confirmed = rows.filter((r) => CONFIRMED.has(r.status)).length;

  // Payout total = somme du payout (commission $) des leads confirmés.
  const { data: prods } = await supabase.from("project_products").select("id, name, payout");
  const payoutById = new Map<string, number>();
  const payoutByName = new Map<string, number>();
  for (const p of prods ?? []) {
    payoutById.set(p.id, Number(p.payout ?? 0));
    payoutByName.set(String(p.name ?? "").trim().toLowerCase(), Number(p.payout ?? 0));
  }
  const leadPayout = (o: any): number => {
    if (o.product_id && payoutById.has(o.product_id)) return payoutById.get(o.product_id)!;
    return payoutByName.get(String(o.product ?? "").trim().toLowerCase()) ?? 0;
  };
  const payoutTotal = rows
    .filter((r) => CONFIRMED.has(r.status) && !r.paid_at)
    .reduce((s, r) => s + leadPayout(r), 0);

  const cancelled = count("cancelled");
  const confRate = total ? Math.round((confirmed / total) * 100) : 0;
  const cancRate = total ? Math.round((cancelled / total) * 100) : 0;

  // Répartition par statut (pour le camembert).
  const statusCounts = new Map<string, number>();
  for (const r of rows) statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
  const statusData = Array.from(statusCounts.entries()).map(([s, value]) => ({
    label: statusMeta(statuses, s)?.title ?? s,
    value,
  }));

  return (
    <div className="space-y-6">
      <HeroBanner title={t("aff.dashboard.heroTitle")}>
        {t("aff.dashboard.confRate")}{" "}
        <span className="font-semibold text-[#22c55e]">{confRate}%</span> ·{" "}
        <span className="rounded px-1.5 py-0.5 font-semibold" style={{ background: "rgba(239,68,68,0.18)", color: "#fca5a5" }}>
          {t("aff.dashboard.cancellations")} {cancRate}%
        </span>{" "}
        · {t("aff.dashboard.payoutDue")} <span className="font-semibold text-[#f5a623]">${payoutTotal.toFixed(2)}</span>
      </HeroBanner>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("aff.dashboard.kpiLeadsSent")} value={total} icon="send" color="blue" description={t("aff.dashboard.kpiLeadsSentDesc")} />
        <KpiCard label={t("aff.dashboard.kpiLeadsConfirmed")} value={confirmed} icon="users" color="blue" description={t("aff.dashboard.kpiLeadsConfirmedDesc")} />
        <KpiCard label={t("aff.dashboard.kpiConfRate")} value={`${confRate}%`} icon="percent" color="blue" description={`${confirmed} ${t("aff.dashboard.kpiConfRateDesc")}`} />
        <KpiCard label={t("aff.dashboard.kpiPayout")} value={`$${payoutTotal.toFixed(2)}`} icon="wallet" color="blue" description={t("aff.dashboard.kpiPayoutDesc")} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold">{t("aff.dashboard.statusBreakdown")}</h2>
          <PieChart data={statusData} />
        </div>

        <div className="card p-5 text-sm text-ink-muted">
          <p className="font-semibold text-ink">{t("aff.dashboard.howItWorksTitle")}</p>
          <p className="mt-2">
            {t("aff.dashboard.howItWorksLead")}{" "}
            <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs">POST /api/v1/leads</code>{" "}
            {t("aff.dashboard.howItWorksTail")}
          </p>
        </div>
      </div>
    </div>
  );
}
