import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "./LeadsTable";

export default async function PanelLeads() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      public_id, 
      offer_id,
      offers(product),
      country,
      affiliate_id,
      affiliates(name),
      created_at,
      updated_at,
      status,
      payout_amount,
      first_name,
      last_name,
      phone,
      address,
      comment,
      sub1,
      sub2
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = orders ?? [];

  return <LeadsTable rows={rows} />;
}
