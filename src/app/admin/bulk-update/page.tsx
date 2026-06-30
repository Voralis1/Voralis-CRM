"use client";

import { useMemo, useState } from "react";
import { bulkChangeStatus, type BulkUpdateResult } from "../orders/actions";
import { ALL_STATUSES, STATUS_META, type OrderStatus } from "@/lib/types";
import { useT } from "@/i18n/I18nProvider";

export default function BulkUpdatePage() {
  const t = useT();
  const [rawIds, setRawIds] = useState("");
  const [status, setStatus] = useState<OrderStatus>("confirmed");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<BulkUpdateResult | null>(null);

  // Accepte les IDs séparés par retour à la ligne, virgule, point-virgule ou espace.
  const ids = useMemo(
    () => rawIds.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean),
    [rawIds]
  );

  const handleSubmit = async () => {
    if (ids.length === 0) return;
    setIsSaving(true);
    setResult(null);
    try {
      const res = await bulkChangeStatus(ids, status);
      setResult(res);
      if (res.updated.length > 0 && res.notFound.length === 0) setRawIds("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adm.bulk.title")}</h1>
        <p className="text-sm text-ink-muted">
          {t("adm.bulk.subtitle")}
        </p>
      </div>

      <div className="card space-y-4 p-6">
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{t("adm.bulk.orderIds")}</span>
          <textarea
            value={rawIds}
            onChange={(e) => setRawIds(e.target.value)}
            rows={8}
            className="input w-full font-mono text-sm"
            placeholder={"000001\n000002\n000003"}
          />
          <span className="text-xs text-ink-muted">
            {t("adm.bulk.idPerLine")} {ids.length} {ids.length > 1 ? t("adm.bulk.detectedPlural") : t("adm.bulk.detectedSingular")}
          </span>
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-medium">{t("adm.bulk.newStatus")}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="input w-full max-w-xs"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={ids.length === 0 || isSaving}
            className="btn btn-primary disabled:opacity-50"
          >
            {isSaving ? t("adm.bulk.updating") : `${t("adm.bulk.update")} ${ids.length || ""} ${ids.length > 1 ? t("adm.bulk.orderPlural") : t("adm.bulk.orderSingular")}`}
          </button>
        </div>
      </div>

      {result && (
        <div className="card space-y-3 p-6">
          <div className="alert alert-success">
            {result.updated.length} {result.updated.length > 1 ? t("adm.bulk.orderPlural") : t("adm.bulk.orderSingular")}{" "}
            {result.updated.length > 1 ? t("adm.bulk.updatedToward") : t("adm.bulk.updatedTowardSingular")} «&nbsp;{STATUS_META[status].label}&nbsp;».
          </div>
          {result.updated.length > 0 && (
            <div className="text-xs font-mono text-ink-muted">{result.updated.join(", ")}</div>
          )}
          {result.failed.length > 0 && (
            <div className="alert alert-danger">
              {result.failed.length} {result.failed.length > 1 ? t("adm.bulk.failedPlural") : t("adm.bulk.failed")} :{" "}
              <span className="font-mono">{result.failed.join(", ")}</span>
              {result.error && <div className="mt-1 text-xs">{result.error}</div>}
            </div>
          )}
          {result.notFound.length > 0 && (
            <div className="alert alert-warning">
              {result.notFound.length} {result.notFound.length > 1 ? t("adm.bulk.notFoundPlural") : t("adm.bulk.notFound")} :{" "}
              <span className="font-mono">{result.notFound.join(", ")}</span>
            </div>
          )}
          {result.error && result.failed.length === 0 && (
            <div className="alert alert-danger">{result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
