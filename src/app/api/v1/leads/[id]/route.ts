import { NextResponse } from "next/server";
import { authenticateAffiliate } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATUS_META } from "@/lib/types";

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
      "public_id, offer_id, status, country, created_at, updated_at, affiliate, sub3, payout_amount, payout_currency, affiliate_id"
    )
    .eq("public_id", params.id)
    .single();

  if (!order || order.affiliate_id !== auth.affiliate.id)
    return NextResponse.json(
      { success: false, message: "Lead introuvable" },
      { status: 404 }
    );

  const { affiliate_id, status, ...rest } = order as any;
  return NextResponse.json({
    ...rest,
    status,
    status_label: STATUS_META[status as keyof typeof STATUS_META]?.label ?? status,
  });
}
