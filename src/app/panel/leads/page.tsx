import { createClient } from "@/lib/supabase/server";
import { getMyNetworkId } from "@/lib/auth";
import { LeadsTable } from "./LeadsTable";

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

  return <LeadsTable rows={rows} />;
}
