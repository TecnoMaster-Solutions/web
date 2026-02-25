import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";

const RETRY_LIMIT = 2;

// Obtener roles (con retry, timeout y validación)
export const fetchRoles = async (signal?: AbortSignal) => {
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
    } catch (error: any) {
      // Cancelado por el usuario
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return [];
      }

      // Timeout
      if (error?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("La solicitud demoró demasiado. Intente nuevamente.");
        continue;
      }

      // Sin respuesta del servidor
      if (!error.response) {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("Error de red obteniendo roles.");
        continue;
      }

      const status = error.response.status;

      if (status >= 500)
        throw new Error("El servidor tuvo un problema al obtener roles.");

      if (status === 401 || status === 403)
        throw new Error("No autorizado para consultar roles.");

      showError(error.response?.data?.message ?? "No se pudieron obtener los roles.");
      throw error;
    }
  }

  return [];
};
