import { useState, useEffect, useRef } from "react";
import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";
import { TechnicianType } from "../types/typesUser";

const RETRY_LIMIT = 2;

let technicianTypesCache: TechnicianType[] | null = null;
let inFlightRequest: Promise<TechnicianType[]> | null = null;

type TechnicianTypePayload = {
  data?: unknown[];
};

type ApiErrorShape = {
  message?: string;
};

export const useTechnicianTypes = () => {
  const [technicianTypes, setTechnicianTypes] = useState<TechnicianType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      if (technicianTypesCache) {
        setTechnicianTypes(technicianTypesCache);
        setLoading(false);
        return;
      }

      if (inFlightRequest) {
        const cached = await inFlightRequest;
        if (isMountedRef.current) {
          setTechnicianTypes(cached);
          setLoading(false);
        }
        return;
      }

      let attempt = 0;

      inFlightRequest = new Promise(async (resolve, reject) => {
        while (attempt <= RETRY_LIMIT) {
          try {
            const { data } = await api.get("/techniciantypes", {
              timeout: 5000,
              validateStatus: (s) => s >= 200 && s < 500,
            });

            const list = Array.isArray(data)
              ? data
              : Array.isArray((data as TechnicianTypePayload | undefined)?.data)
              ? (data as TechnicianTypePayload).data ?? []
              : [];

            const normalized = list.map((item) => {
              const typed = (item ?? {}) as Record<string, unknown>;
              return {
                techniciantypeid: Number(typed.techniciantypeid),
                name: String(typed.name ?? ""),
              };
            });

            technicianTypesCache = normalized;
            resolve(normalized);
            return;
          } catch (err: unknown) {
            attempt++;

            if (attempt > RETRY_LIMIT) {
              reject(err);
              return;
            }
          }
        }
      });

      try {
        const result = await inFlightRequest;
        if (isMountedRef.current) {
          setTechnicianTypes(result);
        }
      } catch (err: unknown) {
        console.error("Error al cargar tipos de tecnico:", err);
        if (isMountedRef.current) {
          setError(
            (err as ApiErrorShape)?.message ||
              "No se pudieron cargar los tipos de tecnico.",
          );
          showError("No se pudieron cargar los tipos de tecnico.");
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
        inFlightRequest = null;
      }
    };

    fetchTypes();
  }, []);

  return {
    technicianTypes,
    loading,
    error,
  };
};
