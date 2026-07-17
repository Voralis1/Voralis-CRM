import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { accountNameBelongsToBuyer } from "@/lib/mediaBuyerAccounts";
import SpendClient from "./SpendClient";

export const dynamic = "force-dynamic";

export default async function SpendPage() {
  const profile = await getProfile();
  const supabase = createClient();
  const db = createAdminClient();

  // media_spend n'a plus de media_buyer_id (table remplacée par un import
  // externe) : la RLS ne peut plus filtrer par propriétaire, donc on lit via
  // le service role et on filtre par buyer ici, côté code.
  const { data: spendAll } = await db
    .from("media_spend")
    .select("id, date, account_name, country, campaign, clicks, impressions, leads, spend, cpl, ctr")
    .order("date", { ascending: false });

  let spend = spendAll ?? [];
  if (profile?.role !== "admin") {
    const { data: buyers } = await db.from("profiles").select("full_name").eq("role", "media_buyer");
    const allNames = (buyers ?? []).map((b) => b.full_name);
    spend = spend.filter((s) => accountNameBelongsToBuyer(s.account_name, profile?.full_name, allNames));
  }

  // Campagnes existantes (depuis les commandes du buyer, RLS intacte sur mediabuyers_orders).
  const { data: orders } = await supabase.from("mediabuyers_orders").select("campaign");
  const set = new Set<string>();
  for (const o of orders ?? []) if (o.campaign) set.add(o.campaign);
  for (const s of spend) if (s.campaign) set.add(s.campaign);
  const campaigns = Array.from(set).sort();

  return <SpendClient rows={spend} campaigns={campaigns} isAdmin={profile?.role === "admin"} />;
}
