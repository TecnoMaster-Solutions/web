"use client";

import { api } from "@/shared/utils/apiClient";
import { Service } from "../types/typesServices";

export type ServiceTypeApi = {
  typeofserviceid: number;
  name: string;
};

export type ServiceStateApi = {
  stateid: number;
  name: string;
  description: string | null;
};

type ServiceFromApi = {
  serviceid: number;
  name: string;
  description: string;
  image: string;
  typeofserviceid: number;
  typeofservicename: string | null;
  stateid: number;
  statename: string | null;
};

type ServicesPaginatedResponse = {
  data: ServiceFromApi[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const toUiState = (s?: string | null): "Activo" | "Inactivo" => {
  const v = (s ?? "").toLowerCase();
  if (v === "inactivo" || v === "inactive") return "Inactivo";
  return "Activo";
};

const toTitleCase = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const mapService = (s: ServiceFromApi): Service => ({
  id: s.serviceid,
  name: s.name ?? "",
  description: s.description ?? "",
  image: s.image ?? null,
  category: toTitleCase(s.typeofservicename ?? ""),
  state: toUiState(s.statename),
  typeofserviceid: Number(s.typeofserviceid ?? 0),
  stateid: Number(s.stateid ?? 1),
});

export type FetchServicesParams = {
  page?: number;
  limit?: number;
  search?: string;
  typeofserviceid?: number;
  stateid?: number;
  signal?: AbortSignal;
};

export const fetchServices = async (
  params: FetchServicesParams = {}
): Promise<{
  data: Service[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const {
    page = 1,
    limit = 5,
    search = "",
    typeofserviceid,
    stateid,
    signal,
  } = params;

  const { data } = await api.get<ServicesPaginatedResponse>("/services", {
    params: {
      page,
      limit,
      search,
      typeofserviceid,
      stateid,
    },
    signal,
  });

  return {
    data: Array.isArray(data?.data) ? data.data.map(mapService) : [],
    meta: {
      total: Number(data?.meta?.total ?? 0),
      page: Number(data?.meta?.page ?? page),
      limit: Number(data?.meta?.limit ?? limit),
      totalPages: Number(data?.meta?.totalPages ?? 1),
    },
  };
};

export const getServiceTypes = async (): Promise<ServiceTypeApi[]> => {
  const { data } = await api.get<ServiceTypeApi[]>("/services/types");
  return Array.isArray(data) ? data : [];
};

export const getServiceStates = async (): Promise<ServiceStateApi[]> => {
  const { data } = await api.get<ServiceStateApi[]>("/services/states");
  return Array.isArray(data) ? data : [];
};

export type CreateServiceApiBody = {
  name: string;
  description?: string;
  image: string;
  typeofserviceid: number;
  stateid?: number;
};

export const createService = async (
  body: CreateServiceApiBody
): Promise<Service> => {
  const { data } = await api.post<ServiceFromApi>("/services", body);
  return mapService(data);
};

export type UpdateServiceApiBody = Partial<CreateServiceApiBody>;

export const updateService = async (
  id: number,
  body: UpdateServiceApiBody
): Promise<Service> => {
  const { data } = await api.patch<ServiceFromApi>(`/services/${id}`, body);
  return mapService(data);
};

export const getServiceById = async (id: number): Promise<Service> => {
  const { data } = await api.get<ServiceFromApi>(`/services/${id}`);
  return mapService(data);
};

export const deleteService = async (id: number) => {
  const { data } = await api.delete(`/services/${id}`);
  return data;
};