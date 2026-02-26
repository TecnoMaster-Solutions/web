export type ProductState = "Activo" | "Inactivo";

export interface Product {
  id: number;
  name: string;
  description?: string | null;

  categoryId: number;
  categoryName: string;

  supplierCategory: string;

  supplierPrice: number;
  salePrice?: number | null;

  stock: number;
  code?: string | null;

  image: string;

  images?: string[] | null;

  state: ProductState;
}

export type CreateProductData = {
  name: string;
  description?: string | null;
  categoryId: number;
  supplierCategory: string;
  code?: string | null;

  images: File[];
};

export type EditProductData = {
  id: number;
  name: string;
  description?: string | null;
  categoryId: number;
  supplierCategory: string;
  code?: string | null;

  images: Array<string | File>;

  state: ProductState;
};