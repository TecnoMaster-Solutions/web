import { Column } from "./column.types";

export type FilterOption = {
  key: string;
  label: string;
  value: string;
};

export type DateFilter = {
  startDate: string | null;
  endDate: string | null;
};

export type DataTableFilters = {
  status?: string | null;
  dateRange?: DateFilter;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  showPageSizeSelector?: boolean;
  serverPagination?: {
    page: number;
    limit?: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (limit: number) => void;
  };
  serverSearch?: {
    value: string;
    onChange: (value: string) => void;
  };
  // Nuevos filtros avanzados
  serverFilters?: {
    filters: DataTableFilters;
    onFilterChange: (filters: DataTableFilters) => void;
  };
  statusFilterOptions?: FilterOption[];
  dateFilterField?: string; // Campo de fecha a filtrar (ej: 'createdat', 'fecha', 'fecharegistro')
  searchableKeys?: (keyof T)[];
  actionGuard?: (row: T) => {
    disableEdit?: boolean;
    disableDelete?: boolean;
    disableCancel?: boolean;
    editTitle?: string;
    deleteTitle?: string;
    cancelTitle?: string;
  };
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onCancel?: (row: T) => void;
  onCheck?: (row: T) => void;
  onCreate?: () => void;
  onApprove?: (row: T) => void;

  searchPlaceholder?: string;
  createButtonText?: string;
  rightActions?: React.ReactNode;
  renderActions?: (row: T) => React.ReactNode;
  renderExtraActions?: (row: T) => React.ReactNode;
  tailHeader?: string;
  renderTail?: (row: T) => React.ReactNode;
  mobileCardView?: boolean;
  freeze?: boolean;
  disableInternalScroll?: boolean;
  loading?: boolean;
};
