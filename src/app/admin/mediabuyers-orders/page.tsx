import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderStatuses, statusMeta } from "@/lib/orderStatus";
import { formatProductPrice } from "@/lib/currency";
import { getServerT } from "@/i18n/server";
import MbExportButton from "./MbExportButton";

export const dynamic = "force-dynamic";

export default async function AdminMbOrdersPage() {
  const t = getServerT();
  // Admin : voit toutes les commandes media buyers (service role).
  const db = createAdminClient();
  const statuses = await getOrderStatuses(db);
  const { data } = await db
    .from("mediabuyers_orders")
    .select(
      "id, public_id, product, country, campaign, status, payout_amount, first_name, last_name, phone, address, comment, created_at, media_buyer_id, profiles(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("adm.mbOrders.title")}</h1>
          <p className="text-sm text-ink-muted">{t("adm.mbOrders.subtitle")}</p>
        </div>
        <MbExportButton rows={rows} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1300px]">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("adm.mbOrders.colId")}</th>
              <th className="th">{t("adm.mbOrders.colBuyer")}</th>
              <th className="th">{t("adm.mbOrders.colProduct")}</th>
              <th className="th">{t("adm.mbOrders.colCountry")}</th>
              <th className="th">{t("adm.mbOrders.colCampaign")}</th>
              <th className="th">{t("adm.mbOrders.colStatus")}</th>
              <th className="th">{t("adm.mbOrders.colPrice")}</th>
              <th className="th">{t("adm.mbOrders.colFullName")}</th>
              <th className="th">{t("adm.mbOrders.colPhone")}</th>
              <th className="th">{t("adm.mbOrders.colAddress")}</th>
              <th className="th">{t("adm.mbOrders.colReceivedDate")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o: any) => {
              const meta = statusMeta(statuses, o.status);
              const buyer = (o.profiles as any)?.full_name;
              return (
                <tr key={o.id} className="row-hover">
                  <td className="td font-mono text-xs">{o.public_id}</td>
                  <td className="td font-medium">{buyer ?? "—"}</td>
                  <td className="td">{o.product ?? "—"}</td>
                  <td className="td">{o.country ?? "—"}</td>
                  <td className="td">{o.campaign ?? "—"}</td>
                  <td className="td">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta?.color}`}>
                      {meta?.title ?? o.status}
                    </span>
                  </td>
                  <td className="td">{o.payout_amount != null ? formatProductPrice(o.payout_amount, o.country) : "—"}</td>
                  <td className="td">{o.first_name}{o.last_name ? ` ${o.last_name}` : ""}</td>
                  <td className="td">{o.phone}</td>
                  <td className="td text-sm">{o.address ?? "—"}</td>
                  <td className="td text-xs text-ink-muted">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td className="td text-center text-ink-muted" colSpan={11}>{t("adm.mbOrders.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
