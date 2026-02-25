'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  SupplierDTO,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '@/features/dashboard/suppliers/services/suppliers.service';

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: () => ['suppliers'] as const,
  detail: (id: number) => ['suppliers', id] as const,
};

export function useSuppliers() {
  return useQuery<SupplierDTO[]>({
    queryKey: supplierKeys.list(),
    queryFn: listSuppliers,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.list() }),
  });
}

export function useUpdateSupplier(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSupplierInput) => updateSupplier(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.list() });
      qc.invalidateQueries({ queryKey: supplierKeys.detail(id) });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.list() }),
  });
}
