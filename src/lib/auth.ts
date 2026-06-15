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
