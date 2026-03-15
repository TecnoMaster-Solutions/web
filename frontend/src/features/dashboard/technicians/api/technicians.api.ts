"use client";

import { api } from "@/shared/utils/apiClient";
import { Technician, TechnicianState } from "../types/typesTechnicians";

export type TechnicianTypeApi = {
  techniciantypeid: number;
  name: string;
};

type TechnicianTypesEnvelope =
  | TechnicianTypeApi[]
  | { data?: TechnicianTypeApi[] }
  | { success?: boolean; data?: TechnicianTypeApi[] };

type TechnicianCreateBody = {
  name: string;
  lastname: string;
  email: string;
  documentnumber: string;
  phone: string;
  techniciantypeids: number[];
  CV: string | null;
  typeid: number;
  image?: string | null;
  roleid?: number;
};

type TechnicianFromApi = {
  technicianid: number;
  CV: string | null;
  users: {
    userid?: number;
    name: string;
    lastname: string;
    documentnumber: string;
    phone: string;
    email: string;
    image?: string | null;
    typeid?: number;
    stateid?: number;
    typeofdocuments?: { name: string };
    states?: { name: string };
  };
  technicianTypeMaps: {
    techniciantype?: { name: string; techniciantypeid?: number };
  }[];
};

type TechniciansPaginatedResponse = {
  data: TechnicianFromApi[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const toUiState = (s?: string): TechnicianState => {
  const v = (s ?? "").toLowerCase();
  if (v === "activo" || v === "active") return "Activo";
  if (v === "inactivo" || v === "inactive") return "Inactivo";
  return "Activo";
};

const mapTechnician = (t: TechnicianFromApi): Technician => {
  const docTypeName = t.users.typeofdocuments?.name;
  const stateName = t.users.states?.name;

  const types = (t.technicianTypeMaps ?? [])
    .map((m) => m.techniciantype?.name ?? "")
    .filter((x) => !!x);

  return {
    id: t.technicianid,
    state: toUiState(stateName),
    name: t.users.name,
    lastName: t.users.lastname,
    documentType: docTypeName ?? "",
    documentNumber: t.users.documentnumber,
    phone: t.users.phone,
    email: t.users.email,
    image: t.users.image ?? undefined,
    types,
    resumeUrl: t.CV ?? undefined,
    typeid: Number(t.users.typeid ?? 0),
    stateid: Number(t.users.stateid ?? 1),
  };
};

const unwrapTechnicianTypes = (
  payload: TechnicianTypesEnvelope
): TechnicianTypeApi[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  return Array.isArray(payload.data) ? payload.data : [];
};

export type GetTechniciansParams = {
  page?: number;
  limit?: number;
  search?: string;
  stateid?: number;
  typeid?: number;
  techniciantypeid?: number;
  signal?: AbortSignal;
};

export const getTechnicians = async (
  params: GetTechniciansParams = {}
): Promise<{
  data: Technician[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const {
    page = 1,
    limit = 4,
    search = "",
    stateid,
    typeid,
    techniciantypeid,
    signal,
  } = params;

  const { data } = await api.get<TechniciansPaginatedResponse>("/technicians", {
    params: {
      page,
      limit,
      search,
      stateid,
      typeid,
      techniciantypeid,
    },
    signal,
  });

  return {
    data: Array.isArray(data?.data) ? data.data.map(mapTechnician) : [],
    meta: {
      total: Number(data?.meta?.total ?? 0),
      page: Number(data?.meta?.page ?? page),
      limit: Number(data?.meta?.limit ?? limit),
      totalPages: Number(data?.meta?.totalPages ?? 1),
    },
  };
};

export const getTechnicianTypes = async (): Promise<TechnicianTypeApi[]> => {
  const { data } = await api.get<TechnicianTypesEnvelope>("/techniciantypes");
  return unwrapTechnicianTypes(data);
};

export type CreateTechnicianPayload = {
  name: string;
  lastname: string;
  email: string;
  documentnumber: string;
  phone: string;
  techniciantypeids: number[];
  CV?: string | null;
  image?: string | null;
  roleid?: number;
  typeid: number;
};

export const createTechnician = async (
  payload: CreateTechnicianPayload
): Promise<TechnicianFromApi> => {
  const body: TechnicianCreateBody = {
    name: payload.name,
    lastname: payload.lastname,
    email: payload.email,
    documentnumber: payload.documentnumber,
    phone: payload.phone,
    techniciantypeids: payload.techniciantypeids,
    CV: payload.CV ?? null,
    typeid: payload.typeid,
  };

  if (payload.image) body.image = payload.image;
  if (payload.roleid) body.roleid = payload.roleid;

  const { data } = await api.post<TechnicianFromApi>("/technicians", body);
  return data;
};

export type UpdateTechnicianPayload = {
  name?: string;
  lastname?: string;
  email?: string;
  documentnumber?: string;
  phone?: string;
  techniciantypeids?: number[];
  CV?: string | null;
  image?: string | null;
  roleid?: number;
  typeid?: number;
  stateid?: number;
};

export const updateTechnician = async (
  id: number,
  payload: UpdateTechnicianPayload
) => {
  const { data } = await api.patch(`/technicians/${id}`, payload);
  return data;
};

export const deleteTechnician = async (id: number) => {
  const { data } = await api.delete(`/technicians/${id}`);
  return data;
};
