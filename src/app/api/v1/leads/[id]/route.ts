import { NextResponse } from "next/server";
import { authenticateAffiliate } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderStatusBySlug } from "@/lib/orderStatus";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAffiliate(req);
  if ("error" in auth)
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: auth.code }
    );

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select(
      "public_id, product_id, product, status, country, created_at, updated_at, affiliate, sub3, payout_amount, payout_currency, affiliate_id"
    )
    .eq("public_id", params.id)
    .single();

  if (!order || order.affiliate_id !== auth.affiliate.id)
    return NextResponse.json(
      { success: false, message: "Lead introuvable" },
      { status: 404 }
    );

  const { affiliate_id, status, ...rest } = order as any;
  const statusRow = await getOrderStatusBySlug(db, status);
  return NextResponse.json({
    ...rest,
    status,
    status_label: statusRow?.title ?? status,
  });
}
