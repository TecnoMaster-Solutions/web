import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listServiceRequests,
  getServiceRequest,
  createServiceRequest,
  updateServiceRequest,
  deleteServiceRequest,
  type ServiceRequestDTO,
  type CreateServiceRequestInput,
  type UpdateServiceRequestInput,
} from "@/features/dashboard/requests/services/servicerequests.service";

export const serviceRequestKeys = {
  all: ["requests"] as const,
  list: () => [...serviceRequestKeys.all, "list"] as const,
  detail: (id: number) => [...serviceRequestKeys.all, "detail", id] as const,
};

export function useServiceRequests() {
  return useQuery({
    queryKey: serviceRequestKeys.list(),
    queryFn: async () => {
      const res = await listServiceRequests();
      const requests = Array.isArray(res) ? res : [];
      return [...requests].sort((a, b) => {
        const idA = Number(a.serviceRequestId ?? a.servicerequestid ?? a.id ?? 0);
        const idB = Number(b.serviceRequestId ?? b.servicerequestid ?? b.id ?? 0);
        return idB - idA;
      });
    },
  });
}

export function useServiceRequest(id: number, enabled = true) {
  return useQuery({
    queryKey: serviceRequestKeys.detail(id),
    queryFn: async () => {
      const res = await getServiceRequest(id);
      return res as ServiceRequestDTO;
    },
    enabled,
  });
}

export function useCreateServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateServiceRequestInput) => createServiceRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceRequestKeys.list() });
    },
  });
}

export function useUpdateServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: number; payload: UpdateServiceRequestInput }) =>
      updateServiceRequest(vars.id, vars.payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: serviceRequestKeys.list() });
      if (vars?.id) qc.invalidateQueries({ queryKey: serviceRequestKeys.detail(vars.id) });
    },
  });
}

export function useDeleteServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await deleteServiceRequest(id);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceRequestKeys.list() });
    },
  });
}
