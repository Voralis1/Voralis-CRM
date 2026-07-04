import Link from "next/link";
import { formatProductPrice, formatPayout } from "@/lib/currency";
import { getServerT } from "@/i18n/server";

interface TopOffer {
  id: string;
  name: string;
  country: string | null;
  price: number | null;
  payout: number | null;
  rate: number;
}

export function TopOffers({ offers }: { offers: TopOffer[] }) {
  const t = getServerT();

  return (
    <div className="card p-4">
      <h2 className="text-base font-semibold text-ink">{t("aff.topOffers.title")}</h2>
      <p className="mb-3 text-sm text-ink-muted">{t("aff.topOffers.subtitle")}</p>

      {offers.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("aff.topOffers.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {offers.map((o) => (
            <Link
              key={o.id}
              href={`/panel/products/${o.id}`}
              className="row-hover rounded-xl border border-line p-4 transition"
            >
              <div className="truncate font-semibold text-ink">{o.name}</div>
              <div className="mt-1 text-xs text-ink-muted">
                {o.country ?? "—"}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-ink-muted">{t("aff.topOffers.colConfRate")}</span>
                <span className="font-semibold text-accent">{o.rate}%</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-ink-muted">{t("aff.topOffers.colPrice")}</span>
                <span>{o.price != null ? formatProductPrice(o.price, o.country) : "—"}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-ink-muted">{t("aff.topOffers.colPayout")}</span>
                <span>{o.payout ? formatPayout(o.payout) : "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
