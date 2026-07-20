import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function ensureStaff() {
  const profile = await getProfile();
  return profile && profile.role === "admin";
}

function serialize(row: any) {
  return { id: row.id, slug: row.slug, title: row.title, sortOrder: row.sort_order ?? 0 };
}

export async function GET() {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("status_titles")
    .select("id, slug, title, sort_order")
    .order("slug", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ titles: (data || []).map(serialize) });
}

// Crée un titre supplémentaire sous un slug existant.
export async function POST(req: Request) {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const body = await req.json();
  const { slug, title, sortOrder } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: "Slug et titre sont obligatoires." }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from("status_titles").insert({
    slug,
    title,
    sort_order: Number(sortOrder) || 0,
  });

  if (error) {
    const msg =
      error.code === "23505"
        ? "Ce titre existe déjà pour ce statut."
        : error.code === "23503"
          ? "Slug de statut introuvable."
          : error.message;
    return NextResponse.json({ error: msg }, { status: error.code ? 400 : 500 });
  }

  return NextResponse.json({ success: true });
}
