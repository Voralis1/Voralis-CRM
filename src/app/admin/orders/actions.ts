"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchPending } from "@/lib/postback";
import type { OrderStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function changeStatus(orderId: string, next: OrderStatus) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  // Charger l'ordre + l'offre pour calculer le payout éventuel
  const { data: order } = await supabase
    .from("orders")
    .select("id, offer_id, status, payout_amount")
    .eq("id", orderId)
    .single();
  if (!order) return;

  const { data: offer } = await supabase
    .from("offers")
    .select("payout, currency, payout_model")
    .eq("id", order.offer_id)
    .single();

  const patch: Record<string, any> = {
    status: next,
    assigned_agent: auth.user.id,
  };
  if (next === "confirmed") patch.confirmed_at = new Date().toISOString();
  if (next === "delivered") patch.delivered_at = new Date().toISOString();

  // Pose la commission quand le statut facturable de l'offre est atteint
  if (
    offer &&
    ((offer.payout_model === "confirmed" && next === "confirmed") ||
      (offer.payout_model === "delivered" && next === "delivered")) &&
    order.payout_amount == null
  ) {
    patch.payout_amount = offer.payout;
    patch.payout_currency = offer.currency;
  }

  // Mise à jour (RLS : agent/admin uniquement). Le trigger enfile le postback.
  await supabase.from("orders").update(patch).eq("id", orderId);

  // Envoi immédiat du/des postback(s) en attente (best-effort).
  try {
    await dispatchPending(10);
  } catch {
    /* le cron réessaiera */
  }

  revalidatePath("/admin/orders");
}

// (admin) crée un agent existant -> promotion de rôle par email
export async function setUserRole(email: string, role: "agent" | "affiliate" | "admin") {
  const db = createAdminClient();
  const { data } = await db.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === email);
  if (!user) return { error: "Utilisateur introuvable" };
  await db.from("profiles").update({ role }).eq("id", user.id);
  revalidatePath("/admin/affiliates");
  return { ok: true };
}
