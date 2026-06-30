"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOffer(formData: FormData) {
  const supabase = createClient();
  await supabase.from("offers").insert({
    id: String(formData.get("id") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    product: String(formData.get("product") || "").trim() || null,
    country: String(formData.get("country") || "").trim().toUpperCase(),
    payout: Number(formData.get("payout") || 0),
    currency: String(formData.get("currency") || "USD").toUpperCase(),
    payout_model: String(formData.get("payout_model") || "delivered"),
    status: "active",
  });
  revalidatePath("/admin/offers");
}

export async function toggleOffer(id: string, status: string) {
  const supabase = createClient();
  await supabase.from("offers").update({ status }).eq("id", id);
  revalidatePath("/admin/offers");
}
