import { createClient } from "@/lib/supabase/server";
import { STATUS_META } from "@/lib/types";

export default async function AdminDashboard() {
  const supabase = createClient();

  const { count: totalCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  const { count: confirmedCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");

  const { data: payoutsData } = await supabase
    .from("orders")
    .select("payout_amount")
    .eq("status", "confirmed")
    .not("payout_amount", "is", null);

  const totalPayout = (payoutsData || []).reduce((acc: any, r: any) => acc + Number(r.payout_amount || 0), 0);

  const { data: recent } = await supabase
    .from("orders")
    .select("public_id, first_name, last_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Top 3 affiliates
  const { data: topAffiliates } = await supabase
    .from("orders")
    .select("affiliate_id, affiliates(name)")
    .order("affiliate_id", { ascending: true });

  const affiliateMap = new Map<string, { name: string; count: number }>();
  (topAffiliates || []).forEach((o: any) => {
    const key = o.affiliate_id;
    if (affiliateMap.has(key)) {
      affiliateMap.get(key)!.count += 1;
    } else {
      affiliateMap.set(key, {
        name: o.affiliates?.name ?? "Unknown",
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
    const key = o.country;
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
  const confirmationRate = total > 0 ? Math.round((confirmed / total) * 10000) / 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-slate-500">Nombre total de leads envoyés</div>
          <div className="mt-2 text-2xl font-semibold">{total}</div>
        </div>

        <div className="card p-4">
          <div className="text-sm text-slate-500">Taux de confirmation</div>
          <div className="mt-2 text-2xl font-semibold">{confirmationRate}%</div>
        </div>

        <div className="card p-4">
          <div className="text-sm text-slate-500">Cash total obtenu (confirmed)</div>
          <div className="mt-2 text-2xl font-semibold">${totalPayout.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-3">Top 3 Affiliates</h2>
          <div className="space-y-2">
            {top3Affiliates.map((aff, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-600">{aff.name}</span>
                <span className="font-mono font-semibold">{aff.count}</span>
              </div>
            ))}
            {top3Affiliates.length === 0 && <div className="text-slate-500 text-sm">Aucun affiliate.</div>}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-3">Répartition par Pays</h2>
          <div className="space-y-2">
            {countryData.slice(0, 5).map((c) => (
              <div key={c.country} className="flex justify-between text-sm">
                <span className="text-slate-600">{c.country}</span>
                <span className="font-mono font-semibold">{c.count}</span>
              </div>
            ))}
            {countryData.length === 0 && <div className="text-slate-500 text-sm">Aucun pays.</div>}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-3">Leads (7 derniers jours)</h2>
          <div className="space-y-2">
            {temporalData.map((d) => (
              <div key={d.date} className="flex justify-between text-sm">
                <span className="text-slate-600">{new Date(d.date).toLocaleDateString("fr-FR")}</span>
                <span className="font-mono font-semibold">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">Récentes soumissions</h2>
        <div className="space-y-2">
          {(recent || []).map((r: any) => (
            <div key={r.public_id} className="flex justify-between">
              <div>
                <div className="font-mono text-xs">{r.public_id}</div>
                <div className="text-sm">{r.first_name} {r.last_name ?? ""}</div>
              </div>
              <div className="text-right text-sm">
                <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString("fr-FR")}</div>
                <div className="mt-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[r.status as keyof typeof STATUS_META]?.color}`}>
                    {STATUS_META[r.status as keyof typeof STATUS_META]?.label ?? r.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {(!recent || recent.length === 0) && <div className="text-slate-500">Aucun lead récent.</div>}
        </div>
      </div>
    </div>
  );
}
