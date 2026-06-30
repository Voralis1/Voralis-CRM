import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import SpendClient from "./SpendClient";

export const dynamic = "force-dynamic";

export default async function SpendPage() {
  const supabase = createClient();
  const profile = await getProfile();

  // Dépenses du buyer (RLS limite déjà aux siennes).
  const { data: spend } = await supabase
    .from("media_spend")
    .select("id, date, buyer_name, country, campaign, amount_usd, note")
    .order("date", { ascending: false });

  // Campagnes existantes (depuis ses commandes + ses dépenses) pour le dropdown.
  const { data: orders } = await supabase.from("mediabuyers_orders").select("campaign");
  const set = new Set<string>();
  for (const o of orders ?? []) if (o.campaign) set.add(o.campaign);
  for (const s of spend ?? []) if (s.campaign) set.add(s.campaign);
  const campaigns = Array.from(set).sort();

  return <SpendClient rows={spend ?? []} campaigns={campaigns} defaultBuyer={profile?.full_name ?? ""} />;
}
