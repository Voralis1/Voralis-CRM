"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import KpiCard from "@/components/KpiCard";
import { Icon } from "@/components/icons";
import { formatProductPrice, formatPayout } from "@/lib/currency";
import { useT } from "@/i18n/I18nProvider";

interface Product {
  id: string;
  name: string;
  category: string;
  country: string;
  price: string;
  dailyCapacity: string;
  confirmationRate: string;
  payout: string;
  status: string;
  workingHours: string;
  additionalInfo: string;
  imageUrl: string;
}

export default function ProductDetailPage({
  params,
}: {
  params: { projectId: string; productId: string };
}) {
  const t = useT();
  const STATUS_LABEL: Record<string, string> = {
    active: t("adm.products.statusActive"),
    paused: t("adm.products.statusPaused"),
    archived: t("adm.products.statusArchived"),
  };
  const { projectId, productId } = params;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t("adm.products.errLoad"));
        setProjectName(data.project?.name ?? "");
        const p = (data.products || []).find((x: any) => String(x.id) === String(productId));
        if (!p) throw new Error(t("adm.products.productNotFoundErr"));
        setProduct(p);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, productId]);

  const backToProject = () => router.push(`/admin/products/${encodeURIComponent(projectId)}`);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-56 w-full" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="card p-8 text-center">
        <div className="text-lg font-semibold">{t("adm.products.productNotFound")}</div>
        <p className="mt-1 text-sm text-ink-muted">{error ?? t("adm.products.productNotFoundHint")}</p>
        <button onClick={backToProject} className="btn btn-secondary mt-4">{t("adm.products.backToProject")}</button>
      </div>
    );
  }

  const status = product.status || "active";
  const statusClass =
    status === "active" ? "badge-success" : status === "paused" ? "badge-warning" : "badge-neutral";

  return (
    <div className="space-y-6">
      {/* Barre haute : fil d'ariane + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={backToProject}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
        >
          <Icon name="chevron-left" size={16} />
          {projectName ? `${t("adm.products.backTo")} ${projectName}` : t("adm.products.backToProject")}
        </button>
        <button
          onClick={() => router.push(`/admin/products/${encodeURIComponent(projectId)}?edit=${encodeURIComponent(product.id)}`)}
          className="btn btn-primary"
        >
          <Icon name="edit" size={15} />
          {t("adm.products.editProductBtn")}
        </button>
      </div>

      {/* Hero produit */}
      <div className="flex flex-col items-start gap-6 rounded-2xl border border-[#bfdbfe] bg-[#e8f2ff] p-6 sm:flex-row sm:items-center">
        <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Icon name="box" size={48} className="text-ink-faint" />
          )}
        </div>
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#2563eb]">
            <Icon name="tag" size={13} />
            {product.category || t("adm.products.noCategory")}
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
          label={t("adm.products.kpiPrice")}
          value={product.price ? formatProductPrice(product.price, product.country) : "—"}
          icon="dollar"
          color="blue"
          description={t("adm.products.kpiPriceDesc")}
        />
        <KpiCard
          label={t("adm.products.kpiPayout")}
          value={product.payout ? formatPayout(product.payout) : "—"}
          icon="wallet"
          color="blue"
          description={t("adm.products.kpiPayoutDesc")}
        />
        <KpiCard
          label={t("adm.products.kpiConfirmationRate")}
          value={product.confirmationRate ? `${product.confirmationRate}%` : "—"}
          icon="percent"
          color="blue"
          description={t("adm.products.kpiConfirmationRateDesc")}
        />
        <KpiCard
          label={t("adm.products.kpiCapacity")}
          value={product.dailyCapacity || "—"}
          icon="box"
          color="blue"
          description={t("adm.products.kpiCapacityDesc")}
        />
      </div>

      {/* Détails complets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">{t("adm.products.productInfo")}</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              [t("adm.products.productId"), product.id],
              [t("adm.products.category"), product.category || "—"],
              [t("adm.products.country"), product.country || "—"],
              [t("adm.products.detStatut"), STATUS_LABEL[status] ?? status],
              [t("adm.products.price"), product.price ? formatProductPrice(product.price, product.country) : "—"],
              [t("adm.products.kpiPayout"), product.payout ? formatPayout(product.payout) : "—"],
              [t("adm.products.dailyCapacity"), product.dailyCapacity || "—"],
              [t("adm.products.workingHours"), product.workingHours || "—"],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-line pb-3">
                <dt className="text-xs uppercase tracking-wide text-ink-faint">{label}</dt>
                <dd className="mt-1 font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold">{t("adm.products.additionalInfo")}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
            {product.additionalInfo || t("adm.products.noExtraInfo")}
          </p>
        </div>
      </div>
    </div>
  );
}
