import { createClient } from "@/lib/supabase/server";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  // RLS : un buyer ne voit que ses dépenses et ses commandes.
  const supabase = createClient();
  const { data: spend } = await supabase
    .from("media_spend")
    .select("date, buyer_name, country, campaign, amount_usd");
  const { data: orders } = await supabase
    .from("mediabuyers_orders")
    .select("campaign, country, status, created_at");

  return <ResultsClient spend={spend ?? []} orders={orders ?? []} />;
}
