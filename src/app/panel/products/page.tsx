import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { affiliateConfirmationRateFor, type RateOrder } from "@/lib/confirmationRate";
import { formatProductPrice, formatPayout, currencyForCountry } from "@/lib/currency";
import DownloadButton from "./DownloadButton.client";
import DownloadJsonButton from "./DownloadJsonButton.client";
import ProductsCatalog, { type CatalogItem } from "./ProductsCatalog.client";
import { getServerT } from "@/i18n/server";

// Toujours recharger pour refléter les produits ajoutés par l'administrateur.
export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  name: string;
  category: string | null;
  country: string | null;
  price: number | null;
  daily_capacity: number | null;
  payout: number | null;
  status: string | null;
  working_hours: string | null;
  description: string | null;
  image_url: string | null;
}

export default async function PanelProductsPage() {
  const t = getServerT();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_products")
    .select("id, name, category, country, price, daily_capacity, payout, status, working_hours, description, image_url")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  const products = (data ?? []) as ProductRow[];

  // Taux de confirmation global (comme la page admin) -> service role pour
  // lire l'agrégat de tous les leads (statut/product_id/product, sans données perso).
  const admin = createAdminClient();
  const { data: orders } = await admin.from("orders").select("status, product_id, product");
  const allOrders = (orders ?? []) as RateOrder[];

  // Taux calculé une seule fois -> réutilisé par le tableau ET le CSV.
  const enriched = products.map((p) => ({ p, rate: affiliateConfirmationRateFor(p, allOrders) }));

  const csvHeaders = [
    t("aff.products.csvId"), t("aff.products.csvName"), t("aff.products.csvCategory"), t("aff.products.csvCountry"), t("aff.products.csvPrice"),
    t("aff.products.csvDailyCapacity"), t("aff.products.csvConfRate"), t("aff.products.csvPayout"), t("aff.products.csvStatus"),
    t("aff.products.csvWorkingHours"), t("aff.products.csvExtraInfo"),
  ];
  // Catalogue JSON prêt pour l'intégration API / CRM de l'affilié.
  const jsonData = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category ?? null,
    country: p.country ?? null,
    currency: currencyForCountry(p.country) || null,
    price: p.price ?? null,
    payout: p.payout ?? null,
    status: p.status ?? null,
  }));

  const csvRows = enriched.map(({ p, rate }) => [
    p.id, p.name, p.category ?? "", p.country ?? "",
    p.price != null ? formatProductPrice(p.price, p.country) : "",
    p.daily_capacity != null ? String(p.daily_capacity) : "",
    rate ? `${rate}%` : "",
    p.payout ? formatPayout(p.payout) : "",
    p.status ?? "",
    p.working_hours ?? "",
    p.description ?? "",
  ]);

  const items: CatalogItem[] = enriched.map(({ p, rate }, i) => ({
    id: p.id,
    name: p.name,
    category: p.category ?? "",
    country: p.country ?? "",
    price: p.price != null ? formatProductPrice(p.price, p.country) : "",
    dailyCapacity: p.daily_capacity != null ? String(p.daily_capacity) : "",
    rate: rate ? `${rate}%` : "",
    payout: p.payout ? formatPayout(p.payout) : "",
    status: p.status ?? "",
    workingHours: p.working_hours ?? "",
    description: p.description ?? "",
    imageUrl: p.image_url ?? "",
    copyText: csvRows[i].join("\t"),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("aff.products.title")}</h1>
          <p className="text-sm text-ink-muted">
            {t("aff.products.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <DownloadJsonButton data={jsonData} filename="produits.json" />
          <DownloadButton headers={csvHeaders} rows={csvRows} filename="produits.csv" />
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {t("aff.products.loadError")} {error.message}
        </div>
      )}

      <ProductsCatalog items={items} />
    </div>
  );
}
