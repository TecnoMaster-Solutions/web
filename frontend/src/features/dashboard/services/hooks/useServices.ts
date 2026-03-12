"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showSuccess, showWarning } from "@/shared/utils/notifications";
import { confirmDelete } from "@/shared/utils/Delete/confirmDelete";
import { uploadImageToCloudinary } from "@/shared/utils/cloudinary";
import {
  Service,
  CreateServicePayload,
  EditServicePayload,
} from "../types/typesServices";
import {
  createService,
  deleteService,
  fetchServices,
  updateService,
} from "../api/services.api";

type ApiErrorShape = {
  response?: { data?: { message?: string } };
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const e = error as ApiErrorShape | null;
  return e?.response?.data?.message ?? e?.message ?? fallback;
};

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);

  const [loadingCount, setLoadingCount] = useState(0);
  const loading = loadingCount > 0;
  const startLoading = () => setLoadingCount((c) => c + 1);
  const stopLoading = () => setLoadingCount((c) => Math.max(0, c - 1));

  const [tableLoading, setTableLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const isEditModalOpen = useMemo(
    () => editingService !== null,
    [editingService]
  );

  const isViewModalOpen = useMemo(
    () => viewingService !== null,
    [viewingService]
  );

  const firstLoadRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const waitForRender = useCallback(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchAllServices = useCallback(
    async (customPage: number, customLimit: number, customSearch: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (firstLoadRef.current) {
        startLoading();
      } else {
        setTableLoading(true);
      }

      try {
        const response = await fetchServices({
          page: customPage,
          limit: customLimit,
          search: customSearch,
          signal: controller.signal,
        });

        setServices(response.data);
        setTotal(Number(response.meta.total ?? 0));
        setTotalPages(Number(response.meta.totalPages ?? 1));
        await waitForRender();
      } catch (error: any) {
        if (
          error?.name !== "AbortError" &&
          error?.code !== "ERR_CANCELED" &&
          error?.name !== "CanceledError"
        ) {
          console.error("Error al cargar servicios:", error);
          showWarning("Error al cargar servicios desde el servidor");
        }
      } finally {
        if (firstLoadRef.current) {
          stopLoading();
          firstLoadRef.current = false;
        } else {
          setTableLoading(false);
        }
      }
    },
    [waitForRender]
  );

  useEffect(() => {
    fetchAllServices(page, limit, debouncedSearch);

    return () => {
      abortRef.current?.abort();
    };
  }, [page, limit, debouncedSearch, fetchAllServices]);

  const refreshServices = useCallback(async () => {
    await fetchAllServices(page, limit, debouncedSearch);
    return 200 as const;
  }, [fetchAllServices, page, limit, debouncedSearch]);

  const requireImageUrl = async (image: string | File | null) => {
    const val = image;
    if (!val) throw new Error("Debe agregar una imagen para el servicio.");

    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) {
        throw new Error("Debe agregar una imagen para el servicio.");
      }
      return trimmed;
    }

    const url = await uploadImageToCloudinary(val);
    if (!url?.trim()) {
      throw new Error("No se pudo subir la imagen a Cloudinary.");
    }

    return url.trim();
  };

  const handleCreateService = async (payload: CreateServicePayload) => {
    startLoading();
    try {
      setIsCreateModalOpen(false);

      if (!payload.name?.trim()) {
        throw new Error("El nombre del servicio es obligatorio.");
      }

      if (!payload.typeofserviceid) {
        throw new Error("Debe seleccionar un tipo de servicio.");
      }

      const imageUrl = await requireImageUrl(payload.image);

      await createService({
        name: payload.name.trim(),
        description: (payload.description ?? "").trim(),
        image: imageUrl,
        typeofserviceid: payload.typeofserviceid,
      });

      await refreshServices();

      showSuccess("Servicio creado exitosamente");
      await waitForRender();
    } catch (error: any) {
      const msg = getErrorMessage(error, "Error al crear servicio");
      console.error(error);
      showWarning(msg);
    } finally {
      stopLoading();
    }
  };

  const handleEditService = async (id: number, payload: EditServicePayload) => {
    startLoading();
    try {
      if (!id) return;

      if (!payload.name?.trim()) {
        throw new Error("El nombre del servicio es obligatorio.");
      }

      if (!payload.typeofserviceid) {
        throw new Error("Debe seleccionar un tipo de servicio.");
      }

      if (![1, 2].includes(payload.stateid)) {
        throw new Error("Estado inválido.");
      }

      const body: any = {
        name: payload.name.trim(),
        description: (payload.description ?? "").trim(),
        typeofserviceid: payload.typeofserviceid,
        stateid: payload.stateid,
      };

      if (payload.image instanceof File) {
        body.image = await requireImageUrl(payload.image);
      } else if (typeof payload.image === "string") {
        const trimmed = payload.image.trim();
        if (!trimmed) {
          throw new Error("No se puede guardar un servicio sin imagen.");
        }
        body.image = trimmed;
      } else if (payload.image === null) {
        throw new Error("No se puede guardar un servicio sin imagen.");
      }

      await updateService(id, body);
      await refreshServices();

      showSuccess("Servicio actualizado exitosamente");
      await waitForRender();
      setEditingService(null);
    } catch (error: any) {
      const msg = getErrorMessage(error, "Error al actualizar servicio");
      console.error(error);
      showWarning(msg);
    } finally {
      stopLoading();
    }
  };

  const handleDeleteService = async (service: Service): Promise<boolean> => {
    return confirmDelete(
      {
        itemName: service.name,
        itemType: "servicio",
        successMessage: `El servicio "${service.name}" ha sido eliminado correctamente.`,
        errorMessage: "No se pudo eliminar el servicio. Intenta nuevamente.",
        skipSuccessToast: true,
      },
      async () => {
        startLoading();
        try {
          await deleteService(service.id);
          await refreshServices();
          await waitForRender();

          showSuccess(
            `El servicio "${service.name}" ha sido eliminado correctamente.`
          );
        } catch (error: any) {
          const msg = getErrorMessage(
            error,
            "No se pudo eliminar el servicio."
          );

          console.warn("Error al eliminar servicio:", error);
          showWarning(msg);

          await refreshServices();
        } finally {
          stopLoading();
        }
      }
    );
  };

  return {
    services,
    loading,
    tableLoading,

    page,
    limit,
    total,
    totalPages,
    search,
    setPage,
    setLimit,
    setSearch,

    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    isViewModalOpen,
    editingService,
    viewingService,
    setEditingService,
    setViewingService,

    handleCreateService,
    handleEditService,
    handleDeleteService,
    refreshServices,
  };
};