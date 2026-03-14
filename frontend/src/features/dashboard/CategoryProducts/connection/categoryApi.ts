import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";
import {
  Category,
  CategoriesPaginatedResult,
  CreateCategoryData,
  EditCategoryData,
} from "../types/typeCategoryProducts";

const RETRY_LIMIT = 2;

type GetCategoriesParams = {
  signal?: AbortSignal;
  page?: number;
  limit?: number;
  search?: string;
};

const normalizeCategory = (c: any): Category => ({
  ...c,
  id: Number(c?.id ?? c?.categoryid ?? 0),
  name: String(c?.name ?? c?.categoryname ?? ""),
  description: c?.description ?? c?.categorydescription ?? "",
  status: Boolean(c?.status ?? c?.isactive),
  icon: c?.icon ?? null,
});

// Obtener categorias (paginado opcional)
export function getCategories(): Promise<Category[]>;
export function getCategories(
  params: GetCategoriesParams,
): Promise<Category[] | CategoriesPaginatedResult>;
export async function getCategories({
  signal,
  page,
  limit,
  search,
}: GetCategoriesParams = {}): Promise<Category[] | CategoriesPaginatedResult> {
  let attempt = 0;
  const shouldPaginate = Number.isInteger(page) && Number.isInteger(limit);

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.get("/products-categories", {
        params: shouldPaginate
          ? {
              page,
              limit,
              ...(search?.trim() ? { search: search.trim() } : {}),
            }
          : undefined,
        signal,
        timeout: 5000,
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (Array.isArray(data)) {
        return data.map(normalizeCategory);
      }

      if (
        data &&
        typeof data === "object" &&
        Array.isArray(data.data) &&
        data.meta &&
        typeof data.meta === "object"
      ) {
        return {
          data: data.data.map(normalizeCategory),
          meta: {
            page: Number(data.meta.page ?? 1),
            limit: Number(data.meta.limit ?? limit ?? 5),
            total: Number(data.meta.total ?? data.data.length),
            totalPages: Number(data.meta.totalPages ?? 1),
          },
        };
      }

      throw new Error(
        `Respuesta invalida del servidor. Formato no reconocido: ${typeof data}`,
      );
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return shouldPaginate
          ? {
              data: [],
              meta: {
                page: page ?? 1,
                limit: limit ?? 5,
                total: 0,
                totalPages: 1,
              },
            }
          : [];
      }

      if (typeof error?.message === "string" && !error?.response && !error?.code) {
        throw error;
      }

      if (error?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("La peticion expiro. Intente nuevamente.");
        }
        continue;
      }

      if (!error.response) {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("Error de red al cargar categorias.");
        }
        continue;
      }

      const status = error.response.status;

      if (status >= 500) {
        throw new Error("El servidor tuvo un problema (500). Intente mas tarde.");
      }

      if (status === 404) {
        return shouldPaginate
          ? {
              data: [],
              meta: {
                page: page ?? 1,
                limit: limit ?? 5,
                total: 0,
                totalPages: 1,
              },
            }
          : [];
      }

      if (status === 401 || status === 403) {
        throw new Error("No autorizado para consultar categorias.");
      }

      throw new Error(
        error?.response?.data?.message ?? "No se pudo cargar el listado de categorias.",
      );
    }
  }

  return shouldPaginate
    ? {
        data: [],
        meta: {
          page: page ?? 1,
          limit: limit ?? 5,
          total: 0,
          totalPages: 1,
        },
      }
    : [];
}

// Obtener solo categorias activas
export const getActiveCategories = async (
  signal?: AbortSignal,
): Promise<Category[]> => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.get("/products-categories/active", {
        signal,
        timeout: 5000,
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (Array.isArray(data)) {
        return data.map(normalizeCategory);
      }

      if (data && typeof data === "object" && Array.isArray(data.data)) {
        return data.data.map(normalizeCategory);
      }

      return [];
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return [];
      }

      if (error?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("La peticion expiro. Intente nuevamente.");
        }
        continue;
      }

      if (!error?.response) {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("Error de red al cargar categorias activas.");
        }
        continue;
      }

      const status = error.response.status;

      if (status === 404) {
        return [];
      }

      if (status === 401 || status === 403) {
        throw new Error("No autorizado para consultar categorias activas.");
      }

      if (status >= 500) {
        throw new Error("El servidor tuvo un problema al cargar categorias activas.");
      }

      throw new Error(
        error?.response?.data?.message ?? "No se pudieron cargar las categorias activas.",
      );
    }
  }

  return [];
};

// Obtener categoria por ID
export const getCategoryById = async (id: number): Promise<Category> => {
  try {
    const { data } = await api.get(`/products-categories/${id}`);
    return normalizeCategory(data);
  } catch (error) {
    console.error("Error al obtener categoria:", error);
    showError("No se pudo obtener la categoria.");
    throw error;
  }
};

// Crear categoria
export const createCategory = async (category: CreateCategoryData) => {
  try {
    if (!category.name.trim()) {
      showError("El nombre de la categoria es obligatorio.");
      throw new Error("Nombre requerido");
    }

    const { data } = await api.post("/products-categories", {
      name: category.name.trim(),
      description: category.description?.trim() ?? null,
      icon: category.icon ?? null,
      status: true,
    });

    return data;
  } catch (error: any) {
    console.error("Error al crear categoria:", error);
    showError(error?.response?.data?.message ?? "No se pudo crear la categoria.");
    throw error;
  }
};

// Actualizar categoria
export const updateCategory = async (id: number, category: EditCategoryData) => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.patch(`/products-categories/${id}`, {
        name: category.name.trim(),
        description: category.description?.trim() ?? null,
        icon: category.icon ?? null,
        status: category.status,
      });

      return data;
    } catch (error: any) {
      if (error?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("El servidor tardo demasiado. Intente nuevamente.");
        }
        continue;
      }

      const message = error?.response?.data?.message;
      console.error("Error al actualizar categoria:", error);
      showError(message ?? "Error al actualizar la categoria.");
      throw error;
    }
  }
};

// Eliminar categoria
export const deleteCategory = async (id: number) => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.delete(`/products-categories/${id}`, {
        timeout: 5000,
      });
      return data;
    } catch (error: any) {
      if (!error.response) {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("Error de red eliminando categoria.");
        }
        continue;
      }

      const status = error.response.status;

      if (status === 409 || status === 400) {
        throw new Error(
          error.response.data?.message ??
            "No se puede eliminar la categoria porque tiene productos asociados.",
        );
      }

      if (status >= 500) {
        throw new Error("El servidor tuvo un error al eliminar la categoria.");
      }

      const msg = error.response.data?.message;
      showError(msg ?? "Error al eliminar la categoria.");
      throw error;
    }
  }
};
