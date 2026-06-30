import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmationRateFor, type RateOrder } from "@/lib/confirmationRate";
import { formatProductPrice, formatPayout } from "@/lib/currency";
import KpiCard from "@/components/KpiCard";
import { Icon } from "@/components/icons";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function PanelProductDetail({ params }: { params: { productId: string } }) {
  const t = getServerT();
  const STATUS_LABEL: Record<string, string> = {
    active: t("aff.productDetail.statusActive"),
    paused: t("aff.productDetail.statusPaused"),
    archived: t("aff.productDetail.statusArchived"),
  };
  const supabase = createClient();
  const { data: product } = await supabase
    .from("project_products")
    .select("id, name, category, country, price, daily_capacity, payout, status, working_hours, description, image_url")
    .eq("id", params.productId)
    .maybeSingle();

  if (!product) {
    return (
      <div className="card p-8 text-center">
        <div className="text-lg font-semibold">{t("aff.productDetail.notFound")}</div>
        <p className="mt-1 text-sm text-ink-muted">{t("aff.productDetail.notFoundDesc")}</p>
        <Link href="/panel/products" className="btn btn-secondary mt-4">{t("aff.productDetail.backToProducts")}</Link>
      </div>
    );
  }

  // Taux de confirmation global (agrégat de tous les leads, sans données perso).
  const admin = createAdminClient();
  const { data: orders } = await admin.from("orders").select("status, offer_id, product");
  const rate = confirmationRateFor(product as any, (orders ?? []) as RateOrder[]);

  const status = product.status || "active";
  const statusClass =
    status === "active" ? "badge-success" : status === "paused" ? "badge-warning" : "badge-neutral";

  return (
    <div className="space-y-6">
      {/* Barre haute */}
      <Link
        href="/panel/products"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
      >
        <Icon name="chevron-left" size={16} />
        {t("aff.productDetail.backToProducts")}
      </Link>

      {/* Hero produit */}
      <div className="flex flex-col items-start gap-6 rounded-2xl border border-[#bfdbfe] bg-[#e8f2ff] p-6 sm:flex-row sm:items-center">
        <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Icon name="box" size={48} className="text-ink-faint" />
          )}
        </div>
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#2563eb]">
            <Icon name="tag" size={13} />
            {product.category || t("aff.productDetail.noCategory")}
          </div>
          <h1 className="mt-2 text-3xl font-bold text-ink">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            <span className="font-mono">{product.id}</span>
            {product.country && (
              <span className="inline-flex items-center gap-1">
                <Icon name="globe" size={13} /> {product.country}
              </span>
            )}
            <span className={`badge ${statusClass}`}>{STATUS_LABEL[status] ?? status}</span>
          </div>
        </div>
      </div>

      {/* KPI produit */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("aff.productDetail.kpiPrice")}
          value={product.price != null ? formatProductPrice(product.price, product.country) : "—"}
          icon="dollar"
          color="blue"
          description={t("aff.productDetail.kpiPriceDesc")}
        />
        <KpiCard
          label={t("aff.productDetail.kpiPayout")}
          value={product.payout ? formatPayout(product.payout) : "—"}
          icon="wallet"
          color="blue"
          description={t("aff.productDetail.kpiPayoutDesc")}
        />
        <KpiCard
          label={t("aff.productDetail.kpiConfRate")}
          value={rate ? `${rate}%` : "—"}
          icon="percent"
          color="blue"
          description={t("aff.productDetail.kpiConfRateDesc")}
        />
        <KpiCard
          label={t("aff.productDetail.kpiDailyCapacity")}
          value={product.daily_capacity || "—"}
          icon="box"
          color="blue"
          description={t("aff.productDetail.kpiDailyCapacityDesc")}
        />
      </div>

      {/* Détails complets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">{t("aff.productDetail.infoTitle")}</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              [t("aff.productDetail.rowId"), product.id],
              [t("aff.productDetail.rowCategory"), product.category || "—"],
              [t("aff.productDetail.rowCountry"), product.country || "—"],
              [t("aff.productDetail.rowStatus"), STATUS_LABEL[status] ?? status],
              [t("aff.productDetail.rowPrice"), product.price != null ? formatProductPrice(product.price, product.country) : "—"],
              [t("aff.productDetail.rowPayout"), product.payout ? formatPayout(product.payout) : "—"],
              [t("aff.productDetail.rowDailyCapacity"), product.daily_capacity || "—"],
              [t("aff.productDetail.rowWorkingHours"), product.working_hours || "—"],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-line pb-3">
                <dt className="text-xs uppercase tracking-wide text-ink-faint">{label}</dt>
                <dd className="mt-1 font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold">{t("aff.productDetail.extraTitle")}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
            {product.description || t("aff.productDetail.extraEmpty")}
          </p>
        </div>
      </div>
    </div>
  );
}
