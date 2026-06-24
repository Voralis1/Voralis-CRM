import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: { projectId: string; productId: string } }
) {
  const { projectId, productId } = params;
  const body = await req.json();
  const {
    name, price, category, country,
    dailyCapacity, payout, status, workingHours, additionalInfo,
  } = body;

  if (!name || price === undefined || price === "") {
    return NextResponse.json({ error: "Les champs nom et prix sont obligatoires." }, { status: 400 });
  }

  const db = createAdminClient();

  const { error } = await db
    .from("project_products")
    .update({
      name,
      description: additionalInfo || null, // informations supplémentaires
      price: Number(price),
      country: country || null,
      category: category || null,
      daily_capacity: Number(dailyCapacity) || 0,
      payout: Number(payout) || 0,
      status: status || "active",
      working_hours: workingHours || null,
    })
    .eq("id", productId)
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string; productId: string } }
) {
  const { projectId, productId } = params;
  const db = createAdminClient();

  const { error } = await db
    .from("project_products")
    .delete()
    .eq("id", productId)
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
