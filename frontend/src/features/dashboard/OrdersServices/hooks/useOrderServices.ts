import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const orderServiceKeys = {
  all: ['ordersServices'] as const,
  list: () => [...orderServiceKeys.all, 'list'] as const,
  detail: (id: number) => [...orderServiceKeys.all, 'detail', id] as const,
};

export const orderServiceHistoryKeys = {
  list: (id: number) => [...orderServiceKeys.detail(id), 'history'] as const,
};

export interface OrderServiceDTO {
  ordersservicesid: number;
  description: string;
  direccion?: string | null;
  total: number;
  client?: {
    customerid: number;
    userid: number;
    customerzipcode?: string | null;
    customercity?: string | null;
    users?: {
      userid?: number;
      name?: string | null;
      lastname?: string | null;
    };
  };
  state?: {
    stateid: number;
    name: string;
    description?: string | null;
  };
  fechainicio: string;
  fechafin: string;
  horainicio: string;
  horafin: string;
  createdat?: string;
  updatedat?: string;
  technicians?: Array<{
    technicianid: number;
    userid?: number;
    users?: {
      name?: string | null;
      lastname?: string | null;
    };
    CV?: string | null;
  }>;
  products?: Array<{
    ordersservicesproductsid: number;
    cantidad: number;
    subtotal?: number;
    product?: {
      productid: number;
      productname: string;
      productpriceofsale?: number;
      productcode?: string;
      productdescription?: string;
      image?: string | null;
    };
  }>;
  files?: string[];
}

export interface OrderServiceHistoryEntry {
  ordersserviceshistoryid: number;
  action: string;
  actionlabel: string;
  description: string | null;
  payload: any;
  actoruserid: number | null;
  createdat: string;
}

export interface UpdateOrderServicePayload {
  fechainicio: string;
  fechafin: string;
  horainicio: string;
  horafin: string;
}

export async function listOrderServices(): Promise<OrderServiceDTO[]> {
  const res = await api.get('/orders-services');
  return Array.isArray(res.data) ? res.data : [];
}

export async function patchOrderService(id: number, payload: UpdateOrderServicePayload) {
  const res = await api.patch(`/orders-services/${id}`, payload);
  return res.data;
}

export function useOrderServices() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: orderServiceKeys.list(),
    queryFn: listOrderServices,
  });

  const updateOrderService = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateOrderServicePayload }) =>
      patchOrderService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderServiceKeys.list() });
    },
  });

  return { ...query, updateOrderService };
}

export async function getOrderServiceDetail(id: number): Promise<OrderServiceDTO> {
  const res = await api.get(`/orders-services/${id}`);
  return res.data;
}

export async function getOrderServiceHistory(id: number): Promise<OrderServiceHistoryEntry[]> {
  const res = await api.get(`/orders-services/${id}/history`);
  return Array.isArray(res.data) ? res.data : [];
}

export function useOrderServiceDetail(id?: number) {
  const normalizedId = Number(id);
  const canFetch = Number.isFinite(normalizedId) && normalizedId > 0;
  return useQuery({
    queryKey: orderServiceKeys.detail(canFetch ? normalizedId : -1),
    queryFn: () => getOrderServiceDetail(normalizedId),
    enabled: canFetch,
  });
}

export function useOrderServiceHistory(id?: number) {
  const normalizedId = Number(id);
  const canFetch = Number.isFinite(normalizedId) && normalizedId > 0;
  return useQuery({
    queryKey: orderServiceHistoryKeys.list(canFetch ? normalizedId : -1),
    queryFn: () => getOrderServiceHistory(normalizedId),
    enabled: canFetch,
  });
}
