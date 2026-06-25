import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "agent" | "affiliate";

export async function getSessionUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getProfile() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", auth.user.id)
    .single();
  return profile ? { ...profile, email: auth.user.email } : null;
}

// Id du réseau affilié (affiliate_network) lié au compte connecté, ou null.
// Sert à isoler les données d'un affilié (il ne voit que les siennes).
export async function getMyNetworkId(): Promise<string | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("affiliate_network")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  return data?.id ?? null;
}
