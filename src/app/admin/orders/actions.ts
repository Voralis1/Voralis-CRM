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
    .select("id, product_id, status, payout_amount, exported_at")
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

  // Dès que le statut quitte "nouveau", la commande bascule automatiquement
  // dans /admin/orders-processing (même mécanisme que l'export manuel).
  if (next !== "new" && !order.exported_at) {
    patch.exported_at = new Date().toISOString();
  }

  // Le payout se déclenche dès que la commande atteint "confirmed", quel
  // que soit le payout_model du produit (statuts consolidés).
  if (product && next === "confirmed" && order.payout_amount == null) {
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
  revalidatePath("/admin/orders-processing");
  revalidatePath("/panel/leads");
}

// Marque des commandes comme exportées : elles quittent /admin/orders et
// apparaissent dans /admin/orders-processing (aller simple, pas de retour
// automatique — cf. migration add_orders_exported_at.sql).
export async function markOrdersExported(orderIds: string[]) {
  const userId = await requireStaff();
  if (!userId || orderIds.length === 0) return;

  const db = createAdminClient();
  await db
    .from("orders")
    .update({ exported_at: new Date().toISOString() })
    .in("id", orderIds);

  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders-processing");
}

// Suppression définitive (status_history/postbacks liés sont supprimés en
// cascade, cf. schema.sql). Réservé aux admins comme le reste du fichier.
export async function deleteOrder(orderId: string) {
  const userId = await requireStaff();
  if (!userId) return;

  const db = createAdminClient();
  await db.from("orders").delete().eq("id", orderId);

  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders-processing");
}

export interface BulkUpdateResult {
  updated: string[];
  notFound: string[];
  failed: string[];
  alreadyInStatus: string[];
  error?: string;
}

// Met à jour le statut de plusieurs commandes à partir de leur public_id.
export async function bulkChangeStatus(
  publicIds: string[],
  next: OrderStatus,
  titleId?: number | null
): Promise<BulkUpdateResult> {
  const userId = await requireStaff();
  if (!userId)
    return {
      updated: [],
      notFound: [],
      failed: [],
      alreadyInStatus: [],
      error: "Action réservée aux administrateurs.",
    };

  // Écriture privilégiée (service-role), autorisée par requireStaff ci-dessus.
  const db = createAdminClient();

  // Normalise et dédoublonne les identifiants saisis.
  const ids = Array.from(
    new Set(publicIds.map((id) => id.trim()).filter((id) => id !== ""))
  );
  if (ids.length === 0)
    return { updated: [], notFound: [], failed: [], alreadyInStatus: [], error: "Aucun ID fourni." };

  // Charge les commandes correspondantes (+ le produit pour le payout).
  const { data: orders, error: selectError } = await db
    .from("orders")
    .select("id, public_id, product_id, status, status_title_id, payout_amount, exported_at")
    .in("public_id", ids);

  if (selectError)
    return { updated: [], notFound: [], failed: [], alreadyInStatus: [], error: selectError.message };

  const found = orders ?? [];
  const foundIds = new Set(found.map((o) => o.public_id));
  const notFound = ids.filter((id) => !foundIds.has(id));

  const updated: string[] = [];
  const failed: string[] = [];
  const alreadyInStatus: string[] = [];
  let firstError: string | undefined;

  for (const order of found) {
    // La commande est déjà dans le statut ET le titre précis ciblés : rien
    // à faire, on le signale distinctement plutôt que de compter un
    // "update" fictif. (Deux titres différents sous le même slug, ex.
    // "Expédié" -> "Livré", restent un vrai changement.)
    if (order.status === next && order.status_title_id === (titleId ?? null)) {
      alreadyInStatus.push(order.public_id);
      continue;
    }

    const { data: product } = await db
      .from("project_products")
      .select("payout, currency, payout_model")
      .eq("id", order.product_id)
      .single();

    const patch: Record<string, any> = {
      status: next,
      status_title_id: titleId ?? null,
      assigned_agent: userId,
    };
    if (next === "confirmed") patch.confirmed_at = new Date().toISOString();

    // Dès que le statut quitte "nouveau", la commande bascule automatiquement
    // dans /admin/orders-processing (même mécanisme que l'export manuel).
    if (next !== "new" && !order.exported_at) {
      patch.exported_at = new Date().toISOString();
    }

    // Le payout se déclenche dès que la commande atteint "confirmed",
    // quel que soit le payout_model du produit (statuts consolidés : il
    // n'y a plus de statut "delivered" distinct pour temporiser le payout).
    if (product && next === "confirmed" && order.payout_amount == null) {
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
  revalidatePath("/admin/orders-processing");
  revalidatePath("/panel/leads");
  return { updated, notFound, failed, alreadyInStatus, error: firstError };
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
