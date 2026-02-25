import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";
import { Category, CreateCategoryData, EditCategoryData } from "../types/typeCategoryProducts";

const RETRY_LIMIT = 2;

// Obtener todas las categorías
export const getCategories = async (signal?: AbortSignal): Promise<Category[]> => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.get("/products-categories", {
        signal,
        timeout: 5000,
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (!Array.isArray(data)) {
        throw new Error(`Respuesta inválida del servidor. Se esperaba un arreglo y llegó: ${typeof data}`);
      }

      return data.map((c: any) => ({
        ...c,
        status: Boolean(c.status),
      }));
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return [];

      if (error?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT) throw new Error("La petición expiró. Intente nuevamente.");
        continue;
      }

      if (!error.response) {
        attempt++;
        if (attempt > RETRY_LIMIT) throw new Error("Error de red al cargar categorías.");
        continue;
      }

      const status = error.response.status;

      if (status >= 500) throw new Error("El servidor tuvo un problema (500). Intente más tarde.");
      if (status === 404) return [];
      if (status === 401 || status === 403) throw new Error("No autorizado para consultar categorías.");

      throw new Error(
        error?.response?.data?.message ?? "No se pudo cargar el listado de categorías."
      );
    }
  }

  return [];
};

// Obtener categoría por ID
export const getCategoryById = async (id: number): Promise<Category> => {
  try {
    const { data } = await api.get(`/products-categories/${id}`);
    return data;
  } catch (error) {
    console.error("Error al obtener categoría:", error);
    showError("No se pudo obtener la categoría.");
    throw error;
  }
};

// Crear categoría
export const createCategory = async (category: CreateCategoryData) => {
  try {
    if (!category.name.trim()) {
      showError("El nombre de la categoría es obligatorio.");
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
    console.error("Error al crear categoría:", error);
    showError(error?.response?.data?.message ?? "No se pudo crear la categoría.");
    throw error;
  }
};

// Actualizar categoría
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
        if (attempt > RETRY_LIMIT) throw new Error("El servidor tardó demasiado. Intente nuevamente.");
        continue;
      }

      const message = error?.response?.data?.message;
      console.error("Error al actualizar categoría:", error);
      showError(message ?? "Error al actualizar la categoría.");
      throw error;
    }
  }
};

// Eliminar categoría
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
        if (attempt > RETRY_LIMIT) throw new Error("Error de red eliminando categoría.");
        continue;
      }

      const status = error.response.status;

      if (status === 409 || status === 400) {
        // categoría con productos asociados
        throw new Error(
          error.response.data?.message ??
            "No se puede eliminar la categoría porque tiene productos asociados."
        );
      }

      if (status >= 500) throw new Error("El servidor tuvo un error al eliminar la categoría.");

      const msg = error.response.data?.message;
      showError(msg ?? "Error al eliminar la categoría.");
      throw error;
    }
  }
};
