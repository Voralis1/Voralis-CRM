// Registre dynamique des statuts de commande (table `order_statuses`), qui a
// remplacé le dictionnaire figé `STATUS_META`/`ALL_STATUSES` de `lib/types.ts`
// une fois `orders.status` passé d'un enum Postgres à du texte libre : les
// statuts sont désormais créés à volonté depuis l'onglet « Gestion des
// statuts », donc leur liste ne peut plus être connue au moment de la build.

// Mêmes noms de champs que la réponse JSON de /api/admin/statuses, pour que
// ce type serve indifféremment côté serveur (requête directe Supabase) et
// côté client (résultat du fetch).
export interface OrderStatusRow {
  id: number;
  slug: string;
  title: string;
  group: string;
  color: string;
  hideDateFromAffiliates: boolean;
  sortLabel: string;
}

function fromDbRow(row: any): OrderStatusRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    group: row.group_name,
    color: row.color,
    hideDateFromAffiliates: !!row.hide_date_from_affiliates,
    sortLabel: row.sort_label,
  };
}

// Utilisé côté serveur (server actions, route handlers) via le client Supabase
// déjà instancié par l'appelant (admin ou session), pour ne pas dupliquer la
// logique d'authentification.
export async function getOrderStatuses(db: any): Promise<OrderStatusRow[]> {
  const { data, error } = await db
    .from("order_statuses")
    .select("id, slug, title, group_name, color, hide_date_from_affiliates, sort_label")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromDbRow);
}

export async function getOrderStatusBySlug(db: any, slug: string): Promise<OrderStatusRow | null> {
  const { data, error } = await db
    .from("order_statuses")
    .select("id, slug, title, group_name, color, hide_date_from_affiliates, sort_label")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? fromDbRow(data) : null;
}

// Lookup pur, pour les composants qui reçoivent déjà la liste des statuts
// (props ou fetch client) et veulent juste le libellé/couleur d'un slug donné.
export function statusMeta(statuses: OrderStatusRow[], slug: string): OrderStatusRow | undefined {
  return statuses.find((s) => s.slug === slug);
}
