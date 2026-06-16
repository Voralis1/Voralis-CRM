import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;
  const body = await req.json();
  const { id, createdAt, name, description, price, measure, country, quantity } = body;

  if (!id || !createdAt || !name || !price || !quantity) {
    return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis." }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: project } = await db.from("projects").select("id").eq("id", projectId).single();
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  const { error } = await db.from("project_products").insert({
    id,
    project_id: projectId,
    created_at: createdAt,
    name,
    description: description || null,
    price: Number(price),
    measure: measure || null,
    country: country || null,
    quantity: Number(quantity),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
