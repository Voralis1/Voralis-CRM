"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultTitleId } from "@/lib/orderStatus";
import { revalidatePath } from "next/cache";

async function myUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export type MbOrderInput = {
  product?: string;
  country?: string;
  campaign?: string;
  first_name: string;
  last_name?: string;
  phone: string;
  address?: string;
  city?: string;
  quantity?: number;
  payout_amount?: number | null;
  status?: string;
  comment?: string;
};

// Crée une commande media buyer rattachée au compte connecté.
export async function createMbOrder(data: MbOrderInput) {
  const uid = await myUserId();
  if (!uid) throw new Error("Non autorisé.");
  if (!data.first_name?.trim() || !data.phone?.trim())
    throw new Error("Prénom et téléphone obligatoires.");

  const db = createAdminClient();
  const status = data.status || "new";
  const defaultTitleId = await getDefaultTitleId(db, status);
  const { error } = await db.from("mediabuyers_orders").insert({
    media_buyer_id: uid,
    product: data.product || null,
    country: data.country || null,
    campaign: data.campaign || null,
    first_name: data.first_name,
    last_name: data.last_name || null,
    phone: data.phone,
    address: data.address || null,
    city: data.city || null,
    quantity: data.quantity || 1,
    payout_amount: data.payout_amount ?? null,
    status,
    ...(defaultTitleId != null ? { status_title_id: defaultTitleId } : {}),
    comment: data.comment || null,
  });
  if (error) throw new Error(`Erreur de création: ${error.message}`);
  revalidatePath("/media-buying/orders");
  return { success: true };
}

// Supprime une commande (uniquement la sienne).
export async function deleteMbOrder(id: string) {
  const uid = await myUserId();
  if (!uid) throw new Error("Non autorisé.");
  const db = createAdminClient();
  const { error } = await db
    .from("mediabuyers_orders")
    .delete()
    .eq("id", id)
    .eq("media_buyer_id", uid);
  if (error) throw new Error(`Erreur de suppression: ${error.message}`);
  revalidatePath("/media-buying/orders");
  return { success: true };
}
