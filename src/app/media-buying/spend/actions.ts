"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function myUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export type SpendInput = {
  date: string;
  buyer_name?: string;
  country?: string;
  campaign: string;
  amount_usd: number;
  note?: string;
};

export async function createSpend(data: SpendInput) {
  const uid = await myUserId();
  if (!uid) throw new Error("Non autorisé.");
  if (!data.date || !data.campaign?.trim()) throw new Error("Date et campagne obligatoires.");

  const db = createAdminClient();
  const { error } = await db.from("media_spend").insert({
    media_buyer_id: uid,
    date: data.date,
    buyer_name: data.buyer_name || null,
    country: data.country || null,
    campaign: data.campaign.trim(),
    amount_usd: Number(data.amount_usd) || 0,
    note: data.note || null,
  });
  if (error) throw new Error(`Erreur: ${error.message}`);
  revalidatePath("/media-buying/spend");
  revalidatePath("/media-buying/results");
  return { success: true };
}

export async function updateSpend(id: string, data: SpendInput) {
  const uid = await myUserId();
  if (!uid) throw new Error("Non autorisé.");
  if (!data.date || !data.campaign?.trim()) throw new Error("Date et campagne obligatoires.");

  const db = createAdminClient();
  const { error } = await db
    .from("media_spend")
    .update({
      date: data.date,
      buyer_name: data.buyer_name || null,
      country: data.country || null,
      campaign: data.campaign.trim(),
      amount_usd: Number(data.amount_usd) || 0,
      note: data.note || null,
    })
    .eq("id", id)
    .eq("media_buyer_id", uid);
  if (error) throw new Error(`Erreur: ${error.message}`);
  revalidatePath("/media-buying/spend");
  revalidatePath("/media-buying/results");
  return { success: true };
}

export async function deleteSpend(id: string) {
  const uid = await myUserId();
  if (!uid) throw new Error("Non autorisé.");
  const db = createAdminClient();
  const { error } = await db.from("media_spend").delete().eq("id", id).eq("media_buyer_id", uid);
  if (error) throw new Error(`Erreur: ${error.message}`);
  revalidatePath("/media-buying/spend");
  revalidatePath("/media-buying/results");
  return { success: true };
}
