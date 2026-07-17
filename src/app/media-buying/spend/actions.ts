"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { accountNameBelongsToBuyer } from "@/lib/mediaBuyerAccounts";
import { revalidatePath } from "next/cache";

export type SpendInput = {
  date: string;
  account_name?: string;
  country?: string;
  campaign: string;
  clicks?: number;
  impressions?: number;
  leads?: number;
  spend: number;
};

// Vérifie que l'utilisateur courant a le droit d'écrire sur ce compte pub
// (admin: tout ; buyer: son propre nom, ou "Fgmed" pour les comptes non
// attribués à un autre buyer — voir src/lib/mediaBuyerAccounts.ts).
async function authorizeAccountName(accountName: string) {
  const profile = await getProfile();
  if (!profile) throw new Error("Non autorisé.");
  if (profile.role === "admin") return;
  const db = createAdminClient();
  const { data: buyers } = await db.from("profiles").select("full_name").eq("role", "media_buyer");
  const allNames = (buyers ?? []).map((b) => b.full_name);
  if (!accountNameBelongsToBuyer(accountName, profile.full_name, allNames)) {
    throw new Error("Ce compte publicitaire ne vous appartient pas.");
  }
}

function computedFields(spend: number, clicks: number, impressions: number, leads: number) {
  return {
    cpl: leads > 0 ? Math.round((spend / leads) * 100) / 100 : null,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : null,
  };
}

export async function updateSpend(id: number, data: SpendInput) {
  if (!data.date || !data.campaign?.trim()) throw new Error("Date et campagne obligatoires.");
  const accountName = (data.account_name || "").trim();

  const db = createAdminClient();
  const { data: existing } = await db.from("media_spend").select("account_name").eq("id", id).single();
  if (!existing) throw new Error("Dépense introuvable.");
  await authorizeAccountName(existing.account_name ?? "");
  await authorizeAccountName(accountName);

  const clicks = Number(data.clicks) || 0;
  const impressions = Number(data.impressions) || 0;
  const leads = Number(data.leads) || 0;
  const spend = Number(data.spend) || 0;

  const { error } = await db
    .from("media_spend")
    .update({
      date: data.date,
      account_name: accountName || null,
      country: data.country || null,
      campaign: data.campaign.trim(),
      clicks,
      impressions,
      leads,
      spend,
      ...computedFields(spend, clicks, impressions, leads),
    })
    .eq("id", id);
  if (error) throw new Error(`Erreur: ${error.message}`);
  revalidatePath("/media-buying/spend");
  revalidatePath("/media-buying/results");
  return { success: true };
}

export async function deleteSpend(id: number) {
  const db = createAdminClient();
  const { data: existing } = await db.from("media_spend").select("account_name").eq("id", id).single();
  if (!existing) throw new Error("Dépense introuvable.");
  await authorizeAccountName(existing.account_name ?? "");

  const { error } = await db.from("media_spend").delete().eq("id", id);
  if (error) throw new Error(`Erreur: ${error.message}`);
  revalidatePath("/media-buying/spend");
  revalidatePath("/media-buying/results");
  return { success: true };
}
