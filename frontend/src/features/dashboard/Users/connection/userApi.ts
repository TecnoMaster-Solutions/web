import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";

const RETRY_LIMIT = 2;

// GET USERS (con retry, abort, validación de respuesta)
export const getUsers = async (signal?: AbortSignal) => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.get("/users", {
        signal,
        timeout: 8000,
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (!data || typeof data !== "object") {
        throw new Error("Respuesta inválida del servidor.");
      }

      // El backend devuelve { success, data: [...] }
      if (!Array.isArray(data)) {
        throw new Error(
          `Se esperaba un array de usuarios. Recibido: ${typeof data.data}`
        );
      }

      return data;
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return [];
      }

      if (error?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("La petición expiró. Intente nuevamente.");
        continue;
      }

      if (!error.response) {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("Error de red al intentar cargar usuarios.");
        continue;
      }

      const status = error.response.status;

      if (status >= 500)
        throw new Error("El servidor tuvo un problema. Intente más tarde.");

      if (status === 404) return [];

      if (status === 401 || status === 403)
        throw new Error("No autorizado para consultar usuarios.");

      throw new Error(
        error.response?.data?.message ??
          "No se pudo cargar el listado de usuarios."
      );
    }
  }

  return [];
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
export const createUser = async (user: any) => {
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
  } catch (error: any) {
    console.error("Error al crear usuario:", error);

    const backendMsg = error?.response?.data?.message;
    showError(backendMsg ?? "No se pudo crear el usuario.");

    throw error;
  }
};

// UPDATE USER (con retry)
export const updateUser = async (id: number, user: any) => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.patch(`/users/${id}`, user, {
        timeout: 8000,
      });

      return data;
    } catch (error: any) {
      if (error.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("El servidor tardó demasiado. Intente nuevamente.");
        continue;
      }

      const msg = error?.response?.data?.message;

      console.error("Error al actualizar usuario:", error);
      showError(msg ?? "No se pudo actualizar el usuario.");

      throw error;
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
    } catch (error: any) {
      if (!error.response) {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("Error de red al intentar eliminar usuario.");
        continue;
      }

      const status = error.response.status;

      if (status === 409 || status === 400) {
        throw new Error(
          error.response.data?.message ??
            "No se puede eliminar el usuario porque tiene registros asociados."
        );
      }

      if (status >= 500)
        throw new Error("El servidor tuvo un error al eliminar el usuario.");

      const msg = error.response.data?.message;
      showError(msg ?? "Error al eliminar el usuario.");
      throw error;
    }
  }
};
