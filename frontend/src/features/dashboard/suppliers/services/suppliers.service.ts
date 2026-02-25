import { apiClient } from "@/shared/utils/apiClient";
import type { SupplierDTO } from "@/features/dashboard/suppliers/types/Supplier.type";

type ApiEnvelope<T> = T | { data: T };

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload as T;
}

export type ISupplier = SupplierDTO;

export type CreateSupplierInput = {
  name: string;
  nit: string;
  phone: string;
  email: string;
  address: string;
  stateid: number;
  contactname: string;
  image: string;
  rating: number;
};

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export async function listSuppliers(): Promise<SupplierDTO[]> {
  const response = await apiClient.get<ApiEnvelope<SupplierDTO[]>>("/suppliers");
  return unwrapData(response);
}

export async function getSupplier(id: number): Promise<SupplierDTO> {
  const response = await apiClient.get<ApiEnvelope<SupplierDTO>>(`/suppliers/${id}`);
  return unwrapData(response);
}

export async function createSupplier(
  payload: CreateSupplierInput
): Promise<SupplierDTO> {
  const response = await apiClient.post<ApiEnvelope<SupplierDTO>>("/suppliers", payload);
  return unwrapData(response);
}

export async function updateSupplier(
  id: number,
  payload: UpdateSupplierInput
): Promise<SupplierDTO> {
  const response = await apiClient.patch<ApiEnvelope<SupplierDTO>>(
    `/suppliers/${id}`,
    payload
  );
  return unwrapData(response);
}

export async function deleteSupplier(id: number): Promise<void> {
  await apiClient.delete<unknown>(`/suppliers/${id}`);
}

export const getSuppliers = listSuppliers;

export type { SupplierDTO };
