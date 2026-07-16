import { createClient } from "@/lib/supabase/server";
import OrdersBoardClient from "../orders/OrdersBoard.client";

// Toujours recharger depuis la base pour refléter les derniers exports/statuts.
export const dynamic = "force-dynamic";

export default async function OrdersProcessingPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, public_id, product_id, product, country, affiliate_id, affiliate_network(name), created_at, status, payout_amount, first_name, last_name, phone, address, comment, affiliate, project_products(price)`
    )
    .not("exported_at", "is", null)
    .order("exported_at", { ascending: false })
    .limit(300);

  const rows = orders ?? [];

  return <OrdersBoardClient rows={rows} emptyMessageKey="adm.orders.processingEmpty" showStatusChart allowDelete />;
}
