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
    .select("id, created_at, name, description, price, measure, country, quantity")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (productsError) {
    return NextResponse.json({ error: "Impossible de récupérer les produits." }, { status: 500 });
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
      createdAt: product.created_at?.slice(0, 10) ?? null,
      name: product.name,
      description: product.description,
      price: product.price != null ? String(product.price) : "",
      measure: product.measure,
      country: product.country,
      quantity: String(product.quantity ?? 0),
    })),
  });
}
