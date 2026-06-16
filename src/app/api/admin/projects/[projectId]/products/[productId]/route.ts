import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: { projectId: string; productId: string } }
) {
  const { projectId, productId } = params;
  const body = await req.json();
  const { createdAt, name, description, price, measure, country, quantity } = body;

  if (!createdAt || !name || !price || !quantity) {
    return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis." }, { status: 400 });
  }

  const db = createAdminClient();

  const { error } = await db
    .from("project_products")
    .update({
      created_at: createdAt,
      name,
      description: description || null,
      price: Number(price),
      measure: measure || null,
      country: country || null,
      quantity: Number(quantity),
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
