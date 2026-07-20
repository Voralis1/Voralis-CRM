import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function ensureStaff() {
  const profile = await getProfile();
  return profile && profile.role === "admin";
}

function serialize(row: any) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    group: row.group_name,
    color: row.color,
    hideDateFromAffiliates: !!row.hide_date_from_affiliates,
    sortLabel: row.sort_label ?? "Par date de commande",
  };
}

// Le slug est l'identifiant technique stocké dans orders.status : minuscules,
// chiffres et underscore uniquement (immuable une fois créé).
const SLUG_PATTERN = /^[a-z0-9_]+$/;

export async function GET() {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("order_statuses")
    .select("id, slug, title, group_name, color, hide_date_from_affiliates, sort_label")
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ statuses: (data || []).map(serialize) });
}

export async function POST(req: Request) {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const body = await req.json();
  const { slug, title, group, hideDateFromAffiliates, sortLabel, color } = body;

  if (!slug || !title || !group) {
    return NextResponse.json(
      { error: "Slug, titre et groupe sont obligatoires." },
      { status: 400 }
    );
  }
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json(
      { error: "Le slug ne peut contenir que des minuscules, chiffres et underscore." },
      { status: 400 }
    );
  }

  const db = createAdminClient();
  const { error } = await db.from("order_statuses").insert({
    slug,
    title,
    group_name: group,
    hide_date_from_affiliates: !!hideDateFromAffiliates,
    sort_label: sortLabel || "Par date de commande",
    color: color || "bg-slate-100 text-slate-700",
  });

  if (error) {
    const msg = error.code === "23505" ? "Ce slug de statut existe déjà." : error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Chaque slug doit avoir au moins un titre sélectionnable : on crée un
  // titre par défaut (= le titre du slug) que l'admin pourra ensuite
  // dédoubler en plusieurs titres depuis l'écran « Gestion des statuts ».
  await db.from("status_titles").insert({ slug, title, sort_order: 0 });

  return NextResponse.json({ success: true });
}
