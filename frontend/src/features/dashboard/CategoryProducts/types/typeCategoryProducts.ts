export interface Category {
  id: number;
  name: string;
  description: string;
  status: boolean;
  icon?: File | string | null;
  productsCount?: number;
  stateLabel?: string;
  stateSearch?: "activo" | "inactivo";
  statusSearch?: string;
  rowNumber?: number;
}

export interface CategoriesPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CategoriesPaginatedResult {
  data: Category[];
  meta: CategoriesPaginationMeta;
}

export interface CategoryBase {
  name: string;
  description: string;
  icon?: File | string | null;
}

export type CreateCategoryData = CategoryBase;

export interface EditCategoryData extends CategoryBase {
  id: number;
  status: boolean;
}

export type CategoryFieldName = keyof FormErrors;

export interface CategoryOption {
  id: number;
  name: string;
}

export interface CategoryApiShape {
  id?: number | string | null;
  categoryid?: number | string | null;
  category_id?: number | string | null;
  name?: string | null;
  categoryname?: string | null;
  description?: string | null;
  categorydescription?: string | null;
  status?: boolean | number | string | null;
  isactive?: boolean | number | string | null;
  icon?: string | null;
  data?: unknown;
}

export interface CategoryApiListResponse {
  data: CategoryApiShape[];
  meta?: Partial<CategoriesPaginationMeta> | null;
}

export interface FormErrors {
  name: string;
  description: string;
}

export interface FormTouched {
  name: boolean;
  description: boolean;
}

export interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: CategoryBase) => void | Promise<void>;
  categories: CategoryOption[];
}

export interface EditCategoryModalProps {
  isOpen: boolean;
  category: EditCategoryData | null;
  onClose: () => void;
  onSave: (categoryData: EditCategoryData) => void | Promise<void>;
  categories: CategoryOption[];
}

export interface ViewCategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
}
