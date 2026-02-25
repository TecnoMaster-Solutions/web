"use client";

import { api } from "@/shared/utils/apiClient";
import type { Product } from "../types/typesProducts";

export type StatusQuery = "active" | "inactive" | "all";

type ProductCategoryFromApi = {
  id?: number;
  name?: string;

  categoryid?: number;
  categoryname?: string;
};

type ProductFromApi = {
  productid: number;
  productname: string;
  productdescription: string | null;

  categoryid: number;
  category?: ProductCategoryFromApi | null;

  suppliercategory: string;

  image: string;

  images?: string[] | null;

  productpriceofsupplier: number | string;
  productpriceofsale: number | string | null;

  productstock: number;

  productcode: string | null;
  isactive: boolean;
};

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v ?? "").trim());
  return Number.isNaN(n) ? 0 : n;
};

const getCategoryName = (cat: ProductCategoryFromApi | null | undefined): string => {
  if (!cat) return "";
  if (typeof cat.name === "string" && cat.name.trim()) return cat.name.trim();
  if (typeof cat.categoryname === "string" && cat.categoryname.trim()) return cat.categoryname.trim();
  return "";
};

const normalizeImages = (p: ProductFromApi): { image: string; images?: string[] | null } => {
  const arr = Array.isArray(p.images) ? p.images.filter((x) => typeof x === "string" && x.trim()) : [];
  const img = typeof p.image === "string" && p.image.trim() ? p.image.trim() : "";

  if (arr.length > 0) return { image: arr[0], images: arr };
  if (img) return { image: img, images: [img] };
  return { image: "", images: null };
};

const toUi = (p: ProductFromApi): Product => {
  const imgs = normalizeImages(p);

  return {
    id: p.productid,
    name: p.productname,
    description: p.productdescription ?? null,

    categoryId: p.categoryid,
    categoryName: getCategoryName(p.category),

    supplierCategory: p.suppliercategory,
    supplierPrice: toNumber(p.productpriceofsupplier),
    salePrice: p.productpriceofsale === null ? null : toNumber(p.productpriceofsale),

    stock: p.productstock,
    code: p.productcode ?? null,

    image: imgs.image,
    images: imgs.images ?? null,

    state: p.isactive ? "Activo" : "Inactivo",
  };
};

export type CreateProductPayload = {
  productname: string;
  productdescription?: string | null;

  categoryid: number;
  suppliercategory: string;

  images: string[];

  productcode?: string | null;

  isactive?: boolean;
};

export type UpdateProductPayload = Partial<CreateProductPayload> & {
  isactive?: boolean;
};

export const getProducts = async (status: StatusQuery = "active"): Promise<Product[]> => {
  const { data } = await api.get<ProductFromApi[]>("/products", { params: { status } });
  return data.map(toUi);
};

export const getProductById = async (id: number): Promise<Product> => {
  const { data } = await api.get<ProductFromApi>(`/products/${id}`);
  return toUi(data);
};

export const createProduct = async (payload: CreateProductPayload): Promise<unknown> => {
  const { data } = await api.post("/products", payload);
  return data;
};

export const updateProduct = async (id: number, payload: UpdateProductPayload): Promise<unknown> => {
  const { data } = await api.patch(`/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id: number): Promise<unknown> => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

export type ProductDeletionInfo = {
  canDelete: boolean;
  reason?: string;
  canDeactivate?: boolean;
};

export const getProductDeletionInfo = async (id: number): Promise<ProductDeletionInfo> => {
  const { data } = await api.get<ProductDeletionInfo>(`/products/${id}/deletion-info`);
  return {
    canDelete: !!data?.canDelete,
    reason: typeof data?.reason === "string" ? data.reason : undefined,
    canDeactivate:
      typeof (data as any)?.canDeactivate === "boolean" ? (data as any).canDeactivate : undefined,
  };
};