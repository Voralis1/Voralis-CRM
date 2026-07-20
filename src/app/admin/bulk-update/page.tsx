"use client";

import { useEffect, useMemo, useState } from "react";
import { bulkChangeStatus, type BulkUpdateResult } from "../orders/actions";
import type { OrderStatus } from "@/lib/types";
import { useT } from "@/i18n/I18nProvider";

interface StatusOption {
  id: number;
  slug: string;
  title: string;
}

interface TitleOption {
  id: number;
  slug: string;
  title: string;
}

export default function BulkUpdatePage() {
  const t = useT();
  const [rawIds, setRawIds] = useState("");
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([]);
  // Valeur du <select> = id du titre précis choisi (pas juste le slug).
  const [titleId, setTitleId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<BulkUpdateResult | null>(null);

  // Ne propose que les statuts/titres définis dans l'onglet « Gestion des statuts ».
  useEffect(() => {
    (async () => {
      const [statusesRes, titlesRes] = await Promise.all([
        fetch("/api/admin/statuses", { cache: "no-store" }),
        fetch("/api/admin/statuses/titles", { cache: "no-store" }),
      ]);
      if (statusesRes.ok) setStatusOptions((await statusesRes.json()).statuses || []);
      if (titlesRes.ok) {
        const options: TitleOption[] = (await titlesRes.json()).titles || [];
        setTitleOptions(options);
        setTitleId((current) => current || String(options[0]?.id ?? ""));
      }
    })();
  }, []);

  const selectedTitle = titleOptions.find((o) => String(o.id) === titleId);
  // Libellé affiché dans les messages de résultat : le titre précis choisi.
  const chosenLabel = selectedTitle?.title ?? "";

  // Accepte les IDs séparés par retour à la ligne, virgule, point-virgule ou espace.
  const ids = useMemo(
    () => rawIds.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean),
    [rawIds]
  );

  const handleSubmit = async () => {
    if (ids.length === 0 || !selectedTitle) return;
    setIsSaving(true);
    setResult(null);
    try {
      const res = await bulkChangeStatus(ids, selectedTitle.slug as OrderStatus, selectedTitle.id);
      setResult(res);
      if (res.updated.length > 0 && res.notFound.length === 0) setRawIds("");
    } finally {
      setIsSaving(false);
    }
  };

  // Groupe les titres par slug, dans l'ordre des statuts (pour l'affichage en <optgroup>).
  const titlesBySlug = useMemo(() => {
    const map = new Map<string, TitleOption[]>();
    for (const to of titleOptions) {
      const list = map.get(to.slug) ?? [];
      list.push(to);
      map.set(to.slug, list);
    }
    return map;
  }, [titleOptions]);

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
            value={titleId}
            onChange={(e) => setTitleId(e.target.value)}
            className="input w-full max-w-xs"
          >
            {statusOptions.map((s) => (
              <optgroup key={s.slug} label={s.title}>
                {(titlesBySlug.get(s.slug) ?? []).map((to) => (
                  <option key={to.id} value={to.id}>
                    {to.title}
                  </option>
                ))}
              </optgroup>
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
            {result.updated.length > 1 ? t("adm.bulk.updatedToward") : t("adm.bulk.updatedTowardSingular")} «&nbsp;{chosenLabel}&nbsp;».
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
          {result.alreadyInStatus.length > 0 && (
            <div className="alert alert-warning space-y-1">
              <div>
                {result.alreadyInStatus.length}{" "}
                {result.alreadyInStatus.length > 1 ? t("adm.bulk.orderPlural") : t("adm.bulk.orderSingular")}{" "}
                {result.alreadyInStatus.length > 1 ? t("adm.bulk.alreadyAtStatusPlural") : t("adm.bulk.alreadyAtStatus")} «&nbsp;{chosenLabel}&nbsp;» :
              </div>
              {result.alreadyInStatus.map((id) => (
                <div key={id} className="text-xs">
                  {t("adm.orders.phOrderId")} <span className="font-mono">{id}</span>{" "}
                  {t("adm.bulk.alreadyAtStatus")} «&nbsp;{chosenLabel}&nbsp;».
                </div>
              ))}
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
