"use client";

import { api } from "@/shared/utils/apiClient";
import { ClientsPaginatedResult } from "../types/typeClients";

export type CustomerFromApi = {
  customerid: number;
  userid?: number;
  customercity: string;
  customerzipcode: string;
  hasAssociations?: boolean;
  users?: {
    userid: number;
    name: string;
    lastname: string;
    email: string;
    documentnumber: string;
    phone: string;
    typeid?: number;
    stateid?: number;
    image?: string | null;
    typeofdocuments?: { id?: number; typeofdocumentid?: number; name: string };
    states?: { stateid?: number; id?: number; name: string };
    roles?: { id: number; name: string };
  };
  sales: { salestatus: string }[];
};

const stateLabelMap: Record<number, string> = {
  1: "Activo",
  2: "Inactivo",
};

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    const nested = (payload as { data?: unknown }).data;
    return Array.isArray(nested) ? (nested as T[]) : [];
  }
  return [];
}

function asPaginatedList<T>(
  payload: unknown,
): { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } } | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as {
    data?: unknown;
    meta?: {
      page?: unknown;
      limit?: unknown;
      total?: unknown;
      totalPages?: unknown;
    };
  };

  if (!Array.isArray(root.data) || !root.meta || typeof root.meta !== "object") {
    return null;
  }

  return {
    data: root.data as T[],
    meta: {
      page: Number(root.meta.page ?? 1),
      limit: Number(root.meta.limit ?? 5),
      total: Number(root.meta.total ?? 0),
      totalPages: Number(root.meta.totalPages ?? 1),
    },
  };
}

export type ClientUI = {
  id: number;
  userid: number;
  nombre: string;
  apellido: string;
  tipo: string;
  tipoId: number;
  documento: string;
  telefono: string;
  correoElectronico: string;
  estado: string;
  ciudad: string;
  codigoPostal: string;
  hasAssociations: boolean;
};

export const toUiClient = (c: CustomerFromApi): ClientUI => ({
  id: c.customerid,
  userid: c.userid ?? c.users?.userid ?? 0,
  nombre: c.users?.name ?? "",
  apellido: c.users?.lastname ?? "",
  tipo: c.users?.typeofdocuments?.name ?? "",
  tipoId:
    c.users?.typeofdocuments?.id ??
    c.users?.typeofdocuments?.typeofdocumentid ??
    c.users?.typeid ??
    0,
  documento: c.users?.documentnumber ?? "",
  telefono: c.users?.phone ?? "",
  correoElectronico: c.users?.email ?? "",
  estado: c.users?.states?.name ?? (c.users?.stateid ? stateLabelMap[c.users.stateid] ?? "" : ""),
  ciudad: c.customercity ?? "",
  codigoPostal: c.customerzipcode ?? "",
  hasAssociations: Boolean(c.hasAssociations),
});

type GetClientsParams = {
  signal?: AbortSignal;
  page?: number;
  limit?: number;
  search?: string;
  order?: "ASC" | "DESC";
};

const EMPTY_PAGINATION = {
  page: 1,
  limit: 5,
  total: 0,
  totalPages: 1,
};

export function getClients(): Promise<ClientUI[]>;
export function getClients(params: GetClientsParams): Promise<ClientUI[] | ClientsPaginatedResult>;
export async function getClients({
  signal,
  page,
  limit,
  search,
  order = "DESC",
}: GetClientsParams = {}): Promise<ClientUI[] | ClientsPaginatedResult> {
  const shouldPaginate = Number.isInteger(page) && Number.isInteger(limit);

  try {
    const response = await api.get<
      CustomerFromApi[] | { data?: CustomerFromApi[] } | { data: CustomerFromApi[]; meta: unknown }
    >("/customers", {
      params: {
        includeRelations: true,
        order: order,
        ...(shouldPaginate ? { page, limit } : {}),
        ...(search?.trim() ? { search: search.trim() } : {}),
      },
      signal,
      timeout: 5000,
      validateStatus: (s) => s >= 200 && s < 500,
    });

    const paginated = asPaginatedList<CustomerFromApi>(response.data);
    if (paginated) {
      return {
        data: paginated.data.map(toUiClient),
        meta: {
          page: Number(paginated.meta.page ?? page ?? 1),
          limit: Number(paginated.meta.limit ?? limit ?? 5),
          total: Number(paginated.meta.total ?? paginated.data.length),
          totalPages: Number(paginated.meta.totalPages ?? 1),
        },
      };
    }

    const list = unwrapList<CustomerFromApi>(response.data);
    if (shouldPaginate) {
      return {
        data: list.map(toUiClient),
        meta: {
          page: page ?? 1,
          limit: limit ?? 5,
          total: list.length,
          totalPages: 1,
        },
      };
    }

    return list.map(toUiClient);
  } catch (error: any) {
    if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
      return shouldPaginate
        ? {
          data: [],
          meta: {
            page: page ?? EMPTY_PAGINATION.page,
            limit: limit ?? EMPTY_PAGINATION.limit,
            total: EMPTY_PAGINATION.total,
            totalPages: EMPTY_PAGINATION.totalPages,
          },
        }
        : [];
    }

    if (error?.response?.status === 404) {
      return shouldPaginate
        ? {
          data: [],
          meta: {
            page: page ?? EMPTY_PAGINATION.page,
            limit: limit ?? EMPTY_PAGINATION.limit,
            total: EMPTY_PAGINATION.total,
            totalPages: EMPTY_PAGINATION.totalPages,
          },
        }
        : [];
    }

    throw error;
  }
}

export type CreateClientPayload = {
  name: string;
  lastname: string;
  email: string;
  documentnumber: string;
  phone: string;
  typeid: number;
  stateid?: number;
  image?: string;
  customercity: string;
  customerzipcode: string;
};

export async function createClient(payload: CreateClientPayload) {
  return await api.post("/customers", payload);
}

export type UpdateClientPayload = Partial<CreateClientPayload>;

export async function updateClient(id: number, payload: UpdateClientPayload) {
  return await api.patch(`/customers/${id}`, payload);
}

export async function deleteClient(id: number) {
  return await api.delete(`/customers/${id}`);
}
