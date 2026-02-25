import type { AppointmentEvent } from "../types/typeAppointment";
import type { ServiceRequestDTO } from "@/features/dashboard/requests/services/servicerequests.service";
import { normalizeString, toPositiveNumber } from "./string.helpers";

export type ServiceTypeFilterKey = "preventivo" | "correctivo" | "instalacion";

export const detectServiceTypeKey = (value?: string | null): ServiceTypeFilterKey | null => {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  if (normalized.includes("preventivo")) return "preventivo";
  if (normalized.includes("correctivo")) return "correctivo";
  if (normalized.includes("instal")) return "instalacion";
  return null;
};

type TechnicianEntry = {
  technicianid?: number | null;
  technicianId?: number | null;
  users?: {
    userid?: number | null;
    id?: number | null;
    name?: string | null;
    lastname?: string | null;
  };
  title?: string | null;
};

export const buildTechnicianLabel = (tech: TechnicianEntry | null | undefined) => {
  if (!tech) return null;

  const parts = [tech.users?.name, tech.users?.lastname].filter(Boolean);
  const name = parts.length ? parts.join(" ").trim() : null;
  const id = tech.technicianid ?? tech.technicianId;

  if (name) return `${name}${id ? ` (${id})` : ""}`;
  if (id) return `Técnico ${id}`;
  if (tech.title) return tech.title;
  return "Técnico";
};

export const resolveTechniciansFromLinks = (request?: ServiceRequestDTO): TechnicianEntry[] => {
  if (!request?.techniciansMap?.length) return [];
  return request.techniciansMap
    .map((link) => link?.technician)
    .filter((tech): tech is TechnicianEntry => Boolean(tech));
};

export const getEventTechnicians = (event: AppointmentEvent): TechnicianEntry[] => {
  if (event.source === "order") return event.order?.technicians ?? [];

  return [
    ...(event.request?.technicians ?? []),
    ...(event.request?.assignedTechnicians ?? []),
    ...(event.request?.serviceRequestTechnicians ?? []),
    ...(event.request?.requestTechnicians ?? []),
    ...resolveTechniciansFromLinks(event.request),
  ];
};

export const getOrderServiceRequestId = (order?: any): number | null => {
  if (!order) return null;

  const candidates = [
    order.serviceRequestId,
    order.servicerequestid,
    order.servicerequestId,
    order.service_request_id,
  ];

  for (const candidate of candidates) {
    const id = toPositiveNumber(candidate);
    if (id) return id;
  }

  return null;
};

export const getEventTechnicianUserIds = (event: AppointmentEvent): number[] => {
  const ids: (number | null)[] = [];

  getEventTechnicians(event).forEach((tech) => {
    ids.push(
      toPositiveNumber(tech?.technicianid),
      toPositiveNumber(tech?.technicianId),
      toPositiveNumber(tech?.users?.userid),
      toPositiveNumber(tech?.users?.id)
    );
  });

  return Array.from(new Set(ids.filter((id): id is number => id != null)));
};

export const getEventCustomerIds = (event: AppointmentEvent): number[] => {
  const ids: (number | null)[] = [];

  if (event.source === "order") {
    const client = event.order?.client;
    ids.push(
      toPositiveNumber(client?.customerid),
      toPositiveNumber(client?.clientid),
      toPositiveNumber(client?.userid),
      toPositiveNumber(client?.users?.userid),
      toPositiveNumber(client?.users?.id)
    );
  } else {
    const request = event.request;
    ids.push(
      toPositiveNumber(request?.customer?.customerid),
      toPositiveNumber(request?.customer?.clientid),
      toPositiveNumber(request?.clientId),
      toPositiveNumber(request?.customer?.users?.userid),
      toPositiveNumber(request?.customer?.users?.id)
    );
  }

  return Array.from(new Set(ids.filter((id): id is number => id != null)));
};

export const getEventServiceTypeKey = (event: AppointmentEvent): ServiceTypeFilterKey | null => {
  const candidates: Array<string | null | undefined> = [];

  if (event.source === "request") {
    const request = event.request;
    candidates.push(request?.serviceType);
    candidates.push(request?.service?.name);
    candidates.push(request?.description);
  } else {
    const order: any = event.order;
    candidates.push(order?.description);
    candidates.push(order?.typeofservicename);

    const services = order?.services ?? [];
    services.forEach((entry: any) => {
      candidates.push(entry?.typeofservicename);
      const service = entry?.service;
      candidates.push(service?.typeofservice?.name);
      candidates.push(service?.typeofservice?.typeofservicename);
    });
  }

  for (const candidate of candidates) {
    const key = detectServiceTypeKey(candidate);
    if (key) return key;
  }

  return null;
};
