"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateOrder(orderId: string, data: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  country?: string;
  comment?: string;
  payout_amount?: number;
}) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("orders")
    .update(data)
    .eq("id", orderId);

  if (error) {
    throw new Error(`Erreur de mise à jour: ${error.message}`);
  }

  return { success: true };
}

export async function createOrder(data: {
  affiliate_id: string;
  offer_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  address?: string;
  status: string;
  payout_amount?: number;
  comment?: string;
  sub1?: string;
}) {
  const supabase = createClient();

  const { error } = await supabase
    .from("orders")
    .insert([data]);

  if (error) {
    throw new Error(`Erreur de création: ${error.message}`);
  }

  return { success: true };
}

export async function fetchAffiliates() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("affiliates")
    .select("id, name")
    .eq("status", "active");

  if (error) {
    throw new Error(`Erreur de récupération: ${error.message}`);
  }

  return data ?? [];
}

export async function fetchOffers() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("offers")
    .select("id, product, country")
    .eq("status", "active");

  if (error) {
    throw new Error(`Erreur de récupération: ${error.message}`);
  }

  return data ?? [];
}
