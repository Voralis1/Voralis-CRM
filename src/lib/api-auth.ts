import { createAdminClient } from "@/lib/supabase/admin";
import type { Affiliate } from "@/lib/types";
import { randomBytes } from "crypto";

// Génère un token affilié lisible (à montrer une fois / stocker en base).
export function generateApiToken(): string {
  return "vrl_live_" + randomBytes(24).toString("hex");
}

// Valide un token brut -> renvoie l'affilié actif (ou une erreur).
export async function authenticateToken(
  token: string | null | undefined
): Promise<{ affiliate: Affiliate } | { error: string; code: number }> {
  const clean = (token || "").trim();
  if (!clean) return { error: "Token manquant ou mal formé", code: 401 };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("affiliate_network")
    .select("*")
    .eq("api_token", clean)
    .single();

  if (error || !data) return { error: "Token invalide", code: 401 };
  if (data.status !== "active")
    return { error: "Compte affilié suspendu", code: 403 };

  return { affiliate: data as Affiliate };
}

// Extrait et valide le Bearer token d'une requête entrante -> renvoie l'affilié actif.
// Certains outils tiers (CRM/trackers d'affiliés) ne savent pas envoyer de
// header custom : on accepte donc aussi le token en query string (?token=…)
// en repli, comme le fait déjà l'endpoint LeadVertex.
export async function authenticateAffiliate(
  req: Request
): Promise<{ affiliate: Affiliate } | { error: string; code: number }> {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (match) return authenticateToken(match[1]);

  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken) return authenticateToken(queryToken);

  return { error: "Token manquant ou mal formé", code: 401 };
}
