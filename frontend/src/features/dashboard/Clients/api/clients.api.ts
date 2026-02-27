"use client";

import { api } from "@/shared/utils/apiClient";

// ================================
// TYPES FROM BACKEND
// ================================

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

// ================================
// UI TYPE
// ================================

export type ClientUI = {
  id: number;
  userid: number;
  nombre: string;
  apellido: string;
  /** Nombre del tipo de documento (CC, TI…) */
  tipo: string;
  /** ID numérico del tipo de documento (para pre-seleccionar en edit) */
  tipoId: number;
  documento: string;
  telefono: string;
  correoElectronico: string;
  estado: string;
  ciudad: string;
  codigoPostal: string;
  hasAssociations: boolean;
};

// ================================
// UI MAPPER
// ================================

export const toUiClient = (c: CustomerFromApi): ClientUI => ({
  id: c.customerid,
  userid: c.userid ?? c.users?.userid ?? 0,
  nombre: c.users?.name ?? "",
  apellido: c.users?.lastname ?? "",
  tipo: c.users?.typeofdocuments?.name ?? "",
  tipoId: c.users?.typeofdocuments?.id ?? c.users?.typeofdocuments?.typeofdocumentid ?? c.users?.typeid ?? 0,
  documento: c.users?.documentnumber ?? "",
  telefono: c.users?.phone ?? "",
  correoElectronico: c.users?.email ?? "",
  estado: c.users?.states?.name ?? (c.users?.stateid ? stateLabelMap[c.users.stateid] ?? "" : ""),
  ciudad: c.customercity ?? "",
  codigoPostal: c.customerzipcode ?? "",
  hasAssociations: Boolean(c.hasAssociations),
});

// ================================
// GET ALL
// ================================

export async function getClients(): Promise<ClientUI[]> {
  // El backend devuelve el array directamente (sin envoltorio)
  const response = await api.get<CustomerFromApi[] | { data?: CustomerFromApi[] }>("/customers", {
    params: { includeRelations: true },
  });
  // axios pone la respuesta en response.data — pero nosotros llamamos api.get que ya extrae .data
  // Si el backend envuelve en {data:[...]}, necesitamos acc ese campo extra:
  const list = unwrapList<CustomerFromApi>(response.data);
  return list.map(toUiClient);
}

// ================================
// CREATE
// ================================

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

// ================================
// UPDATE
// ================================

export type UpdateClientPayload = Partial<CreateClientPayload>;

export async function updateClient(
  id: number,
  payload: UpdateClientPayload
) {
  return await api.patch(`/customers/${id}`, payload);
}

// ================================
// DELETE
// ================================

export async function deleteClient(id: number) {
  return await api.delete(`/customers/${id}`);
}
