import { createClient } from "@/lib/supabase/server";
import OrdersBoardClient from "./OrdersBoard.client";

// Toujours recharger les leads depuis la base pour refléter les derniers
// changements de statut (ex. via l'onglet « Mise à jour »).
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, public_id, offer_id, product, offers(product), country, affiliate_id, affiliate_network(name), created_at, status, payout_amount, first_name, last_name, phone, address, comment, affiliate`
    )
    .order("created_at", { ascending: false })
    .limit(300);

  const rows = orders ?? [];

  return <OrdersBoardClient rows={rows} />;
}
