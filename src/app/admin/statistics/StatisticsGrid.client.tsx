"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  LEAD_COLUMNS,
  STATUS_GROUPS,
  SUBCOLS,
  cellKey,
  type CellKind,
  type StatRow,
  type StatsResponse,
} from "./config";

const intFmt = new Intl.NumberFormat("fr-FR");
const moneyFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatCell(value: unknown, kind: CellKind | "text" | "int") {
  if (kind === "text") return String(value ?? "—");
  const n = Number(value ?? 0);
  if (kind === "pct") return `${intFmt.format(Math.round(n * 10) / 10)} %`;
  if (kind === "money") return moneyFmt.format(n);
  return intFmt.format(n); // int
}

const isNumeric = (kind: string) => kind === "int" || kind === "money" || kind === "pct";

type GroupByKey = "none" | "product" | "price" | "affiliateNetwork" | "affiliate";

// Options du sélecteur + colonne-dimension ciblée par chaque regroupement.
const GROUP_BY_OPTIONS: { value: GroupByKey; label: string; column: string }[] = [
  { value: "none", label: "Produit × Affilié", column: "product" },
  { value: "product", label: "Produit", column: "product" },
  { value: "price", label: "Prix", column: "price" },
  { value: "affiliateNetwork", label: "Affiliate network", column: "affiliateNetwork" },
  { value: "affiliate", label: "Affilié", column: "affiliate" },
];

interface ColMeta {
  kind: CellKind | "text" | "int";
  color?: string;
  frozen?: boolean;
  leading?: boolean;
}

export default function StatisticsGrid() {
  const [data, setData] = useState<StatRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sorting, setSorting] = useState<SortingState>([{ id: "totalOrders", desc: true }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // filtersDraft = saisie immédiate ; filters = version « debouncée » qui déclenche le fetch.
  const [filtersDraft, setFiltersDraft] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [groupBy, setGroupBy] = useState<GroupByKey>("none");

  const parentRef = useRef<HTMLDivElement>(null);

  // Anti-rebond : on n'interroge le serveur que 350 ms après la dernière frappe.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(filtersDraft);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [filtersDraft]);

  useEffect(() => {
    let cancelled = false;
    const sort = sorting[0];
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v && v.trim() !== "")
    );
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy: sort?.id ?? "totalOrders",
      sortDir: sort?.desc ? "desc" : "asc",
      groupBy,
    });
    if (Object.keys(activeFilters).length > 0) {
      params.set("filters", JSON.stringify(activeFilters));
    }
    setLoading(true);
    fetch(`/api/admin/statistics?${params}`, { cache: "no-store" })
      .then(async (r) => {
        const json = (await r.json()) as StatsResponse & { error?: string };
        if (!r.ok) throw new Error(json.error || "Erreur de chargement.");
        if (cancelled) return;
        setData(json.rows);
        setTotal(json.total);
        setError(null);
      })
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, sorting, filters, groupBy]);

  const columns = useMemo<ColumnDef<StatRow>[]>(() => {
    // La colonne ciblée par le regroupement passe en première position et figée.
    const firstKey = GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.column ?? "product";
    const orderedLead = [
      ...LEAD_COLUMNS.filter((c) => c.key === firstKey),
      ...LEAD_COLUMNS.filter((c) => c.key !== firstKey),
    ];

    const lead: ColumnDef<StatRow>[] = orderedLead.map((c) => ({
      id: c.key,
      accessorKey: c.key,
      header: c.label,
      size: c.key === "product" ? 220 : c.key === "affiliateNetwork" ? 170 : c.key === "totalOrders" ? 160 : 110,
      meta: { kind: c.kind, frozen: c.key === firstKey, leading: true } as ColMeta,
    }));

    const groups: ColumnDef<StatRow>[] = STATUS_GROUPS.map((g) => ({
      id: g.key,
      header: g.label,
      meta: { kind: "text", color: g.color } as ColMeta,
      columns: SUBCOLS.map((s) => ({
        id: cellKey(g.key, s.key),
        accessorKey: cellKey(g.key, s.key),
        header: s.label,
        size: s.key === "purchasingSum" ? 130 : s.key === "avgBill" ? 105 : s.key === "sum" ? 100 : 70,
        meta: { kind: s.kind, color: g.color } as ColMeta,
      })),
    }));

    return [...lead, ...groups];
  }, [groupBy]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1);
    },
    manualSorting: true,
    manualPagination: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 12,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const totalWidth = table.getTotalSize();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Style commun pour figer la colonne Product (gauche).
  const frozenStyle = (z: number): React.CSSProperties => ({
    position: "sticky",
    left: 0,
    zIndex: z,
  });

  return (
    <div className="card flex h-full flex-col gap-3 p-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Grouper par</span>
            <select
              value={groupBy}
              onChange={(e) => {
                setGroupBy(e.target.value as GroupByKey);
                setPage(1);
              }}
              className="input py-1"
            >
              {GROUP_BY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <span className="text-slate-500">
            {loading ? "Chargement…" : `${total} ligne${total > 1 ? "s" : ""}`}
            {error && <span className="ml-2 text-red-600">{error}</span>}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {Object.values(filtersDraft).some((v) => v && v.trim() !== "") && (
            <button
              type="button"
              onClick={() => {
                setFiltersDraft({});
                setFilters({});
                setPage(1);
              }}
              className="text-brand-600 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
          <label className="flex items-center gap-2">
            <span className="text-slate-500">Lignes / page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="input py-1"
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Conteneur scrollable : header fixe + colonne figée + scroll horizontal */}
      <div
        ref={parentRef}
        className="relative min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200"
      >
        <table style={{ display: "grid", width: totalWidth, minWidth: "100%" }} className="text-xs">
          <thead
            style={{ display: "grid", position: "sticky", top: 0, zIndex: 3 }}
            className="bg-slate-50"
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{ display: "flex", width: "100%" }}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColMeta | undefined;
                  const isGroup = header.subHeaders.length > 0;
                  const leading = meta?.leading;
                  const frozen = meta?.frozen;
                  const canSort = !isGroup && header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  // Pour une colonne de tête : on n'affiche le libellé qu'en haut
                  // (placeholder), et une cellule vide en bas.
                  const showLabel = isGroup || !leading || (leading && header.isPlaceholder);

                  return (
                    <th
                      key={header.id}
                      style={{
                        display: "flex",
                        width: header.getSize(),
                        backgroundColor: meta?.color,
                        ...(frozen ? frozenStyle(4) : {}),
                      }}
                      className={`relative items-center border-b border-r border-slate-200 px-2 py-1.5 font-semibold ${
                        frozen ? "bg-slate-50" : ""
                      } ${isGroup ? "justify-center text-slate-800" : "text-slate-600"} ${
                        isNumeric(meta?.kind ?? "text") && !isGroup ? "justify-end text-right" : ""
                      }`}
                    >
                      {showLabel && !header.isPlaceholder && !isGroup && canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex w-full items-center gap-1 hover:text-brand-600"
                          style={{ justifyContent: isNumeric(meta?.kind ?? "text") ? "flex-end" : "flex-start" }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-[10px]">{sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}</span>
                        </button>
                      ) : header.isPlaceholder && leading ? (
                        // libellé d'une colonne de tête affiché sur la rangée du haut
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex w-full items-center gap-1 hover:text-brand-600"
                        >
                          {String(header.column.columnDef.header ?? "")}
                          <span className="text-[10px]">{sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}</span>
                        </button>
                      ) : isGroup ? (
                        flexRender(header.column.columnDef.header, header.getContext())
                      ) : null}

                      {/* poignée de redimensionnement */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${
                            header.column.getIsResizing() ? "bg-brand-500" : "hover:bg-brand-300"
                          }`}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}

            {/* Ligne de filtres : un champ par colonne (toutes les colonnes). */}
            <tr style={{ display: "flex", width: "100%" }} className="bg-white">
              {(table.getHeaderGroups().at(-1)?.headers ?? []).map((header) => {
                const meta = header.column.columnDef.meta as ColMeta | undefined;
                const kind = meta?.kind ?? "text";
                const colId = header.column.id;
                const frozen = meta?.frozen;
                return (
                  <th
                    key={`f-${header.id}`}
                    style={{
                      display: "flex",
                      width: header.getSize(),
                      ...(frozen ? frozenStyle(4) : {}),
                    }}
                    className={`items-center border-b border-r border-slate-200 p-1 ${frozen ? "bg-white" : ""}`}
                  >
                    <input
                      value={filtersDraft[colId] ?? ""}
                      onChange={(e) =>
                        setFiltersDraft((prev) => ({ ...prev, [colId]: e.target.value }))
                      }
                      placeholder={kind === "text" ? "filtrer…" : "ex: >100"}
                      title={
                        kind === "text"
                          ? "Filtre texte (contient)"
                          : "Opérateurs : >100, >=50, <20, <=5, =5, plage 10-20 (nombre seul = au moins)"
                      }
                      className={`w-full rounded border border-slate-200 px-1.5 py-0.5 text-xs font-normal outline-none focus:border-brand-400 ${
                        kind === "text" ? "" : "text-right"
                      }`}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody style={{ display: "grid", height: totalSize, position: "relative" }}>
            {virtualRows.map((vRow) => {
              const row = rows[vRow.index];
              return (
                <tr
                  key={row.id}
                  data-index={vRow.index}
                  style={{
                    display: "flex",
                    position: "absolute",
                    transform: `translateY(${vRow.start}px)`,
                    width: "100%",
                  }}
                  className="border-b border-slate-100 hover:bg-brand-mist/40"
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as ColMeta | undefined;
                    const kind = meta?.kind ?? "text";
                    const numeric = isNumeric(kind);
                    const frozen = meta?.frozen;
                    return (
                      <td
                        key={cell.id}
                        style={{
                          display: "flex",
                          width: cell.column.getSize(),
                          ...(frozen ? frozenStyle(1) : {}),
                        }}
                        className={`items-center border-r border-slate-100 px-2 py-1.5 ${
                          numeric ? "justify-end text-right tabular-nums" : ""
                        } ${frozen ? "bg-white font-medium" : ""}`}
                      >
                        {formatCell(cell.getValue(), kind)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {!loading && rows.length === 0 && (
              <tr style={{ display: "flex" }}>
                <td className="px-3 py-6 text-center text-slate-500">Aucune donnée.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination côté serveur */}
      <div className="flex shrink-0 items-center justify-between text-sm">
        <span className="text-slate-500">
          Page {page} / {pageCount}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="btn btn-secondary py-1 disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount || loading}
            className="btn btn-secondary py-1 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
