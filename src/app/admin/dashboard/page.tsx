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

      <div className="grid grid-cols-2 gap-4">
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

        <div className="card p-4">
          <h2 className="font-semibold mb-3">Suggestions</h2>
          <ul className="list-disc ml-5 text-sm text-slate-600">
            <li>Top offres par nombre de leads (à ajouter)</li>
            <li>Répartition par pays (à ajouter)</li>
            <li>Graphiques temporels (à ajouter)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
