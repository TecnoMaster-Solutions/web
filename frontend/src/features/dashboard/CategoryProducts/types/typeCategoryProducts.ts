export interface Category {
  id: number;
  name: string;
  description: string;
  status: boolean;
  icon?: File | string | null;
  productsCount?: number;
  stateLabel?: string;
  stateSearch?: "activo" | "inactivo";
  statusSearch: string;
  rowNumber: number;
}

export interface CategoryBase {
  name: string;
  description: string;
  icon?: File | string | null;
}

export interface CreateCategoryData extends CategoryBase { }

export interface EditCategoryData extends CategoryBase {
  id: number;
  status: boolean;
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
  onSave: (categoryData: CategoryBase) => void;
  categories: { id: number; name: string }[];
}

export interface EditCategoryModalProps {
  isOpen: boolean;
  category: EditCategoryData | null;
  onClose: () => void;
  onSave: (categoryData: EditCategoryData) => void;
  categories: { id: number; name: string }[];
}

export interface ViewCategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
}


