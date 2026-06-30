import { NextResponse } from "next/server";
import { authenticateAffiliate } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateAffiliate(req);
  if ("error" in auth)
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: auth.code }
    );

  const db = createAdminClient();
  const { data: offers } = await db
    .from("offers")
    .select("id, name, country, payout, currency, payout_model, status")
    .eq("status", "active")
    .order("country", { ascending: true });

  return NextResponse.json({ offers: offers ?? [] });
}
