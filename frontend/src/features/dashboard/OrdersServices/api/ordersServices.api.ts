import { api } from "@/lib/api";
import type {
  AddOrderFileDto,
  AddProductToOrderDto,
  AddWorklogDto,
  AssignTechniciansDto,
  CreateOrdersServiceDto,
  FinishOrderDto,
  OrderServiceDTO,
  OrdersServiceHistoryItem,
  RemoveFileDto,
  ReprogramOrderDto,
} from "../types/ordersServices.types";

const BASE = "orders-services";
const IN_PROCESS_STATE_ID = 7;

function parseOrderStartAt(order: OrderServiceDTO): Date | null {
  const datePart = String(order.fechainicio ?? "").trim();
  const timeRaw = String(order.horainicio ?? "").trim();
  if (!datePart || !timeRaw) return null;

  const timeParts = timeRaw.split(":");
  if (timeParts.length < 2) return null;
  const hh = timeParts[0]?.padStart(2, "0") ?? "00";
  const mm = timeParts[1]?.padStart(2, "0") ?? "00";
  const ss = (timeParts[2] ?? "00").padStart(2, "0");

  const parsed = new Date(`${datePart}T${hh}:${mm}:${ss}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isFinalOrderState(order: OrderServiceDTO): boolean {
  const stateId = Number(order.state?.stateid ?? 0);
  if (stateId === 4 || stateId === 6 || stateId === IN_PROCESS_STATE_ID) return true;

  const stateName = String(order.state?.name ?? "").toLowerCase();
  return (
    stateName.includes("cancel") ||
    stateName.includes("anul") ||
    stateName.includes("final") ||
    stateName.includes("complet") ||
    stateName.includes("proceso")
  );
}

function shouldAutoMoveToInProcess(order: OrderServiceDTO, now = new Date()): boolean {
  if (isFinalOrderState(order)) return false;
  const startsAt = parseOrderStartAt(order);
  if (!startsAt) return false;
  return startsAt.getTime() <= now.getTime();
}

export async function createOrderService(
  dto: CreateOrdersServiceDto
): Promise<OrderServiceDTO> {
  const payload: CreateOrdersServiceDto = {
    ...dto,
    stateid: dto.stateid ?? 5,
  };
  const { data } = await api.post<OrderServiceDTO>(BASE, payload);
  return data;
}

export async function fetchOrdersServices(): Promise<OrderServiceDTO[]> {
  const { data } = await api.get<OrderServiceDTO[]>(BASE);
  const dueOrders = data.filter((order) => shouldAutoMoveToInProcess(order));
  if (!dueOrders.length) return data;

  const updates = await Promise.allSettled(
    dueOrders.map((order) =>
      updateOrderService(order.ordersservicesid, { stateid: IN_PROCESS_STATE_ID })
    )
  );

  const updatedById = new Map<number, OrderServiceDTO>();
  updates.forEach((res) => {
    if (res.status === "fulfilled") {
      updatedById.set(res.value.ordersservicesid, res.value);
    }
  });

  return data.map((order) => updatedById.get(order.ordersservicesid) ?? order);
}

export async function fetchOrderServiceById(id: number): Promise<OrderServiceDTO> {
  const { data } = await api.get<OrderServiceDTO>(`${BASE}/${id}`);
  if (!shouldAutoMoveToInProcess(data)) return data;
  return updateOrderService(id, { stateid: IN_PROCESS_STATE_ID });
}

export async function fetchOrderServiceHistory(
  id: number,
  type?: "SYSTEM" | "TECH"
): Promise<OrdersServiceHistoryItem[]> {
  const { data } = await api.get<OrdersServiceHistoryItem[]>(
    `${BASE}/${id}/history`,
    { params: type ? { type } : undefined }
  );
  return data;
}

export async function addOrderServiceWorklog(
  id: number,
  dto: AddWorklogDto
): Promise<OrdersServiceHistoryItem> {
  const { data } = await api.post<OrdersServiceHistoryItem>(
    `${BASE}/${id}/history`,
    dto
  );
  return data;
}

export type OrderServicePatch = Partial<OrderServiceDTO> & { stateid?: number };

export async function updateOrderService(
  id: number,
  patch: OrderServicePatch
): Promise<OrderServiceDTO> {
  const { data } = await api.patch<OrderServiceDTO>(`${BASE}/${id}`, patch);
  return data;
}

export async function cancelOrderService(id: number): Promise<OrderServiceDTO> {
  return updateOrderService(id, { stateid: 4 });
}

export async function deleteOrderService(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function reprogramOrderService(
  id: number,
  dto: ReprogramOrderDto
): Promise<OrderServiceDTO> {
  const { data } = await api.patch<OrderServiceDTO>(`${BASE}/${id}/reprogram`, dto);
  return data;
}

export async function finishOrderService(
  id: number,
  dto: FinishOrderDto
): Promise<OrderServiceDTO> {
  const { data } = await api.patch<OrderServiceDTO>(`${BASE}/${id}/finish`, dto);
  return data;
}

export async function assignTechniciansToOrderService(
  id: number,
  dto: AssignTechniciansDto
): Promise<OrderServiceDTO> {
  const { data } = await api.patch<OrderServiceDTO>(`${BASE}/${id}/technicians`, dto);
  return data;
}

export async function addProductToOrderService(
  id: number,
  dto: AddProductToOrderDto
): Promise<OrderServiceDTO> {
  const { data } = await api.post<OrderServiceDTO>(`${BASE}/${id}/products`, dto);
  return data;
}

export type UpdateProductLineDto = { cantidad: number };

export async function updateProductLine(
  id: number,
  productId: number,
  dto: UpdateProductLineDto
): Promise<OrderServiceDTO> {
  const { data } = await api.patch<OrderServiceDTO>(
    `${BASE}/${id}/products/${productId}`,
    dto
  );
  return data;
}

export async function removeProductFromOrderService(
  id: number,
  productId: number
): Promise<OrderServiceDTO> {
  const { data } = await api.delete<OrderServiceDTO>(`${BASE}/${id}/products/${productId}`);
  return data;
}

export type AddServiceToOrderDto = { serviceid: number; cantidad: number; unitprice?: number; precio?: number };
export type UpdateServiceLineDto = { cantidad: number; unitprice?: number | null };

export async function addServiceToOrderService(
  id: number,
  dto: AddServiceToOrderDto
): Promise<OrderServiceDTO> {
  const { data } = await api.post<OrderServiceDTO>(`${BASE}/${id}/services`, dto);
  return data;
}

export async function updateServiceLine(
  id: number,
  serviceId: number,
  dto: UpdateServiceLineDto
): Promise<OrderServiceDTO> {
  const { data } = await api.patch<OrderServiceDTO>(
    `${BASE}/${id}/services/${serviceId}`,
    dto
  );
  return data;
}

export async function removeServiceFromOrderService(
  id: number,
  serviceId: number
): Promise<OrderServiceDTO> {
  const { data } = await api.delete<OrderServiceDTO>(`${BASE}/${id}/services/${serviceId}`);
  return data;
}

export async function addOrderFile(id: number, dto: AddOrderFileDto): Promise<OrderServiceDTO> {
  const { data } = await api.post<OrderServiceDTO>(`${BASE}/${id}/files`, dto);
  return data;
}

export async function removeOrderFileByIndex(id: number, index: number): Promise<OrderServiceDTO> {
  const { data } = await api.delete<OrderServiceDTO>(`${BASE}/${id}/files/index/${index}`);
  return data;
}

export async function removeOrderFile(id: number, dto: RemoveFileDto): Promise<OrderServiceDTO> {
  const { data } = await api.request<OrderServiceDTO>({
    url: `${BASE}/${id}/files`,
    method: "DELETE",
    data: dto,
  });
  return data;
}

export async function removeOrderFileByUrl(id: number, url: string): Promise<OrderServiceDTO> {
  return removeOrderFile(id, { url });
}

export async function markOrderServiceWarranty(id: number): Promise<OrderServiceDTO> {
  const { data } = await api.patch<OrderServiceDTO>(`${BASE}/${id}/warranty/mark`, {});
  return data;
}

export type ReportWarrantyPayload = {
  label?: string;
  details: string;
  notifiedClient?: boolean;
  reportedByUserId?: number;
};

export async function reportOrderServiceWarranty(
  id: number,
  dto: ReportWarrantyPayload
): Promise<OrderServiceDTO> {
  const { data } = await api.patch<OrderServiceDTO>(`${BASE}/${id}/warranty/report`, dto);
  return data;
}
