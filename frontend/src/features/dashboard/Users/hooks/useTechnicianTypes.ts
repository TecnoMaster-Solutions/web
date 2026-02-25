import { useState, useEffect, useRef } from "react";
import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";

const RETRY_LIMIT = 2;

// Cache en memoria a nivel de módulo para evitar múltiples requests
let technicianTypesCache: any[] | null = null;
let inFlightRequest: Promise<any[]> | null = null;

export const useTechnicianTypes = () => {
  const [technicianTypes, setTechnicianTypes] = useState<any[]>([]);
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
      // Si ya existe cache, úsala inmediatamente
      if (technicianTypesCache) {
        setTechnicianTypes(technicianTypesCache);
        setLoading(false);
        return;
      }

      // Evitar solicitudes duplicadas simultáneas
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
              : Array.isArray(data?.data)
              ? data.data
              : [];

            const normalized = list.map((t: any) => ({
              techniciantypeid: t.techniciantypeid,
              name: t.name,
            }));

            technicianTypesCache = normalized;
            resolve(normalized);
            return;
          } catch (err: any) {
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
      } catch (err) {
        console.error("Error al cargar tipos de técnico:", err);
        if (isMountedRef.current) {
          setError("No se pudieron cargar los tipos de técnico.");
          showError("No se pudieron cargar los tipos de técnico.");
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
