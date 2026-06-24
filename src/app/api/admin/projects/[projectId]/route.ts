import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      "id, created_at, name, description, price, country, category, daily_capacity, confirmation_rate, payout, status, working_hours"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (productsError) {
    return NextResponse.json({ error: "Impossible de récupérer les produits." }, { status: 500 });
  }

  // Taux de confirmation calculé automatiquement depuis les leads (orders).
  // confirmés = statut confirmé ou au-delà ; valides = hors duplicate/trash.
  const CONFIRMED = new Set(["confirmed", "shipped", "in_delivery", "delivered", "returned", "cancelled"]);
  const EXCLUDED = new Set(["duplicate", "trash"]);
  const { data: orders } = await db.from("orders").select("status, offer_id, product");
  const allOrders = orders ?? [];

  const norm = (v: any) => String(v ?? "").trim().toLowerCase();
  function confirmationRate(product: any): number {
    const pName = norm(product.name);
    const related = allOrders.filter(
      (o: any) => o.offer_id === product.id || (o.product && norm(o.product) === pName)
    );
    const valid = related.filter((o: any) => !EXCLUDED.has(o.status)).length;
    const confirmed = related.filter((o: any) => CONFIRMED.has(o.status)).length;
    return valid > 0 ? Math.round((confirmed / valid) * 1000) / 10 : 0; // 1 décimale
  }

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
      confirmationRate: String(confirmationRate(product)), // calculé, non saisi
      payout: product.payout != null ? String(product.payout) : "",
      status: product.status ?? "active",
      workingHours: product.working_hours ?? "",
      additionalInfo: product.description ?? "",
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
