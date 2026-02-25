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

type ServicesListFromApi = ServiceFromApi[] | { data: ServiceFromApi[]; meta?: any };

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
  const payload: any = (data as any)?.data ?? data;
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
  const { data } = await api.get<ServiceTypeFromApi[]>("/services/types");
  if (!Array.isArray(data)) return [];

  return data
    .map((t) => toTitleCase((t?.name ?? "").trim()))
    .filter(Boolean);
};
