import { apiClient } from "@/shared/utils/apiClient";
import type { SupplierDTO } from "@/features/dashboard/suppliers/types/Supplier.type";

type ApiEnvelope<T> = T | { data: T };

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

export type ListSuppliersParams = {
  page: number;
  limit: number;
  search?: string;
  stateid?: number;
};

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
  productos?: Array<{
    productoId: number;
    precioUnitario: number;
  }>;
};

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export async function listSuppliers(): Promise<SupplierDTO[]>;
export async function listSuppliers(
  params: ListSuppliersParams
): Promise<PaginatedResponse<SupplierDTO>>;
export async function listSuppliers(
  params?: ListSuppliersParams
): Promise<PaginatedResponse<SupplierDTO> | SupplierDTO[]> {
  const response = await apiClient.get<ApiEnvelope<SupplierDTO[]> | PaginatedResponse<SupplierDTO>>(
    "/suppliers",
    {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search?.trim() || undefined,
        stateid: params?.stateid,
      },
    }
  );
  if (params?.page !== undefined || params?.limit !== undefined) {
    return response as PaginatedResponse<SupplierDTO>;
  }
  return unwrapData(response as ApiEnvelope<SupplierDTO[]>);
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

/**
 * Obtiene los productos asociados a un proveedor
 */
export async function getSupplierProducts(supplierId: number) {
  const response = await apiClient.get<ApiEnvelope<Array<{
    id: number;
    productName: string;
    precioUnitario: number;
    image: string;
  }>>>(`/suppliers/${supplierId}/products`);
  return unwrapData(response);
}

export async function getSuppliers(): Promise<SupplierDTO[]> {
  return listSuppliers();
}

export type { SupplierDTO };
