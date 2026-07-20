import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { accountNameBelongsToBuyer } from "@/lib/mediaBuyerAccounts";
import { getServerT } from "@/i18n/server";
import KpiCard from "@/components/KpiCard";

const CONFIRMED = new Set(["confirmed"]);
const money = (n: number) => `$${n.toFixed(2)}`;
const div = (a: number, b: number) => (b > 0 ? money(a / b) : "—");
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10}%` : "—");

export const dynamic = "force-dynamic";

export default async function MediaBuyingHome() {
  const t = getServerT();
  const profile = await getProfile();
  const supabase = createClient();
  const db = createAdminClient();

  // media_spend n'a plus de media_buyer_id : filtrage par buyer côté code
  // (voir /media-buying/spend), lecture via le service role.
  const { data: spendAll } = await db.from("media_spend").select("account_name, spend");
  let spendRows = spendAll ?? [];
  if (profile?.role !== "admin") {
    const { data: buyers } = await db.from("profiles").select("full_name").eq("role", "media_buyer");
    const allNames = (buyers ?? []).map((b) => b.full_name);
    spendRows = spendRows.filter((s) => accountNameBelongsToBuyer(s.account_name, profile?.full_name, allNames));
  }
  const spent = spendRows.reduce((s, r) => s + (Number(r.spend) || 0), 0);

  const { data: orders } = await supabase.from("mediabuyers_orders").select("status");
  const rows = orders ?? [];
  const leads = rows.length;
  const confirmed = rows.filter((o: any) => CONFIRMED.has(o.status)).length;
  const delivered = rows.filter((o: any) => o.status === "delivered").length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">{t("mb.dashboard.title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label={t("mb.dashboard.spent")} value={money(spent)} icon="wallet" color="blue" description={t("mb.dashboard.spentSub")} />
        <KpiCard label={t("mb.dashboard.leads")} value={leads} icon="send" color="cyan" />
        <KpiCard
          label={t("mb.dashboard.confirmed")}
          value={confirmed}
          icon="users"
          color="green"
          description={`${pct(confirmed, leads)} ${t("mb.dashboard.confirmedSub")}`}
        />
        <KpiCard
          label={t("mb.dashboard.delivered")}
          value={delivered}
          icon="truck"
          color="violet"
          description={`${pct(delivered, confirmed)} ${t("mb.dashboard.deliveredSub")}`}
        />
        <KpiCard label={t("mb.dashboard.costPerDelivered")} value={div(spent, delivered)} icon="dollar" color="orange" description={t("mb.dashboard.costPerDeliveredSub")} />
        <KpiCard label={t("mb.dashboard.costPerLead")} value={div(spent, leads)} icon="percent" color="red" description={t("mb.dashboard.costPerLeadSub")} />
      </div>
    </div>
  );
}
