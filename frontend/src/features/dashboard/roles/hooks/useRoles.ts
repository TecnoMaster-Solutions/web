"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { Role, CreateRoleData, EditRoleData } from "../types/typeRoles";
import { showSuccess, showWarning } from "@/shared/utils/notifications";
import { confirmDelete } from "@/shared/utils/Delete/confirmDelete";
import { validateRoleForm } from "../validations/rolesValidations";
import {
  getRoles as apiGetRoles,
  deleteRole as apiDeleteRole,
  getRoleDetail,
  createRole as apiCreateRole,
  updateRoleMatrix,
  patchRoleMeta,
} from "../api/roles.api";

import {
  MODULE_TO_PERMISSION_ID,
  PRIVILEGE_NAME_TO_ID,
  uiActionToPrivilegeName,
  MODULE_BACK_TO_UI,
  privilegeNameToUiActions,
  ALL_MODULE_PERMISSIONS,
} from "../constants/roleMatrix.constants";

function isValidConfig(
  v: { permissionid: number; privilegeid: number } | null
): v is { permissionid: number; privilegeid: number } {
  return v !== null;
}

const toUiStatus = (s?: string): "Activo" | "Inactivo" =>
  (s ?? "").toLowerCase() === "active" ? "Activo" : "Inactivo";

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<EditRoleData | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const firstLoadRef = useRef(true);

  const [tableLoading, setTableLoading] = useState(false);

  const [loadingCount, setLoadingCount] = useState(0);
  const loading = loadingCount > 0;
  const startLoading = () => setLoadingCount((c) => c + 1);
  const stopLoading = () => setLoadingCount((c) => Math.max(0, c - 1));

  const isEditModalOpen = editingRole !== null;
  const isViewModalOpen = viewingRole !== null;
  const selectedRole = editingRole ?? viewingRole ?? null;
  const isDefaultAdmin = (role: { id: number }) => Number(role.id) === 1;

  const DEFAULT_ADMIN_WARNING =
    "El rol administrador inicial no puede ser editado ni eliminado.";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadRoles = useCallback(
    async (
      customPage: number = page,
      customLimit: number = limit,
      customSearch: string = debouncedSearch
    ) => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      if (firstLoadRef.current) {
        startLoading();
      } else {
        setTableLoading(true);
      }

      try {
        const response = await apiGetRoles({
          page: customPage,
          limit: customLimit,
          search: customSearch,
          signal: controller.signal,
        });

        const mapped: Role[] = response.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          state: r.state,
          permissions: [],
        }));

        setRoles(mapped);
        setPage(Number(response.meta.page ?? customPage));
        setLimit(Number(response.meta.limit ?? customLimit));
        setTotal(Number(response.meta.total ?? 0));
      } catch (err: any) {
        if (
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled"
        ) {
          return;
        }

        console.error("Error al cargar roles:", err);
        showWarning("No se pudieron cargar los roles.");
      } finally {
        if (firstLoadRef.current) {
          stopLoading();
          firstLoadRef.current = false;
        } else {
          setTableLoading(false);
        }
      }
    },
    [page, limit, debouncedSearch]
  );

  useEffect(() => {
    loadRoles(page, limit, debouncedSearch);

    return () => {
      abortRef.current?.abort();
    };
  }, [page, limit, debouncedSearch, loadRoles]);

  const handleCreateRole = async (payload: CreateRoleData) => {
    const errors = validateRoleForm(payload, roles);
    if (errors.name) return showWarning(errors.name);
    if (errors.permissions) return showWarning(errors.permissions);

    const roleconfigurations = payload.permissions
      .map((token) => {
        const idx = token.lastIndexOf("-");
        if (idx === -1) return null;

        const moduleName = token.slice(0, idx);
        const action = token.slice(idx + 1);

        const permissionid = (MODULE_TO_PERMISSION_ID as any)[moduleName];
        if (!permissionid) return null;

        const privName = uiActionToPrivilegeName(moduleName as any, action);
        if (!privName) return null;

        const privilegeid = PRIVILEGE_NAME_TO_ID[privName];
        if (!privilegeid) return null;

        return { permissionid, privilegeid };
      })
      .filter(isValidConfig);

    if (roleconfigurations.length === 0) {
      return showWarning("No se pudo mapear ningún permiso a IDs válidos.");
    }

    startLoading();
    try {
      setCreating(true);
      await apiCreateRole({
        name: payload.name.trim(),
        roleconfigurations,
        status: "active",
      });

      await loadRoles(1, limit, debouncedSearch);
      setPage(1);
      setIsCreateModalOpen(false);
      showSuccess("Rol creado exitosamente!");
    } finally {
      setCreating(false);
      stopLoading();
    }
  };

  const buildMatrixFromTokens = (tokens: string[]) => {
    const map = new Map<number, number[]>();

    for (const t of tokens) {
      const idx = t.lastIndexOf("-");
      if (idx === -1) continue;

      const moduleName = t.slice(0, idx);
      const action = t.slice(idx + 1);

      const permissionid = (MODULE_TO_PERMISSION_ID as any)[moduleName];
      if (!permissionid) continue;

      const privName = uiActionToPrivilegeName(moduleName as any, action);
      if (!privName) continue;

      const privilegeid = PRIVILEGE_NAME_TO_ID[privName];
      if (!privilegeid) continue;

      const arr = map.get(permissionid) ?? [];
      if (!arr.includes(privilegeid)) arr.push(privilegeid);

      map.set(permissionid, arr);
    }

    return Array.from(map.entries()).map(([permissionid, privilegeids]) => ({
      permissionid,
      privilegeids,
    }));
  };

  const handleEditRole = async (id: number, payload: EditRoleData) => {
    if (isDefaultAdmin({ id })) {
      return showWarning(DEFAULT_ADMIN_WARNING);
    }

    const errors = validateRoleForm(payload, roles, id);
    if (errors.name) return showWarning(errors.name);
    if (errors.permissions) return showWarning(errors.permissions);

    const items = buildMatrixFromTokens(payload.permissions ?? []);
    if (items.length === 0) {
      return showWarning("Debe seleccionar al menos un permiso/privilegio.");
    }

    startLoading();
    try {
      await updateRoleMatrix(id, items);

      await patchRoleMeta(id, {
        name: payload.name.trim(),
        status: payload.state,
      });

      await loadRoles(page, limit, debouncedSearch);
      setEditingRole(null);
      showSuccess("Rol actualizado exitosamente!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo actualizar el rol.";
      showWarning(Array.isArray(msg) ? msg.join(", ") : msg);
      console.error("Error al editar rol:", err);
    } finally {
      stopLoading();
    }
  };

  const handleView = async (role: Role) => {
    startLoading();
    try {
      const { role: roleInfo, configurations } = await getRoleDetail(role.id);

      const mappedPermissions = configurations.flatMap((cfg: any) => {
        const moduleUi =
          MODULE_BACK_TO_UI[cfg.permission.module] ??
          MODULE_BACK_TO_UI[String(cfg.permission.module).toLowerCase()] ??
          cfg.permission.module;

        const actions = privilegeNameToUiActions(
          moduleUi as any,
          cfg.privilege.name
        );

        const allowed = (ALL_MODULE_PERMISSIONS as any)[moduleUi] ?? [];
        const filtered = actions.filter((a: string) => allowed.includes(a));

        return filtered.map((a: string) => `${moduleUi}-${a}`);
      });

      setViewingRole({
        ...role,
        permissions: mappedPermissions,
        state: toUiStatus(roleInfo.status),
      });
    } catch (err) {
      console.error("Error al obtener detalle del rol:", err);
      setViewingRole(role);
    } finally {
      stopLoading();
    }
  };

  const handleEdit = async (role: Role) => {
    if (isDefaultAdmin(role)) {
      return showWarning(DEFAULT_ADMIN_WARNING);
    }

    startLoading();
    try {
      const { role: roleInfo, configurations } = await getRoleDetail(role.id);

      const mappedPermissions = configurations.flatMap((cfg: any) => {
        const moduleUi =
          MODULE_BACK_TO_UI[cfg.permission.module] ??
          MODULE_BACK_TO_UI[String(cfg.permission.module).toLowerCase()] ??
          cfg.permission.module;

        const actions = privilegeNameToUiActions(
          moduleUi as any,
          cfg.privilege.name
        );

        const allowed = (ALL_MODULE_PERMISSIONS as any)[moduleUi] ?? [];
        const filtered = actions.filter((a: string) => allowed.includes(a));

        return filtered.map((a: string) => `${moduleUi}-${a}`);
      });

      setEditingRole({
        id: roleInfo.roleid,
        name: roleInfo.name,
        state: toUiStatus(roleInfo.status),
        permissions: mappedPermissions,
      });
    } catch (err) {
      console.error("Error al obtener detalle de rol:", err);
      setEditingRole({
        id: role.id,
        name: role.name,
        state: role.state,
        permissions: [],
      });
    } finally {
      stopLoading();
    }
  };

  const handleDelete = async (role: Role) => {
    if (isDefaultAdmin(role)) {
      return showWarning(DEFAULT_ADMIN_WARNING);
    }

    await handleDeleteRole(role);
  };

  const handleDeleteRole = async (role: Role): Promise<boolean> => {
    return confirmDelete(
      {
        itemName: role.name,
        itemType: "rol",
        successMessage: `El rol "${role.name}" ha sido eliminado correctamente.`,
        errorMessage: "No se pudo eliminar el rol. Intenta nuevamente.",
        skipSuccessToast: true,
      },
      async () => {
        startLoading();
        try {
          await apiDeleteRole(role.id);

          const nextTotal = Math.max(total - 1, 0);
          const lastPage = Math.max(1, Math.ceil(nextTotal / limit));
          const nextPage = page > lastPage ? lastPage : page;

          await loadRoles(nextPage, limit, debouncedSearch);
          setPage(nextPage);

          showSuccess(`El rol "${role.name}" ha sido eliminado correctamente.`);
        } catch (err) {
          const ax = err as AxiosError<any>;

          if (ax.response?.status === 404) {
            showWarning("El rol ya no existe.");
          } else if (ax.response?.status === 400 || ax.response?.status === 409) {
            showWarning(
              ax.response?.data?.message ??
                "No se puede eliminar el rol (está vinculado a usuarios)."
            );
          } else {
            showWarning("Ocurrió un error al eliminar el rol.");
          }
        } finally {
          stopLoading();
        }
      }
    );
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingRole(null);
    setViewingRole(null);
  };

  return {
    roles,
    loading,
    tableLoading,

    page,
    limit,
    total,
    search,
    setPage,
    setLimit,
    setSearch,

    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen: (v: boolean) => !v && setEditingRole(null),
    isViewModalOpen,
    setIsViewModalOpen: (v: boolean) => !v && setViewingRole(null),
    selectedRole,

    handleCreateRole,
    handleEditRole,
    handleView,
    handleEdit,
    handleDelete,

    closeModals,

    editingRole,
    viewingRole,
    setEditingRole,
    setViewingRole,

    creating,
  };
};