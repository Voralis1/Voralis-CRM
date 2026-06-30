"use client";

import { useRouter } from "next/navigation";
import CopyRowButton from "./CopyRowButton.client";
import { useT } from "@/i18n/I18nProvider";

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  country: string;
  price: string;
  dailyCapacity: string;
  rate: string;
  payout: string;
  status: string;
  workingHours: string;
  description: string;
  imageUrl: string;
  copyText: string;
}

function statusClass(status: string) {
  return status === "active" ? "badge-success" : status === "paused" ? "badge-warning" : "badge-neutral";
}

export default function ProductsCatalog({ items }: { items: CatalogItem[] }) {
  const router = useRouter();
  const t = useT();

  return (
    <>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1300px]">
          <thead>
            <tr>
              <th className="th">{t("aff.products.colImage")}</th>
              <th className="th">{t("aff.products.colId")}</th>
              <th className="th">{t("aff.products.colName")}</th>
              <th className="th">{t("aff.products.colCategory")}</th>
              <th className="th">{t("aff.products.colCountry")}</th>
              <th className="th">{t("aff.products.colPrice")}</th>
              <th className="th">{t("aff.products.colDailyCapacity")}</th>
              <th className="th">{t("aff.products.colConfRate")}</th>
              <th className="th">{t("aff.products.colPayout")}</th>
              <th className="th">{t("aff.products.colStatus")}</th>
              <th className="th">{t("aff.products.colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="td text-center text-ink-muted" colSpan={11}>
                  {t("aff.products.empty")}
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr
                  key={p.id}
                  className="row-hover cursor-pointer"
                  onClick={() => router.push(`/panel/products/${encodeURIComponent(p.id)}`)}
                  title={t("aff.products.viewDetails")}
                >
                  <td className="td">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-white">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-ink-faint">—</span>
                      )}
                    </div>
                  </td>
                  <td className="td font-mono text-xs">{p.id}</td>
                  <td className="td font-medium">{p.name}</td>
                  <td className="td">{p.category || "—"}</td>
                  <td className="td">{p.country || "—"}</td>
                  <td className="td">{p.price || "—"}</td>
                  <td className="td">{p.dailyCapacity || "—"}</td>
                  <td className="td">{p.rate || "—"}</td>
                  <td className="td">{p.payout || "—"}</td>
                  <td className="td">
                    <span className={`badge ${statusClass(p.status)}`}>{p.status || "—"}</span>
                  </td>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    <CopyRowButton text={p.copyText} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </>
  );
}
