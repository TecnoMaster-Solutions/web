import type { OrderServiceDTO } from "../../OrdersServices/types/ordersServices.types";
import type { ServiceRequestDTO } from "@/features/dashboard/requests/services/servicerequests.service";
import { getStateLabel } from "../helpers/appointmentState.helpers";

type BaseAppointmentEvent = {
  id: number;
  start: Date;
  end: Date;
  title: string;
  clientLabel: string;
  stateLabel: string;
};

export type OrderAppointmentEvent = BaseAppointmentEvent & {
  order: OrderServiceDTO;
  request?: undefined;
  source: "order";
};

export type RequestAppointmentEvent = BaseAppointmentEvent & {
  request: ServiceRequestDTO;
  order?: undefined;
  source: "request";
};

export type AppointmentEvent = OrderAppointmentEvent | RequestAppointmentEvent;

export type AppointmentPalette = {
  background: string;
  border: string;
  text: string;
};

const normalizeTimeValue = (value?: string | null) => {
  const trimmed = (value ?? "").trim();
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{1,2}$/.test(trimmed)) return `${trimmed.padStart(2, "0")}:00:00`;
  return "00:00:00";
};

const parseDateTime = (date?: string | null, time?: string | null): Date | null => {
  if (!date) return null;
  const cleanDate = date.trim();
  if (cleanDate.includes("T")) {
    const parsed = new Date(cleanDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const normalizedTime = normalizeTimeValue(time);
  const iso = `${cleanDate}T${normalizedTime}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const buildClientLabel = (client?: OrderServiceDTO["client"]) => {
  if (!client) return "Cliente sin asignar";
  const names = [client.users?.name, client.users?.lastname].filter(Boolean).join(" ").trim();
  const city = client.customercity ? ` • ${client.customercity}` : "";
  if (names) return `${names}${city}`;
  const fallbackId = client.customerid ?? client.userid;
  if (fallbackId) return `Cliente #${fallbackId}${city}`;
  return `Cliente sin nombre${city}`;
};

const buildTitle = (order: OrderServiceDTO, clientLabel: string) => {
  const code = `OS-${String(order.ordersservicesid ?? 0).padStart(6, "0")}`;
  const description = order.description?.trim();
  if (description) return `${code} • ${description}`;
  return `${code} • ${clientLabel}`;
};

const buildRequestClientLabel = (request?: ServiceRequestDTO) => {
  if (!request) return "Cliente no asignado";
  const parts = [
    request.customer?.users?.name,
    request.customer?.users?.lastname,
    request.customer?.customercity,
  ].filter(Boolean);
  if (parts.length) return parts.join(" - ");
  const fallback = request.customer?.customerid ?? request.customer?.users?.userid;
  if (fallback) return `Cliente #${fallback}`;
  return "Cliente sin información";
};

const parseRequestDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildRequestTitle = (request: ServiceRequestDTO, clientLabel: string) => {
  const code = `SR-${String(request.serviceRequestId ?? 0).padStart(6, "0")}`;
  const type = request.serviceType ?? request.service?.name ?? "Solicitud";
  return `${code} • ${type} • ${clientLabel}`;
};

export function buildAppointmentEvents(payload: {
  orders?: OrderServiceDTO[];
  requests?: ServiceRequestDTO[];
}): AppointmentEvent[] {
  const orderEvents: OrderAppointmentEvent[] = (payload.orders ?? [])
    .map((order) => {
      const start = parseDateTime(order.fechainicio, order.horainicio);
      const resolvedEnd = parseDateTime(order.fechafin, order.horafin);
      const end = resolvedEnd ?? (start ? new Date(start.getTime() + 60 * 60 * 1000) : null);
      if (!start || !end) return null;
      const clientLabel = buildClientLabel(order.client);
      const title = buildTitle(order, clientLabel);
      const stateLabel = getStateLabel(order.state?.name) || "Sin estado";
      return {
        id: order.ordersservicesid,
        order,
        start,
        end,
        title,
        clientLabel,
        stateLabel,
        source: "order",
      };
    })
    .filter((event): event is OrderAppointmentEvent => event !== null);

  const requestEvents: RequestAppointmentEvent[] = (payload.requests ?? [])
    .map((request) => {
      const start = parseRequestDate(request.scheduledAt);
      const end =
        parseRequestDate(request.scheduledEndAt) ?? (start ? new Date(start.getTime() + 60 * 60 * 1000) : null);
      if (!start || !end) return null;
      const clientLabel = buildRequestClientLabel(request);
      const title = buildRequestTitle(request, clientLabel);
      const stateLabel = getStateLabel(request.state?.name) || "Sin estado";
      return {
        id: request.serviceRequestId,
        request,
        start,
        end,
        title,
        clientLabel,
        stateLabel,
        source: "request",
      };
    })
    .filter((event): event is RequestAppointmentEvent => event !== null);

  return [...orderEvents, ...requestEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
}
