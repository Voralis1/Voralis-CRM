"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Statuts considérés comme « confirmés » (donc payables au webmaster).
const CONFIRMED = ["confirmed", "shipped", "in_delivery", "delivered"];

// Marque comme payés tous les leads confirmés non encore payés d'un webmaster.
// -> le payout dû repasse à 0. Réservé aux admins.
export async function markPaid(networkId: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("Accès refusé");

  const db = createAdminClient();
  await db
    .from("orders")
    .update({ paid_at: new Date().toISOString() })
    .eq("affiliate_id", networkId)
    .is("paid_at", null)
    .in("status", CONFIRMED);

  revalidatePath("/admin/payout");
}
