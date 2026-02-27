import { api } from "@/shared/utils/apiClient";
import { IPurchase } from "../Types/Purchase.type";
import { showError } from "@/shared/utils/notifications";

const RETRY_LIMIT = 2;

export const getPurchases = async (
  signal?: AbortSignal
): Promise<IPurchase[]> => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.get("/purchasesmanagement", {
        signal,
        timeout: 5000,
        validateStatus: (status) => status >= 200 && status < 500,
      });

      if (!Array.isArray(data)) {
        throw new Error(
          `Respuesta inválida del servidor. Se esperaba un arreglo, se recibió: ${typeof data}`
        );
      }

      return data.map((p: any) => ({
        ...p,
        amount: Number(p.amount ?? 0),
      }));
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return [];
      }

      if (error?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("La petición expiró. Intente nuevamente.");
        }
        continue;
      }

      if (!error.response) {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error(
            "Error de red al intentar cargar compras. Verifique su conexión."
          );
        }
        continue;
      }

      const status = error.response.status;

      if (status >= 500) {
        throw new Error(`El servidor tuvo un problema (500). Intente más tarde.`);
      }

      if (status === 404) {
        return [];
      }

      if (status === 401 || status === 403) {
        throw new Error(`No autorizado para consultar compras.`);
      }

      console.error("Error cargando compras:", error);
      throw new Error(
        error?.response?.data?.message ?? "No se pudo cargar el listado de compras."
      );
    }
  }

  return [];
};

export const getPurchaseById = async (id: number): Promise<IPurchase> => {
  try {
    const { data } = await api.get(`/purchasesmanagement/${id}`);
    return { ...data, amount: parseFloat(data.amount) };
  } catch (error) {
    console.error("Error al obtener la compra:", error);
    showError("Error al obtener la compra. Por favor, inténtalo de nuevo.");
    throw error;
  }
};

export const createPurchase = async (purchase: Partial<IPurchase>) => {
  try {
    const { data } = await api.post("/purchasesmanagement", purchase);
    return data;
  } catch (error) {
    console.error("Error al crear la compra:", error);
    showError("Error al crear la compra. Por favor, inténtalo de nuevo.");
    throw error;
  }
};

export const cancelPurchase = async (id: number, observation?: string) => {
  try {
    const params: any = {};
    if (observation) params.observation = observation;

    const { data } = await api.post(
      `/purchasesmanagement/${id}/cancel`,
      {},
      { params }
    );

    return data;
  } catch (error) {
    console.error("Error al anular la compra:", error);
    showError("Error al anular la compra. Por favor, inténtalo de nuevo.");
    throw error;
  }
};

export const getProductsForPurchase = async () => {
  const { data } = await api.get("/products");
  return data;
};

export const getSuppliersForPurchase = async () => {
  const response = await api.get("/suppliers");
  return response.data.data;
};

/**
 * NUEVO: Traer OCs por proveedor y estado (Pendiente).
 * Tu backend: GET /purchase-orders?proveedorId=...&estadoId=...
 */
export const getPurchaseOrdersForSupplier = async (
  proveedorId: number,
  estadoId: number
) => {
  const { data } = await api.get("/purchase-orders", {
    params: { proveedorId, estadoId },
  });
  return Array.isArray(data) ? data : [];
};