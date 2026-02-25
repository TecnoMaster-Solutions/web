"use client";

import { useEffect, useRef, useState } from "react";
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

const TECH_TYPE_MAP: Record<string, number> = {
  "Cableado estructurado": 1,
  Electricista: 2,
  Redes: 3,
};

const normalizeTypeName = (name: string) => name.trim().toLowerCase();

const validateTechnician = (data: MinimalTechForValidate) => {
  if (!data.name.trim()) return toast.warning("El nombre es obligatorio"), false;
  if (!data.lastName.trim()) return toast.warning("El apellido es obligatorio"), false;
  if (!data.documentType) return toast.warning("El tipo de documento es obligatorio"), false;
  if (!data.documentNumber.trim()) return toast.warning("El número de documento es obligatorio"), false;
  if (!data.phone.trim()) return toast.warning("El teléfono es obligatorio"), false;
  if (!data.email.trim()) return toast.warning("El correo es obligatorio"), false;
  return true;
};

const MIN_LOADER_MS = 450;

export const useTechnicians = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [typeNameToId, setTypeNameToId] = useState<Record<string, number>>(
    Object.fromEntries(
      Object.entries(TECH_TYPE_MAP).map(([k, v]) => [normalizeTypeName(k), v])
    )
  );
  const [typeOptions, setTypeOptions] = useState<string[]>(
    Object.keys(TECH_TYPE_MAP)
  );

  const [loading, setLoading] = useState(false);
  const busyRef = useRef(0);
  const startRef = useRef<number | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const isEditModalOpen = editingTechnician !== null;

  const startLoading = () => {
    busyRef.current += 1;
    if (busyRef.current === 1) {
      startRef.current = Date.now();
      setLoading(true);
    }
  };

  const stopLoading = async () => {
    busyRef.current = Math.max(0, busyRef.current - 1);
    if (busyRef.current > 0) return;

    const start = startRef.current ?? Date.now();
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, MIN_LOADER_MS - elapsed);

    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

    startRef.current = null;
    setLoading(false);
  };

  const withLoading = async <T,>(fn: () => Promise<T>) => {
    startLoading();
    try {
      return await fn();
    } finally {
      await stopLoading();
    }
  };

  const loadTechnicians = async () => {
    await withLoading(async () => {
      try {
        const list = await getTechniciansApi();
        setTechnicians(list);
      } catch (error) {
        console.error(error);
        toast.error("No se pudieron cargar los técnicos.");
      }
    });
  };

  const loadTechnicianTypes = async () => {
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
  };

  const mapTechTypesToIds = (types: string[]) =>
    (types ?? [])
      .map((name) => typeNameToId[normalizeTypeName(name)])
      .filter((id): id is number => typeof id === "number");

  useEffect(() => {
    loadTechnicians();
    loadTechnicianTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    ) return;

    try {
      await withLoading(async () => {
        const imageUrl = rest.image ? await uploadImageToCloudinary(rest.image) : undefined;
        const resumeUrl = resumePdf ? await uploadPdfToCloudinary(resumePdf) : undefined;

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

        const list = await getTechniciansApi();
        setTechnicians(list);

        setIsCreateModalOpen(false);
        toast.success("Técnico creado exitosamente");
      });
    } catch (error) {
      console.error(error);
      const apiMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "";
      toast.error(
        apiMessage
          ? `No se pudo crear el técnico: ${apiMessage}`
          : "No se pudo crear el técnico. Intenta nuevamente."
      );
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
    ) return;

    const existing = technicians.find((t) => t.id === id);
    if (!existing) return toast.error("No se encontró el técnico en la lista local.");

    try {
      await withLoading(async () => {
        const imageUrl = rest.image ? await uploadImageToCloudinary(rest.image) : existing.image;
        const resumeUrl = resumePdf ? await uploadPdfToCloudinary(resumePdf) : existing.resumeUrl;

        const techniciantypeids = rest.types ? mapTechTypesToIds(rest.types) : undefined;
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
        if (techniciantypeids && techniciantypeids.length > 0) body.techniciantypeids = techniciantypeids;

        await updateTechnicianApi(id, body);

        const list = await getTechniciansApi();
        setTechnicians(list);

        setEditingTechnician(null);
        toast.success("Técnico actualizado correctamente");
      });
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el técnico. Intenta nuevamente.");
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
      await withLoading(async () => {
        try {
          await deleteTechnicianApi(tech.id);

          const list = await getTechniciansApi();
          setTechnicians(list);

          toast.success(
            `El técnico "${tech.name} ${tech.lastName}" ha sido eliminado correctamente.`
          );
        } catch (error: any) {
          console.warn("Error al eliminar técnico:", error);

          const apiMessage =
            error?.response?.data?.message ??
            error?.message ??
            "";

          toast.warning(
            apiMessage ||
              "No se pudo eliminar el técnico. Intenta nuevamente."
          );
        }
      });
    }
  );
};

  return {
    technicians,
    typeOptions,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    editingTechnician,
    setEditingTechnician,
    handleCreateTechnician,
    handleEditTechnician,
    handleDeleteTechnician,
    loading,
  };
};
