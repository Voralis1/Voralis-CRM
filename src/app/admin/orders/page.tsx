import { createClient } from "@/lib/supabase/server";
import { STATUS_META, type OrderStatus } from "@/lib/types";
import StatusControls from "./StatusControls";

export default async function OrdersBoard() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, public_id, offer_id, offers(product), country, affiliate_id, affiliates(name), created_at, status, payout_amount, first_name, last_name, phone, address, comment, sub1`
    )
    .order("created_at", { ascending: false })
    .limit(300);

  const rows = orders ?? [];

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500">{rows.length} leads · les changements de statut envoient un postback à l'affilié.</div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">ID de la commande</th>
              <th className="th">Produit</th>
              <th className="th">Pays</th>
              <th className="th">Affiliate network</th>
              <th className="th">ID de l'Affiliate</th>
              <th className="th">Date de réception</th>
              <th className="th">status de la dernière mise à jour</th>
              <th className="th">Prix</th>
              <th className="th">Nom complet</th>
              <th className="th">Téléphone</th>
              <th className="th">Adresse</th>
              <th className="th">Informations additionnelles</th>
              <th className="th">Source</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const meta = STATUS_META[o.status as OrderStatus];
              const offers = o.offers as any;
              const affiliates = o.affiliates as any;
              const fullName = `${o.first_name}${o.last_name ? ` ${o.last_name}` : ""}`;

              return (
                <tr key={o.id} className="align-top hover:bg-brand-mist/40">
                  <td className="td font-mono text-xs">{o.public_id}</td>
                  <td className="td">{offers?.product ?? "—"}</td>
                  <td className="td">{o.country}</td>
                  <td className="td">{affiliates?.name ?? "—"}</td>
                  <td className="td font-mono text-xs text-slate-500">{o.affiliate_id}</td>
                  <td className="td text-xs text-slate-500">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                  <td className="td">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta?.color}`}>
                      {meta?.label ?? o.status}
                    </span>
                  </td>
                  <td className="td">{o.payout_amount != null ? `$${Number(o.payout_amount).toFixed(2)}` : "—"}</td>
                  <td className="td">{fullName}</td>
                  <td className="td">{o.phone}</td>
                  <td className="td text-sm">{o.address ?? "—"}</td>
                  <td className="td text-sm">{o.comment ?? "—"}</td>
                  <td className="td font-mono text-xs text-slate-500">{o.sub1 ?? "—"}</td>
                  <td className="td">
                    <StatusControls orderId={o.id} status={o.status as OrderStatus} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td className="td text-center text-slate-400" colSpan={14}>Aucun lead.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
