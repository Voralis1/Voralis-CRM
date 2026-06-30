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
    title: row.title,
    group: row.group_name,
    hideDateFromAffiliates: !!row.hide_date_from_affiliates,
    sortLabel: row.sort_label ?? "Par date de commande",
  };
}

export async function GET() {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("order_statuses")
    .select("id, title, group_name, hide_date_from_affiliates, sort_label, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ statuses: (data || []).map(serialize) });
}

export async function POST(req: Request) {
  if (!(await ensureStaff()))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const body = await req.json();
  const { id, title, group, hideDateFromAffiliates, sortLabel } = body;

  if (!id || !title || !group) {
    return NextResponse.json(
      { error: "ID, titre et groupe sont obligatoires." },
      { status: 400 }
    );
  }

  const db = createAdminClient();
  const { error } = await db.from("order_statuses").insert({
    id,
    title,
    group_name: group,
    hide_date_from_affiliates: !!hideDateFromAffiliates,
    sort_label: sortLabel || "Par date de commande",
  });

  if (error) {
    const msg = error.code === "23505" ? "Cet ID de statut existe déjà." : error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
