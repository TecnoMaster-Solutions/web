import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";

export const createQuote = async (payload: any) => {
  try {
    const { data } = await api.post("/quotes", payload);
    return data;
  } catch (error) {
    console.error("Error al crear la cotización:", error);
    showError("Error al crear la cotización. Inténtalo nuevamente.");
    throw error;
  }
};

export const getQuotes = async () => {
  try {
    const { data } = await api.get("/quotes");
    return data;
  } catch (error) {
    console.error("Error al obtener las cotizaciones:", error);
    showError("Error al obtener las cotizaciones");
    throw error;
  }
};

export const getCustomersForQuote = async (): Promise<any> => {
  try {
    const { data } = await api.get("/customers");
    return data;
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
    showError("Error al obtener los clientes");
    throw error;
  }
};

export const getTechniciansForQuote = async (): Promise<any> => {
  try {
    const { data } = await api.get("/technicians");
    return data;
  } catch (error) {
    console.error("Error al obtener los tecnicos:", error);
    showError("Error al obtener los tecnicos");
    throw error;
  }
};

export const getProductsForQuote = async (): Promise<any> => {
  try {
    const { data } = await api.get("/products");
    return data;
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    showError("Error al obtener los productos");
    throw error;
  }
};

export const getServicesRequestsForQuote = async (): Promise<any[]> => {
  try {
    const { data } = await api.get("/service-requests");

    const filtered = data.filter(
      (request: any) => request.stateId === 11 
    );

    return filtered;
  } catch (error) {
    console.error("Error al obtener las solicitudes de servicio:", error);
    showError("Error al obtener las solicitudes de servicio");
    throw error;
  }
};

/* ================================
 * APROBAR COTIZACIÓN
 * ================================ */
export const approveQuote = async (quoteId: number): Promise<void> => {
  try {
    await api.patch(`/quotes/${quoteId}/approve`);
  } catch (error) {
    console.error("Error al aprobar la cotización:", error);
    showError("Error al aprobar la cotización. Inténtalo nuevamente.");
    throw error;
  }
};

export const completeQuote = async (quoteId: number): Promise<any> => {
  try {
    const { data } = await api.patch(`/quotes/${quoteId}/complete`);
    return data;
  } catch (error) {
    console.error("Error al completar la cotización:", error);
    showError("Error al completar la cotización. Inténtalo nuevamente.");
    throw error;
  }
};

/* ================================
 * ANULAR COTIZACIÓN (ADMIN)
 * ================================ */
export const revokeQuote = async (
  quoteId: number,
  observation?: string
): Promise<void> => {
  try {
    await api.patch(`/quotes/${quoteId}/cancel`, {
      observation: observation ?? null,
    });
  } catch (error) {
    console.error("Error al revocar la cotización:", error);
    showError("Error al revocar la cotización. Inténtalo nuevamente.");
    throw error;
  }
};

export const cancelQuote = async (quoteId: number): Promise<void> => {
  try {
    await api.patch(`/quotes/${quoteId}/cancel-client`);
  } catch (error) {
    console.error("Error al cancelar la cotización:", error);
    showError("Error al cancelar la cotización. Inténtalo nuevamente.");
    throw error;
  }
};
