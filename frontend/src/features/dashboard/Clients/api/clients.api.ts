"use client";

import { api } from "@/shared/utils/apiClient";

// ================================
// TYPES FROM BACKEND
// ================================

export type CustomerFromApi = {
  customerid: number;
  customercity: string;
  customerzipcode: string;
  users: {
    userid: number;
    name: string;
    lastname: string;
    email: string;
    documentnumber: string;
    phone: string;
    image?: string | null;
    typeofdocuments?: { id: number; name: string };
    states?: { stateid?: number; id?: number; name: string };
    roles?: { id: number; name: string };
  };
  sales: { salestatus: string }[];
};

// ================================
// UI TYPE
// ================================

export type ClientUI = {
  id: number;
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
};

// ================================
// UI MAPPER
// ================================

export const toUiClient = (c: CustomerFromApi): ClientUI => ({
  id: c.customerid,
  nombre: c.users?.name ?? "",
  apellido: c.users?.lastname ?? "",
  tipo: c.users?.typeofdocuments?.name ?? "",
  tipoId: c.users?.typeofdocuments?.id ?? 0,
  documento: c.users?.documentnumber ?? "",
  telefono: c.users?.phone ?? "",
  correoElectronico: c.users?.email ?? "",
  estado: c.users?.states?.name ?? "",
  ciudad: c.customercity ?? "",
  codigoPostal: c.customerzipcode ?? "",
});

// ================================
// GET ALL
// ================================

export async function getClients(): Promise<ClientUI[]> {
  // El backend devuelve el array directamente (sin envoltorio)
  const response = await api.get<CustomerFromApi[]>("/customers");
  // axios pone la respuesta en response.data — pero nosotros llamamos api.get que ya extrae .data
  // Si el backend envuelve en {data:[...]}, necesitamos acc ese campo extra:
  const list = Array.isArray(response)
    ? response
    : (response as unknown as { data: CustomerFromApi[] }).data ?? [];
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