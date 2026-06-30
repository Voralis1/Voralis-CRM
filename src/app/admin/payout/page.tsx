import { createAdminClient } from "@/lib/supabase/admin";
import { markPaid } from "./actions";
import { Icon } from "@/components/icons";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

// Statuts confirmés (payables). Cohérent avec le dashboard.
const CONFIRMED = ["confirmed", "shipped", "in_delivery", "delivered"];
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

export default async function AdminPayoutPage() {
  const t = getServerT();
  const db = createAdminClient();

  const { data: networks } = await db
    .from("affiliate_network")
    .select("id, name")
    .order("name", { ascending: true });

  // Leads confirmés non encore payés.
  const { data: orders } = await db
    .from("orders")
    .select("affiliate_id, status, product, offer_id, paid_at")
    .in("status", CONFIRMED)
    .is("paid_at", null);

  // Payout par produit (commission $).
  const { data: prods } = await db.from("project_products").select("id, name, payout");
  const payoutById = new Map<string, number>();
  const payoutByName = new Map<string, number>();
  for (const p of prods ?? []) {
    payoutById.set(p.id, Number(p.payout ?? 0));
    payoutByName.set(norm(p.name), Number(p.payout ?? 0));
  }
  const leadPayout = (o: any): number => {
    if (o.offer_id && payoutById.has(o.offer_id)) return payoutById.get(o.offer_id)!;
    return payoutByName.get(norm(o.product)) ?? 0;
  };

  // Somme du payout dû par webmaster.
  const owed = new Map<string, number>();
  for (const o of orders ?? []) {
    owed.set(o.affiliate_id, (owed.get(o.affiliate_id) ?? 0) + leadPayout(o));
  }

  const rows = (networks ?? []).map((n) => ({ id: n.id, name: n.name, due: owed.get(n.id) ?? 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adm.payout.title")}</h1>
        <p className="text-sm text-ink-muted">
          {t("adm.payout.subtitle")}
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("adm.payout.colWebmaster")}</th>
              <th className="th">{t("adm.payout.colDue")}</th>
              <th className="th">{t("adm.payout.colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="row-hover">
                <td className="td font-medium">{r.name}</td>
                <td className="td font-semibold">${r.due.toFixed(2)}</td>
                <td className="td">
                  {r.due > 0 ? (
                    <form action={markPaid.bind(null, r.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-pill bg-[#16a34a] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#15803d] active:scale-95"
                      >
                        <Icon name="check" size={14} />
                        {t("adm.payout.markPaid")}
                      </button>
                    </form>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-[rgba(34,197,94,0.12)] px-2.5 py-1 text-xs font-medium text-[#15803d]">
                      <Icon name="check" size={12} />
                      {t("adm.payout.upToDate")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="td text-center text-ink-muted" colSpan={3}>{t("adm.payout.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
