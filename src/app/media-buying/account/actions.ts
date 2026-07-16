"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateProfile(
  name: string,
  email: string
): Promise<{ success?: true; error?: string; emailPending?: boolean }> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Non authentifié." };

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  if (!trimmedName) return { error: "Le nom est obligatoire." };
  if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
    return { error: "Adresse email invalide." };
  }

  // `profiles` n'a qu'une politique RLS de lecture (pas d'écriture) : on passe
  // par le service role pour cette mise à jour, l'identité étant déjà vérifiée
  // via la session ci-dessus (auth.user.id).
  const db = createAdminClient();
  const { error: profileErr } = await db
    .from("profiles")
    .update({ full_name: trimmedName })
    .eq("id", auth.user.id);
  if (profileErr) return { error: profileErr.message };

  // Met à jour l'email de connexion (Auth) s'il a changé.
  let emailPending = false;
  if (trimmedEmail && trimmedEmail !== auth.user.email) {
    const { error: emailErr } = await supabase.auth.updateUser({ email: trimmedEmail });
    if (emailErr) return { error: emailErr.message };
    emailPending = true; // une confirmation peut être requise selon la config Supabase
  }

  revalidatePath("/media-buying/account");
  return { success: true, emailPending };
}

export async function updatePassword(
  newPassword: string
): Promise<{ success?: true; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Non authentifié." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { success: true };
}
