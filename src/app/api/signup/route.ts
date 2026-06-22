import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiToken } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password, name } = await req.json().catch(() => ({}));
  if (!email || !password || !name)
    return NextResponse.json({ message: "Champs manquants" }, { status: 400 });

  const db = createAdminClient();

  // 1) Créer l'utilisateur (email confirmé d'office pour un onboarding rapide)
  const { data: userRes, error: userErr } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (userErr || !userRes.user)
    return NextResponse.json(
      { message: userErr?.message ?? "Échec de création du compte" },
      { status: 400 }
    );

  // 2) Créer la fiche affilié liée + token
  const token = generateApiToken();
  const { error: affErr } = await db.from("affiliate_network").insert({
    auth_user_id: userRes.user.id,
    name,
    email,
    api_token: token,
  });
  if (affErr) {
    // rollback du user si la fiche échoue
    await db.auth.admin.deleteUser(userRes.user.id);
    return NextResponse.json({ message: affErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
