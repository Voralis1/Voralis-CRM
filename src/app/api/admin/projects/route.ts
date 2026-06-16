import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("projects")
    .select("id, name, created_at, expires_at, product_count")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Impossible de récupérer les projets" }, { status: 500 });
  }

  const projects = (data || []).map((project: any) => ({
    id: project.id,
    name: project.name,
    createdAt: project.created_at?.slice(0, 10) ?? null,
    expiresAt: project.expires_at?.slice(0, 10) ?? null,
    productCount: String(project.product_count ?? 0),
  }));

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, name, createdAt, expiresAt, productCount } = body;

  if (!id || !name || !createdAt || !expiresAt) {
    return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis." }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from("projects").insert({
    id,
    name,
    created_at: createdAt,
    expires_at: expiresAt,
    product_count: Number(productCount || 0),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
