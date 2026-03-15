"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Technician,
  CreateTechnicianData,
  EditTechnicianData,
} from "../types/typesTechnicians";
import { toast } from "react-toastify";
import { confirmDelete } from "@/shared/utils/Delete/confirmDelete";
import {
  uploadImageToCloudinary,
  uploadPdfToCloudinary,
} from "@/shared/utils/cloudinary";
import {
  getTechnicians as getTechniciansApi,
  getTechnicianTypes,
  createTechnician as createTechnicianApi,
  updateTechnician as updateTechnicianApi,
  deleteTechnician as deleteTechnicianApi,
  CreateTechnicianPayload,
  UpdateTechnicianPayload,
} from "../api/technicians.api";

type MinimalTechForValidate = Pick<
  Technician,
  "name" | "lastName" | "documentType" | "documentNumber" | "phone" | "email"
>;

type ApiErrorShape = {
  response?: { data?: { message?: string } };
  message?: string;
  name?: string;
  code?: string;
};

const TECH_TYPE_MAP: Record<string, number> = {
  "Cableado estructurado": 1,
  Electricista: 2,
  Redes: 3,
};

const normalizeTypeName = (name: string) => name.trim().toLowerCase();

const getApiErrorMessage = (error: unknown) => {
  const apiError = error as ApiErrorShape | null;
  return apiError?.response?.data?.message ?? apiError?.message ?? "";
};

const isCanceledError = (error: unknown) => {
  const apiError = error as ApiErrorShape | null;
  return (
    apiError?.name === "AbortError" ||
    apiError?.code === "ERR_CANCELED" ||
    apiError?.name === "CanceledError"
  );
};

const validateTechnician = (data: MinimalTechForValidate) => {
  if (!data.name.trim()) return toast.warning("El nombre es obligatorio"), false;
  if (!data.lastName.trim()) return toast.warning("El apellido es obligatorio"), false;
  if (!data.documentType) return toast.warning("El tipo de documento es obligatorio"), false;
  if (!data.documentNumber.trim()) return toast.warning("El número de documento es obligatorio"), false;
  if (!data.phone.trim()) return toast.warning("El teléfono es obligatorio"), false;
  if (!data.email.trim()) return toast.warning("El correo es obligatorio"), false;
  return true;
};

export const useTechnicians = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [typeNameToId, setTypeNameToId] = useState<Record<string, number>>(
    Object.fromEntries(
      Object.entries(TECH_TYPE_MAP).map(([k, v]) => [normalizeTypeName(k), v])
    )
  );
  const [typeOptions, setTypeOptions] = useState<string[]>(Object.keys(TECH_TYPE_MAP));

  const [loadingCount, setLoadingCount] = useState(0);
  const loading = loadingCount > 0;
  const startLoading = () => setLoadingCount((c) => c + 1);
  const stopLoading = () => setLoadingCount((c) => Math.max(0, c - 1));

  const [tableLoading, setTableLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(4);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [viewingTechnician, setViewingTechnician] = useState<Technician | null>(null);

  const isEditModalOpen = useMemo(() => editingTechnician !== null, [editingTechnician]);
  const isViewModalOpen = useMemo(() => viewingTechnician !== null, [viewingTechnician]);

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

  const loadTechnicians = useCallback(
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
        const response = await getTechniciansApi({
          page: customPage,
          limit: customLimit,
          search: customSearch,
          signal: controller.signal,
        });

        setTechnicians(response.data);
        setTotal(Number(response.meta.total ?? 0));
        setTotalPages(Number(response.meta.totalPages ?? 1));
        await waitForRender();
      } catch (error: unknown) {
        if (!isCanceledError(error)) {
          console.error(error);
          toast.error("No se pudieron cargar los técnicos.");
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

  const loadTechnicianTypes = useCallback(async () => {
    try {
      const types = await getTechnicianTypes();
      if (types.length > 0) {
        setTypeNameToId(
          Object.fromEntries(
            types.map((t) => [normalizeTypeName(t.name), t.techniciantypeid])
          )
        );
        setTypeOptions(types.map((t) => t.name));
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const mapTechTypesToIds = (types: string[]) =>
    (types ?? [])
      .map((name) => typeNameToId[normalizeTypeName(name)])
      .filter((id): id is number => typeof id === "number");

  useEffect(() => {
    loadTechnicians(page, limit, debouncedSearch);
    loadTechnicianTypes();

    return () => {
      abortRef.current?.abort();
    };
  }, [page, limit, debouncedSearch, loadTechnicians, loadTechnicianTypes]);

  const refreshTechnicians = useCallback(async () => {
    await loadTechnicians(page, limit, debouncedSearch);
    return 200 as const;
  }, [loadTechnicians, page, limit, debouncedSearch]);

  const handleCreateTechnician = async (data: CreateTechnicianData) => {
    const { resumePdf, typeid, ...rest } = data;

    if (
      !validateTechnician({
        name: rest.name,
        lastName: rest.lastName,
        documentType: rest.documentType,
        documentNumber: rest.documentNumber,
        phone: rest.phone,
        email: rest.email,
      })
    ) {
      return;
    }

    try {
      startLoading();

      const imageUrl = rest.image
        ? await uploadImageToCloudinary(rest.image)
        : undefined;
      const resumeUrl = resumePdf
        ? await uploadPdfToCloudinary(resumePdf)
        : undefined;

      const techniciantypeids = mapTechTypesToIds(rest.types);

      const payload: CreateTechnicianPayload = {
        name: rest.name,
        lastname: rest.lastName,
        email: rest.email,
        documentnumber: rest.documentNumber,
        phone: rest.phone,
        techniciantypeids,
        CV: resumeUrl ?? null,
        image: imageUrl ?? null,
        typeid: typeid,
      };

      await createTechnicianApi(payload);
      await refreshTechnicians();

      setIsCreateModalOpen(false);
      toast.success("Técnico creado exitosamente");
    } catch (error) {
      console.error(error);
      const apiMessage = getApiErrorMessage(error);
      toast.error(
        apiMessage
          ? `No se pudo crear el técnico: ${apiMessage}`
          : "No se pudo crear el técnico. Intenta nuevamente."
      );
    } finally {
      stopLoading();
    }
  };

  const handleEditTechnician = async (id: number, data: EditTechnicianData) => {
    const { resumePdf, ...rest } = data;

    if (
      !validateTechnician({
        name: rest.name,
        lastName: rest.lastName,
        documentType: rest.documentType,
        documentNumber: rest.documentNumber,
        phone: rest.phone,
        email: rest.email,
      })
    ) {
      return;
    }

    const existing = technicians.find((t) => t.id === id);
    if (!existing) {
      toast.error("No se encontró el técnico en la lista local.");
      return;
    }

    try {
      startLoading();

      const imageUrl = rest.image
        ? await uploadImageToCloudinary(rest.image)
        : existing.image;
      const resumeUrl = resumePdf
        ? await uploadPdfToCloudinary(resumePdf)
        : existing.resumeUrl;

      const techniciantypeids = rest.types
        ? mapTechTypesToIds(rest.types)
        : undefined;
      const stateid = rest.state === "Inactivo" ? 2 : 1;

      const body: UpdateTechnicianPayload = {
        name: rest.name,
        lastname: rest.lastName,
        documentnumber: rest.documentNumber,
        phone: rest.phone,
        stateid,
        typeid: rest.typeid,
      };

      if (rest.email !== existing.email) body.email = rest.email;
      if (imageUrl && imageUrl !== existing.image) body.image = imageUrl;
      if (resumeUrl && resumeUrl !== existing.resumeUrl) body.CV = resumeUrl;
      if (techniciantypeids && techniciantypeids.length > 0) {
        body.techniciantypeids = techniciantypeids;
      }

      await updateTechnicianApi(id, body);
      await refreshTechnicians();

      setEditingTechnician(null);
      toast.success("Técnico actualizado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el técnico. Intenta nuevamente.");
    } finally {
      stopLoading();
    }
  };

  const handleDeleteTechnician = async (tech: Technician): Promise<boolean> => {
    return confirmDelete(
      {
        itemName: `${tech.name} ${tech.lastName}`,
        itemType: "técnico",
        successMessage: `El técnico "${tech.name} ${tech.lastName}" ha sido eliminado correctamente.`,
        errorMessage: "No se pudo eliminar el técnico. Intenta nuevamente.",
        skipSuccessToast: true,
      },
      async () => {
        startLoading();
        try {
          await deleteTechnicianApi(tech.id);
          await refreshTechnicians();

          toast.success(
            `El técnico "${tech.name} ${tech.lastName}" ha sido eliminado correctamente.`
          );
        } catch (error: unknown) {
          console.warn("Error al eliminar técnico:", error);

          const apiMessage = getApiErrorMessage(error);

          toast.warning(
            apiMessage || "No se pudo eliminar el técnico. Intenta nuevamente."
          );
        } finally {
          stopLoading();
        }
      }
    );
  };

  return {
    technicians,
    typeOptions,

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
    editingTechnician,
    viewingTechnician,
    setEditingTechnician,
    setViewingTechnician,

    handleCreateTechnician,
    handleEditTechnician,
    handleDeleteTechnician,
    refreshTechnicians,
  };
};
