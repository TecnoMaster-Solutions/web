import { useEffect, useState, useCallback } from "react";
import { api } from "@/shared/utils/apiClient";
import { showError } from "@/shared/utils/notifications";
import { UserDocumentType } from "../types/typesUser";

export type DocumentType = UserDocumentType;

// Cache a nivel de módulo
let cachedDocumentTypes: UserDocumentType[] | null = null;
let inFlightRequest: Promise<UserDocumentType[]> | null = null;

// Normalizar el payload desde múltiples formatos
type DocumentTypePayload = {
  data?: unknown[];
};

const normalizeDocumentTypeData = (raw: unknown): UserDocumentType[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as DocumentTypePayload | undefined)?.data)
    ? (raw as DocumentTypePayload).data ?? []
    : [];

  return list.map((item) => {
    const typed = (item ?? {}) as Record<string, unknown>;
    return {
      typeofdocumentid: Number(typed.typeofdocumentid),
      name: String(typed.name ?? ""),
      createat: typeof typed.createat === "string" ? typed.createat : undefined,
      updateat:
        typed.updateat == null ? null : String(typed.updateat),
    };
  });
};

export const useDocumentTypes = () => {
  const [documentTypes, setDocumentTypes] = useState<UserDocumentType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocumentTypes = useCallback(async () => {
    // Si ya hay cache → úsala inmediatamente
    if (cachedDocumentTypes) {
      setDocumentTypes(cachedDocumentTypes);
      return;
    }

    // Si hay request en vuelo → esperar y reutilizarlo
    if (inFlightRequest) {
      const result = await inFlightRequest;
      setDocumentTypes(result);
      return;
    }

    setLoading(true);

    const controller = new AbortController();

    // Guardamos la promesa para evitar solicitudes duplicadas
    inFlightRequest = new Promise(async (resolve, reject) => {
      try {
        const { data } = await api.get("/typeofdocuments", {
          signal: controller.signal,
          timeout: 6000,
          validateStatus: (s) => s >= 200 && s < 500,
        });

        const normalized = normalizeDocumentTypeData(data);

        cachedDocumentTypes = normalized;
        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    });

    try {
      const result = await inFlightRequest;
      setDocumentTypes(result);
    } catch (err) {
      console.error("Error al cargar tipos de documento:", err);
      setError("No se pudieron cargar los tipos de documento.");
      showError("No se pudieron cargar los tipos de documento.");
    } finally {
      setLoading(false);
      inFlightRequest = null;
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    loadDocumentTypes();
  }, [loadDocumentTypes]);

  return {
    documentTypes,
    loading,
    error,
  };
};
