"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiToken } from "@/lib/api-auth";
import { getProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleAffiliate(id: string, status: string) {
  const supabase = createClient();
  await supabase.from("affiliates").update({ status }).eq("id", id);
  revalidatePath("/admin/affiliates");
}

// Crée un affilié et génère son token API (vrl_live_...). Réservé aux admins.
export async function createAffiliate(formData: FormData) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("Accès refusé");

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Nom requis");
  const email = String(formData.get("email") || "").trim() || null;
  const postbackUrl = String(formData.get("postback_url") || "").trim() || null;

  const db = createAdminClient();
  await db.from("affiliates").insert({
    name,
    email,
    postback_url: postbackUrl,
    api_token: generateApiToken(),
    status: "active",
  });
  revalidatePath("/admin/affiliates");
}

// Régénère le token d'un affilié (invalide l'ancien). Réservé aux admins.
export async function regenerateToken(id: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("Accès refusé");

  const db = createAdminClient();
  await db.from("affiliates").update({ api_token: generateApiToken() }).eq("id", id);
  revalidatePath("/admin/affiliates");
}
