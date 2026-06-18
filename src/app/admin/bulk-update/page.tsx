"use client";

import { useMemo, useState } from "react";
import { bulkChangeStatus, type BulkUpdateResult } from "../orders/actions";
import { ALL_STATUSES, STATUS_META, type OrderStatus } from "@/lib/types";

export default function BulkUpdatePage() {
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
        <h1 className="text-2xl font-bold">Mise à jour</h1>
        <p className="text-sm text-slate-500">
          Mettez à jour le statut de plusieurs commandes à la fois en saisissant leurs identifiants.
        </p>
      </div>

      <div className="card space-y-4 p-6">
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Identifiants des commandes</span>
          <textarea
            value={rawIds}
            onChange={(e) => setRawIds(e.target.value)}
            rows={8}
            className="input w-full font-mono text-sm"
            placeholder={"000001\n000002\n000003"}
          />
          <span className="text-xs text-slate-500">
            Un identifiant par ligne (ou séparés par des virgules / espaces). {ids.length} commande
            {ids.length > 1 ? "s" : ""} détectée{ids.length > 1 ? "s" : ""}.
          </span>
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-medium">Nouveau statut</span>
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
            {isSaving ? "Mise à jour…" : `Mettre à jour ${ids.length || ""} commande${ids.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>

      {result && (
        <div className="card space-y-3 p-6">
          <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            {result.updated.length} commande{result.updated.length > 1 ? "s" : ""} mise
            {result.updated.length > 1 ? "s" : ""} à jour vers «&nbsp;{STATUS_META[status].label}&nbsp;».
          </div>
          {result.updated.length > 0 && (
            <div className="text-xs font-mono text-slate-500">{result.updated.join(", ")}</div>
          )}
          {result.failed.length > 0 && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {result.failed.length} échec{result.failed.length > 1 ? "s" : ""} :{" "}
              <span className="font-mono">{result.failed.join(", ")}</span>
              {result.error && <div className="mt-1 text-xs">{result.error}</div>}
            </div>
          )}
          {result.notFound.length > 0 && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {result.notFound.length} identifiant{result.notFound.length > 1 ? "s" : ""} introuvable
              {result.notFound.length > 1 ? "s" : ""} :{" "}
              <span className="font-mono">{result.notFound.join(", ")}</span>
            </div>
          )}
          {result.error && result.failed.length === 0 && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
