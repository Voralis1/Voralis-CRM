"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  LEAD_COLUMNS,
  STATUS_GROUPS,
  SUBCOLS,
  cellKey,
  type CellKind,
  type StatRow,
  type StatsResponse,
} from "./config";
import { useT } from "@/i18n/I18nProvider";

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
// labelKey -> clé de traduction du libellé affiché.
const GROUP_BY_OPTIONS: { value: GroupByKey; labelKey: string; column: string }[] = [
  { value: "none", labelKey: "adm.statistics.groupProductAffiliate", column: "product" },
  { value: "product", labelKey: "adm.statistics.groupProduct", column: "product" },
  { value: "price", labelKey: "adm.statistics.groupPrice", column: "price" },
  { value: "affiliateNetwork", labelKey: "adm.statistics.groupNetwork", column: "affiliateNetwork" },
  { value: "affiliate", labelKey: "adm.statistics.groupAffiliate", column: "affiliate" },
];

interface ColMeta {
  kind: CellKind | "text" | "int";
  color?: string;
  frozen?: boolean;
  leading?: boolean;
}

export default function StatisticsGrid() {
  const t = useT();
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
        if (!r.ok) throw new Error(json.error || t("adm.statistics.errLoad"));
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
  const totalWidth = table.getTotalSize();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Style commun pour figer la colonne Product (gauche).
  const frozenStyle = (z: number): React.CSSProperties => ({
    position: "sticky",
    left: 0,
    zIndex: z,
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="font-medium text-ink-muted">{t("adm.statistics.groupBy")}</span>
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
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <span className="text-ink-muted">
            {loading ? t("adm.statistics.loading") : `${total} ${total > 1 ? t("adm.statistics.rowPlural") : t("adm.statistics.rowSingular")}`}
            {error && <span className="ml-2 text-danger">{error}</span>}
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
              className="text-accent hover:underline"
            >
              {t("adm.statistics.resetFilters")}
            </button>
          )}
          <label className="flex items-center gap-2">
            <span className="text-ink-muted">{t("adm.statistics.rowsPerPage")}</span>
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

      {/* Scroll horizontal au niveau du tableau ; le scroll vertical reste au
          niveau de la page (le conteneur n'a pas de hauteur fixe). La colonne
          Product reste figée pendant le défilement horizontal. */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table style={{ display: "grid", width: totalWidth, minWidth: "100%" }} className="text-xs">
          <thead
            style={{ display: "grid", position: "sticky", top: 0, zIndex: 3 }}
            className="bg-elevated"
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
                      className={`relative items-center border-b border-r border-line px-2 py-1.5 font-semibold ${
                        frozen ? "bg-elevated" : ""
                      } ${isGroup ? "justify-center text-ink" : "text-ink-muted"} ${
                        isNumeric(meta?.kind ?? "text") && !isGroup ? "justify-end text-right" : ""
                      }`}
                    >
                      {showLabel && !header.isPlaceholder && !isGroup && canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex w-full items-center gap-1 hover:text-accent"
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
                          className="flex w-full items-center gap-1 hover:text-accent"
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
                            header.column.getIsResizing() ? "bg-accent" : "hover:bg-hovered"
                          }`}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}

            {/* Ligne de filtres : un champ par colonne (toutes les colonnes). */}
            <tr style={{ display: "flex", width: "100%" }} className="bg-surface">
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
                    className={`items-center border-b border-r border-line p-1 ${frozen ? "bg-surface" : ""}`}
                  >
                    <input
                      value={filtersDraft[colId] ?? ""}
                      onChange={(e) =>
                        setFiltersDraft((prev) => ({ ...prev, [colId]: e.target.value }))
                      }
                      placeholder={kind === "text" ? t("adm.statistics.phFilterText") : t("adm.statistics.phFilterNumber")}
                      title={
                        kind === "text"
                          ? t("adm.statistics.titleFilterText")
                          : t("adm.statistics.titleFilterNumber")
                      }
                      className={`w-full rounded border border-line-strong bg-surface px-1.5 py-0.5 text-xs font-normal outline-none ${
                        kind === "text" ? "" : "text-right"
                      }`}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody style={{ display: "grid" }}>
            {rows.map((row) => {
              return (
                <tr
                  key={row.id}
                  style={{ display: "flex", width: "100%" }}
                  className="border-b border-line row-hover"
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
                        className={`items-center border-r border-line px-2 py-1.5 ${
                          numeric ? "justify-end text-right tabular-nums" : ""
                        } ${frozen ? "bg-surface font-medium" : ""}`}
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
                <td className="px-3 py-6 text-center text-ink-muted">{t("adm.statistics.empty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination côté serveur */}
      <div className="flex shrink-0 items-center justify-between text-sm">
        <span className="text-ink-muted">
          {t("adm.statistics.page")} {page} / {pageCount}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="btn btn-secondary py-1 disabled:opacity-40"
          >
            {t("adm.statistics.previous")}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount || loading}
            className="btn btn-secondary py-1 disabled:opacity-40"
          >
            {t("adm.statistics.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
