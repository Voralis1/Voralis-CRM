import { createClient } from "@/lib/supabase/server";
import StatisticsGrid from "./StatisticsGrid.client";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
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
    { label: "Commandes totales", value: total.toLocaleString("fr-FR") },
    { label: "Commandes confirmées", value: confirmed.toLocaleString("fr-FR") },
    { label: "Taux de confirmation", value: `${pct(confirmed)} %` },
    { label: "Taux d'annulation", value: `${pct(cancelled)} %` },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-sm text-slate-500">
          Performances par produit et par affilié, ventilées par statut de commande.
        </p>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="text-sm text-slate-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <StatisticsGrid />
      </div>
    </div>
  );
}
