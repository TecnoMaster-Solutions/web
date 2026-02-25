import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { ISale } from "../types/sales.type";

export const getSales = async (signal?: AbortSignal): Promise<ISale[]> => {
  const { data } = await api.get<ISale[]>("/sales", {
    signal,
    timeout: 4000,
  });
  return data;
};

export const getCustomersForSale = async (): Promise<any[]> => {
  try {
    const { data } = await api.get<any[]>("/customers", {
      params: { includeRelations: true },
    });
    return data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("Error al obtener los clientes:", error.response?.data ?? error);
      const message =
        (error.response?.data as any)?.message ??
        (error.response?.data as any)?.error ??
        error.message ??
        "No se pudo cargar el listado de clientes.";
      throw new Error(message);
    }
    console.error("Error al obtener los clientes:", error);
    throw new Error("No se pudo cargar el listado de clientes.");
  }
};

export const getProductsForSale = async (): Promise<any[]> => {
  try {
    const { data } = await api.get<any[]>("/products", {
      params: { status: "active" },
    });
    return data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("Error al obtener los productos:", error.response?.data ?? error);
      const message =
        (error.response?.data as any)?.message ??
        (error.response?.data as any)?.error ??
        error.message ??
        "No se pudo cargar el listado de productos.";
      throw new Error(message);
    }
    console.error("Error al obtener los productos:", error);
    throw new Error("No se pudo cargar el listado de productos.");
  }
};

export const createSale = async (sale: Partial<ISale>) => {
  try {
    const { data } = await api.post("/sales", sale);
    return data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("Error al crear la venta:", error.response?.data ?? error);
      const message =
        (error.response?.data as any)?.message ??
        (error.response?.data as any)?.error ??
        error.message ??
        "No se pudo crear la venta.";
      throw new Error(message);
    }
    console.error("Error al crear la venta:", error);
    throw new Error("No se pudo crear la venta.");
  }
};

export const cancelSale = async (id: number, observation: string) => {
  try {
    const { data } = await api.patch(`/sales/${id}/cancel`, {
      observation,
    });
    return data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("Error al cancelar la venta:", error.response?.data ?? error);
      const message =
        (error.response?.data as any)?.message ??
        (error.response?.data as any)?.error ??
        error.message ??
        "No se pudo cancelar la venta.";
      throw new Error(message);
    }
    console.error("Error al cancelar la venta:", error);
    throw new Error("No se pudo cancelar la venta.");
  }
};

export const completeSale = async (id: number) => {
  try {
    const { data } = await api.patch(`/sales/${id}`, { salestatus: "Completed" });
    return data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("Error al completar la venta:", error.response?.data ?? error);
      const message =
        (error.response?.data as any)?.message ??
        (error.response?.data as any)?.error ??
        error.message ??
        "No se pudo completar la venta.";
      throw new Error(message);
    }
    console.error("Error al completar la venta:", error);
    throw new Error("No se pudo completar la venta.");
  }
};

export const getSaleById = async (id: number): Promise<ISale> => {
  try {
    const { data } = await api.get(`/sales/${id}`);
    return data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("Error al obtener la venta:", error.response?.data ?? error);
    } else {
      console.error("Error al obtener la venta:", error);
    }
    throw error;
  }
};
