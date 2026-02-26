"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Colors from "@/shared/theme/colors";
import { SearchIcon } from "./icons/SearchIcon";
import { PlusIcon } from "./icons/PlusIcon";
import { DataTableProps } from "./types/datatable.types";
import { MobileCardComponent } from "./ui/mobile/MobileCardComponent";
import { ActionButtonsComponent } from "./ui/ActionButtonsComponent";
import { ActionButtonComponent } from "./ui/ActionButtonComponent";
import { CreateButtonComponent } from "./ui/CreateButtonComponent";
import { OptimizedTdComponent } from "./ui/OptimizedTdComponent";
import { PaginationComponent } from "./ui/PaginationComponent";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

const ROW_HEIGHT = 60;
const VISIBLE_ROWS = 10;
const ACTIONS_COL_WIDTH = "230px";

/* ================================
 * SKELETONS (GENERALES)
 * ================================ */
function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 rounded ${className}`}
      style={style}
    />
  );
}

function SkeletonText({ w = "70%" }: { w?: string }) {
  return <SkeletonBlock className="h-3" style={{ width: w }} />;
}

function Th({
  children,
  className = "",
  width,
}: {
  children: React.ReactNode;
  className?: string;
  width?: string;
}) {
  return (
    <th
      className={`px-2 sm:px-4 py-3 font-semibold text-xs sm:text-sm whitespace-pre-line break-words text-center align-middle ${className}`}
      style={{ width }}
    >
      {children}
    </th>
  );
}

const OptimizedTd = React.memo(OptimizedTdComponent);
export const ActionButton = React.memo(ActionButtonComponent);
export const ActionButtons = React.memo(ActionButtonsComponent);
const MobileCard = React.memo(MobileCardComponent) as typeof MobileCardComponent;
const CreateButton = React.memo(CreateButtonComponent);
const Pagination = React.memo(PaginationComponent);

const DataTableComponent = <T extends { [key: string]: any }>(
  props: DataTableProps<T> & { module: string }
) => {
  const {
    data,
    columns,
    pageSize: defaultPageSize = 8,
    searchableKeys = [],
    onView,
    onEdit,
    onDelete,
    onCancel,
    onCheck,
    onApprove,
    onCreate,
    searchPlaceholder = "Buscar…",
    createButtonText = "Crear",
    rightActions,
    renderActions,
    renderExtraActions,
    tailHeader,
    renderTail,
    mobileCardView = true,
    module,
    actionGuard,
    freeze,
    disableInternalScroll = false,

    // loading general
    loading = false,
  } = props;

  const { canView, canCreate, canUpdate, canDelete } = usePermissions();

  const [q, setQ] = useState("");
  const [pageSizeOption, setPageSizeOption] = useState<string | number>("");
  const [pageSize, setPageSize] = useState<number>(5);
  const [page, setPage] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Si quieres respetar defaultPageSize, descomenta:
    // setPageSize(defaultPageSize);
    // setPageSizeOption(defaultPageSize);
    // setPage(1);
  }, [defaultPageSize]);

  const normalizeText = useCallback((value: unknown): string => {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }, []);

  const toDigits = useCallback((v: unknown) => {
    return String(v ?? "").replace(/[^\d]/g, "");
  }, []);

  const moneyTokens = useCallback(
    (value: unknown): string[] => {
      const n = Number(value);
      if (!Number.isFinite(n)) return [];
      const rounded = Math.round(n);

      const plain = String(rounded);
      const esCO = rounded.toLocaleString("es-CO");
      const enUS = rounded.toLocaleString("en-US");
      const cop = rounded.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      });

      return [plain, esCO, enUS, cop].map(normalizeText);
    },
    [normalizeText]
  );

  const estadoTokens = useCallback(
    (estado: unknown): string[] => {
      const raw = normalizeText(estado);
      if (!raw) return [];

      if (raw.includes("garantiareportada") || raw.includes("garantia_reportada")) {
        return [
          "garantia reportada",
          "garantia (reportada)",
          "garantia",
          "garantiareportada",
          "reportada",
        ].map(normalizeText);
      }

      if (raw.includes("garantia")) {
        return ["garantia", "en garantia", "garantia sin reporte"].map(normalizeText);
      }

      if (raw.includes("anul") || raw.includes("cancel") || raw.includes("revoke")) {
        return ["anulada", "anulado", "cancelada", "cancelado", "revocada", "revoke"].map(normalizeText);
      }

      if (raw.includes("aprob") || raw.includes("approved")) {
        return ["aprobada", "aprobado", "approved"].map(normalizeText);
      }

      if (raw.includes("pend")) {
        return ["pendiente", "pendient"].map(normalizeText);
      }

      return [raw];
    },
    [normalizeText]
  );

  const normalize = useCallback(
    (value: unknown, key?: string): string[] => {
      if (value == null) return [];

      if (key === "estado") return estadoTokens(value);

      if (key === "state") {
        const stateName =
          typeof value === "string"
            ? normalizeText(value)
            : normalizeText((value as any)?.name ?? "");

        const mapped =
          stateName === "approved"
            ? "aprobado"
            : stateName === "revoke"
            ? "anulado"
            : stateName;

        return estadoTokens(mapped).concat([mapped]).map(normalizeText);
      }

      if (key === "monto" || key === "viaticos" || key === "total") {
        return moneyTokens(value);
      }

      const str = normalizeText(value);

      const numericCandidate = str.replace(/\s/g, "");
      const cleaned = numericCandidate.replace(/[^0-9.-]/g, "");
      if (cleaned && !isNaN(Number(cleaned))) {
        return Array.from(new Set([str, cleaned, ...moneyTokens(Number(cleaned))].map(normalizeText)));
      }

      if (!isNaN(Date.parse(String(value)))) {
        const d = new Date(String(value));
        return [
          d.toISOString().slice(0, 10),
          d.toLocaleDateString("es-CO"),
          d.toLocaleDateString("es-ES"),
          d.getFullYear().toString(),
        ].map(normalizeText);
      }

      return [str];
    },
    [estadoTokens, moneyTokens, normalizeText]
  );

  const filtered = useMemo(() => {
    // Mientras carga, no filtrar (evita parpadeos y costo)
    if (loading) return Array.isArray(data) ? data : [];

    const term = normalizeText(q);
    if (!term) return data;

    const tokens = term.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return data;

    const isExactStatus = term === "activo" || term === "inactivo";

    const hasKey = (k: string) => searchableKeys.includes(k as any);

    const pickStatusText = (row: any): string => {
      if (hasKey("status") && row?.status != null) return normalizeText(row.status);
      if (hasKey("estado") && row?.estado != null) return normalizeText(row.estado);
      if (hasKey("state")) {
        if (typeof row?.state === "string") return normalizeText(row.state);
        if (row?.state?.name != null) return normalizeText(row.state.name);
      }
      if (hasKey("stateSearch") && row?.stateSearch != null) return normalizeText(row.stateSearch);
      if (hasKey("statusSearch") && row?.statusSearch != null) return normalizeText(row.statusSearch);
      return "";
    };

    return (Array.isArray(data) ? data : []).filter((row) => {
      if (isExactStatus) {
        const st = pickStatusText(row);
        if (!st) return false;
        return st === term;
      }

      return tokens.every((t) => {
        return searchableKeys.some((key) => {
          const value = (row as any)[key];
          if (value == null) return false;

          if (String(key) === "stateSearch" || String(key) === "statusSearch") {
            const v = normalizeText(value);
            if (t.startsWith("act")) return v === "activo";
            if (t.startsWith("ina")) return v === "inactivo";
            return v.includes(t);
          }

          const normValues = normalize(value, String(key));
          return normValues.some((nv) => nv.includes(t));
        });
      });
    });
  }, [q, data, searchableKeys, normalize, normalizeText, loading]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length, pageSize]
  );

  const current = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  const goTo = useCallback(
    (p: number) => setPage(Math.min(Math.max(p, 1), totalPages)),
    [totalPages]
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const currentScrollTop = e.currentTarget.scrollTop;
      if (Math.abs(currentScrollTop - scrollTop) > 1) {
        setScrollTop(currentScrollTop);
      }
    },
    [scrollTop]
  );

  const startIndex = Math.floor(scrollTop / ROW_HEIGHT);

  const visibleRows = useMemo(() => {
    if (disableInternalScroll) return current;
    return current.slice(startIndex, startIndex + VISIBLE_ROWS);
  }, [current, startIndex, disableInternalScroll]);

  const resolveRowKey = useCallback((row: T, idxFallback: number) => {
    const anyRow = row as any;
    return anyRow.id ?? anyRow.purchaseorderid ?? anyRow.numberoforder ?? anyRow.reference ?? idxFallback;
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter((col) => col.priority === "high" || (!col.priority && columns.indexOf(col) < 3)),
    [columns]
  );

  const tableStyle = useMemo(() => {
    return freeze ? { animation: "none" } : {};
  }, [freeze]);

  const showActionsColumn =
    canView(module) ||
    canUpdate(module) ||
    canDelete(module) ||
    onCancel ||
    onCheck ||
    onApprove ||
    renderActions;

  const Row = useMemo(() => {
    const RowComponent = React.memo(({ row, index }: { row: T; index: number }) => {
      const currentStartIndex = disableInternalScroll ? 0 : Math.floor(scrollTop / ROW_HEIGHT);
      const isDesktop = typeof window !== "undefined" ? window.innerWidth >= 768 : true;
      const colsToRender = isDesktop ? columns : visibleColumns;

      return (
        <tr
          className="hover:bg-gray-50 text-center table-row transition-all duration-300 ease-in-out"
          style={
            disableInternalScroll
              ? { width: "100%", height: `${ROW_HEIGHT}px` }
              : { top: `${(currentStartIndex + index) * ROW_HEIGHT}px`, width: "100%", height: `${ROW_HEIGHT}px` }
          }
        >
          {colsToRender.map((c, colIndex) => (
            <OptimizedTd
              key={String(c.key)}
              colIndex={colIndex}
              header={String(c.header ?? "")}
              width={c.width}
              className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
            >
              <div className="truncate" title={String((row as any)[c.key])}>
                {c.render ? c.render(row) : String((row as any)[c.key])}
              </div>
            </OptimizedTd>
          ))}

          {showActionsColumn && (
            <OptimizedTd header="Acciones" width={ACTIONS_COL_WIDTH} className="min-w-[230px] whitespace-nowrap">
              {renderActions ? (
                renderActions(row)
              ) : (
                <ActionButtons
                  row={row}
                  onView={canView(module) ? onView : undefined}
                  onEdit={canUpdate(module) ? onEdit : undefined}
                  onDelete={canDelete(module) ? onDelete : undefined}
                  onCancel={onCancel}
                  onCheck={onCheck}
                  onApprove={onApprove}
                  actionGuard={actionGuard}
                  renderExtraActions={renderExtraActions}
                />
              )}
            </OptimizedTd>
          )}

          {renderTail && (
            <OptimizedTd header={tailHeader ?? "Imprimir"} className="text-center">
              {renderTail(row)}
            </OptimizedTd>
          )}
        </tr>
      );
    });

    RowComponent.displayName = "RowComponent";
    return RowComponent;
  }, [
    columns,
    visibleColumns,
    onView,
    onEdit,
    onDelete,
    onCancel,
    onCheck,
    onApprove,
    renderActions,
    renderExtraActions,
    renderTail,
    tailHeader,
    actionGuard,
    canView,
    canUpdate,
    canDelete,
    module,
    scrollTop,
    showActionsColumn,
    disableInternalScroll,
  ]);

  /* ================================
   * SKELETON HELPERS
   * ================================ */
  const desktopSkeletonRowsCount = useMemo(() => {
    // usa el pageSize actual si ya se seteo, si no, cae al default
    const n = Number(pageSize || defaultPageSize || 8);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 12) : 8;
  }, [pageSize, defaultPageSize]);

  const DesktopTableSkeleton = () => (
    <div
      className={`${mobileCardView ? "hidden md:block" : "block"} overflow-x-auto`}
      style={tableStyle}
    >
      <div className={disableInternalScroll ? "" : "max-h-[600px] overflow-y-auto"} style={freeze ? { overflowY: "hidden" } : {}}>
        <table className="min-w-full w-full text-sm table-fixed border-collapse">
          <thead className="bg-gray-50 text-gray-700 sticky top-0 z-10" style={{ backgroundColor: Colors.table.header }}>
            <tr className="text-center table-row">
              {columns.map((c) => (
                <Th key={String(c.key)} width={c.width}>
                  {c.header}
                </Th>
              ))}
              {showActionsColumn && <Th width={ACTIONS_COL_WIDTH}>Acciones</Th>}
              {renderTail && <Th className="text-center">{tailHeader ?? "Imprimir"}</Th>}
            </tr>
          </thead>

          <tbody className="divide divide-[#E6E6E6]">
            {Array.from({ length: desktopSkeletonRowsCount }).map((_, rIdx) => (
              <tr key={`sk-row-${rIdx}`} className="text-center" style={{ height: `${ROW_HEIGHT}px` }}>
                {columns.map((c) => (
                  <td key={`sk-${rIdx}-${String(c.key)}`} className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex justify-center">
                      <SkeletonText w={c.width ? "80%" : "70%"} />
                    </div>
                  </td>
                ))}
                {showActionsColumn && (
                  <td className="px-2 sm:px-4 py-2 sm:py-3 min-w-[230px]">
                    <div className="flex items-center justify-center gap-2">
                      <SkeletonBlock className="h-8 w-8 rounded-md" />
                      <SkeletonBlock className="h-8 w-8 rounded-md" />
                      <SkeletonBlock className="h-8 w-8 rounded-md" />
                    </div>
                  </td>
                )}
                {renderTail && (
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex justify-center">
                      <SkeletonText w="50%" />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const MobileCardsSkeleton = () => (
    <div className="md:hidden">
      <div className={`p-3 space-y-3 ${disableInternalScroll ? "" : "max-h-[600px] overflow-y-auto"}`}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={`sk-card-${idx}`} className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-[70%]" />
                <SkeletonBlock className="h-3 w-[55%]" />
                <SkeletonBlock className="h-3 w-[45%]" />
              </div>
              <div className="flex gap-2">
                <SkeletonBlock className="h-8 w-8 rounded-md" />
                <SkeletonBlock className="h-8 w-8 rounded-md" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-3 w-[80%]" />
              <SkeletonBlock className="h-3 w-[70%]" />
              <SkeletonBlock className="h-3 w-[75%]" />
              <SkeletonBlock className="h-3 w-[60%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 sm:gap-4 px-2 sm:px-0 mt-4 sm:mt-6" style={tableStyle}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {searchableKeys.length > 0 && (
          <div className="flex items-center gap-3 w-full sm:max-w-lg">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-full bg-white px-9 py-2 text-sm shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSizeOption}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setPageSizeOption("");
                    setPageSize(5);
                  } else {
                    const num = Number(value);
                    setPageSizeOption(num);
                    setPageSize(num);
                  }
                  setPage(1);
                }}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-red-400"
              >
                <option value="">Mostrar</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}

        {(rightActions || onCreate) && (
          <div className="flex items-center gap-2 justify-end">
            {rightActions}
            {onCreate && canCreate(module) && (
              <div className="hidden md:block">
                <CreateButton onCreate={onCreate} createButtonText={createButtonText} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={tableStyle}>
        {/*  LOADING: Skeletons */}
        {loading ? (
          <>
            {mobileCardView && <MobileCardsSkeleton />}
            <DesktopTableSkeleton />
          </>
        ) : (
          <>
            {mobileCardView && (
              <div className="md:hidden">
                <div className={`p-3 space-y-3 ${disableInternalScroll ? "" : "max-h-[600px] overflow-y-auto"}`}>
                  {current.map((row, idx) => (
                    <MobileCard
                      key={resolveRowKey(row, idx)}
                      row={row}
                      columns={columns}
                      onView={canView(module) ? onView : undefined}
                      onEdit={canUpdate(module) ? onEdit : undefined}
                      onDelete={canDelete(module) ? onDelete : undefined}
                      onCancel={onCancel}
                      onCheck={onCheck}
                      actionGuard={actionGuard}
                      renderActions={renderActions}
                      renderExtraActions={renderExtraActions}
                      renderTail={renderTail}
                      tailHeader={tailHeader}
                    />
                  ))}

                  {current.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No se encontraron resultados</div>
                  )}
                </div>
              </div>
            )}

            <div className={`${mobileCardView ? "hidden md:block" : "block"} overflow-x-auto`} style={tableStyle}>
              <div
                className={disableInternalScroll ? "" : "max-h-[600px] overflow-y-auto"}
                onScroll={disableInternalScroll ? undefined : handleScroll}
                style={freeze ? { overflowY: "hidden" } : {}}
              >
                <table className="min-w-full w-full text-sm table-fixed border-collapse">
                  <thead className="bg-gray-50 text-gray-700 sticky top-0 z-10" style={{ backgroundColor: Colors.table.header }}>
                    <tr className="text-center table-row">
                      {columns.map((c) => (
                        <Th key={String(c.key)} width={c.width}>
                          {c.header}
                        </Th>
                      ))}
                      {showActionsColumn && <Th width={ACTIONS_COL_WIDTH}>Acciones</Th>}
                      {renderTail && <Th className="text-center">{tailHeader ?? "Imprimir"}</Th>}
                    </tr>
                  </thead>

                  <tbody
                    className="divide divide-[#E6E6E6]"
                    style={
                      disableInternalScroll
                        ? undefined
                        : { position: "relative", height: `${current.length * ROW_HEIGHT}px` }
                    }
                  >
                    {visibleRows.map((row, index) => (
                      <Row
                        key={resolveRowKey(row, disableInternalScroll ? index : startIndex + index)}
                        row={row}
                        index={index}
                      />
                    ))}
                  </tbody>
                </table>

                {current.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No se encontraron resultados</div>
                )}
              </div>
            </div>

            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} goTo={goTo} />}
          </>
        )}
      </div>

      {onCreate && canCreate(module) && (
        <button
          className="fixed bottom-6 right-6 z-50 flex md:hidden items-center justify-center w-12 h-12 rounded-full shadow-lg text-white transition-transform hover:scale-105"
          style={{ background: Colors.buttons.primary }}
          onClick={onCreate}
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export const DataTable = React.memo(
  DataTableComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.columns === nextProps.columns &&
      prevProps.freeze === nextProps.freeze &&
      prevProps.onCreate === nextProps.onCreate &&
      prevProps.onView === nextProps.onView &&
      prevProps.onCancel === nextProps.onCancel &&
      prevProps.loading === nextProps.loading
    );
  }
) as typeof DataTableComponent;