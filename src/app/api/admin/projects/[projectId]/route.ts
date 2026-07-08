import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmationRateFor } from "@/lib/confirmationRate";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;
  const db = createAdminClient();

  const { data: project, error: projectError } = await db
    .from("projects")
    .select("id, name, created_at, expires_at, product_count")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  const { data: products, error: productsError } = await db
    .from("project_products")
    .select(
      "id, created_at, name, description, price, country, category, daily_capacity, quantity, confirmation_rate, payout, status, working_hours, image_url"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (productsError) {
    return NextResponse.json({ error: "Impossible de récupérer les produits." }, { status: 500 });
  }

  // Taux de confirmation calculé automatiquement depuis les leads (orders).
  const { data: orders } = await db.from("orders").select("status, product_id, product");
  const allOrders = (orders ?? []) as any[];

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      createdAt: project.created_at?.slice(0, 10) ?? null,
      expiresAt: project.expires_at?.slice(0, 10) ?? null,
      productCount: String(project.product_count ?? 0),
    },
    products: (products || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.category ?? "",
      country: product.country ?? "",
      price: product.price != null ? String(product.price) : "",
      dailyCapacity: String(product.daily_capacity ?? 0),
      quantity: String(product.quantity ?? 0),
      confirmationRate: String(confirmationRateFor(product, allOrders)), // calculé, non saisi
      payout: product.payout != null ? String(product.payout) : "",
      status: product.status ?? "active",
      workingHours: product.working_hours ?? "",
      additionalInfo: product.description ?? "",
      imageUrl: product.image_url ?? "",
    })),
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const db = createAdminClient();
  // Les produits liés sont supprimés en cascade (FK on delete cascade).
  const { error } = await db.from("projects").delete().eq("id", params.projectId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
