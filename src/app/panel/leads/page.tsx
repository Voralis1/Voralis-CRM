import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMyNetworkId } from "@/lib/auth";
import { affiliateConfirmationRateFor, type RateOrder } from "@/lib/confirmationRate";
import { LeadsTable } from "./LeadsTable";
import { TopOffers } from "./TopOffers";

export const dynamic = "force-dynamic";

export default async function PanelLeads() {
  const supabase = createClient();
  // Isolation : un affilié ne voit QUE ses propres leads.
  const networkId = await getMyNetworkId();
  if (!networkId) return <LeadsTable rows={[]} />;

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      public_id,
      product_id,
      product,
      country,
      affiliate_id,
      affiliate_network(name),
      created_at,
      updated_at,
      status,
      payout_amount,
      first_name,
      last_name,
      phone,
      address,
      comment,
      affiliate
    `)
    .eq("affiliate_id", networkId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = orders ?? [];

  // Meilleures offres : les 3 produits actifs avec le meilleur taux de
  // confirmation (agrégat global, comme la page Produits).
  const { data: products } = await supabase
    .from("project_products")
    .select("id, name, country, price, payout, status")
    .eq("status", "active");

  const admin = createAdminClient();
  const { data: allOrders } = await admin.from("orders").select("status, product_id, product");

  const topOffers = (products ?? [])
    .map((p) => ({ ...p, rate: affiliateConfirmationRateFor(p, (allOrders ?? []) as RateOrder[]) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <TopOffers offers={topOffers} />
      <LeadsTable rows={rows} />
    </div>
  );
}
