import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from "@/features/dashboard/suppliers/services/suppliers.service";
import type { SupplierDTO } from "@/features/dashboard/suppliers/types/Supplier.type";
import type { CreateSupplierInput, UpdateSupplierInput } from "@/features/dashboard/suppliers/services/suppliers.service";

export const supplierKeys = {
  all: ["suppliers"] as const,
  list: () => [...supplierKeys.all, "list"] as const,
  detail: (id: number) => [...supplierKeys.all, "detail", id] as const,
};

export function useSuppliers() {
  return useQuery({
    queryKey: supplierKeys.list(),
    queryFn: async () => {
      const res = await listSuppliers();
      return res as SupplierDTO[];
    },
  });
}

export function useSupplier(id: number, enabled = true) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: async () => {
      const res = await getSupplier(id);
      return res as SupplierDTO | null;
    },
    enabled,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSupplierInput) => {
      const res = await createSupplier(payload);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.list() });
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: number; payload: UpdateSupplierInput }) => {
      const res = await updateSupplier(vars.id, vars.payload);
      return res;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: supplierKeys.list() });
      if (vars?.id) qc.invalidateQueries({ queryKey: supplierKeys.detail(vars.id) });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await deleteSupplier(id);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.list() });
    },
  });
}
