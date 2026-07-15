// Le statut d'une commande n'est plus un enum figé : il est créé à volonté
// depuis l'onglet « Gestion des statuts » (table `order_statuses`, voir
// src/lib/orderStatus.ts). On garde `OrderStatus` comme alias pour ne pas
// devoir toucher chaque site d'usage qui ne fait que typer une valeur.
export type OrderStatus = string;

export type Affiliate = {
  id: string;
  name: string;
  email: string | null;
  api_token: string;
  postback_url: string | null;
  postback_method: string;
  signature_secret: string;
  status: string;
};

export type Order = {
  id: string;
  public_id: string;
  affiliate_id: string;
  product_id: string | null;
  product: string | null;
  first_name: string;
  last_name: string | null;
  phone: string;
  country: string | null;
  address: string | null;
  city: string | null;
  quantity: number;
  ip: string | null;
  affiliate: string | null;
  sub1: string | null; sub2: string | null;
  sub3: string | null; sub4: string | null; sub5: string | null;
  comment: string | null;
  status: OrderStatus;
  payout_amount: number | null;
  payout_currency: string | null;
  created_at: string;
  updated_at: string;
};
