"use client";

import { api } from "@/shared/utils/apiClient";
import type { Product } from "../hooks/useProducts";

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
  productstock: number;
  categoryid: number;
  category?: ProductCategoryFromApi | null;
  suppliercategory: string;
  image: string;
  images?: string[] | null;
  productpriceofsale: number | string | null;
  isactive: boolean;
};

type ProductsResponse = {
  data: ProductFromApi[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type ProductCategoryApi = {
  id?: number;
  categoryid?: number;
  name?: string;
  categoryname?: string;
  isactive?: boolean;
};

export type ProductFilterItem = {
  id: string;
  label: string;
};

export type FetchProductsParams = {
  page?: number;
  limit?: number;
  search?: string;
  categoryid?: number;
};

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v ?? "").trim());
  return Number.isNaN(n) ? 0 : n;
};

const getCategoryName = (
  cat: ProductCategoryFromApi | null | undefined
): string => {
  if (!cat) return "";
  if (typeof cat.name === "string" && cat.name.trim()) return cat.name.trim();
  if (typeof cat.categoryname === "string" && cat.categoryname.trim()) {
    return cat.categoryname.trim();
  }
  return "";
};

const toLanding = (p: ProductFromApi): Product => ({
  id: String(p.productid),
  title: p.productname,
  description: p.productdescription ?? "Sin descripción",
  category: getCategoryName(p.category) || "Sin categoría",
  image: p.image || undefined,
  images: Array.isArray(p.images)
    ? p.images.filter((x) => typeof x === "string" && x.trim())
    : undefined,
  price:
    p.productpriceofsale === null
      ? undefined
      : toNumber(p.productpriceofsale),
  stock: toNumber(p.productstock),
});

export const fetchLandingProducts = async (
  params: FetchProductsParams = { page: 1, limit: 9 }
) => {
  const safeParams: Record<string, any> = {
    page: params.page ?? 1,
    limit: params.limit ?? 9,
    status: "active",
  };

  if (params.search?.trim()) {
    safeParams.search = params.search.trim();
  }

  if (
    typeof params.categoryid === "number" &&
    Number.isInteger(params.categoryid) &&
    params.categoryid > 0
  ) {
    safeParams.categoryid = params.categoryid;
  }

  const { data } = await api.get<ProductsResponse>("/products", {
    params: safeParams,
  });

  return {
    data: (data?.data ?? [])
      .filter((product) => product.isactive !== false)
      .map(toLanding),
    meta: {
      total: Number(data?.meta?.total ?? 0),
      page: Number(data?.meta?.page ?? safeParams.page),
      limit: Number(data?.meta?.limit ?? safeParams.limit),
      totalPages: Number(data?.meta?.totalPages ?? 1),
    },
  };
};

export const getLandingProductById = async (
  id: string | number
): Promise<Product> => {
  const { data } = await api.get<ProductFromApi>(`/products/${id}`);
  return toLanding(data);
};

export const fetchLandingProductCategories = async (): Promise<ProductFilterItem[]> => {
  const { data } = await api.get<ProductCategoryApi[]>("/products-categories/active");

  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      const id = Number(item?.id ?? item?.categoryid);
      const label = String(item?.name ?? item?.categoryname ?? "").trim();

      return {
        id: String(id),
        label,
      };
    })
    .filter((item) => Number(item.id) > 0 && item.label)
    .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
};

