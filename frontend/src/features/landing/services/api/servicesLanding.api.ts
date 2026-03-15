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

type ServicesListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type ServicesResponseFromApi =
  | ServiceFromApi[]
  | { data?: ServiceFromApi[] | null; meta?: ServicesListMeta | null };

export type ServiceTypeFromApi = {
  typeofserviceid: number;
  name: string;
};

type ServiceTypesResponse =
  | ServiceTypeFromApi[]
  | { data?: ServiceTypeFromApi[] | null };

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
  params: FetchServicesParams = { page: 1, limit: 9, stateid: 1 },
): Promise<LandingServicesResponse> => {
  const safeParams = {
    ...params,
    stateid: params.stateid ?? 1,
  };

  const { data } = await api.get<ServicesResponseFromApi>("/services", {
    params: safeParams,
  });

  const payload = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const meta = Array.isArray(data) ? null : data?.meta;

  return {
    data: payload.map((s) => ({
      id: Number(s.serviceid),
      title: (s.name ?? "").trim(),
      description: (s.description ?? "").trim(),
      category: toTitleCase((s.typeofservicename ?? "").trim()),
      image: (s.image ?? "").trim() || undefined,
    })),
    meta: {
      total: Number(meta?.total ?? payload.length),
      page: Number(meta?.page ?? safeParams.page ?? 1),
      limit: Number(meta?.limit ?? safeParams.limit ?? 9),
      totalPages: Number(meta?.totalPages ?? 1),
    },
  };
};

export const fetchLandingServiceTypes = async (): Promise<ServiceTypeFromApi[]> => {
  const { data } = await api.get<ServiceTypesResponse>("/services/types");
  const payload = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

  return payload
    .map((t) => ({
      typeofserviceid: Number(t?.typeofserviceid),
      name: toTitleCase((t?.name ?? "").trim()),
    }))
    .filter((t) => Number.isFinite(t.typeofserviceid) && t.typeofserviceid > 0 && t.name);
};
