import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function ensureStaff() {
  const profile = await getProfile();
  return profile && profile.role === "admin";
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const body = await req.json();
  const { title, sortOrder } = body;
  if (!title) return NextResponse.json({ error: "Titre obligatoire." }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db
    .from("status_titles")
    .update({ title, ...(sortOrder != null ? { sort_order: Number(sortOrder) } : {}) })
    .eq("id", params.id);

  if (error) {
    const msg = error.code === "23505" ? "Ce titre existe déjà pour ce statut." : error.message;
    return NextResponse.json({ error: msg }, { status: error.code === "23505" ? 400 : 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const db = createAdminClient();

  // Un slug doit toujours garder au moins un titre sélectionnable.
  const { data: current } = await db.from("status_titles").select("slug").eq("id", params.id).maybeSingle();
  if (current) {
    const { count } = await db.from("status_titles").select("id", { count: "exact", head: true }).eq("slug", current.slug);
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: "Impossible de supprimer le dernier titre d'un statut." }, { status: 409 });
    }
  }

  // Un titre en cours d'utilisation est détaché (repli sur le titre
  // générique du slug) plutôt que de bloquer la suppression : contrairement
  // au slug, le titre n'est qu'un affichage, pas une contrainte métier.
  await db.from("orders").update({ status_title_id: null }).eq("status_title_id", params.id);
  await db.from("mediabuyers_orders").update({ status_title_id: null }).eq("status_title_id", params.id);

  const { error } = await db.from("status_titles").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
