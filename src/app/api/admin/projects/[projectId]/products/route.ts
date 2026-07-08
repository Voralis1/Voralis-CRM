import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;
  const body = await req.json();
  const {
    id, name, price, category, country,
    dailyCapacity, quantity, payout, status, workingHours, additionalInfo, createdAt, imageUrl,
  } = body;

  if (!id || !name || price === undefined || price === "") {
    return NextResponse.json({ error: "Les champs id, nom et prix sont obligatoires." }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: project } = await db.from("projects").select("id").eq("id", projectId).single();
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  const { error } = await db.from("project_products").insert({
    id,
    project_id: projectId,
    created_at: createdAt || new Date().toISOString().slice(0, 10),
    name,
    description: additionalInfo || null, // informations supplémentaires
    price: Number(price),
    country: country || null,
    category: category || null,
    daily_capacity: Number(dailyCapacity) || 0,
    quantity: Number(quantity) || 0,
    payout: Number(payout) || 0,
    status: status || "active",
    working_hours: workingHours || null,
    image_url: imageUrl || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
