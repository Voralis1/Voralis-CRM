import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function ensureStaff() {
  const profile = await getProfile();
  return profile && profile.role === "admin";
}

// `params.id` est en réalité le slug (identifiant stable et lisible dans
// l'URL) — le vrai id numérique n'est utilisé que pour l'affichage.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const body = await req.json();
  const { title, group, hideDateFromAffiliates, sortLabel, color } = body;

  if (!title || !group) {
    return NextResponse.json({ error: "Titre et groupe sont obligatoires." }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db
    .from("order_statuses")
    .update({
      title,
      group_name: group,
      hide_date_from_affiliates: !!hideDateFromAffiliates,
      sort_label: sortLabel || "Par date de commande",
      ...(color ? { color } : {}),
    })
    .eq("slug", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const db = createAdminClient();
  const { error } = await db.from("order_statuses").delete().eq("slug", params.id);

  if (error) {
    const msg =
      error.code === "23503"
        ? "Ce statut est utilisé par des commandes existantes, impossible de le supprimer."
        : error.message;
    return NextResponse.json({ error: msg }, { status: error.code === "23503" ? 409 : 500 });
  }
  return NextResponse.json({ success: true });
}
