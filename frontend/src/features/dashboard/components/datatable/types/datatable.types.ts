import { Column } from "./column.types";

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
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
