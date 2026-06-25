import { createClient } from "@/lib/supabase/server";
import { getMyNetworkId } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-brand-dark">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default async function PanelDashboard() {
  const supabase = createClient();
  // Isolation : un affilié ne voit QUE ses propres leads (+ RLS en filet).
  const networkId = await getMyNetworkId();
  const { data: orders } = networkId
    ? await supabase
        .from("orders")
        .select("status, product, offer_id")
        .eq("affiliate_id", networkId)
    : { data: [] };

  const rows = (orders ?? []) as any[];
  const count = (s: OrderStatus) => rows.filter((r) => r.status === s).length;
  const total = rows.length;
  const CONFIRMED = new Set(["confirmed", "shipped", "in_delivery", "delivered"]);
  const confirmed = rows.filter((r) => CONFIRMED.has(r.status)).length;
  const delivered = count("delivered");

  // Payout total = somme du payout (commission $) des leads confirmés.
  // Le payout vient du produit (project_products.payout), résolu par
  // offer_id (lead manuel) ou par nom de produit (lead API).
  const { data: prods } = await supabase.from("project_products").select("id, name, payout");
  const payoutById = new Map<string, number>();
  const payoutByName = new Map<string, number>();
  for (const p of prods ?? []) {
    payoutById.set(p.id, Number(p.payout ?? 0));
    payoutByName.set(String(p.name ?? "").trim().toLowerCase(), Number(p.payout ?? 0));
  }
  const leadPayout = (o: any): number => {
    if (o.offer_id && payoutById.has(o.offer_id)) return payoutById.get(o.offer_id)!;
    return payoutByName.get(String(o.product ?? "").trim().toLowerCase()) ?? 0;
  };
  const payoutTotal = rows
    .filter((r) => CONFIRMED.has(r.status))
    .reduce((s, r) => s + leadPayout(r), 0);

  const cancelled = count("cancelled") + count("rejected");

  const confRate = total ? Math.round((confirmed / total) * 100) : 0;
  const delivRate = confirmed ? Math.round((delivered / confirmed) * 100) : 0;
  const cancRate = total ? Math.round((cancelled / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Leads envoyés" value={String(total)} />
        <Kpi label="Taux de confirmation" value={`${confRate}%`} sub={`${confirmed} confirmés`} />
        <Kpi label="Taux d'annulation" value={`${cancRate}%`} sub={`${cancelled} annulés`} />
        <Kpi label="Taux de livraison" value={`${delivRate}%`} sub={`${delivered} livrés`} />
        <Kpi label="Payout total" value={`$${payoutTotal.toFixed(2)}`} sub={`${confirmed} leads confirmés`} />
      </div>

      <div className="card p-6 text-sm text-slate-600">
        <p className="font-semibold text-brand-dark">Comment ça marche</p>
        <p className="mt-2">
          Envoie tes leads sur l'endpoint <code className="rounded bg-brand-mist px-1.5 py-0.5 font-mono text-xs">POST /api/v1/leads</code>{" "}
          avec ton token (onglet « API & Postback »). Chaque changement de statut est renvoyé
          automatiquement vers ton URL de postback pour que tu optimises tes campagnes.
        </p>
      </div>
    </div>
  );
}
