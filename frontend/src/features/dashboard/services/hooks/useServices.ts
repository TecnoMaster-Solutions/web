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

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const isEditModalOpen = useMemo(
    () => editingService !== null,
    [editingService]
  );
  const isViewModalOpen = useMemo(
    () => viewingService !== null,
    [viewingService]
  );

  const waitForRender = useCallback(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }, []);

  const applyServicesResponse = useCallback(
    async (list: Service[]) => {
      const sorted = [...list].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "es", {
          sensitivity: "base",
        })
      );
      setServices(sorted);
      await waitForRender();
    },
    [waitForRender]
  );

  const refreshServices = useCallback(async () => {
    const list = await fetchServices({ page: 1, limit: 100 });
    await applyServicesResponse(list);
    return 200;
  }, [applyServicesResponse]);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const status = await refreshServices();
        if (status !== 200)
          throw new Error(`Refresh servicios devolvió ${status}`);
      } catch (error) {
        console.error("Error al cargar servicios:", error);
        showWarning("Error al cargar servicios desde el servidor");
      } finally {
        setLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      load();
    }
  }, [refreshServices]);

  const requireImageUrl = async (image: string | File | null) => {
    const val = image;
    if (!val) throw new Error("Debe agregar una imagen para el servicio.");
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed)
        throw new Error("Debe agregar una imagen para el servicio.");
      return trimmed;
    }
    const url = await uploadImageToCloudinary(val);
    if (!url?.trim())
      throw new Error("No se pudo subir la imagen a Cloudinary.");
    return url.trim();
  };

  const handleCreateService = async (payload: CreateServicePayload) => {
    setLoading(true);
    try {
      setIsCreateModalOpen(false);

      if (!payload.name?.trim())
        throw new Error("El nombre del servicio es obligatorio.");
      if (!payload.typeofserviceid)
        throw new Error("Debe seleccionar un tipo de servicio.");

      const imageUrl = await requireImageUrl(payload.image);

      await createService({
        name: payload.name.trim(),
        description: (payload.description ?? "").trim(),
        image: imageUrl,
        typeofserviceid: payload.typeofserviceid,
      });

      const status = await refreshServices();
      if (status !== 200)
        throw new Error(`Refresh servicios devolvió ${status}`);

      showSuccess("Servicio creado exitosamente");
      await waitForRender();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Error al crear servicio";
      console.error(error);
      showWarning(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = async (id: number, payload: EditServicePayload) => {
    setLoading(true);
    try {
      if (!id) return;

      if (!payload.name?.trim())
        throw new Error("El nombre del servicio es obligatorio.");
      if (!payload.typeofserviceid)
        throw new Error("Debe seleccionar un tipo de servicio.");
      if (![1, 2].includes(payload.stateid))
        throw new Error("Estado inválido.");

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
        if (!trimmed)
          throw new Error("No se puede guardar un servicio sin imagen.");
        body.image = trimmed;
      } else if (payload.image === null) {
        throw new Error("No se puede guardar un servicio sin imagen.");
      }

      await updateService(id, body);

      const status = await refreshServices();
      if (status !== 200)
        throw new Error(`Refresh servicios devolvió ${status}`);

      showSuccess("Servicio actualizado exitosamente");
      await waitForRender();
      setEditingService(null);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Error al actualizar servicio";
      console.error(error);
      showWarning(msg);
    } finally {
      setLoading(false);
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
        setLoading(true);
        try {
          await deleteService(service.id);

          const status = await refreshServices();
          if (status !== 200)
            throw new Error(`Refresh servicios devolvió ${status}`);

          await waitForRender();

          showSuccess(
            `El servicio "${service.name}" ha sido eliminado correctamente.`
          );
        } catch (error: any) {
          const msg =
            error?.response?.data?.message ??
            error?.message ??
            "No se pudo eliminar el servicio.";

          console.warn("Error al eliminar servicio:", error);

          showWarning(msg);

          await refreshServices();
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return {
    services,
    loading,
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
