"use client";

import { useEffect, useRef, useState } from "react";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  CreateClientPayload,
  UpdateClientPayload,
} from "../api/clients.api";

import {
  Client,
  CreateClientData,
  EditClientData,
  ClientFormErrors,
  ClientFormTouched,
} from "../types/typeClients";

import { showSuccess, showError } from "@/shared/utils/notifications";

const MIN_LOADER_MS = 450;

// ── Mapa de estados
const stateMap: Record<string, number> = {
  Activo: 1,
  Inactivo: 2,
};

// ── Validaciones exhaustivas ─────────────────────────────────────────────────

const ONLY_LETTERS = /^[A-Za-záéíóúÁÉÍÓÚñÑ\s'-]+$/;
const ONLY_NUMBERS = /^\d+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateClientData(
  data: CreateClientData | EditClientData
): ClientFormErrors {
  const errors: ClientFormErrors = {};

  if (!data.tipo || data.tipo === 0) {
    errors.tipo = "Seleccione tipo de documento";
  }

  if (!data.documento?.trim()) {
    errors.documento = "Documento obligatorio";
  } else if (!ONLY_NUMBERS.test(data.documento.trim())) {
    errors.documento = "El documento solo puede contener números";
  } else if (data.documento.trim().length < 5) {
    errors.documento = "El documento debe tener al menos 5 dígitos";
  }

  if (!data.nombre?.trim()) {
    errors.nombre = "Nombre obligatorio";
  } else if (!ONLY_LETTERS.test(data.nombre.trim())) {
    errors.nombre = "El nombre solo puede contener letras";
  }

  if (!data.apellido?.trim()) {
    errors.apellido = "Apellido obligatorio";
  } else if (!ONLY_LETTERS.test(data.apellido.trim())) {
    errors.apellido = "El apellido solo puede contener letras";
  }

  if (!data.telefono?.trim()) {
    errors.telefono = "Teléfono obligatorio";
  } else if (!ONLY_NUMBERS.test(data.telefono.trim())) {
    errors.telefono = "El teléfono solo puede contener números";
  } else if (data.telefono.trim().length < 7) {
    errors.telefono = "El teléfono debe tener al menos 7 dígitos";
  }

  if (!data.correoElectronico?.trim()) {
    errors.correoElectronico = "Correo obligatorio";
  } else if (!EMAIL_RE.test(data.correoElectronico.trim())) {
    errors.correoElectronico = "Formato de correo inválido";
  }

  if (!data.ciudad?.trim()) {
    errors.ciudad = "Ciudad obligatoria";
  } else if (!ONLY_LETTERS.test(data.ciudad.trim())) {
    errors.ciudad = "La ciudad solo puede contener letras";
  }

  if (!data.codigoPostal?.trim()) {
    errors.codigoPostal = "Código postal obligatorio";
  } else if (!ONLY_NUMBERS.test(data.codigoPostal.trim())) {
    errors.codigoPostal = "El código postal solo puede contener números";
  }

  return errors;
}

// =====================================================
// MAIN HOOK
// =====================================================

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const busyRef = useRef(false);
  const startRef = useRef(0);

  const startLoading = () => {
    busyRef.current = true;
    startRef.current = Date.now();
    setLoading(true);
  };

  const stopLoading = () => {
    const elapsed = Date.now() - startRef.current;
    const remaining = MIN_LOADER_MS - elapsed;

    if (remaining > 0) {
      setTimeout(() => {
        busyRef.current = false;
        setLoading(false);
      }, remaining);
    } else {
      busyRef.current = false;
      setLoading(false);
    }
  };

  const withLoading = async (fn: () => Promise<void>) => {
    if (busyRef.current) return;
    startLoading();
    try {
      await fn();
    } catch (error: any) {
      console.error("Hook Error:", error);
      const msg = error.response?.data?.message || "Ocurrió un error inesperado.";
      showError(Array.isArray(msg) ? msg[0] : msg);
      throw error; // Re-lanzar para que el flujo externo sepa que falló
    } finally {
      stopLoading();
    }
  };

  const loadClients = async () => {
    const data = await getClients();
    // Mapear tipoId desde el ClientUI (ya incluido en clients.api.ts)
    const mapped: Client[] = data.map((c) => ({
      ...c,
      tipoId: (c as Client & { tipoId?: number }).tipoId ?? 0,
    }));
    setClients(mapped);
  };

  useEffect(() => {
    withLoading(loadClients);
  }, []);

  // ── CREATE CLIENT ──────────────────────────────────────────────────────────
  const handleCreateClient = async (form: CreateClientData) => {
    const payload: CreateClientPayload = {
      name: form.nombre.trim(),
      lastname: form.apellido.trim(),
      email: form.correoElectronico.trim(),
      documentnumber: form.documento.trim(),
      phone: form.telefono.replace(/\D/g, ""), // ← solo dígitos para evitar 400 por regex
      typeid: Number(form.tipo),
      customercity: form.ciudad.trim(),
      customerzipcode: form.codigoPostal.trim(),
      image: "", // imagen vacía por defecto (campo requerido por backend)
    };

    await withLoading(async () => {
      await createClient(payload);
      showSuccess("Cliente creado exitosamente.");
    });

    await loadClients();
  };

  // ── EDIT CLIENT ────────────────────────────────────────────────────────────
  const handleEditClient = async (form: EditClientData) => {
    const payload: UpdateClientPayload = {
      name: form.nombre.trim(),
      lastname: form.apellido.trim(),
      email: form.correoElectronico.trim(),
      documentnumber: form.documento.trim(),
      phone: form.telefono.trim(),
      typeid: Number(form.tipo),
      stateid: stateMap[form.estado] ?? 1,
      customercity: form.ciudad.trim(),
      customerzipcode: form.codigoPostal.trim(),
    };

    await withLoading(async () => {
      await updateClient(form.id, payload);
      showSuccess("Cliente actualizado correctamente.");
    });

    await loadClients();
  };

  // ── DELETE CLIENT ──────────────────────────────────────────────────────────
  const handleDeleteClient = async (id: number) => {
    let deleted = false;

    await withLoading(async () => {
      try {
        await deleteClient(id);
        deleted = true;
        showSuccess("Cliente eliminado correctamente.");
      } catch (err: unknown) {
        // Extraer detalles del error de Axios
        const axiosErr = err as {
          response?: { status?: number; data?: { message?: string | string[] } };
        };
        const status = axiosErr?.response?.status;
        const rawMsg = axiosErr?.response?.data?.message;
        const message = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;

        if (status === 409) {
          showError(
            message ||
            "No se puede eliminar el cliente porque tiene ventas activas."
          );
        } else if (status === 404) {
          showError("El cliente no fue encontrado.");
        } else {
          showError("Error al eliminar el cliente.");
        }
        // NO re-lanzamos → withLoading termina limpiamente sin propagar
      }
    });

    // Solo recargar si realmente se borró
    if (deleted) {
      await loadClients();
    }
  };

  return {
    clients,
    loading,
    handleCreateClient,
    handleEditClient,
    handleDeleteClient,
  };
}

// =====================================================
// CREATE CLIENT FORM HOOK
// =====================================================

interface UseCreateClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateClientData) => Promise<void>;
}

export function useCreateClientForm({
  isOpen,
  onClose,
  onSave,
}: UseCreateClientFormProps) {
  const initialState: CreateClientData = {
    tipo: 0,
    documento: "",
    nombre: "",
    apellido: "",
    telefono: "",
    correoElectronico: "",
    ciudad: "",
    codigoPostal: "",
    estado: "",
  };

  const [formData, setFormData] = useState<CreateClientData>(initialState);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [touched, setTouched] = useState<ClientFormTouched>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialState);
      setErrors({});
      setTouched({});
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "tipo" ? Number(value) : value,
    }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    // Validar solo ese campo al terminar de llenar
    const allErrors = validateClientData(formData);
    setErrors((prev) => ({ ...prev, [name]: allErrors[name as keyof ClientFormErrors] ?? "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateClientData(formData);
    setErrors(validationErrors);

    // Marcar todos como tocados para mostrar errores
    const allTouched: ClientFormTouched = {};
    (Object.keys(formData) as Array<keyof CreateClientData>).forEach(
      (k) => (allTouched[k] = true)
    );
    setTouched(allTouched);

    if (Object.keys(validationErrors).length > 0) return;

    await onSave(formData);
    onClose();
  };

  return {
    formData,
    setFormData,
    errors,
    touched,
    handleInputChange,
    handleBlur,
    handleSubmit,
  };
}

// =====================================================
// EDIT CLIENT FORM HOOK
// =====================================================

interface UseEditClientFormProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (data: EditClientData) => Promise<void>;
}

export function useEditClientForm({
  isOpen,
  client,
  onClose,
  onSave,
}: UseEditClientFormProps) {
  const [formData, setFormData] = useState<EditClientData | null>(null);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [touched, setTouched] = useState<ClientFormTouched>({});

  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        id: client.id,
        nombre: client.nombre,
        apellido: client.apellido,
        // Usar tipoId (número) para que el select quede preseleccionado
        tipo: client.tipoId || 0,
        documento: client.documento,
        telefono: client.telefono,
        correoElectronico: client.correoElectronico,
        estado: client.estado,
        ciudad: client.ciudad,
        codigoPostal: client.codigoPostal,
      });

      setErrors({});
      setTouched({});
    }
  }, [isOpen, client]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "tipo" ? Number(value) : value,
    });
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (formData) {
      const allErrors = validateClientData(formData);
      setErrors((prev) => ({ ...prev, [name]: allErrors[name as keyof ClientFormErrors] ?? "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const validationErrors = validateClientData(formData);
    setErrors(validationErrors);

    const allTouched: ClientFormTouched = {};
    (Object.keys(formData) as Array<keyof EditClientData>).forEach(
      (k) => (allTouched[k as keyof ClientFormTouched] = true)
    );
    setTouched(allTouched);

    if (Object.keys(validationErrors).length > 0) return;

    await onSave(formData);
    onClose();
  };

  return {
    formData,
    setFormData,
    errors,
    touched,
    handleInputChange,
    handleBlur,
    handleSubmit,
  };
}