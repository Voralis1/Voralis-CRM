"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchPending } from "@/lib/postback";
import type { OrderStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

// Vérifie que l'appelant est bien un membre du staff (admin/agent).
// Renvoie son id si autorisé, sinon null. On lit le rôle via le client de
// session (cookies) ; l'écriture, elle, passera par le client service-role.
async function requireStaff(): Promise<string | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "admin") return null;
  return auth.user.id;
}

export async function changeStatus(orderId: string, next: OrderStatus) {
  const userId = await requireStaff();
  if (!userId) return;

  // Écriture privilégiée (service-role) : le droit admin/agent est garanti par
  // requireStaff ci-dessus, on n'est donc plus dépendant de la RLS de session.
  const db = createAdminClient();

  // Charger l'ordre + le produit pour calculer le payout éventuel
  const { data: order } = await db
    .from("orders")
    .select("id, product_id, status, payout_amount")
    .eq("id", orderId)
    .single();
  if (!order) return;

  const { data: product } = await db
    .from("project_products")
    .select("payout, currency, payout_model")
    .eq("id", order.product_id)
    .single();

  const patch: Record<string, any> = {
    status: next,
    assigned_agent: userId,
  };
  if (next === "confirmed") patch.confirmed_at = new Date().toISOString();
  if (next === "delivered") patch.delivered_at = new Date().toISOString();

  // Pose la commission quand le statut facturable du produit est atteint
  if (
    product &&
    ((product.payout_model === "confirmed" && next === "confirmed") ||
      (product.payout_model === "delivered" && next === "delivered")) &&
    order.payout_amount == null
  ) {
    patch.payout_amount = product.payout;
    patch.payout_currency = product.currency;
  }

  // Mise à jour. Le trigger enfile le postback.
  await db.from("orders").update(patch).eq("id", orderId);

  // Envoi immédiat du/des postback(s) en attente (best-effort).
  try {
    await dispatchPending(10);
  } catch {
    /* le cron réessaiera */
  }

  revalidatePath("/admin/orders");
  revalidatePath("/panel/leads");
}

export interface BulkUpdateResult {
  updated: string[];
  notFound: string[];
  failed: string[];
  error?: string;
}

// Met à jour le statut de plusieurs commandes à partir de leur public_id.
export async function bulkChangeStatus(
  publicIds: string[],
  next: OrderStatus
): Promise<BulkUpdateResult> {
  const userId = await requireStaff();
  if (!userId)
    return {
      updated: [],
      notFound: [],
      failed: [],
      error: "Action réservée aux administrateurs.",
    };

  // Écriture privilégiée (service-role), autorisée par requireStaff ci-dessus.
  const db = createAdminClient();

  // Normalise et dédoublonne les identifiants saisis.
  const ids = Array.from(
    new Set(publicIds.map((id) => id.trim()).filter((id) => id !== ""))
  );
  if (ids.length === 0)
    return { updated: [], notFound: [], failed: [], error: "Aucun ID fourni." };

  // Charge les commandes correspondantes (+ le produit pour le payout).
  const { data: orders, error: selectError } = await db
    .from("orders")
    .select("id, public_id, product_id, status, payout_amount")
    .in("public_id", ids);

  if (selectError)
    return { updated: [], notFound: [], failed: [], error: selectError.message };

  const found = orders ?? [];
  const foundIds = new Set(found.map((o) => o.public_id));
  const notFound = ids.filter((id) => !foundIds.has(id));

  const updated: string[] = [];
  const failed: string[] = [];
  let firstError: string | undefined;

  for (const order of found) {
    const { data: product } = await db
      .from("project_products")
      .select("payout, currency, payout_model")
      .eq("id", order.product_id)
      .single();

    const patch: Record<string, any> = {
      status: next,
      assigned_agent: userId,
    };
    if (next === "confirmed") patch.confirmed_at = new Date().toISOString();
    if (next === "delivered") patch.delivered_at = new Date().toISOString();

    if (
      product &&
      ((product.payout_model === "confirmed" && next === "confirmed") ||
        (product.payout_model === "delivered" && next === "delivered")) &&
      order.payout_amount == null
    ) {
      patch.payout_amount = product.payout;
      patch.payout_currency = product.currency;
    }

    // On renvoie la ligne modifiée pour confirmer l'écriture.
    const { data: changed, error: updateError } = await db
      .from("orders")
      .update(patch)
      .eq("id", order.id)
      .select("public_id");

    if (updateError) {
      firstError ??= updateError.message;
      failed.push(order.public_id);
    } else if (!changed || changed.length === 0) {
      firstError ??= "Mise à jour impossible.";
      failed.push(order.public_id);
    } else {
      updated.push(order.public_id);
    }
  }

  // Envoi des postbacks en attente (best-effort).
  try {
    await dispatchPending(Math.max(10, found.length));
  } catch {
    /* le cron réessaiera */
  }

  revalidatePath("/admin/orders");
  revalidatePath("/panel/leads");
  return { updated, notFound, failed, error: firstError };
}

// (admin) attribue un rôle à un compte existant par email
export async function setUserRole(email: string, role: "affiliate" | "media_buyer" | "admin") {
  const db = createAdminClient();
  const { data } = await db.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === email);
  if (!user) return { error: "Utilisateur introuvable" };
  await db.from("profiles").update({ role }).eq("id", user.id);
  revalidatePath("/admin/affiliates");
  return { ok: true };
}
