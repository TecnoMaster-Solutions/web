import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";
import { UserDocumentType } from "../types/typesUser";

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

// Obtener tipos de documento
export const fetchDocumentTypes = async (
  signal?: AbortSignal
): Promise<UserDocumentType[]> => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.get("/typeofdocuments", {
        signal,
        timeout: 6000,
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (!data) {
        throw new Error("Respuesta inválida del servidor.");
      }

      if (Array.isArray(data.data)) return data.data;

      throw new Error("Estructura inesperada al obtener tipos de documento.");
    } catch (error: unknown) {
      const apiError = error as ApiErrorShape;
      // Cancelado
      if (apiError?.name === "CanceledError" || apiError?.code === "ERR_CANCELED") {
        return [];
      }

      // Timeout
      if (apiError?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("La petición tardó demasiado. Intente nuevamente.");
        continue;
      }

      // Falla de red
      if (!apiError.response) {
        attempt++;
        if (attempt > RETRY_LIMIT)
          throw new Error("Error de red al obtener los tipos de documento.");
        continue;
      }

      const status = apiError.response.status;
      if (status == null) {
        throw new Error("Respuesta inv\xE1lida del servidor al obtener los tipos de documento.");
      }

      if (status >= 500)
        throw new Error("El servidor tuvo un problema al obtener los tipos de documento.");

      if (status === 401 || status === 403)
        throw new Error("No autorizado para consultar tipos de documento.");

      showError(apiError.response?.data?.message ?? "No se pudieron cargar los tipos de documento.");
      throw apiError;
    }
  }

  return [];
};
