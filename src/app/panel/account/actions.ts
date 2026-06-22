"use server";

import { createClient } from "@/lib/supabase/server";
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

  // Met à jour la ligne affilié (RLS : l'affilié n'édite que la sienne).
  const { error: affErr } = await supabase
    .from("affiliate_network")
    .update({ name: trimmedName, email: trimmedEmail || null })
    .eq("auth_user_id", auth.user.id);
  if (affErr) return { error: affErr.message };

  // Met à jour l'email de connexion (Auth) s'il a changé.
  let emailPending = false;
  if (trimmedEmail && trimmedEmail !== auth.user.email) {
    const { error: emailErr } = await supabase.auth.updateUser({ email: trimmedEmail });
    if (emailErr) return { error: emailErr.message };
    emailPending = true; // une confirmation peut être requise selon la config Supabase
  }

  revalidatePath("/panel/account");
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
