"use client";

import { api } from "@/shared/utils/apiClient";
import {
  Technician,
  TechnicianState
} from "../types/typesTechnicians";

export type TechnicianTypeApi = {
  techniciantypeid: number;
  name: string;
};

type TechnicianTypesEnvelope =
  | TechnicianTypeApi[]
  | { data?: TechnicianTypeApi[] }
  | { success?: boolean; data?: TechnicianTypeApi[] };

type TechnicianFromApi = {
  technicianid: number;
  CV: string | null;
  users: {
    name: string;
    lastname: string;
    documentnumber: string;
    phone: string;
    email: string;
    image?: string | null;
    typeofdocuments?: { name: string };
    states?: { name: string };
  };
  technicianTypeMaps: {
    techniciantype?: { name: string };
  }[];
};

const toUiState = (s?: string): TechnicianState => {
  const v = (s ?? "").toLowerCase();
  if (v === "activo" || v === "active") return "Activo";
  if (v === "inactivo" || v === "inactive") return "Inactivo";
  return "Activo";
};

export const getTechnicians = async (): Promise<Technician[]> => {
  const { data } = await api.get<TechnicianFromApi[]>("/technicians");

  return data.map((t) => {
    const docTypeName = t.users.typeofdocuments?.name;
    const stateName = t.users.states?.name;

    const types = t.technicianTypeMaps
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
    };
  });
};

export const getTechnicianTypes = async (): Promise<TechnicianTypeApi[]> => {
  const { data } = await api.get<TechnicianTypesEnvelope>(
    "/techniciantypes"
  );

  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
      ? (data as any).data
      : [];

  return list;
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
  const body: any = {
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

export const updateTechnician = async (id: number, payload: UpdateTechnicianPayload) => {
  const { data } = await api.patch(`/technicians/${id}`, payload);
  return data;
};

export const deleteTechnician = async (id: number) => {
  const { data } = await api.delete(`/technicians/${id}`);
  return data;
};
