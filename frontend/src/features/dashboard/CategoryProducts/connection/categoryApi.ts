import { AxiosError } from "axios";
import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";
import { getApiErrorMessage } from "@/features/auth/utils/authUser";
import {
  Category,
  CategoryApiListResponse,
  CategoryApiShape,
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

const EMPTY_PAGINATED_RESPONSE = (
  page = 1,
  limit = 5,
): CategoriesPaginatedResult => ({
  data: [],
  meta: {
    page,
    limit,
    total: 0,
    totalPages: 1,
  },
});

const normalizeCategory = (category: CategoryApiShape): Category => ({
  id: Number(category.id ?? category.categoryid ?? category.category_id ?? 0),
  name: String(category.name ?? category.categoryname ?? ""),
  description: String(category.description ?? category.categorydescription ?? ""),
  status: Boolean(category.status ?? category.isactive),
  icon: category.icon ?? null,
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
      const { data } = await api.get<CategoryApiShape[] | CategoryApiListResponse>(
        "/products-categories",
        {
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
        },
      );

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
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;

      if (axiosError.name === "CanceledError" || axiosError.code === "ERR_CANCELED") {
        return shouldPaginate ? EMPTY_PAGINATED_RESPONSE(page, limit) : [];
      }

      if (error instanceof Error && !axiosError.response && !axiosError.code) {
        throw error;
      }

      if (axiosError.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("La peticion expiro. Intente nuevamente.");
        }
        continue;
      }

      if (!axiosError.response) {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("Error de red al cargar categorias.");
        }
        continue;
      }

      const status = axiosError.response.status;

      if (status >= 500) {
        throw new Error("El servidor tuvo un problema (500). Intente mas tarde.");
      }

      if (status === 404) {
        return shouldPaginate ? EMPTY_PAGINATED_RESPONSE(page, limit) : [];
      }

      if (status === 401 || status === 403) {
        throw new Error("No autorizado para consultar categorias.");
      }

      throw new Error(
        getApiErrorMessage(error, "No se pudo cargar el listado de categorias."),
      );
    }
  }

  return shouldPaginate ? EMPTY_PAGINATED_RESPONSE(page, limit) : [];
}

// Obtener categoria por ID
export const getCategoryById = async (id: number): Promise<Category> => {
  try {
    const { data } = await api.get<CategoryApiShape>(`/products-categories/${id}`);
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

    const { data } = await api.post<CategoryApiShape>("/products-categories", {
      name: category.name.trim(),
      description: category.description?.trim() ?? null,
      icon: category.icon ?? null,
      status: true,
    });

    return normalizeCategory(data);
  } catch (error: unknown) {
    console.error("Error al crear categoria:", error);
    showError(getApiErrorMessage(error, "No se pudo crear la categoria."));
    throw error;
  }
};

// Actualizar categoria
export const updateCategory = async (
  id: number,
  category: EditCategoryData,
): Promise<Category> => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.patch<CategoryApiShape>(`/products-categories/${id}`, {
        name: category.name.trim(),
        description: category.description?.trim() ?? null,
        icon: category.icon ?? null,
        status: category.status,
      });

      return normalizeCategory(data);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;

      if (axiosError.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("El servidor tardo demasiado. Intente nuevamente.");
        }
        continue;
      }

      console.error("Error al actualizar categoria:", error);
      showError(getApiErrorMessage(error, "Error al actualizar la categoria."));
      throw error;
    }
  }

  throw new Error("No se pudo actualizar la categoria.");
};

// Eliminar categoria
export const deleteCategory = async (id: number) => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.delete<{ success?: boolean; message?: string }>(
        `/products-categories/${id}`,
        {
          timeout: 5000,
        },
      );
      return data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;

      if (!axiosError.response) {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("Error de red eliminando categoria.");
        }
        continue;
      }

      const status = axiosError.response.status;

      if (status === 409 || status === 400) {
        throw new Error(
          axiosError.response.data?.message ??
            "No se puede eliminar la categoria porque tiene productos asociados.",
        );
      }

      if (status >= 500) {
        throw new Error("El servidor tuvo un error al eliminar la categoria.");
      }

      showError(getApiErrorMessage(error, "Error al eliminar la categoria."));
      throw error;
    }
  }

  throw new Error("No se pudo eliminar la categoria.");
};
