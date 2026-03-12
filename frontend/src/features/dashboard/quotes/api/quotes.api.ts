import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type GetQuotesParams = {
  page?: number;
  limit?: number;
  search?: string;
  statesid?: number;
  customerid?: number;
  technicianid?: number;
};

export const createQuote = async (payload: any) => {
  try {
    const { data } = await api.post("/quotes", payload);
    return data;
  } catch (error: any) {
    const backendMessage = error?.response?.data?.message;
    const message = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage;
    console.error("Error al crear la cotización:", {
      status: error?.response?.status,
      message: message ?? error?.message,
      data: error?.response?.data,
    });
    if (message) {
      error.message = message;
    }
    throw error;
  }
};

export const getQuotes = async (params?: GetQuotesParams) => {
  try {
    const { data } = await api.get("/quotes", {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search?.trim() || undefined,
        statesid: params?.statesid,
        customerid: params?.customerid,
        technicianid: params?.technicianid,
      },
    });
    return data;
  } catch (error) {
    console.error("Error al obtener las cotizaciones:", error);
    showError("Error al obtener las cotizaciones");
    throw error;
  }
};

export const getQuoteById = async (id: number) => {
  try {
    const { data } = await api.get(`/quotes/${id}`);
    return data;
  } catch (error) {
    console.error("Error al obtener la cotización:", error);
    showError("Error al obtener la cotización");
    throw error;
  }
};

export const getCustomersForQuote = async (): Promise<any> => {
  try {
    const { data } = await api.get("/customers", {
      params: { includeRelations: true },
    });
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
    console.error("Error al obtener los técnicos:", error);
    showError("Error al obtener los técnicos");
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
    showError("Error al completar la cotización. Inténtalo nuevamente.");
    throw error;
  }
};

export const assignCustomerToQuote = async (
  quoteId: number,
  customerid: number
): Promise<any> => {
  try {
    const { data } = await api.patch(`/quotes/${quoteId}/assign-customer`, {
      customerid,
    });
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.message;
    const fallbackMessage =
      status === 403
        ? "No tienes permisos para asociar cliente a la cotizacion (quotes.update)."
        : "Error al asignar cliente a la cotizacion.";
    const message = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage || fallbackMessage;

    console.error("Error al asignar cliente a la cotizacion:", {
      status,
      message,
      data: error?.response?.data,
    });

    error.message = message;
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
