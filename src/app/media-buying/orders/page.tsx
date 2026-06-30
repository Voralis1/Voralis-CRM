import { createClient } from "@/lib/supabase/server";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function MbOrdersPage() {
  // RLS : le media buyer ne voit que ses propres commandes.
  const supabase = createClient();
  const { data } = await supabase
    .from("mediabuyers_orders")
    .select("id, public_id, product, country, campaign, status, payout_amount, first_name, last_name, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  // Liste des produits (catalogue) pour le champ "Produit".
  const { data: prods } = await supabase
    .from("project_products")
    .select("name")
    .order("name", { ascending: true });
  const products = Array.from(new Set((prods ?? []).map((p) => p.name).filter(Boolean)));

  // Liste des campagnes existantes (ses dépenses + ses commandes) pour "Campagne".
  const { data: spend } = await supabase.from("media_spend").select("campaign");
  const set = new Set<string>();
  for (const o of data ?? []) if (o.campaign) set.add(o.campaign);
  for (const s of spend ?? []) if (s.campaign) set.add(s.campaign);
  const campaigns = Array.from(set).sort();

  return <OrdersClient rows={data ?? []} products={products} campaigns={campaigns} />;
}
