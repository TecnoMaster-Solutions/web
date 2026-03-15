import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";
import { User, UserPayload, UsersPaginatedResult } from "../types/typesUser";

const RETRY_LIMIT = 2;

type GetUsersParams = {
  signal?: AbortSignal;
  page?: number;
  limit?: number;
  search?: string;
};

type ApiErrorShape = {
  name?: string;
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

// GET USERS (con retry, abort, validación de respuesta)
export const getUsers = async ({
  signal,
  page,
  limit,
  search,
}: GetUsersParams = {}): Promise<User[] | UsersPaginatedResult> => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.get("/users", {
        params:
          Number.isInteger(page) && Number.isInteger(limit)
            ? {
                page,
                limit,
                ...(search?.trim() ? { search: search.trim() } : {}),
              }
            : undefined,
        signal,
        timeout: 8000,
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (!data || typeof data !== "object") {
        throw new Error("Respuesta inválida del servidor.");
      }

      if (Array.isArray(data)) {
        return data;
      }

      if (
        data &&
        typeof data === "object" &&
        Array.isArray(data.data) &&
        data.meta &&
        typeof data.meta === "object"
      ) {
        return {
          data: data.data,
          meta: {
            page: Number(data.meta.page ?? 1),
            limit: Number(data.meta.limit ?? limit ?? 5),
            total: Number(data.meta.total ?? data.data.length),
            totalPages: Number(data.meta.totalPages ?? 1),
          },
        };
      }

      throw new Error(
        "Formato de respuesta de usuarios no reconocido por el cliente."
      );
    } catch (error: unknown) {
      const apiError = error as ApiErrorShape;
      if (apiError?.name === "CanceledError" || apiError?.code === "ERR_CANCELED") {
        return {
          data: [],
          meta: { page: page ?? 1, limit: limit ?? 5, total: 0, totalPages: 1 },
        };
      }

      if (apiError?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("La petición expiró. Intente nuevamente.");
        continue;
      }

      if (!apiError.response) {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("Error de red al intentar cargar usuarios.");
        continue;
      }

      const status = apiError.response.status;
      if (status == null) {
        throw new Error("Respuesta inv\xE1lida del servidor al crear el usuario.");
      }

      if (status >= 500)
        throw new Error("El servidor tuvo un problema. Intente más tarde.");

      if (status === 404) {
        return {
          data: [],
          meta: { page: page ?? 1, limit: limit ?? 5, total: 0, totalPages: 1 },
        };
      }

      if (status === 401 || status === 403)
        throw new Error("No autorizado para consultar usuarios.");

        throw new Error(
          apiError.response?.data?.message ??
          "No se pudo cargar el listado de usuarios."
        );
    }
  }

  return {
    data: [],
    meta: { page: page ?? 1, limit: limit ?? 5, total: 0, totalPages: 1 },
  };
};

// GET USER BY ID
export const getUserById = async (id: number) => {
  try {
    const { data } = await api.get(`/users/${id}`);
    return data?.data ?? data;
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    showError("No se pudo obtener el usuario.");
    throw error;
  }
};

// CREATE USER 
export const createUser = async (user: UserPayload) => {
  try {
    if (!user.name?.trim()) {
      showError("El nombre es obligatorio.");
      throw new Error("Nombre requerido");
    }

    if (!user.email?.trim()) {
      showError("El correo electrónico es obligatorio.");
      throw new Error("Correo requerido");
    }

    const { data } = await api.post("/users", user, {
      timeout: 8000,
    });

    return data;
  } catch (error: unknown) {
    const apiError = error as ApiErrorShape;
    console.error("Error al crear usuario:", error);

    const backendMsg = apiError?.response?.data?.message;
    showError(backendMsg ?? "No se pudo crear el usuario.");

    throw apiError;
  }
};

// UPDATE USER (con retry)
export const updateUser = async (id: number, user: UserPayload) => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.patch(`/users/${id}`, user, {
        timeout: 8000,
      });

      return data;
    } catch (error: unknown) {
      const apiError = error as ApiErrorShape;
      if (apiError.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("El servidor tardó demasiado. Intente nuevamente.");
        continue;
      }

      const msg = apiError?.response?.data?.message;

      console.error("Error al actualizar usuario:", error);
      showError(msg ?? "No se pudo actualizar el usuario.");

      throw apiError;
    }
  }
};

// DELETE USER (con retry y validaciones específicas)
export const deleteUser = async (id: number) => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.delete(`/users/${id}`, {
        timeout: 8000,
      });

      return data;
    } catch (error: unknown) {
      const apiError = error as ApiErrorShape;
      if (!apiError.response) {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("Error de red al intentar eliminar usuario.");
        continue;
      }

      const status = apiError.response.status;
      if (status == null) {
        throw new Error("Respuesta inv\xE1lida del servidor al actualizar el usuario.");
      }

      if (status === 409 || status === 400) {
        throw new Error(
          apiError.response.data?.message ??
            "No se puede eliminar el usuario porque tiene registros asociados."
        );
      }

      if (status >= 500)
        throw new Error("El servidor tuvo un error al eliminar el usuario.");

      const msg = apiError.response.data?.message;
      showError(msg ?? "Error al eliminar el usuario.");
      throw apiError;
    }
  }
};
