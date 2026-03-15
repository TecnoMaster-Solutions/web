import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";
import type { Role } from "../hooks/useRoles";

const RETRY_LIMIT = 2;

type ApiErrorShape = {
  name?: string;
  code?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

// Obtener roles (con retry, timeout y validación)
export const fetchRoles = async (signal?: AbortSignal): Promise<Role[]> => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.get("/roles/list", {
        signal,
        timeout: 6000,
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (!data) {
        throw new Error("Respuesta inválida del servidor.");
      }

      if (Array.isArray(data)) return data;
      if (Array.isArray(data.data)) return data.data;

      throw new Error("Estructura inesperada en la respuesta de roles.");
    } catch (error: unknown) {
      const apiError = error as ApiErrorShape;
      // Cancelado por el usuario
      if (apiError?.name === "CanceledError" || apiError?.code === "ERR_CANCELED") {
        return [];
      }

      // Timeout
      if (apiError?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("La solicitud demoró demasiado. Intente nuevamente.");
        continue;
      }

      // Sin respuesta del servidor
      if (!apiError.response) {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("Error de red obteniendo roles.");
        continue;
      }

      const status = apiError.response.status;
      if (status == null) {
        throw new Error("Respuesta inv\xE1lida del servidor al obtener los roles.");
      }

      if (status >= 500)
        throw new Error("El servidor tuvo un problema al obtener roles.");

      if (status === 401 || status === 403)
        throw new Error("No autorizado para consultar roles.");

      showError(apiError.response?.data?.message ?? "No se pudieron obtener los roles.");
      throw apiError;
    }
  }

  return [];
};
