"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextOrderPublicId } from "@/lib/orderId";
import { getMyNetworkId } from "@/lib/auth";

// Garantit qu'une offre existe pour un produit du catalogue (cible de la FK
// orders.offer_id) et renvoie l'offer_id. Crée l'offre si nécessaire.
async function ensureOfferForProduct(db: any, productId: string): Promise<string> {
  const { data: product, error: prodErr } = await db
    .from("project_products")
    .select("id, name, price, country")
    .eq("id", productId)
    .single();
  if (prodErr || !product) throw new Error("Produit introuvable.");

  const offerId = product.id;
  const { data: existingOffer } = await db
    .from("offers")
    .select("id")
    .eq("id", offerId)
    .maybeSingle();

  if (!existingOffer) {
    const offerCountry =
      product.country && product.country.length === 2 ? product.country.toUpperCase() : "XX";
    const { error: offerErr } = await db.from("offers").insert({
      id: offerId,
      name: product.name,
      product: product.name,
      country: offerCountry,
      payout: Number(product.price ?? 0),
      currency: "USD",
      payout_model: "delivered",
      status: "active",
    });
    if (offerErr) throw new Error(`Erreur de création de l'offre: ${offerErr.message}`);
  }
  return offerId;
}

export async function updateOrder(orderId: string, data: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  country?: string;
  comment?: string;
  payout_amount?: number | null;
  status?: string;
  affiliate?: string;   // sous-affilié -> colonne `affiliate`
  product_id?: string;  // change de produit (re-provisionne l'offre)
}) {
  // Isolation : l'affilié ne peut éditer QUE ses propres leads.
  const networkId = await getMyNetworkId();
  if (!networkId) throw new Error("Non autorisé.");
  const db = createAdminClient();

  const patch: Record<string, any> = {};
  if (data.first_name !== undefined) patch.first_name = data.first_name;
  if (data.last_name !== undefined) patch.last_name = data.last_name;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.address !== undefined) patch.address = data.address;
  if (data.country !== undefined) patch.country = data.country;
  if (data.comment !== undefined) patch.comment = data.comment;
  if (data.payout_amount !== undefined) patch.payout_amount = data.payout_amount;
  if (data.status !== undefined) patch.status = data.status;
  if (data.affiliate !== undefined) patch.affiliate = data.affiliate?.trim() || null;
  if (data.product_id) patch.offer_id = await ensureOfferForProduct(db, data.product_id);

  const { error } = await db.from("orders").update(patch).eq("id", orderId).eq("affiliate_id", networkId);

  if (error) {
    throw new Error(`Erreur de mise à jour: ${error.message}`);
  }

  return { success: true };
}

export async function deleteOrder(orderId: string) {
  // Isolation : l'affilié ne peut supprimer QUE ses propres leads.
  const networkId = await getMyNetworkId();
  if (!networkId) throw new Error("Non autorisé.");
  // Les status_history/postbacks liés sont supprimés en cascade.
  const db = createAdminClient();
  const { error } = await db.from("orders").delete().eq("id", orderId).eq("affiliate_id", networkId);

  if (error) {
    throw new Error(`Erreur de suppression: ${error.message}`);
  }

  return { success: true };
}

export async function createOrder(data: {
  affiliate: string; // sous-composant (texte libre) de l'affiliate network
  product_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  address?: string;
  status: string;
  payout_amount?: number;
  comment?: string;
}) {
  // Service-role : provisionne l'offre liée au produit puis insère la commande
  // (la table orders n'a pas de politique d'insertion pour les affiliés).
  const db = createAdminClient();

  // 0) L'affiliate network = le compte affilié connecté (ex. « fgmed »).
  const session = createClient();
  const { data: authData } = await session.auth.getUser();
  if (!authData.user) throw new Error("Non authentifié.");
  const { data: network } = await db
    .from("affiliate_network")
    .select("id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();
  if (!network) throw new Error("Aucun affiliate network associé à votre compte.");

  // 1+2) Garantir l'existence d'une offre pour le produit (cible de la FK).
  const offerId = await ensureOfferForProduct(db, data.product_id);

  // 3) Insérer la commande avec un identifiant public numérique.
  //    L'« affiliate » (sous-affilié) est stocké en texte libre dans `affiliate`.
  const publicId = await nextOrderPublicId(db);
  const { error } = await db.from("orders").insert([
    {
      public_id: publicId,
      affiliate_id: network.id,
      offer_id: offerId,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      country: data.country,
      address: data.address,
      status: data.status,
      payout_amount: data.payout_amount,
      comment: data.comment,
      affiliate: data.affiliate?.trim() || null,
    },
  ]);

  if (error) {
    throw new Error(`Erreur de création: ${error.message}`);
  }

  // Registre des affiliés : garantit que le sous-affilié (affiliate) existe.
  const affiliateName = data.affiliate?.trim();
  if (affiliateName) {
    await db
      .from("affiliate")
      .upsert({ name: affiliateName, network_id: network.id }, { onConflict: "network_id,name", ignoreDuplicates: true });
  }

  return { success: true };
}

export async function fetchAffiliates() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("affiliate_network")
    .select("id, name")
    .eq("status", "active");

  if (error) {
    throw new Error(`Erreur de récupération: ${error.message}`);
  }

  return data ?? [];
}

// Tous les produits créés par l'administrateur dans « Gestion de produits ».
export async function fetchProducts() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("project_products")
    .select("id, name, price, country")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erreur de récupération: ${error.message}`);
  }

  return data ?? [];
}
