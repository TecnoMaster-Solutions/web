import { useEffect, useState, useCallback } from "react";
import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";

export interface Role {
  roleid: number;
  name: string;
  status?: string;
}

// Cache a nivel de módulo (evita solicitudes múltiples)
let cachedRoles: Role[] | null = null;
let inFlightRequest: Promise<Role[]> | null = null;

// Normalizador consistente
type RolePayload = {
  data?: unknown[];
  roles?: unknown[];
};

const normalizeRoleData = (raw: unknown): Role[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as RolePayload | undefined)?.data)
    ? (raw as RolePayload).data ?? []
    : Array.isArray((raw as RolePayload | undefined)?.roles)
    ? (raw as RolePayload).roles ?? []
    : [];

  return list.map((item) => {
    const typed = (item ?? {}) as Record<string, unknown>;
    return {
      roleid: Number(typed.roleid),
      name: String(typed.name ?? ""),
      status: typed.status == null ? undefined : String(typed.status),
    };
  }) as Role[];
};

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar solo roles activos (manteniendo tu comportamiento actual)
  const filterActive = (rolesList: Role[]): Role[] => {
    return rolesList.filter((r) => {
      if (!r.status) return true;
      const status = String(r.status).toLowerCase();
      return status === "active" || status === "activo";
    });
  };

  const loadRoles = useCallback(async () => {
    if (cachedRoles) {
      setRoles(cachedRoles);
      return;
    }

    if (inFlightRequest) {
      const result = await inFlightRequest;
      setRoles(result);
      return;
    }

    setLoading(true);

    inFlightRequest = new Promise(async (resolve, reject) => {
      try {
        const { data } = await api.get("/roles/list", {
          timeout: 6000,
          validateStatus: (s) => s >= 200 && s < 500,
        });

        const normalized = normalizeRoleData(data);
        const activeOnly = filterActive(normalized);

        cachedRoles = activeOnly;
        resolve(activeOnly);
      } catch (err) {
        reject(err);
      }
    });

    try {
      const result = await inFlightRequest;
      setRoles(result);
    } catch (err) {
      console.error("Error al cargar roles:", err);
      setError("No se pudieron cargar los roles.");
      showError("No se pudieron cargar los roles.");
    } finally {
      setLoading(false);
      inFlightRequest = null;
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return {
    roles,
    loading,
    error,
  };
};
