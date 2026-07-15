"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiToken } from "@/lib/api-auth";
import { assertSafePostbackUrl } from "@/lib/url-safety";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function myAffiliateId(): Promise<string | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("affiliate_network")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .single();
  return data?.id ?? null;
}

export async function savePostback(formData: FormData) {
  const id = await myAffiliateId();
  if (!id) return;
  const url = String(formData.get("postback_url") || "").trim();
  const method = String(formData.get("postback_method") || "GET");

  if (url) {
    const check = await assertSafePostbackUrl(url);
    if (!check.ok) redirect(`/panel/settings?postback_error=${encodeURIComponent(check.reason)}`);
  }

  // L'affilié n'édite que sa ligne (RLS), mais on passe par le client session.
  const supabase = createClient();
  await supabase
    .from("affiliate_network")
    .update({ postback_url: url || null, postback_method: method })
    .eq("id", id);
  revalidatePath("/panel/settings");
  redirect("/panel/settings");
}

export async function regenerateToken() {
  const id = await myAffiliateId();
  if (!id) return;
  // service role pour garantir l'unicité/écriture du token
  const db = createAdminClient();
  await db.from("affiliate_network").update({ api_token: generateApiToken() }).eq("id", id);
  revalidatePath("/panel/settings");
}
