import { createClient } from "@/lib/supabase/server";
import { canonicalCountry } from "@/lib/currency";
import { getServerT } from "@/i18n/server";
import KpiCard from "@/components/KpiCard";
import HeroBanner from "@/components/HeroBanner";
import DateRangeCalendar from "@/components/DateRangeCalendar";
import PieChart from "@/components/PieChart";
import Podium from "@/components/Podium";
import BarChart from "@/components/BarChart";

export default async function AdminDashboard() {
  const t = getServerT();
  const supabase = createClient();

  const { count: totalCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  const { count: confirmedCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");

  const { count: cancelledCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["cancelled", "rejected"]);

  // Pour le taux de livraison : livrés / leads confirmés (confirmé + pipeline logistique).
  const { count: deliveredCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "delivered");
  const { count: pipelineCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["confirmed", "shipped", "in_delivery", "delivered"]);


  // Top 3 affiliates
  const { data: topAffiliates } = await supabase
    .from("orders")
    .select("affiliate_id, affiliate_network(name)")
    .order("affiliate_id", { ascending: true });

  const affiliateMap = new Map<string, { name: string; count: number }>();
  (topAffiliates || []).forEach((o: any) => {
    const key = o.affiliate_id;
    if (affiliateMap.has(key)) {
      affiliateMap.get(key)!.count += 1;
    } else {
      affiliateMap.set(key, {
        name: o.affiliate_network?.name ?? "Unknown",
        count: 1,
      });
    }
  });

  const top3Affiliates = Array.from(affiliateMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Répartition par pays
  const { data: leadsByCountry } = await supabase
    .from("orders")
    .select("country")
    .order("country", { ascending: true });

  const countryMap = new Map<string, number>();
  (leadsByCountry || []).forEach((o: any) => {
    const key = canonicalCountry(o.country);
    countryMap.set(key, (countryMap.get(key) || 0) + 1);
  });

  const countryData = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  // Graphique temporel (7 derniers jours)
  const { data: allOrders } = await supabase
    .from("orders")
    .select("created_at")
    .order("created_at", { ascending: false });

  const dailyData = new Map<string, number>();
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dailyData.set(dateStr, 0);
  }

  (allOrders || []).forEach((o: any) => {
    const dateStr = new Date(o.created_at).toISOString().split("T")[0];
    if (dailyData.has(dateStr)) {
      dailyData.set(dateStr, dailyData.get(dateStr)! + 1);
    }
  });

  const temporalData = Array.from(dailyData.entries())
    .reverse()
    .map(([date, count]) => ({ date, count }));

  const total = totalCount ?? 0;
  const confirmed = confirmedCount ?? 0;
  const cancelled = cancelledCount ?? 0;
  const confirmationRate = total > 0 ? Math.round((confirmed / total) * 10000) / 100 : 0;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 10000) / 100 : 0;
  const delivered = deliveredCount ?? 0;
  const pipeline = pipelineCount ?? 0;
  const deliveryRate = pipeline > 0 ? Math.round((delivered / pipeline) * 10000) / 100 : 0;

  return (
    <div className="space-y-6">
      <HeroBanner title={t("adm.dashboard.welcome")}>

      </HeroBanner>

      <DateRangeCalendar />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("adm.dashboard.totalLeads")}
          value={total}
          icon="send"
          color="blue"
          description={t("adm.dashboard.totalLeadsDesc")}
        />
        <KpiCard
          label={t("adm.dashboard.confirmedLeads")}
          value={confirmed}
          icon="users"
          color="blue"
          description={t("adm.dashboard.confirmedLeadsDesc")}
        />
        <KpiCard
          label={t("adm.dashboard.confirmationRate")}
          value={`${confirmationRate}%`}
          icon="percent"
          color="blue"
          description={t("adm.dashboard.confirmationRateDesc")}
        />
        <KpiCard
          label={t("adm.dashboard.deliveryRate")}
          value={`${deliveryRate}%`}
          icon="truck"
          color="blue"
          description={t("adm.dashboard.deliveryRateDesc")}
        />
        <KpiCard
          label={t("adm.dashboard.deliveredLeads")}
          value={delivered}
          icon="box"
          color="blue"
          description={t("adm.dashboard.deliveredLeadsDesc")}
        />
        <KpiCard
          label={t("adm.dashboard.cancellationRate")}
          value={`${cancellationRate}%`}
          icon="trending-down"
          color="blue"
          description={t("adm.dashboard.cancellationRateDesc")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">{t("adm.dashboard.top3Affiliates")}</h2>
          <Podium items={top3Affiliates} />
        </div>

        <div className="card p-4">
          <h2 className="mb-3 font-semibold">{t("adm.dashboard.countryBreakdown")}</h2>
          <PieChart data={countryData.map((c) => ({ label: c.country, value: c.count }))} />
        </div>

        <div className="card p-4">
          <h2 className="mb-3 font-semibold">{t("adm.dashboard.leads7Days")}</h2>
          <BarChart
            data={temporalData.map((d) => ({
              label: new Date(d.date).toLocaleDateString("fr-FR", { weekday: "short" }),
              value: d.count,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
