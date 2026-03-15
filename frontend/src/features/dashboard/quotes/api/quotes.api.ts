import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";
import {
  IQuote,
  QuoteCreatePayload,
  ServiceRequest,
} from "../types/Quote.type";

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

export type QuoteCompletionResponse = {
  sale?: {
    salecode?: string;
    saleid?: number;
  };
};

export type QuoteCustomerApi = {
  customerid?: number;
  id?: number;
  users?: {
    name?: string;
    lastname?: string;
    documentnumber?: string;
    documentNumber?: string;
  };
  user?: {
    name?: string;
    lastname?: string;
    documentnumber?: string;
    documentNumber?: string;
  };
  name?: string;
  lastname?: string;
  documentnumber?: string;
  documentNumber?: string;
};

export type QuoteTechnicianApi = {
  technicianid?: number;
  id?: number;
  users?: {
    name?: string;
    lastname?: string;
  };
};

export type QuoteProductApi = {
  productid?: number;
  id?: number;
  productname?: string;
  name?: string;
  productdescription?: string | null;
  productpriceofsale?: number;
  priceofsale?: number;
  productstock?: number;
  stock?: number;
  isactive?: boolean;
};

export type QuoteServiceRequestApi = ServiceRequest & {
  stateId?: number;
};

type ApiErrorShape = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string | string[];
    };
  };
};

const getErrorDetails = (
  error: unknown,
  fallback: string,
): { message: string; status?: number; data?: unknown } => {
  const apiError = error as ApiErrorShape;
  const backendMessage = apiError.response?.data?.message;
  const message = Array.isArray(backendMessage)
    ? backendMessage.join(", ")
    : backendMessage || apiError.message || fallback;

  return {
    message,
    status: apiError.response?.status,
    data: apiError.response?.data,
  };
};

export const createQuote = async (
  payload: QuoteCreatePayload,
): Promise<IQuote> => {
  try {
    const { data } = await api.post<IQuote>("/quotes", payload);
    return data;
  } catch (error: unknown) {
    const { message, status, data } = getErrorDetails(
      error,
      "Error al crear la cotizacion.",
    );
    console.error("Error al crear la cotizacion:", {
      status,
      message,
      data,
    });
    const finalError = error as ApiErrorShape;
    finalError.message = message;
    throw finalError;
  }
};

export const getQuotes = async (
  params?: GetQuotesParams,
): Promise<PaginatedResponse<IQuote> | IQuote[]> => {
  try {
    const { data } = await api.get<PaginatedResponse<IQuote> | IQuote[]>(
      "/quotes",
      {
        params: {
          page: params?.page,
          limit: params?.limit,
          search: params?.search?.trim() || undefined,
          statesid: params?.statesid,
          customerid: params?.customerid,
          technicianid: params?.technicianid,
        },
      },
    );
    return data;
  } catch (error) {
    console.error("Error al obtener las cotizaciones:", error);
    showError("Error al obtener las cotizaciones");
    throw error;
  }
};

export const getQuoteById = async (id: number): Promise<IQuote> => {
  try {
    const { data } = await api.get<IQuote>(`/quotes/${id}`);
    return data;
  } catch (error) {
    console.error("Error al obtener la cotizacion:", error);
    showError("Error al obtener la cotizacion");
    throw error;
  }
};

export const getCustomersForQuote = async (): Promise<
  QuoteCustomerApi[] | { data?: QuoteCustomerApi[] }
> => {
  try {
    const { data } = await api.get<QuoteCustomerApi[] | { data?: QuoteCustomerApi[] }>(
      "/customers",
      {
        params: { includeRelations: true },
      },
    );
    return data;
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
    showError("Error al obtener los clientes");
    throw error;
  }
};

export const getTechniciansForQuote = async (): Promise<
  QuoteTechnicianApi[]
> => {
  try {
    const { data } = await api.get<QuoteTechnicianApi[]>("/technicians");
    return data;
  } catch (error) {
    console.error("Error al obtener los tecnicos:", error);
    showError("Error al obtener los tecnicos");
    throw error;
  }
};

export const getProductsForQuote = async (): Promise<QuoteProductApi[]> => {
  try {
    const { data } = await api.get<QuoteProductApi[]>("/products");
    return data;
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    showError("Error al obtener los productos");
    throw error;
  }
};

export const getServicesRequestsForQuote = async (): Promise<
  QuoteServiceRequestApi[]
> => {
  try {
    const { data } = await api.get<QuoteServiceRequestApi[]>("/service-requests");
    return data.filter((request) => request.stateId === 11);
  } catch (error) {
    console.error("Error al obtener las solicitudes de servicio:", error);
    showError("Error al obtener las solicitudes de servicio");
    throw error;
  }
};

export const approveQuote = async (quoteId: number): Promise<void> => {
  try {
    await api.patch(`/quotes/${quoteId}/approve`);
  } catch (error) {
    console.error("Error al aprobar la cotizacion:", error);
    showError("Error al aprobar la cotizacion. Intentalo nuevamente.");
    throw error;
  }
};

export const completeQuote = async (
  quoteId: number,
): Promise<QuoteCompletionResponse> => {
  try {
    const { data } = await api.patch<QuoteCompletionResponse>(
      `/quotes/${quoteId}/complete`,
    );
    return data;
  } catch (error) {
    showError("Error al completar la cotizacion. Intentalo nuevamente.");
    throw error;
  }
};

export const assignCustomerToQuote = async (
  quoteId: number,
  customerid: number,
): Promise<IQuote> => {
  try {
    const { data } = await api.patch<IQuote>(
      `/quotes/${quoteId}/assign-customer`,
      {
        customerid,
      },
    );
    return data;
  } catch (error: unknown) {
    const fallbackMessage =
      (error as ApiErrorShape).response?.status === 403
        ? "No tienes permisos para asociar cliente a la cotizacion (quotes.update)."
        : "Error al asignar cliente a la cotizacion.";
    const { message, status, data } = getErrorDetails(error, fallbackMessage);

    console.error("Error al asignar cliente a la cotizacion:", {
      status,
      message,
      data,
    });

    const finalError = error as ApiErrorShape;
    finalError.message = message;
    throw finalError;
  }
};

export const revokeQuote = async (
  quoteId: number,
  observation?: string,
): Promise<void> => {
  try {
    await api.patch(`/quotes/${quoteId}/cancel`, {
      observation: observation ?? null,
    });
  } catch (error) {
    console.error("Error al revocar la cotizacion:", error);
    showError("Error al revocar la cotizacion. Intentalo nuevamente.");
    throw error;
  }
};

export const cancelQuote = async (quoteId: number): Promise<void> => {
  try {
    await api.patch(`/quotes/${quoteId}/cancel-client`);
  } catch (error) {
    console.error("Error al cancelar la cotizacion:", error);
    showError("Error al cancelar la cotizacion. Intentalo nuevamente.");
    throw error;
  }
};
