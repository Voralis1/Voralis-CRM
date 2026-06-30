import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/i18n/server";
import StatisticsGrid from "./StatisticsGrid.client";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const t = getServerT();
  const supabase = createClient();

  const [{ count: totalCount }, { count: confirmedCount }, { count: cancelledCount }] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["cancelled", "rejected"]),
    ]);

  const total = totalCount ?? 0;
  const confirmed = confirmedCount ?? 0;
  const cancelled = cancelledCount ?? 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  const cards = [
    { label: t("adm.statistics.totalOrders"), value: total.toLocaleString("fr-FR") },
    { label: t("adm.statistics.confirmedOrders"), value: confirmed.toLocaleString("fr-FR") },
    { label: t("adm.statistics.confirmationRate"), value: `${pct(confirmed)} %` },
    { label: t("adm.statistics.cancellationRate"), value: `${pct(cancelled)} %` },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t("adm.statistics.title")}</h1>
        <p className="text-sm text-ink-muted">
          {t("adm.statistics.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="text-sm text-ink-muted">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <StatisticsGrid />
    </div>
  );
}
