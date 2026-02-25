import { api } from "@/shared/utils/apiClient";

export type RoleRow = {
  id: number;
  name: string;
  state: "Activo" | "Inactivo";
};

type RolesListResponse = {
  success: boolean;
  data: Array<{
    roleid: number;
    name: string;
    status: string; 
  }>;
};

type RoleConfigResponse = {
  roleconfigurationid: number;
  role: { id: number; name: string; status: string };
  permission: { id: number; module: string };
  privilege: { id: number; name: string };
};

const toUiStatus = (s?: string) =>
  (s ?? "").toLowerCase() === "active" ? "Activo" : "Inactivo";

const toBackendStatus = (
  s?: "Activo" | "Inactivo" | "active" | "inactive" | boolean
): "active" | "inactive" => {
  if (typeof s === "boolean") return s ? "active" : "inactive";
  const v = String(s ?? "").toLowerCase().trim();
  if (["activo", "active", "1", "true"].includes(v)) return "active";
  if (["inactivo", "inactive", "0", "false"].includes(v)) return "inactive";
  return "active";
};

export const getRoles = async (): Promise<RoleRow[]> => {
  const { data } = await api.get<RolesListResponse>("/roles/list");
  const rows = Array.isArray(data?.data) ? data.data : [];

  return rows.map((r) => ({
    id: Number(r.roleid),
    name: r.name,
    state: toUiStatus(r.status),
  }));
};

export const getRoleDetail = async (id: number) => {
  const { data } = await api.get(`/roles/${id}/detail`);
  return data;
};

export const deleteRole = async (id: number) => {
  const res = await api.delete(`/roles/${id}`, {
    validateStatus: (status) => status < 500,
  });

  if (res.status >= 400) {
    const error: any = new Error(
      (res.data as any)?.message || "No se pudo eliminar el rol."
    );
    error.response = res;
    throw error;
  }
};

export type CreateRolePayload = {
  name: string;
  roleconfigurations: { permissionid: number; privilegeid: number }[];
  status?: "active" | "inactive" | "Activo" | "Inactivo" | boolean;
};

export const createRole = async (payload: CreateRolePayload) => {
  const body = {
    name: payload.name,
    roleconfigurations: payload.roleconfigurations,
    status: toBackendStatus(payload.status ?? "active"),
  };
  const { data } = await api.post("/roles", body);
  return data;
};

export type UpdateMatrixItem = { permissionid: number; privilegeids: number[] };

export const updateRoleMatrix = async (
  roleid: number,
  items: UpdateMatrixItem[]
) => {
  const { data } = await api.put(`/roles/${roleid}/configurations`, { items });
  return data;
};

export const patchRoleMeta = async (
  roleid: number,
  payload: { name?: string; status?: "Activo" | "Inactivo" }
) => {
  const role: any = { roleid };

  if (payload.name !== undefined) role.name = payload.name;

  if (payload.status !== undefined) {
    role.status = toBackendStatus(payload.status);
  }

  const res = await api.patch(
    `/roles/configurations`,
    { role },
    { validateStatus: (status) => status < 500 }
  );

  if (res.status >= 400) {
    const error: any = new Error(
      (res.data as any)?.message || "No se pudo actualizar el rol."
    );
    error.response = res;
    throw error;
  }

  return res.data;
};