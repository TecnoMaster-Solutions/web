'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  PaginatedResponse,
  SupplierDTO,
  CreateSupplierInput,
  UpdateSupplierInput,
  ListSuppliersParams,
} from '@/features/dashboard/suppliers/services/suppliers.service';

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: (params?: ListSuppliersParams) => ['suppliers', params] as const,
  detail: (id: number) => ['suppliers', id] as const,
};

export function useSuppliers(params?: ListSuppliersParams) {
  return useQuery<PaginatedResponse<SupplierDTO>>({
    queryKey: supplierKeys.list(params),
    queryFn: async () => {
      if (params) {
        return listSuppliers(params);
      }

      const data = await listSuppliers();
      return {
        data,
        meta: {
          total: data.length,
          page: 1,
          limit: data.length || 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    },
  });
}

export function useSupplier(id: number | null) {
  return useQuery<SupplierDTO>({
    queryKey: id != null ? supplierKeys.detail(id) : supplierKeys.detail(-1),
    queryFn: () => getSupplier(id as number),
    enabled: id != null,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupplierInput) => createSupplier(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useUpdateSupplier(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSupplierInput) => updateSupplier(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      qc.invalidateQueries({ queryKey: supplierKeys.detail(id) });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}
