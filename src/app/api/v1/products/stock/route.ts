import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/v1/products/stock
//
// Renvoie la quantité en stock de chaque produit (tous projets confondus).
// Protégé par REPORTING_API_KEY : header "Authorization: Bearer <clé>",
// même mécanisme que /api/v1/reports/networks.
//
// Query params optionnels :
//   - product_id : ne renvoyer que ce produit
//   - project_id : filtrer sur un projet donné
// ---------------------------------------------------------------------------

function checkAuth(req: Request): boolean {
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return !!process.env.REPORTING_API_KEY && bearer === process.env.REPORTING_API_KEY;
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json(
      { success: false, error_code: "AUTH", message: "Token invalide" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const productId = url.searchParams.get("product_id");
  const projectId = url.searchParams.get("project_id");

  const db = createAdminClient();
  let query = db
    .from("project_products")
    .select("id, project_id, name, country, status, quantity")
    .order("id", { ascending: true });

  if (productId) query = query.eq("id", productId);
  if (projectId) query = query.eq("project_id", projectId);

  const { data: products, error } = await query;
  if (error)
    return NextResponse.json(
      { success: false, error_code: "DB", message: "Impossible de récupérer le stock." },
      { status: 500 }
    );

  if (productId && (products ?? []).length === 0)
    return NextResponse.json(
      { success: false, error_code: "NOT_FOUND", message: "Produit introuvable." },
      { status: 404 }
    );

  return NextResponse.json({
    success: true,
    count: products?.length ?? 0,
    products: (products ?? []).map((p) => ({
      id: p.id,
      project_id: p.project_id,
      name: p.name,
      country: p.country ?? "",
      status: p.status ?? "active",
      quantity: p.quantity ?? 0,
    })),
  });
}
