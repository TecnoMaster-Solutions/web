"use client";

import { api } from "@/shared/utils/apiClient";
import type { Service as LandingService } from "../hooks/useServices";

type ServiceFromApi = {
  serviceid: number;
  name: string;
  description: string | null;
  image: string | null;
  typeofserviceid: number;
  typeofservicename: string | null;
  stateid: number;
  statename: string | null;
};

type ServicesResponseFromApi = {
  data?: ServiceFromApi[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type ServiceTypeFromApi = {
  typeofserviceid: number;
  name: string;
};

export type FetchServicesParams = {
  page?: number;
  limit?: number;
  search?: string;
  typeofserviceid?: number;
  stateid?: number;
};

export type LandingServicesResponse = {
  data: LandingService[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const toTitleCase = (s: string) =>
  (s ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

export const fetchLandingServices = async (
  params: FetchServicesParams = { page: 1, limit: 9, stateid: 1 }
): Promise<LandingServicesResponse> => {
  const { data } = await api.get<ServicesResponseFromApi>("/services", {
    params: {
      ...params,
      stateid: 1,
    },
  });

  const payload = Array.isArray(data?.data) ? data.data : [];

  return {
    data: payload.map((s: ServiceFromApi) => ({
      id: Number(s.serviceid),
      title: (s.name ?? "").trim(),
      description: (s.description ?? "").trim(),
      category: toTitleCase((s.typeofservicename ?? "").trim()),
      image: (s.image ?? "").trim() || undefined,
    })),
    meta: {
      total: Number(data?.meta?.total ?? 0),
      page: Number(data?.meta?.page ?? params.page ?? 1),
      limit: Number(data?.meta?.limit ?? params.limit ?? 9),
      totalPages: Number(data?.meta?.totalPages ?? 1),
    },
  };
};

export const fetchLandingServiceTypes = async (): Promise<ServiceTypeFromApi[]> => {
  const { data } = await api.get<ServiceTypeFromApi[]>("/services/types");
  if (!Array.isArray(data)) return [];

  return data.filter((t) => Number(t?.typeofserviceid) > 0 && (t?.name ?? "").trim());
};
