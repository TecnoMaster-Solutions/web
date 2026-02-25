import type { Product } from "@/features/dashboard/products/types/typesProducts";

export type ProductFormField =
  | "name"
  | "description"
  | "categoryId"
  | "supplierCategory"
  | "code"
  | "images";

export type ProductErrors = Partial<Record<ProductFormField, string>>;

export type ProductFormDraft = {
  name: string;
  description?: string | null;

  categoryId: number | string;
  supplierCategory: string;

  code?: string | null;

  images: Array<File | string>;
};

export const validateProductField = (
  field: ProductFormField,
  value: unknown,
  products: Product[],
  currentId?: number
): string | undefined => {
  switch (field) {
    case "name": {
      const v = String(value ?? "").trim();
      if (!v) return "El nombre es obligatorio";

      const duplicated = products.some(
        (p) => p.name.toLowerCase() === v.toLowerCase() && p.id !== currentId
      );
      if (duplicated) return "Ya existe un producto con este nombre";
      return;
    }

    case "categoryId": {
      const n = Number(value);
      if (!n || n < 1) return "La categoría es obligatoria";
      return;
    }

    case "supplierCategory": {
      const v = String(value ?? "").trim();
      if (!v) return "La categoría del proveedor es obligatoria";
      return;
    }

    case "code": {
      const v = String(value ?? "").trim();
      if (!v) return "El código es obligatorio";
      if (v.length > 20) return "El código no puede superar 20 caracteres";

      const duplicated = products.some((p) => {
        const code = String(p.code ?? "").trim();
        return code.toLowerCase() === v.toLowerCase() && p.id !== currentId;
      });

      if (duplicated) return "Ya existe un producto con este código";
      return;
    }

    case "images": {
      const arr = Array.isArray(value) ? (value as unknown[]) : [];
      const normalized = arr
        .map((x) => {
          if (x instanceof File) return x;
          const s = String(x ?? "").trim();
          return s ? s : null;
        })
        .filter(Boolean);

      if (normalized.length === 0) return "Debe seleccionar al menos una imagen";
      if (normalized.length > 6) return "Máximo 6 imágenes por producto";
      return;
    }

    case "description":
      return;

    default:
      return;
  }
};

export const validateProductForm = (
  data: ProductFormDraft,
  products: Product[],
  currentId?: number
): ProductErrors => {
  const errors: ProductErrors = {};

  const fields: ProductFormField[] = [
    "name",
    "description",
    "categoryId",
    "supplierCategory",
    "code",
    "images",
  ];

  for (const field of fields) {
    const error = validateProductField(field, (data as any)[field], products, currentId);
    if (error) (errors as any)[field] = error;
  }

  return errors;
};