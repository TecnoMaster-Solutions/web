import { api } from "@/shared/utils/apiClient";
import { IPurchase } from "../Types/Purchase.type";
import { showError } from "@/shared/utils/notifications";

const RETRY_LIMIT = 2;

export type GetPurchasesParams = {
  page?: number;
  limit?: number;
  search?: string;
  signal?: AbortSignal;
};

type PaginatedPurchasesResponse = {
  data: IPurchase[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type ApiErrorShape = {
  name?: string;
  code?: string;
  response?: {
    status?: number;
    data?: { message?: string | string[] };
  };
  message?: string;
};

export type PurchaseProductApi = {
  productid: number;
  productname: string;
  productpriceofsupplier?: number;
  productpriceofsale?: number;
  image?: string;
  stateid?: number;
};

export type PurchaseSupplierApi = {
  supplierid: number;
  name: string;
  image?: string;
  nit?: string;
  contactname?: string;
  phone?: string;
  email?: string;
  address?: string;
  stateid?: number;
};

export const getPurchases = async ({
  page = 1,
  limit = 8,
  search = "",
  signal,
}: GetPurchasesParams = {}): Promise<{
  data: IPurchase[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  let attempt = 0;

  while (attempt <= RETRY_LIMIT) {
    try {
      const { data } = await api.get<PaginatedPurchasesResponse>(
        "/purchasesmanagement",
        {
          params: {
            page,
            limit,
            search: search.trim() || undefined,
          },
          signal,
          timeout: 5000,
          validateStatus: (status) => status >= 200 && status < 500,
        }
      );

      const rows = Array.isArray(data?.data) ? data.data : [];

      return {
        data: rows.map((p: IPurchase) => ({
          ...p,
          amount: Number(p.amount ?? 0),
        })),
        meta: {
          total: Number(data?.meta?.total ?? 0),
          page: Number(data?.meta?.page ?? page),
          limit: Number(data?.meta?.limit ?? limit),
          totalPages: Number(data?.meta?.totalPages ?? 1),
        },
      };
    } catch (error: unknown) {
      const apiError = error as ApiErrorShape | null;
      if (
        apiError?.name === "CanceledError" ||
        apiError?.code === "ERR_CANCELED"
      ) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 1,
          },
        };
      }

      if (apiError?.code === "ECONNABORTED") {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error("La petición expiró. Intente nuevamente.");
        }
        continue;
      }

      if (!apiError?.response) {
        attempt++;
        if (attempt > RETRY_LIMIT) {
          throw new Error(
            "Error de red al intentar cargar compras. Verifique su conexión."
          );
        }
        continue;
      }

      const status = apiError.response.status ?? 0;

      if (status >= 500) {
        throw new Error("El servidor tuvo un problema (500). Intente más tarde.");
      }

      if (status === 404) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 1,
          },
        };
      }

      if (status === 401 || status === 403) {
        throw new Error("No autorizado para consultar compras.");
      }

      console.error("Error cargando compras:", error);
      const backendMessage = apiError?.response?.data?.message;
      throw new Error(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "No se pudo cargar el listado de compras."
      );
    }
  }

  return {
    data: [],
    meta: {
      total: 0,
      page,
      limit,
      totalPages: 1,
    },
  };
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
  } catch (error: unknown) {
    const apiError = error as ApiErrorShape | null;
    console.error("Error completo:", error);
    console.error("STATUS:", apiError?.response?.status);
    console.error("DATA:", apiError?.response?.data);
    console.error("MESSAGE:", apiError?.response?.data?.message);
    throw error;
  }
};

export const cancelPurchase = async (id: number, observation?: string) => {
  try {
    const params: Record<string, string> = {};
    if (observation) params.observation = observation;

    const { data } = await api.post(
      `/purchasesmanagement/${id}/cancel`,
      {},
      { params }
    );

    return data;
  } catch (error: unknown) {
    const apiError = error as ApiErrorShape | null;
    const backendMessage = apiError?.response?.data?.message;
    const message = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage ||
        "Error al anular la compra. Por favor, inténtalo de nuevo.";

    showError(message);
    if (apiError) {
      apiError.message = message;
    }
    throw error;
  }
};

export const getProductsForPurchase = async (): Promise<PurchaseProductApi[]> => {
  const { data } = await api.get<PurchaseProductApi[] | { data?: PurchaseProductApi[] }>("/products");
  return Array.isArray(data) ? data : data.data ?? [];
};

export const getSuppliersForPurchase = async (): Promise<PurchaseSupplierApi[]> => {
  const response = await api.get<PurchaseSupplierApi[] | { data?: PurchaseSupplierApi[] }>("/suppliers");
  return Array.isArray(response.data) ? response.data : response.data.data ?? [];
};

export const getPurchaseOrdersForSupplier = async (
  proveedorId: number,
  estadoId: number
) => {
  const { data } = await api.get("/purchase-orders", {
    params: { proveedorId, estadoId },
  });
  return Array.isArray(data) ? data : [];
};

export const getPurchaseOrderById = async (id: number) => {
  const { data } = await api.get(`/purchase-orders/${id}`);
  return data;
};
