import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiToken } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password, name, role: rawRole } = await req.json().catch(() => ({}));
  if (!email || !password || !name)
    return NextResponse.json({ message: "Champs manquants" }, { status: 400 });

  // Choix à l'inscription : affiliate ou media_buyer uniquement.
  // Le rôle admin n'est JAMAIS attribuable via l'inscription (sécurité) — il se
  // pose directement en base de données.
  const role = rawRole === "media_buyer" ? "media_buyer" : "affiliate";

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
  const userId = userRes.user.id;

  if (role === "affiliate") {
    // Affilié : fiche affiliate_network + token. Le rôle 'affiliate' est posé
    // par défaut par le trigger handle_new_user.
    const token = generateApiToken();
    const { error: affErr } = await db.from("affiliate_network").insert({
      auth_user_id: userId,
      name,
      email,
      api_token: token,
    });
    if (affErr) {
      await db.auth.admin.deleteUser(userId);
      return NextResponse.json({ message: affErr.message }, { status: 400 });
    }
  } else {
    // Media buyer : pas de réseau ni de token, on pose juste le rôle.
    const { error: roleErr } = await db.from("profiles").update({ role: "media_buyer" }).eq("id", userId);
    if (roleErr) {
      await db.auth.admin.deleteUser(userId);
      return NextResponse.json({ message: roleErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, role });
}
