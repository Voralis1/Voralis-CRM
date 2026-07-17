import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { accountNameBelongsToBuyer } from "@/lib/mediaBuyerAccounts";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const profile = await getProfile();
  const supabase = createClient();
  const db = createAdminClient();

  // media_spend n'a plus de media_buyer_id : filtrage par buyer côté code
  // (comme sur /media-buying/spend) plutôt que par RLS.
  const { data: spendAll } = await db
    .from("media_spend")
    .select("date, account_name, country, campaign, spend");

  let spend = spendAll ?? [];
  if (profile?.role !== "admin") {
    const { data: buyers } = await db.from("profiles").select("full_name").eq("role", "media_buyer");
    const allNames = (buyers ?? []).map((b) => b.full_name);
    spend = spend.filter((s) => accountNameBelongsToBuyer(s.account_name, profile?.full_name, allNames));
  }

  // mediabuyers_orders garde sa RLS d'origine (media_buyer_id intact).
  const { data: orders } = await supabase
    .from("mediabuyers_orders")
    .select("campaign, country, status, created_at");

  return <ResultsClient spend={spend} orders={orders ?? []} />;
}
