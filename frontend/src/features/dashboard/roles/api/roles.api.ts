import { api } from "@/shared/utils/apiClient";

export type RoleRow = {
  id: number;
  name: string;
  state: "Activo" | "Inactivo";
};

export type GetRolesParams = {
  page?: number;
  limit?: number;
  search?: string;
  signal?: AbortSignal;
};

type PaginatedRolesResponse = {
  data: Array<{
    roleid: number;
    name: string;
    status: string;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiErrorResponse = {
  message?: string;
};

type ErrorWithResponse = Error & {
  response?: unknown;
};

type PatchRoleMetaPayload = {
  roleid: number;
  name?: string;
  status?: "active" | "inactive";
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

export const getRoles = async ({
  page = 1,
  limit = 6,
  search = "",
  signal,
}: GetRolesParams = {}) => {
  const { data } = await api.get<PaginatedRolesResponse>("/roles", {
    params: {
      page,
      limit,
      search: search.trim() || undefined,
    },
    signal,
  });

  const rows = Array.isArray(data?.data) ? data.data : [];

  return {
    data: rows.map((r) => ({
      id: Number(r.roleid),
      name: r.name,
      state: toUiStatus(r.status),
    })) as RoleRow[],
    meta: {
      page: Number(data?.meta?.page ?? page),
      limit: Number(data?.meta?.limit ?? limit),
      total: Number(data?.meta?.total ?? 0),
      totalPages: Number(data?.meta?.totalPages ?? 1),
    },
  };
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
    const error = new Error(
      (res.data as ApiErrorResponse | undefined)?.message ||
        "No se pudo eliminar el rol."
    ) as ErrorWithResponse;
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
  const role: PatchRoleMetaPayload = { roleid };

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
    const error = new Error(
      (res.data as ApiErrorResponse | undefined)?.message ||
        "No se pudo actualizar el rol."
    ) as ErrorWithResponse;
    error.response = res;
    throw error;
  }

  return res.data;
};
