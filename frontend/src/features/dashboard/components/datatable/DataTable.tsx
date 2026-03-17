"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import Colors from "@/shared/theme/colors";
import { SearchIcon } from "./icons/SearchIcon";
import { PlusIcon } from "./icons/PlusIcon";
import { DataTableProps, DataTableFilters, DateFilter } from "./types/datatable.types";
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SERVER_SEARCH_DEBOUNCE_MS = 300;

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
export const ActionButtons = React.memo(
  ActionButtonsComponent
) as typeof ActionButtonsComponent;
const MobileCard = React.memo(MobileCardComponent) as typeof MobileCardComponent;
const CreateButton = React.memo(CreateButtonComponent);
const Pagination = React.memo(PaginationComponent);

type RowWithOptionalName = {
  name?: unknown;
};

const DataTableComponent = <T extends object>(
  props: DataTableProps<T> & { module: string }
) => {
  const {
    data,
    columns,
    pageSize: defaultPageSize = 8,
    showPageSizeSelector = true,
    serverPagination,
    serverSearch,
    serverFilters,
    statusFilterOptions,
    dateFilterField,
    searchableKeys = [],
    onView,
    onEdit,
    onDelete,
    onCancel,
    onCheck,
    onApprove,
    onCreate,
    searchPlaceholder = "Buscar ventas",
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
  const [searchInput, setSearchInput] = useState("");
  
  // Estados para filtros avanzados
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateFilter>({ startDate: null, endDate: null });
  
  // Sincronizar filtros externos con estados internos
  useEffect(() => {
    if (serverFilters?.filters) {
      if (serverFilters.filters.status !== undefined) {
        setStatusFilter(serverFilters.filters.status ?? "");
      }
      if (serverFilters.filters.dateRange) {
        setDateRange(serverFilters.filters.dateRange);
      }
    }
  }, [serverFilters?.filters]);
  
  // Callback para manejar cambios en filtros
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    const newFilters: DataTableFilters = {
      ...(serverFilters?.filters || {}),
      status: value || null,
      dateRange,
    };
    serverFilters?.onFilterChange(newFilters);
  }, [serverFilters, dateRange]);
  
  const handleDateFilterChange = useCallback((newDateRange: DateFilter) => {
    setDateRange(newDateRange);
    const newFilters: DataTableFilters = {
      ...(serverFilters?.filters || {}),
      status: statusFilter || null,
      dateRange: newDateRange,
    };
    serverFilters?.onFilterChange(newFilters);
  }, [serverFilters, statusFilter]);
  
  const handleClearFilters = useCallback(() => {
    setStatusFilter("");
    setDateRange({ startDate: null, endDate: null });
    serverFilters?.onFilterChange({ status: null, dateRange: { startDate: null, endDate: null } });
  }, [serverFilters]);
  
  const hasActiveFilters = statusFilter || dateRange.startDate || dateRange.endDate;
  const initialPageSize = Math.max(1, Number(defaultPageSize || 8));
  const [pageSizeOption, setPageSizeOption] = useState<string | number>(initialPageSize);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const [page, setPage] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);
  const [animateCells, setAnimateCells] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768
  );

  const isMounted = useRef(false);
  const isServerPagination = Boolean(serverPagination);
  const isServerSearch = Boolean(serverSearch);
  const toRowRecord = useCallback(
    (row: T): Record<string, unknown> => row as Record<string, unknown>,
    []
  );
  const getRowValue = useCallback(
    <K extends keyof T>(row: T, key: K): T[K] => toRowRecord(row)[String(key)] as T[K],
    [toRowRecord]
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      setAnimateCells(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const nextPageSize = Math.max(1, Number(defaultPageSize || 8));
    if (isServerPagination) return;
    setPageSize(nextPageSize);
    setPageSizeOption(nextPageSize);
    setPage(1);
  }, [defaultPageSize, isServerPagination]);

  useEffect(() => {
    if (!isServerPagination || !serverPagination) return;
    const nextLimit = Math.max(1, Number(serverPagination.limit || defaultPageSize || 8));
    setPageSize(nextLimit);
    setPageSizeOption(nextLimit);
  }, [defaultPageSize, isServerPagination, serverPagination]);



  useEffect(() => {
    if (loading) {
      setAnimateCells(true);
      return;
    }
    const timer = setTimeout(() => setAnimateCells(false), 450);
    return () => clearTimeout(timer);
  }, [loading, pageSize, page]);

  const normalizeText = useCallback((value: unknown): string => {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
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
            : normalizeText((value as RowWithOptionalName | null)?.name ?? "");

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
    if (isServerSearch) return Array.isArray(data) ? data : [];

    const term = normalizeText(q);
    if (!term) return data;

    const isExactStatus = term === "activo" || term === "inactivo";

    const hasKey = (k: string) =>
      searchableKeys.some((searchableKey) => String(searchableKey) === k);

    const pickStatusText = (row: T): string => {
      const status = hasKey("status") ? getRowValue(row, "status" as keyof T) : undefined;
      if (status != null) return normalizeText(status);

      const estado = hasKey("estado") ? getRowValue(row, "estado" as keyof T) : undefined;
      if (estado != null) return normalizeText(estado);

      if (hasKey("state")) {
        const state = getRowValue(row, "state" as keyof T);
        if (typeof state === "string") return normalizeText(state);
        if ((state as RowWithOptionalName | null)?.name != null) {
          return normalizeText((state as RowWithOptionalName).name);
        }
      }

      const stateSearch = hasKey("stateSearch")
        ? getRowValue(row, "stateSearch" as keyof T)
        : undefined;
      if (stateSearch != null) return normalizeText(stateSearch);

      const statusSearch = hasKey("statusSearch")
        ? getRowValue(row, "statusSearch" as keyof T)
        : undefined;
      if (statusSearch != null) return normalizeText(statusSearch);

      return "";
    };

    const tokens = term.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return data;

    return (Array.isArray(data) ? data : []).filter((row) => {
      if (isExactStatus) {
        const st = pickStatusText(row);
        if (!st) return false;
        return st === term;
      }

      return tokens.every((t) => {
        return searchableKeys.some((key) => {
          const value = getRowValue(row, key);
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
  }, [q, data, searchableKeys, normalize, normalizeText, loading, isServerSearch, getRowValue]);

  const totalPages = useMemo(() => {
    if (isServerPagination) {
      return Math.max(1, serverPagination?.totalPages ?? 1);
    }
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  }, [filtered.length, isServerPagination, pageSize, serverPagination?.totalPages]);

  const current = useMemo(() => {
    if (isServerPagination) {
      return filtered;
    }
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, isServerPagination, page, pageSize]);

  const goTo = useCallback(
    (p: number) => {
      setAnimateCells(true);
      const nextPage = Math.min(Math.max(p, 1), totalPages);
      if (isServerPagination && serverPagination) {
        serverPagination.onPageChange(nextPage);
        return;
      }
      setPage(nextPage);
    },
    [isServerPagination, serverPagination, totalPages]
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

  const resolveRowKey = useCallback((row: T, idxFallback: number): React.Key => {
    const candidates = [
      getRowValue(row, "id" as keyof T),
      getRowValue(row, "purchaseorderid" as keyof T),
      getRowValue(row, "numberoforder" as keyof T),
      getRowValue(row, "reference" as keyof T),
    ];
    const candidate = candidates.find((value) =>
      typeof value === "string" || typeof value === "number"
    );
    return typeof candidate === "string" || typeof candidate === "number"
      ? candidate
      : idxFallback;
  }, [getRowValue]);

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
              animateOnMount={animateCells}
              className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
            >
              <div className="truncate" title={String(getRowValue(row, c.key))}>
                {c.render ? c.render(row) : String(getRowValue(row, c.key))}
              </div>
            </OptimizedTd>
          ))}

          {showActionsColumn && (
            <OptimizedTd
              header="Acciones"
              width={ACTIONS_COL_WIDTH}
              animateOnMount={animateCells}
              className="min-w-[230px] whitespace-nowrap"
            >
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
            <OptimizedTd
              header={tailHeader ?? "Imprimir"}
              animateOnMount={animateCells}
              className="text-center"
            >
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
    isDesktop,
    animateCells,
    getRowValue,
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
      {/* Barra de filtros avanzados */}
      {(statusFilterOptions || dateFilterField) && (
        <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-lg">
          {/* Filtro de estado */}
          {statusFilterOptions && statusFilterOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Estado:</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
              >
                <option value="">Todos</option>
                {statusFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de fecha */}
          {dateFilterField && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Fecha:</label>
              <input
                type="date"
                value={dateRange.startDate || ""}
                onChange={(e) => handleDateFilterChange({ ...dateRange, startDate: e.target.value || null })}
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                placeholder="Desde"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateRange.endDate || ""}
                onChange={(e) => handleDateFilterChange({ ...dateRange, endDate: e.target.value || null })}
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                placeholder="Hasta"
              />
            </div>
          )}

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-red-600 hover:text-red-800 hover:underline ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {searchableKeys.length > 0 && (
          <div className="flex items-center gap-3 w-full sm:max-w-lg">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                value={isServerSearch ? (serverSearch?.value ?? "") : searchInput}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setAnimateCells(true);
                  if (isServerSearch && serverSearch) {
                    serverSearch.onChange(nextValue);
                  } else {
                    setSearchInput(nextValue);
                    if (isServerPagination && serverPagination) {
                      serverPagination.onPageChange(1);
                    } else {
                      setPage(1);
                    }
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-full bg-white px-9 py-2 text-sm shadow-sm border border-gray-200 transition-colors hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
              />
            </div>

            {showPageSizeSelector && (
              <div className="ml-2 flex items-center gap-2">
                <span className="text-sm text-[#506176]">Mostrar</span>
                <div className="relative">
                  <select
                    value={pageSizeOption}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                       setAnimateCells(true);
                       setPageSizeOption(num);
                       setPageSize(num);
                       if (isServerPagination && serverPagination?.onPageSizeChange) {
                         serverPagination.onPageSizeChange(num);
                         return;
                       }
                      setPage(1);
                    }}
                    className="h-10 w-16 appearance-none rounded-lg bg-white pl-3 pr-7 text-sm text-[#172B4D] border border-gray-200 transition-colors hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                  >
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7A90]" />
                </div>
              </div>
            )}
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

            {totalPages > 1 && (
              <Pagination
                page={isServerPagination ? Math.max(1, serverPagination?.page ?? 1) : page}
                totalPages={totalPages}
                goTo={goTo}
              />
            )}
          </>
        )}
      </div>

      {onCreate && canCreate(module) && (
        <button
          className="fixed bottom-6 right-6 z-50 flex md:hidden items-center justify-center w-12 h-12 rounded-full shadow-lg text-white transition-transform hover:scale-105"
          style={{ background: "#2a9781" }}
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
