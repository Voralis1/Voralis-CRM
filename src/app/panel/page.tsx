import { createClient } from "@/lib/supabase/server";
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
  // RLS limite déjà aux leads de l'affilié connecté.
  const { data: orders } = await supabase
    .from("orders")
    .select("status, payout_amount, payout_currency");

  const rows = orders ?? [];
  const count = (s: OrderStatus) => rows.filter((r) => r.status === s).length;
  const total = rows.length;
  const confirmed = count("confirmed") + count("shipped") + count("in_delivery") + count("delivered");
  const delivered = count("delivered");
  const validated = rows
    .filter((r) => r.payout_amount != null)
    .reduce((s, r) => s + Number(r.payout_amount), 0);

  const confRate = total ? Math.round((confirmed / total) * 100) : 0;
  const delivRate = confirmed ? Math.round((delivered / confirmed) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Leads envoyés" value={String(total)} />
        <Kpi label="Taux de confirmation" value={`${confRate}%`} sub={`${confirmed} confirmés`} />
        <Kpi label="Taux de livraison" value={`${delivRate}%`} sub={`${delivered} livrés`} />
        <Kpi label="Commissions validées" value={`$${validated.toFixed(2)}`} sub="statuts facturables" />
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
