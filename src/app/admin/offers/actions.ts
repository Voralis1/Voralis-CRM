"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOffer(formData: FormData) {
  const supabase = createClient();

  // L'ID de l'offre est celui du produit choisi (project_products.id) : un
  // affilié peut ainsi utiliser le même identifiant en offer_id ou en product.
  const productId = String(formData.get("productId") || "").trim();
  if (!productId) return;
  const { data: product } = await supabase
    .from("project_products")
    .select("name")
    .eq("id", productId)
    .single();

  await supabase.from("offers").insert({
    id: productId,
    name: String(formData.get("name") || "").trim(),
    product: product?.name ?? null,
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
