// Génère le prochain identifiant public de commande, préfixé "V" (Voralis).
// On calcule max(public_id numérique) + 1, sans padding — continue la
// séquence existante (ex. après "000038" -> "V39", pas de reset), pour ne
// pas modifier les ID déjà attribués. Le préfixe est ignoré au calcul du
// max (regex \D retire toute lettre), donc les futurs ID "V39", "V40"...
// s'enchaînent correctement même après ce changement.
// Indépendant du DEFAULT en base : l'ID est posé explicitement à l'insertion.
export async function nextOrderPublicId(db: any): Promise<string> {
  const { data } = await db.from("orders").select("public_id");
  let max = 0;
  for (const r of data ?? []) {
    const digits = String(r.public_id ?? "").replace(/\D/g, "");
    const n = parseInt(digits, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return "V" + String(max + 1);
}
