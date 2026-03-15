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

type ServicesListFromApi =
  | ServiceFromApi[]
  | { data?: ServiceFromApi[] | null; meta?: ServicesListMeta };

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

const toTitleCase = (s: string) =>
  (s ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

export const fetchLandingServices = async (
  params: FetchServicesParams = { page: 1, limit: 100, stateid: 1 }
): Promise<LandingService[]> => {
  const { data } = await api.get<ServicesListFromApi>("/services", { params });
  const payload = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];
  if (!Array.isArray(payload)) return [];

  return payload.map((s: ServiceFromApi) => ({
    id: Number(s.serviceid),
    title: (s.name ?? "").trim(),
    description: (s.description ?? "").trim(),
    category: toTitleCase((s.typeofservicename ?? "").trim()),
    image: (s.image ?? "").trim() || undefined,
  }));
};

export const fetchLandingServiceTypes = async (): Promise<string[]> => {
  const { data } = await api.get<ServiceTypesResponse>("/services/types");
  const payload = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  return payload
    .map((t) => toTitleCase((t?.name ?? "").trim()))
    .filter(Boolean);
};
